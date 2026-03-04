---
name: product-explorer
description: Binance product and asset explorer. Uses the public product list API to browse all trading products with live prices, circulating supply, quote volume, and metadata.
metadata:
  version: 1.0.0
  author: MEFAI
license: MIT
---

# Binance Product Explorer

Browse all Binance trading products with live market data. Returns every listed trading pair with current prices, 24h volume, circulating supply, and product metadata.

## Quick Reference

| Endpoint | Description | Required | Optional | Authentication |
|----------|-------------|----------|----------|----------------|
| `/bapi/asset/v2/public/asset-service/product/get-products` (GET) | All trading products with live data | None | None | No |

## API Details

### Get All Products

Returns a comprehensive list of all trading products available on Binance with real-time market data.

**Method:** `GET`

**URL:** `https://www.binance.com/bapi/asset/v2/public/asset-service/product/get-products`

**Headers:**

| Header | Value | Required |
|--------|-------|----------|
| `Content-Type` | `application/json` | No |

**Parameters:** None

**Example Request:**

```bash
curl -s "https://www.binance.com/bapi/asset/v2/public/asset-service/product/get-products"
```

**Response Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `data` | array | List of trading products |
| `data[].s` | string | Symbol (e.g., "BTCUSDT") |
| `data[].b` | string | Base asset (e.g., "BTC") |
| `data[].q` | string | Quote asset (e.g., "USDT") |
| `data[].c` | string | Current price |
| `data[].o` | string | Open price (24h ago) |
| `data[].h` | string | 24h high price |
| `data[].l` | string | 24h low price |
| `data[].qv` | string | 24h quote volume |
| `data[].cs` | string | Circulating supply |
| `data[].pm` | string | Permission/market type |
| `data[].tags` | array | Product tags |
| `data[].st` | string | Status |

**Example Response:**

```json
{
  "data": [
    {
      "s": "BTCUSDT",
      "b": "BTC",
      "q": "USDT",
      "c": "95000.00",
      "o": "93500.00",
      "h": "95500.00",
      "l": "93000.00",
      "qv": "5500000000",
      "cs": "19800000",
      "pm": "SPOT",
      "tags": [],
      "st": "TRADING"
    }
  ]
}
```

## Use Cases

1. **Product Catalog**: Build a comprehensive catalog of all Binance trading pairs
2. **Volume Screening**: Filter and sort products by 24h quote volume to find active markets
3. **Supply Analysis**: Track circulating supply data for fundamental analysis
4. **Market Type Filtering**: Separate spot, margin, and other product types
5. **Price Monitoring**: Real-time price data for all pairs in a single API call
6. **Portfolio Valuation**: Use product prices for real-time portfolio valuation

## Notes

- This is a public endpoint with no authentication required
- Returns 1400+ trading products in a single response
- Data is updated in near real-time with live prices
- Field names are abbreviated for bandwidth efficiency (s=symbol, b=base, c=close, etc.)
- Includes products across all trading modes (spot, margin, etc.)
- Useful for building comprehensive market screeners and dashboards
