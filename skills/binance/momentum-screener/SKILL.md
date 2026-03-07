---
title: Momentum Screener
description: Screen Binance Spot market for momentum signals using 24hr price statistics, VWAP distance, and range position analysis.
metadata:
  version: "1.0.0"
  author: mefai-dev
license: MIT
---

# Momentum Screener Skill

Screen all Binance Spot USDT pairs for momentum signals derived from 24hr ticker statistics. Combines price change percentage, position within the daily range, and VWAP distance to generate a composite momentum score.

## Quick Reference

| Endpoint | Description | Required | Optional | Authentication |
|----------|-------------|----------|----------|----------------|
| `/api/v3/ticker/24hr` (GET) | 24hr ticker statistics | None | symbol, symbols, type | No |
| `/api/v3/ticker` (GET) | Rolling window statistics | None | symbol, symbols, windowSize, type | No |

## API Details

### 24hr Ticker Statistics

**Endpoint:** `GET https://api.binance.com/api/v3/ticker/24hr`

Returns 24hr price change statistics for all symbols (or specified ones).

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| symbol | STRING | No | Single symbol |
| symbols | STRING | No | JSON array of symbols |
| type | STRING | No | "FULL" (default) or "MINI" |

**Response Fields:**

| Field | Type | Description |
|-------|------|-------------|
| symbol | STRING | Trading pair |
| priceChangePercent | STRING | 24hr price change % |
| lastPrice | STRING | Latest trade price |
| highPrice | STRING | 24hr high |
| lowPrice | STRING | 24hr low |
| weightedAvgPrice | STRING | Volume-weighted average price (VWAP) |
| quoteVolume | STRING | 24hr volume in quote asset |
| openPrice | STRING | Opening price |
| count | INT | Number of trades |

### Rolling Window Ticker

**Endpoint:** `GET https://api.binance.com/api/v3/ticker`

Supports custom time windows (1m to 7d) for flexible momentum analysis.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| windowSize | STRING | No | Time window: 1m-59m, 1h-23h, 1d-7d (default: 1d) |
| symbol | STRING | No | Single symbol |
| symbols | STRING | No | JSON array of symbols |

## Computed Metrics

| Metric | Formula | Description |
|--------|---------|-------------|
| Range Position | `(price - low) / (high - low) * 100` | Where price sits in 24h range (0-100%) |
| VWAP Distance | `(price - vwap) / vwap * 100` | Distance from volume-weighted average |
| Momentum Score | `change*0.4 + (rangePos-50)*0.03 + vwapDist*0.3` | Composite momentum indicator |

## Use Cases

1. **Trend Screening**: Filter coins with strong positive or negative momentum scores
2. **Mean Reversion**: Find coins at extreme range positions (near high/low of day)
3. **VWAP Analysis**: Price above VWAP = bullish bias; below = bearish bias
4. **Multi-Timeframe**: Compare 1h, 4h, 1d windows for confluence signals

## Notes

- Returns 100+ USDT pairs when called without symbol filter
- The `weightedAvgPrice` field provides true VWAP for the 24hr window
- `count` field helps assess trade activity level
- Rate limits: 1200 requests per minute (6000 for ticker/24hr)
