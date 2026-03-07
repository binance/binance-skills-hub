---
title: Funding Rate Heatmap
description: Binance USDM Futures funding rate heatmap. Visualizes funding rates across all perpetual contracts to identify extreme sentiment and funding arbitrage opportunities.
metadata:
  version: "1.0.0"
  author: mefai-dev
license: MIT
---

# Funding Rate Heatmap

Visualize funding rates across all Binance USDM perpetual futures contracts. Identifies extreme positive/negative rates, average market sentiment, and funding arbitrage opportunities.

## Quick Reference

| Endpoint | Description | Required | Optional | Authentication |
|----------|-------------|----------|----------|----------------|
| `/fapi/v1/premiumIndex` (GET) | All futures mark prices + funding rates | None | symbol | No |

## API Details

### Get All Premium Index Data

Returns mark price, index price, funding rate, and next funding time for all or one perpetual contract.

**Method:** `GET`

**URL:** `https://fapi.binance.com/fapi/v1/premiumIndex`

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `symbol` | string | No | Single symbol (omit for all ~690 contracts) |

**Example Request:**

```bash
# All contracts
curl -s "https://fapi.binance.com/fapi/v1/premiumIndex"

# Single contract
curl -s "https://fapi.binance.com/fapi/v1/premiumIndex?symbol=BTCUSDT"
```

**Response Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `symbol` | string | Contract symbol |
| `markPrice` | string | Current mark price |
| `indexPrice` | string | Current index price |
| `estimatedSettlePrice` | string | Estimated settlement price |
| `lastFundingRate` | string | Last applied funding rate |
| `nextFundingTime` | long | Next funding timestamp (ms) |
| `interestRate` | string | Interest rate component |

**Example Response:**

```json
[
  {
    "symbol": "BTCUSDT",
    "markPrice": "95123.45000000",
    "indexPrice": "95100.00000000",
    "estimatedSettlePrice": "95110.00000000",
    "lastFundingRate": "0.00010000",
    "nextFundingTime": 1709568000000,
    "interestRate": "0.00010000"
  }
]
```

### Heatmap Calculations

```
Funding Rate% = lastFundingRate × 100
Annualized Rate% = Funding Rate% × 3 × 365  (funding applied every 8 hours)

Market Sentiment:
- Average Rate > 0.01%: Market is moderately bullish (longs paying shorts)
- Average Rate > 0.05%: Market is very bullish (expensive to hold longs)
- Average Rate < -0.01%: Market is bearish (shorts paying longs)
```

## Use Cases

1. **Sentiment Analysis**: Average funding rate across all contracts indicates overall market sentiment
2. **Funding Arbitrage**: Find extreme positive rates to short futures + long spot and collect funding
3. **Overleveraged Detection**: Extremely high positive funding indicates overleveraged long positions
4. **Reversal Signals**: Sustained extreme funding rates often precede mean reversion
5. **Cross-Asset Screening**: Compare funding rates across assets to find relative value opportunities
6. **Cost Analysis**: Calculate the cost of holding perpetual futures positions over time

## Notes

- This is a public endpoint with no authentication required
- Returns data for ~690 USDM perpetual contracts
- Funding rate is applied every 8 hours (00:00, 08:00, 16:00 UTC)
- Rates are returned as decimal values (0.0001 = 0.01%)
- Normal funding range: -0.01% to +0.01%
- Extreme rates (>0.1% or <-0.1%) indicate potential reversal conditions
- `nextFundingTime` can be used to calculate time until next funding application
