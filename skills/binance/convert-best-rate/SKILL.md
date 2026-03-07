---
title: Convert Best Rate
description: Compare crypto conversion rates across Binance spot market, P2P marketplace, and Convert service to find the best exchange rate for any pair.
metadata:
  version: "1.0.0"
  author: mefai-dev
license: MIT
---

# Convert Best Rate

Compare crypto-to-fiat and crypto-to-crypto conversion rates across three Binance channels: spot market, P2P marketplace, and the Convert service. Find the best rate and lowest spread for any conversion.

## Quick Reference

| Endpoint | Description | Authentication |
|----------|-------------|----------------|
| `GET /api/v3/ticker/price` | Spot market price | No |
| `POST /bapi/c2c/v2/friendly/c2c/adv/search` | P2P best price | No |
| `GET /sapi/v1/convert/exchangeInfo` | Convert pairs info | Yes (HMAC) |
| `POST /sapi/v1/convert/getQuote` | Convert quote | Yes (HMAC) |

## API Details

### Spot Price (Public)

Get current spot market price for a trading pair.

**Method:** `GET`

**URL:** `https://data-api.binance.vision/api/v3/ticker/price`

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| symbol | string | Yes | Trading pair (e.g., BTCUSDT) |

**Example Request:**

```bash
curl 'https://data-api.binance.vision/api/v3/ticker/price?symbol=BTCUSDT'
```

**Response:**
```json
{"symbol": "BTCUSDT", "price": "65432.50"}
```

### P2P Best Price (Public)

Get the best P2P merchant price for crypto-to-fiat conversion.

**Method:** `POST`

**URL:** `https://p2p.binance.com/bapi/c2c/v2/friendly/c2c/adv/search`

**Request Body:**
```json
{
  "fiat": "TRY",
  "asset": "USDT",
  "tradeType": "SELL",
  "rows": 1,
  "page": 1
}
```

**Response:** First result's `adv.price` is the best available rate.

### Convert Quote (Signed)

Get an instant conversion quote from Binance Convert.

**Method:** `POST`

**URL:** `https://api.binance.com/sapi/v1/convert/getQuote`

**Authentication:** HMAC-SHA256 signed

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| fromAsset | string | Yes | Source asset (e.g., USDT) |
| toAsset | string | Yes | Target asset (e.g., BTC) |
| fromAmount | decimal | Yes* | Amount to convert from |
| toAmount | decimal | Yes* | Amount to convert to (* one of fromAmount/toAmount required) |
| timestamp | integer | Yes | Current timestamp |
| signature | string | Yes | HMAC-SHA256 signature |

**Response Fields:**

| Field | Type | Description |
|-------|------|-------------|
| quoteId | string | Quote identifier (valid ~10s) |
| ratio | string | Conversion rate |
| inverseRatio | string | Inverse rate |
| validTimestamp | integer | Quote expiry timestamp |
| toAmount | string | Amount you will receive |
| fromAmount | string | Amount you will pay |

### Rate Comparison

**Spread Calculation:**
```
P2P Spread = (bestBuyPrice - bestSellPrice) / bestSellPrice * 100
Spot vs P2P = (p2pSellPrice - spotPrice) / spotPrice * 100
```

## Use Cases

1. **Best Rate Finder** — Compare spot vs P2P vs Convert for the cheapest conversion
2. **Spread Analysis** — Monitor P2P buy/sell spread across fiat currencies
3. **Arbitrage Detection** — Identify price differences between spot and P2P markets
4. **Fiat On/Off Ramp** — Find the best rate for converting fiat to crypto and back
5. **Volume-Based Routing** — Route large conversions through the most liquid channel

## Notes

- Spot and P2P price endpoints are **public** — no authentication required
- Convert quote endpoint requires **HMAC-SHA256 signed API key**
- P2P prices vary significantly by fiat currency and region
- P2P spread (buy vs sell) is typically 1-3% depending on currency
- Convert quotes are valid for approximately 10 seconds
- Spot prices don't include trading fees (typically 0.1% maker/taker)
- P2P prices include merchant markup/discount
- For large amounts, check P2P ad limits (`minSingleTransAmount` / `maxSingleTransAmount`)
- Compare net rates after all fees for accurate comparison
