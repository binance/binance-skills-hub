---
title: Derivatives Sentiment Convergence Engine
description: Combine 6 independent derivatives sentiment indicators into a single convergence score to identify high-conviction trading signals. Cross-references retail vs. whale positioning, taker order flow, funding rates, and open interest changes to detect when multiple signals align or diverge.
metadata:
  version: "1.0.0"
  author: mefai-dev
license: MIT
---

# Derivatives Sentiment Convergence Engine

## Overview

The Derivatives Sentiment Convergence Engine aggregates 6 independent sentiment data sources from Binance USDM Futures into a composite score. Instead of analyzing each indicator in isolation, this skill detects when multiple signals converge (high-conviction setup) or diverge (smart money vs. retail disagreement).

The 6 sentiment sources:

1. **Global Long/Short Account Ratio** — All traders' positioning
2. **Top Trader Long/Short Account Ratio** — Top 20% by margin balance
3. **Top Trader Long/Short Position Ratio** — Top 20% weighted by position size
4. **Taker Buy/Sell Volume Ratio** — Actual order flow aggression
5. **Funding Rate** — Market's directional bias (longs vs shorts paying)
6. **Open Interest Change** — Position conviction (growing = conviction, shrinking = unwinding)

## API Reference

### 1. Global Long/Short Account Ratio

- **URL:** `GET https://fapi.binance.com/futures/data/globalLongShortAccountRatio`
- **Auth:** None (Public)

| Parameter | Type   | Required | Description                           |
|-----------|--------|----------|---------------------------------------|
| symbol    | STRING | Yes      | e.g., BTCUSDT                        |
| period    | STRING | Yes      | 5m, 15m, 30m, 1h, 2h, 4h, 6h, 12h, 1d |
| limit     | INT    | No       | Default 30, max 500                   |

```bash
curl "https://fapi.binance.com/futures/data/globalLongShortAccountRatio?symbol=BTCUSDT&period=1h&limit=1"
```

```json
[{"symbol":"BTCUSDT","longShortRatio":"0.8103","longAccount":"0.4476","shortAccount":"0.5524","timestamp":1772661600000}]
```

### 2. Top Trader Long/Short Account Ratio

- **URL:** `GET https://fapi.binance.com/futures/data/topLongShortAccountRatio`

Same parameters as above. Measures top 20% of traders by margin balance.

```bash
curl "https://fapi.binance.com/futures/data/topLongShortAccountRatio?symbol=BTCUSDT&period=1h&limit=1"
```

```json
[{"symbol":"BTCUSDT","longShortRatio":"0.9051","longAccount":"0.4751","shortAccount":"0.5249","timestamp":1772661600000}]
```

### 3. Top Trader Long/Short Position Ratio

- **URL:** `GET https://fapi.binance.com/futures/data/topLongShortPositionRatio`

Same parameters. Weighted by actual position size, not just account count.

```bash
curl "https://fapi.binance.com/futures/data/topLongShortPositionRatio?symbol=BTCUSDT&period=1h&limit=1"
```

```json
[{"symbol":"BTCUSDT","longShortRatio":"1.0530","longAccount":"0.5129","shortAccount":"0.4871","timestamp":1772661600000}]
```

### 4. Taker Buy/Sell Volume Ratio

- **URL:** `GET https://fapi.binance.com/futures/data/takerlongshortRatio`

| Parameter | Type   | Required | Description                           |
|-----------|--------|----------|---------------------------------------|
| symbol    | STRING | Yes      | e.g., BTCUSDT                        |
| period    | STRING | Yes      | 5m, 15m, 30m, 1h, 2h, 4h, 6h, 12h, 1d |
| limit     | INT    | No       | Default 30, max 500                   |

```bash
curl "https://fapi.binance.com/futures/data/takerlongshortRatio?symbol=BTCUSDT&period=1h&limit=1"
```

```json
[{"buySellRatio":"0.8065","sellVol":"3552.9850","buyVol":"2865.4450","timestamp":1772661600000}]
```

### 5. Premium Index (Funding Rate)

- **URL:** `GET https://fapi.binance.com/fapi/v1/premiumIndex`

```bash
curl "https://fapi.binance.com/fapi/v1/premiumIndex?symbol=BTCUSDT"
```

Returns `lastFundingRate`, `markPrice`, `indexPrice`, `nextFundingTime`.

### 6. Historical Open Interest

- **URL:** `GET https://fapi.binance.com/futures/data/openInterestHist`

| Parameter | Type   | Required | Description                           |
|-----------|--------|----------|---------------------------------------|
| symbol    | STRING | Yes      | e.g., BTCUSDT                        |
| period    | STRING | Yes      | 5m, 15m, 30m, 1h, 2h, 4h, 6h, 12h, 1d |
| limit     | INT    | No       | Default 30, max 500                   |

```bash
curl "https://fapi.binance.com/futures/data/openInterestHist?symbol=BTCUSDT&period=1h&limit=2"
```

```json
[
  {"symbol":"BTCUSDT","sumOpenInterest":"75234.123","sumOpenInterestValue":"5471234567.89","timestamp":1772658000000},
  {"symbol":"BTCUSDT","sumOpenInterest":"75891.456","sumOpenInterestValue":"5521987654.32","timestamp":1772661600000}
]
```

## Convergence Score Calculation

### Step 1: Normalize Each Signal (-1 to +1)

Each indicator is normalized to a range of -1 (bearish) to +1 (bullish):

```
retailSignal    = clamp((longShortRatio - 1) × 5, -1, +1)
topAcctSignal   = clamp((topAcctLSRatio - 1) × 5, -1, +1)
topPosSignal    = clamp((topPosLSRatio - 1) × 5, -1, +1)
takerSignal     = clamp((buySellRatio - 1) × 5, -1, +1)
fundingSignal   = clamp(fundingRate × 10000, -1, +1)
oiSignal        = clamp((latestOI / prevOI - 1) × 50, -1, +1)
```

### Step 2: Calculate Composite

```
avgSignal = mean(all 6 signals)
agreement = max(count(signals > 0.05), count(signals < -0.05)) / 6
convergence = |avgSignal| × agreement
```

### Step 3: Smart vs Retail Divergence

```
smartAvg = (topAcctSignal + topPosSignal) / 2
divergence = smartAvg - retailSignal
```

When `divergence > 0.5`: Smart money is more bullish than retail.
When `divergence < -0.5`: Smart money is more bearish than retail.

## Use Cases

1. **High-Conviction Entries**: When all 6 signals align in the same direction (convergence > 0.5), the signal has high conviction and historically tends to predict short-term price direction.

2. **Smart Money vs Retail Divergence**: When top traders' positioning diverges from retail, it often signals an upcoming reversal. Smart money tends to be right more often on larger timeframes.

3. **Contrarian Signals**: When retail is overwhelmingly positioned in one direction but taker flow shows the opposite, a squeeze may be imminent.

4. **Risk Management**: Low convergence (signals disagreeing) suggests uncertain conditions where position sizes should be reduced.

5. **Funding Rate Confirmation**: Combining funding rate direction with actual position data confirms whether the funding rate reflects genuine market positioning or is being manipulated.

## Notes

- The `topLongShortAccountRatio` measures the top 20% by margin balance (account count), while `topLongShortPositionRatio` weights by actual position size — these can diverge when a few large accounts hold outsized positions
- Taker buy/sell ratio is the most actionable short-term signal as it measures actual order flow, not just positioning
- OI change combined with price direction reveals whether moves are driven by new positions (conviction) or liquidations (forced)
- All `/futures/data/` endpoints support periods from 5m to 1d; use shorter periods for intraday signals and longer for swing trading
- Historical data is available for the last 30 days on all endpoints
