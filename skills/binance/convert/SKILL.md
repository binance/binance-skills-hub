---
name: convert
description: Binance Convert request using the Binance API. Authentication requires API key and secret key. 
metadata:
  version: 1.0.0
  author: Binance
license: MIT
---

# Binance Convert Skill

Convert request on Binance using authenticated API endpoints. Requires API key and secret key for certain endpoints. Return the result in JSON format.

## Quick Reference

| Endpoint | Description | Required | Optional | Authentication |
|----------|-------------|----------|----------|----------------|
| `/sapi/v1/convert/exchangeInfo` (GET) | List All Convert Pairs | None | fromAsset, toAsset | No |
| `/sapi/v1/convert/assetInfo` (GET) | Query order quantity precision per asset(USER_DATA) | None | recvWindow | Yes |
| `/sapi/v1/convert/acceptQuote` (POST) | Accept Quote (TRADE) | quoteId | recvWindow | Yes |
| `/sapi/v1/convert/limit/cancelOrder` (POST) | Cancel limit order (USER_DATA) | orderId | recvWindow | Yes |
| `/sapi/v1/convert/tradeFlow` (GET) | Get Convert Trade History(USER_DATA) | startTime, endTime | limit, recvWindow | Yes |
| `/sapi/v1/convert/orderStatus` (GET) | Order status(USER_DATA) | None | orderId, quoteId | Yes |
| `/sapi/v1/convert/limit/placeOrder` (POST) | Place limit order (USER_DATA) | baseAsset, quoteAsset, limitPrice, side, expiredType | baseAmount, quoteAmount, walletType, recvWindow | Yes |
| `/sapi/v1/convert/limit/queryOpenOrders` (GET) | Query limit open orders (USER_DATA) | None | recvWindow | Yes |
| `/sapi/v1/convert/getQuote` (POST) | Send Quote Request(USER_DATA) | fromAsset, toAsset | fromAmount, toAmount, walletType, validTime, recvWindow | Yes |

---

## Parameters

### Common Parameters

* **fromAsset**: User spends coin
* **toAsset**: User receives coin
* **recvWindow**: The value cannot be greater than 60000 (e.g., 5000)
* **quoteId**:  (e.g., 1)
* **orderId**: The orderId from `placeOrder` api (e.g., 1)
* **startTime**:  (e.g., 1623319461670)
* **endTime**:  (e.g., 1641782889000)
* **limit**: Default 100, Max 1000 (e.g., 100)
* **orderId**: Either orderId or quoteId is required (e.g., 1)
* **quoteId**: Either orderId or quoteId is required (e.g., 1)
* **baseAsset**: base asset (use the response `fromIsBase` from `GET /sapi/v1/convert/exchangeInfo` api to check which one is baseAsset )
* **quoteAsset**: quote asset
* **limitPrice**: Symbol limit price (from baseAsset to quoteAsset) (e.g., 1.0)
* **baseAmount**: Base asset amount.  (One of `baseAmount` or `quoteAmount` is required) (e.g., 1.0)
* **quoteAmount**: Quote asset amount.  (One of `baseAmount` or `quoteAmount` is required) (e.g., 1.0)
* **side**: `BUY` or `SELL` (e.g., BUY)
* **walletType**: It is to choose which wallet of assets. The wallet selection is `SPOT`, `FUNDING` and `EARN`. Combination of wallet is supported i.e. `SPOT_FUNDING`, `FUNDING_EARN`, `SPOT_FUNDING_EARN` or `SPOT_EARN`  Default is `SPOT`.
* **expiredType**: 1_D, 3_D, 7_D, 30_D  (D means day)
* **fromAsset**: 
* **toAsset**: 
* **fromAmount**: When specified, it is the amount you will be debited after the conversion (e.g., 1.0)
* **toAmount**: When specified, it is the amount you will be credited after the conversion (e.g., 1.0)
* **validTime**: 10s, 30s, 1m, default 10s (e.g., 10s)


## Authentication

For endpoints that require authentication, you will need to provide Binance API credentials.
Required credentials:

* apiKey: Your Binance API key (for header)
* secretKey: Your Binance API secret (for signing)

Base URLs:
* Mainnet: https://api.binance.com

## Security

### Share Credentials

Users can provide Binance API credentials by sending a file where the content is in the following format:

```bash
abc123...xyz
secret123...key
```

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

When user provides new credentials:

* Ask for account name
* Store in `TOOLS.md` with masked display confirmation 

## Signing Requests

For trading endpoints that require a signature:

1. Build query string with all parameters, including the timestamp (Unix ms).
2. Percent-encode the parameters using UTF-8 according to RFC 3986.
3. Sign query string with secretKey using HMAC SHA256, RSA, or Ed25519 (depending on the account configuration).
4. Append signature to query string.
5. Include `X-MBX-APIKEY` header.

Otherwise, do not perform steps 3–5.

## User Agent Header

Include `User-Agent` header with the following string: `binance-convert/1.0.0 (Skill)`

See [`references/authentication.md`](./references/authentication.md) for implementation details.
