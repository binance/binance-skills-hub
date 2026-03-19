---
name: sub-account
description: Binance Sub-account request using the Binance API. Authentication requires API key and secret key. 
metadata:
  version: 1.0.0
  author: Binance
license: MIT
---

# Binance Sub-account Skill

Sub-account request on Binance using authenticated API endpoints. Requires API key and secret key for certain endpoints. Return the result in JSON format.

## Quick Reference

| Endpoint | Description | Required | Optional | Authentication |
|----------|-------------|----------|----------|----------------|
| `/sapi/v1/sub-account/virtualSubAccount` (POST) | Create a Virtual Sub-account (For Master Account) (USER_DATA) | subAccountString | recvWindow | Yes |
| `/sapi/v1/sub-account/futures/enable` (POST) | Enable Futures for Sub-account (For Master Account) (USER_DATA) | email | recvWindow | Yes |
| `/sapi/v1/sub-account/eoptions/enable` (POST) | Enable Options for Sub-account (For Master Account) (USER_DATA) | email | recvWindow | Yes |
| `/sapi/v2/sub-account/futures/positionRisk` (GET) | Get Futures Position-Risk of Sub-account V2 (For Master Account) (USER_DATA) | email, futuresType | recvWindow | Yes |
| `/sapi/v1/sub-account/futures/positionRisk` (GET) | Get Futures Position-Risk of Sub-account (For Master Account) (USER_DATA) | email | recvWindow | Yes |
| `/sapi/v1/sub-account/status` (GET) | Get Sub-account's Status on Margin Or Futures (For Master Account) (USER_DATA) | None | email, recvWindow | Yes |
| `/sapi/v1/sub-account/list` (GET) | Query Sub-account List (For Master Account) (USER_DATA) | None | email, isFreeze, page, limit, recvWindow | Yes |
| `/sapi/v1/sub-account/transaction-statistics` (GET) | Query Sub-account Transaction Statistics (For Master Account) (USER_DATA) | None | email, recvWindow | Yes |
| `/sapi/v2/sub-account/subAccountApi/ipRestriction` (POST) | Add IP Restriction for Sub-Account API key (For Master Account) (USER_DATA) | email, subAccountApiKey, status | ipAddress, recvWindow | Yes |
| `/sapi/v1/sub-account/subAccountApi/ipRestriction/ipList` (DELETE) | Delete IP List For a Sub-account API Key (For Master Account) (USER_DATA) | email, subAccountApiKey, ipAddress | recvWindow | Yes |
| `/sapi/v1/sub-account/subAccountApi/ipRestriction` (GET) | Get IP Restriction for a Sub-account API Key (For Master Account) (USER_DATA) | email, subAccountApiKey | recvWindow | Yes |
| `/sapi/v1/sub-account/futures/transfer` (POST) | Futures Transfer for Sub-account (For Master Account) (USER_DATA) | email, asset, amount, type | recvWindow | Yes |
| `/sapi/v2/sub-account/futures/account` (GET) | Get Detail on Sub-account's Futures Account V2 (For Master Account) (USER_DATA) | email, futuresType | recvWindow | Yes |
| `/sapi/v1/sub-account/futures/account` (GET) | Get Detail on Sub-account's Futures Account (For Master Account) (USER_DATA) | email | recvWindow | Yes |
| `/sapi/v1/sub-account/margin/account` (GET) | Get Detail on Sub-account's Margin Account (For Master Account) (USER_DATA) | email | recvWindow | Yes |
| `/sapi/v1/sub-account/futures/move-position` (GET) | Get Move Position History for Sub-account (For Master Account) (USER_DATA) | symbol, page, row | startTime, endTime, recvWindow | Yes |
| `/sapi/v1/sub-account/futures/move-position` (POST) | Move Position for Sub-account (For Master Account) (USER_DATA) | fromUserEmail, toUserEmail, productType, orderArgs | recvWindow | Yes |
| `/sapi/v1/capital/deposit/subAddress` (GET) | Get Sub-account Deposit Address (For Master Account) (USER_DATA) | email, coin | network, amount, recvWindow | Yes |
| `/sapi/v1/capital/deposit/subHisrec` (GET) | Get Sub-account Deposit History (For Master Account) (USER_DATA) | email | coin, status, startTime, endTime, limit, offset, recvWindow, txId | Yes |
| `/sapi/v2/sub-account/futures/accountSummary` (GET) | Get Summary of Sub-account's Futures Account V2 (For Master Account) (USER_DATA) | futuresType | page, limit, recvWindow | Yes |
| `/sapi/v1/sub-account/futures/accountSummary` (GET) | Get Summary of Sub-account's Futures Account (For Master Account) (USER_DATA) | page, limit | recvWindow | Yes |
| `/sapi/v1/sub-account/margin/accountSummary` (GET) | Get Summary of Sub-account's Margin Account (For Master Account) (USER_DATA) | None | recvWindow | Yes |
| `/sapi/v1/sub-account/margin/transfer` (POST) | Margin Transfer for Sub-account (For Master Account) (USER_DATA) | email, asset, amount, type | recvWindow | Yes |
| `/sapi/v3/sub-account/assets` (GET) | Query Sub-account Assets (For Master Account) (USER_DATA) | email | recvWindow | Yes |
| `/sapi/v4/sub-account/assets` (GET) | Query Sub-account Assets (For Master Account) (USER_DATA) | email | recvWindow | Yes |
| `/sapi/v1/sub-account/futures/internalTransfer` (GET) | Query Sub-account Futures Asset Transfer History (For Master Account) (USER_DATA) | email, futuresType | startTime, endTime, page, limit, recvWindow | Yes |
| `/sapi/v1/sub-account/futures/internalTransfer` (POST) | Sub-account Futures Asset Transfer (For Master Account) (USER_DATA) | fromEmail, toEmail, futuresType, asset, amount | recvWindow | Yes |
| `/sapi/v1/sub-account/sub/transfer/history` (GET) | Query Sub-account Spot Asset Transfer History (For Master Account) (USER_DATA) | None | fromEmail, toEmail, startTime, endTime, page, limit, recvWindow | Yes |
| `/sapi/v1/sub-account/spotSummary` (GET) | Query Sub-account Spot Assets Summary (For Master Account) (USER_DATA) | None | email, page, size, recvWindow | Yes |
| `/sapi/v1/sub-account/universalTransfer` (GET) | Query Universal Transfer History (For Master Account) (USER_DATA) | None | fromEmail, toEmail, clientTranId, startTime, endTime, page, limit, recvWindow | Yes |
| `/sapi/v1/sub-account/universalTransfer` (POST) | Universal Transfer (For Master Account) (USER_DATA) | fromAccountType, toAccountType, asset, amount | fromEmail, toEmail, clientTranId, symbol, recvWindow | Yes |
| `/sapi/v1/sub-account/transfer/subUserHistory` (GET) | Sub-account Transfer History (For Sub-account) (USER_DATA) | None | asset, type, startTime, endTime, limit, returnFailHistory, recvWindow | Yes |
| `/sapi/v1/sub-account/transfer/subToMaster` (POST) | Transfer to Master (For Sub-account) (USER_DATA) | asset, amount | recvWindow | Yes |
| `/sapi/v1/sub-account/transfer/subToSub` (POST) | Transfer to Sub-account of Same Master (For Sub-account) (USER_DATA) | toEmail, asset, amount | recvWindow | Yes |
| `/sapi/v1/managed-subaccount/deposit` (POST) | Deposit Assets Into The Managed Sub-account (For Investor Master Account) (USER_DATA) | toEmail, asset, amount | recvWindow | Yes |
| `/sapi/v1/managed-subaccount/deposit/address` (GET) | Get Managed Sub-account Deposit Address (For Investor Master Account) (USER_DATA) | email, coin | network, amount, recvWindow | Yes |
| `/sapi/v1/managed-subaccount/queryTransLogForInvestor` (GET) | Query Managed Sub Account Transfer Log (For Investor Master Account) (USER_DATA) | email, startTime, endTime, page, limit | transfers, transferFunctionAccountType | Yes |
| `/sapi/v1/managed-subaccount/queryTransLogForTradeParent` (GET) | Query Managed Sub Account Transfer Log (For Trading Team Master Account) (USER_DATA) | email, startTime, endTime, page, limit | transfers, transferFunctionAccountType | Yes |
| `/sapi/v1/managed-subaccount/query-trans-log` (GET) | Query Managed Sub Account Transfer Log (For Trading Team Sub Account) (USER_DATA) | startTime, endTime, page, limit | transfers, transferFunctionAccountType, recvWindow | Yes |
| `/sapi/v1/managed-subaccount/asset` (GET) | Query Managed Sub-account Asset Details (For Investor Master Account) (USER_DATA) | email | recvWindow | Yes |
| `/sapi/v1/managed-subaccount/fetch-future-asset` (GET) | Query Managed Sub-account Futures Asset Details (For Investor Master Account) (USER_DATA) | email | accountType | Yes |
| `/sapi/v1/managed-subaccount/info` (GET) | Query Managed Sub-account List (For Investor) (USER_DATA) | None | email, page, limit, recvWindow | Yes |
| `/sapi/v1/managed-subaccount/marginAsset` (GET) | Query Managed Sub-account Margin Asset Details (For Investor Master Account) (USER_DATA) | email | accountType | Yes |
| `/sapi/v1/managed-subaccount/accountSnapshot` (GET) | Query Managed Sub-account Snapshot (For Investor Master Account) (USER_DATA) | email, type | startTime, endTime, limit, recvWindow | Yes |
| `/sapi/v1/managed-subaccount/withdraw` (POST) | Withdrawl Assets From The Managed Sub-account (For Investor Master Account) (USER_DATA) | fromEmail, asset, amount | transferDate, recvWindow | Yes |

---

## Parameters

### Common Parameters

* **subAccountString**: Please input a string. We will create a virtual email using that string for you to register
* **recvWindow**:  (e.g., 5000)
* **email**: Sub-account email (e.g., sub-account-email@email.com)
* **futuresType**: 1:USDT-margined Futures，2: Coin-margined Futures
* **email**: Managed sub-account email
* **isFreeze**: true or false
* **page**: Default value: 1 (e.g., 1)
* **limit**: Default value: 1, Max value: 200 (e.g., 1)
* **subAccountApiKey**: 
* **status**: IP Restriction status. 1 = IP Unrestricted. 2 = Restrict access to trusted IPs only.
* **ipAddress**: Insert static IP in batch, separated by commas.
* **ipAddress**: IPs to be deleted. Can be added in batches, separated by commas
* **asset**: 
* **amount**:  (e.g., 1.0)
* **type**: 1: transfer from subaccount's  spot account to margin account 2: transfer from subaccount's margin account to its spot account
* **symbol**: 
* **startTime**:  (e.g., 1623319461670)
* **endTime**:  (e.g., 1641782889000)
* **page**: Page
* **row**: 
* **coin**: 
* **network**: networks can be found in `GET /sapi/v1/capital/deposit/address`
* **amount**:  (e.g., 1.0)
* **coin**: 
* **status**: 0(0:pending,6: credited but cannot withdraw,7:Wrong Deposit,8:Waiting User confirm,1:success)
* **offset**: default:0
* **txId**:  (e.g., 1)
* **limit**: Limit (Max: 500)
* **fromUserEmail**: 
* **toUserEmail**: 
* **productType**: Only support UM
* **orderArgs**: Max 10 positions supported. When input request parameter,orderArgs.symbol should be STRING, orderArgs.quantity should be BIGDECIMAL, and orderArgs.positionSide should be STRING, positionSide support BOTH,LONG and SHORT. Each entry should be like orderArgs[0].symbol=BTCUSDT,orderArgs[0].quantity=0.001,orderArgs[0].positionSide=BOTH. Example of the request parameter array: orderArgs[0].symbol=BTCUSDT orderArgs[0].quantity=0.001 orderArgs[0].positionSide=BOTH orderArgs[1].symbol=ETHUSDT orderArgs[1].quantity=0.01 orderArgs[1].positionSide=BOTH
* **fromEmail**: 
* **toEmail**: 
* **size**: default 10, max 20 (e.g., 10)
* **clientTranId**:  (e.g., 1)
* **fromEmail**: 
* **toEmail**: 
* **asset**: If not sent, result of all assets will be returned
* **type**: 1: transfer in, 2: transfer out
* **returnFailHistory**: Default `False`, return PROCESS and SUCCESS status history; If `True`,return PROCESS and SUCCESS and FAILURE status history
* **fromAccountType**: "SPOT","USDT_FUTURE","COIN_FUTURE","MARGIN"(Cross),"ISOLATED_MARGIN"
* **toAccountType**: "SPOT","USDT_FUTURE","COIN_FUTURE","MARGIN"(Cross),"ISOLATED_MARGIN"
* **symbol**: Only supported under ISOLATED_MARGIN type
* **startTime**: Start Time (e.g., 1623319461670)
* **endTime**: End Time (The start time and end time interval cannot exceed half a year) (e.g., 1641782889000)
* **transfers**: Transfer Direction (FROM/TO)
* **transferFunctionAccountType**: Transfer function account type (SPOT/MARGIN/ISOLATED_MARGIN/USDT_FUTURE/COIN_FUTURE)
* **accountType**: No input or input "MARGIN" to get Cross Margin account details. Input "ISOLATED_MARGIN" to get Isolated Margin account details.
* **type**: "SPOT", "MARGIN"（cross）, "FUTURES"（UM）
* **transferDate**: Withdrawals is automatically occur on the transfer date(UTC0). If a date is not selected, the withdrawal occurs right now


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

Include `User-Agent` header with the following string: `binance-sub-account/1.0.0 (Skill)`

See [`references/authentication.md`](./references/authentication.md) for implementation details.
