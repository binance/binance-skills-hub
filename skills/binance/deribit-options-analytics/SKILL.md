---
title: Deribit Options Analytics
description: "Options market analytics — IV, Put/Call ratio, Max Pain, strike OI distribution"
metadata:
  version: "1.0.0"
  author: mefai-dev
license: MIT
---

# Deribit Options Analytics

## Overview

Real-time options market intelligence from Deribit, the largest crypto options exchange. Provides implied volatility, open interest distribution, put/call ratios, and max pain calculations for BTC and ETH options.

## API Reference

### Book Summary by Currency

```
GET https://www.deribit.com/api/v2/public/get_book_summary_by_currency?currency=BTC&kind=option
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "result": [
    {
      "instrument_name": "BTC-25DEC26-100000-C",
      "open_interest": 2968.5,
      "volume": 8.2,
      "mark_price": 0.078,
      "mark_iv": 49.56,
      "underlying_price": 72800,
      "bid_price": 0.076,
      "ask_price": 0.079,
      "high": 0.081,
      "low": 0.075
    }
  ]
}
```

### Historical Volatility

```
GET https://www.deribit.com/api/v2/public/get_historical_volatility?currency=BTC
```

Returns realized volatility history as `[[timestamp, volatility], ...]`.

## Computed Analytics

From the raw book summary data, the following are computed:

| Metric | Formula |
|--------|---------|
| **Put/Call Ratio** | Total Put OI / Total Call OI |
| **Max Pain Strike** | Strike where total option holder pain is minimized |
| **Avg Call IV** | Mean implied volatility of call options |
| **Avg Put IV** | Mean implied volatility of put options |
| **Top Strikes** | Strikes sorted by total OI (call + put) |

### Max Pain Calculation

For each strike S, pain = sum of (Call OI * max(0, S-K) + Put OI * max(0, K-S)) across all strikes K. The strike with minimum total pain is max pain — price tends to gravitate toward this level at expiry.

## Use Cases

- **Volatility Trading**: Compare implied vs realized vol for mispricing
- **Hedging Decisions**: P/C ratio signals market sentiment (>1 = bearish hedging)
- **Expiry Positioning**: Max pain indicates likely expiry settlement zone
- **Strike Selection**: OI distribution shows where liquidity concentrates

## Notes

- All endpoints are public, no API key required
- Rate limits: 20 requests per second
- Data covers all active BTC and ETH option contracts
- Instrument naming: `{CURRENCY}-{EXPIRY}-{STRIKE}-{C|P}`
