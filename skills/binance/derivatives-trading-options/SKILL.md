---
name: derivatives-trading-options
description: Binance Derivatives-trading-options request using the Binance API. Authentication requires API key and secret key. Supports testnet and mainnet.
metadata:
  version: 1.1.0
  author: Binance
  openclaw:
    requires:
      bins:
        - curl
        - openssl
        - date
    homepage: https://github.com/binance/binance-skills-hub/tree/main/skills/binance/derivatives-trading-options/SKILL.md
license: MIT
---

# Binance Derivatives-trading-options Skill

Derivatives-trading-options request on Binance using authenticated API endpoints. Requires API key and secret key for certain endpoints. Return the result in JSON format.

## Quick Reference

| Endpoint | Description | Required | Optional | Authentication |
|----------|-------------|----------|----------|----------------|
| `/eapi/v1/bill` (GET) | Account Funding Flow (USER_DATA) | currency | recordId, startTime, endTime, limit, recvWindow | Yes |
| `/eapi/v1/marginAccount` (GET) | Option Margin Account Information (USER_DATA) | None | recvWindow | Yes |
| `/eapi/v1/block/order/execute` (POST) | Accept Block Trade Order (TRADE) | blockOrderMatchingKey | recvWindow | Yes |
| `/eapi/v1/block/order/execute` (GET) | Query Block Trade Details (USER_DATA) | blockOrderMatchingKey | recvWindow | Yes |
| `/eapi/v1/block/user-trades` (GET) | Account Block Trade List (USER_DATA) | None | endTime, startTime, underlying, recvWindow | Yes |
| `/eapi/v1/block/order/create` (DELETE) | Cancel Block Trade Order (TRADE) | blockOrderMatchingKey | recvWindow | Yes |
| `/eapi/v1/block/order/create` (PUT) | Extend Block Trade Order (TRADE) | blockOrderMatchingKey | recvWindow | Yes |
| `/eapi/v1/block/order/create` (POST) | New Block Trade Order (TRADE) | liquidity, legs | recvWindow | Yes |
| `/eapi/v1/block/order/orders` (GET) | Query Block Trade Order (TRADE) | None | blockOrderMatchingKey, endTime, startTime, underlying, recvWindow | Yes |
| `/eapi/v1/ticker` (GET) | 24hr Ticker Price Change Statistics | None | symbol | No |
| `/eapi/v1/time` (GET) | Check Server Time | None | None | No |
| `/eapi/v1/exchangeInfo` (GET) | Exchange Information | None | None | No |
| `/eapi/v1/exerciseHistory` (GET) | Historical Exercise Records | None | underlying, startTime, endTime, limit | No |
| `/eapi/v1/klines` (GET) | Kline/Candlestick Data | symbol, interval | startTime, endTime, limit | No |
| `/eapi/v1/openInterest` (GET) | Open Interest | underlyingAsset, expiration | None | No |
| `/eapi/v1/mark` (GET) | Option Mark Price | None | symbol | No |
| `/eapi/v1/depth` (GET) | Order Book | symbol | limit | No |
| `/eapi/v1/blockTrades` (GET) | Recent Block Trades List | None | symbol, limit | No |
| `/eapi/v1/trades` (GET) | Recent Trades List | symbol | limit | No |
| `/eapi/v1/index` (GET) | Index Price | underlying | None | No |
| `/eapi/v1/ping` (GET) | Test Connectivity | None | None | No |
| `/eapi/v1/countdownCancelAllHeartBeat` (POST) | Auto-Cancel All Open Orders (Kill-Switch) Heartbeat (TRADE) | underlyings | recvWindow | Yes |
| `/eapi/v1/countdownCancelAll` (GET) | Get Auto-Cancel All Open Orders (Kill-Switch) Config (TRADE) | None | underlying, recvWindow | Yes |
| `/eapi/v1/countdownCancelAll` (POST) | Set Auto-Cancel All Open Orders (Kill-Switch) Config (TRADE) | underlying, countdownTime | recvWindow | Yes |
| `/eapi/v1/mmp` (GET) | Get Market Maker Protection Config (TRADE) | None | underlying, recvWindow | Yes |
| `/eapi/v1/mmpReset` (POST) | Reset Market Maker Protection Config (TRADE) | None | underlying, recvWindow | Yes |
| `/eapi/v1/mmpSet` (POST) | Set Market Maker Protection Config (TRADE) | None | underlying, windowTimeInMilliseconds, frozenTimeInMilliseconds, qtyLimit, deltaLimit, recvWindow | Yes |
| `/eapi/v1/userTrades` (GET) | Account Trade List (USER_DATA) | None | symbol, fromId, startTime, endTime, limit, recvWindow | Yes |
| `/eapi/v1/allOpenOrdersByUnderlying` (DELETE) | Cancel All Option Orders By Underlying (TRADE) | underlying | recvWindow | Yes |
| `/eapi/v1/batchOrders` (DELETE) | Cancel Multiple Option Orders (TRADE) | symbol | orderIds, clientOrderIds, recvWindow | Yes |
| `/eapi/v1/batchOrders` (POST) | Place Multiple Orders(TRADE) | orders | recvWindow | Yes |
| `/eapi/v1/order` (DELETE) | Cancel Option Order (TRADE) | symbol | orderId, clientOrderId, recvWindow | Yes |
| `/eapi/v1/order` (POST) | New Order (TRADE) | symbol, side, type, quantity | price, timeInForce, reduceOnly, postOnly, newOrderRespType, clientOrderId, isMmp, recvWindow | Yes |
| `/eapi/v1/order` (GET) | Query Single Order (TRADE) | symbol | orderId, clientOrderId, recvWindow | Yes |
| `/eapi/v1/allOpenOrders` (DELETE) | Cancel all Option orders on specific symbol (TRADE) | symbol | recvWindow | Yes |
| `/eapi/v1/position` (GET) | Option Position Information (USER_DATA) | None | symbol, recvWindow | Yes |
| `/eapi/v1/openOrders` (GET) | Query Current Open Option Orders (USER_DATA) | None | symbol, orderId, startTime, endTime, recvWindow | Yes |
| `/eapi/v1/historyOrders` (GET) | Query Option Order History (TRADE) | symbol | orderId, startTime, endTime, limit, recvWindow | Yes |
| `/eapi/v1/commission` (GET) | User Commission (USER_DATA) | None | recvWindow | Yes |
| `/eapi/v1/exerciseRecord` (GET) | User Exercise Record (USER_DATA) | None | symbol, startTime, endTime, limit, recvWindow | Yes |
| `/eapi/v1/listenKey` (DELETE) | Close User Data Stream (USER_STREAM) | None | None | No |
| `/eapi/v1/listenKey` (PUT) | Keepalive User Data Stream (USER_STREAM) | None | None | No |
| `/eapi/v1/listenKey` (POST) | Start User Data Stream (USER_STREAM) | None | None | No |

---

## Parameters

### Common Parameters

* **currency**: Asset type, only support USDT  as of now
* **recordId**: Return the recordId and subsequent data, the latest data is returned by default, e.g 100000 (e.g., 1)
* **startTime**: Start Time, e.g 1593511200000 (e.g., 1623319461670)
* **endTime**: End Time, e.g 1593512200000 (e.g., 1641782889000)
* **limit**: Number of result sets returned Default:100 Max:1000 (e.g., 100)
* **recvWindow**:  (e.g., 5000)
* **blockOrderMatchingKey**: 
* **underlying**: underlying, e.g BTCUSDT
* **liquidity**: Taker or Maker
* **legs**: Max 1 (only single leg supported), list of legs parameters in JSON; example: eapi/v1/block/order/create?orders=[{"symbol":"BTC-210115-35000-C", "price":"100","quantity":"0.0002","side":"BUY","type":"LIMIT"}]
* **blockOrderMatchingKey**: If specified, returns the specific block trade associated with the blockOrderMatchingKey
* **symbol**: Option trading pair, e.g BTC-200730-9000-C
* **symbol**: Option trading pair, e.g BTC-200730-9000-C
* **interval**: Time interval
* **underlyingAsset**: underlying asset, e.g ETH/BTC
* **expiration**: expiration date, e.g 221225
* **underlying**: Option underlying, e.g BTCUSDT
* **underlyings**: Option Underlying Symbols, e.g BTCUSDT,ETHUSDT
* **countdownTime**: Countdown time in milliseconds (ex. 1,000 for 1 second). 0 to disable the timer. Negative values (ex. -10000) are not accepted. Minimum acceptable value is 5,000
* **windowTimeInMilliseconds**: MMP Interval in milliseconds; Range (0,5000]
* **frozenTimeInMilliseconds**: MMP frozen time in milliseconds, if set to 0 manual reset is required
* **qtyLimit**: quantity limit (e.g., 1.0)
* **deltaLimit**: net delta limit (e.g., 1.0)
* **fromId**: Trade id to fetch from. Default gets most recent trades, e.g 4611875134427365376 (e.g., 1)
* **orderIds**: Order ID, e.g [4611875134427365377,4611875134427365378]
* **clientOrderIds**: User-defined order ID, e.g ["my_id_1","my_id_2"]
* **orderId**: Order ID, e.g 4611875134427365377 (e.g., 1)
* **clientOrderId**: User-defined order ID, e.g 10000 (e.g., 1)
* **quantity**: Order Quantity (e.g., 1.0)
* **price**: Order Price (e.g., 1.0)
* **reduceOnly**: Reduce Only（Default false） (e.g., false）)
* **postOnly**: Post Only（Default false） (e.g., false）)
* **isMmp**: is market maker protection order, true/false
* **orders**: order list. Max 10 orders


### Enums

* **side**: BUY | SELL
* **type**: LIMIT
* **timeInForce**: GTC | IOC | FOK | GTX
* **newOrderRespType**: ACK | RESULT


## Authentication

For endpoints that require authentication, you will need to provide Binance API credentials.
Required credentials:

* apiKey: Your Binance API key (for header)
* secretKey: Your Binance API secret (for signing)

Base URLs:
* Mainnet: https://eapi.binance.com
* Testnet: https://testnet.binancefuture.com

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

## User Agent Header

Include `User-Agent` header with the following string: `binance-derivatives-trading-options/1.1.0 (Skill)`

See [`references/authentication.md`](./references/authentication.md) for implementation details.
