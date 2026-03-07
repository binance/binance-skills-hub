---
title: Futures Analytics
description: |
  Query Binance USDM Futures public analytics data. Retrieve funding rates, open interest,
  long/short ratios, taker buy/sell volume, and mark prices for all perpetual contracts.
  No authentication required — all endpoints are public market data.
  Use this skill when users ask about derivatives sentiment, funding arbitrage, market positioning,
  or futures market analytics.
metadata:
  version: "1.0"
  author: mefai-dev
license: MIT
---

# Futures Analytics Skill

## Overview

Public market intelligence endpoints for Binance USDM Perpetual Futures. All endpoints are unauthenticated and return real-time derivatives analytics:

| API | Function | Use Case |
|-----|----------|----------|
| Premium Index | Mark price + funding rate | Funding arbitrage, fair price discovery |
| Open Interest | Current OI per symbol | Gauge market participation and leverage |
| Open Interest Statistics | Historical OI snapshots | Track OI trends over time |
| Global Long/Short Ratio | Account-level L/S ratio | Market sentiment, crowd positioning |
| Top Trader Long/Short (Position) | Top trader position ratio | Professional trader positioning |
| Top Trader Long/Short (Account) | Top trader account ratio | Professional trader count bias |
| Taker Buy/Sell Volume | Aggressive order flow | Detect buying/selling pressure |
| Funding Rate History | Historical funding rates | Funding trend analysis, carry trade |

## Use Cases

1. **Funding Arbitrage**: Find symbols with extreme funding rates — short-funded pairs for carry trade, long-funded pairs for contrarian entries
2. **Sentiment Analysis**: Combine L/S ratio + taker volume to gauge crowd positioning vs. smart money
3. **Leverage Monitoring**: Track open interest spikes that precede large liquidation cascades
4. **Top Trader Tracking**: Compare top trader positioning vs. global crowd to detect divergence
5. **Market Regime Detection**: Use multi-timeframe OI + funding + taker ratios to classify bull/bear/range regimes

## Base URL

```
https://fapi.binance.com
```

> All endpoints are public GET requests. No API key or signature required.

---

## API 1: Premium Index (Mark Price + Funding Rate)

### Method: GET

**URL**:
```
https://fapi.binance.com/fapi/v1/premiumIndex
```

**Request Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| symbol | string | No | Trading pair, e.g., `BTCUSDT`. Omit for all symbols |

**Example — Single Symbol**:
```bash
curl 'https://fapi.binance.com/fapi/v1/premiumIndex?symbol=BTCUSDT'
```

**Example — All Symbols**:
```bash
curl 'https://fapi.binance.com/fapi/v1/premiumIndex'
```

**Response (single)**:
```json
{
  "symbol": "BTCUSDT",
  "pair": "BTCUSDT",
  "markPrice": "94250.30000000",
  "indexPrice": "94245.81000000",
  "estimatedSettlePrice": "94238.52000000",
  "lastFundingRate": "0.00010000",
  "nextFundingTime": 1772640000000,
  "interestRate": "0.00010000",
  "time": 1772629800000
}
```

**Response Fields**:

| Field | Type | Description |
|-------|------|-------------|
| symbol | string | Trading pair |
| pair | string | Underlying pair |
| markPrice | string | Current mark price (fair price) |
| indexPrice | string | Spot index price (weighted average across exchanges) |
| estimatedSettlePrice | string | Estimated settlement price |
| lastFundingRate | string | Last funding rate (positive = longs pay shorts) |
| nextFundingTime | number | Next funding timestamp (ms) |
| interestRate | string | Interest rate component |
| time | number | Data timestamp (ms) |

### Funding Rate Interpretation

| Rate Range | Meaning | Trading Signal |
|------------|---------|----------------|
| > 0.03% | Extremely bullish crowd (longs pay a lot) | Contrarian short opportunity |
| 0.01% - 0.03% | Normal bullish | Neutral |
| -0.01% to 0.01% | Balanced | No signal |
| < -0.01% | Bearish crowd (shorts pay longs) | Contrarian long opportunity |

---

## API 2: Open Interest

### Method: GET

**URL**:
```
https://fapi.binance.com/fapi/v1/openInterest
```

**Request Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| symbol | string | Yes | Trading pair, e.g., `BTCUSDT` |

**Example**:
```bash
curl 'https://fapi.binance.com/fapi/v1/openInterest?symbol=BTCUSDT'
```

**Response**:
```json
{
  "symbol": "BTCUSDT",
  "openInterest": "72850.123",
  "time": 1772629800000
}
```

| Field | Type | Description |
|-------|------|-------------|
| symbol | string | Trading pair |
| openInterest | string | Current open interest in contracts (base asset) |
| time | number | Timestamp (ms) |

---

## API 3: Open Interest Statistics (Historical)

### Method: GET

**URL**:
```
https://futures.binance.com/futures/data/openInterestHist
```

**Request Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| symbol | string | Yes | Trading pair |
| period | string | Yes | Interval: `5m`, `15m`, `30m`, `1h`, `2h`, `4h`, `6h`, `12h`, `1d` |
| limit | integer | No | Number of records (default 30, max 500) |
| startTime | long | No | Start timestamp (ms) |
| endTime | long | No | End timestamp (ms) |

**Example**:
```bash
curl 'https://futures.binance.com/futures/data/openInterestHist?symbol=BTCUSDT&period=1h&limit=10'
```

**Response**:
```json
[
  {
    "symbol": "BTCUSDT",
    "sumOpenInterest": "72850.12300000",
    "sumOpenInterestValue": "6868050000.00000000",
    "timestamp": 1772625600000
  }
]
```

| Field | Type | Description |
|-------|------|-------------|
| symbol | string | Trading pair |
| sumOpenInterest | string | OI in base asset (e.g., BTC) |
| sumOpenInterestValue | string | OI in USD equivalent |
| timestamp | number | Snapshot timestamp (ms) |

---

## API 4: Global Long/Short Account Ratio

### Method: GET

**URL**:
```
https://futures.binance.com/futures/data/globalLongShortAccountRatio
```

**Request Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| symbol | string | Yes | Trading pair |
| period | string | Yes | Interval: `5m`, `15m`, `30m`, `1h`, `2h`, `4h`, `6h`, `12h`, `1d` |
| limit | integer | No | Number of records (default 30, max 500) |
| startTime | long | No | Start timestamp (ms) |
| endTime | long | No | End timestamp (ms) |

**Example**:
```bash
curl 'https://futures.binance.com/futures/data/globalLongShortAccountRatio?symbol=BTCUSDT&period=1h&limit=5'
```

**Response**:
```json
[
  {
    "symbol": "BTCUSDT",
    "longShortRatio": "1.8530",
    "longAccount": "0.6495",
    "shortAccount": "0.3505",
    "timestamp": 1772625600000
  }
]
```

| Field | Type | Description |
|-------|------|-------------|
| symbol | string | Trading pair |
| longShortRatio | string | Long/Short ratio (>1 = more longs) |
| longAccount | string | Fraction of accounts that are long (0-1) |
| shortAccount | string | Fraction of accounts that are short (0-1) |
| timestamp | number | Snapshot timestamp (ms) |

### Interpretation

| Ratio | Meaning |
|-------|---------|
| > 2.0 | Heavily crowded long — high liquidation risk |
| 1.2 - 2.0 | Moderately bullish |
| 0.8 - 1.2 | Balanced |
| < 0.8 | Heavily crowded short — potential short squeeze |

---

## API 5: Top Trader Long/Short Position Ratio

### Method: GET

**URL**:
```
https://futures.binance.com/futures/data/topLongShortPositionRatio
```

**Request Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| symbol | string | Yes | Trading pair |
| period | string | Yes | Interval: `5m`, `15m`, `30m`, `1h`, `2h`, `4h`, `6h`, `12h`, `1d` |
| limit | integer | No | Number of records (default 30, max 500) |
| startTime | long | No | Start timestamp (ms) |
| endTime | long | No | End timestamp (ms) |

**Example**:
```bash
curl 'https://futures.binance.com/futures/data/topLongShortPositionRatio?symbol=BTCUSDT&period=1h&limit=5'
```

**Response**:
```json
[
  {
    "symbol": "BTCUSDT",
    "longShortRatio": "1.3256",
    "longAccount": "0.5700",
    "shortAccount": "0.4300",
    "timestamp": 1772625600000
  }
]
```

| Field | Type | Description |
|-------|------|-------------|
| symbol | string | Trading pair |
| longShortRatio | string | Top trader position L/S ratio by value |
| longAccount | string | Long position fraction (by notional) |
| shortAccount | string | Short position fraction (by notional) |
| timestamp | number | Snapshot timestamp (ms) |

> **Note**: "Top traders" = top 20% of traders by open interest on Binance Futures. Position ratio is weighted by notional value, not account count.

---

## API 6: Top Trader Long/Short Account Ratio

### Method: GET

**URL**:
```
https://futures.binance.com/futures/data/topLongShortAccountRatio
```

**Request Parameters**: Same as API 5 (symbol, period, limit, startTime, endTime).

**Example**:
```bash
curl 'https://futures.binance.com/futures/data/topLongShortAccountRatio?symbol=ETHUSDT&period=4h&limit=5'
```

**Response**: Same structure as API 5, but ratio is by account count (not position size).

> **Tip**: Compare Position Ratio (API 5) vs. Account Ratio (API 6). If position ratio is long but account ratio is short, large traders are long while small traders are short — a bullish divergence signal.

---

## API 7: Taker Buy/Sell Volume

### Method: GET

**URL**:
```
https://futures.binance.com/futures/data/takerlongshortRatio
```

**Request Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| symbol | string | Yes | Trading pair |
| period | string | Yes | Interval: `5m`, `15m`, `30m`, `1h`, `2h`, `4h`, `6h`, `12h`, `1d` |
| limit | integer | No | Number of records (default 30, max 500) |
| startTime | long | No | Start timestamp (ms) |
| endTime | long | No | End timestamp (ms) |

**Example**:
```bash
curl 'https://futures.binance.com/futures/data/takerlongshortRatio?symbol=BTCUSDT&period=1h&limit=5'
```

**Response**:
```json
[
  {
    "buySellRatio": "0.9560",
    "buyVol": "12500.340",
    "sellVol": "13078.120",
    "timestamp": 1772625600000
  }
]
```

| Field | Type | Description |
|-------|------|-------------|
| buySellRatio | string | Taker buy/sell ratio (<1 = more aggressive selling) |
| buyVol | string | Taker buy volume (contracts, base asset) |
| sellVol | string | Taker sell volume (contracts, base asset) |
| timestamp | number | Snapshot timestamp (ms) |

> **Interpretation**: Taker orders are aggressive orders that immediately execute against the order book. High taker buy volume = aggressive buying pressure. A sustained ratio < 0.8 often precedes further downside.

---

## API 8: Funding Rate History

### Method: GET

**URL**:
```
https://fapi.binance.com/fapi/v1/fundingRate
```

**Request Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| symbol | string | No | Trading pair (omit for all) |
| startTime | long | No | Start timestamp (ms) |
| endTime | long | No | End timestamp (ms) |
| limit | integer | No | Number of records (default 100, max 1000) |

**Example**:
```bash
curl 'https://fapi.binance.com/fapi/v1/fundingRate?symbol=BTCUSDT&limit=5'
```

**Response**:
```json
[
  {
    "symbol": "BTCUSDT",
    "fundingTime": 1772611200000,
    "fundingRate": "0.00010000",
    "markPrice": "94180.50000000"
  }
]
```

| Field | Type | Description |
|-------|------|-------------|
| symbol | string | Trading pair |
| fundingTime | number | Funding settlement timestamp (ms) |
| fundingRate | string | Funding rate at settlement |
| markPrice | string | Mark price at settlement time |

> **Note**: Binance settles funding every 8 hours (00:00, 08:00, 16:00 UTC). Funding rate × position size = payment. Positive rate means longs pay shorts.

---

## Multi-Symbol Screening

### Get Funding Rates for All Symbols

Use the Premium Index endpoint without a symbol parameter to get all USDM perpetual funding rates in one call:

```bash
curl 'https://fapi.binance.com/fapi/v1/premiumIndex'
```

This returns an array of 200+ symbols with their current funding rates, mark prices, and next funding time. Useful for:

- **Funding Arbitrage Scanning**: Find highest/lowest funding rates across all pairs
- **Market Heatmap**: Visualize funding rate distribution across the market
- **Carry Trade**: Identify pairs with consistently positive/negative funding

---

## Analytical Recipes

### Recipe 1: Funding Arbitrage Detection

1. Call Premium Index (all symbols) — find symbols with `|lastFundingRate| > 0.03%`
2. For extreme symbols, call Global L/S Ratio — confirm crowd positioning
3. If funding > 0.03% AND longAccount > 0.65 → crowded long, potential short entry
4. If funding < -0.03% AND shortAccount > 0.65 → crowded short, potential long entry

### Recipe 2: Liquidation Cascade Warning

1. Call Open Interest Statistics (1h, limit=24) — check for OI spike > 10% in 4h
2. Call Global L/S Ratio — if ratio > 2.0 (extremely crowded)
3. Call Taker Volume — if sellVol rapidly increasing
4. Combination = high probability of long liquidation cascade

### Recipe 3: Smart Money Divergence

1. Call Top Trader Position Ratio — get professional positioning
2. Call Global L/S Ratio — get retail positioning
3. If top traders are short but global is long → professionals fading the crowd (bearish)
4. If top traders are long but global is short → professionals accumulating against crowd (bullish)

---

## Rate Limits

All public endpoints share a weight-based rate limit:
- Default: 2400 request weight per minute per IP
- Each endpoint above uses 1 weight per call
- Premium Index (all symbols) uses 10 weight

## Notes

1. All timestamps are in milliseconds (Unix epoch)
2. All numeric values are returned as strings — parse to float/decimal when computing
3. Funding rates are per-period (8 hours), not annualized. Annualized = rate × 3 × 365
4. Open interest is in base asset units (e.g., BTC for BTCUSDT), not USD
5. Historical data endpoints (`/futures/data/*`) may have up to 5 minutes delay
6. Period options for analytics endpoints: `5m`, `15m`, `30m`, `1h`, `2h`, `4h`, `6h`, `12h`, `1d`
