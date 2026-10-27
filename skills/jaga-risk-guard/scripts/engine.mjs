// Vendored verbatim from https://github.com/PugarHuda/jaga-agent (MIT) so this skill stays
// self-contained: no dependencies, no network, no build step.
// Jaga risk engine — pure, deterministic, unit-tested. No LLM in this file, ever.
//
// snapshot: { positions: [{asset, qty, price, usd}], quote, quoteFree, total }
// rules:    { quote, stopLossPct, trailingStopPct?, takeProfitPct?, maxPositionPct,
//             maxDrawdownPct, minTradeUsd, volatility?: {window, dropPct}, mode,
//             assets?: { BTC: { stopLossPct: 10, ... } },  ← per-asset overrides
//             maxExposurePct?: 80,     ← cap on total non-quote exposure
//             maxDailyLossPct?: 5 }    ← cap on loss since 00:00 UTC (prop-desk style)
//           volatility.window counts ticks; volatility.windowSec measures seconds (tick-rate independent)
// state:    { peak, entries: {ASSET: {entry, high, qty}}, history: {ASSET: [{p: price, t: ms},...]},
//             day: {date, start},    ← equity at the start of the current UTC day
//             lastQuote, lastPos: {ASSET: {qty, price}} }  ← to tell deposits/withdrawals from market moves
//           entry is a running cost basis: when the position grows, the new lot is
//           averaged in at its price; trims keep the basis.
//
// Returns { violations, actions, state, headroom }. headroom = every rule's current
// reading vs its limit (pct = how close to tripping), sorted hottest first — the
// deterministic answer to "what's closest to tripping", no LLM needed.
// The book (entry/history) is reset by whoever confirms a fill, not here: a proposed
// or failed sell must keep its cost basis, or the next tick would re-enter at the
// crashed price and the breach would silently disappear.
// Actions are SELL-to-quote orders only —
// Jaga never buys, never withdraws, never widens exposure.

export function freshState() {
  return { peak: 0, entries: {}, history: {}, day: null, lastQuote: null, lastPos: null };
}

export function evaluate(snapshot, rules, state) {
  const today = new Date(snapshot.ts ?? Date.now()).toISOString().slice(0, 10);
  const exposureNow = snapshot.positions.reduce((t, p) => t + p.usd, 0);
  // Deposits and withdrawals are not market moves. Market moves change prices,
  // not quantities; trades change quantities and the quote balance by the same
  // value (minus fees). What's left — quote change + value of quantity changes —
  // is money entering or leaving the account: rebase peak and the day baseline
  // by it, so a withdrawal never reads as a drawdown and a deposit never sets a
  // fake peak. Coin deposits/withdrawals are caught the same way.
  let flow = 0;
  const held = [...snapshot.positions, ...(snapshot.unpriced ?? [])];
  const posNow = Object.fromEntries(held.map((p) => [p.asset, { qty: p.qty, price: p.price }]));
  if (state.lastPos && state.lastQuote != null) {
    let tradeValue = 0;
    for (const a of new Set([...Object.keys(posNow), ...Object.keys(state.lastPos)])) {
      const now = posNow[a], prev = state.lastPos[a];
      tradeValue += ((now?.qty ?? 0) - (prev?.qty ?? 0)) * (now?.price ?? prev?.price ?? 0);
    }
    const unexplained = (snapshot.quoteFree ?? 0) - state.lastQuote + tradeValue;
    const lastTotal = state.lastQuote + Object.values(state.lastPos).reduce((t, p) => t + p.qty * p.price, 0);
    if (Math.abs(unexplained) > Math.max(1, lastTotal * 0.01)) flow = unexplained;
  }
  const peakBase = (state.peak ?? 0) + flow;
  const s = {
    peak: Math.max(peakBase, snapshot.total),
    entries: { ...state.entries },
    history: { ...state.history },
    day: state.day?.date === today ? { ...state.day, start: state.day.start + flow } : { date: today, start: snapshot.total }, // new UTC day → new baseline
    lastQuote: snapshot.quoteFree ?? 0,
    lastPos: posNow,
    flow,
  };
  const violations = [];
  const headroom = [];
  const gauge = (rule, asset, value, limit) => {
    if (limit) headroom.push({ rule, asset, value: Math.round(value * 100) / 100, limit, pct: Math.round(Math.max(0, (value / limit) * 100)) });
  };
  const sells = {}; // asset -> { usd, full, qty }
  const window = rules.volatility?.window ?? 5;
  const qtyOf = Object.fromEntries(snapshot.positions.map((p) => [p.asset, p.qty]));

  const addSell = (asset, usd, full) => {
    const cur = sells[asset] ?? { usd: 0, full: false };
    sells[asset] = { usd: Math.max(cur.usd, usd), full: cur.full || full, qty: qtyOf[asset] };
  };

  for (const p of snapshot.positions) {
    const R = rules.assets?.[p.asset] ? { ...rules, ...rules.assets[p.asset] } : rules; // per-asset overrides
    if (p.usd < R.minTradeUsd) continue; // dust — not worth guarding or spamming about

    // book-keeping: cost-basis entry, high-water mark, rolling price window
    const prev = s.entries[p.asset];
    if (!prev) s.entries[p.asset] = { entry: p.price, high: p.price, qty: p.qty };
    else {
      const grew = prev.qty > 0 && p.qty > prev.qty * 1.005; // new lot bought (by anyone) → average it in
      const entry = grew ? (prev.entry * prev.qty + p.price * (p.qty - prev.qty)) / p.qty : prev.entry;
      s.entries[p.asset] = { entry, high: Math.max(prev.high, p.price, grew ? entry : 0), qty: p.qty };
    }
    const now = snapshot.ts ?? Date.now();
    const raw = (s.history[p.asset] ?? []).map((h) => (typeof h === "number" ? { p: h, t: now } : h)); // pre-2.2 state stored bare prices
    const kept = R.volatility?.windowSec ? raw.filter((h) => now - h.t <= R.volatility.windowSec * 1000) : raw.slice(-(window - 1));
    const hist = [...kept, { p: p.price, t: now }];
    s.history[p.asset] = hist;

    const { entry, high } = s.entries[p.asset];
    const fromEntryPct = ((p.price - entry) / entry) * 100;
    const fromHighPct = ((high - p.price) / high) * 100;
    gauge("stop-loss", p.asset, -fromEntryPct, R.stopLossPct);
    if (R.trailingStopPct && high > entry) gauge("trailing-stop", p.asset, fromHighPct, R.trailingStopPct);
    gauge("take-profit", p.asset, fromEntryPct, R.takeProfitPct);
    gauge("max-position", p.asset, (p.usd / snapshot.total) * 100, R.maxPositionPct);

    // 1. hard stop-loss from entry
    if (-fromEntryPct >= R.stopLossPct) {
      violations.push({
        rule: "stop-loss",
        asset: p.asset,
        severity: "high",
        detail: `${p.asset} down ${(-fromEntryPct).toFixed(1)}% from entry ${entry.toFixed(2)} (limit ${R.stopLossPct}%)`,
      });
      addSell(p.asset, p.usd, true);
    }

    // 2. trailing stop from high-water mark (locks in gains a fixed stop can't)
    if (R.trailingStopPct && fromHighPct >= R.trailingStopPct && high > entry) {
      violations.push({
        rule: "trailing-stop",
        asset: p.asset,
        severity: "high",
        detail: `${p.asset} down ${fromHighPct.toFixed(1)}% from high ${high.toFixed(2)} (trail ${R.trailingStopPct}%)`,
      });
      addSell(p.asset, p.usd, true);
    }

    // 3. take-profit: realize gains past target
    if (R.takeProfitPct && fromEntryPct >= R.takeProfitPct) {
      violations.push({
        rule: "take-profit",
        asset: p.asset,
        severity: "info",
        detail: `${p.asset} up ${fromEntryPct.toFixed(1)}% from entry ${entry.toFixed(2)} (target ${R.takeProfitPct}%) — locking in`,
      });
      addSell(p.asset, p.usd, true);
    }

    // 4. concentration limit: trim, don't liquidate
    const pct = (p.usd / snapshot.total) * 100;
    const excess = p.usd - (snapshot.total * R.maxPositionPct) / 100;
    if (pct > R.maxPositionPct && excess >= R.minTradeUsd) {
      // only report what we'd actually act on — a dust excess is noise, not risk
      violations.push({
        rule: "max-position",
        asset: p.asset,
        severity: "medium",
        detail: `${p.asset} is ${pct.toFixed(1)}% of portfolio (limit ${R.maxPositionPct}%)`,
      });
      addSell(p.asset, excess, false);
    }

    // 5. volatility circuit breaker: flash-crash inside the rolling window
    if (R.volatility && hist.length >= 2) {
      // from the window's HIGH, not its first sample: a spike then a crash back through
      // it is exactly the flash crash this rule exists for, and with windowSec the
      // oldest sample keeps ageing out from under a first-sample comparison
      const windowHigh = Math.max(...hist.map((h) => h.p));
      const windowDropPct = ((windowHigh - p.price) / windowHigh) * 100;
      gauge("circuit-breaker", p.asset, windowDropPct, R.volatility.dropPct);
      if (windowDropPct >= R.volatility.dropPct) {
        violations.push({
          rule: "circuit-breaker",
          asset: p.asset,
          severity: "high",
          detail: `${p.asset} crashed ${windowDropPct.toFixed(1)}% from ${windowHigh.toFixed(2)} within ${R.volatility.windowSec ? `${Math.round((now - hist[0].t) / 1000)}s` : `${hist.length} ticks`} (limit ${R.volatility.dropPct}%)`,
        });
        addSell(p.asset, p.usd, true);
      }
    }
  }

  // book-keeping: an asset that left the wallet (sold elsewhere, dusted) loses its
  // cost basis — a later re-buy starts fresh instead of inheriting a stale entry.
  // Assets that are merely unpriced this tick keep theirs.
  const present = new Set([...snapshot.positions, ...(snapshot.unpriced ?? [])].map((p) => p.asset));
  for (const k of Object.keys(s.entries)) {
    if (!present.has(k)) {
      delete s.entries[k];
      delete s.history[k];
    }
  }

  // 6a. total exposure cap: too much of the book in non-quote assets → trim each position pro-rata
  const exposure = exposureNow;
  const exposurePct = snapshot.total > 0 ? (exposure / snapshot.total) * 100 : 0;
  gauge("max-exposure", "*", exposurePct, rules.maxExposurePct);
  if (rules.maxExposurePct && exposurePct > rules.maxExposurePct) {
    const excess = exposure - (snapshot.total * rules.maxExposurePct) / 100;
    if (excess >= rules.minTradeUsd) {
      violations.push({
        rule: "max-exposure",
        asset: "*",
        severity: "medium",
        detail: `${exposurePct.toFixed(1)}% of portfolio in non-${snapshot.quote} assets (limit ${rules.maxExposurePct}%) — trimming ${excess.toFixed(2)} pro-rata`,
      });
      for (const p of snapshot.positions) if (p.usd >= rules.minTradeUsd) addSell(p.asset, (excess * p.usd) / exposure, false);
    }
  }

  // 6b. daily loss limit: down N% since the start of the UTC day → de-risk everything (prop-desk rule)
  const sellable = snapshot.positions.some((p) => p.usd >= rules.minTradeUsd);
  const dayLossPct = s.day.start > 0 ? ((s.day.start - snapshot.total) / s.day.start) * 100 : 0;
  gauge("daily-loss", "*", dayLossPct, rules.maxDailyLossPct);
  if (rules.maxDailyLossPct && dayLossPct >= rules.maxDailyLossPct && sellable) {
    violations.push({
      rule: "daily-loss",
      asset: "*",
      severity: "critical",
      detail: `portfolio down ${dayLossPct.toFixed(1)}% since 00:00 UTC (start ${s.day.start.toFixed(2)}, limit ${rules.maxDailyLossPct}%) — de-risking everything for the day`,
    });
    for (const p of snapshot.positions) if (p.usd >= rules.minTradeUsd) addSell(p.asset, p.usd, true);
  }

  // 6. portfolio-level max drawdown: de-risk everything
  // only fires while there's something left to sell — once we're fully in quote,
  // repeating "still down from peak" every tick is noise, not protection
  const ddPct = s.peak > 0 ? ((s.peak - snapshot.total) / s.peak) * 100 : 0;
  gauge("max-drawdown", "*", ddPct, rules.maxDrawdownPct);
  if (ddPct >= rules.maxDrawdownPct && sellable) {
    violations.push({
      rule: "max-drawdown",
      asset: "*",
      severity: "critical",
      detail: `portfolio down ${ddPct.toFixed(1)}% from peak ${s.peak.toFixed(2)} (limit ${rules.maxDrawdownPct}%) — de-risking everything`,
    });
    for (const p of snapshot.positions) if (p.usd >= rules.minTradeUsd) addSell(p.asset, p.usd, true);
  }

  const actions = Object.entries(sells)
    .filter(([, x]) => x.usd >= rules.minTradeUsd)
    .map(([asset, x]) => ({
      side: "SELL",
      symbol: `${asset}${snapshot.quote}`,
      usd: Math.round(x.usd * 100) / 100,
      full: x.full,
      ...(x.full && x.qty ? { qty: x.qty } : {}), // full sells carry the exact base quantity → sized as a quantity order, never over-asks
    }));

  headroom.sort((a, b) => b.pct - a.pct);
  return { violations, actions, state: s, headroom };
}
