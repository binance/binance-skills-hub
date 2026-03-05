---
title: Binance Options Market
description: "Option Greeks, implied volatility, OI by expiry, and strike analysis from Binance EAPI"
metadata:
  version: "1.0.0"
  author: mefai-dev
license: MIT
---

# Binance Options Market

## Overview

Real-time Binance European-style options data including Greeks (delta, gamma, theta, vega), implied volatility, open interest by expiry and strike, and mark prices for all active option contracts.

## API Reference

### Mark Prices & Greeks

```
GET https://eapi.binance.com/eapi/v1/mark
```

**Response:**
```json
[
  {
    "symbol": "BTC-260626-80000-C",
    "markPrice": "0.1234",
    "markImpliedVolatility": "0.5500",
    "delta": "0.6234",
    "gamma": "0.00012",
    "theta": "-45.234",
    "vega": "123.45"
  }
]
```

### Open Interest

```
GET https://eapi.binance.com/eapi/v1/openInterest?underlyingAsset=BTC
```

Optional: `expiration` parameter for specific expiry.

### Exchange Info

```
GET https://eapi.binance.com/eapi/v1/exchangeInfo
```

Returns all active option contracts with strikes, expiries, and contract specifications.

### 24hr Ticker

```
GET https://eapi.binance.com/eapi/v1/ticker
```

## Computed Analytics

| Metric | Description |
|--------|-------------|
| **Put/Call OI Ratio** | Total put OI divided by call OI |
| **OI by Expiry** | Aggregated call/put OI per expiry date |
| **Top Greeks** | Contracts sorted by absolute delta |
| **IV Surface** | Implied volatility across strikes and expiries |

## Symbol Format

`{UNDERLYING}-{YYMMDD}-{STRIKE}-{C|P}`

Example: `BTC-260626-80000-C` = BTC Call option, strike $80,000, expiry June 26, 2026

## Use Cases

- **Greeks Monitoring**: Track portfolio delta/gamma exposure
- **IV Analysis**: Compare implied vol across strikes for skew analysis
- **OI Distribution**: Identify key support/resistance from options positioning
- **Expiry Analysis**: Monitor OI concentration by expiry

## Notes

- Geo-restricted in some regions (may require proxy from non-restricted location)
- European-style options (exercise at expiry only)
- Mark prices update every few seconds
- No authentication required for market data endpoints
