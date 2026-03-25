---
name: copy-trading
description: |
  Binance Copy Trading and Futures Leaderboard using the Binance API.
  Check lead trader status, query available copy trading symbols, and browse
  the futures leaderboard rankings by ROI or PNL.
  Use this skill when users want to explore top traders, evaluate trader performance,
  or check their own lead trader eligibility.
  Leaderboard endpoints are public (no auth). Lead trader endpoints require API key and secret key.
metadata:
  version: 1.0.0
  author: he-yufeng
  openclaw:
    skillKey: binance-copy-trading
    requires:
      bins:
        - curl
        - openssl
        - date
    homepage: https://github.com/binance/binance-skills-hub/tree/main/skills/binance/copy-trading/SKILL.md
license: MIT
---

# Binance Copy Trading Skill

Copy trading and futures leaderboard on Binance. Combines authenticated endpoints for lead trader management with public leaderboard data for trader discovery. Return the result in JSON format.

## Quick Reference

| Endpoint | Description | Required | Optional | Authentication |
|----------|-------------|----------|----------|----------------|
| `/sapi/v1/copyTrading/futures/userStatus` (GET) | Check if user is a futures lead trader | None | recvWindow | Yes |
| `/sapi/v1/copyTrading/futures/leadSymbol` (GET) | Get available lead trading symbols | None | recvWindow | Yes |
| `/bapi/futures/v3/public/future/leaderboard/getLeaderboardRank` (POST) | Browse futures leaderboard rankings | None | statisticsType, periodType, isShared, isTrader, tradeType, limit | No |
| `/bapi/futures/v1/public/future/leaderboard/getOtherPosition` (POST) | View a trader's shared positions | encryptedUid | tradeType | No |
| `/bapi/futures/v2/public/future/leaderboard/getOtherPerformance` (POST) | View a trader's performance stats | encryptedUid | tradeType | No |

---

## Parameters

### Authenticated Endpoints

* **recvWindow**: The value cannot be greater than 60000 (ms) (e.g., 5000)

### Leaderboard Endpoints (Public)

* **statisticsType**: Ranking metric. `ROI` for return on investment, `PNL` for profit and loss (e.g., ROI)
* **periodType**: Time period. `DAILY`, `WEEKLY`, `MONTHLY`, `ALL` (e.g., WEEKLY)
* **isShared**: Filter traders who share positions. `true` or `false` (e.g., true)
* **isTrader**: Filter active traders only. `true` or `false` (e.g., true)
* **tradeType**: Market type. `PERPETUAL` for USDⓈ-M, `DELIVERY` for COIN-M (e.g., PERPETUAL)
* **limit**: Number of results, max 200 (e.g., 20)
* **encryptedUid**: Trader's encrypted UID from leaderboard results (e.g., "A1B2C3D4E5...")

---

## Examples

### Browse Top Traders by ROI (Public, No Auth)

Get the top 20 USDⓈ-M futures traders by weekly ROI who share their positions:

```bash
curl -s -X POST "https://www.binance.com/bapi/futures/v3/public/future/leaderboard/getLeaderboardRank" \
  -H "Content-Type: application/json" \
  -H "User-Agent: binance-copy-trading/1.0.0 (Skill)" \
  -d '{
    "statisticsType": "ROI",
    "periodType": "WEEKLY",
    "isShared": true,
    "isTrader": true,
    "tradeType": "PERPETUAL",
    "limit": 20
  }'
```

**Response fields:**
```json
{
  "data": [
    {
      "encryptedUid": "...",
      "nickName": "TraderAlpha",
      "rank": 1,
      "value": 156.23,
      "followerCount": 1250,
      "positionShared": true,
      "twitterUrl": "...",
      "updateTime": 1711929600000
    }
  ]
}
```

### View a Trader's Positions (Public)

```bash
curl -s -X POST "https://www.binance.com/bapi/futures/v1/public/future/leaderboard/getOtherPosition" \
  -H "Content-Type: application/json" \
  -H "User-Agent: binance-copy-trading/1.0.0 (Skill)" \
  -d '{
    "encryptedUid": "TRADER_ENCRYPTED_UID_HERE",
    "tradeType": "PERPETUAL"
  }'
```

### View a Trader's Performance (Public)

```bash
curl -s -X POST "https://www.binance.com/bapi/futures/v2/public/future/leaderboard/getOtherPerformance" \
  -H "Content-Type: application/json" \
  -H "User-Agent: binance-copy-trading/1.0.0 (Skill)" \
  -d '{
    "encryptedUid": "TRADER_ENCRYPTED_UID_HERE",
    "tradeType": "PERPETUAL"
  }'
```

### Check Lead Trader Status (Authenticated)

```bash
#!/bin/bash
API_KEY="$BINANCE_API_KEY"
SECRET_KEY="$BINANCE_SECRET_KEY"
BASE_URL="https://api.binance.com"

TIMESTAMP=$(date +%s000)
QUERY="timestamp=${TIMESTAMP}"

SIGNATURE=$(echo -n "$QUERY" | openssl dgst -sha256 -hmac "$SECRET_KEY" | cut -d' ' -f2)

curl -s -X GET "${BASE_URL}/sapi/v1/copyTrading/futures/userStatus?${QUERY}&signature=${SIGNATURE}" \
  -H "X-MBX-APIKEY: ${API_KEY}" \
  -H "User-Agent: binance-copy-trading/1.0.0 (Skill)"
```

---

## Agent Behavior

1. **Leaderboard browsing is safe** — public endpoints, no auth, no side effects. The agent can freely query leaderboard data without user confirmation.
2. **Position data is public** — only traders who opted to share positions are visible. The agent should mention this when presenting position data.
3. **No trading actions** — this skill is read-only. It does not place trades or start copy trading. If the user wants to actually copy a trader, direct them to the Binance app or web interface.
4. **Risk warnings** — when showing trader performance, always remind users that past performance doesn't guarantee future results. High ROI traders often have high risk.
5. **Leaderboard freshness** — data updates daily at 04:00 UTC. Mention this if users ask why rankings haven't changed.

---

## Authentication

For authenticated endpoints (`userStatus`, `leadSymbol`), you will need Binance API credentials.
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
API_KEY=$(grep '^BINANCE_API_KEY=' ~/.openclaw/secrets.env 2>/dev/null | cut -d= -f2-)
SECRET_KEY=$(grep '^BINANCE_SECRET_KEY=' ~/.openclaw/secrets.env 2>/dev/null | cut -d= -f2-)

for dir in ~/.openclaw ~; do
  [ -n "$API_KEY" ] && break
  env_file="$dir/.env"
  [ -f "$env_file" ] || continue

  line1=$(sed -n '1p' "$env_file")
  line2=$(sed -n '2p' "$env_file")

  if [[ "$line1" == *=* && "$line2" == *=* ]]; then
    API_KEY=$(grep '^BINANCE_API_KEY=' "$env_file" 2>/dev/null | cut -d= -f2-)
    SECRET_KEY=$(grep '^BINANCE_SECRET_KEY=' "$env_file" 2>/dev/null | cut -d= -f2-)
  else
    API_KEY="$line1"
    SECRET_KEY="$line2"
  fi
done
```

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

### Listing Accounts

When listing accounts, show names and environment only — never keys:
Binance Accounts:
* main (Mainnet)

## Signing Requests

For authenticated endpoints:

1. **Detect key type first**, inspect the secret key format before signing.
2. Build query string with all parameters, including the timestamp (Unix ms).
3. Percent-encode the parameters using UTF-8 according to RFC 3986.
4. Sign query string with secretKey using HMAC SHA256, RSA, or Ed25519 (depending on the account configuration).
5. Append signature to query string.
6. Include `X-MBX-APIKEY` header.

Leaderboard endpoints (`/bapi/...`) do NOT require signing.

## User Agent Header

Include `User-Agent` header with the following string: `binance-copy-trading/1.0.0 (Skill)`

See [`references/authentication.md`](./references/authentication.md) for implementation details.
