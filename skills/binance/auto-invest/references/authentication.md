# Binance Authentication

All Auto-Invest endpoints require either HMAC SHA256, RSA, or Ed25519 signed requests.
**Always detect the key type before signing**, do not assume HMAC.

## Base URLs

| Environment | URL |
|-------------|-----|
| Mainnet | https://api.binance.com |

## Required Headers

* `X-MBX-APIKEY`: your_api_key
* `User-Agent`: binance-auto-invest/1.0.0 (Skill)

## Signing Process

### Step 1: Build Query String

Include all parameters plus `timestamp` (current Unix time in milliseconds):
`timestamp=1234567890123`

**Optional:** Add `recvWindow` (default 5000ms) for timestamp tolerance.

### Step 2: Percent‑Encode Parameters

Before generating the signature, **percent‑encode all parameter names and values using UTF‑8 encoding according to RFC 3986.**
Unreserved characters that must not be encoded: `A-Z a-z 0-9 - _ . ~`

**Important:**
The exact encoded query string must be used for both signing and the HTTP request.

### Step 3: Generate Signature

Generate the signature from the encoded query string.

#### HMAC SHA256 signature

```bash
echo -n "timestamp=1234567890123" | \
  openssl dgst -sha256 -hmac "your_secret_key"
```

#### RSA signature

```bash
echo -n "timestamp=1234567890123" | \
  openssl dgst -sha256 -sign private_key.pem | base64
```

#### Ed25519 signature

```bash
echo -n "timestamp=1234567890123" | \
  openssl pkeyutl -sign -inkey private_key.pem | base64
```

### Step 4: Append Signature

Add signature parameter to the query string:
`timestamp=1234567890123&signature=abc123...`

### Step 5: Add Product User Agent Header

Include `User-Agent` header with the following string: `binance-auto-invest/1.0.0 (Skill)`

#### Complete Examples

**List available target assets:**
```bash
#!/bin/bash
API_KEY="$BINANCE_API_KEY"
SECRET_KEY="$BINANCE_SECRET_KEY"
BASE_URL="https://api.binance.com"

TIMESTAMP=$(date +%s000)
QUERY="timestamp=${TIMESTAMP}"

SIGNATURE=$(echo -n "$QUERY" | openssl dgst -sha256 -hmac "$SECRET_KEY" | cut -d' ' -f2)

curl -s -X GET "${BASE_URL}/sapi/v1/lending/auto-invest/target-asset/list?${QUERY}&signature=${SIGNATURE}" \
  -H "X-MBX-APIKEY: ${API_KEY}" \
  -H "User-Agent: binance-auto-invest/1.0.0 (Skill)"
```

**Create a weekly BTC DCA plan ($100/week from USDT):**
```bash
#!/bin/bash
API_KEY="$BINANCE_API_KEY"
SECRET_KEY="$BINANCE_SECRET_KEY"
BASE_URL="https://api.binance.com"

TIMESTAMP=$(date +%s000)
QUERY="sourceType=MAIN_SITE&planType=SINGLE&subscriptionAmount=100&subscriptionCycle=WEEKLY&subscriptionStartDay=1&subscriptionStartTime=8&sourceAsset=USDT&flexibleAllowedToUse=true&details=%5B%7B%22targetAsset%22%3A%22BTC%22%2C%22percentage%22%3A100%7D%5D&timestamp=${TIMESTAMP}"

SIGNATURE=$(echo -n "$QUERY" | openssl dgst -sha256 -hmac "$SECRET_KEY" | cut -d' ' -f2)

curl -s -X POST "${BASE_URL}/sapi/v1/lending/auto-invest/plan/add?${QUERY}&signature=${SIGNATURE}" \
  -H "X-MBX-APIKEY: ${API_KEY}" \
  -H "User-Agent: binance-auto-invest/1.0.0 (Skill)"
```

**Execute a one-off purchase ($500 split 70/30 BTC/ETH):**
```bash
#!/bin/bash
API_KEY="$BINANCE_API_KEY"
SECRET_KEY="$BINANCE_SECRET_KEY"
BASE_URL="https://api.binance.com"

TIMESTAMP=$(date +%s000)
QUERY="sourceType=MAIN_SITE&subscriptionAmount=500&sourceAsset=USDT&details=%5B%7B%22targetAsset%22%3A%22BTC%22%2C%22percentage%22%3A70%7D%2C%7B%22targetAsset%22%3A%22ETH%22%2C%22percentage%22%3A30%7D%5D&timestamp=${TIMESTAMP}"

SIGNATURE=$(echo -n "$QUERY" | openssl dgst -sha256 -hmac "$SECRET_KEY" | cut -d' ' -f2)

curl -s -X POST "${BASE_URL}/sapi/v1/lending/auto-invest/one-off?${QUERY}&signature=${SIGNATURE}" \
  -H "X-MBX-APIKEY: ${API_KEY}" \
  -H "User-Agent: binance-auto-invest/1.0.0 (Skill)"
```

### Security Notes

* Never share your secret key
* Use IP whitelist in Binance API settings
* Enable only required permissions (spot trading, no withdrawals)
