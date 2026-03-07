---
title: Open Interest Analytics
description: Track historical open interest changes across Binance USDM Futures to detect unusual position buildup or liquidation events.
metadata:
  version: "1.0.0"
  author: mefai-dev
license: MIT
---

# Open Interest Analytics Skill

Monitor historical open interest data for Binance USDM Futures pairs. Detects sudden OI surges or drops that may signal large position entries, liquidation cascades, or smart money accumulation. Combines with price data to identify OI-price divergences.

## Quick Reference

| Endpoint | Description | Required | Optional | Authentication |
|----------|-------------|----------|----------|----------------|
| `/futures/data/openInterestHist` (GET) | Historical open interest | symbol, period | limit, startTime, endTime | No |
| `/fapi/v1/openInterest` (GET) | Current open interest | symbol | None | No |
| `/fapi/v1/ticker/24hr` (GET) | 24hr futures ticker | None | symbol | No |

## API Details

### Historical Open Interest

**Endpoint:** `GET https://fapi.binance.com/futures/data/openInterestHist`

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
curl "https://fapi.binance.com/futures/data/openInterestHist?symbol=BTCUSDT&period=1h&limit=5"
```

**Response Fields:**

| Field | Type | Description |
|-------|------|-------------|
| symbol | STRING | Trading pair |
| sumOpenInterest | STRING | Total open interest in base asset |
| sumOpenInterestValue | STRING | Total open interest in USDT |
| CMCCirculatingSupply | STRING | Circulating supply from CMC |
| timestamp | LONG | Data point timestamp |

**Example Response:**

```json
[
  {
    "symbol": "BTCUSDT",
    "sumOpenInterest": "91762.534",
    "sumOpenInterestValue": "6703528396.302",
    "CMCCirculatingSupply": "19997462.0",
    "timestamp": 1772658000000
  }
]
```

### Current Open Interest

**Endpoint:** `GET https://fapi.binance.com/fapi/v1/openInterest`

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| symbol | STRING | Yes | Trading pair |

**Response:**

```json
{
  "symbol": "BTCUSDT",
  "openInterest": "91641.836",
  "time": 1772664862510
}
```

## Use Cases

1. **Surge Detection**: OI increase > 3% in 1h often precedes volatile moves
2. **Divergence Alerts**: OI rising while price drops = potential short squeeze setup
3. **Liquidation Detection**: Sudden OI drops indicate forced position closures
4. **Cross-Asset Comparison**: Compare OI changes across multiple pairs to find unusual activity

## Notes

- Historical data goes back approximately 30 days
- `sumOpenInterestValue` provides USD-denominated OI regardless of contract denomination
- Best used in 1h or 4h periods for meaningful trend detection
- Rate limits: 1200 requests per minute
