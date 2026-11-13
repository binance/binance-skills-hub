#!/usr/bin/env python3
"""Offline signal evaluation for BTC Up/Down prediction markets.

Runs with no wallet, no login and no money. It answers one question only:
does a directional signal clear the cost hurdle out of sample?

    python3 backtest.py fetch --symbol BTCUSDT   # pull + cache hourly candles
    python3 backtest.py eval             # evaluate the bundled signal family
    python3 backtest.py pricedin         # is the signal already in the quotes?
    python3 backtest.py eval --hurdle 0.54

DATA SOURCE
    Binance spot klines — the series the 1-hour and daily rounds settle against
    (each topic names its feed in variantData.priceFeedProvider). The 5-minute
    and 15-minute rounds settle against CHAINLINK, so numbers from this harness
    do not transfer to them.
"""
import json, os, math, sys, argparse, statistics
from datetime import datetime, timezone

HOME = os.path.expanduser(os.environ.get("UPDOWN_HOME", "~/.local/updown"))
os.makedirs(HOME, exist_ok=True)
# Binance market-data intervals, keyed by the platform's own timeframe strings.
# The streak has to be measured on the same clock the round runs on; measuring
# hourly candles and trading 5-minute rounds compares two different processes.
INTERVALS = {"5 min": "5m", "15 min": "15m", "1 hour": "1h", "daily": "1d"}


def cache_path(interval):
    return f"{HOME}/klines_{interval}.json"

# The 1-hour and daily rounds settle against Binance spot (the topic publishes
# variantData.priceFeedProvider). This reads that series directly from the public
# market-data endpoint — no key, no session, so this harness can be run and
# audited by someone who does not trust the daemon.
#
# The 5-minute and 15-minute rounds settle against CHAINLINK instead. Numbers
# from this harness do not transfer to those cadences.
API = "https://api.binance.com/api/v3/klines"
PAGE = 1000


def fetch(symbol="BTCUSDT", pages=12, interval="1h"):
    import urllib.request
    rows, end = {}, None
    for i in range(pages):
        url = f"{API}?symbol={symbol}&interval={interval}&limit={PAGE}"
        if end:
            url += f"&endTime={end}"
        try:
            with urllib.request.urlopen(url, timeout=30) as r:
                d = json.load(r)
        except Exception as e:
            print(f"  page {i+1}: {e}")
            break
        if not d:
            break
        for c in d:
            # normalise to [open, high, low, close, volume, openTime, 0]
            rows[int(c[0])] = [float(c[1]), float(c[2]), float(c[3]),
                               float(c[4]), float(c[5]), int(c[0]), 0]
        end = min(int(c[0]) for c in d) - 1
        print(f"  page {i+1}: +{len(d)} → {len(rows)} total")
    out = [rows[k] for k in sorted(rows)]
    path = cache_path(interval)
    json.dump(out, open(path, "w"))
    span = (fmt(out[0][5]), fmt(out[-1][5])) if out else ("-", "-")
    print(f"cached {len(out)} {interval} candles ({symbol}) → {path}\n  {span[0]} → {span[1]}")
    return out


def load(interval="1h"):
    path = cache_path(interval)
    if not os.path.exists(path):
        sys.exit(f"no cache at {path} — run `backtest.py fetch --interval {interval}` first.")
    return json.load(open(path))


def fmt(ms):
    return datetime.fromtimestamp(ms / 1000, timezone.utc).strftime("%Y-%m-%d %H:%M")


# ──────────────────────────── signals ───────────────────────────
# A signal maps an index to a predicted outcome: 1 = up, 0 = down, None = skip.
# Hooks in updown.py reuse the same shape, so anything validated here is
# transplantable without rewriting the judgement.

def streak_reversal(n):
    """After n consecutive same-direction hours, predict the opposite."""
    def f(i, up):
        if i < n:
            return None
        prev = up[i - 1]
        if all(up[i - j] == prev for j in range(1, n + 1)):
            return 1 - prev
        return None
    f.__name__ = f"streak{n}_reversal"
    return f


def streak_momentum(n):
    def f(i, up):
        if i < n:
            return None
        prev = up[i - 1]
        if all(up[i - j] == prev for j in range(1, n + 1)):
            return prev
        return None
    f.__name__ = f"streak{n}_momentum"
    return f


def last_hour_reversal(i, up):
    return None if i < 1 else 1 - up[i - 1]


def always_up(i, up):
    return 1


SIGNALS = [streak_reversal(2), streak_reversal(3), streak_reversal(4),
           streak_reversal(5), streak_momentum(3), last_hour_reversal, always_up]


# ──────────────────────────── scoring ───────────────────────────

def se(p, n):
    return math.sqrt(p * (1 - p) / n) if n else float("nan")


def evaluate(sig, up, lo, hi):
    hits = tot = 0
    for i in range(lo, hi):
        pred = sig(i, up)
        if pred is None:
            continue
        tot += 1
        hits += (pred == up[i])
    return (hits / tot if tot else float("nan")), tot


def report(candles, hurdle, split=0.7, interval="1h"):
    up = [1 if c[3] > c[0] else 0 for c in candles]
    n = len(up)
    if n < 500:
        sys.exit(f"only {n} candles — too few to conclude anything. Fetch more.")
    cut = int(n * split)
    base = sum(up) / n

    print(f"\nsample      {n} {interval} candles   {fmt(candles[0][5])} → {fmt(candles[-1][5])}")
    print(f"base rate   P(close>open) = {base:.4f}  ±{1.96*se(base,n):.4f} (95%)")
    print(f"hurdle      {hurdle:.3f}  ← a signal must clear this out of sample to be worth trading")
    print(f"split       train {cut} / test {n-cut}\n")

    print(f"{'signal':<24}{'train':>9}{'test':>9}{'95% CI':>18}{'n(test)':>9}  verdict")
    print("─" * 82)
    results = {}
    for sig in SIGNALS:
        tr, _ = evaluate(sig, up, 0, cut)
        te, nte = evaluate(sig, up, cut, n)
        results[sig.__name__] = (te, nte)
        if nte < 60:
            verdict = "SKIP  n too small"
        else:
            half = 1.96 * se(te, nte)
            verdict = "CLEARS" if te - half > hurdle else ("marginal" if te > hurdle else "—")
            lo, hiC = te - half, te + half
        ci = f"[{te-1.96*se(te,nte):.3f}, {te+1.96*se(te,nte):.3f}]" if nte else "-"
        print(f"{sig.__name__:<24}{tr:>9.3f}{te:>9.3f}{ci:>18}{nte:>9}  {verdict}")

    # Dose-response on the FULL sample, not the test split. The test split leaves
    # the longer streaks with too few observations to rank reliably — judging
    # monotonicity off ~100 samples rejects real effects as noise.
    print("\ndose-response (full sample — the test split is too thin at long streaks)")
    chain = []
    for k in (2, 3, 4, 5):
        p_, n_ = evaluate(streak_reversal(k), up, 0, n)
        chain.append(p_)
        print(f"  streak{k}_reversal   {p_:.3f} ±{1.96*se(p_,n_):.3f}   n={n_}")
    mono = all(b >= a - 1e-9 for a, b in zip(chain, chain[1:]))
    print("  → " + ("MONOTONIC: longer streak, stronger reversal. Supports a real effect."
                    if mono else "NOT monotonic — treat the family as noise."))

    table = {k: round(v, 3) for k, v in zip((2, 3, 4, 5), chain)}
    print("\npaste into config.json → policy.hit_table (measured on THIS interval):")
    print("  " + json.dumps({str(k): v for k, v in table.items()}))
    print("  Leaving it unset makes the hook fall back to its built-in hourly table,")
    print("  which does not describe any other cadence.")

    print(f"\nhypotheses tested: {len(SIGNALS)}. With that many tries, one clearing the bar by "
          f"chance is ordinary — the dose-response row is the stronger evidence.")
    print("NOTE  hit rate is not edge. If the market already prices this state, a clearing "
          "signal still earns zero.\n      Run `updown.py --collect-quotes` before committing money.")
    return results


# ───────────────── is the signal already in the price? ─────────────────
# A backtest can only produce a hit rate. Whether that hit rate is worth
# anything depends on what the market was charging at the time, which is why
# `updown.py --collect-quotes` exists. This reads what it collected and answers
# the only question that matters before committing money.

QUOTES = f"{HOME}/quotes.jsonl"


def resolve_outcome(symbol, start_ms, close_ms):
    """Compare the first open and last close of a completed [start, close) window."""
    import urllib.request
    start_ms, close_ms = int(start_ms), int(close_ms)
    if (start_ms % 60000 or close_ms % 60000 or close_ms <= start_ms
            or close_ms > datetime.now(timezone.utc).timestamp() * 1000):
        return None
    candles = []
    # Only the boundary candles are needed, even for daily windows (>1000 minutes).
    for minute in dict.fromkeys((start_ms, close_ms - 60000)):
        url = (f"{API}?symbol={symbol}&interval=1m"
               f"&startTime={minute}&endTime={minute + 59999}&limit=1")
        try:
            with urllib.request.urlopen(url, timeout=20) as r:
                d = json.load(r)
        except Exception:
            return None
        if not d or int(d[0][0]) != minute:
            return None
        candles.append(d[0])
    return 1 if float(candles[-1][4]) > float(candles[0][1]) else 0


def pricedin():
    if not os.path.exists(QUOTES):
        sys.exit(f"no {QUOTES} — run `updown.py --collect-quotes` first.")
    rows = []
    for line in open(QUOTES):
        try:
            rows.append(json.loads(line))
        except Exception:
            continue
    if not rows:
        sys.exit("quotes.jsonl is empty.")

    # One row per round: the collector polls repeatedly, so keep the earliest
    # observation of each round rather than counting the same round many times.
    seen = {}
    for r in sorted(rows, key=lambda x: x.get("ts", 0)):
        k = str(r.get("key"))
        if k not in seen and r.get("start_ms") and r.get("close_ms"):
            seen[k] = r
    print(f"{len(rows)} collected rows → {len(seen)} distinct rounds\n")

    feeds = {r.get("feed") for r in seen.values()}
    if feeds - {"BINANCE", None}:
        print(f"WARNING feeds present: {feeds}. Outcomes below are resolved from "
              f"Binance spot; rounds settling on another feed may differ.\n")

    buckets = {}
    unresolved = 0
    for r in seen.values():
        out = resolve_outcome(r.get("feed_symbol") or r.get("symbol"),
                              r["start_ms"], r["close_ms"])
        if out is None:
            unresolved += 1
            continue
        st, d = r.get("streak"), r.get("streak_dir")
        key = (st, d)
        b = buckets.setdefault(key, {"n": 0, "up": 0, "q_up": 0.0})
        b["n"] += 1
        b["up"] += out
        # Implied probability of UP, from the ask side actually tradable.
        b["q_up"] += fnum_(r.get("up_ask"))

    if not buckets:
        sys.exit("could not resolve any outcome — check symbol and window fields.")

    print(f"{'streak':>7}{'dir':>5}{'n':>6}{'implied P(up)':>15}{'realized P(up)':>16}"
          f"{'gap':>8}   read as")
    print("─" * 78)
    for (st, d), b in sorted(buckets.items(), key=lambda kv: (kv[0][0] is None, kv[0])):
        if not b["n"]:
            continue
        imp = b["q_up"] / b["n"]
        real = b["up"] / b["n"]
        gap = real - imp
        if b["n"] < 20:
            note = "too few to read"
        elif abs(gap) < 0.02:
            note = "PRICED IN — no edge here"
        elif gap > 0:
            note = "market underprices Up"
        else:
            note = "market underprices Down"
        print(f"{str(st):>7}{str(d):>5}{b['n']:>6}{imp:>15.3f}{real:>16.3f}{gap:>+8.3f}   {note}")

    if unresolved:
        print(f"\n{unresolved} round(s) could not be resolved (window outside available candles).")
    print("\nIf the gap is ~0 wherever your signal fires, the market already knows. "
          "Collect more\nrounds before concluding either way — 20 per bucket is a floor, not a target.")


def fnum_(x, default=0.0):
    try:
        return float(x)
    except (TypeError, ValueError):
        return default


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("cmd", choices=["fetch", "eval", "pricedin"])
    ap.add_argument("--pages", type=int, default=12)
    ap.add_argument("--symbol", default="BTCUSDT",
                    help="settlement symbol for the cadence you intend to trade")
    ap.add_argument("--interval", default="1h",
                    help="candle interval: 5m / 15m / 1h / 1d — match the round cadence")
    ap.add_argument("--hurdle", type=float, default=0.53,
                    help="0.50 + overround/2 + fees; measure it, do not guess")
    a = ap.parse_args()
    if a.cmd == "fetch":
        fetch(a.symbol, a.pages, a.interval)
    elif a.cmd == "pricedin":
        pricedin()
    else:
        report(load(a.interval), a.hurdle, interval=a.interval)


if __name__ == "__main__":
    main()
