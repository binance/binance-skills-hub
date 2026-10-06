#!/usr/bin/env python3
"""event_dashboard.py -- pre-trade crowding and context dashboard for event-driven setups.

Public data only. No API keys, no account access, standard library only.

Two venue adapters, tried in order because derivatives endpoints are geo-restricted in
some regions:

  binance-futures   fapi.binance.com   (preferred when reachable)
  gate-futures      api.gateio.ws      (fallback; funding + OI + long/short + liquidations
                                        in a single contract_stats call)

Usage
-----
  python event_dashboard.py BTC_USDT
  python event_dashboard.py SNDK_USDT --venue gate
  python event_dashboard.py ETHUSDT --json

Output is a reading of positioning, not a signal. See ../references/crowding-metrics.md
for how to interpret each field.
"""

from __future__ import annotations

import argparse
import json
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

TIMEOUT = 20
UA = "Mozilla/5.0 (compatible; event-dashboard/1.0; research)"

QUOTES = ("USDT", "USDC", "USD", "BTC", "ETH", "EUR")


# --------------------------------------------------------------------------- http


def http_json(url: str):
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=TIMEOUT) as r:
        return json.loads(r.read().decode("utf-8", "replace"))


def try_json(url: str):
    """Return (data, error_string). Never raises."""
    try:
        return http_json(url), None
    except urllib.error.HTTPError as e:
        return None, f"HTTP {e.code}"
    except Exception as e:  # noqa: BLE001 - adapter must degrade, not crash
        return None, type(e).__name__


def symbols(raw: str) -> tuple[str, str]:
    """'BTC_USDT' | 'BTCUSDT' | 'btc/usdt' -> (gate 'BTC_USDT', binance 'BTCUSDT')."""
    s = raw.strip().upper().replace("/", "_").replace("-", "_")
    if "_" in s:
        base, _, quote = s.partition("_")
    else:
        for q in QUOTES:
            if s.endswith(q) and len(s) > len(q):
                base, quote = s[: -len(q)], q
                break
        else:
            raise SystemExit(f"cannot parse symbol {raw!r}; use e.g. BTC_USDT or BTCUSDT")
    return f"{base}_{quote}", f"{base}{quote}"


def pct(x: float | None, digits: int = 2) -> str:
    return "n/a" if x is None else f"{x * 100:+.{digits}f}%"


def num(x, digits: int = 2) -> str:
    return "n/a" if x is None else f"{x:,.{digits}f}"


def usd(x) -> str:
    if x is None:
        return "n/a"
    for unit, scale in (("B", 1e9), ("M", 1e6), ("K", 1e3)):
        if abs(x) >= scale:
            return f"${x / scale:,.2f}{unit}"
    return f"${x:,.0f}"


# --------------------------------------------------------------------------- adapters


def gate_dashboard(gate_sym: str) -> dict:
    base = "https://api.gateio.ws/api/v4/futures/usdt"
    q = urllib.parse.quote(gate_sym)
    tick, err1 = try_json(f"{base}/tickers?contract={q}")
    stats, err2 = try_json(f"{base}/contract_stats?contract={q}&interval=1h&limit=24")
    if err1 or err2 or not tick:
        raise RuntimeError(f"gate: {err1 or err2 or 'empty ticker'}")

    t = tick[0] if isinstance(tick, list) else tick
    series = stats if isinstance(stats, list) else []
    last_stat = series[-1] if series else {}

    last = float(t["last"])
    hi, lo = float(t["high_24h"]), float(t["low_24h"])
    funding = float(t.get("funding_rate") or 0.0)

    oi_now = last_stat.get("open_interest_usd")
    oi_then = series[0].get("open_interest_usd") if series else None
    oi_chg = (oi_now / oi_then - 1) if (oi_now and oi_then) else None

    long_liq = sum(float(s.get("long_liq_usd") or 0) for s in series) or None
    short_liq = sum(float(s.get("short_liq_usd") or 0) for s in series) or None

    return {
        "venue": "gate-futures",
        "symbol": gate_sym,
        "last": last,
        "mark": _f(t.get("mark_price")),
        "index": _f(t.get("index_price")),
        "change_24h": _f(t.get("change_percentage")) / 100 if t.get("change_percentage") else None,
        "high_24h": hi,
        "low_24h": lo,
        "quote_volume_24h": _f(t.get("volume_24h_quote")),
        "funding_rate": funding,
        "funding_interval_h": 8,
        "oi_usd": oi_now,
        "oi_change_24h": oi_chg,
        "lsr_account": last_stat.get("lsr_account"),
        "lsr_taker": last_stat.get("lsr_taker"),
        "top_lsr_account": last_stat.get("top_lsr_account"),
        "top_lsr_size": last_stat.get("top_lsr_size"),
        "long_liq_usd_24h": long_liq,
        "short_liq_usd_24h": short_liq,
        "price_change_window": _window_price_change(series),
    }


def binance_dashboard(bin_sym: str) -> dict:
    f = "https://fapi.binance.com"
    s = urllib.parse.quote(bin_sym)
    prem, e1 = try_json(f"{f}/fapi/v1/premiumIndex?symbol={s}")
    tick, e2 = try_json(f"{f}/fapi/v1/ticker/24hr?symbol={s}")
    if e1 or e2 or not prem or not tick:
        raise RuntimeError(f"binance: {e1 or e2 or 'empty'}")
    oi, _ = try_json(f"{f}/fapi/v1/openInterest?symbol={s}")
    lsr, _ = try_json(f"{f}/futures/data/globalLongShortAccountRatio?symbol={s}&period=1h&limit=1")
    top, _ = try_json(f"{f}/futures/data/topLongShortPositionRatio?symbol={s}&period=1h&limit=1")
    taker, _ = try_json(f"{f}/futures/data/takerlongshortRatio?symbol={s}&period=1h&limit=1")
    hist, _ = try_json(f"{f}/futures/data/openInterestHist?symbol={s}&period=1h&limit=24")

    mark = _f(prem.get("markPrice"))
    oi_now = _f((oi or {}).get("openInterest"))
    oi_usd = oi_now * mark if (oi_now and mark) else None
    oi_then = None
    if hist:
        oi_then = _f(hist[0].get("sumOpenInterest"))
        if oi_then and mark:
            oi_then *= mark

    return {
        "venue": "binance-futures",
        "symbol": bin_sym,
        "last": _f(tick.get("lastPrice")),
        "mark": mark,
        "index": _f(prem.get("indexPrice")),
        "change_24h": _f(tick.get("priceChangePercent")) / 100 if tick.get("priceChangePercent") else None,
        "high_24h": _f(tick.get("highPrice")),
        "low_24h": _f(tick.get("lowPrice")),
        "quote_volume_24h": _f(tick.get("quoteVolume")),
        "funding_rate": _f(prem.get("lastFundingRate")),
        "funding_interval_h": 8,
        "oi_usd": oi_usd,
        "oi_change_24h": (oi_usd / oi_then - 1) if (oi_usd and oi_then) else None,
        "lsr_account": _f((lsr or [{}])[-1].get("longShortRatio")) if lsr else None,
        "lsr_taker": _f((taker or [{}])[-1].get("buySellRatio")) if taker else None,
        "top_lsr_account": None,
        "top_lsr_size": _f((top or [{}])[-1].get("longShortRatio")) if top else None,
        "long_liq_usd_24h": None,
        "short_liq_usd_24h": None,
        "price_change_window": None,
    }


def _f(v):
    try:
        return float(v)
    except (TypeError, ValueError):
        return None


def _window_price_change(series):
    marks = [_f(s.get("mark_price")) for s in series if _f(s.get("mark_price"))]
    if len(marks) >= 2 and marks[0]:
        return marks[-1] / marks[0] - 1
    return None


# --------------------------------------------------------------------------- reading


def annualised(rate: float | None, interval_h: int) -> float | None:
    if rate is None:
        return None
    return rate * (24 / interval_h) * 365


def read(d: dict) -> list[str]:
    """Turn raw numbers into the crowding verdicts."""
    out = []
    fr = d.get("funding_rate")
    ann = annualised(fr, d.get("funding_interval_h") or 8)
    if fr is None:
        out.append("funding: unavailable")
    else:
        mag = abs(fr)
        label = "extreme" if mag >= 0.001 else "elevated" if mag >= 0.0005 else "normal"
        side = "longs pay shorts" if fr > 0 else "shorts pay longs"
        out.append(f"funding: {pct(fr, 4)}/interval ({pct(ann, 1)} annualised) -> {label}; {side}")

    px = d.get("price_change_window")
    oi = d.get("oi_change_24h")
    if px is None or oi is None:
        out.append("OI vs price: insufficient history")
    elif px < 0 and oi > 0:
        out.append(f"OI vs price: price {pct(px)} with OI {pct(oi)} -> new shorts building (squeeze fuel)")
    elif px > 0 and oi > 0:
        out.append(f"OI vs price: price {pct(px)} with OI {pct(oi)} -> new money with the move")
    elif px > 0 and oi < 0:
        out.append(f"OI vs price: price {pct(px)} with OI {pct(oi)} -> shorts covering / longs trimming")
    else:
        out.append(f"OI vs price: price {pct(px)} with OI {pct(oi)} -> participation leaving")

    lsr = d.get("lsr_account")
    top = d.get("top_lsr_size")
    if lsr is None:
        out.append("long/short accounts: unavailable")
    else:
        tail = ""
        if top is not None and (lsr >= 1.5) != (top >= 1.5):
            tail = f"; size-weighted top traders read {num(top)} (opposite side)"
        out.append(f"long/short accounts: {num(lsr)}{tail}")

    ll, sl = d.get("long_liq_usd_24h"), d.get("short_liq_usd_24h")
    if ll is None and sl is None:
        out.append("liquidations: not exposed by this venue")
    else:
        ll, sl = ll or 0, sl or 0
        if max(ll, sl) > 0 and max(ll, sl) >= 3 * max(min(ll, sl), 1):
            side = "long" if ll > sl else "short"
            out.append(f"liquidations 24h: {usd(ll)} long vs {usd(sl)} short -> one-sided {side} cascade")
        else:
            out.append(f"liquidations 24h: {usd(ll)} long vs {usd(sl)} short -> two-sided")
    return out


def percentile(d: dict) -> str:
    last, hi, lo = d.get("last"), d.get("high_24h"), d.get("low_24h")
    if None in (last, hi, lo) or hi == lo:
        return "n/a"
    p = (last - lo) / (hi - lo)
    band = "inside 0.30-0.70 entry band" if 0.30 <= p <= 0.70 else "OUTSIDE 0.30-0.70 band (chase risk)"
    return f"{p:.2f} of 24h range ({band})"


def render(d: dict) -> str:
    basis = None
    if d.get("mark") and d.get("index"):
        basis = d["mark"] / d["index"] - 1
    lines = [
        f"=== {d['symbol']} @ {d['venue']} === {time.strftime('%Y-%m-%d %H:%M:%S %z')}",
        f"last {num(d.get('last'), 4)}   mark {num(d.get('mark'), 4)}   index {num(d.get('index'), 4)}"
        f"   basis {pct(basis, 3)}",
        f"24h {pct(d.get('change_24h'))}   range {num(d.get('low_24h'), 4)} - {num(d.get('high_24h'), 4)}"
        f"   quote volume {usd(d.get('quote_volume_24h'))}",
        f"location: {percentile(d)}",
        f"open interest {usd(d.get('oi_usd'))}   24h OI change {pct(d.get('oi_change_24h'))}",
        "",
        "crowding read:",
    ]
    lines += [f"  - {r}" for r in read(d)]
    lines += [
        "",
        "caveats: single venue (a proxy, not the market); point-in-time snapshot;",
        "         derivatives endpoints are geo-restricted in some regions.",
        "research and educational use only; not investment advice.",
    ]
    return "\n".join(lines)


# --------------------------------------------------------------------------- main


def build(raw: str, venue: str) -> dict:
    gate_sym, bin_sym = symbols(raw)
    order = ["binance", "gate"] if venue == "auto" else [venue]
    errors = []
    for v in order:
        try:
            d = binance_dashboard(bin_sym) if v == "binance" else gate_dashboard(gate_sym)
            if errors:
                d["fallback_from"] = errors
            return d
        except Exception as e:  # noqa: BLE001
            errors.append(f"{v}: {e}")
    raise SystemExit("all venues failed:\n  " + "\n  ".join(errors))


def main() -> None:
    ap = argparse.ArgumentParser(description="Event-trading crowding dashboard (public data).")
    ap.add_argument("symbol", help="e.g. BTC_USDT, SNDK_USDT, ETHUSDT")
    ap.add_argument("--venue", choices=["auto", "binance", "gate"], default="auto")
    ap.add_argument("--json", action="store_true", help="emit the raw dashboard as JSON")
    a = ap.parse_args()

    d = build(a.symbol, a.venue)
    if a.json:
        json.dump(d, sys.stdout, ensure_ascii=False, indent=2, default=str)
        print()
    else:
        print(render(d))


if __name__ == "__main__":
    main()
