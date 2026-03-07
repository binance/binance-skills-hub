---
title: Market Cap Dominance
description: Binance market cap dominance tracker. Uses the public marketing symbol list API to show BTC/ETH/BNB dominance, market cap rankings, price changes, and sector allocation.
metadata:
  version: "1.0.0"
  author: mefai-dev
license: MIT
---

# Market Cap Dominance Tracker

Track market capitalization dominance for all Binance-listed assets. Shows BTC/ETH/BNB dominance percentages, total market cap, individual coin rankings, and 24h price changes.

## Quick Reference

| Endpoint | Description | Required | Optional | Authentication |
|----------|-------------|----------|----------|----------------|
| `/bapi/composite/v1/public/marketing/symbol/list` (GET) | All listed coins with market cap and dominance data | None | None | No |

## API Details

### Get Symbol List with Market Data

Returns comprehensive market data for all Binance-listed symbols including market cap, dominance, ATH/ATL, tags, and supply information.

**Method:** `GET`

**URL:** `https://www.binance.com/bapi/composite/v1/public/marketing/symbol/list`

**Headers:**

| Header | Value | Required |
|--------|-------|----------|
| `Content-Type` | `application/json` | No |

**Parameters:** None

**Example Request:**

```bash
curl -s "https://www.binance.com/bapi/composite/v1/public/marketing/symbol/list"
```

**Response Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `data` | array | List of all listed symbols |
| `data[].name` | string | Coin name (e.g., "Bitcoin") |
| `data[].symbol` | string | Ticker symbol (e.g., "BTC") |
| `data[].price` | string | Current price in USD |
| `data[].marketCap` | string | Market capitalization in USD |
| `data[].circulatingMarketCap` | string | Circulating market cap |
| `data[].dominance` | string | Market dominance percentage |
| `data[].priceChangePercent24h` | string | 24h price change percentage |
| `data[].allTimeHigh` | string | All-time high price |
| `data[].allTimeLow` | string | All-time low price |
| `data[].circulatingSupply` | string | Circulating supply |
| `data[].totalSupply` | string | Total supply |
| `data[].maxSupply` | string | Maximum supply |
| `data[].tags` | array | Category tags |

**Example Response:**

```json
{
  "data": [
    {
      "name": "Bitcoin",
      "symbol": "BTC",
      "price": "95000.00",
      "marketCap": "1880000000000",
      "dominance": "56.2",
      "priceChangePercent24h": "2.15",
      "allTimeHigh": "109000.00",
      "allTimeLow": "67.81",
      "circulatingSupply": "19800000",
      "totalSupply": "21000000",
      "maxSupply": "21000000",
      "tags": ["pow", "store-of-value"]
    }
  ]
}
```

## Use Cases

1. **Dominance Tracking**: Monitor BTC/ETH/BNB dominance shifts as a macro market indicator
2. **Capital Rotation**: Detect when capital flows from large caps to altcoins (BTC dominance decreasing)
3. **Market Cap Rankings**: Track coin rankings and identify coins moving up or down in market cap
4. **Supply Analysis**: Compare circulating vs total vs max supply to assess dilution risk
5. **Sector Analysis**: Use tags to group coins by sector and track sector-level performance

## Notes

- This is a public endpoint with no authentication required
- Returns data for 400+ Binance-listed symbols
- Dominance percentage is relative to total crypto market cap tracked by Binance
- Market cap data is updated in near real-time
- ATH/ATL data provides historical context for current price levels
- Tags can be used for sector-based filtering (DeFi, gaming, AI, etc.)
