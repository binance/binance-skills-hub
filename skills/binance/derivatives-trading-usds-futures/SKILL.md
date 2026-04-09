---
name: derivatives-trading-usds-futures
description: Binance Derivatives-trading-usds-futures request using the Binance API. Authentication requires API key and secret key. Supports testnet and mainnet.
metadata:
  version: 1.1.0
  author: Binance
  openclaw:
    requires:
      bins:
        - curl
        - openssl
        - date
    homepage: https://github.com/binance/binance-skills-hub/tree/main/skills/binance/derivatives-trading-usds-futures/SKILL.md
license: MIT
---

# Binance Derivatives-trading-usds-futures Skill

Derivatives-trading-usds-futures request on Binance using authenticated API endpoints. Requires API key and secret key for certain endpoints. Return the result in JSON format.

## Quick Reference

| Endpoint | Description | Required | Optional | Authentication |
|----------|-------------|----------|----------|----------------|
| `/fapi/v1/accountConfig` (GET) | Futures Account Configuration(USER_DATA) | None | recvWindow | Yes |
| `/fapi/v2/account` (GET) | Account Information V2(USER_DATA) | None | recvWindow | Yes |
| `/fapi/v3/account` (GET) | Account Information V3(USER_DATA) | None | recvWindow | Yes |
| `/fapi/v2/balance` (GET) | Futures Account Balance V2 (USER_DATA) | None | recvWindow | Yes |
| `/fapi/v3/balance` (GET) | Futures Account Balance V3 (USER_DATA) | None | recvWindow | Yes |
| `/fapi/v1/apiTradingStatus` (GET) | Futures Trading Quantitative Rules Indicators (USER_DATA) | None | symbol, recvWindow | Yes |
| `/fapi/v1/feeBurn` (GET) | Get BNB Burn Status (USER_DATA) | None | recvWindow | Yes |
| `/fapi/v1/feeBurn` (POST) | Toggle BNB Burn On Futures Trade (TRADE) | feeBurn | recvWindow | Yes |
| `/fapi/v1/multiAssetsMargin` (GET) | Get Current Multi-Assets Mode (USER_DATA) | None | recvWindow | Yes |
| `/fapi/v1/multiAssetsMargin` (POST) | Change Multi-Assets Mode (TRADE) | multiAssetsMargin | recvWindow | Yes |
| `/fapi/v1/positionSide/dual` (GET) | Get Current Position Mode(USER_DATA) | None | recvWindow | Yes |
| `/fapi/v1/positionSide/dual` (POST) | Change Position Mode(TRADE) | dualSidePosition | recvWindow | Yes |
| `/fapi/v1/order/asyn` (GET) | Get Download Id For Futures Order History (USER_DATA) | startTime, endTime | recvWindow | Yes |
| `/fapi/v1/trade/asyn` (GET) | Get Download Id For Futures Trade History (USER_DATA) | startTime, endTime | recvWindow | Yes |
| `/fapi/v1/income/asyn` (GET) | Get Download Id For Futures Transaction History(USER_DATA) | startTime, endTime | recvWindow | Yes |
| `/fapi/v1/order/asyn/id` (GET) | Get Futures Order History Download Link by Id (USER_DATA) | downloadId | recvWindow | Yes |
| `/fapi/v1/trade/asyn/id` (GET) | Get Futures Trade Download Link by Id(USER_DATA) | downloadId | recvWindow | Yes |
| `/fapi/v1/income/asyn/id` (GET) | Get Futures Transaction History Download Link by Id (USER_DATA) | downloadId | recvWindow | Yes |
| `/fapi/v1/income` (GET) | Get Income History (USER_DATA) | None | symbol, incomeType, startTime, endTime, page, limit, recvWindow | Yes |
| `/fapi/v1/leverageBracket` (GET) | Notional and Leverage Brackets (USER_DATA) | None | symbol, recvWindow | Yes |
| `/fapi/v1/rateLimit/order` (GET) | Query User Rate Limit (USER_DATA) | None | recvWindow | Yes |
| `/fapi/v1/symbolConfig` (GET) | Symbol Configuration(USER_DATA) | None | symbol, recvWindow | Yes |
| `/fapi/v1/commissionRate` (GET) | User Commission Rate (USER_DATA) | symbol | recvWindow | Yes |
| `/fapi/v1/convert/acceptQuote` (POST) | Accept the offered quote (USER_DATA) | quoteId | recvWindow | Yes |
| `/fapi/v1/convert/exchangeInfo` (GET) | List All Convert Pairs | None | fromAsset, toAsset | No |
| `/fapi/v1/convert/orderStatus` (GET) | Order status(USER_DATA) | None | orderId, quoteId | Yes |
| `/fapi/v1/convert/getQuote` (POST) | Send Quote Request(USER_DATA) | fromAsset, toAsset | fromAmount, toAmount, validTime, recvWindow | Yes |
| `/fapi/v1/ticker/24hr` (GET) | 24hr Ticker Price Change Statistics | None | symbol | No |
| `/fapi/v1/symbolAdlRisk` (GET) | ADL Risk | None | symbol | No |
| `/futures/data/basis` (GET) | Basis | pair, contractType, period, limit | startTime, endTime | No |
| `/fapi/v1/time` (GET) | Check Server Time | None | None | No |
| `/fapi/v1/indexInfo` (GET) | Composite Index Symbol Information | None | symbol | No |
| `/fapi/v1/aggTrades` (GET) | Compressed/Aggregate Trades List | symbol | fromId, startTime, endTime, limit | No |
| `/fapi/v1/continuousKlines` (GET) | Continuous Contract Kline/Candlestick Data | pair, contractType, interval | startTime, endTime, limit | No |
| `/futures/data/delivery-price` (GET) | Quarterly Contract Settlement Price | pair | None | No |
| `/fapi/v1/exchangeInfo` (GET) | Exchange Information | None | None | No |
| `/fapi/v1/fundingRate` (GET) | Get Funding Rate History | None | symbol, startTime, endTime, limit | No |
| `/fapi/v1/fundingInfo` (GET) | Get Funding Rate Info | None | None | No |
| `/fapi/v1/constituents` (GET) | Query Index Price Constituents | symbol | None | No |
| `/fapi/v1/indexPriceKlines` (GET) | Index Price Kline/Candlestick Data | pair, interval | startTime, endTime, limit | No |
| `/fapi/v1/insuranceBalance` (GET) | Query Insurance Fund Balance Snapshot | None | symbol | No |
| `/fapi/v1/klines` (GET) | Kline/Candlestick Data | symbol, interval | startTime, endTime, limit | No |
| `/futures/data/globalLongShortAccountRatio` (GET) | Long/Short Ratio | symbol, period | limit, startTime, endTime | No |
| `/fapi/v1/markPriceKlines` (GET) | Mark Price Kline/Candlestick Data | symbol, interval | startTime, endTime, limit | No |
| `/fapi/v1/premiumIndex` (GET) | Mark Price | None | symbol | No |
| `/fapi/v1/assetIndex` (GET) | Multi-Assets Mode Asset Index | None | symbol | No |
| `/fapi/v1/historicalTrades` (GET) | Old Trades Lookup (MARKET_DATA) | symbol | limit, fromId | No |
| `/futures/data/openInterestHist` (GET) | Open Interest Statistics | symbol, period | limit, startTime, endTime | No |
| `/fapi/v1/openInterest` (GET) | Open Interest | symbol | None | No |
| `/fapi/v1/rpiDepth` (GET) | RPI Order Book | symbol | limit | No |
| `/fapi/v1/depth` (GET) | Order Book | symbol | limit | No |
| `/fapi/v1/premiumIndexKlines` (GET) | Premium index Kline Data | symbol, interval | startTime, endTime, limit | No |
| `/fapi/v1/trades` (GET) | Recent Trades List | symbol | limit | No |
| `/fapi/v1/ticker/bookTicker` (GET) | Symbol Order Book Ticker | None | symbol | No |
| `/fapi/v2/ticker/price` (GET) | Symbol Price Ticker V2 | None | symbol | No |
| `/fapi/v1/ticker/price` (GET) | Symbol Price Ticker | None | symbol | No |
| `/futures/data/takerlongshortRatio` (GET) | Taker Buy/Sell Volume | symbol, period | limit, startTime, endTime | No |
| `/fapi/v1/ping` (GET) | Test Connectivity | None | None | No |
| `/futures/data/topLongShortAccountRatio` (GET) | Top Trader Long/Short Ratio (Accounts) | symbol, period | limit, startTime, endTime | No |
| `/futures/data/topLongShortPositionRatio` (GET) | Top Trader Long/Short Ratio (Positions) | symbol, period | limit, startTime, endTime | No |
| `/fapi/v1/tradingSchedule` (GET) | Trading Schedule | None | None | No |
| `/fapi/v1/pmAccountInfo` (GET) | Classic Portfolio Margin Account Information (USER_DATA) | asset | recvWindow | Yes |
| `/fapi/v1/userTrades` (GET) | Account Trade List (USER_DATA) | symbol | orderId, startTime, endTime, fromId, limit, recvWindow | Yes |
| `/fapi/v1/allOrders` (GET) | All Orders (USER_DATA) | symbol | orderId, startTime, endTime, limit, recvWindow | Yes |
| `/fapi/v1/countdownCancelAll` (POST) | Auto-Cancel All Open Orders (TRADE) | symbol, countdownTime | recvWindow | Yes |
| `/fapi/v1/algoOrder` (DELETE) | Cancel Algo Order (TRADE) | None | algoId, clientAlgoId, recvWindow | Yes |
| `/fapi/v1/algoOrder` (POST) | New Algo Order(TRADE) | algoType, symbol, side, type | positionSide, timeInForce, quantity, price, triggerPrice, workingType, priceMatch, closePosition, priceProtect, reduceOnly, activatePrice, callbackRate, clientAlgoId, newOrderRespType, selfTradePreventionMode, goodTillDate, recvWindow | Yes |
| `/fapi/v1/algoOrder` (GET) | Query Algo Order (USER_DATA) | None | algoId, clientAlgoId, recvWindow | Yes |
| `/fapi/v1/algoOpenOrders` (DELETE) | Cancel All Algo Open Orders (TRADE) | symbol | recvWindow | Yes |
| `/fapi/v1/allOpenOrders` (DELETE) | Cancel All Open Orders (TRADE) | symbol | recvWindow | Yes |
| `/fapi/v1/batchOrders` (DELETE) | Cancel Multiple Orders (TRADE) | symbol | orderIdList, origClientOrderIdList, recvWindow | Yes |
| `/fapi/v1/batchOrders` (PUT) | Modify Multiple Orders(TRADE) | batchOrders | recvWindow | Yes |
| `/fapi/v1/batchOrders` (POST) | Place Multiple Orders(TRADE) | batchOrders | recvWindow | Yes |
| `/fapi/v1/order` (DELETE) | Cancel Order (TRADE) | symbol | orderId, origClientOrderId, recvWindow | Yes |
| `/fapi/v1/order` (PUT) | Modify Order (TRADE) | symbol, side, quantity, price | orderId, origClientOrderId, priceMatch, recvWindow | Yes |
| `/fapi/v1/order` (POST) | New Order(TRADE) | symbol, side, type | positionSide, timeInForce, quantity, reduceOnly, price, newClientOrderId, newOrderRespType, priceMatch, selfTradePreventionMode, goodTillDate, recvWindow | Yes |
| `/fapi/v1/order` (GET) | Query Order (USER_DATA) | symbol | orderId, origClientOrderId, recvWindow | Yes |
| `/fapi/v1/leverage` (POST) | Change Initial Leverage(TRADE) | symbol, leverage | recvWindow | Yes |
| `/fapi/v1/marginType` (POST) | Change Margin Type(TRADE) | symbol, marginType | recvWindow | Yes |
| `/fapi/v1/openAlgoOrders` (GET) | Current All Algo Open Orders (USER_DATA) | None | algoType, symbol, algoId, recvWindow | Yes |
| `/fapi/v1/openOrders` (GET) | Current All Open Orders (USER_DATA) | None | symbol, recvWindow | Yes |
| `/fapi/v1/orderAmendment` (GET) | Get Order Modify History (USER_DATA) | symbol | orderId, origClientOrderId, startTime, endTime, limit, recvWindow | Yes |
| `/fapi/v1/positionMargin/history` (GET) | Get Position Margin Change History (TRADE) | symbol | type, startTime, endTime, limit, recvWindow | Yes |
| `/fapi/v1/positionMargin` (POST) | Modify Isolated Position Margin(TRADE) | symbol, amount, type | positionSide, recvWindow | Yes |
| `/fapi/v1/order/test` (POST) | Test Order(TRADE) | symbol, side, type | positionSide, timeInForce, quantity, reduceOnly, price, newClientOrderId, stopPrice, closePosition, activationPrice, callbackRate, workingType, priceProtect, newOrderRespType, priceMatch, selfTradePreventionMode, goodTillDate, recvWindow | Yes |
| `/fapi/v1/adlQuantile` (GET) | Position ADL Quantile Estimation(USER_DATA) | None | symbol, recvWindow | Yes |
| `/fapi/v2/positionRisk` (GET) | Position Information V2 (USER_DATA) | None | symbol, recvWindow | Yes |
| `/fapi/v3/positionRisk` (GET) | Position Information V3 (USER_DATA) | None | symbol, recvWindow | Yes |
| `/fapi/v1/allAlgoOrders` (GET) | Query All Algo Orders (USER_DATA) | symbol | algoId, startTime, endTime, page, limit, recvWindow | Yes |
| `/fapi/v1/openOrder` (GET) | Query Current Open Order (USER_DATA) | symbol | orderId, origClientOrderId, recvWindow | Yes |
| `/fapi/v1/stock/contract` (POST) | Futures TradFi Perps Contract(USER_DATA) | None | recvWindow | Yes |
| `/fapi/v1/forceOrders` (GET) | User's Force Orders (USER_DATA) | None | symbol, autoCloseType, startTime, endTime, limit, recvWindow | Yes |
| `/fapi/v1/listenKey` (DELETE) | Close User Data Stream (USER_STREAM) | None | None | No |
| `/fapi/v1/listenKey` (PUT) | Keepalive User Data Stream (USER_STREAM) | None | None | No |
| `/fapi/v1/listenKey` (POST) | Start User Data Stream (USER_STREAM) | None | None | No |

---

## Parameters

### Common Parameters

* **recvWindow**:  (e.g., 5000)
* **symbol**: 
* **startTime**: Timestamp in ms (e.g., 1623319461670)
* **endTime**: Timestamp in ms (e.g., 1641782889000)
* **downloadId**: get by download id api (e.g., 1)
* **incomeType**: TRANSFER, WELCOME_BONUS, REALIZED_PNL, FUNDING_FEE, COMMISSION, INSURANCE_CLEAR, REFERRAL_KICKBACK, COMMISSION_REBATE, API_REBATE, CONTEST_REWARD, CROSS_COLLATERAL_TRANSFER, OPTIONS_PREMIUM_FEE, OPTIONS_SETTLE_PROFIT, INTERNAL_TRANSFER, AUTO_EXCHANGE, DELIVERED_SETTELMENT, COIN_SWAP_DEPOSIT, COIN_SWAP_WITHDRAW, POSITION_LIMIT_INCREASE_FEE, STRATEGY_UMFUTURES_TRANSFER，FEE_RETURN，BFUSD_REWARD
* **startTime**:  (e.g., 1623319461670)
* **endTime**:  (e.g., 1641782889000)
* **page**: 
* **limit**: Default 100; max 1000 (e.g., 100)
* **feeBurn**: "true": Fee Discount On; "false": Fee Discount Off
* **symbol**: 
* **quoteId**:  (e.g., 1)
* **fromAsset**: User spends coin
* **toAsset**: User receives coin
* **orderId**: Either orderId or quoteId is required (e.g., 1)
* **quoteId**: Either orderId or quoteId is required (e.g., 1)
* **fromAsset**: 
* **toAsset**: 
* **fromAmount**: When specified, it is the amount you will be debited after the conversion (e.g., 1.0)
* **toAmount**: When specified, it is the amount you will be credited after the conversion (e.g., 1.0)
* **validTime**: 10s, default 10s (e.g., 10s)
* **pair**: 
* **limit**: Default 30,Max 500 (e.g., 30)
* **fromId**: ID to get aggregate trades from INCLUSIVE. (e.g., 1)
* **asset**: 
* **orderId**:  (e.g., 1)
* **countdownTime**: countdown time, 1000 for 1 second. 0 to cancel the timer
* **algoId**:  (e.g., 1)
* **clientAlgoId**:  (e.g., 1)
* **orderIdList**: max length 10   e.g. [1234567,2345678]
* **origClientOrderIdList**: max length 10  e.g. ["my_id_1","my_id_2"], encode the double quotes. No space after comma.
* **origClientOrderId**:  (e.g., 1)
* **leverage**: target initial leverage: int from 1 to 125
* **multiAssetsMargin**: "true": Multi-Assets Mode; "false": Single-Asset Mode
* **dualSidePosition**: "true": Hedge Mode; "false": One-way Mode
* **algoType**: 
* **type**: 1: Add position margin，2: Reduce position margin
* **amount**:  (e.g., 1.0)
* **type**: 
* **batchOrders**: order list. Max 5 orders
* **quantity**: Order quantity, cannot be sent with `closePosition=true` (e.g., 1.0)
* **price**:  (e.g., 1.0)
* **algoType**: Only support `CONDITIONAL`
* **quantity**:  (e.g., 1.0)
* **price**:  (e.g., 1.0)
* **triggerPrice**:  (e.g., 1.0)
* **closePosition**: `true`, `false`；Close-All，used with `STOP_MARKET` or `TAKE_PROFIT_MARKET`.
* **priceProtect**: "TRUE" or "FALSE", default "FALSE". Used with `STOP/STOP_MARKET` or `TAKE_PROFIT/TAKE_PROFIT_MARKET` orders.
* **reduceOnly**: "true" or "false". default "false". Cannot be sent in Hedge Mode
* **activatePrice**: Used with `TRAILING_STOP_MARKET` orders, default as the latest price(supporting different `workingType`) (e.g., 1.0)
* **callbackRate**: Used with `TRAILING_STOP_MARKET` orders, min 0.1, max 5 where 1 for 1% (e.g., 1.0)
* **goodTillDate**: order cancel time for timeInForce `GTD`, mandatory when `timeInforce` set to `GTD`; order the timestamp only retains second-level precision, ms part will be ignored; The goodTillDate timestamp must be greater than the current time plus 600 seconds and smaller than 253402300799000
* **newClientOrderId**: A unique id among open orders. Automatically generated if not sent. Can only be string following the rule: `^[\.A-Z\:/a-z0-9_-]{1,36}$` (e.g., 1)
* **stopPrice**: Used with `STOP/STOP_MARKET` or `TAKE_PROFIT/TAKE_PROFIT_MARKET` orders. (e.g., 1.0)
* **activationPrice**: Used with `TRAILING_STOP_MARKET` orders, default as the latest price(supporting different `workingType`) (e.g., 1.0)
* **batchOrders**: order list. Max 5 orders


### Enums

* **contractType**: PERPETUAL | CURRENT_MONTH | NEXT_MONTH | CURRENT_QUARTER | NEXT_QUARTER | PERPETUAL_DELIVERING
* **period**: 5m | 15m | 30m | 1h | 2h | 4h | 6h | 12h | 1d
* **interval**: 1m | 3m | 5m | 15m | 30m | 1h | 2h | 4h | 6h | 8h | 12h | 1d | 3d | 1w | 1M
* **marginType**: ISOLATED | CROSSED
* **positionSide**: BOTH | LONG | SHORT
* **side**: BUY | SELL
* **priceMatch**: NONE | OPPONENT | OPPONENT_5 | OPPONENT_10 | OPPONENT_20 | QUEUE | QUEUE_5 | QUEUE_10 | QUEUE_20
* **timeInForce**: GTC | IOC | FOK | GTX | GTD | RPI
* **workingType**: MARK_PRICE | CONTRACT_PRICE
* **newOrderRespType**: ACK | RESULT
* **selfTradePreventionMode**: EXPIRE_TAKER | EXPIRE_BOTH | EXPIRE_MAKER
* **autoCloseType**: LIQUIDATION | ADL


## Authentication

For endpoints that require authentication, you will need to provide Binance API credentials.
Required credentials:

* apiKey: Your Binance API key (for header)
* secretKey: Your Binance API secret (for signing)

Base URLs:
* Mainnet: https://fapi.binance.com
* Testnet: https://demo-fapi.binance.com

## Security

### Share Credentials

Users can provide Binance API credentials in different ways. The agent will try to retrieve automatically with the two first ways the credentials, but users can also explicitly tell the agent that they have set the credentials or stored them in a `.env` file, and the agent should re-read that file when they do. The agent can also make http requests with the two first methods without user confirmation.

1. **Environment variables**

Search for the following specific variables only (never dump the full environment):

**Authorized environment variables**
- Mainnet: `BINANCE_API_KEY` and `BINANCE_SECRET_KEY`
- Testnet: `BINANCE_TESTNET_API_KEY` and `BINANCE_TESTNET_SECRET_KEY`

Read and use in a single exec call so the raw key never enters the agent's context:
```bash
KEY="$BINANCE_API_KEY"
SECRET="$BINANCE_SECRET_KEY"

response=$(curl -s -X GET "$URL" \
  -H "X-MBX-APIKEY: $KEY" \
  --data-urlencode "param1=value1")

echo "$response"
```

Environment variables must be set before OpenClaw starts. They are inherited at process startup and cannot be injected into a running instance. If you need to add or update credentials without restarting, use a secrets file (see option 2).

2. **Secrets file (.env)**

Check `~/.openclaw/secrets.env` , `~/.env`, or a `.env` file in the workspace. Read individual keys with `grep`, never source the full file:
```bash
# Try all credential locations in order
API_KEY=$(grep '^BINANCE_API_KEY=' ~/.openclaw/secrets.env 2>/dev/null | cut -d= -f2-)
SECRET_KEY=$(grep '^BINANCE_SECRET_KEY=' ~/.openclaw/secrets.env 2>/dev/null | cut -d= -f2-)

# Fallback: search .env in known directories (KEY=VALUE then raw line format)
for dir in ~/.openclaw ~; do
  [ -n "$API_KEY" ] && break
  env_file="$dir/.env"
  [ -f "$env_file" ] || continue

  # Read first two lines
  line1=$(sed -n '1p' "$env_file")
  line2=$(sed -n '2p' "$env_file")

  # Check if lines contain '=' indicating KEY=VALUE format
  if [[ "$line1" == *=* && "$line2" == *=* ]]; then
    API_KEY=$(grep '^BINANCE_API_KEY=' "$env_file" 2>/dev/null | cut -d= -f2-)
    SECRET_KEY=$(grep '^BINANCE_SECRET_KEY=' "$env_file" 2>/dev/null | cut -d= -f2-)
  else
    # Treat lines as raw values
    API_KEY="$line1"
    SECRET_KEY="$line2"
  fi
done
```

This file can be updated at any time without restarting OpenClaw, keys are read fresh on each invocation. Users can tell you the variables are now set or stored in a `.env` file, and you should re-read that file when they do.

3. **Inline file**

Sending a file where the content is in the following format:

```bash
abc123...xyz
secret123...key
```

* Never run `printenv`, `env`, `export`, or set without a specific variable name
* Never run `grep` on `env` files without anchoring to a specific key ('`^VARNAME='`)
* Never source a secrets file into the shell environment (`source .env` or `. .env`)
* Only read credentials explicitly needed for the current task
* Never echo or log raw credentials in output or replies
* Never commit `TOOLS.md` to version control if it contains real credentials — add it to `.gitignore`

### Never Disclose API Key and Secret

Never disclose the location of the API key and secret file.

Never send the API key and secret to any website other than Mainnet and Testnet.

### Never Display Full Secrets

When showing credentials to users:
- **API Key:** Show first 5 + last 4 characters: `su1Qc...8akf`
- **Secret Key:** Always mask, show only last 5: `***...aws1`

Example response when asked for credentials:
Account: main
API Key: su1Qc...8akf
Secret: ***...aws1
Environment: Mainnet

### Listing Accounts

When listing accounts, show names and environment only — never keys:
Binance Accounts:
* main (Mainnet/Testnet)
* testnet-dev (Testnet)
* futures-keys (Mainnet)

### Transactions in Mainnet

When performing transactions in mainnet, always confirm with the user before proceeding by asking them to write "CONFIRM" to proceed.

---

## Binance Accounts

### main
- API Key: your_mainnet_api_key
- Secret: your_mainnet_secret
- Testnet: false 

### testnet-dev
- API Key: your_testnet_api_key
- Secret: your_testnet_secret
- Testnet: true

### TOOLS.md Structure

```bash
## Binance Accounts

### main
- API Key: abc123...xyz
- Secret: secret123...key
- Testnet: false
- Description: Primary trading account

### testnet-dev
- API Key: test456...abc
- Secret: testsecret...xyz
- Testnet: true
- Description: Development/testing

### futures-keys
- API Key: futures789...def
- Secret: futuressecret...uvw
- Testnet: false
- Description: Futures trading account
```

## Agent Behavior

1. Credentials requested: Mask secrets (show last 5 chars only)
2. Listing accounts: Show names and environment, never keys
3. Account selection: Ask if ambiguous, default to main
4. When doing a transaction in mainnet, confirm with user before by asking to write "CONFIRM" to proceed
5. New credentials: Prompt for name, environment, signing mode
6. When a request requires signing, if the request isn't an order and the API keys aren't described as `mainnet` or `testnet` keys, try to make request to the different base urls and see if it works, without asking the user. If it works, store the keys with the corresponding environment.

## Adding New Accounts

When user provides new credentials by Inline file or message:

* Ask for account name
* Ask: Mainnet, Testnet 
* Store in `TOOLS.md` with masked display confirmation 

## Signing Requests

For trading endpoints that require a signature:

1. **Detect key type first**, inspect the secret key format before signing.
2. Build query string with all parameters, including the timestamp (Unix ms).
3. Percent-encode the parameters using UTF-8 according to RFC 3986.
4. Sign query string with secretKey using HMAC SHA256, RSA, or Ed25519 (depending on the account configuration).
5. Append signature to query string.
6. Include `X-MBX-APIKEY` header.

Otherwise, do not perform steps 4–6.

## New Client Order ID 

For endpoints that include the `newClientOrderId` parameter, the value must always start with `agent-`. If the parameter is not provided, `agent-` followed by 18 random alphanumeric characters will be generated automatically. If a value is provided, it will be prefixed with `agent-`

Example: `agent-1a2b3c4d5e6f7g8h9i`

## User Agent Header

Include `User-Agent` header with the following string: `binance-derivatives-trading-usds-futures/1.1.0 (Skill)`

See [`references/authentication.md`](./references/authentication.md) for implementation details.
