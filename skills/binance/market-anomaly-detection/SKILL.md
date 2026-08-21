---
name: market-anomaly-detection
description: |
  Detect and classify statistical market anomalies — volume surges, price spikes,
  pump-and-dump patterns, wash-trading signals, wick rejections, and (for futures)
  funding-rate extremes and open-interest divergences — using Binance's fully public
  REST API and historical kline data.

  Use when the user asks whether a coin is behaving abnormally, wants to scan a pair
  for unusual activity, or asks for an anomaly report on any Binance Spot or
  USD-M Futures market.

  Do NOT use for placing orders, checking balances, P2P queries, or on-chain activity.
version: 1.0.0
author: ShivanshHingve2804
license: MIT
---

# Market Anomaly Detection

Detect, classify, and report statistical market anomalies for any Binance Spot or
USD‑M Futures trading pair using only **fully public endpoints — no API key required**.

---

## When to Use / When NOT to Use

### Use this skill when the user wants to:

- Check whether a coin or pair is **behaving abnormally** ("Is BTCUSDT doing something weird right now?")
- Detect **volume spikes, price spikes, or unusual candle patterns** on a specific symbol
- Identify possible **pump-and-dump or wash-trading patterns**
- Scan for **liquidation cascade signals** on a futures pair
- Get a **structured anomaly report** with severity levels
- Compare **current market behaviour against a historical statistical baseline**

### Do NOT use this skill when the user asks about:

- Spot or futures prices, order management, or trade execution (use the Binance Spot/Futures skill)
- Portfolio balances, account history, or P2P/C2C activity
- On-chain transactions or Web3 wallet data
- Fundamental or sentiment analysis (no text data is fetched here)
- Predictions or price targets — this skill reports statistical patterns only

### Ask the user (do not guess) if any of these are missing:

- `symbol` — e.g. `BTCUSDT`, `ETHUSDT`
- `market` — Spot (default) or Futures USD-M
- `interval` — suggest `1h` for general use

---

## Security — No Authentication Required

All endpoints used by this skill are fully public.
**Do not request, read, or store Binance API credentials for this skill.**

---

## Environment

### Base URLs

| Market | Base URL |
|--------|----------|
| Spot | `https://api.binance.com` |
| Futures USD-M | `https://fapi.binance.com` |
| Futures data (OI history) | `https://fapi.binance.com` |

Default to **Spot** unless the user explicitly mentions futures, perp, or perpetual.

### Required header — include in every request

```
User-Agent: binance-market-anomaly-detection/1.0.0 (Skill)
Accept-Encoding: identity
```

### Symbol normalisation

| User says | Use symbol |
|-----------|------------|
| "Bitcoin", "BTC" | `BTCUSDT` |
| "Ethereum", "ETH" | `ETHUSDT` |
| "ETH futures", "ETH perp" | `ETHUSDT` on Futures USD-M |
| "BNBUSDT" | `BNBUSDT` (already correct) |

Always uppercase the symbol before sending it to any endpoint.

---

## API Overview

| Action | Method | Endpoint | Auth |
|--------|--------|----------|------|
| OHLCV klines (Spot) | GET | `/api/v3/klines` | None |
| OHLCV klines (Futures) | GET | `/fapi/v1/klines` | None |
| 24-hour ticker stats (Spot) | GET | `/api/v3/ticker/24hr` | None |
| 24-hour ticker stats (Futures) | GET | `/fapi/v1/ticker/24hr` | None |
| Order book depth (Spot) | GET | `/api/v3/depth` | None |
| Funding rate history (Futures) | GET | `/fapi/v1/fundingRate` | None |
| Open interest — current (Futures) | GET | `/fapi/v1/openInterest` | None |
| Open interest — history (Futures) | GET | `/futures/data/openInterestHist` | None |

---

## Endpoints

### 1. Fetch Klines (OHLCV) — Primary Data Source

Fetch at least **200 candles** for statistical significance (minimum 50).

**Spot**
```bash
curl -X GET "https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1h&limit=200" \
  -H "User-Agent: binance-market-anomaly-detection/1.0.0 (Skill)" \
  -H "Accept-Encoding: identity"
```

**Futures USD-M**
```bash
curl -X GET "https://fapi.binance.com/fapi/v1/klines?symbol=BTCUSDT&interval=1h&limit=200" \
  -H "User-Agent: binance-market-anomaly-detection/1.0.0 (Skill)" \
  -H "Accept-Encoding: identity"
```

#### Kline array schema (by index)

| Index | Field | Type | Notes |
|-------|-------|------|-------|
| 0 | Open time | long (Unix ms) | e.g. `1499040000000` |
| 1 | Open | string → float | Cast before use |
| 2 | High | string → float | |
| 3 | Low | string → float | |
| 4 | Close | string → float | |
| 5 | Volume (base asset) | string → float | |
| 6 | Close time | long (Unix ms) | |
| 7 | Quote asset volume | string → float | |
| 8 | Number of trades | integer | |
| 9 | Taker buy base volume | string → float | Used for buy-pressure ratio |
| 10 | Taker buy quote volume | string → float | |
| 11 | (unused) | string | Always `"0"` — ignore |

**Supported intervals**: `1m`, `3m`, `5m`, `15m`, `30m`, `1h`, `2h`, `4h`, `6h`, `8h`, `12h`, `1d`, `3d`, `1w`, `1M`
**Maximum `limit`**: 1000 per request · Default: 500 (Futures), 500 (Spot)

If the most recent candle's close time is **greater than the current Unix timestamp**, that candle is still forming.
Flag this in the output: `⚠️ Most recent candle is still forming — anomaly scores may update.`

---

### 2. 24-Hour Ticker Stats — Context Layer

Call after klines to provide a quick sanity check on the 24-hour price move.

**Spot**
```bash
curl -X GET "https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT" \
  -H "User-Agent: binance-market-anomaly-detection/1.0.0 (Skill)" \
  -H "Accept-Encoding: identity"
```

**Key response fields**

| Field | Type | Description |
|-------|------|-------------|
| `priceChangePercent` | string | % price change over 24 h (append `%` directly) |
| `weightedAvgPrice` | string | VWAP over 24 h |
| `volume` | string | Base asset volume |
| `count` | integer | Number of trades over 24 h |
| `highPrice` / `lowPrice` | string | 24 h high and low |

---

### 3. Order Book Depth — Spread Anomaly (Spot)

Use to detect thin liquidity that may explain an observed price spike.

```bash
curl -X GET "https://api.binance.com/api/v3/depth?symbol=BTCUSDT&limit=5" \
  -H "User-Agent: binance-market-anomaly-detection/1.0.0 (Skill)" \
  -H "Accept-Encoding: identity"
```

Compute spread: `spread_pct = (float(asks[0][0]) - float(bids[0][0])) / float(bids[0][0]) * 100`

Flag if `spread_pct > 0.10%` on a major pair (BTCUSDT, ETHUSDT) — indicates thin book.

---

### 4. Funding Rate History — Futures Only

Extreme funding rates signal that one side of the market is paying unusually to stay open.

```bash
curl -X GET "https://fapi.binance.com/fapi/v1/fundingRate?symbol=BTCUSDT&limit=10" \
  -H "User-Agent: binance-market-anomaly-detection/1.0.0 (Skill)" \
  -H "Accept-Encoding: identity"
```

**Key response fields per entry**

| Field | Type | Description |
|-------|------|-------------|
| `symbol` | string | e.g. `BTCUSDT` |
| `fundingRate` | string → float | e.g. `-0.03750000` |
| `fundingTime` | long (Unix ms) | |
| `markPrice` | string → float | Mark price at funding time |

**Normal range**: −0.0075% to +0.0075% (−0.075% to +0.075% in extreme markets)
Flag if `abs(fundingRate) > 0.01` (1%) — classify as **HIGH** funding-rate anomaly.

---

### 5. Open Interest — Futures Only

Rising OI with falling price = new short positions opening (bearish).
Falling OI with falling price = long liquidations (liquidation cascade signal).

**Current OI**
```bash
curl -X GET "https://fapi.binance.com/fapi/v1/openInterest?symbol=BTCUSDT" \
  -H "User-Agent: binance-market-anomaly-detection/1.0.0 (Skill)" \
  -H "Accept-Encoding: identity"
```

**OI history (for trend comparison)**
```bash
curl -X GET "https://fapi.binance.com/futures/data/openInterestHist?symbol=BTCUSDT&period=1h&limit=10" \
  -H "User-Agent: binance-market-anomaly-detection/1.0.0 (Skill)" \
  -H "Accept-Encoding: identity"
```

OI history key fields: `sumOpenInterest` (base asset), `sumOpenInterestValue` (USD), `timestamp`

Compute OI change: `oi_change_pct = (latest_oi - prev_oi) / prev_oi * 100`

---

## Anomaly Detection Algorithms

Process all kline string values as `float`. Use all candles **except the last** as the baseline window.

### Step 1 — Build the Baseline Window

```python
klines = [...]  # List of kline arrays from the API

baseline = klines[:-1]    # all except most recent
current  = klines[-1]     # most recent candle

closes  = [float(k[4]) for k in baseline]
volumes = [float(k[5]) for k in baseline]
trades  = [int(k[8])   for k in baseline]
highs   = [float(k[2]) for k in baseline]
lows    = [float(k[3]) for k in baseline]

cur_open   = float(current[1])
cur_high   = float(current[2])
cur_low    = float(current[3])
cur_close  = float(current[4])
cur_volume = float(current[5])
cur_trades = int(current[8])
cur_taker_buy = float(current[9])
```

### Step 2 — Compute Z-Scores

```python
import statistics

def z_score(value, data):
    mu  = statistics.mean(data)
    std = statistics.stdev(data)
    return (value - mu) / std if std > 0 else 0.0

volume_z = z_score(cur_volume, volumes)
price_z  = z_score(cur_close,  closes)
trade_z  = z_score(cur_trades, trades)
```

### Step 3 — Candle Structure Metrics

```python
candle_range     = cur_high - cur_low
body             = abs(cur_close - cur_open)
body_ratio       = body / candle_range if candle_range > 0 else 0.0

upper_wick       = cur_high - max(cur_open, cur_close)
upper_wick_ratio = upper_wick / candle_range if candle_range > 0 else 0.0

lower_wick       = min(cur_open, cur_close) - cur_low
lower_wick_ratio = lower_wick / candle_range if candle_range > 0 else 0.0

candle_pct       = (cur_close - cur_open) / cur_open * 100   # + = bullish candle
```

### Step 4 — Taker Buy Pressure Ratio

```python
buy_ratio = cur_taker_buy / cur_volume if cur_volume > 0 else 0.5
# > 0.70 → strong buy pressure   < 0.30 → strong sell pressure
```

### Step 5 — Futures-Only Signals

Compute only when `market = futures-usd-m`:

```python
# From fundingRate endpoint (index 0 = most recent)
latest_funding = float(funding_rates[0]["fundingRate"])

# From openInterestHist
oi_values  = [float(h["sumOpenInterest"]) for h in oi_history]
oi_current = oi_values[0]
oi_prev    = oi_values[1] if len(oi_values) > 1 else oi_current
oi_change_pct = (oi_current - oi_prev) / oi_prev * 100 if oi_prev > 0 else 0.0
```

### Step 6 — Anomaly Classification Table

Evaluate every condition independently. Multiple anomalies can fire on the same candle.

| Severity | Anomaly Type | Detection Condition |
|----------|-------------|---------------------|
| 🔴 CRITICAL | Volume Surge | `volume_z ≥ 4.0` |
| 🔴 CRITICAL | Price Spike | `abs(price_z) ≥ 3.0` AND `abs(candle_pct) ≥ 5.0%` |
| 🟠 HIGH | Volume Surge | `3.0 ≤ volume_z < 4.0` |
| 🟠 HIGH | Price Spike | `abs(price_z) ≥ 2.0` AND `abs(candle_pct) ≥ 2.0%` |
| 🟠 HIGH | Pump Signal | `volume_z ≥ 2.5` AND `candle_pct ≥ 3.0%` AND `buy_ratio ≥ 0.70` |
| 🟠 HIGH | Dump Signal | `volume_z ≥ 2.5` AND `candle_pct ≤ -3.0%` AND `buy_ratio ≤ 0.30` |
| 🟠 HIGH | Funding Extreme | Futures: `abs(latest_funding) ≥ 0.010` (1%) |
| 🟡 MEDIUM | Volume Surge | `2.0 ≤ volume_z < 3.0` |
| 🟡 MEDIUM | Wash-Trade Signal | `trade_z ≥ 3.0` AND `volume_z < 1.0` AND `abs(candle_pct) < 0.5%` |
| 🟡 MEDIUM | Wick Rejection (sell) | `upper_wick_ratio ≥ 0.75` AND `body_ratio < 0.15` |
| 🟡 MEDIUM | Wick Rejection (buy) | `lower_wick_ratio ≥ 0.75` AND `body_ratio < 0.15` |
| 🟡 MEDIUM | OI Divergence | Futures: `oi_change_pct ≤ -5.0%` AND `candle_pct ≤ -2.0%` |
| 🔵 LOW | Thin Candle | `body_ratio < 0.10` AND `volume_z ≥ 1.5` |
| 🔵 LOW | Funding Elevated | Futures: `0.005 ≤ abs(latest_funding) < 0.010` |
| ✅ — | No anomaly | None of the above conditions met |

---

## Output Format

Always produce the full structured report below, even when no anomaly is detected.

```
## 📊 Anomaly Report: {SYMBOL} · {market} · {interval} candles
🕐 Generated: {ISO 8601 UTC}   Baseline window: {N-1} candles

─────────────────────────────────────────
### Current Candle  ({open_time} UTC → {close_time} UTC)
  Open   {cur_open}    High  {cur_high}
  Close  {cur_close}   Low   {cur_low}
  Change {candle_pct:+.2f}%
  Volume {cur_volume:,.2f}  (z-score {volume_z:+.2f})
  Trades {cur_trades:,}     (z-score {trade_z:+.2f})
  Taker Buy Ratio  {buy_ratio:.0%}

─────────────────────────────────────────
### Baseline ({N-1} candles)
  Avg Volume  {mean_vol:,.2f} ± {std_vol:,.2f}
  Avg Close   {mean_close:,.4f} ± {std_close:,.4f}
  Avg Trades  {mean_trades:,.0f} ± {std_trades:,.0f}

{If futures:}
  Funding Rate (latest)  {latest_funding:.5f}
  Open Interest Δ        {oi_change_pct:+.2f}%

─────────────────────────────────────────
### Anomalies Detected
| Severity | Type | Signal |
|----------|------|--------|
| 🔴 CRITICAL | Volume Surge | Volume is 4.6σ above the {N-1}-period mean |
| 🟠 HIGH | Pump Signal | +4.2% candle · volume z=3.1 · buy ratio 78% |

{If no anomalies:}
  ✅ No statistical anomalies detected in the current candle.

─────────────────────────────────────────
> ⚠️ Statistical patterns only. Not financial advice.
> See full disclaimer: https://github.com/binance/binance-skills-hub
```

### Severity display rules

- 🔴 CRITICAL — Immediate attention warranted; pattern is statistically rare (≥ 4σ or multi-signal)
- 🟠 HIGH — Clear statistical deviation; corroborated by at least one secondary signal
- 🟡 MEDIUM — Notable deviation; may be noise at low volume or off-peak hours
- 🔵 LOW — Mild pattern; flag for awareness, do not alarm the user
- ✅ No anomaly — Show baseline stats so the user can verify what was checked

Always show the **Current Candle** and **Baseline** sections regardless of whether anomalies were found.

---

## Input Parameters

Infer as much as possible from the user's message before asking.

| Parameter | Default | Notes |
|-----------|---------|-------|
| `symbol` | — | **Required.** Ask if not stated. Uppercase (e.g. `BTCUSDT`) |
| `market` | `spot` | `spot` or `futures-usd-m` |
| `interval` | `1h` | Suggest `1h` for general use; `15m` for intraday; `4h` or `1d` for macro |
| `limit` | `200` | Minimum 50 for reliable z-scores. Maximum 1000 |

---

## Error Handling

| Error | Cause | Action |
|-------|-------|--------|
| `400` — `Invalid symbol` | Typo or delisted pair | Tell user; suggest checking https://www.binance.com/en/markets |
| `400` — `Invalid interval` | Bad interval string | List valid options |
| `400` — Futures: symbol not found | Pair not on USD-M Futures | Suggest trying Spot instead |
| `429 Too Many Requests` | Rate limit hit | Wait 1 s and retry once; inform user if still failing |
| `451` Geo-restricted | Region block | Inform user this data is unavailable in their region via Binance |
| Empty array `[]` | No data returned | Symbol may be inactive or parameters out of range |
| `stdev` = 0 | All baseline values identical (e.g. `limit=1`) | Ask user to increase `limit` to at least 50 |
| Futures OI history empty | Symbol too new | Skip OI divergence check; note it in output |

---

## Limitations

This skill does NOT:

- Place, cancel, or suggest orders
- Access private account data or authenticated endpoints
- Fetch on-chain activity or Web3 data
- Support Binance Coin-M Futures (Futures USD-M only)
- Provide predictions, price targets, or investment advice
- Poll or stream live data — call again to refresh

---

## Disclaimer

> This skill performs statistical analysis on public market data only.
> Output does not constitute financial, investment, or trading advice and must not be
> used as the sole basis for any trading decision.
> See the [Binance Skills Hub disclaimer](https://github.com/binance/binance-skills-hub)
> for full terms.
