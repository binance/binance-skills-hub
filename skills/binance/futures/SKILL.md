---
name: binance-futures
version: 1.0.0
description: Binance USDT-M Perpetual Futures API — complete coverage for market data, account management, order execution, and position management.
category: exchange
tags: [binance, futures, perpetual, usdt-m, trading]
author: fundingArb
authentication: hmac-sha256
base_urls:
  mainnet: https://fapi.binance.com
  testnet: https://testnet.binancefuture.com
user_agent: "binance-futures/1.0.0 (Skill)"
---

# Binance USDT-M Perpetual Futures API

## Overview

This skill provides complete coverage of the Binance USDT-M Perpetual Futures API. It enables agents to:

- Query real-time market data: order books, trades, klines, funding rates, open interest, and long/short ratios.
- Manage futures accounts: retrieve balances, margin ratios, and position details.
- Execute and manage orders: market, limit, stop, take-profit, and trailing stop orders across one-way and hedge position modes.
- Monitor income history: funding fee payments, realized PnL, commissions, and transfers.
- Configure risk parameters: leverage, margin type (isolated/crossed), and position mode (one-way/hedge).

The USDT-M perpetual contract is the most liquid futures product on Binance. All margin and PnL are denominated in USDT. Contracts never expire — they track the spot index price through the funding rate mechanism.

This skill targets the REST API. WebSocket streams are out of scope.

---

## Authentication

All private endpoints require HMAC-SHA256 authentication. The process is identical to the Binance Spot API signing pattern.

### Requirements

| Component | Description |
|-----------|-------------|
| API Key | Passed in the `X-MBX-APIKEY` HTTP header. |
| Secret Key | Used to create the HMAC-SHA256 signature. Never sent over the wire. |
| Timestamp | `timestamp` parameter — milliseconds since Unix epoch. Must be within `recvWindow` of the server time (default 5000 ms). |
| Signature | `signature` parameter — HMAC-SHA256 of the **entire query string** (for GET/DELETE) or **request body** (for POST/PUT). |
| User-Agent | Set the `User-Agent` header to `binance-futures/1.0.0 (Skill)` or an equivalent identifying string. Binance may reject requests with missing or generic user agents. |

### Signing Example

**Goal:** Query account balance via `GET /fapi/v2/balance`.

**Step 1 — Construct the query string with timestamp:**

```
timestamp=1699500000000&recvWindow=5000
```

**Step 2 — Generate the HMAC-SHA256 signature using your secret key:**

```python
import hmac
import hashlib

secret_key = "your_secret_key_here"
query_string = "timestamp=1699500000000&recvWindow=5000"

signature = hmac.new(
    secret_key.encode("utf-8"),
    query_string.encode("utf-8"),
    hashlib.sha256
).hexdigest()
# Result: "a1b2c3d4e5f6..."
```

**Step 3 — Append the signature to the query string:**

```
timestamp=1699500000000&recvWindow=5000&signature=a1b2c3d4e5f6...
```

**Step 4 — Send the request:**

```
GET https://fapi.binance.com/fapi/v2/balance?timestamp=1699500000000&recvWindow=5000&signature=a1b2c3d4e5f6...

Headers:
  X-MBX-APIKEY: your_api_key_here
  User-Agent: binance-futures/1.0.0 (Skill)
```

### Important Notes

- The `signature` must always be the **last** parameter in the query string or request body.
- For POST requests, parameters go in the request body (application/x-www-form-urlencoded), not the URL.
- The `recvWindow` parameter is optional (default: 5000 ms). Increase it if you experience clock drift issues, but values above 60000 are rejected.
- Use `GET /fapi/v1/time` to synchronize clocks if needed.

---

## Position Modes Explained

Binance USDT-M futures support two position modes. The mode applies account-wide and cannot be changed while any position is open.

### One-Way Mode (Default)

- Each symbol has a **single net position**. Buying adds to a long; selling reduces a long or opens a short.
- The `positionSide` parameter must be set to `BOTH` (or omitted) on every order.
- Simpler for directional trading and most arbitrage strategies.

| Action | positionSide | side | Effect |
|--------|-------------|------|--------|
| Open long | `BOTH` | `BUY` | Increases net position |
| Close long | `BOTH` | `SELL` | Decreases net position |
| Open short | `BOTH` | `SELL` | Decreases net position (goes negative) |
| Close short | `BOTH` | `BUY` | Increases net position (towards zero) |

### Hedge Mode

- Each symbol can hold a **simultaneous long AND short** position.
- The `positionSide` parameter must be `LONG` or `SHORT` on every order.
- Required for strategies that need to hold both directions on the same symbol (e.g., hedged grid trading).

| Action | positionSide | side | Effect |
|--------|-------------|------|--------|
| Open long | `LONG` | `BUY` | Opens/increases long position |
| Close long | `LONG` | `SELL` | Reduces/closes long position |
| Open short | `SHORT` | `SELL` | Opens/increases short position |
| Close short | `SHORT` | `BUY` | Reduces/closes short position |

### Switching Position Mode

Use `POST /fapi/v1/positionSide/dual` with `dualSidePosition=true` (hedge) or `dualSidePosition=false` (one-way). All positions on all symbols must be closed and all open orders cancelled before switching.

---

## Funding Rate Mechanics

Perpetual futures contracts use a funding rate mechanism to keep the contract price anchored to the spot index price.

### Schedule

Funding is settled every **8 hours** at:

| Settlement Time (UTC) |
|----------------------|
| 00:00 |
| 08:00 |
| 16:00 |

You must hold a position at the exact settlement timestamp to pay or receive funding. Closing your position even 1 second before settlement means no funding exchange occurs.

### Direction of Payment

| Funding Rate | Longs | Shorts |
|-------------|-------|--------|
| Positive (> 0) | **Pay** funding | **Receive** funding |
| Negative (< 0) | **Receive** funding | **Pay** funding |

A positive funding rate means the perpetual price is above the spot index — longs pay shorts to push the perp price down. A negative rate means the opposite.

### Formula

```
Funding Payment = Position Value × Funding Rate
Position Value  = Mark Price × Contract Quantity (in contracts, i.e., units of the base asset)
```

**Example:**

- Position: 10 BTCUSDT long
- Mark Price: $43,250.00
- Funding Rate: 0.0100% (0.0001)

```
Position Value  = 43,250 × 10 = 432,500 USDT
Funding Payment = 432,500 × 0.0001 = 43.25 USDT (paid by longs)
```

### API Endpoints for Funding

- `GET /fapi/v1/premiumIndex` — current funding rate and next funding time for all symbols.
- `GET /fapi/v1/fundingRate` — historical funding rate records.
- `GET /fapi/v1/income` with `incomeType=FUNDING_FEE` — your actual funding fee payments and receipts.

---

## Public Endpoints

These endpoints require no authentication. No `X-MBX-APIKEY` header or signature is needed.

---

### GET /fapi/v1/ping

Test connectivity to the API server.

**Parameters:** None

**Weight:** 1

**Example Request:**

```
GET https://fapi.binance.com/fapi/v1/ping
```

**Example Response:**

```json
{}
```

---

### GET /fapi/v1/time

Get the current server time.

**Parameters:** None

**Weight:** 1

**Example Request:**

```
GET https://fapi.binance.com/fapi/v1/time
```

**Example Response:**

```json
{
  "serverTime": 1699500000000
}
```

---

### GET /fapi/v1/exchangeInfo

Get current exchange trading rules, symbol information, rate limits, and filters.

**Parameters:** None

**Weight:** 1

**Example Request:**

```
GET https://fapi.binance.com/fapi/v1/exchangeInfo
```

**Example Response (truncated):**

```json
{
  "timezone": "UTC",
  "serverTime": 1699500000000,
  "futuresType": "U_MARGINED",
  "rateLimits": [
    {
      "rateLimitType": "REQUEST_WEIGHT",
      "interval": "MINUTE",
      "intervalNum": 1,
      "limit": 2400
    },
    {
      "rateLimitType": "ORDERS",
      "interval": "MINUTE",
      "intervalNum": 1,
      "limit": 1200
    }
  ],
  "exchangeFilters": [],
  "assets": [
    {
      "asset": "USDT",
      "marginAvailable": true,
      "autoAssetExchange": "-10000"
    }
  ],
  "symbols": [
    {
      "symbol": "BTCUSDT",
      "pair": "BTCUSDT",
      "contractType": "PERPETUAL",
      "deliveryDate": 4133404800000,
      "onboardDate": 1569398400000,
      "status": "TRADING",
      "maintMarginPercent": "2.5000",
      "requiredMarginPercent": "5.0000",
      "baseAsset": "BTC",
      "quoteAsset": "USDT",
      "marginAsset": "USDT",
      "pricePrecision": 2,
      "quantityPrecision": 3,
      "baseAssetPrecision": 8,
      "quotePrecision": 8,
      "underlyingType": "COIN",
      "underlyingSubType": ["Layer-1"],
      "settlePlan": 0,
      "triggerProtect": "0.0500",
      "liquidationFee": "0.012500",
      "marketTakeBound": "0.05",
      "maxMoveOrderLimit": 10000,
      "filters": [
        {
          "filterType": "PRICE_FILTER",
          "minPrice": "556.80",
          "maxPrice": "4529764",
          "tickSize": "0.10"
        },
        {
          "filterType": "LOT_SIZE",
          "minQty": "0.001",
          "maxQty": "1000",
          "stepSize": "0.001"
        },
        {
          "filterType": "MIN_NOTIONAL",
          "notional": "5"
        }
      ],
      "orderTypes": [
        "LIMIT",
        "MARKET",
        "STOP",
        "STOP_MARKET",
        "TAKE_PROFIT",
        "TAKE_PROFIT_MARKET",
        "TRAILING_STOP_MARKET"
      ],
      "timeInForce": ["GTC", "IOC", "FOK", "GTX"]
    }
  ]
}
```

---

### GET /fapi/v1/depth

Get the order book for a symbol.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| symbol | STRING | Yes | e.g., `BTCUSDT` |
| limit | INT | No | Default 500. Valid values: 5, 10, 20, 50, 100, 500, 1000. |

**Weight:** Adjusted based on limit (5/10/20/50 = 2, 100 = 5, 500 = 10, 1000 = 20).

**Example Request:**

```
GET https://fapi.binance.com/fapi/v1/depth?symbol=BTCUSDT&limit=5
```

**Example Response:**

```json
{
  "lastUpdateId": 3456789012,
  "E": 1699500000000,
  "T": 1699500000000,
  "bids": [
    ["43250.00", "1.234"],
    ["43249.90", "0.567"],
    ["43249.80", "2.345"],
    ["43249.70", "0.891"],
    ["43249.60", "3.456"]
  ],
  "asks": [
    ["43250.10", "0.987"],
    ["43250.20", "1.543"],
    ["43250.30", "0.654"],
    ["43250.40", "2.109"],
    ["43250.50", "1.876"]
  ]
}
```

Each entry is `[price, quantity]`.

---

### GET /fapi/v1/trades

Get recent trades for a symbol.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| symbol | STRING | Yes | e.g., `BTCUSDT` |
| limit | INT | No | Default 500, max 1000. |

**Weight:** 5

**Example Request:**

```
GET https://fapi.binance.com/fapi/v1/trades?symbol=BTCUSDT&limit=2
```

**Example Response:**

```json
[
  {
    "id": 1234567890,
    "price": "43250.10",
    "qty": "0.012",
    "quoteQty": "519.00",
    "time": 1699500000123,
    "isBuyerMaker": false
  },
  {
    "id": 1234567891,
    "price": "43250.00",
    "qty": "0.250",
    "quoteQty": "10812.50",
    "time": 1699500000456,
    "isBuyerMaker": true
  }
]
```

---

### GET /fapi/v1/historicalTrades

Get older trades. Requires the `X-MBX-APIKEY` header but does **not** require a signature.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| symbol | STRING | Yes | e.g., `BTCUSDT` |
| limit | INT | No | Default 500, max 1000. |
| fromId | LONG | No | Trade ID to fetch from. Default gets the most recent trades. |

**Weight:** 20

**Example Request:**

```
GET https://fapi.binance.com/fapi/v1/historicalTrades?symbol=BTCUSDT&limit=2&fromId=1234567800

Headers:
  X-MBX-APIKEY: your_api_key_here
```

**Example Response:**

```json
[
  {
    "id": 1234567800,
    "price": "43240.50",
    "qty": "0.100",
    "quoteQty": "4324.05",
    "time": 1699499990000,
    "isBuyerMaker": false
  },
  {
    "id": 1234567801,
    "price": "43241.00",
    "qty": "0.050",
    "quoteQty": "2162.05",
    "time": 1699499990100,
    "isBuyerMaker": true
  }
]
```

---

### GET /fapi/v1/aggTrades

Get compressed/aggregate trades. Trades that fill at the same time, from the same taker order, at the same price, are aggregated.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| symbol | STRING | Yes | e.g., `BTCUSDT` |
| fromId | LONG | No | ID to get aggregate trades from (inclusive). |
| startTime | LONG | No | Timestamp in ms. |
| endTime | LONG | No | Timestamp in ms. |
| limit | INT | No | Default 500, max 1000. |

**Weight:** 20

**Example Request:**

```
GET https://fapi.binance.com/fapi/v1/aggTrades?symbol=BTCUSDT&limit=2
```

**Example Response:**

```json
[
  {
    "a": 987654321,
    "p": "43250.10",
    "q": "0.500",
    "f": 1234567890,
    "l": 1234567892,
    "T": 1699500000123,
    "m": false
  },
  {
    "a": 987654322,
    "p": "43250.00",
    "q": "1.200",
    "f": 1234567893,
    "l": 1234567895,
    "T": 1699500000456,
    "m": true
  }
]
```

| Field | Description |
|-------|-------------|
| a | Aggregate trade ID |
| p | Price |
| q | Quantity |
| f | First trade ID |
| l | Last trade ID |
| T | Timestamp |
| m | Was the buyer the maker? |

---

### GET /fapi/v1/klines

Get candlestick/kline data for a symbol.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| symbol | STRING | Yes | e.g., `BTCUSDT` |
| interval | ENUM | Yes | `1m`, `3m`, `5m`, `15m`, `30m`, `1h`, `2h`, `4h`, `6h`, `8h`, `12h`, `1d`, `3d`, `1w`, `1M` |
| startTime | LONG | No | Timestamp in ms. |
| endTime | LONG | No | Timestamp in ms. |
| limit | INT | No | Default 500, max 1500. |

**Weight:** Based on limit (1-100 = 1, 101-500 = 2, 501-1000 = 5, 1001-1500 = 10).

**Example Request:**

```
GET https://fapi.binance.com/fapi/v1/klines?symbol=BTCUSDT&interval=1h&limit=2
```

**Example Response:**

```json
[
  [
    1699495200000,
    "43100.00",
    "43280.50",
    "43050.00",
    "43250.10",
    "1234.567",
    1699498799999,
    "53345678.90",
    5432,
    "617.283",
    "26672839.45",
    "0"
  ],
  [
    1699498800000,
    "43250.10",
    "43300.00",
    "43200.00",
    "43275.50",
    "987.654",
    1699502399999,
    "42712345.67",
    4321,
    "493.827",
    "21356172.83",
    "0"
  ]
]
```

Array elements in order: open time, open, high, low, close, volume, close time, quote asset volume, number of trades, taker buy base asset volume, taker buy quote asset volume, ignore.

---

### GET /fapi/v1/continuousKlines

Get candlestick data for a contract type pair (useful for continuous contract charting).

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| pair | STRING | Yes | e.g., `BTCUSDT` |
| contractType | ENUM | Yes | `PERPETUAL`, `CURRENT_QUARTER`, `NEXT_QUARTER` |
| interval | ENUM | Yes | Same intervals as `/klines`. |
| startTime | LONG | No | Timestamp in ms. |
| endTime | LONG | No | Timestamp in ms. |
| limit | INT | No | Default 500, max 1500. |

**Weight:** Based on limit (same as `/klines`).

**Example Request:**

```
GET https://fapi.binance.com/fapi/v1/continuousKlines?pair=BTCUSDT&contractType=PERPETUAL&interval=1h&limit=1
```

**Example Response:**

```json
[
  [
    1699498800000,
    "43250.10",
    "43300.00",
    "43200.00",
    "43275.50",
    "987.654",
    1699502399999,
    "42712345.67",
    4321,
    "493.827",
    "21356172.83",
    "0"
  ]
]
```

Format is identical to `/klines`.

---

### GET /fapi/v1/premiumIndex

Get mark price and funding rate information. If no symbol is specified, returns data for **all** symbols.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| symbol | STRING | No | e.g., `BTCUSDT`. Omit for all symbols. |

**Weight:** 1

**Example Request:**

```
GET https://fapi.binance.com/fapi/v1/premiumIndex?symbol=BTCUSDT
```

**Example Response (single symbol):**

```json
{
  "symbol": "BTCUSDT",
  "markPrice": "43256.78000000",
  "indexPrice": "43248.12345678",
  "estimatedSettlePrice": "43245.00000000",
  "lastFundingRate": "0.00010000",
  "nextFundingTime": 1699516800000,
  "interestRate": "0.00010000",
  "time": 1699500000000
}
```

**Example Request (all symbols):**

```
GET https://fapi.binance.com/fapi/v1/premiumIndex
```

**Example Response (all symbols, truncated):**

```json
[
  {
    "symbol": "BTCUSDT",
    "markPrice": "43256.78000000",
    "indexPrice": "43248.12345678",
    "estimatedSettlePrice": "43245.00000000",
    "lastFundingRate": "0.00010000",
    "nextFundingTime": 1699516800000,
    "interestRate": "0.00010000",
    "time": 1699500000000
  },
  {
    "symbol": "ETHUSDT",
    "markPrice": "2285.45000000",
    "indexPrice": "2284.98765432",
    "estimatedSettlePrice": "2284.50000000",
    "lastFundingRate": "0.00008500",
    "nextFundingTime": 1699516800000,
    "interestRate": "0.00010000",
    "time": 1699500000000
  }
]
```

| Field | Description |
|-------|-------------|
| markPrice | Current mark price used for PnL and liquidation calculations. |
| indexPrice | Spot index price (weighted average of spot exchanges). |
| lastFundingRate | Last settled funding rate. |
| nextFundingTime | Timestamp (ms) of the next funding settlement. |
| interestRate | Interest rate component of the funding rate. |

---

### GET /fapi/v1/fundingRate

Get funding rate history for a symbol.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| symbol | STRING | No | e.g., `BTCUSDT`. Required if `startTime`/`endTime` not given. |
| startTime | LONG | No | Timestamp in ms. |
| endTime | LONG | No | Timestamp in ms. |
| limit | INT | No | Default 100, max 1000. |

**Weight:** 1

**Example Request:**

```
GET https://fapi.binance.com/fapi/v1/fundingRate?symbol=BTCUSDT&limit=3
```

**Example Response:**

```json
[
  {
    "symbol": "BTCUSDT",
    "fundingRate": "0.00010000",
    "fundingTime": 1699516800000,
    "markPrice": "43256.78000000"
  },
  {
    "symbol": "BTCUSDT",
    "fundingRate": "0.00008500",
    "fundingTime": 1699488000000,
    "markPrice": "43100.50000000"
  },
  {
    "symbol": "BTCUSDT",
    "fundingRate": "0.00012300",
    "fundingTime": 1699459200000,
    "markPrice": "42985.20000000"
  }
]
```

---

### GET /fapi/v1/ticker/24hr

Get 24-hour rolling window price change statistics. If no symbol is specified, returns data for all symbols (heavy weight).

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| symbol | STRING | No | e.g., `BTCUSDT`. Omit for all symbols. |

**Weight:** 1 with symbol, 40 without.

**Example Request:**

```
GET https://fapi.binance.com/fapi/v1/ticker/24hr?symbol=BTCUSDT
```

**Example Response:**

```json
{
  "symbol": "BTCUSDT",
  "priceChange": "150.30",
  "priceChangePercent": "0.348",
  "weightedAvgPrice": "43175.45",
  "lastPrice": "43250.10",
  "lastQty": "0.012",
  "openPrice": "43099.80",
  "highPrice": "43500.00",
  "lowPrice": "42900.00",
  "volume": "98765.432",
  "quoteVolume": "4265432109.87",
  "openTime": 1699413600000,
  "closeTime": 1699500000000,
  "firstId": 1234500000,
  "lastId": 1234599999,
  "count": 99999
}
```

---

### GET /fapi/v1/ticker/price

Get latest price for a symbol or all symbols.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| symbol | STRING | No | e.g., `BTCUSDT`. Omit for all symbols. |

**Weight:** 1 with symbol, 2 without.

**Example Request:**

```
GET https://fapi.binance.com/fapi/v1/ticker/price?symbol=BTCUSDT
```

**Example Response:**

```json
{
  "symbol": "BTCUSDT",
  "price": "43250.10",
  "time": 1699500000000
}
```

---

### GET /fapi/v1/ticker/bookTicker

Get best bid/ask price and quantity.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| symbol | STRING | No | e.g., `BTCUSDT`. Omit for all symbols. |

**Weight:** 2 with symbol, 5 without.

**Example Request:**

```
GET https://fapi.binance.com/fapi/v1/ticker/bookTicker?symbol=BTCUSDT
```

**Example Response:**

```json
{
  "symbol": "BTCUSDT",
  "bidPrice": "43250.00",
  "bidQty": "1.234",
  "askPrice": "43250.10",
  "askQty": "0.987",
  "time": 1699500000000
}
```

---

### GET /fapi/v1/openInterest

Get current open interest for a symbol.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| symbol | STRING | Yes | e.g., `BTCUSDT` |

**Weight:** 1

**Example Request:**

```
GET https://fapi.binance.com/fapi/v1/openInterest?symbol=BTCUSDT
```

**Example Response:**

```json
{
  "symbol": "BTCUSDT",
  "openInterest": "85432.123",
  "time": 1699500000000
}
```

The `openInterest` value is in the base asset (BTC in this case).

---

### GET /fapi/v1/openInterestHist

Get historical open interest data.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| symbol | STRING | Yes | e.g., `BTCUSDT` |
| period | ENUM | Yes | `5m`, `15m`, `30m`, `1h`, `2h`, `4h`, `6h`, `12h`, `1d` |
| limit | INT | No | Default 30, max 500. |
| startTime | LONG | No | Timestamp in ms. |
| endTime | LONG | No | Timestamp in ms. |

**Weight:** 1

**Example Request:**

```
GET https://fapi.binance.com/fapi/v1/openInterestHist?symbol=BTCUSDT&period=1h&limit=2
```

**Example Response:**

```json
[
  {
    "symbol": "BTCUSDT",
    "sumOpenInterest": "85432.12300000",
    "sumOpenInterestValue": "3694567890.12",
    "timestamp": 1699498800000
  },
  {
    "symbol": "BTCUSDT",
    "sumOpenInterest": "85100.45600000",
    "sumOpenInterestValue": "3680234567.89",
    "timestamp": 1699495200000
  }
]
```

---

### GET /fapi/v1/topLongShortAccountRatio

Get the long/short ratio of top trader accounts.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| symbol | STRING | Yes | e.g., `BTCUSDT` |
| period | ENUM | Yes | `5m`, `15m`, `30m`, `1h`, `2h`, `4h`, `6h`, `12h`, `1d` |
| limit | INT | No | Default 30, max 500. |
| startTime | LONG | No | Timestamp in ms. |
| endTime | LONG | No | Timestamp in ms. |

**Weight:** 1

**Example Request:**

```
GET https://fapi.binance.com/fapi/v1/topLongShortAccountRatio?symbol=BTCUSDT&period=1h&limit=2
```

**Example Response:**

```json
[
  {
    "symbol": "BTCUSDT",
    "longShortRatio": "1.2345",
    "longAccount": "0.5525",
    "shortAccount": "0.4475",
    "timestamp": 1699498800000
  },
  {
    "symbol": "BTCUSDT",
    "longShortRatio": "1.1890",
    "longAccount": "0.5432",
    "shortAccount": "0.4568",
    "timestamp": 1699495200000
  }
]
```

---

### GET /fapi/v1/globalLongShortAccountRatio

Get the global long/short ratio of all accounts.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| symbol | STRING | Yes | e.g., `BTCUSDT` |
| period | ENUM | Yes | `5m`, `15m`, `30m`, `1h`, `2h`, `4h`, `6h`, `12h`, `1d` |
| limit | INT | No | Default 30, max 500. |
| startTime | LONG | No | Timestamp in ms. |
| endTime | LONG | No | Timestamp in ms. |

**Weight:** 1

**Example Request:**

```
GET https://fapi.binance.com/fapi/v1/globalLongShortAccountRatio?symbol=BTCUSDT&period=1h&limit=2
```

**Example Response:**

```json
[
  {
    "symbol": "BTCUSDT",
    "longShortRatio": "1.3456",
    "longAccount": "0.5736",
    "shortAccount": "0.4264",
    "timestamp": 1699498800000
  },
  {
    "symbol": "BTCUSDT",
    "longShortRatio": "1.2987",
    "longAccount": "0.5651",
    "shortAccount": "0.4349",
    "timestamp": 1699495200000
  }
]
```

---

### GET /fapi/v1/takerlongshortRatio

Get taker buy/sell volume ratio (measures aggressive buying vs selling).

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| symbol | STRING | Yes | e.g., `BTCUSDT` |
| period | ENUM | Yes | `5m`, `15m`, `30m`, `1h`, `2h`, `4h`, `6h`, `12h`, `1d` |
| limit | INT | No | Default 30, max 500. |
| startTime | LONG | No | Timestamp in ms. |
| endTime | LONG | No | Timestamp in ms. |

**Weight:** 1

**Example Request:**

```
GET https://fapi.binance.com/fapi/v1/takerlongshortRatio?symbol=BTCUSDT&period=1h&limit=2
```

**Example Response:**

```json
[
  {
    "buySellRatio": "0.9876",
    "buyVol": "12345.678",
    "sellVol": "12500.123",
    "timestamp": 1699498800000
  },
  {
    "buySellRatio": "1.0234",
    "buyVol": "11890.456",
    "sellVol": "11618.234",
    "timestamp": 1699495200000
  }
]
```

---

## Authenticated Endpoints

All endpoints in this section require HMAC-SHA256 authentication. Every request must include the `X-MBX-APIKEY` header, a `timestamp` parameter, and a `signature` parameter.

---

### POST /fapi/v1/order

Place a new order.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| symbol | STRING | Yes | e.g., `BTCUSDT` |
| side | ENUM | Yes | `BUY` or `SELL` |
| positionSide | ENUM | No | `BOTH` (one-way), `LONG` or `SHORT` (hedge mode). Default `BOTH`. |
| type | ENUM | Yes | `LIMIT`, `MARKET`, `STOP`, `STOP_MARKET`, `TAKE_PROFIT`, `TAKE_PROFIT_MARKET`, `TRAILING_STOP_MARKET` |
| timeInForce | ENUM | Conditional | Required for `LIMIT` orders. `GTC`, `IOC`, `FOK`, `GTX` (post-only). |
| quantity | DECIMAL | Conditional | Order quantity in base asset. Not required for `STOP_MARKET` / `TAKE_PROFIT_MARKET` with `closePosition=true`. |
| reduceOnly | STRING | No | `true` or `false`. Cannot be used with `closePosition`. Not valid in hedge mode. |
| price | DECIMAL | Conditional | Required for `LIMIT`, `STOP`, `TAKE_PROFIT` orders. |
| newClientOrderId | STRING | No | Unique ID among open orders. Automatically generated if not sent. |
| stopPrice | DECIMAL | Conditional | Required for `STOP`, `STOP_MARKET`, `TAKE_PROFIT`, `TAKE_PROFIT_MARKET` orders. |
| closePosition | STRING | No | `true` or `false`. Used with `STOP_MARKET` or `TAKE_PROFIT_MARKET` to close the entire position. |
| activationPrice | DECIMAL | No | Used with `TRAILING_STOP_MARKET`. Default is the latest price. |
| callbackRate | DECIMAL | Conditional | Required for `TRAILING_STOP_MARKET`. Min 0.1, max 5 (percentage). |
| workingType | ENUM | No | `MARK_PRICE` (default) or `CONTRACT_PRICE`. Determines trigger price type for conditional orders. |
| priceProtect | STRING | No | `true` or `false`. If true, the order will be cancelled if the trigger price deviates too much from the mark price. |
| newOrderRespType | ENUM | No | `ACK` or `RESULT`. Default `ACK`. |
| recvWindow | LONG | No | Max 60000. Default 5000. |
| timestamp | LONG | Yes | Milliseconds since Unix epoch. |

**Weight:** 1

**Example Request — MARKET order (one-way mode):**

```
POST https://fapi.binance.com/fapi/v1/order

Body:
symbol=BTCUSDT&side=BUY&type=MARKET&quantity=0.010&timestamp=1699500000000&signature=...

Headers:
  X-MBX-APIKEY: your_api_key_here
  User-Agent: binance-futures/1.0.0 (Skill)
  Content-Type: application/x-www-form-urlencoded
```

**Example Response:**

```json
{
  "clientOrderId": "abc123def456",
  "cumQty": "0.010",
  "cumQuote": "432.50",
  "executedQty": "0.010",
  "orderId": 9876543210,
  "avgPrice": "43250.00",
  "origQty": "0.010",
  "price": "0",
  "reduceOnly": false,
  "side": "BUY",
  "positionSide": "BOTH",
  "status": "FILLED",
  "stopPrice": "0",
  "closePosition": false,
  "symbol": "BTCUSDT",
  "timeInForce": "GTC",
  "type": "MARKET",
  "origType": "MARKET",
  "activatePrice": null,
  "priceRate": null,
  "updateTime": 1699500000100,
  "workingType": "CONTRACT_PRICE",
  "priceProtect": false,
  "priceMatch": "NONE",
  "selfTradePreventionMode": "NONE",
  "goodTillDate": 0
}
```

**Example Request — LIMIT order:**

```
POST https://fapi.binance.com/fapi/v1/order

Body:
symbol=ETHUSDT&side=SELL&type=LIMIT&timeInForce=GTC&quantity=1.00&price=2300.00&timestamp=1699500000000&signature=...
```

**Example Response:**

```json
{
  "clientOrderId": "limit_sell_eth_001",
  "cumQty": "0",
  "cumQuote": "0",
  "executedQty": "0",
  "orderId": 9876543211,
  "avgPrice": "0.00000",
  "origQty": "1.00",
  "price": "2300.00",
  "reduceOnly": false,
  "side": "SELL",
  "positionSide": "BOTH",
  "status": "NEW",
  "stopPrice": "0",
  "closePosition": false,
  "symbol": "ETHUSDT",
  "timeInForce": "GTC",
  "type": "LIMIT",
  "origType": "LIMIT",
  "activatePrice": null,
  "priceRate": null,
  "updateTime": 1699500000200,
  "workingType": "CONTRACT_PRICE",
  "priceProtect": false,
  "priceMatch": "NONE",
  "selfTradePreventionMode": "NONE",
  "goodTillDate": 0
}
```

**Example Request — STOP_MARKET order with closePosition:**

```
POST https://fapi.binance.com/fapi/v1/order

Body:
symbol=BTCUSDT&side=SELL&type=STOP_MARKET&closePosition=true&stopPrice=42000.00&workingType=MARK_PRICE&timestamp=1699500000000&signature=...
```

**Example Response:**

```json
{
  "clientOrderId": "stop_close_btc_001",
  "cumQty": "0",
  "cumQuote": "0",
  "executedQty": "0",
  "orderId": 9876543212,
  "avgPrice": "0.00000",
  "origQty": "0",
  "price": "0",
  "reduceOnly": false,
  "side": "SELL",
  "positionSide": "BOTH",
  "status": "NEW",
  "stopPrice": "42000.00",
  "closePosition": true,
  "symbol": "BTCUSDT",
  "timeInForce": "GTC",
  "type": "STOP_MARKET",
  "origType": "STOP_MARKET",
  "activatePrice": null,
  "priceRate": null,
  "updateTime": 1699500000300,
  "workingType": "MARK_PRICE",
  "priceProtect": false,
  "priceMatch": "NONE",
  "selfTradePreventionMode": "NONE",
  "goodTillDate": 0
}
```

**Example Request — TRAILING_STOP_MARKET order:**

```
POST https://fapi.binance.com/fapi/v1/order

Body:
symbol=BTCUSDT&side=SELL&type=TRAILING_STOP_MARKET&quantity=0.010&callbackRate=1.0&workingType=CONTRACT_PRICE&timestamp=1699500000000&signature=...
```

**Example Response:**

```json
{
  "clientOrderId": "trail_btc_001",
  "cumQty": "0",
  "cumQuote": "0",
  "executedQty": "0",
  "orderId": 9876543213,
  "avgPrice": "0.00000",
  "origQty": "0.010",
  "price": "0",
  "reduceOnly": false,
  "side": "SELL",
  "positionSide": "BOTH",
  "status": "NEW",
  "stopPrice": "0",
  "closePosition": false,
  "symbol": "BTCUSDT",
  "timeInForce": "GTC",
  "type": "TRAILING_STOP_MARKET",
  "origType": "TRAILING_STOP_MARKET",
  "activatePrice": "43250.10",
  "priceRate": "1.0",
  "updateTime": 1699500000400,
  "workingType": "CONTRACT_PRICE",
  "priceProtect": false,
  "priceMatch": "NONE",
  "selfTradePreventionMode": "NONE",
  "goodTillDate": 0
}
```

---

### DELETE /fapi/v1/order

Cancel an active order.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| symbol | STRING | Yes | e.g., `BTCUSDT` |
| orderId | LONG | Conditional | Either `orderId` or `origClientOrderId` must be sent. |
| origClientOrderId | STRING | Conditional | Either `orderId` or `origClientOrderId` must be sent. |
| recvWindow | LONG | No | Default 5000. |
| timestamp | LONG | Yes | Milliseconds since Unix epoch. |

**Weight:** 1

**Example Request:**

```
DELETE https://fapi.binance.com/fapi/v1/order?symbol=BTCUSDT&orderId=9876543211&timestamp=1699500000000&signature=...

Headers:
  X-MBX-APIKEY: your_api_key_here
```

**Example Response:**

```json
{
  "clientOrderId": "limit_sell_eth_001",
  "cumQty": "0",
  "cumQuote": "0",
  "executedQty": "0",
  "orderId": 9876543211,
  "origQty": "1.00",
  "origType": "LIMIT",
  "price": "2300.00",
  "reduceOnly": false,
  "side": "SELL",
  "positionSide": "BOTH",
  "status": "CANCELED",
  "stopPrice": "0",
  "closePosition": false,
  "symbol": "ETHUSDT",
  "timeInForce": "GTC",
  "type": "LIMIT",
  "activatePrice": null,
  "priceRate": null,
  "updateTime": 1699500001000,
  "workingType": "CONTRACT_PRICE",
  "priceProtect": false,
  "priceMatch": "NONE",
  "selfTradePreventionMode": "NONE",
  "goodTillDate": 0
}
```

---

### DELETE /fapi/v1/allOpenOrders

Cancel all open orders on a symbol.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| symbol | STRING | Yes | e.g., `BTCUSDT` |
| recvWindow | LONG | No | Default 5000. |
| timestamp | LONG | Yes | Milliseconds since Unix epoch. |

**Weight:** 1

**Example Request:**

```
DELETE https://fapi.binance.com/fapi/v1/allOpenOrders?symbol=BTCUSDT&timestamp=1699500000000&signature=...

Headers:
  X-MBX-APIKEY: your_api_key_here
```

**Example Response:**

```json
{
  "code": 200,
  "msg": "The operation of cancel all open order is done."
}
```

---

### GET /fapi/v1/order

Query a single order's status.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| symbol | STRING | Yes | e.g., `BTCUSDT` |
| orderId | LONG | Conditional | Either `orderId` or `origClientOrderId` must be sent. |
| origClientOrderId | STRING | Conditional | Either `orderId` or `origClientOrderId` must be sent. |
| recvWindow | LONG | No | Default 5000. |
| timestamp | LONG | Yes | Milliseconds since Unix epoch. |

**Weight:** 1

**Example Request:**

```
GET https://fapi.binance.com/fapi/v1/order?symbol=BTCUSDT&orderId=9876543210&timestamp=1699500000000&signature=...

Headers:
  X-MBX-APIKEY: your_api_key_here
```

**Example Response:**

```json
{
  "avgPrice": "43250.00000",
  "clientOrderId": "abc123def456",
  "cumQuote": "432.50",
  "executedQty": "0.010",
  "orderId": 9876543210,
  "origQty": "0.010",
  "origType": "MARKET",
  "price": "0",
  "reduceOnly": false,
  "side": "BUY",
  "positionSide": "BOTH",
  "status": "FILLED",
  "stopPrice": "0",
  "closePosition": false,
  "symbol": "BTCUSDT",
  "time": 1699500000000,
  "timeInForce": "GTC",
  "type": "MARKET",
  "activatePrice": null,
  "priceRate": null,
  "updateTime": 1699500000100,
  "workingType": "CONTRACT_PRICE",
  "priceProtect": false,
  "priceMatch": "NONE",
  "selfTradePreventionMode": "NONE",
  "goodTillDate": 0
}
```

---

### GET /fapi/v1/openOrders

Get all currently open orders on a symbol (or all symbols if omitted).

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| symbol | STRING | No | e.g., `BTCUSDT`. Omit for all symbols. |
| recvWindow | LONG | No | Default 5000. |
| timestamp | LONG | Yes | Milliseconds since Unix epoch. |

**Weight:** 1 with symbol, 40 without.

**Example Request:**

```
GET https://fapi.binance.com/fapi/v1/openOrders?symbol=BTCUSDT&timestamp=1699500000000&signature=...

Headers:
  X-MBX-APIKEY: your_api_key_here
```

**Example Response:**

```json
[
  {
    "avgPrice": "0.00000",
    "clientOrderId": "limit_buy_btc_002",
    "cumQuote": "0",
    "executedQty": "0",
    "orderId": 9876543220,
    "origQty": "0.050",
    "origType": "LIMIT",
    "price": "42000.00",
    "reduceOnly": false,
    "side": "BUY",
    "positionSide": "BOTH",
    "status": "NEW",
    "stopPrice": "0",
    "closePosition": false,
    "symbol": "BTCUSDT",
    "time": 1699499000000,
    "timeInForce": "GTC",
    "type": "LIMIT",
    "activatePrice": null,
    "priceRate": null,
    "updateTime": 1699499000000,
    "workingType": "CONTRACT_PRICE",
    "priceProtect": false,
    "priceMatch": "NONE",
    "selfTradePreventionMode": "NONE",
    "goodTillDate": 0
  }
]
```

---

### GET /fapi/v1/allOrders

Get all orders (active, canceled, filled) for a symbol.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| symbol | STRING | Yes | e.g., `BTCUSDT` |
| orderId | LONG | No | If set, orders >= this orderId are returned. Otherwise, the most recent orders are returned. |
| startTime | LONG | No | Timestamp in ms. |
| endTime | LONG | No | Timestamp in ms. |
| limit | INT | No | Default 500, max 1000. |
| recvWindow | LONG | No | Default 5000. |
| timestamp | LONG | Yes | Milliseconds since Unix epoch. |

**Weight:** 5

**Example Request:**

```
GET https://fapi.binance.com/fapi/v1/allOrders?symbol=BTCUSDT&limit=2&timestamp=1699500000000&signature=...

Headers:
  X-MBX-APIKEY: your_api_key_here
```

**Example Response:**

```json
[
  {
    "avgPrice": "43250.00000",
    "clientOrderId": "abc123def456",
    "cumQuote": "432.50",
    "executedQty": "0.010",
    "orderId": 9876543210,
    "origQty": "0.010",
    "origType": "MARKET",
    "price": "0",
    "reduceOnly": false,
    "side": "BUY",
    "positionSide": "BOTH",
    "status": "FILLED",
    "stopPrice": "0",
    "closePosition": false,
    "symbol": "BTCUSDT",
    "time": 1699500000000,
    "timeInForce": "GTC",
    "type": "MARKET",
    "activatePrice": null,
    "priceRate": null,
    "updateTime": 1699500000100,
    "workingType": "CONTRACT_PRICE",
    "priceProtect": false,
    "priceMatch": "NONE",
    "selfTradePreventionMode": "NONE",
    "goodTillDate": 0
  },
  {
    "avgPrice": "0.00000",
    "clientOrderId": "limit_sell_eth_001",
    "cumQuote": "0",
    "executedQty": "0",
    "orderId": 9876543211,
    "origQty": "1.00",
    "origType": "LIMIT",
    "price": "2300.00",
    "reduceOnly": false,
    "side": "SELL",
    "positionSide": "BOTH",
    "status": "CANCELED",
    "stopPrice": "0",
    "closePosition": false,
    "symbol": "BTCUSDT",
    "time": 1699500000200,
    "timeInForce": "GTC",
    "type": "LIMIT",
    "activatePrice": null,
    "priceRate": null,
    "updateTime": 1699500001000,
    "workingType": "CONTRACT_PRICE",
    "priceProtect": false,
    "priceMatch": "NONE",
    "selfTradePreventionMode": "NONE",
    "goodTillDate": 0
  }
]
```

---

### GET /fapi/v2/account

Get current account information, including balances, positions, margin ratio, and total unrealized PnL.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| recvWindow | LONG | No | Default 5000. |
| timestamp | LONG | Yes | Milliseconds since Unix epoch. |

**Weight:** 5

**Example Request:**

```
GET https://fapi.binance.com/fapi/v2/account?timestamp=1699500000000&signature=...

Headers:
  X-MBX-APIKEY: your_api_key_here
```

**Example Response (truncated):**

```json
{
  "feeTier": 0,
  "canTrade": true,
  "canDeposit": true,
  "canWithdraw": true,
  "updateTime": 0,
  "multiAssetsMargin": false,
  "totalInitialMargin": "432.50000000",
  "totalMaintMargin": "21.62500000",
  "totalWalletBalance": "10000.00000000",
  "totalUnrealizedProfit": "12.50000000",
  "totalMarginBalance": "10012.50000000",
  "totalPositionInitialMargin": "432.50000000",
  "totalOpenOrderInitialMargin": "0.00000000",
  "totalCrossWalletBalance": "10000.00000000",
  "totalCrossUnPnl": "12.50000000",
  "availableBalance": "9567.50000000",
  "maxWithdrawAmount": "9567.50000000",
  "assets": [
    {
      "asset": "USDT",
      "walletBalance": "10000.00000000",
      "unrealizedProfit": "12.50000000",
      "marginBalance": "10012.50000000",
      "maintMargin": "21.62500000",
      "initialMargin": "432.50000000",
      "positionInitialMargin": "432.50000000",
      "openOrderInitialMargin": "0.00000000",
      "crossWalletBalance": "10000.00000000",
      "crossUnPnl": "12.50000000",
      "availableBalance": "9567.50000000",
      "maxWithdrawAmount": "9567.50000000",
      "marginAvailable": true,
      "updateTime": 1699500000000
    }
  ],
  "positions": [
    {
      "symbol": "BTCUSDT",
      "initialMargin": "432.50000000",
      "maintMargin": "21.62500000",
      "unrealizedProfit": "12.50000000",
      "positionInitialMargin": "432.50000000",
      "openOrderInitialMargin": "0",
      "leverage": "100",
      "isolated": false,
      "entryPrice": "43250.00000",
      "breakEvenPrice": "43267.32500",
      "maxNotional": "50000000",
      "positionSide": "BOTH",
      "positionAmt": "0.010",
      "notional": "432.50000000",
      "isolatedWallet": "0",
      "updateTime": 1699500000100,
      "bidNotional": "0",
      "askNotional": "0"
    }
  ]
}
```

**Key fields:**

| Field | Description |
|-------|-------------|
| totalWalletBalance | Your deposited balance (excluding unrealized PnL). |
| totalUnrealizedProfit | Sum of unrealized PnL across all positions. |
| totalMarginBalance | walletBalance + unrealizedProfit. Used as the numerator in margin ratio. |
| totalMaintMargin | Total maintenance margin required. Denominator in margin ratio. |
| availableBalance | How much you can use to open new positions or withdraw. |

---

### GET /fapi/v2/balance

Get futures account balance for each asset.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| recvWindow | LONG | No | Default 5000. |
| timestamp | LONG | Yes | Milliseconds since Unix epoch. |

**Weight:** 5

**Example Request:**

```
GET https://fapi.binance.com/fapi/v2/balance?timestamp=1699500000000&signature=...

Headers:
  X-MBX-APIKEY: your_api_key_here
```

**Example Response:**

```json
[
  {
    "accountAlias": "SgsR",
    "asset": "USDT",
    "balance": "10000.00000000",
    "crossWalletBalance": "10000.00000000",
    "crossUnPnl": "12.50000000",
    "availableBalance": "9567.50000000",
    "maxWithdrawAmount": "9567.50000000",
    "marginAvailable": true,
    "updateTime": 1699500000000
  },
  {
    "accountAlias": "SgsR",
    "asset": "BNB",
    "balance": "0.00000000",
    "crossWalletBalance": "0.00000000",
    "crossUnPnl": "0.00000000",
    "availableBalance": "0.00000000",
    "maxWithdrawAmount": "0.00000000",
    "marginAvailable": true,
    "updateTime": 0
  }
]
```

---

### GET /fapi/v2/positionRisk

Get current position information for all symbols or a specific symbol. This is the **most critical endpoint** for monitoring open positions.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| symbol | STRING | No | e.g., `BTCUSDT`. Omit for all symbols. |
| recvWindow | LONG | No | Default 5000. |
| timestamp | LONG | Yes | Milliseconds since Unix epoch. |

**Weight:** 5

**Example Request:**

```
GET https://fapi.binance.com/fapi/v2/positionRisk?symbol=BTCUSDT&timestamp=1699500000000&signature=...

Headers:
  X-MBX-APIKEY: your_api_key_here
```

**Example Response:**

```json
[
  {
    "symbol": "BTCUSDT",
    "positionAmt": "0.010",
    "entryPrice": "43250.00000",
    "breakEvenPrice": "43267.32500",
    "markPrice": "43375.50000000",
    "unRealizedProfit": "1.25550000",
    "liquidationPrice": "42823.45678901",
    "leverage": "100",
    "maxNotionalValue": "50000000",
    "marginType": "cross",
    "isolatedMargin": "0.00000000",
    "isAutoAddMargin": "false",
    "positionSide": "BOTH",
    "notional": "433.75500000",
    "isolatedWallet": "0",
    "updateTime": 1699500000100
  }
]
```

**Key fields:**

| Field | Description |
|-------|-------------|
| positionAmt | Position size. Positive = long, negative = short, zero = no position. |
| entryPrice | Average entry price. |
| breakEvenPrice | Entry price adjusted for fees — the price at which PnL is zero after commissions. |
| markPrice | Current mark price used for PnL/liquidation. |
| unRealizedProfit | Unrealized PnL in USDT. |
| liquidationPrice | Estimated liquidation price. `0` means no liquidation risk (e.g., no position). |
| leverage | Current leverage setting. |
| marginType | `cross` or `isolated`. |
| notional | Position value in USDT (markPrice x positionAmt). |

**Interpreting `positionAmt`:**

- `"0.010"` means you are long 0.010 BTC.
- `"-0.010"` means you are short 0.010 BTC.
- `"0"` means no open position.

When querying without a symbol, the response includes entries for **every** symbol. Filter for `positionAmt != "0"` to find actual open positions.

---

### GET /fapi/v1/income

Get income history: funding fees, realized PnL, commissions, transfers, and more.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| symbol | STRING | No | e.g., `BTCUSDT` |
| incomeType | STRING | No | `TRANSFER`, `WELCOME_BONUS`, `REALIZED_PNL`, `FUNDING_FEE`, `COMMISSION`, `INSURANCE_CLEAR`, `REFERRAL_KICKBACK`, `COMMISSION_REBATE`, `API_REBATE`, `CONTEST_REWARD`, `CROSS_COLLATERAL_TRANSFER`, `OPTIONS_PREMIUM_FEE`, `OPTIONS_SETTLE_PROFIT`, `INTERNAL_TRANSFER`, `AUTO_EXCHANGE`, `DELIVERED_SETTELMENT`, `COIN_SWAP_DEPOSIT`, `COIN_SWAP_WITHDRAW`, `POSITION_LIMIT_INCREASE_FEE` |
| startTime | LONG | No | Timestamp in ms. |
| endTime | LONG | No | Timestamp in ms. |
| limit | INT | No | Default 100, max 1000. |
| recvWindow | LONG | No | Default 5000. |
| timestamp | LONG | Yes | Milliseconds since Unix epoch. |

**Weight:** 30

**Example Request — Get funding fee history:**

```
GET https://fapi.binance.com/fapi/v1/income?symbol=BTCUSDT&incomeType=FUNDING_FEE&limit=3&timestamp=1699500000000&signature=...

Headers:
  X-MBX-APIKEY: your_api_key_here
```

**Example Response:**

```json
[
  {
    "symbol": "BTCUSDT",
    "incomeType": "FUNDING_FEE",
    "income": "-0.43250000",
    "asset": "USDT",
    "info": "",
    "time": 1699516800000,
    "tranId": 1234567890123,
    "tradeId": ""
  },
  {
    "symbol": "BTCUSDT",
    "incomeType": "FUNDING_FEE",
    "income": "0.36812500",
    "asset": "USDT",
    "info": "",
    "time": 1699488000000,
    "tranId": 1234567890124,
    "tradeId": ""
  },
  {
    "symbol": "BTCUSDT",
    "incomeType": "FUNDING_FEE",
    "income": "-0.52919000",
    "asset": "USDT",
    "info": "",
    "time": 1699459200000,
    "tranId": 1234567890125,
    "tradeId": ""
  }
]
```

**Notes:**

- Negative `income` means you **paid** funding (e.g., long position with positive funding rate).
- Positive `income` means you **received** funding.
- The `time` field corresponds to the funding settlement timestamp.

---

### POST /fapi/v1/leverage

Change the leverage for a symbol.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| symbol | STRING | Yes | e.g., `BTCUSDT` |
| leverage | INT | Yes | Target leverage. 1 to 125 (varies by symbol). |
| recvWindow | LONG | No | Default 5000. |
| timestamp | LONG | Yes | Milliseconds since Unix epoch. |

**Weight:** 1

**Example Request:**

```
POST https://fapi.binance.com/fapi/v1/leverage

Body:
symbol=BTCUSDT&leverage=20&timestamp=1699500000000&signature=...

Headers:
  X-MBX-APIKEY: your_api_key_here
```

**Example Response:**

```json
{
  "leverage": 20,
  "maxNotionalValue": "100000000",
  "symbol": "BTCUSDT"
}
```

---

### POST /fapi/v1/marginType

Change the margin type for a symbol between ISOLATED and CROSSED.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| symbol | STRING | Yes | e.g., `BTCUSDT` |
| marginType | ENUM | Yes | `ISOLATED` or `CROSSED` |
| recvWindow | LONG | No | Default 5000. |
| timestamp | LONG | Yes | Milliseconds since Unix epoch. |

**Weight:** 1

**Example Request:**

```
POST https://fapi.binance.com/fapi/v1/marginType

Body:
symbol=BTCUSDT&marginType=ISOLATED&timestamp=1699500000000&signature=...

Headers:
  X-MBX-APIKEY: your_api_key_here
```

**Example Response:**

```json
{
  "code": 200,
  "msg": "success"
}
```

**Note:** This call will fail with error code -4046 if the margin type is already set to the requested value. Handle this gracefully.

---

### POST /fapi/v1/positionSide/dual

Enable or disable hedge mode (dual position side).

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| dualSidePosition | STRING | Yes | `true` for hedge mode, `false` for one-way mode. |
| recvWindow | LONG | No | Default 5000. |
| timestamp | LONG | Yes | Milliseconds since Unix epoch. |

**Weight:** 1

**Example Request:**

```
POST https://fapi.binance.com/fapi/v1/positionSide/dual

Body:
dualSidePosition=false&timestamp=1699500000000&signature=...

Headers:
  X-MBX-APIKEY: your_api_key_here
```

**Example Response:**

```json
{
  "code": 200,
  "msg": "success"
}
```

**Note:** All positions must be closed and all open orders cancelled before switching. The API returns error -4059 if you attempt to switch with open positions.

---

### GET /fapi/v1/positionSide/dual

Get the current position mode (one-way or hedge).

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| recvWindow | LONG | No | Default 5000. |
| timestamp | LONG | Yes | Milliseconds since Unix epoch. |

**Weight:** 30

**Example Request:**

```
GET https://fapi.binance.com/fapi/v1/positionSide/dual?timestamp=1699500000000&signature=...

Headers:
  X-MBX-APIKEY: your_api_key_here
```

**Example Response:**

```json
{
  "dualSidePosition": false
}
```

`false` = one-way mode, `true` = hedge mode.

---

### GET /fapi/v1/userTrades

Get trade history for a specific symbol.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| symbol | STRING | Yes | e.g., `BTCUSDT` |
| orderId | LONG | No | Filter by order ID. |
| startTime | LONG | No | Timestamp in ms. |
| endTime | LONG | No | Timestamp in ms. |
| fromId | LONG | No | Trade ID to fetch from. |
| limit | INT | No | Default 500, max 1000. |
| recvWindow | LONG | No | Default 5000. |
| timestamp | LONG | Yes | Milliseconds since Unix epoch. |

**Weight:** 5

**Example Request:**

```
GET https://fapi.binance.com/fapi/v1/userTrades?symbol=BTCUSDT&limit=2&timestamp=1699500000000&signature=...

Headers:
  X-MBX-APIKEY: your_api_key_here
```

**Example Response:**

```json
[
  {
    "buyer": true,
    "commission": "0.01730000",
    "commissionAsset": "USDT",
    "id": 567890123,
    "maker": false,
    "marginAsset": "USDT",
    "orderId": 9876543210,
    "positionSide": "BOTH",
    "price": "43250.00",
    "qty": "0.010",
    "quoteQty": "432.50",
    "realizedPnl": "0",
    "side": "BUY",
    "symbol": "BTCUSDT",
    "time": 1699500000100
  },
  {
    "buyer": false,
    "commission": "0.01732000",
    "commissionAsset": "USDT",
    "id": 567890124,
    "maker": false,
    "marginAsset": "USDT",
    "orderId": 9876543230,
    "positionSide": "BOTH",
    "price": "43300.00",
    "qty": "0.010",
    "quoteQty": "433.00",
    "realizedPnl": "0.50000000",
    "side": "SELL",
    "symbol": "BTCUSDT",
    "time": 1699500500000
  }
]
```

**Key fields:**

| Field | Description |
|-------|-------------|
| maker | Whether you were the maker (true) or taker (false). |
| commission | Fee paid for this trade. |
| realizedPnl | Realized PnL from this trade (only non-zero when closing a position). |

---

## Order Parameters for Arbitrage

When executing funding rate arbitrage (e.g., long spot + short perpetual to collect positive funding), the following patterns are recommended.

### Use MARKET Orders for Speed

Arbitrage is time-sensitive. Use `type=MARKET` to ensure immediate execution. Slippage on liquid pairs like BTCUSDT is typically negligible.

```
symbol=BTCUSDT&side=SELL&type=MARKET&quantity=0.010
```

### reduceOnly Parameter

Set `reduceOnly=true` when closing a position to prevent accidentally opening a new position in the opposite direction. This is especially important in arbitrage unwinding.

```
symbol=BTCUSDT&side=BUY&type=MARKET&quantity=0.010&reduceOnly=true
```

**Constraints:**

- `reduceOnly` is only valid in **one-way mode** (`positionSide=BOTH`).
- It cannot be combined with `closePosition=true`.
- A `reduceOnly` order will be rejected if you have no position to reduce.

### positionSide for One-Way Mode

In one-way mode, always set `positionSide=BOTH` (or omit it entirely). The `side` parameter determines direction:

| Intent | side | positionSide |
|--------|------|-------------|
| Open short for arb | `SELL` | `BOTH` |
| Close short (unwind arb) | `BUY` | `BOTH` |

### Recommended Arb Entry Workflow

1. **Check position mode:** `GET /fapi/v1/positionSide/dual` — ensure you are in one-way mode.
2. **Set leverage:** `POST /fapi/v1/leverage` — set to desired level (e.g., 1x for neutral arb).
3. **Set margin type:** `POST /fapi/v1/marginType` — typically `CROSSED` for better capital efficiency.
4. **Open position:** `POST /fapi/v1/order` — `SELL` `MARKET` to go short.
5. **Verify position:** `GET /fapi/v2/positionRisk` — confirm `positionAmt` is negative (short).
6. **Monitor funding:** `GET /fapi/v1/income?incomeType=FUNDING_FEE` — track received funding.

### Recommended Arb Exit Workflow

1. **Close position:** `POST /fapi/v1/order` — `BUY` `MARKET` with `reduceOnly=true`.
2. **Verify flat:** `GET /fapi/v2/positionRisk` — confirm `positionAmt` is `"0"`.
3. **Cancel remaining orders:** `DELETE /fapi/v1/allOpenOrders` — clean up any leftover stops.

---

## Risk Calculations

### Margin Ratio

The margin ratio determines how close your account is to liquidation. When it reaches 100%, liquidation occurs.

```
Margin Ratio = (Maintenance Margin / Margin Balance) × 100%
```

Where:

- **Maintenance Margin** = `totalMaintMargin` from `GET /fapi/v2/account`
- **Margin Balance** = `totalMarginBalance` from `GET /fapi/v2/account` (= wallet balance + unrealized PnL)

**Example:**

```
Maintenance Margin = 21.625 USDT
Margin Balance     = 10012.50 USDT
Margin Ratio       = 21.625 / 10012.50 × 100% = 0.216%
```

A margin ratio of 0.216% is very safe. Liquidation occurs at 100%.

### Liquidation Price Estimation

For a **CROSSED margin long** position:

```
Liquidation Price = Entry Price × (1 - 1/Leverage + Maintenance Margin Rate)
```

For a **CROSSED margin short** position:

```
Liquidation Price = Entry Price × (1 + 1/Leverage - Maintenance Margin Rate)
```

These are simplified formulas. The actual liquidation price depends on:

- Total wallet balance (shared across all cross positions).
- Unrealized PnL from other positions.
- Open order margin.
- Maintenance margin rate tiers (higher positions require higher maintenance margin rates).

The most reliable liquidation price is the `liquidationPrice` field returned by `GET /fapi/v2/positionRisk`. Use the formulas above only for rough estimation.

### Maintenance Margin Rate Tiers

Binance uses a tiered maintenance margin rate system. Higher notional values require higher maintenance margin rates. Query `GET /fapi/v1/exchangeInfo` and check the `brackets` field for each symbol, or refer to the Binance documentation for the latest tier tables.

Example for BTCUSDT (simplified):

| Tier | Notional Value (USDT) | Maint. Margin Rate | Max Leverage |
|------|----------------------|-------------------|-------------|
| 1 | 0 - 50,000 | 0.40% | 125x |
| 2 | 50,000 - 250,000 | 0.50% | 100x |
| 3 | 250,000 - 1,000,000 | 1.00% | 50x |
| 4 | 1,000,000 - 10,000,000 | 2.50% | 20x |
| 5 | 10,000,000 - 50,000,000 | 5.00% | 10x |

---

## Error Codes

### Common HTTP Error Codes

| HTTP Code | Meaning |
|-----------|---------|
| 403 | WAF limit violated (Web Application Firewall). Your IP may be temporarily banned. |
| 429 | Rate limit exceeded. Back off and retry. |
| 418 | IP has been auto-banned for repeated 429 violations. Ban duration escalates. |
| 5xx | Server error. Retry with exponential backoff. |

### Common API Error Codes

| Code | Message | Description |
|------|---------|-------------|
| -1000 | UNKNOWN | An unknown error occurred. |
| -1001 | DISCONNECTED | Internal error; the operation could not be completed. |
| -1002 | UNAUTHORIZED | You are not authorized to execute this request. Check API key permissions. |
| -1003 | TOO_MANY_REQUESTS | Too many requests queued. Reduce request frequency. |
| -1006 | UNEXPECTED_RESP | Unexpected response from backend. Retry. |
| -1007 | TIMEOUT | Timeout waiting for response from backend. Order may or may not have been placed — check open orders. |
| -1010 | ERROR_MSG_RECEIVED | Server returned an error message. |
| -1013 | INVALID_MESSAGE | Something in the request is invalid. |
| -1014 | UNKNOWN_ORDER_COMPOSITION | Unsupported order combination. |
| -1015 | TOO_MANY_ORDERS | Too many new orders. Reduce order rate. |
| -1016 | SERVICE_SHUTTING_DOWN | This service is no longer available. |
| -1020 | UNSUPPORTED_OPERATION | This operation is not supported. |
| -1021 | INVALID_TIMESTAMP | Timestamp is outside of the recvWindow, or server time is ahead of your timestamp. Sync your clock. |
| -1022 | INVALID_SIGNATURE | Signature verification failed. Check your secret key and signing logic. |
| -1100 | ILLEGAL_CHARS | Illegal characters in a parameter. |
| -1101 | TOO_MANY_PARAMETERS | Too many parameters sent. |
| -1102 | MANDATORY_PARAM_MISSING | A mandatory parameter was missing. |
| -1103 | UNKNOWN_PARAM | An unknown parameter was sent. |
| -1104 | UNREAD_PARAMETERS | Not all sent parameters were read. |
| -1105 | PARAM_EMPTY | A parameter was empty when a value was required. |
| -1111 | BAD_PRECISION | Precision is over the maximum allowed for this asset. |
| -1116 | INVALID_ORDER_TYPE | This order type is not supported for this symbol. |
| -1117 | INVALID_SIDE | Invalid side. Must be BUY or SELL. |
| -1121 | BAD_SYMBOL | Invalid symbol. |
| -1125 | INVALID_LISTEN_KEY | This listen key does not exist. |
| -2010 | NEW_ORDER_REJECTED | Order was rejected. Common causes: insufficient margin, invalid quantity/price, filter violation. |
| -2011 | CANCEL_REJECTED | Cancel was rejected. The order may have already been filled or cancelled. |
| -2013 | NO_SUCH_ORDER | The specified order does not exist. |
| -2014 | BAD_API_KEY_FMT | API key format is invalid. |
| -2015 | REJECTED_MBX_KEY | Invalid API key, IP, or permissions. |
| -4000 | INVALID_ORDER_STATUS | Invalid order status. |
| -4001 | PRICE_LESS_THAN_ZERO | Price must be greater than 0. |
| -4002 | PRICE_GREATER_THAN_MAX_PRICE | Price exceeds maximum. |
| -4003 | QTY_LESS_THAN_ZERO | Quantity must be greater than 0. |
| -4004 | QTY_LESS_THAN_MIN_QTY | Quantity is below minimum. |
| -4005 | QTY_GREATER_THAN_MAX_QTY | Quantity exceeds maximum. |
| -4008 | REDUCE_ONLY_REJECT | `reduceOnly` order was rejected — no position to reduce. |
| -4013 | INVALID_CLOSE_POSITION | `closePosition` is not valid for this order type. |
| -4014 | CLOSE_POSITION_NOT_ALLOWED | `closePosition` is not allowed with `reduceOnly`. |
| -4015 | ORDER_WOULD_TRIGGER_IMMEDIATELY | The stop order would trigger immediately. |
| -4028 | TIMESTAMP_OUTSIDE_RECV_WINDOW | Timestamp for this request is outside of the recvWindow. |
| -4046 | NO_NEED_TO_CHANGE_MARGIN_TYPE | Margin type is already set to the requested value. |
| -4047 | INVALID_MARGIN_TYPE_WITH_POSITION | Cannot change margin type while holding a position. |
| -4059 | NO_NEED_TO_CHANGE_POSITION_SIDE | Cannot change position side while holding a position or open orders exist. |
| -4061 | ORDER_PRICE_FILTER | Price does not comply with the price filter. |
| -4062 | LOT_SIZE_FILTER | Quantity does not comply with the lot size filter. |
| -4131 | INSUFFICIENT_MARGIN | Insufficient margin to place order. |
| -4164 | MIN_NOTIONAL_FILTER | Notional value is below the minimum (typically 5 USDT). |

---

## Rate Limits

Binance futures uses a weight-based rate limiting system. Each request consumes a certain number of weight points. If you exceed the limit, the API returns HTTP 429 and you must wait.

### Weight Limits

| Limit Type | Interval | Limit |
|-----------|----------|-------|
| REQUEST_WEIGHT | 1 minute | 2400 |
| ORDERS | 1 minute | 1200 |
| ORDERS | 10 seconds | 300 |

### How Weight Works

- Each endpoint has a weight cost documented in this skill.
- Lightweight endpoints (e.g., `/ping`, `/ticker/price?symbol=X`) cost 1.
- Heavy endpoints (e.g., `/ticker/24hr` without a symbol) cost 40.
- Order placement costs 1 per order.
- Batch operations cost more.

### Checking Your Usage

Response headers include rate limit info:

| Header | Description |
|--------|-------------|
| `X-MBX-USED-WEIGHT-1M` | Request weight used in the current 1-minute window. |
| `X-MBX-ORDER-COUNT-1M` | Number of orders placed in the current 1-minute window. |
| `X-MBX-ORDER-COUNT-10S` | Number of orders placed in the current 10-second window. |

### Avoiding Bans

- Monitor `X-MBX-USED-WEIGHT-1M` in every response. Stay under 2400.
- If you receive HTTP 429, stop sending requests until the current minute window resets.
- If you receive HTTP 418, you are IP-banned. Duration starts at 2 minutes and escalates with repeat violations up to 3 days.
- Use WebSocket streams for real-time data instead of polling REST endpoints.
- When checking all symbols, use the no-symbol variant of endpoints rather than looping through each symbol individually.

### Practical Guidelines for Arbitrage Bots

- `/fapi/v1/premiumIndex` (all symbols, weight 1) is your best friend for scanning funding rates.
- `/fapi/v2/positionRisk` (weight 5) should be polled conservatively (e.g., every 10-30 seconds).
- `/fapi/v1/income` (weight 30) is expensive — use sparingly and with targeted filters.
- Order placement (weight 1) is rarely the bottleneck; the per-minute order count limit (1200) is generous.
- Cache `exchangeInfo` locally and refresh only periodically (e.g., once per hour).
