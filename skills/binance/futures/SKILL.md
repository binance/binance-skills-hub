---
title: Binance Futures
description: Binance USDM Perpetual Futures trading and data skill. Supports market data (price, klines, orderbook, funding rate, open interest), account info, and order management (open, cancel, modify, query). Authentication requires API key and secret key. Supports testnet and mainnet. Use this skill when users ask about Binance futures price, funding rate, open interest, placing/modifying futures orders, checking futures positions, futures account balance, algo orders (TWAP/VP), or any Binance perpetual contract operations.
metadata:
  version: 1.2.0
  author: cq375
license: MIT
---

# Binance USDM Futures Skill

Binance USD-Margined Perpetual Futures API. Public market data endpoints require no authentication.
Trading and account endpoints require API key + HMAC SHA256 signed requests.

Base URLs:
- Mainnet: https://fapi.binance.com
- Testnet: https://demo-fapi.binance.com

WebSocket Streams:
- Mainnet: wss://fstream.binance.com
- Testnet: wss://fstream.binancefuture.com

WebSocket API:
- Mainnet: wss://ws-fapi.binance.com/ws-fapi/v1

---

## Rate Limits

- Response header X-MBX-USED-WEIGHT-(intervalNum)(intervalLetter) shows current IP weight usage
- HTTP 429: rate limit exceeded; back off immediately
- HTTP 418: IP banned for repeated 429 violations (2min to 3 days)
- Order rate limit tracked via X-MBX-ORDER-COUNT-(intervalNum)(intervalLetter) header

---

## Quick Reference

| Endpoint | Method | Description | Auth |
|----------|--------|-------------|------|
| /fapi/v1/ping | GET | Test connectivity | No |
| /fapi/v1/time | GET | Server time | No |
| /fapi/v1/exchangeInfo | GET | Exchange info, symbols, filters | No |
| /fapi/v1/depth | GET | Order book | No |
| /fapi/v1/trades | GET | Recent trades | No |
| /fapi/v1/historicalTrades | GET | Historical trades | No |
| /fapi/v1/aggTrades | GET | Compressed aggregate trades | No |
| /fapi/v1/klines | GET | Kline/Candlestick data | No |
| /fapi/v1/continuousKlines | GET | Continuous contract klines | No |
| /fapi/v1/indexPriceKlines | GET | Index price klines | No |
| /fapi/v1/markPriceKlines | GET | Mark price klines | No |
| /fapi/v1/premiumIndexKlines | GET | Premium index klines | No |
| /fapi/v1/ticker/price | GET | Latest price | No |
| /fapi/v2/ticker/price | GET | Latest price v2 (more fields) | No |
| /fapi/v1/ticker/24hr | GET | 24hr ticker stats | No |
| /fapi/v1/ticker/bookTicker | GET | Best bid/ask | No |
| /fapi/v1/fundingRate | GET | Funding rate history | No |
| /fapi/v1/fundingInfo | GET | Funding rate info (limits) | No |
| /fapi/v1/premiumIndex | GET | Mark price + funding rate | No |
| /fapi/v1/openInterest | GET | Open interest | No |
| /fapi/v1/openInterestHist | GET | Open interest history | No |
| /fapi/v1/topLongShortAccountRatio | GET | Top trader long/short ratio (account) | No |
| /fapi/v1/topLongShortPositionRatio | GET | Top trader long/short ratio (position) | No |
| /fapi/v1/globalLongShortAccountRatio | GET | Global long/short ratio | No |
| /fapi/v1/takerLongShortRatio | GET | Taker buy/sell volume ratio | No |
| /fapi/v1/basis | GET | Basis data | No |
| /fapi/v1/constituents | GET | Index price constituents | No |
| /fapi/v1/assetIndex | GET | Multi-assets mode asset index | No |
| /fapi/v1/indexInfo | GET | Composite index symbol info | No |
| /fapi/v2/account | GET | Account info v2 | Yes |
| /fapi/v3/account | GET | Account info v3 (latest) | Yes |
| /fapi/v2/balance | GET | Account balance v2 | Yes |
| /fapi/v3/balance | GET | Account balance v3 (latest) | Yes |
| /fapi/v2/positionRisk | GET | Position info v2 | Yes |
| /fapi/v3/positionRisk | GET | Position info v3 (latest) | Yes |
| /fapi/v1/positionSide/dual | GET | Query position mode | Yes |
| /fapi/v1/positionSide/dual | POST | Change position mode | Yes |
| /fapi/v1/multiAssetsMargin | GET | Query multi-assets margin mode | Yes |
| /fapi/v1/multiAssetsMargin | POST | Change multi-assets margin mode | Yes |
| /fapi/v1/leverageBracket | GET | Notional and leverage brackets | Yes |
| /fapi/v1/adlQuantile | GET | ADL quantile estimation | Yes |
| /fapi/v1/forceOrders | GET | User's force orders | Yes |
| /fapi/v1/apiTradingStatus | GET | Account trading status | Yes |
| /fapi/v1/symbolConfig | GET | Symbol configuration | Yes |
| /fapi/v1/accountConfig | GET | Account configuration | Yes |
| /fapi/v1/rateLimit/order | GET | Query order rate limit | Yes |
| /fapi/v1/commissionRate | GET | Query commission rate | Yes |
| /fapi/v1/income | GET | Income/PnL history | Yes |
| /fapi/v1/bnbBurn | POST | Toggle BNB burn on futures trade | Yes |
| /fapi/v1/order | POST | Place new order | Yes |
| /fapi/v1/order | PUT | Modify order | Yes |
| /fapi/v1/order | DELETE | Cancel order | Yes |
| /fapi/v1/order | GET | Query order | Yes |
| /fapi/v1/order/amendment | GET | Query order modify history | Yes |
| /fapi/v1/openOrder | GET | Query current open order | Yes |
| /fapi/v1/openOrders | GET | All open orders | Yes |
| /fapi/v1/openOrders | DELETE | Cancel all open orders on symbol | Yes |
| /fapi/v1/batchOrders | POST | Place multiple orders (max 5) | Yes |
| /fapi/v1/batchOrders | PUT | Modify multiple orders | Yes |
| /fapi/v1/batchOrders | DELETE | Cancel multiple orders | Yes |
| /fapi/v1/countdownCancelAll | POST | Auto-cancel all orders countdown | Yes |
| /fapi/v1/allOrders | GET | All orders history | Yes |
| /fapi/v1/userTrades | GET | Trade history | Yes |
| /fapi/v1/leverage | POST | Change leverage | Yes |
| /fapi/v1/marginType | POST | Change margin type | Yes |
| /fapi/v1/positionMargin | POST | Adjust isolated position margin | Yes |
| /fapi/v1/positionMargin/history | GET | Position margin change history | Yes |
| /fapi/v1/algo/newOrderVp | POST | New VP algo order | Yes |
| /fapi/v1/algo/newOrderTwap | POST | New TWAP algo order | Yes |
| /fapi/v1/algo/order | DELETE | Cancel algo order | Yes |
| /fapi/v1/algo/openOrders | GET | Current algo open orders | Yes |
| /fapi/v1/algo/historicalOrders | GET | Historical algo orders | Yes |
| /fapi/v1/algo/subOrders | GET | Algo sub orders | Yes |
| /fapi/v1/convert/exchangeInfo | GET | Convert exchange info | No |
| /fapi/v1/convert/getQuote | POST | Send quote request | Yes |
| /fapi/v1/convert/acceptQuote | POST | Accept quote | Yes |
| /fapi/v1/convert/orderStatus | GET | Convert order status | Yes |
| /fapi/v1/listenKey | POST | Create user data stream listenKey | Yes |
| /fapi/v1/listenKey | PUT | Keepalive user data stream | Yes |
| /fapi/v1/listenKey | DELETE | Close user data stream | Yes |

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
- symbol (string, optional)

Response fields:
- symbol, markPrice, indexPrice, lastFundingRate, nextFundingTime, interestRate, time

---

### GET /fapi/v1/fundingRate
Funding rate history.

Parameters:
- symbol (string, required)
- startTime / endTime (long, optional)
- limit (int, optional): Default 100, max 1000

---

### GET /fapi/v1/fundingInfo
Funding rate info — upper/lower limits per symbol.

No parameters required.

Response fields per symbol:
- symbol, adjustedFundingRateCap, adjustedFundingRateFloor, fundingIntervalHours

---

### GET /fapi/v1/klines
Kline/Candlestick data.

Parameters:
- symbol (string, required)
- interval (enum, required): 1m 3m 5m 15m 30m 1h 2h 4h 6h 8h 12h 1d 3d 1w 1M
- startTime / endTime (long, optional)
- limit (int, optional): Default 500, max 1500

Response: Array of [openTime, open, high, low, close, volume, closeTime, quoteVolume, trades, takerBuyBase, takerBuyQuote, ignore]

---

### GET /fapi/v1/continuousKlines
Continuous contract klines.

Parameters:
- pair (string, required): e.g. BTCUSDT
- contractType (enum, required): PERPETUAL | CURRENT_QUARTER | NEXT_QUARTER
- interval (enum, required): same as klines
- startTime / endTime (long, optional)
- limit (int, optional): Default 500, max 1500

---

### GET /fapi/v1/indexPriceKlines
Index price klines.

Parameters:
- pair (string, required): e.g. BTCUSDT
- interval (enum, required)
- startTime / endTime (long, optional)
- limit (int, optional): Default 500, max 1500

---

### GET /fapi/v1/markPriceKlines
Mark price klines.

Parameters:
- symbol (string, required)
- interval (enum, required)
- startTime / endTime (long, optional)
- limit (int, optional): Default 500, max 1500

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

### GET /fapi/v1/topLongShortPositionRatio
Top trader long/short position ratio.

Parameters: same as topLongShortAccountRatio

---

### GET /fapi/v1/globalLongShortAccountRatio
Global long/short account ratio (all users).

Parameters: same as topLongShortAccountRatio

---

### GET /fapi/v1/takerLongShortRatio
Taker buy/sell volume ratio.

Parameters:
- symbol (string, required)
- period (enum, required): 5m 15m 30m 1h 2h 4h 6h 12h 1d
- limit (int, optional): Default 30, max 500
- startTime / endTime (long, optional)

Response fields: buySellRatio, buyVol, sellVol, timestamp

---

### GET /fapi/v1/basis
Basis data (futures vs spot price difference).

Parameters:
- pair (string, required): e.g. BTCUSDT
- contractType (enum, required): PERPETUAL | CURRENT_QUARTER | NEXT_QUARTER
- period (enum, required): 5m 15m 30m 1h 2h 4h 6h 12h 1d
- limit (int, optional): Default 30, max 500
- startTime / endTime (long, optional)

Response fields: indexPrice, contractPrice, futureBasis, annualizedBasisRate, basisRate, timestamp

---

## Account APIs (Auth Required)

### GET /fapi/v3/balance (recommended)
Account asset balances (latest version).

Parameters:
- timestamp (long, required)
- recvWindow (long, optional)

Response fields per asset:
- accountAlias, asset, balance, crossWalletBalance, crossUnPnl, availableBalance, maxWithdrawAmount, marginAvailable, updateTime

---

### GET /fapi/v3/positionRisk (recommended)
Current open positions (latest version).

Parameters:
- symbol (string, optional)
- timestamp (long, required)

Response fields per position:
- symbol, positionSide, positionAmt, entryPrice, breakEvenPrice, markPrice, unRealizedProfit, liquidationPrice, isolatedMargin, notional, marginAsset, isolatedWallet, initialMargin, maintMargin, positionInitialMargin, openOrderInitialMargin, adl, bidNotional, askNotional, updateTime

---

### GET /fapi/v1/positionSide/dual
Query current position mode (one-way or hedge).

Parameters:
- timestamp (long, required)

Response: {"dualSidePosition": true}  // true = hedge mode, false = one-way mode

---

### POST /fapi/v1/positionSide/dual
Change position mode.

Parameters:
- dualSidePosition (string, required): "true" = hedge mode, "false" = one-way mode
- timestamp (long, required)

Note: Cannot change when open positions or open orders exist.

---

### GET /fapi/v1/leverageBracket
Notional and leverage brackets for a symbol.

Parameters:
- symbol (string, optional)
- timestamp (long, required)

Response: bracket info including notionalCap, notionalFloor, maintMarginRatio, cum, initialLeverage

---

### GET /fapi/v1/adlQuantile
ADL quantile estimation for positions.

Parameters:
- symbol (string, optional)
- timestamp (long, required)

Response: adlQuantile value per position (0-4, higher = closer to ADL)

---

### GET /fapi/v1/apiTradingStatus
Account trading quantitative rules indicators.

Parameters:
- symbol (string, optional)
- timestamp (long, required)

Response: indicators per symbol including plannedOrderCount, unfilledOrderCount, etc.

---

### GET /fapi/v1/multiAssetsMargin
Query multi-assets margin mode status.

Parameters:
- timestamp (long, required)

Response: {"multiAssetsMargin": true/false}

---

### POST /fapi/v1/multiAssetsMargin
Change multi-assets margin mode.

Parameters:
- multiAssetsMargin (string, required): "true" or "false"
- timestamp (long, required)

---

### POST /fapi/v1/bnbBurn
Toggle BNB fee discount on futures trades.

Parameters:
- feeBurn (string, required): "true" or "false"
- timestamp (long, required)

---

## Trading APIs (Auth Required)

### POST /fapi/v1/order
Place a new futures order.

Parameters:
- symbol (string, required)
- side (enum, required): BUY | SELL
- positionSide (enum, optional): BOTH (one-way), LONG | SHORT (hedge mode)
- type (enum, required): LIMIT | MARKET | STOP | STOP_MARKET | TAKE_PROFIT | TAKE_PROFIT_MARKET | TRAILING_STOP_MARKET
- quantity (decimal, required*)
- price (decimal, optional): Required for LIMIT
- stopPrice (decimal, optional): Required for STOP/TAKE_PROFIT
- activationPrice (decimal, optional): For TRAILING_STOP_MARKET
- callbackRate (decimal, optional): For TRAILING_STOP_MARKET (0.1–5)
- timeInForce (enum, optional): GTC | IOC | FOK | GTX | GTE_GTC
- reduceOnly (string, optional): "true" or "false"
- closePosition (string, optional): "true" to close all position
- workingType (enum, optional): MARK_PRICE | CONTRACT_PRICE
- priceProtect (string, optional): "true" or "false"
- newClientOrderId (string, optional): Custom order ID
- priceMatch (enum, optional): OPPONENT | OPPONENT_5 | OPPONENT_10 | OPPONENT_20 | QUEUE | QUEUE_5 | QUEUE_10 | QUEUE_20
- selfTradePreventionMode (enum, optional): NONE | EXPIRE_TAKER | EXPIRE_MAKER | EXPIRE_BOTH
- newOrderRespType (enum, optional): ACK | RESULT
- recvWindow (long, optional): Max 60000
- timestamp (long, required)

IMPORTANT: Mainnet orders require user confirmation. Always ask user to type "CONFIRM" before placing.

---

### PUT /fapi/v1/order
Modify an existing order (change price/quantity).

Parameters:
- symbol (string, required)
- side (enum, required): BUY | SELL
- orderId (long, optional*): Either orderId or origClientOrderId required
- origClientOrderId (string, optional*)
- quantity (decimal, required)
- price (decimal, required)
- priceMatch (enum, optional)
- recvWindow (long, optional)
- timestamp (long, required)

---

### DELETE /fapi/v1/order
Cancel an order.

Parameters:
- symbol (string, required)
- orderId (long, optional*): Either orderId or origClientOrderId required
- origClientOrderId (string, optional*)
- timestamp (long, required)

---

### POST /fapi/v1/countdownCancelAll
Auto-cancel all open orders after countdown (dead man's switch).

Parameters:
- symbol (string, required)
- countdownTime (long, required): Countdown in ms. 0 = cancel the timer. Max 86400000 (24h)
- timestamp (long, required)

Note: Must be called repeatedly before countdown expires to keep orders alive. Useful for bot safety.

---

### POST /fapi/v1/batchOrders
Place up to 5 orders in a single request.

Parameters:
- batchOrders (JSON array, required): Array of order objects (same fields as /fapi/v1/order)
- timestamp (long, required)

---

### PUT /fapi/v1/batchOrders
Modify up to 5 orders in a single request.

Parameters:
- batchOrders (JSON array, required): Array of modify objects (same fields as PUT /fapi/v1/order)
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
- marginType (enum, required): ISOLATED | CROSSED
- timestamp (long, required)

---

### POST /fapi/v1/positionMargin
Adjust margin for an isolated position.

Parameters:
- symbol (string, required)
- positionSide (enum, optional): BOTH | LONG | SHORT
- amount (decimal, required)
- type (int, required): 1 = Add margin, 2 = Reduce margin
- timestamp (long, required)

---

### GET /fapi/v1/income
Income and PnL history.

Parameters:
- symbol (string, optional)
- incomeType (enum, optional): TRANSFER | WELCOME_BONUS | REALIZED_PNL | FUNDING_FEE | COMMISSION | INSURANCE_CLEAR | REFERRAL_KICKBACK | COMMISSION_REBATE | API_REBATE | CONTEST_REWARD | CROSS_COLLATERAL_TRANSFER | OPTIONS_PREMIUM_FEE | OPTIONS_SETTLE_PROFIT | INTERNAL_TRANSFER | AUTO_EXCHANGE | DELIVERED_SETTELMENT | COIN_SWAP_DEPOSIT | COIN_SWAP_WITHDRAW | POSITION_LIMIT_INCREASE_FEE
- startTime / endTime (long, optional)
- limit (int, optional): Default 100, max 1000
- timestamp (long, required)

---

### GET /fapi/v1/commissionRate
Query maker/taker commission rates.

Parameters:
- symbol (string, required)
- timestamp (long, required)

Response: symbol, makerCommissionRate, takerCommissionRate

---

## Algo Orders (TWAP / VP)

### POST /fapi/v1/algo/newOrderTwap
New TWAP (Time-Weighted Average Price) algo order.

Parameters:
- symbol (string, required)
- side (enum, required): BUY | SELL
- positionSide (enum, optional): BOTH | LONG | SHORT
- quantity (decimal, required): Total order quantity
- duration (long, required): Execution duration in seconds (300–86400)
- clientAlgoId (string, optional): Custom algo ID
- reduceOnly (boolean, optional)
- limitPrice (decimal, optional): Worst acceptable price
- timestamp (long, required)

---

### POST /fapi/v1/algo/newOrderVp
New VP (Volume Participation) algo order.

Parameters:
- symbol (string, required)
- side (enum, required): BUY | SELL
- positionSide (enum, optional)
- quantity (decimal, required)
- urgency (enum, required): LOW | MEDIUM | HIGH
- clientAlgoId (string, optional)
- reduceOnly (boolean, optional)
- limitPrice (decimal, optional)
- timestamp (long, required)

---

### DELETE /fapi/v1/algo/order
Cancel an algo order.

Parameters:
- algoId (long, required)
- timestamp (long, required)

---

### GET /fapi/v1/algo/openOrders
Current open algo orders.

Parameters:
- timestamp (long, required)

---

### GET /fapi/v1/algo/historicalOrders
Historical algo orders.

Parameters:
- symbol (string, optional)
- side (enum, optional): BUY | SELL
- startTime / endTime (long, optional)
- page (int, optional): Default 1
- pageSize (int, optional): Default 100, max 100
- timestamp (long, required)

---

## User Data Streams

### POST /fapi/v1/listenKey
Create a user data stream. Returns a listenKey valid for 60 minutes.

Headers: X-MBX-APIKEY required (no signature needed)

Response: {"listenKey": "pqia91ma19a5s61cv6a81va65sdf19v8a65a1a5s61cv6a81va65sdf19v8a65a1"}

Subscribe to stream: wss://fstream.binance.com/ws/<listenKey>

---

### PUT /fapi/v1/listenKey
Keepalive user data stream. Extend listenKey validity by 60 minutes.

Headers: X-MBX-APIKEY required (no signature needed)

---

### DELETE /fapi/v1/listenKey
Close user data stream.

Headers: X-MBX-APIKEY required (no signature needed)

---

## WebSocket Streams (Real-time)

Base URL: wss://fstream.binance.com

Common streams:
- <symbol>@aggTrade — Aggregate trade stream
- <symbol>@markPrice — Mark price stream (1s or 3s)
- <symbol>@kline_<interval> — Kline stream
- <symbol>@depth — Order book depth stream
- <symbol>@ticker — 24hr ticker
- <symbol>@bookTicker — Best bid/ask
- <symbol>@forceOrder — Liquidation order stream
- !markPrice@arr — All mark prices
- !miniTicker@arr — All market mini tickers

User data stream events (via listenKey):
- ORDER_TRADE_UPDATE — Order/trade updates
- ACCOUNT_UPDATE — Balance and position updates
- MARGIN_CALL — Margin call notification
- ACCOUNT_CONFIG_UPDATE — Leverage change notification

---

## Authentication

HMAC SHA256 signing:
1. Build query string with all params + timestamp (Unix ms)
2. Sign: echo -n "$QUERY" | openssl dgst -sha256 -hmac "$SECRET_KEY" | cut -d' ' -f2
3. Append &signature=<sig> to query string
4. Header: X-MBX-APIKEY: <api_key>

RSA signing also supported (PKCS#8). URL-encode the base64 signature.

---

## Binance Futures Accounts

Store credentials in TOOLS.md under "## Binance Futures Accounts":

### main-futures
- API Key: abc123...xyz
- Secret: secret...key
- Testnet: false

### Agent Behavior
1. Mask secrets — show only last 5 chars: ***...aws1
2. List accounts by name + environment only, never full keys
3. Mainnet orders: always ask user to type "CONFIRM" before placing
4. Default to main-futures account if ambiguous
5. Never store or log plaintext secrets

---

## Notes

1. positionAmt negative = short position
2. Funding charged every 8 hours (00:00, 08:00, 16:00 UTC); some symbols every 4h or 1h
3. lastFundingRate positive = longs pay shorts; negative = shorts pay longs
4. Hedge mode: specify positionSide (LONG/SHORT); one-way mode: use BOTH
5. reduceOnly=true ensures order only reduces existing position
6. closePosition=true closes entire position regardless of quantity
7. batchOrders max 5 orders per request
8. countdownCancelAll: call repeatedly (e.g. every 30s) to keep orders alive; set to 0 to disable
9. listenKey expires after 60 minutes; use PUT to extend
10. v3 endpoints (/fapi/v3/*) are the latest versions; prefer over v2
11. HTTP 503 with "Unknown error": do NOT assume failure — verify order status before retrying
