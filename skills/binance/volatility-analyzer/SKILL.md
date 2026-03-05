---
title: Volatility Analyzer
description: Rank Binance Spot pairs by intraday volatility using 24hr range, body-to-wick ratio, and volume-weighted volatility scoring.
metadata:
  version: "1.0.0"
  author: mefai-dev
license: MIT
---

# Volatility Analyzer Skill

Rank all Binance Spot USDT pairs by intraday volatility metrics. Calculates 24hr high-low range, body-to-wick ratios, and volume-weighted volatility scores to identify the most active trading opportunities.

## Quick Reference

| Endpoint | Description | Required | Optional | Authentication |
|----------|-------------|----------|----------|----------------|
| `/api/v3/ticker/24hr` (GET) | 24hr ticker statistics | None | symbol, symbols, type | No |
| `/api/v3/ticker/tradingDay` (GET) | UTC trading day statistics | None | symbol, symbols, timeZone, type | No |

## API Details

### 24hr Ticker Statistics

**Endpoint:** `GET https://api.binance.com/api/v3/ticker/24hr`

Full 24hr rolling window statistics with high, low, open, close, and volume.

**Key Response Fields for Volatility:**

| Field | Type | Description |
|-------|------|-------------|
| highPrice | STRING | 24hr highest price |
| lowPrice | STRING | 24hr lowest price |
| openPrice | STRING | Period open price |
| lastPrice | STRING | Latest trade price |
| quoteVolume | STRING | Volume in quote asset (USDT) |
| priceChangePercent | STRING | Net price change % |
| count | INT | Number of trades |

### Trading Day Ticker

**Endpoint:** `GET https://api.binance.com/api/v3/ticker/tradingDay`

Statistics for the current UTC trading day (midnight to current time).

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| symbol | STRING | No | Single symbol |
| symbols | STRING | No | JSON array of symbols |
| timeZone | STRING | No | Timezone offset (default: UTC 0) |
| type | STRING | No | "FULL" or "MINI" |

## Computed Metrics

| Metric | Formula | Description |
|--------|---------|-------------|
| Range % | `(high - low) / low * 100` | Total price range as percentage |
| Body Size | `abs(close - open) / open * 100` | Net directional move |
| Wick Ratio | `(1 - bodySize/range) * 100` | Rejection/indecision percentage |
| Vol Score | `range * log10(volume)` | Volume-weighted volatility score |

## Use Cases

1. **Day Trading Selection**: Find pairs with highest intraday ranges for scalping
2. **Risk Assessment**: High volatility = higher reward potential but also higher risk
3. **Quiet Market Detection**: Low-range pairs may indicate accumulation/distribution
4. **Volume-Volatility Correlation**: High vol + high volume = strong directional move; high vol + low volume = noise

## Notes

- All calculations use the rolling 24hr window, not calendar day
- Use `tradingDay` endpoint for calendar-aligned statistics
- Volume filter recommended (> $500K) to exclude illiquid pairs
- Color coding: > 8% range = high risk, 4-8% = moderate, < 4% = low volatility
- Rate limits: 1200 requests per minute
