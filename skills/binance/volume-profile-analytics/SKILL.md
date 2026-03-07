---
title: Volume Profile Analytics
description: Analyze volume distribution between Binance Spot and Futures markets to identify speculative activity and institutional flow patterns.
metadata:
  version: "1.0.0"
  author: mefai-dev
license: MIT
---

# Volume Profile Analytics Skill

Compare 24hr trading volume between Binance Spot and USDM Futures markets. Calculates the futures-to-spot volume ratio, VWAP distance, and total market volume to identify speculative activity levels and institutional positioning.

## Quick Reference

| Endpoint | Description | Required | Optional | Authentication |
|----------|-------------|----------|----------|----------------|
| `/api/v3/ticker/24hr` (GET) | Spot 24hr ticker stats | None | symbol, symbols, type | No |
| `/fapi/v1/ticker/24hr` (GET) | Futures 24hr ticker stats | None | symbol | No |

## API Details

### Spot 24hr Ticker

**Endpoint:** `GET https://api.binance.com/api/v3/ticker/24hr`

**Key Volume Fields:**

| Field | Type | Description |
|-------|------|-------------|
| volume | STRING | 24hr volume in base asset |
| quoteVolume | STRING | 24hr volume in quote asset (USDT) |
| weightedAvgPrice | STRING | Volume-weighted average price |
| count | INT | Total number of trades |

### Futures 24hr Ticker

**Endpoint:** `GET https://fapi.binance.com/fapi/v1/ticker/24hr`

**Key Volume Fields:**

| Field | Type | Description |
|-------|------|-------------|
| volume | STRING | 24hr volume in contracts |
| quoteVolume | STRING | 24hr volume in USDT |
| count | INT | Total number of trades |

## Computed Metrics

| Metric | Formula | Description |
|--------|---------|-------------|
| Fut/Spot Ratio | `futuresVolume / spotVolume` | Speculative activity level |
| Total Volume | `spotVol + futVol` | Combined market activity |
| Avg Trade Size | `volume / tradeCount` | Institutional vs retail indicator |
| VWAP Distance | `(price - vwap) / vwap * 100` | Price vs fair value |

## Use Cases

1. **Speculation Detection**: Fut/Spot ratio > 5x indicates highly leveraged/speculative market
2. **Institutional Flow**: Large average trade sizes suggest institutional participation
3. **Market Health**: Balanced spot/futures volume = healthy market; extreme ratios = fragile
4. **VWAP Analysis**: Price far above VWAP = overextended; below = potential value

## Notes

- Spot tickers return 100+ high-volume USDT pairs
- Futures tickers return 500+ perpetual contract stats
- Cross-referencing both provides complete volume picture
- Average trade size computation requires both volume and trade count
- Rate limits: 1200 requests per minute (separate for spot and futures)
