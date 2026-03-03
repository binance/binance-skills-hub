---
title: KYO.ag Meta Aggregator Skill
description: Find the best 0-fee swap quote across multiple DEX aggregators via KYO.ag Meta Aggregator. Supports quote competition and swap execution flows on multichains (currently 19 supported chains). Trigger when user wants to compare aggregators or find the best swap rate.
metadata:
  - version: "1.0.0"
  - author: kyo.ag
license: MIT
---

# KYO.ag Meta Aggregator Skill

> Compare quotes from multiple DEX aggregators and execute the best swap through a competition model.

## Quick Start

```bash
# 1. Create a competition
curl -X POST https://api.kyo.ag/competitions \
  -H "Content-Type: application/json" \
  -d '{
    "chainId": 1,
    "tokenIn": "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
    "tokenOut": "0xB8f28C60dD8240141185a192fa4156A23E189305",
    "amountIn": "1000000000000000000",
    "userAddress": "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
    "slippage": 0.01
  }'

# Response includes: { "competitionId": "abc123", "availableAggregators": ["..."], ... }

# 2. Fetch quote from each aggregator
curl -X POST "https://api.kyo.ag/quotes?aggregator=<from_availableAggregators>&competitionId=abc123"
# POST request with no body

# 3. Get all results ranked
curl https://api.kyo.ag/competitions/abc123/results

# 4. Execute swap with the best aggregator
curl -X POST "https://api.kyo.ag/swap?aggregator=<from_availableAggregators>&competitionId=abc123"
# POST request with no body
```

## How It Works

```
Create competition → Fetch quotes per aggregator → Compare results → Execute best swap
```

1. **Create Competition** — Submit swap parameters. Returns `competitionId` and list of `availableAggregators`.
2. **Fetch Quotes** — Query each aggregator individually using the `competitionId`. Run in parallel for speed.
3. **Compare Results** — Call the results endpoint to see all quotes ranked side by side.
4. **Execute Swap** — Call `/swap` with the winning aggregator to get transaction calldata.

## Base URL

```
https://api.kyo.ag
```

Meta Aggregator endpoints do not include `chainId` in the path.
Provide `chainId` in the `POST /competitions` request body.

## Authentication

Authorization is optional:
```
Authorization: Bearer YOUR_API_KEY
```

Calls without an API key are supported.
With an API key, partners can receive higher RPS limits (up to 10x) and revshare.

## Rate Limits

- Without API key (Meta Aggregator API): 20 requests/minute
- With API key: up to 10x higher
- Limits are subject to change; abusive traffic or persistently low swap-to-quote ratios may be throttled

Request an API key via [this form](https://forms.gle/usDeWvH21Z85UccZ6).

## Endpoints

### POST /competitions

Create a new competition.

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| chainId | integer | Yes | Chain ID (e.g. 999 for HyperEVM) |
| tokenIn | string | Yes | Input token address |
| tokenOut | string | Yes | Output token address |
| amountIn | string | Yes | Input amount in wei |
| userAddress | string | Yes | User wallet address |
| slippage | number | Yes | Slippage tolerance (0.01 = 1%) |
| tokenInDecimals | integer | No | Decimals of tokenIn (default: 18) |

**Response:**

| Field | Type | Description |
|-------|------|-------------|
| competitionId | string | Unique competition identifier |
| availableAggregators | string[] | List of aggregator names to query |
| chainId | integer | Chain ID |
| expiresAt | string | ISO 8601 expiration timestamp |

### POST /quotes?aggregator={agg}&competitionId={id}

Fetch a pricing quote from a specific aggregator.
This is a `POST` endpoint with no request body.

**Response:**

| Field | Type | Description |
|-------|------|-------------|
| aggregator | string | Aggregator name |
| tokenIn | string | Input token address |
| tokenOut | string | Output token address |
| amountIn | string | Input amount in wei |
| amountOut | string | Output amount in wei |
| gasEstimate | string? | Estimated gas cost |
| competitionId | string | Competition ID |

### GET /competitions/{id}/results

Get all quotes for a competition, ranked by output amount.

**Response:**

| Field | Type | Description |
|-------|------|-------------|
| competitionId | string | Competition ID |
| chainId | integer | Chain ID |
| tokenIn | string | Input token address |
| tokenOut | string | Output token address |
| amountIn | string | Input amount in wei |
| quotes | array | Array of quotes sorted by amountOut |

### POST /swap?aggregator={agg}&competitionId={id}

Get transaction calldata for the chosen aggregator.
This is a `POST` endpoint with no request body.

**Response:**

| Field | Type | Description |
|-------|------|-------------|
| aggregator | string | Aggregator name |
| tokenIn | string | Input token address |
| tokenOut | string | Output token address |
| amountIn | string | Input amount in wei |
| amountOut | string | Output amount in wei |
| to | string | Contract to send the tx to |
| data | string | Calldata for the swap tx |
| value | string | Native value to send (for native token sells) |
| allowanceTarget | string | Contract that needs token approval |
| competitionId | string | Competition ID |

Unlike `/v1/swap`, this endpoint returns `to`, `data`, and `value` directly (not a `transactions[]` array).

## Agent Integration Pattern

```python
import requests

API_KEY = ""  # optional
BASE = "https://api.kyo.ag"
AUTH_HEADERS = {} if not API_KEY else {"Authorization": f"Bearer {API_KEY}"}
JSON_HEADERS = {"Content-Type": "application/json", **AUTH_HEADERS}

# Step 1: Create competition
comp = requests.post(f"{BASE}/competitions", headers=JSON_HEADERS, json={
    "chainId": 1,
    "tokenIn": "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
    "tokenOut": "0xB8f28C60dD8240141185a192fa4156A23E189305",
    "amountIn": "1000000000000000000",
    "userAddress": "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
    "slippage": 0.01
}).json()

competition_id = comp["competitionId"]
aggregators = comp["availableAggregators"]

# Step 2: Fetch quotes in parallel
import concurrent.futures

def fetch_quote(agg):
    resp = requests.post(
        f"{BASE}/quotes?aggregator={agg}&competitionId={competition_id}",
        headers=AUTH_HEADERS
    )
    if resp.status_code == 200:
        return resp.json()
    return None  # aggregator may not support this pair

with concurrent.futures.ThreadPoolExecutor() as pool:
    quotes = [q for q in pool.map(fetch_quote, aggregators) if q]

if not quotes:
    raise Exception("No aggregator returned a valid quote")

# Step 3: Pick the best quote
best = max(quotes, key=lambda q: int(q["amountOut"]))
print(f"Best: {best['aggregator']} → {best['amountOut']}")

# Step 4: Get swap calldata
swap = requests.post(
    f"{BASE}/swap?aggregator={best['aggregator']}&competitionId={competition_id}",
    headers=AUTH_HEADERS
).json()

# Step 5: Execute transaction
# send_transaction(swap["to"], swap["data"], swap["value"])
```

## Error Handling

| HTTP Status | Error | Description | Solution |
|-------------|-------|-------------|----------|
| 400 | Bad request | Invalid parameters | Check required fields and types |
| 401 | Unauthorized | Invalid API key in Authorization header (when provided) | Verify Bearer token or omit the header |
| 404 | Not found | Competition ID does not exist | Create a new competition |
| 410 | Gone | Competition has expired | Create a new competition and retry |

Individual aggregator quotes may fail silently (e.g., aggregator doesn't support the token pair). Always filter out failed responses before comparing.

## Tips for Agents

1. **Competitions expire quickly** — fetch quotes and execute the swap promptly after creation
2. **Fetch quotes in parallel** — use `Promise.all` / `concurrent.futures` for speed
3. **Filter failed quotes** — some aggregators may return errors; skip them when picking the best
4. **Use `allowanceTarget` for approvals** — this may differ from the `to` address
5. **For native token input** — send `value` with the transaction, no ERC20 approval needed
6. **Check `expiresAt`** — if close to expiry, create a fresh competition instead of retrying
7. **No request body for /quotes and /swap** — these endpoints only take query parameters

## Resources

- [Meta Aggregator API Reference](https://docs.kyo.ag/meta.html) - Interactive API playground
- [OpenAPI Spec](https://docs.kyo.ag/metaAgAPI.json) - Full API schema
