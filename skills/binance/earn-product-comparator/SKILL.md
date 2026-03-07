---
title: Earn Product Comparator
description: Compare Binance Simple Earn flexible and locked staking products with APY rates, minimum amounts, and duration options using SAPI signed endpoints.
metadata:
  version: "1.0.0"
  author: mefai-dev
license: MIT
---

# Earn Product Comparator

Compare Binance Simple Earn products side-by-side including flexible savings and locked staking options. View APY rates, minimum deposit amounts, duration periods, and asset availability to find the best yield opportunities.

## Quick Reference

| Endpoint | Description | Authentication |
|----------|-------------|----------------|
| `GET /sapi/v1/simple-earn/flexible/list` | Flexible earn products | Yes (HMAC) |
| `GET /sapi/v1/simple-earn/locked/list` | Locked earn products | Yes (HMAC) |

## API Details

### List Flexible Earn Products

Retrieve available flexible savings products with current APY rates.

**Method:** `GET`

**URL:** `https://api.binance.com/sapi/v1/simple-earn/flexible/list`

**Authentication:** HMAC-SHA256 signed

**Headers:**
| Header | Value |
|--------|-------|
| X-MBX-APIKEY | Your Binance API key |

**Query Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| asset | string | No | — | Filter by asset (e.g., USDT) |
| current | integer | No | 1 | Page number |
| size | integer | No | 10 | Results per page (max 100) |
| timestamp | integer | Yes | — | Current timestamp (ms) |
| signature | string | Yes | — | HMAC-SHA256 signature |

**Example Request:**

```bash
# Generate signature
TIMESTAMP=$(date +%s000)
QUERY="current=1&size=100&timestamp=$TIMESTAMP"
SIGNATURE=$(echo -n "$QUERY" | openssl dgst -sha256 -hmac "$API_SECRET" | cut -d' ' -f2)

curl "https://api.binance.com/sapi/v1/simple-earn/flexible/list?${QUERY}&signature=${SIGNATURE}" \
  -H "X-MBX-APIKEY: $API_KEY"
```

**Response Fields:**

| Field | Type | Description |
|-------|------|-------------|
| rows | array | List of flexible products |
| rows[].asset | string | Asset code (BTC, ETH, USDT, etc.) |
| rows[].latestAnnualPercentageRate | string | Current APY (decimal, e.g., "0.05" = 5%) |
| rows[].canPurchase | boolean | Whether purchase is available |
| rows[].canRedeem | boolean | Whether redemption is available |
| rows[].minPurchaseAmount | string | Minimum purchase amount |
| rows[].productId | string | Product identifier |
| total | integer | Total number of products |

### List Locked Earn Products

Retrieve available locked staking products with duration and APY details.

**Method:** `GET`

**URL:** `https://api.binance.com/sapi/v1/simple-earn/locked/list`

**Authentication:** HMAC-SHA256 signed (same pattern as flexible)

**Additional Response Fields:**

| Field | Type | Description |
|-------|------|-------------|
| rows[].duration | integer | Lock duration in days |
| rows[].annualPercentageRate | string | Fixed APY rate |

### HMAC Signature Pattern

```python
import hmac, hashlib, time

def sign(params, api_secret):
    params['timestamp'] = int(time.time() * 1000)
    query = '&'.join(f'{k}={v}' for k, v in sorted(params.items()))
    signature = hmac.new(
        api_secret.encode(), query.encode(), hashlib.sha256
    ).hexdigest()
    params['signature'] = signature
    return params
```

## Use Cases

1. **APY Comparison** — Compare flexible vs locked rates for the same asset
2. **Duration Optimization** — Find the best APY-to-lock-duration ratio
3. **Asset Discovery** — Discover all available earn products across assets
4. **Yield Farming** — Identify highest-yield opportunities on Binance
5. **Portfolio Allocation** — Plan earn allocations based on available rates

## Notes

- Both endpoints require **HMAC-SHA256 signed authentication** with a valid API key
- API key needs "Read" permissions enabled for Earn data
- APY rates are returned as decimal values (multiply by 100 for percentage)
- Flexible products allow instant redemption; locked products have fixed durations
- APY rates may change frequently based on supply and demand
- `canPurchase: false` indicates the product is temporarily unavailable
- Use pagination (`current`/`size`) to retrieve all products
- Rate limit: 1200 requests/minute for signed SAPI endpoints
- If no API key is configured, the proxy returns HTTP 403 with a descriptive error
