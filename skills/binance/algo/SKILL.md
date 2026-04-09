---
name: algo
description: Binance Algo request using the Binance API. Authentication requires API key and secret key. 
metadata:
  version: 1.1.0
  author: Binance
  openclaw:
    requires:
      bins:
        - curl
        - openssl
        - date
    homepage: https://github.com/binance/binance-skills-hub/tree/main/skills/binance/algo/SKILL.md
license: MIT
---

# Binance Algo Skill

Algo request on Binance using authenticated API endpoints. Requires API key and secret key for certain endpoints. Return the result in JSON format.

## Quick Reference

| Endpoint | Description | Required | Optional | Authentication |
|----------|-------------|----------|----------|----------------|
| `/sapi/v1/algo/futures/order` (DELETE) | Cancel Algo Order(TRADE) | algoId | recvWindow | Yes |
| `/sapi/v1/algo/futures/openOrders` (GET) | Query Current Algo Open Orders(USER_DATA) | None | recvWindow | Yes |
| `/sapi/v1/algo/futures/historicalOrders` (GET) | Query Historical Algo Orders(USER_DATA) | None | symbol, side, startTime, endTime, page, pageSize, recvWindow | Yes |
| `/sapi/v1/algo/futures/subOrders` (GET) | Query Sub Orders(USER_DATA) | algoId | page, pageSize, recvWindow | Yes |
| `/sapi/v1/algo/futures/newOrderTwap` (POST) | Time-Weighted Average Price(Twap) New Order(TRADE) | symbol, side, quantity, duration | positionSide, clientAlgoId, reduceOnly, limitPrice, recvWindow | Yes |
| `/sapi/v1/algo/futures/newOrderVp` (POST) | Volume Participation(VP) New Order (TRADE) | symbol, side, quantity, urgency | positionSide, clientAlgoId, reduceOnly, limitPrice, recvWindow | Yes |
| `/sapi/v1/algo/spot/order` (DELETE) | Cancel Algo Order(TRADE) | algoId | recvWindow | Yes |
| `/sapi/v1/algo/spot/openOrders` (GET) | Query Current Algo Open Orders(USER_DATA) | None | recvWindow | Yes |
| `/sapi/v1/algo/spot/historicalOrders` (GET) | Query Historical Algo Orders(USER_DATA) | None | symbol, side, startTime, endTime, page, pageSize, recvWindow | Yes |
| `/sapi/v1/algo/spot/subOrders` (GET) | Query Sub Orders(USER_DATA) | algoId | page, pageSize, recvWindow | Yes |
| `/sapi/v1/algo/spot/newOrderTwap` (POST) | Time-Weighted Average Price(Twap) New Order(TRADE) | symbol, side, quantity, duration | clientAlgoId, limitPrice | Yes |

---

## Parameters

### Common Parameters

* **algoId**: eg. 14511 (e.g., 1)
* **recvWindow**:  (e.g., 5000)
* **symbol**: Trading symbol eg. BTCUSDT (e.g., BTCUSDT)
* **side**: BUY or SELL (e.g., BUY)
* **startTime**: in milliseconds  eg.1641522717552 (e.g., 1623319461670)
* **endTime**: in milliseconds  eg.1641522526562 (e.g., 1641782889000)
* **page**: Default is 1 (e.g., 1)
* **pageSize**: MIN 1, MAX 100; Default 100 (e.g., 100)
* **symbol**: Trading symbol eg. BTCUSDT (e.g., BTCUSDT)
* **side**: Trading side ( BUY or SELL ) (e.g., BUY)
* **positionSide**: Default `BOTH` for One-way Mode ; `LONG` or `SHORT` for Hedge Mode. It must be sent in Hedge Mode. (e.g., BOTH)
* **quantity**: Quantity of base asset; Maximum notional per order is 200k, 2mm or 10mm, depending on symbol. Please reduce your size if you order is above the maximum notional per order. (e.g., 1.0)
* **duration**: Duration for TWAP orders in seconds. [300, 86400] (e.g., 5000)
* **clientAlgoId**: A unique id among Algo orders (length should be 32 characters)， If it is not sent, we will give default value (e.g., 1)
* **reduceOnly**: "true" or "false". Default "false"; Cannot be sent in Hedge Mode; Cannot be sent when you open a position
* **limitPrice**: Limit price of the order; If it is not sent, will place order by market price by default (e.g., 1.0)
* **urgency**: Represent the relative speed of the current execution; ENUM: LOW, MEDIUM, HIGH (e.g., LOW)


## Authentication

For endpoints that require authentication, you will need to provide Binance API credentials.
Required credentials:

* apiKey: Your Binance API key (for header)
* secretKey: Your Binance API secret (for signing)

Base URLs:
* Mainnet: https://api.binance.com

## Security

### Share Credentials

Users can provide Binance API credentials in different ways. The agent will try to retrieve automatically with the two first ways the credentials, but users can also explicitly tell the agent that they have set the credentials or stored them in a `.env` file, and the agent should re-read that file when they do. The agent can also make http requests with the two first methods without user confirmation.

1. **Environment variables**

Search for the following specific variables only (never dump the full environment):

**Authorized environment variables**
- Mainnet: `BINANCE_API_KEY` and `BINANCE_SECRET_KEY`

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

### Listing Accounts

When listing accounts, show names and environment only — never keys:
Binance Accounts:
* main (Mainnet)
* futures-keys (Mainnet)

### Transactions in Mainnet

When performing transactions in mainnet, always confirm with the user before proceeding by asking them to write "CONFIRM" to proceed.

---

## Binance Accounts

### main
- API Key: your_mainnet_api_key
- Secret: your_mainnet_secret

### TOOLS.md Structure

```bash
## Binance Accounts

### main
- API Key: abc123...xyz
- Secret: secret123...key
- Description: Primary trading account

### futures-keys
- API Key: futures789...def
- Secret: futuressecret...uvw
- Description: Futures trading account
```

## Agent Behavior

1. Credentials requested: Mask secrets (show last 5 chars only)
2. Listing accounts: Show names and environment, never keys
3. Account selection: Ask if ambiguous, default to main
4. When doing a transaction in mainnet, confirm with user before by asking to write "CONFIRM" to proceed
5. New credentials: Prompt for name, environment, signing mode

## Adding New Accounts

When user provides new credentials by Inline file or message:

* Ask for account name
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

Include `User-Agent` header with the following string: `binance-algo/1.1.0 (Skill)`

See [`references/authentication.md`](./references/authentication.md) for implementation details.
