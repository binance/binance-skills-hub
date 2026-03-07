---
title: Taker Buy Sell Ratio
description: Monitor taker buy/sell volume ratios across Binance USDM Futures to identify aggressive buying or selling pressure in real-time.
metadata:
  version: "1.0.0"
  author: mefai-dev
license: MIT
---

# Taker Buy/Sell Ratio Skill

Analyze taker buy vs sell volume ratios across Binance USDM Futures pairs. Identifies which side (buyers or sellers) is more aggressive, providing insights into short-term directional pressure. Combines with 24hr ticker data for volume context.

## Quick Reference

| Endpoint | Description | Required | Optional | Authentication |
|----------|-------------|----------|----------|----------------|
| `/futures/data/takerlongshortRatio` (GET) | Taker buy/sell volume ratio | symbol, period | limit, startTime, endTime | No |
| `/fapi/v1/ticker/24hr` (GET) | 24hr futures ticker stats | None | symbol | No |

## API Details

### Taker Long/Short Ratio

Returns the ratio of taker buy volume to taker sell volume for a given symbol and time period.

**Endpoint:** `GET https://fapi.binance.com/futures/data/takerlongshortRatio`

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| symbol | STRING | Yes | Trading pair (e.g., BTCUSDT) |
| period | STRING | Yes | Time period: 5m, 15m, 30m, 1h, 2h, 4h, 6h, 12h, 1d |
| limit | INT | No | Number of records (default 30, max 500) |
| startTime | LONG | No | Start timestamp in ms |
| endTime | LONG | No | End timestamp in ms |

**Example Request:**

```bash
curl "https://fapi.binance.com/futures/data/takerlongshortRatio?symbol=BTCUSDT&period=1h&limit=5"
```

**Response Fields:**

| Field | Type | Description |
|-------|------|-------------|
| buySellRatio | STRING | Ratio of taker buy to sell volume |
| buyVol | STRING | Taker buy volume in contracts |
| sellVol | STRING | Taker sell volume in contracts |
| timestamp | LONG | Data point timestamp |

**Example Response:**

```json
[
  {
    "buySellRatio": "1.4013",
    "sellVol": "2777.638",
    "buyVol": "3892.253",
    "timestamp": 1772658000000
  }
]
```

### 24hr Ticker Statistics

**Endpoint:** `GET https://fapi.binance.com/fapi/v1/ticker/24hr`

Returns 24hr price change and volume statistics. When called without a symbol, returns data for all trading pairs.

## Use Cases

1. **Pressure Detection**: Ratio > 1.1 indicates aggressive buying; < 0.9 indicates aggressive selling
2. **Divergence Analysis**: Compare taker pressure direction with price movement to find potential reversals
3. **Multi-Asset Screening**: Scan all major futures pairs simultaneously to find the most one-sided markets
4. **Volume Confirmation**: Cross-reference taker ratios with total volume to validate signal strength

## Notes

- Data is available for USDM Futures pairs only
- Historical data available with startTime/endTime parameters
- Rate limits: 1200 requests per minute (IP-based)
- The ratio is calculated from taker trades, providing directional intent signal
