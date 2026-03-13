---
name: assets
description: Binance Assets request using the Binance API. Authentication requires API key and secret key. 
metadata:
  version: 1.0.0
  author: Binance
license: MIT
---

# Binance Assets Skill

Assets request on Binance using authenticated API endpoints. Requires API key and secret key for certain endpoints. Return the result in JSON format.

## Quick Reference

| Endpoint | Description | Required | Optional | Authentication |
|----------|-------------|----------|----------|----------------|
| `/sapi/v1/account/apiTradingStatus` (GET) | Account API Trading Status (USER_DATA) | None | recvWindow | Yes |
| `/sapi/v1/account/info` (GET) | Account info (USER_DATA) | None | recvWindow | Yes |
| `/sapi/v1/account/status` (GET) | Account Status (USER_DATA) | None | recvWindow | Yes |
| `/sapi/v1/account/apiRestrictions` (GET) | Get API Key Permission (USER_DATA) | None | recvWindow | Yes |
| `/sapi/v1/accountSnapshot` (GET) | Daily Account Snapshot (USER_DATA) | type | startTime, endTime, limit, recvWindow | Yes |
| `/sapi/v1/account/disableFastWithdrawSwitch` (POST) | Disable Fast Withdraw Switch (USER_DATA) | None | recvWindow | Yes |
| `/sapi/v1/account/enableFastWithdrawSwitch` (POST) | Enable Fast Withdraw Switch (USER_DATA) | None | recvWindow | Yes |
| `/sapi/v1/bnbBurn` (POST) | Toggle BNB Burn On Spot Trade And Margin Interest (USER_DATA) | None | spotBNBBurn, interestBNBBurn, recvWindow | Yes |
| `/sapi/v1/asset/assetDetail` (GET) | Asset Detail (USER_DATA) | None | asset, recvWindow | Yes |
| `/sapi/v1/asset/dust-btc` (POST) | Get Assets That Can Be Converted Into BNB (USER_DATA) | None | accountType, recvWindow | Yes |
| `/sapi/v1/asset/assetDividend` (GET) | Asset Dividend Record (USER_DATA) | None | asset, startTime, endTime, limit, recvWindow | Yes |
| `/sapi/v1/asset/ledger-transfer/cloud-mining/queryByPage` (GET) | Get Cloud-Mining payment and refund history (USER_DATA) | startTime, endTime | tranId, clientTranId, asset, current, size | Yes |
| `/sapi/v1/asset/dust-convert/convert` (POST) | Dust Convert (USER_DATA) | asset | clientId, targetAsset, thirdPartyClientId, dustQuotaAssetToTargetAssetPrice | Yes |
| `/sapi/v1/asset/dust-convert/query-convertible-assets` (POST) | Dust Convertible Assets (USER_DATA) | targetAsset | dustQuotaAssetToTargetAssetPrice | Yes |
| `/sapi/v1/asset/dribblet` (GET) | DustLog(USER_DATA) | None | accountType, startTime, endTime, recvWindow | Yes |
| `/sapi/v1/asset/dust` (POST) | Dust Transfer (USER_DATA) | asset | accountType, recvWindow | Yes |
| `/sapi/v1/asset/get-funding-asset` (POST) | Funding Wallet (USER_DATA) | None | asset, needBtcValuation, recvWindow | Yes |
| `/sapi/v1/spot/open-symbol-list` (GET) | Get Open Symbol List (MARKET_DATA) | None | None | No |
| `/sapi/v1/asset/custody/transfer-history` (GET) | Query User Delegation History(For Master Account)(USER_DATA) | email, startTime, endTime | type, asset, current, size, recvWindow | Yes |
| `/sapi/v1/asset/transfer` (GET) | Query User Universal Transfer History(USER_DATA) | type | startTime, endTime, current, size, fromSymbol, toSymbol, recvWindow | Yes |
| `/sapi/v1/asset/transfer` (POST) | User Universal Transfer (USER_DATA) | type, asset, amount | fromSymbol, toSymbol, recvWindow | Yes |
| `/sapi/v1/asset/wallet/balance` (GET) | Query User Wallet Balance (USER_DATA) | None | quoteAsset, recvWindow | Yes |
| `/sapi/v1/spot/delist-schedule` (GET) | Get symbols delist schedule for spot (MARKET_DATA) | None | recvWindow | No |
| `/sapi/v1/asset/tradeFee` (GET) | Trade Fee (USER_DATA) | None | symbol, recvWindow | Yes |
| `/sapi/v3/asset/getUserAsset` (POST) | User Asset (USER_DATA) | None | asset, needBtcValuation, recvWindow | Yes |
| `/sapi/v1/capital/config/getall` (GET) | All Coins' Information (USER_DATA) | None | recvWindow | Yes |
| `/sapi/v1/capital/deposit/address` (GET) | Deposit Address(supporting network) (USER_DATA) | coin | network, amount, recvWindow | Yes |
| `/sapi/v1/capital/deposit/hisrec` (GET) | Deposit History (supporting network) (USER_DATA) | None | includeSource, coin, status, startTime, endTime, offset, limit, recvWindow, txId | Yes |
| `/sapi/v1/capital/deposit/address/list` (GET) | Fetch deposit address list with network(USER_DATA) | coin | network | Yes |
| `/sapi/v1/capital/withdraw/address/list` (GET) | Fetch withdraw address list (USER_DATA) | None | None | Yes |
| `/sapi/v1/capital/withdraw/quota` (GET) | Fetch withdraw quota (USER_DATA) | None | None | Yes |
| `/sapi/v1/capital/deposit/credit-apply` (POST) | One click arrival deposit apply (for expired address deposit) (USER_DATA) | None | depositId, txId, subAccountId, subUserId | Yes |
| `/sapi/v1/capital/withdraw/history` (GET) | Withdraw History (supporting network) (USER_DATA) | None | coin, withdrawOrderId, status, offset, limit, idList, startTime, endTime, recvWindow | Yes |
| `/sapi/v1/capital/withdraw/apply` (POST) | Withdraw(USER_DATA) | coin, address, amount | withdrawOrderId, network, addressTag, transactionFeeFlag, name, walletType, recvWindow | Yes |
| `/sapi/v1/system/status` (GET) | System Status (System) | None | None | No |
| `/sapi/v1/addressVerify/list` (GET) | Fetch address verification list (USER_DATA) | None | recvWindow | Yes |
| `/sapi/v1/localentity/broker/deposit/provide-info` (PUT) | Submit Deposit Questionnaire (For local entities that require travel rule) (supporting network) (USER_DATA) | subAccountId, depositId, questionnaire, beneficiaryPii, signature | network, coin, amount, address, addressTag | Yes |
| `/sapi/v1/localentity/broker/withdraw/apply` (POST) | Broker Withdraw (for brokers of local entities that require travel rule) (USER_DATA) | address, coin, amount, withdrawOrderId, questionnaire, originatorPii, signature | addressTag, network, addressName, transactionFeeFlag, walletType | Yes |
| `/sapi/v2/localentity/deposit/history` (GET) | Deposit History V2 (for local entities that required travel rule) (supporting network) (USER_DATA) | None | depositId, txId, network, coin, retrieveQuestionnaire, startTime, endTime, offset, limit | Yes |
| `/sapi/v1/localentity/deposit/history` (GET) | Deposit History (for local entities that required travel rule) (supporting network) (USER_DATA) | None | trId, txId, tranId, network, coin, travelRuleStatus, pendingQuestionnaire, startTime, endTime, offset, limit | Yes |
| `/sapi/v2/localentity/deposit/provide-info` (PUT) | Submit Deposit Questionnaire V2 (For local entities that require travel rule) (supporting network) (USER_DATA) | depositId, questionnaire | None | Yes |
| `/sapi/v1/localentity/deposit/provide-info` (PUT) | Submit Deposit Questionnaire (For local entities that require travel rule) (supporting network) (USER_DATA) | tranId, questionnaire | None | Yes |
| `/sapi/v1/localentity/vasp` (GET) | VASP list (for local entities that require travel rule) (supporting network) (USER_DATA) | None | recvWindow | Yes |
| `/sapi/v1/localentity/questionnaire-requirements` (GET) | Check Questionnaire Requirements (for local entities that require travel rule) (supporting network) (USER_DATA) | None | recvWindow | Yes |
| `/sapi/v2/localentity/withdraw/history` (GET) | Withdraw History V2 (for local entities that require travel rule) (supporting network) (USER_DATA) | None | trId, txId, withdrawOrderId, network, coin, travelRuleStatus, offset, limit, startTime, endTime, recvWindow | Yes |
| `/sapi/v1/localentity/withdraw/history` (GET) | Withdraw History (for local entities that require travel rule) (supporting network) (USER_DATA) | None | trId, txId, withdrawOrderId, network, coin, travelRuleStatus, offset, limit, startTime, endTime, recvWindow | Yes |
| `/sapi/v1/localentity/withdraw/apply` (POST) | Withdraw (for local entities that require travel rule) (USER_DATA) | coin, address, amount, questionnaire | withdrawOrderId, network, addressTag, transactionFeeFlag, name, walletType, recvWindow | Yes |

---

## Parameters

### Common Parameters

* **recvWindow**:  (e.g., 5000)
* **type**: 
* **startTime**:  (e.g., 1623319461670)
* **endTime**:  (e.g., 1641782889000)
* **limit**: min 7, max 30, default 7 (e.g., 7)
* **spotBNBBurn**: "true" or "false"; Determines whether to use BNB to pay for trading fees on SPOT
* **interestBNBBurn**: "true" or "false"; Determines whether to use BNB to pay for margin loan's interest
* **asset**: If asset is blank, then query all positive assets user have.
* **accountType**: `SPOT` or `MARGIN`,default `SPOT` (e.g., SPOT)
* **tranId**: The transaction id (e.g., 1)
* **clientTranId**: The unique flag (e.g., 1)
* **startTime**:  (e.g., 1623319461670)
* **endTime**:  (e.g., 1641782889000)
* **current**: current page, default 1, the min value is 1 (e.g., 1)
* **size**: page size, default 10, the max value is 100 (e.g., 10)
* **asset**: 
* **clientId**: A unique id for the request (e.g., 1)
* **targetAsset**: 
* **thirdPartyClientId**:  (e.g., 1)
* **dustQuotaAssetToTargetAssetPrice**:  (e.g., 1.0)
* **targetAsset**: 
* **needBtcValuation**: true or false
* **email**: 
* **type**: Delegate/Undelegate
* **fromSymbol**: 
* **toSymbol**: 
* **quoteAsset**: `USDT`, `ETH`, `USDC`, `BNB`, etc. default `BTC` (e.g., BTC)
* **symbol**: 
* **needBtcValuation**: Whether need btc valuation or not.
* **amount**:  (e.g., 1.0)
* **coin**: 
* **network**: 
* **amount**:  (e.g., 1.0)
* **includeSource**: Default: `false`, return `sourceAddress`field when set to `true`
* **coin**: 
* **status**: 0(0:Email Sent, 2:Awaiting Approval 3:Rejected 4:Processing 6:Completed)
* **offset**: Default: 0
* **txId**:  (e.g., 1)
* **depositId** (one-click arrival): Deposit record ID for one-click arrival deposit apply, priority use (e.g., 1)
* **subAccountId**: Sub-accountId of Cloud user (e.g., 1)
* **subUserId**: Sub-userId of parent user (e.g., 1)
* **withdrawOrderId** (withdraw history): Client-side ID for withdrawal, if provided in POST `/sapi/v1/capital/withdraw/apply`, can be used here for query. (e.g., 1)
* **idList**: id list returned in the response of POST `/sapi/v1/capital/withdraw/apply`, separated by `,`
* **address**: 
* **addressTag**: Secondary address identifier for coins like XRP,XMR etc.
* **transactionFeeFlag**: When making internal transfer, `true` for returning the fee to the destination account; `false` for returning the fee back to the departure account. Default `false`.
* **name**: Description of the address. Address book cap is 200, space in name should be encoded into `%20`
* **walletType**: The wallet type for withdraw，0-spot wallet ，1-funding wallet. Default walletType is the current "selected wallet" under wallet->Fiat and Spot/Funding->Deposit
* **subAccountId**: External user ID. (e.g., 1)
* **depositId** (broker questionnaire): Wallet deposit ID for broker deposit questionnaire (e.g., 1)
* **questionnaire**: JSON format questionnaire answers.
* **beneficiaryPii**: JSON format beneficiary Pii.
* **address**: 
* **signature**: Must be the last parameter.
* **addressName**: Description of the address. Address book cap is 200, space in name should be encoded into `%20`
* **withdrawOrderId** (broker withdraw): Withdraw ID defined by the client for broker withdraw (i.e. client's internal withdrawID) (e.g., 1)
* **originatorPii**: JSON format originator Pii, see StandardPii section below
* **depositId** (travel rule history): Comma(,) separated list of wallet tran IDs for travel rule deposit history (e.g., 1)
* **retrieveQuestionnaire**: true: return `questionnaire` within response.
* **trId**: Comma(,) separated list of travel rule record Ids. (e.g., 1)
* **tranId**: Comma(,) separated list of wallet tran Ids. (e.g., 1)
* **travelRuleStatus**: 0:Completed,1:Pending,2:Failed
* **pendingQuestionnaire**: true: Only return records that pending deposit questionnaire. false/not provided: return all records.
* **tranId**: Wallet tran ID (e.g., 1)


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

Include `User-Agent` header with the following string: `binance-wallet/1.0.0 (Skill)`

See [`references/authentication.md`](./references/authentication.md) for implementation details.
