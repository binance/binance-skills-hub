---
name: margin-interest-optimizer
description: Binance Margin interest rate comparison across VIP tiers. Public endpoint, no authentication required. Shows daily and yearly rates for all margin assets.
metadata:
  version: 1.0.0
  author: MEFAI
license: MIT
---

# Margin Interest Rate Optimizer

Compare margin borrowing interest rates across all VIP tiers (0-9) for every asset available on Binance Margin. Helps traders find the most cost-effective borrowing options.

## Quick Reference

| Endpoint | Description | Required | Optional | Authentication |
|----------|-------------|----------|----------|----------------|
| `/bapi/margin/v1/public/margin/vip/spec/list-all` (GET) | All margin assets with VIP tier rates | None | None | No |

## API Details

### Get All VIP Margin Rates

Returns daily and yearly interest rates for every margin-eligible asset across all VIP tiers.

**Method:** `GET`

**URL:** `https://www.binance.com/bapi/margin/v1/public/margin/vip/spec/list-all`

**Headers:**

| Header | Value | Required |
|--------|-------|----------|
| `Content-Type` | `application/json` | No |

**Parameters:** None

**Example Request:**

```bash
curl -s "https://www.binance.com/bapi/margin/v1/public/margin/vip/spec/list-all"
```

**Response Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `data` | array | List of margin assets |
| `data[].assetName` | string | Asset symbol (e.g., "BTC", "ETH") |
| `data[].specs` | array | Rate specifications per VIP tier |
| `data[].specs[].vipLevel` | integer | VIP tier (0-9) |
| `data[].specs[].dailyInterestRate` | string | Daily interest rate as decimal |
| `data[].specs[].yearlyInterestRate` | string | Annualized interest rate |
| `data[].specs[].borrowable` | boolean | Whether borrowing is enabled |
| `data[].specs[].borrowLimit` | string | Maximum borrow amount |

**Example Response:**

```json
{
  "data": [
    {
      "assetName": "BTC",
      "specs": [
        {
          "vipLevel": 0,
          "dailyInterestRate": "0.00025000",
          "yearlyInterestRate": "0.09125000",
          "borrowable": true,
          "borrowLimit": "200"
        },
        {
          "vipLevel": 1,
          "dailyInterestRate": "0.00020000",
          "yearlyInterestRate": "0.07300000",
          "borrowable": true,
          "borrowLimit": "300"
        }
      ]
    }
  ]
}
```

## Use Cases

1. **Rate Optimization**: Compare borrowing costs across VIP tiers to understand the value of upgrading VIP level
2. **Asset Selection**: Find the cheapest assets to borrow for margin trading strategies
3. **Arbitrage Analysis**: Compare margin interest rates against DeFi lending rates for cross-platform arbitrage opportunities
4. **Cost Estimation**: Calculate expected interest expenses before opening margin positions
5. **Portfolio Management**: Monitor rate changes across assets to optimize existing margin positions

## Notes

- This is a public endpoint with no authentication required
- Rates are returned as decimal values (e.g., 0.00025 = 0.025% daily)
- VIP tiers range from 0 (regular user) to 9 (highest VIP level)
- Daily rates can be annualized by multiplying by 365
- Borrow limits vary by VIP tier and asset
- Rate data is typically updated once per day by Binance
