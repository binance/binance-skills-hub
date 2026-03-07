---
title: Funding Rate Alert
description: "Real-time funding rate arbitrage opportunities with annualized APR calculations"
metadata:
  version: "1.0.0"
  author: mefai-dev
license: MIT
---

# Funding Rate Alert

## Overview

Monitors all USDT-margined perpetual futures contracts for extreme funding rates, calculating annualized returns for funding rate arbitrage strategies. Identifies pairs where longs pay shorts (positive funding → short opportunity) or shorts pay longs (negative funding → long opportunity).

## API Reference

### Premium Index (Funding Rates)

```
GET https://fapi.binance.com/fapi/v1/premiumIndex
```

**Response:**
```json
[
  {
    "symbol": "BTCUSDT",
    "markPrice": "72810.25",
    "indexPrice": "72805.10",
    "lastFundingRate": "0.00015",
    "nextFundingTime": 1772726400000,
    "interestRate": "0.0001"
  }
]
```

### Funding Info

```
GET https://fapi.binance.com/fapi/v1/fundingInfo
```

Returns funding rate caps, intervals, and adjusted rates for all perpetual contracts.

## Computed Analytics

| Metric | Formula |
|--------|---------|
| **Funding Rate %** | `lastFundingRate * 100` |
| **Annualized APR** | `rate * 3 * 365` (3 funding periods/day) |
| **Premium** | `(markPrice - indexPrice) / indexPrice * 100` |
| **Time to Next** | `(nextFundingTime - now) / 60000` minutes |

## Signal Logic

| Condition | Direction | Interpretation |
|-----------|-----------|---------------|
| Rate > 0 | SHORT | Longs pay shorts — short opportunity |
| Rate < 0 | LONG | Shorts pay longs — long opportunity |
| Rate >= 0.05% | EXTREME | High-conviction arbitrage signal |

## Arbitrage Strategy

1. **Spot-Futures Arbitrage**: Buy spot + short futures when funding is positive
2. **Collect funding** every 8 hours (3x daily)
3. **APR calculation**: A 0.05% funding rate = 54.75% annualized

## Use Cases

- **Funding Arbitrage**: Market-neutral strategy collecting funding payments
- **Sentiment Indicator**: High positive funding = overleveraged longs (potential squeeze)
- **Entry Timing**: Extreme funding often precedes reversals
- **Cross-pair Analysis**: Compare funding across similar assets

## Notes

- Filters for rates >= 0.01% (significant opportunities only)
- Scans all USDT perpetual pairs (~690+ contracts)
- Funding settlements occur at 00:00, 08:00, 16:00 UTC
- Public Binance Futures API, no authentication required
