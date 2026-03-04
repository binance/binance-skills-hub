---
name: trading-rules-validator
description: Binance trading rules and filter validator. Uses the public Exchange Information API to check lot sizes, tick sizes, notional limits, order types, and permissions for any trading pair.
metadata:
  version: 1.0.0
  author: MEFAI
license: MIT
---

# Trading Rules Validator

Query and validate Binance trading rules for any symbol. Returns lot size constraints, price filters, minimum notional requirements, allowed order types, and trading permissions.

## Quick Reference

| Endpoint | Description | Required | Optional | Authentication |
|----------|-------------|----------|----------|----------------|
| `/api/v3/exchangeInfo` (GET) | Exchange information with trading rules | None | symbol, symbols, permissions | No |

## API Details

### Get Exchange Information

Returns trading rules and symbol information for one or all symbols.

**Method:** `GET`

**URL:** `https://api.binance.com/api/v3/exchangeInfo`

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `symbol` | string | No | Single symbol (e.g., BTCUSDT) |
| `symbols` | string | No | JSON array of symbols |
| `permissions` | string | No | Filter by permission set |

**Example Request:**

```bash
# Single symbol
curl -s "https://api.binance.com/api/v3/exchangeInfo?symbol=BTCUSDT"

# All symbols
curl -s "https://api.binance.com/api/v3/exchangeInfo"
```

**Response Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `symbols` | array | List of trading pair specifications |
| `symbols[].symbol` | string | Trading pair (e.g., "BTCUSDT") |
| `symbols[].status` | string | Trading status ("TRADING", "BREAK", etc.) |
| `symbols[].baseAsset` | string | Base asset (e.g., "BTC") |
| `symbols[].quoteAsset` | string | Quote asset (e.g., "USDT") |
| `symbols[].baseAssetPrecision` | integer | Base asset decimal precision |
| `symbols[].quotePrecision` | integer | Quote asset decimal precision |
| `symbols[].orderTypes` | array | Allowed order types |
| `symbols[].filters` | array | Trading filters and constraints |
| `symbols[].permissions` | array | Trading permissions |

**Key Filters:**

| Filter Type | Fields | Description |
|-------------|--------|-------------|
| `PRICE_FILTER` | minPrice, maxPrice, tickSize | Price range and increment |
| `LOT_SIZE` | minQty, maxQty, stepSize | Quantity range and increment |
| `MIN_NOTIONAL` / `NOTIONAL` | minNotional | Minimum order value in quote |
| `PERCENT_PRICE_BY_SIDE` | bidMultiplierUp, askMultiplierDown | Max price deviation |
| `MAX_NUM_ORDERS` | maxNumOrders | Maximum open orders |

**Example Response:**

```json
{
  "symbols": [
    {
      "symbol": "BTCUSDT",
      "status": "TRADING",
      "baseAsset": "BTC",
      "quoteAsset": "USDT",
      "baseAssetPrecision": 8,
      "quotePrecision": 8,
      "orderTypes": ["LIMIT", "LIMIT_MAKER", "MARKET", "STOP_LOSS_LIMIT", "TAKE_PROFIT_LIMIT"],
      "filters": [
        {
          "filterType": "PRICE_FILTER",
          "minPrice": "0.01",
          "maxPrice": "1000000.00",
          "tickSize": "0.01"
        },
        {
          "filterType": "LOT_SIZE",
          "minQty": "0.00001",
          "maxQty": "9000.00000",
          "stepSize": "0.00001"
        },
        {
          "filterType": "NOTIONAL",
          "minNotional": "5.00000000"
        }
      ],
      "permissions": ["SPOT", "MARGIN"]
    }
  ]
}
```

## Use Cases

1. **Order Validation**: Pre-validate order parameters before submission to avoid rejection
2. **Quantity Rounding**: Use stepSize to correctly round order quantities
3. **Price Formatting**: Use tickSize to format prices with correct precision
4. **Minimum Order Check**: Verify order meets minimum notional requirements
5. **Permission Check**: Confirm a symbol supports spot, margin, or other trading modes
6. **Bot Configuration**: Auto-configure trading bot parameters based on exchange rules

## Notes

- This is a public endpoint with no authentication required
- Returns data for 2000+ trading pairs when querying all symbols
- Filter rules must be satisfied for orders to be accepted
- stepSize and tickSize define the granularity of quantities and prices
- Symbol status must be "TRADING" for orders to be placed
- Rate limit: 20 requests per second (weight: 20 for all symbols, 1 for single)
