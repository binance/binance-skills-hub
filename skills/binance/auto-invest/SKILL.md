---
name: auto-invest
description: |
  Binance Auto-Invest (DCA) request using the Binance API. Create, manage, and monitor dollar-cost averaging plans for 220+ cryptocurrencies.
  Use this skill when users want to set up recurring crypto purchases, manage existing DCA plans, execute one-off investments, redeem holdings, or check subscription history.
  Authentication requires API key and secret key.
metadata:
  version: 1.0.0
  author: he-yufeng
  openclaw:
    skillKey: binance-auto-invest
    requires:
      bins:
        - curl
        - openssl
        - date
    homepage: https://github.com/binance/binance-skills-hub/tree/main/skills/binance/auto-invest/SKILL.md
license: MIT
---

# Binance Auto-Invest Skill

Auto-Invest (DCA) request on Binance using authenticated API endpoints. Requires API key and secret key for all endpoints. Return the result in JSON format.

Auto-Invest lets users automate recurring crypto purchases on a daily, weekly, bi-weekly, or monthly cycle. Supports 220+ target assets and 50+ source assets including stablecoins, fiat, and crypto.

## Quick Reference

| Endpoint | Description | Required | Optional | Authentication |
|----------|-------------|----------|----------|----------------|
| `/sapi/v1/lending/auto-invest/target-asset/list` (GET) | Get target asset list | None | targetAsset, size, current, recvWindow | Yes |
| `/sapi/v1/lending/auto-invest/target-asset/roi/list` (GET) | Get target asset ROI data | hisRoiType, targetAsset | recvWindow | Yes |
| `/sapi/v1/lending/auto-invest/all/asset` (GET) | Get all source and target assets | None | recvWindow | Yes |
| `/sapi/v1/lending/auto-invest/index/info` (GET) | Get index linked plan info | None | indexId, recvWindow | Yes |
| `/sapi/v1/lending/auto-invest/index/user-summary` (GET) | Get index linked plan position | indexId | recvWindow | Yes |
| `/sapi/v1/lending/auto-invest/plan/add` (POST) | Create a DCA plan | sourceType, planType, subscriptionAmount, subscriptionCycle, sourceAsset, details | subscriptionStartDay, subscriptionStartTime, flexibleAllowedToUse, recvWindow | Yes |
| `/sapi/v1/lending/auto-invest/plan/edit-status` (POST) | Pause or resume a plan | planId, status | recvWindow | Yes |
| `/sapi/v1/lending/auto-invest/plan/list` (GET) | List all plans | planType | recvWindow | Yes |
| `/sapi/v1/lending/auto-invest/plan/id` (GET) | Get plan details by ID | None | planId, requestId, recvWindow | Yes |
| `/sapi/v1/lending/auto-invest/one-off` (POST) | Execute a one-time purchase | sourceType, subscriptionAmount, sourceAsset, details | flexibleAllowedToUse, recvWindow | Yes |
| `/sapi/v1/lending/auto-invest/one-off/status` (GET) | Query one-off purchase status | transactionId | recvWindow | Yes |
| `/sapi/v1/lending/auto-invest/redeem` (POST) | Redeem from a plan | indexId | requestId, redemptionPercentage, recvWindow | Yes |
| `/sapi/v1/lending/auto-invest/history/list` (GET) | Get subscription transaction history | None | planId, startTime, endTime, targetAsset, planType, size, current, recvWindow | Yes |
| `/sapi/v1/lending/auto-invest/redeem/history` (GET) | Get redemption history | requestId | startTime, endTime, current, asset, size, recvWindow | Yes |
| `/sapi/v1/lending/auto-invest/rebalance/history` (GET) | Get rebalance history | None | startTime, endTime, current, size, recvWindow | Yes |

---

## Parameters

### Common Parameters

* **recvWindow**: The value cannot be greater than 60000 (ms) (e.g., 5000)
* **sourceType**: Source account type. `MAIN_SITE` for Spot wallet, `TR` for Funding wallet (e.g., MAIN_SITE)
* **planType**: `SINGLE` for single-asset plan, `PORTFOLIO` for multi-asset plan, `INDEX` for index plan (e.g., SINGLE)
* **sourceAsset**: Asset used for purchase (e.g., USDT, BUSD, BTC)
* **targetAsset**: Target asset to purchase (e.g., BTC, ETH, BNB)
* **subscriptionAmount**: Amount per subscription cycle in sourceAsset (e.g., 100)
* **subscriptionCycle**: `DAILY`, `WEEKLY`, `BI_WEEKLY`, `MONTHLY` (e.g., WEEKLY)
* **subscriptionStartDay**: Day of the cycle to start. For WEEKLY: 1-7 (Mon-Sun). For MONTHLY: 1-28 (e.g., 1)
* **subscriptionStartTime**: Hour (0-23) in UTC to execute the purchase (e.g., 8)
* **planId**: Plan ID returned when creating a plan (e.g., 12345)
* **indexId**: Index linked plan ID (e.g., 1)
* **status**: Plan status to set. `ONGOING` to resume, `PAUSED` to pause (e.g., PAUSED)
* **flexibleAllowedToUse**: Whether to use Flexible Earn balance. `true` or `false` (e.g., true)
* **details**: JSON array of target assets with percentage allocation. See Plan Creation section (e.g., [{"targetAsset":"BTC","percentage":60},{"targetAsset":"ETH","percentage":40}])
* **requestId**: Request ID from one-off or redeem operations (e.g., 12345)
* **transactionId**: Transaction ID for one-off purchase status query (e.g., 12345)
* **redemptionPercentage**: Percentage to redeem, 1-100 (e.g., 100)
* **hisRoiType**: ROI period. `FIVE_YEAR`, `THREE_YEAR`, `ONE_YEAR`, `SIX_MONTH`, `THREE_MONTH`, `ONE_MONTH` (e.g., ONE_YEAR)
* **startTime**: Start time in milliseconds (e.g., 1623319461670)
* **endTime**: End time in milliseconds (e.g., 1641782889000)
* **current**: Page number, starting from 1 (e.g., 1)
* **size**: Results per page. Default: 10, Max: 100 (e.g., 10)

---

## Plan Creation

### Single-Asset DCA Plan

Buy $100 of BTC every week from Spot wallet:

```json
{
  "sourceType": "MAIN_SITE",
  "planType": "SINGLE",
  "subscriptionAmount": "100",
  "subscriptionCycle": "WEEKLY",
  "subscriptionStartDay": "1",
  "subscriptionStartTime": "8",
  "sourceAsset": "USDT",
  "details": [{"targetAsset": "BTC", "percentage": 100}],
  "flexibleAllowedToUse": "true"
}
```

### Portfolio DCA Plan

Buy a BTC/ETH/BNB portfolio monthly with 60/30/10 allocation:

```json
{
  "sourceType": "MAIN_SITE",
  "planType": "PORTFOLIO",
  "subscriptionAmount": "500",
  "subscriptionCycle": "MONTHLY",
  "subscriptionStartDay": "15",
  "subscriptionStartTime": "0",
  "sourceAsset": "USDT",
  "details": [
    {"targetAsset": "BTC", "percentage": 60},
    {"targetAsset": "ETH", "percentage": 30},
    {"targetAsset": "BNB", "percentage": 10}
  ]
}
```

**Note:** The `details` array percentages must sum to 100.

### One-Off Purchase

Execute a single immediate purchase (no recurring plan):

```json
{
  "sourceType": "MAIN_SITE",
  "subscriptionAmount": "200",
  "sourceAsset": "USDT",
  "details": [{"targetAsset": "ETH", "percentage": 100}]
}
```

---

## Authentication

For all Auto-Invest endpoints, you will need to provide Binance API credentials.
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
* Never run `grep` on `env` files without anchoring to a specific key ('`^VARNAME=`')
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

For all Auto-Invest endpoints (they all require authentication):

1. **Detect key type first**, inspect the secret key format before signing.
2. Build query string with all parameters, including the timestamp (Unix ms).
3. Percent-encode the parameters using UTF-8 according to RFC 3986.
4. Sign query string with secretKey using HMAC SHA256, RSA, or Ed25519 (depending on the account configuration).
5. Append signature to query string.
6. Include `X-MBX-APIKEY` header.

## User Agent Header

Include `User-Agent` header with the following string: `binance-auto-invest/1.0.0 (Skill)`

See [`references/authentication.md`](./references/authentication.md) for implementation details.
