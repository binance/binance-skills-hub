---
title: Index Composition Tracker
description: View the composition and weight distribution of Binance composite futures indices like BTCDOMUSDT and DEFIUSDT.
metadata:
  version: "1.0.0"
  author: mefai-dev
license: MIT
---

# Index Composition Tracker Skill

Track Binance USDM Futures composite index constituents and their weight allocations. Provides visibility into index rebalancing and composition for indices like BTCDOMUSDT (Bitcoin Dominance) and DEFIUSDT (DeFi Index).

## Quick Reference

| Endpoint | Description | Required | Optional | Authentication |
|----------|-------------|----------|----------|----------------|
| `/fapi/v1/indexInfo` (GET) | Index price composition | None | symbol | No |

## API Details

### Index Info

**Endpoint:** `GET https://fapi.binance.com/fapi/v1/indexInfo`

Returns the composition of composite index futures, including constituent assets and their weight percentages.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| symbol | STRING | No | Index symbol (e.g., BTCDOMUSDT). Returns all indices if omitted |

**Example Request:**

```bash
curl "https://fapi.binance.com/fapi/v1/indexInfo"
```

**Response Fields:**

| Field | Type | Description |
|-------|------|-------------|
| symbol | STRING | Index symbol |
| time | LONG | Last update timestamp |
| component | STRING | Price component type (e.g., "quoteAsset") |
| baseAssetList | ARRAY | List of constituent assets |

**baseAssetList item fields:**

| Field | Type | Description |
|-------|------|-------------|
| baseAsset | STRING | Constituent asset symbol |
| quoteAsset | STRING | Quote asset |
| weightInQuantity | STRING | Weight factor by quantity |
| weightInPercentage | STRING | Percentage weight (0-1 scale) |

**Example Response:**

```json
[
  {
    "symbol": "BTCDOMUSDT",
    "time": 1772664877002,
    "component": "quoteAsset",
    "baseAssetList": [
      {
        "baseAsset": "BTC",
        "quoteAsset": "AAVE",
        "weightInQuantity": "0.02645900",
        "weightInPercentage": "0.00314600"
      },
      {
        "baseAsset": "BTC",
        "quoteAsset": "ADA",
        "weightInQuantity": "54.91",
        "weightInPercentage": "0.01543"
      }
    ]
  }
]
```

## Available Indices

| Symbol | Description |
|--------|-------------|
| BTCDOMUSDT | Bitcoin Dominance Index |
| DEFIUSDT | DeFi Composite Index |

## Use Cases

1. **Index Rebalancing Tracking**: Monitor weight changes to anticipate rebalancing trades
2. **Sector Analysis**: Understand which assets drive index price movement
3. **Correlation Study**: Map how individual asset changes affect index performance
4. **Portfolio Benchmarking**: Compare portfolio allocation against index weights

## Notes

- Index composition is updated periodically by Binance
- `weightInPercentage` is in decimal format (multiply by 100 for percentage)
- Not all futures pairs are index-based; most are single-asset perpetuals
- Rate limits: 1200 requests per minute
