---
name: binance-futures
description: |
  Binance USDM Perpetual Futures trading and data skill. Supports market data (price, klines, orderbook,
  funding rate, open interest), account info, and order management (open, cancel, query).
  Authentication requires API key and secret key. Supports testnet and mainnet.
  Use this skill when users ask about Binance futures price, funding rate, open interest, placing futures orders,
  checking futures positions, futures account balance, or any Binance perpetual contract operations.
metadata:
  version: 1.0.0
  author: 小苏
license: MIT
---

# Binance USDM Futures Skill

Binance USD-Margined Perpetual Futures API. Public market data endpoints require no authentication.
Trading and account endpoints require API key + HMAC SHA256 signed requests.

Base URLs:
- Mainnet: https://fapi.binance.com
- Testnet: https://testnet.binancefuture.com

---

## Quick Reference

| Endpoint | Method | Description | Auth |
|----------|--------|-------------|------|
| /fapi/v1/ping | GET | Test connectivity | No |
| /fapi/v1/time | GET | Server time | No |
| /fapi/v1/exchangeInfo | GET | Exchange info, symbols, filters | No |
| /fapi/v1/depth | GET | Order book | No |
| /fapi/v1/trades | GET | Recent trades | No |
| /fapi/v1/klines | GET | Kline/Candlestick data | No |
| /fapi/v1/ticker/price | GET | Latest price | No |
| /fapi/v1/ticker/24hr | GET | 24hr ticker stats | No |
| /fapi/v1/ticker/bookTicker | GET | Best bid/ask | No |
| /fapi/v1/fundingRate | GET | Funding rate history | No |
| /fapi/v1/premiumIndex | GET | Mark price + funding rate | No |
| /fapi/v1/openInterest | GET | Open interest | No |
| /fapi/v1/openInterestHist | GET | Open interest history | No |
| /fapi/v1/topLongShortAccountRatio | GET | Top trader long/short ratio | No |
| /fapi/v1/globalLongShortAccountRatio | GET | Global long/short ratio | No |
| /fapi/v2/account | GET | Account info (balances, positions) | Yes |
| /fapi/v2/balance | GET | Account balance | Yes |
| /fapi/v2/positionRisk | GET | Current positions | Yes |
| /fapi/v1/order POST | POST | Place new order | Yes |
| /fapi/v1/order DELETE | DELETE | Cancel order | Yes |
| /fapi/v1/order GET | GET | Query order | Yes |
| /fapi/v1/openOrders | GET | All open orders | Yes |
| /fapi/v1/openOrders DELETE | DELETE | Cancel all open orders | Yes |
| /fapi/v1/allOrders | GET | All orders history | Yes |
| /fapi/v1/userTrades | GET | Trade history | Yes |
| /fapi/v1/leverage | POST | Change leverage | Yes |
| /fapi/v1/marginType | POST | Change margin type | Yes |
| /fapi/v1/positionMargin | POST | Adjust isolated margin | Yes |
| /fapi/v1/income | GET | Income history | Yes |

---

## Market Data APIs (No Auth)

### GET /fapi/v1/ticker/price
Latest price for a symbol.

Parameters:
- symbol (string, optional): e.g. BTCUSDT. Omit for all symbols.

Example:
curl 'https://fapi.binance.com/fapi/v1/ticker/price?symbol=BTCUSDT'

Response: {"symbol":"BTCUSDT","price":"84000.00","time":1234567890000}

---

### GET /fapi/v1/premiumIndex
Mark price and current funding rate.

Parameters:
- symbol (string, optional): e.g. BTCUSDT

Response fields:
- symbol: Symbol
- markPrice: Current mark price
- indexPrice: Index price
- lastFundingRate: Last funding rate (e.g. 0.0001 = 0.01%)
- nextFundingTime: Next funding timestamp (ms)
- interestRate: Interest rate

---

### GET /fapi/v1/fundingRate
Funding rate history.

Parameters:
- symbol (string, required)
- startTime (long, optional)
- endTime (long, optional)
- limit (int, optional): Default 100, max 1000

---

### GET /fapi/v1/klines
Kline/Candlestick data.

Parameters:
- symbol (string, required)
- interval (enum, required): 1m 3m 5m 15m 30m 1h 2h 4h 6h 8h 12h 1d 3d 1w 1M
- startTime (long, optional)
- endTime (long, optional)
- limit (int, optional): Default 500, max 1500

Response: Array of [openTime, open, high, low, close, volume, closeTime, quoteVolume, trades, takerBuyBase, takerBuyQuote, ignore]

---

### GET /fapi/v1/openInterest
Current open interest.

Parameters:
- symbol (string, required)

---

### GET /fapi/v1/ticker/24hr
24hr price change statistics.

Parameters:
- symbol (string, optional): Omit for all

Response fields: symbol, priceChange, priceChangePercent, weightedAvgPrice, lastPrice, volume, quoteVolume, highPrice, lowPrice, count

---

### GET /fapi/v1/topLongShortAccountRatio
Top trader long/short account ratio.

Parameters:
- symbol (string, required)
- period (enum, required): 5m 15m 30m 1h 2h 4h 6h 12h 1d
- limit (int, optional): Default 30, max 500
- startTime / endTime (long, optional)

---

## Account & Trading APIs (Auth Required)

### GET /fapi/v2/balance
Account asset balances.

Example:
TIMESTAMP=$(date +%s000)
QUERY="timestamp=${TIMESTAMP}"
SIG=$(echo -n "$QUERY" | openssl dgst -sha256 -hmac "$SECRET_KEY" | cut -d' ' -f2)
curl -H "X-MBX-APIKEY: $API_KEY" "https://fapi.binance.com/fapi/v2/balance?${QUERY}&signature=${SIG}"

Response fields per asset:
- asset: Asset name (e.g. USDT)
- balance: Total balance
- availableBalance: Available for new orders
- crossWalletBalance: Cross wallet balance
- unrealizedProfit: Unrealized PnL

---

### GET /fapi/v2/positionRisk
Current open positions.

Parameters:
- symbol (string, optional): Filter by symbol
- recvWindow (long, optional): Max 60000
- timestamp (long, required)

Response fields per position:
- symbol: Symbol
- positionAmt: Size (negative = short)
- entryPrice: Average entry price
- markPrice: Current mark price
- unRealizedProfit: Unrealized PnL
- liquidationPrice: Liquidation price
- leverage: Current leverage
- marginType: isolated or cross
- isolatedMargin: Isolated margin amount
- positionSide: BOTH, LONG, or SHORT

---

### POST /fapi/v1/order
Place a new futures order.

Parameters:
- symbol (string, required)
- side (enum, required): BUY or SELL
- positionSide (enum, optional): BOTH (default), LONG, SHORT (hedge mode)
- type (enum, required): LIMIT | MARKET | STOP | STOP_MARKET | TAKE_PROFIT | TAKE_PROFIT_MARKET | TRAILING_STOP_MARKET
- quantity (decimal, required*)
- price (decimal, optional): Required for LIMIT
- stopPrice (decimal, optional): Required for STOP/TAKE_PROFIT
- timeInForce (enum, optional): GTC | IOC | FOK | GTX
- reduceOnly (string, optional): true or false
- newClientOrderId (string, optional): Custom order ID
- recvWindow (long, optional): Max 60000
- timestamp (long, required)

IMPORTANT: Mainnet orders require user confirmation. Always ask user to type "CONFIRM" before placing.

---

### DELETE /fapi/v1/order
Cancel an order.

Parameters:
- symbol (string, required)
- orderId (long, optional*): Either orderId or origClientOrderId required
- origClientOrderId (string, optional*)
- timestamp (long, required)

---

### POST /fapi/v1/leverage
Change leverage for a symbol.

Parameters:
- symbol (string, required)
- leverage (int, required): 1-125
- timestamp (long, required)

---

### POST /fapi/v1/marginType
Switch between ISOLATED and CROSSED margin.

Parameters:
- symbol (string, required)
- marginType (enum, required): ISOLATED or CROSSED
- timestamp (long, required)

---

## Authentication

HMAC SHA256 signing (same as Binance Spot):
1. Build query string with all params + timestamp (Unix ms)
2. Sign with: echo -n "$QUERY" | openssl dgst -sha256 -hmac "$SECRET_KEY" | cut -d' ' -f2
3. Append &signature=<sig> to query string
4. Include header: X-MBX-APIKEY: <api_key>

---

## Binance Futures Accounts

Store credentials in TOOLS.md under "## Binance Futures Accounts":

### main-futures
- API Key: abc123...xyz
- Secret: secret...key
- Testnet: false

### Agent Behavior
1. Mask secrets - show only last 5 chars: ***...aws1
2. List accounts by name + environment only, never full keys
3. Mainnet orders: always ask user to type "CONFIRM" before placing
4. Default to main-futures account if ambiguous
5. Never store or log plaintext secrets

---

## Notes

1. positionAmt negative = short position
2. Funding charged every 8 hours (00:00, 08:00, 16:00 UTC)
3. lastFundingRate positive = longs pay shorts; negative = shorts pay longs
4. Hedge mode: specify positionSide (LONG/SHORT); one-way mode: use BOTH
5. reduceOnly=true ensures order only reduces existing position
6. Always check liquidationPrice before adding to a position
