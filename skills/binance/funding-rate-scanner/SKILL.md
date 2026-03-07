---
title: Funding Rate Scanner
description: Scan all Binance USDM Futures funding rates to find extreme positive/negative rates for arbitrage and sentiment analysis.
metadata:
  version: "1.0.0"
  author: mefai-dev
license: MIT
---

# Funding Rate Scanner Skill

Comprehensively scan funding rate information across all Binance USDM Futures perpetual contracts. Identifies extreme rates for cash-and-carry arbitrage opportunities, calculates annualized yields, and detects crowded positioning through rate analysis.

## Quick Reference

| Endpoint | Description | Required | Optional | Authentication |
|----------|-------------|----------|----------|----------------|
| `/fapi/v1/fundingInfo` (GET) | All funding rate parameters | None | None | No |
| `/fapi/v1/premiumIndex` (GET) | Mark price + last funding rate | None | symbol | No |
| `/fapi/v1/fundingRate` (GET) | Historical funding rates | symbol | limit, startTime, endTime | No |

## API Details

### Funding Info

**Endpoint:** `GET https://fapi.binance.com/fapi/v1/fundingInfo`

Returns funding rate parameters for all perpetual contracts including caps, floors, and intervals.

**Response Fields:**

| Field | Type | Description |
|-------|------|-------------|
| symbol | STRING | Trading pair |
| adjustedFundingRateCap | STRING | Maximum funding rate cap |
| adjustedFundingRateFloor | STRING | Minimum funding rate floor |
| fundingIntervalHours | INT | Funding interval (4h or 8h) |
| disclaimer | BOOLEAN | Has disclaimer flag |

**Example Response:**

```json
[
  {
    "symbol": "BTCUSDT",
    "adjustedFundingRateCap": "0.02000000",
    "adjustedFundingRateFloor": "-0.02000000",
    "fundingIntervalHours": 8,
    "disclaimer": false
  }
]
```

### Premium Index

**Endpoint:** `GET https://fapi.binance.com/fapi/v1/premiumIndex`

Returns current mark price, index price, and last funding rate for all symbols.

**Response Fields:**

| Field | Type | Description |
|-------|------|-------------|
| symbol | STRING | Trading pair |
| markPrice | STRING | Current mark price |
| indexPrice | STRING | Underlying index price |
| lastFundingRate | STRING | Last settled funding rate |
| nextFundingTime | LONG | Next funding settlement timestamp |
| interestRate | STRING | Interest rate component |

### Funding Rate History

**Endpoint:** `GET https://fapi.binance.com/fapi/v1/fundingRate`

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| symbol | STRING | Yes | Trading pair |
| limit | INT | No | Records to return (default 100, max 1000) |
| startTime | LONG | No | Start timestamp |
| endTime | LONG | No | End timestamp |

## Computed Metrics

| Metric | Formula | Description |
|--------|---------|-------------|
| Annualized Rate | `rate * (24/interval) * 365` | Yearly funding yield |
| Mark Premium | `(mark - index) / index * 100` | Current premium % |
| Rate vs Cap | `rate / cap * 100` | How close rate is to maximum |

## Use Cases

1. **Arbitrage Opportunities**: Extreme positive rates (> 0.05%) offer short-side funding income
2. **Sentiment Gauge**: Persistently positive rates = crowded longs; negative = bearish consensus
3. **Rate Comparison**: Compare 4h vs 8h interval pairs for optimal funding frequency
4. **Annualized Yield**: Calculate annual returns from funding rate collection strategies

## Notes

- Funding rates settle every 4h or 8h depending on the contract
- Rates are in decimal format (0.0001 = 0.01%)
- `fundingInfo` returns ~595 perpetual contracts
- `premiumIndex` includes real-time mark/index prices
- Rate limits: 1200 requests per minute
