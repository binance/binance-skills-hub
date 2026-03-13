---
name: alpha
description: Binance Alpha request using the Binance API. Authentication requires API key and secret key. 
metadata:
  version: 1.0.0
  author: Binance
license: MIT
---

# Binance Alpha Skill

Alpha request on Binance using authenticated API endpoints. Requires API key and secret key for certain endpoints. Return the result in JSON format.

## Quick Reference

| Endpoint | Description | Required | Optional | Authentication |
|----------|-------------|----------|----------|----------------|
| `/bapi/defi/v1/public/alpha-trade/ticker` (GET) | Ticker (24hr Price Statistics) | symbol | None | No |
| `/bapi/defi/v1/public/alpha-trade/agg-trades` (GET) | Aggregated Trades | symbol | fromId, startTime, endTime, limit | No |
| `/bapi/defi/v1/public/alpha-trade/get-exchange-info` (GET) | Get Exchange Info | None | None | No |
| `/bapi/defi/v1/public/alpha-trade/klines` (GET) | Klines (Candlestick Data) | symbol, interval | limit, startTime, endTime | No |
| `/bapi/defi/v1/public/wallet-direct/buw/wallet/cex/alpha/all/token/list` (GET) | Token List | None | None | No |

---

## Parameters

### Common Parameters

* **symbol**: e.g., "ALPHA_175USDT" – use token ID from Token List
* **fromId**: starting trade ID to fetch from (e.g., 1)
* **startTime**: start timestamp (milliseconds) (e.g., 1623319461670)
* **endTime**: end timestamp (milliseconds) (e.g., 1641782889000)
* **limit**: number of results to return (default 500, max 1000) (e.g., 500)
* **interval**: e.g., "1h" – supported intervals: 1s, 15s, 1m, 3m, 5m, 15m, 30m, 1h, 2h, 4h, 6h, 8h, 12h, 1d, 3d, 1w, 1M


## Authentication

> **Note:** All endpoints in this skill are currently public and do not require authentication. The authentication reference below is provided for future authenticated endpoints that may be added.

For endpoints that require authentication, you will need to provide Binance API credentials.
Required credentials:

* apiKey: Your Binance API key (for header)
* secretKey: Your Binance API secret (for signing)

Base URLs:
* Mainnet: https://www.binance.com

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

Include `User-Agent` header with the following string: `binance-alpha/1.0.0 (Skill)`

See [`references/authentication.md`](./references/authentication.md) for implementation details.
