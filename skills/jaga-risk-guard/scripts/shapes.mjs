// Vendored verbatim from https://github.com/PugarHuda/jaga-agent (MIT) so this skill stays
// self-contained: no dependencies, no network, no build step.
// Normalizers for MCP tool results — the reason Jaga is server-agnostic.
// Different Binance MCP servers (official, community, paper) return balances
// and prices in different shapes; everything funnels through here.

export function toolResult(res) {
  if (res?.isError) throw new Error(`MCP tool error: ${(res.content ?? []).map((c) => c.text).join(" ").slice(0, 200)}`);
  if (res?.structuredContent) return res.structuredContent;
  const text = res?.content?.find((c) => c.type === "text")?.text ?? "{}";
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`non-JSON tool result: ${text.slice(0, 120)}`);
  }
}

// {balances:[{asset,free}]} | [{asset,free}] | {data:{balances}} | {BTC:0.1,...} → [{asset, free}]
// Only real ticker symbols get through: anything else (prompt-injection text smuggled
// into an asset name, say) is dropped before it can reach the LLM analyst or the UI.
const ASSET = /^[A-Z0-9]{2,12}$/;
const PAIR = /^[A-Z0-9]{4,24}$/;

export function parseBalances(x) {
  const src = x?.balances ?? x?.data?.balances ?? x?.data ?? x;
  if (Array.isArray(src)) {
    return src
      .map((b) => ({ asset: String(b.asset ?? b.coin ?? b.symbol ?? "").toUpperCase(), free: Number(b.free ?? b.available ?? b.balance ?? b.amount ?? 0) }))
      .filter((b) => ASSET.test(b.asset) && Number.isFinite(b.free));
  }
  if (src && typeof src === "object") {
    return Object.entries(src)
      .filter(([, v]) => typeof v === "number" || typeof v === "string")
      .map(([asset, v]) => ({ asset: asset.toUpperCase(), free: Number(v) }))
      .filter((b) => ASSET.test(b.asset) && Number.isFinite(b.free));
  }
  return [];
}

// {SYM:p} | {SYM:{price}} | [{symbol,price}] | {data:[...]} | {prices:{...}} → {SYM: number}
export function parsePrices(x) {
  const src = x?.prices ?? x?.data ?? x;
  const out = {};
  const key = (s) => String(s).replace("/", "").toUpperCase();
  const num = (v) => Number(typeof v === "object" && v !== null ? v.price ?? v.lastPrice ?? v.close ?? v.c : v);
  if (Array.isArray(src)) {
    for (const p of src) {
      const s = p.symbol ?? p.pair;
      const v = num(p);
      if (s && v > 0 && PAIR.test(key(s))) out[key(s)] = v;
    }
  } else if (src && typeof src === "object") {
    for (const [k, v] of Object.entries(src)) {
      const n = num(v);
      if (n > 0 && PAIR.test(key(k))) out[key(k)] = n;
    }
  }
  return out;
}

// A risk guardian with a silently-missing rule is worse than none: NaN compares
// false and the rule just never fires. Fail loud at startup instead.
export function validateConfig(cfg) {
  const errs = [];
  const r = cfg?.rules ?? {};
  const positive = (k, required) => {
    const v = r[k];
    if (v === undefined) {
      if (required) errs.push(`rules.${k} is required`);
    } else if (!(Number.isFinite(v) && v > 0)) errs.push(`rules.${k} must be a positive number`);
  };
  for (const k of ["stopLossPct", "maxPositionPct", "maxDrawdownPct", "minTradeUsd"]) positive(k, true);
  for (const k of ["trailingStopPct", "takeProfitPct", "maxExposurePct", "maxDailyLossPct", "maxTickJumpPct"]) positive(k, false);
  if (r.assets !== undefined && (typeof r.assets !== "object" || r.assets === null)) errs.push("rules.assets must be an object of per-asset overrides");
  if (r.volatility !== undefined) {
    if (r.volatility?.windowSec !== undefined) {
      if (!(Number.isFinite(r.volatility.windowSec) && r.volatility.windowSec > 0)) errs.push("rules.volatility.windowSec must be a positive number of seconds");
    } else if (!(Number.isInteger(r.volatility?.window) && r.volatility.window >= 2)) errs.push("rules.volatility.window must be an integer >= 2 (or set windowSec)");
    if (!(Number.isFinite(r.volatility?.dropPct) && r.volatility.dropPct > 0)) errs.push("rules.volatility.dropPct must be a positive number");
  }
  if (!["propose", "execute"].includes(r.mode)) errs.push('rules.mode must be "propose" or "execute"');
  if (typeof r.quote !== "string" || !/^[A-Z0-9]{2,10}$/.test(r.quote)) errs.push("rules.quote must be an asset symbol like USDC");
  if (!cfg?.mcp?.url && !cfg?.mcp?.command) errs.push("mcp.url or mcp.command is required");
  for (const k of ["account", "prices", "order"]) if (typeof cfg?.tools?.[k] !== "string") errs.push(`tools.${k} (MCP tool name) is required`);
  if (cfg?.intervalSec !== undefined && !(Number.isFinite(cfg.intervalSec) && cfg.intervalSec >= 1)) errs.push("intervalSec must be a number >= 1");
  const d = cfg?.dashboard;
  if (d?.host && !/^(127\.0\.0\.1|localhost|::1)$/.test(d.host) && !(d.token || process.env.JAGA_DASHBOARD_TOKEN))
    errs.push("dashboard.host binds beyond loopback — set dashboard.token (or JAGA_DASHBOARD_TOKEN) so approvals/panic/MCP need auth");
  if (d?.token !== undefined && !(typeof d.token === "string" && d.token.length >= 16)) errs.push("dashboard.token must be a string of at least 16 characters");
  return errs;
}


// Balances + prices → portfolio snapshot. Pure, so it's testable without an MCP server.
export function valueSnapshot(balances, prices, quote) {
  const priceOf = (asset) => prices[`${asset}${quote}`] || 0;
  // no direct pair? value it through USDT/USDC/BTC so the portfolio total (and every
  // concentration %) is right. Such assets are counted but never traded — Jaga only
  // sells ASSET→quote pairs that exist.
  const toQuote = (b) => (b === quote ? 1 : prices[`${b}${quote}`] || (prices[`${quote}${b}`] ? 1 / prices[`${quote}${b}`] : 0));
  const bridged = (asset) => {
    for (const b of ["USDT", "USDC", "BTC"]) {
      const via = asset === b ? 1 : prices[`${asset}${b}`];
      const rate = via && toQuote(b);
      if (via && rate) return via * rate;
    }
    return 0;
  };
  let quoteFree = 0;
  const positions = [];
  const unpriced = [];
  for (const b of balances) {
    if (b.free <= 0) continue;
    if (b.asset === quote) {
      quoteFree = b.free;
      continue;
    }
    const price = priceOf(b.asset);
    if (price) positions.push({ asset: b.asset, qty: b.free, price, usd: b.free * price });
    else {
      const est = bridged(b.asset);
      if (est) unpriced.push({ asset: b.asset, qty: b.free, price: est, usd: b.free * est });
    }
  }
  const total = quoteFree + positions.reduce((s, p) => s + p.usd, 0) + unpriced.reduce((s, p) => s + p.usd, 0);
  return { positions, unpriced, quote, quoteFree, total, priceOf };
}

// Exchange filters → { SYMBOL: stepSize }. Understands Binance exchangeInfo
// ({symbols:[{symbol, filters:[{filterType:"LOT_SIZE", stepSize}]}]}), a plain
// {SYMBOL: step} map, or [{symbol, stepSize}].
export function parseStepSizes(x) {
  const out = {};
  const src = x?.symbols ?? x?.data ?? x;
  if (Array.isArray(src)) {
    for (const it of src) {
      const sym = it.symbol ?? it.pair;
      const step = Number(it.stepSize ?? it.filters?.find((f) => f.filterType === "LOT_SIZE")?.stepSize);
      if (sym && step > 0 && PAIR.test(String(sym).toUpperCase())) out[String(sym).toUpperCase()] = step;
    }
  } else if (src && typeof src === "object") {
    for (const [k, v] of Object.entries(src)) {
      const step = Number(typeof v === "object" && v !== null ? v.stepSize : v);
      if (step > 0 && PAIR.test(k.toUpperCase())) out[k.toUpperCase()] = step;
    }
  }
  return out;
}

// Floor a base quantity to the symbol's LOT_SIZE step (what Binance would otherwise reject).
export function floorToStep(qty, step) {
  if (!step || step <= 0) return qty;
  const decimals = Math.max(0, Math.ceil(-Math.log10(step)));
  return Number((Math.floor(qty / step + 1e-9) * step).toFixed(decimals));
}

// The analyst's threat assessment starts with a level; pull it out for the dashboard card.
export function parseThreatLevel(text) {
  const m = String(text ?? "").match(/\b(LOW|MEDIUM|HIGH|CRITICAL)\b/i);
  return m ? m[1].toUpperCase() : null;
}

// Bad prints happen (a community MCP server returns 0, a stale cache, a fat-finger
// tick). A price that jumps more than maxJumpPct from the last accepted one is
// held back for ONE tick: we keep valuing at the previous price and flag it. If the
// next tick confirms the level, it's real and we accept it. One glitch can never
// liquidate a book.
export function screenPrices(prev, now, suspect, maxJumpPct = 25) {
  const out = { ...now };
  const nextSuspect = new Set();
  const flagged = [];
  for (const [sym, p] of Object.entries(now)) {
    const last = prev?.[sym];
    if (!last) continue;
    const jump = Math.abs((p - last) / last) * 100;
    if (jump > maxJumpPct && !suspect?.has(sym)) {
      out[sym] = last; // hold last good price this tick
      nextSuspect.add(sym);
      flagged.push({ symbol: sym, last, seen: p, jumpPct: Math.round(jump * 100) / 100 });
    }
  }
  return { prices: out, suspect: nextSuspect, flagged };
}

// One writer at a time. The tick loop, an approval click and the panic button all
// place sells, and they arrive on different callbacks — overlapping them can sell
// the same position twice. Everything that trades goes through this queue.
export function serializer() {
  let queue = Promise.resolve();
  return (fn) => {
    const run = queue.then(fn);
    queue = run.catch(() => {}); // one failure must not break the chain
    return run;
  };
}
