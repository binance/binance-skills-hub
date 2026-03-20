---
name: simple-earn
description: Binance Simple-earn request using the Binance API. Authentication requires API key and secret key. 
metadata:
  version: 1.0.0
  author: Binance
license: MIT
---

# Binance Simple-earn Skill

Simple-earn request on Binance using authenticated API endpoints. Requires API key and secret key for certain endpoints. Return the result in JSON format.

## Quick Reference

| Endpoint | Description | Required | Optional | Authentication |
|----------|-------------|----------|----------|----------------|
| `/sapi/v1/bfusd/account` (GET) | Get BFUSD Account (USER_DATA) | None | recvWindow | Yes |
| `/sapi/v1/bfusd/quota` (GET) | Get BFUSD Quota Details (USER_DATA) | None | recvWindow | Yes |
| `/sapi/v1/bfusd/redeem` (POST) | Redeem BFUSD(TRADE) | amount, type | recvWindow | Yes |
| `/sapi/v1/bfusd/subscribe` (POST) | Subscribe BFUSD(TRADE) | asset, amount | recvWindow | Yes |
| `/sapi/v1/bfusd/history/rateHistory` (GET) | Get BFUSD Rate History (USER_DATA) | None | startTime, endTime, current, size, recvWindow | Yes |
| `/sapi/v1/bfusd/history/redemptionHistory` (GET) | Get BFUSD Redemption History (USER_DATA) | None | startTime, endTime, current, size, recvWindow | Yes |
| `/sapi/v1/bfusd/history/rewardsHistory` (GET) | Get BFUSD Rewards History (USER_DATA) | None | startTime, endTime, current, size, recvWindow | Yes |
| `/sapi/v1/bfusd/history/subscriptionHistory` (GET) | Get BFUSD subscription history(USER_DATA) | None | asset, startTime, endTime, current, size, recvWindow | Yes |
| `/sapi/v1/simple-earn/flexible/personalLeftQuota` (GET) | Get Flexible Personal Left Quota(USER_DATA) | productId | recvWindow | Yes |
| `/sapi/v1/simple-earn/flexible/position` (GET) | Get Flexible Product Position(USER_DATA) | None | asset, productId, current, size, recvWindow | Yes |
| `/sapi/v1/simple-earn/locked/personalLeftQuota` (GET) | Get Locked Personal Left Quota(USER_DATA) | projectId | recvWindow | Yes |
| `/sapi/v1/simple-earn/locked/position` (GET) | Get Locked Product Position | None | asset, positionId, projectId, current, size, recvWindow | Yes |
| `/sapi/v1/simple-earn/flexible/list` (GET) | Get Simple Earn Flexible Product List(USER_DATA) | None | asset, current, size, recvWindow | Yes |
| `/sapi/v1/simple-earn/locked/list` (GET) | Get Simple Earn Locked Product List(USER_DATA) | None | asset, current, size, recvWindow | Yes |
| `/sapi/v1/simple-earn/account` (GET) | Simple Account(USER_DATA) | None | recvWindow | Yes |
| `/sapi/v1/simple-earn/flexible/subscriptionPreview` (GET) | Get Flexible Subscription Preview(USER_DATA) | productId, amount | recvWindow | Yes |
| `/sapi/v1/simple-earn/locked/subscriptionPreview` (GET) | Get Locked Subscription Preview(USER_DATA) | projectId, amount | autoSubscribe, recvWindow | Yes |
| `/sapi/v1/simple-earn/flexible/redeem` (POST) | Redeem Flexible Product(TRADE) | productId | redeemAll, amount, destAccount, recvWindow | Yes |
| `/sapi/v1/simple-earn/locked/redeem` (POST) | Redeem Locked Product(TRADE) | positionId | recvWindow | Yes |
| `/sapi/v1/simple-earn/flexible/setAutoSubscribe` (POST) | Set Flexible Auto Subscribe(USER_DATA) | productId, autoSubscribe | recvWindow | Yes |
| `/sapi/v1/simple-earn/locked/setAutoSubscribe` (POST) | Set Locked Auto Subscribe(USER_DATA) | positionId, autoSubscribe | recvWindow | Yes |
| `/sapi/v1/simple-earn/locked/setRedeemOption` (POST) | Set Locked Product Redeem Option(USER_DATA) | positionId, redeemTo | recvWindow | Yes |
| `/sapi/v1/simple-earn/flexible/subscribe` (POST) | Subscribe Flexible Product(TRADE) | productId, amount | autoSubscribe, sourceAccount, recvWindow | Yes |
| `/sapi/v1/simple-earn/locked/subscribe` (POST) | Subscribe Locked Product(TRADE) | projectId, amount | autoSubscribe, sourceAccount, redeemTo, recvWindow | Yes |
| `/sapi/v1/simple-earn/flexible/history/collateralRecord` (GET) | Get Collateral Record(USER_DATA) | None | productId, startTime, endTime, current, size, recvWindow | Yes |
| `/sapi/v1/simple-earn/flexible/history/redemptionRecord` (GET) | Get Flexible Redemption Record(USER_DATA) | None | productId, redeemId, asset, startTime, endTime, current, size, recvWindow | Yes |
| `/sapi/v1/simple-earn/flexible/history/rewardsRecord` (GET) | Get Flexible Rewards History(USER_DATA) | type | productId, asset, startTime, endTime, current, size, recvWindow | Yes |
| `/sapi/v1/simple-earn/flexible/history/subscriptionRecord` (GET) | Get Flexible Subscription Record(USER_DATA) | None | productId, purchaseId, asset, startTime, endTime, current, size, recvWindow | Yes |
| `/sapi/v1/simple-earn/locked/history/redemptionRecord` (GET) | Get Locked Redemption Record(USER_DATA) | None | positionId, redeemId, asset, startTime, endTime, current, size, recvWindow | Yes |
| `/sapi/v1/simple-earn/locked/history/rewardsRecord` (GET) | Get Locked Rewards History(USER_DATA) | None | positionId, asset, startTime, endTime, current, size, recvWindow | Yes |
| `/sapi/v1/simple-earn/locked/history/subscriptionRecord` (GET) | Get Locked Subscription Record(USER_DATA) | None | purchaseId, asset, startTime, endTime, current, size, recvWindow | Yes |
| `/sapi/v1/simple-earn/flexible/history/rateHistory` (GET) | Get Rate History(USER_DATA) | productId | aprPeriod, startTime, endTime, current, size, recvWindow | Yes |
| `/sapi/v1/rwusd/quota` (GET) | Get RWUSD Quota Details (USER_DATA) | None | recvWindow | Yes |
| `/sapi/v1/rwusd/account` (GET) | Get RWUSD Account (USER_DATA) | None | recvWindow | Yes |
| `/sapi/v1/rwusd/redeem` (POST) | Redeem RWUSD(TRADE) | amount, type | recvWindow | Yes |
| `/sapi/v1/rwusd/subscribe` (POST) | Subscribe RWUSD(TRADE) | asset, amount | recvWindow | Yes |
| `/sapi/v1/rwusd/history/rateHistory` (GET) | Get RWUSD Rate History (USER_DATA) | None | startTime, endTime, current, size, recvWindow | Yes |
| `/sapi/v1/rwusd/history/redemptionHistory` (GET) | Get RWUSD Redemption History (USER_DATA) | None | startTime, endTime, current, size, recvWindow | Yes |
| `/sapi/v1/rwusd/history/rewardsHistory` (GET) | Get RWUSD Rewards History (USER_DATA) | None | startTime, endTime, current, size, recvWindow | Yes |
| `/sapi/v1/rwusd/history/subscriptionHistory` (GET) | Get RWUSD subscription history(USER_DATA) | None | asset, startTime, endTime, current, size, recvWindow | Yes |

---

## Parameters

### Common Parameters

* **recvWindow**: The value cannot be greater than 60000 (ms) (e.g., 5000)
* **amount**: Amount (e.g., 1.0)
* **type**: FAST or STANDARD, defaults to STANDARD (e.g., s)
* **asset**: USDT or USDC (whichever is eligible)
* **startTime**:  (e.g., 1623319461670)
* **endTime**:  (e.g., 1641782889000)
* **current**: Currently querying page. Starts from 1. Default: 1 (e.g., 1)
* **size**: Number of results per page. Default: 10, Max: 100 (e.g., 10)
* **asset**: USDC or USDT
* **productId**:  (e.g., 1)
* **productId**:  (e.g., 1)
* **projectId**:  (e.g., 1)
* **positionId**:  (e.g., 1)
* **projectId**:  (e.g., 1)
* **autoSubscribe**: true or false, default true. (e.g., true)
* **redeemAll**: true or false, default to false
* **amount**: if redeemAll is false, amount is mandatory (e.g., 1.0)
* **destAccount**: `SPOT`,`FUND`, default `SPOT` (e.g., SPOT)
* **positionId**:  (e.g., 1)
* **autoSubscribe**: true or false
* **redeemTo**: `SPOT`,'FLEXIBLE'
* **sourceAccount**: `SPOT`,`FUND`,`ALL`, default `SPOT` (e.g., SPOT)
* **redeemTo**: `SPOT`,`FLEXIBLE`, default `SPOT` (e.g., SPOT)
* **redeemId**:  (e.g., 1)
* **purchaseId**:  (e.g., 1)
* **aprPeriod**: "DAY","YEAR",default"DAY" (e.g., DAY)


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

Include `User-Agent` header with the following string: `binance-simple-earn/1.0.0 (Skill)`

See [`references/authentication.md`](./references/authentication.md) for implementation details.
