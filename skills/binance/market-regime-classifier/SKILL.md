---
title: Market Regime Classifier
description: Multi-factor market regime classification engine that analyzes trend strength, volatility, and volume dynamics to classify the current market state of each pair as Trending, Ranging, Volatile Breakout, or Low Activity, helping traders select the right strategy for current conditions.
metadata:
  version: "1.0.0"
  author: mefai-dev
license: MIT
---

# Market Regime Classifier

Quantitative market regime detection engine that classifies each of 12 major Binance pairs into one of four market states using three independent indicators: ADX (trend strength), ATR ratio (volatility), and volume trend. Tells traders not just WHAT is happening, but WHAT TYPE of market they are in — so they can apply the right strategy for current conditions.

## Quick Reference

| Endpoint | Description | Required | Optional | Authentication |
|----------|-------------|----------|----------|----------------|
| `/api/v3/klines` (GET) | Kline/Candlestick data | symbol, interval | startTime, endTime, limit | No |
| `/fapi/v1/premiumIndex` (GET) | Premium index / Funding rate | None | symbol | No |

## Parameters

### Spot Klines
* **symbol**: Trading pair (e.g., BTCUSDT)
* **interval**: Candlestick interval — `1h`
* **limit**: Number of candles — `168` (7 days of hourly data)

### Premium Index
* **symbol**: Trading pair (e.g., BTCUSDT)

## Pairs Analyzed

BTCUSDT, ETHUSDT, BNBUSDT, SOLUSDT, XRPUSDT, DOGEUSDT, ADAUSDT, AVAXUSDT, LINKUSDT, SUIUSDT, APTUSDT, ARBUSDT

## Market Regimes

| Regime | ADX | ATR Ratio | Volume | Description | Recommended Strategy |
|--------|-----|-----------|--------|-------------|---------------------|
| Trending | >25 | Any | Rising | Strong directional movement | Trend following, breakout entries |
| Ranging | <20 | Low (<1.0) | Flat/Declining | Price contained in range | Mean reversion, range trading |
| Volatile Breakout | >20 | High (>1.5) | Surging | High volatility with expanding range | Momentum, wide stops |
| Low Activity | <15 | Low (<0.8) | Declining | Dead market, minimal movement | Avoid or reduce position size |

## How It Works

1. For each of 12 pairs, fetches 168 hourly candles (7 days) via `/api/v3/klines`
2. **ADX Calculation** (Average Directional Index):
   - Calculates +DI and -DI from directional movement
   - Smooths using 14-period Wilder's method
   - ADX = 14-period smoothed average of DX
   - ADX > 25 = trending, ADX < 20 = non-trending
3. **ATR Ratio** (volatility regime):
   - Calculates 14-period ATR (Average True Range)
   - Compares recent 7-period ATR to full 14-period ATR
   - Ratio > 1.5 = expanding volatility, < 0.8 = contracting
4. **Volume Trend**:
   - Compares recent 24h average volume to 7-day average
   - Rising = volume expanding, declining = volume contracting
5. **Funding Rate Context** (from `/fapi/v1/premiumIndex`):
   - Extreme funding confirms directional conviction in trending regimes
   - Near-zero funding in trending regime = early trend (stronger signal)
6. Classifies each pair into one of 4 regimes based on indicator combination
7. Provides regime-specific strategy recommendation

## Indicator Details

### ADX (Trend Strength)
- Measures trend STRENGTH, not direction
- 0-15: No trend (dead market)
- 15-25: Weak trend developing
- 25-50: Strong trend
- 50+: Very strong trend (rare, usually major moves)

### ATR Ratio (Volatility)
- Recent ATR / Average ATR
- <0.8: Volatility contracting (compression before breakout or continuation of range)
- 0.8-1.2: Normal volatility
- >1.5: Volatility expanding (breakout or panic)

### Volume Trend
- 24h avg volume / 7d avg volume
- >1.3: Volume surging (confirms moves)
- 0.7-1.3: Normal
- <0.7: Volume dying (fakeout risk)

## Output

| Output | Description |
|--------|-------------|
| Regime Cards | Each pair displayed with current regime badge, color-coded |
| Regime Distribution | Pie/bar chart: how many pairs in each regime |
| Indicator Dashboard | ADX, ATR ratio, volume trend for each pair |
| Strategy Guide | Regime-specific trading strategy recommendations |
| Regime Shifts | Pairs that recently changed regime (last 24h) |
| Funding Context | Funding rate overlay for trending pairs |

## Regime Colors

| Regime | Color | Icon |
|--------|-------|------|
| Trending | Green | Arrow up/down |
| Ranging | Blue | Horizontal arrows |
| Volatile Breakout | Red | Lightning bolt |
| Low Activity | Gray | Pause icon |

## Refresh

Auto-refreshes every 5 minutes.

## Use Cases

- **Strategy Selection**: Know whether to trend-follow, mean-revert, or sit out — before placing a trade
- **Risk Management**: Adjust position sizing based on current volatility regime
- **Opportunity Scanning**: Quickly identify which pairs are trending (actionable) vs ranging (wait)
- **Breakout Detection**: Volatile breakout regime often signals the start of major moves
- **Educational**: Teaches traders that one strategy does not fit all market conditions
- **Portfolio Rotation**: Allocate more capital to trending pairs, less to low-activity pairs
