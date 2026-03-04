---
name: ath-distance-tracker
description: Binance ATH/ATL distance tracker. Uses the marketing symbol list to show how far each coin is from its all-time high and all-time low, with visual distance indicators.
metadata:
  version: 1.0.0
  author: MEFAI
license: MIT
---

# ATH Distance Tracker

Track the distance of every Binance-listed coin from its all-time high (ATH) and all-time low (ATL). Identifies coins near their ATH (potential resistance) and coins deeply discounted from ATH (potential recovery plays).

## Quick Reference

| Endpoint | Description | Required | Optional | Authentication |
|----------|-------------|----------|----------|----------------|
| `/bapi/composite/v1/public/marketing/symbol/list` (GET) | All coins with ATH/ATL data | None | None | No |

## API Details

### Get Symbol List with ATH/ATL Data

**Method:** `GET`

**URL:** `https://www.binance.com/bapi/composite/v1/public/marketing/symbol/list`

**Parameters:** None

**Example Request:**

```bash
curl -s "https://www.binance.com/bapi/composite/v1/public/marketing/symbol/list"
```

**Response Fields (relevant):**

| Field | Type | Description |
|-------|------|-------------|
| `data[].symbol` | string | Ticker symbol |
| `data[].name` | string | Coin name |
| `data[].price` | string | Current price in USD |
| `data[].allTimeHigh` | string | All-time high price |
| `data[].allTimeLow` | string | All-time low price |
| `data[].marketCap` | string | Market capitalization |
| `data[].priceChangePercent24h` | string | 24h price change |

### Distance Calculations

```
ATH Distance% = ((Current Price - ATH) / ATH) × 100
ATL Distance% = ((Current Price - ATL) / ATL) × 100
ATH Recovery% = 100 + ATH Distance%  (how much of ATH has been recovered)
```

**Example:**
- BTC Price: $95,000, ATH: $109,000
- ATH Distance: -12.8% (12.8% below ATH)
- Recovery: 87.2% of ATH recovered

**Example Response:**

```json
{
  "data": [
    {
      "symbol": "BTC",
      "name": "Bitcoin",
      "price": "95000.00",
      "allTimeHigh": "109000.00",
      "allTimeLow": "67.81",
      "marketCap": "1880000000000",
      "priceChangePercent24h": "2.15"
    }
  ]
}
```

## Use Cases

1. **Recovery Plays**: Find quality coins trading 50-90% below ATH for potential recovery trades
2. **Resistance Identification**: Coins near ATH may face selling pressure from holders at breakeven
3. **Market Cycle Analysis**: Average ATH distance across all coins indicates whether market is in a cycle peak or trough
4. **Portfolio Review**: Check how your holdings compare to their historical highs and lows
5. **Sector Comparison**: Compare ATH distances across sectors (DeFi, gaming, L1, etc.) to find undervalued sectors
6. **Risk Assessment**: Coins very far from ATH may indicate fundamental issues or lack of market interest

## Notes

- This is a public endpoint with no authentication required
- Returns ATH/ATL data for 400+ Binance-listed coins
- ATH/ATL values are lifetime prices since Binance listing
- Some coins may have ATH/ATL from different market cycles
- ATL distance can be extremely large for coins that have appreciated significantly
- Data is updated in near real-time as prices change
- Combine with market cap data for better context (large-cap vs small-cap dynamics)
