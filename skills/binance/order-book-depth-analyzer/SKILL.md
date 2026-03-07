---
title: Order Book Depth Analyzer
description: Analyze order book depth imbalances and detect whale walls on Binance Spot markets for identifying support/resistance levels and large trader activity.
metadata:
  version: "1.0.0"
  author: mefai-dev
license: MIT
---

# Order Book Depth Analyzer Skill

Analyze Binance Spot order book depth to detect bid/ask imbalances, whale walls (unusually large orders), and spread conditions. Provides insight into short-term supply/demand dynamics and potential support/resistance levels.

## Quick Reference

| Endpoint | Description | Required | Optional | Authentication |
|----------|-------------|----------|----------|----------------|
| `/api/v3/depth` (GET) | Order book depth | symbol | limit | No |
| `/api/v3/ticker/price` (GET) | Current price | None | symbol, symbols | No |

## API Details

### Order Book Depth

**Endpoint:** `GET https://api.binance.com/api/v3/depth`

Returns the full order book for a given symbol up to the specified depth limit.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| symbol | STRING | Yes | Trading pair (e.g., BTCUSDT) |
| limit | INT | No | Depth limit: 5, 10, 20, 50, 100, 500, 1000, 5000 (default: 100) |

**Example Request:**

```bash
curl "https://api.binance.com/api/v3/depth?symbol=BTCUSDT&limit=20"
```

**Response Fields:**

| Field | Type | Description |
|-------|------|-------------|
| lastUpdateId | LONG | Last update ID |
| bids | ARRAY | Bid orders `[[price, qty], ...]` sorted best to worst |
| asks | ARRAY | Ask orders `[[price, qty], ...]` sorted best to worst |

**Example Response:**

```json
{
  "lastUpdateId": 123456789,
  "bids": [
    ["72655.80", "4.667"],
    ["72655.70", "2.100"]
  ],
  "asks": [
    ["72655.90", "0.367"],
    ["72656.00", "1.500"]
  ]
}
```

## Computed Metrics

| Metric | Formula | Description |
|--------|---------|-------------|
| Bid Depth | `sum(bidPrice * bidQty)` | Total bid-side liquidity in USDT |
| Ask Depth | `sum(askPrice * askQty)` | Total ask-side liquidity in USDT |
| Imbalance % | `(bidDepth - askDepth) / total * 100` | Positive = bid dominant |
| Spread (bps) | `(bestAsk - bestBid) / bestAsk * 10000` | Trading cost |
| Whale Walls | Orders > 3x average size | Large order detection |

## Use Cases

1. **Support/Resistance**: Large bid walls suggest strong support; ask walls suggest resistance
2. **Imbalance Trading**: Bid-heavy books (> +20%) suggest buying pressure
3. **Whale Detection**: Orders 3x+ larger than average indicate institutional presence
4. **Spread Monitoring**: Tight spreads = liquid market, good for market orders

## Notes

- Depth limit 20 provides a good balance of speed and information
- Order book updates frequently; data is a snapshot at query time
- USDT-denominated depth calculated as `price * quantity` for each level
- Wall detection uses 3x average as threshold (configurable)
- Rate limits: 1200 requests per minute; higher limits (1000, 5000) cost more weight
