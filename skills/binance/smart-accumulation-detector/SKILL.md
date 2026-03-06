---
title: Smart Accumulation Detector
description: Detects stealth institutional accumulation using a 4-factor composite scoring model combining volume surge, open interest buildup, price stability with near-zero funding, and taker buy aggression across 12 major pairs.
metadata:
  version: "1.0.0"
  author: mefai-dev
license: MIT
---

# Smart Accumulation Detector

Multi-factor institutional accumulation detection engine that identifies stealth buying activity before price moves. Combines 4 independent signals from Binance Spot and Futures APIs into a composite 0-100 score across 12 major pairs.

## Quick Reference

| Endpoint | Description | Required | Optional | Authentication |
|----------|-------------|----------|----------|----------------|
| `/api/v3/klines` (GET) | Kline/Candlestick data | symbol, interval | startTime, endTime, limit | No |
| `/futures/data/openInterestHist` (GET) | Open interest history | symbol, period | limit | No |
| `/fapi/v1/premiumIndex` (GET) | Premium index / Funding rate | None | symbol | No |
| `/futures/data/takerlongshortRatio` (GET) | Taker buy/sell volume ratio | symbol, period | limit | No |

## Parameters

### Spot Klines
* **symbol**: Trading pair (e.g., BTCUSDT)
* **interval**: Candlestick interval — `4h`
* **limit**: Number of candles — `30`

### Open Interest History
* **symbol**: Trading pair (e.g., BTCUSDT)
* **period**: Data period — `4h`
* **limit**: Number of data points — `30`

### Premium Index
* **symbol**: Trading pair (e.g., BTCUSDT)

### Taker Buy/Sell Ratio
* **symbol**: Trading pair (e.g., BTCUSDT)
* **period**: Data period — `4h`

## Pairs Scanned

BTCUSDT, ETHUSDT, SOLUSDT, BNBUSDT, XRPUSDT, DOGEUSDT, ADAUSDT, AVAXUSDT, LINKUSDT, SUIUSDT, APTUSDT, ARBUSDT

## Scoring Model

4 independent sub-scores combined into a composite 0-100:

| Sub-Score | Range | Signal | Data Source |
|-----------|-------|--------|-------------|
| Volume Surge | 0-25 | Recent volume vs 20-period average | `/api/v3/klines` |
| OI Buildup | 0-25 | Open interest increasing trend (new positions opening) | `/futures/data/openInterestHist` |
| Stealth Mode | 0-25 | Price stability + near-zero funding (not FOMO-driven) | `/api/v3/klines` + `/fapi/v1/premiumIndex` |
| Buyer Aggression | 0-25 | Taker buy ratio > 1 (aggressive market buyers) | `/futures/data/takerlongshortRatio` |

## How It Works

1. For each of 12 pairs, fetches 4 data sources in parallel
2. **Volume Surge**: Compares last 3 candles average volume to 20-period average. Higher ratio = higher score
3. **OI Buildup**: Compares recent 5-period OI average to early 5-period average. Growth indicates new position opening
4. **Stealth Mode**: Low price coefficient of variation (stability) + funding rate near zero (not crowded). Split 12.5 + 12.5
5. **Buyer Aggression**: Taker buy/sell ratio > 1 indicates aggressive buying. Scoring starts at ratio > 0.9
6. Composite = sum of 4 sub-scores (0-100)
7. Pairs ranked by composite score

## Score Interpretation

| Composite Score | Classification | Visual |
|----------------|---------------|--------|
| 70-100 | Active Accumulation | Red highlight |
| 40-69 | Early Signs | Yellow highlight |
| 0-39 | Quiet | Gray |

## Output

| Output | Description |
|--------|-------------|
| Top 4 Cards | Highest scoring pairs with composite score and sub-score breakdown bars |
| Stats | Total pairs scanned, active accumulation count, early signs count |
| Sortable Table | All pairs with composite score, 4 sub-scores, price, 24h change |
| Legend | Color-coded guide to sub-score categories |

## Refresh

Auto-refreshes every 60 seconds.

## Binance Exclusive Data

This skill uses two **Binance-exclusive endpoints** not available on other exchanges:
- `/futures/data/takerlongshortRatio` — Taker buy/sell volume ratio
- `/futures/data/openInterestHist` — Historical open interest data

This provides unique accumulation intelligence that cannot be replicated on Bybit, OKX, or any other exchange.

## Use Cases

- Detect institutional accumulation before price breakouts
- Identify pairs where smart money is quietly building positions
- Filter out FOMO-driven moves (high funding = not stealth accumulation)
- Cross-reference volume surge with OI buildup for high-conviction setups
