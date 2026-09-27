---
title: KYO.ag Swap Skill
description: Execute 0-fee optimal token swaps across multiple DEXs via KYO.ag. Supports quote and swap flows on multichains. Currently supports HyperEVM and Soneium. Trigger when user wants to swap, exchange, or trade tokens.
metadata:
  - version: "1.0.0"
  - author: kyo.ag
license: MIT
---

# KYO.ag Swap Skill

> Execute optimal token swaps across multiple DEXs on HyperEVM and Soneium chains.

## Quick Start

```bash
# Get swap transaction data (Authorization header is optional)
curl -X POST https://api.kyo.ag/999/v1/swap \
  -H "Content-Type: application/json" \
  -d '{
    "tokenIn": "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
    "tokenOut": "0xb88339cb7199b77e23db6e890353e22632ba630f",
    "amountIn": "1000000000000000000",
    "userAddress": "0xYOUR_WALLET_ADDRESS",
    "slippage": 0.01
  }'
```

## Supported Chains

| Chain | Chain ID | Base URL |
|-------|----------|----------|
| HyperEVM | 999 | `https://api.kyo.ag/999/v1` |
| Soneium | 1868 | `https://api.kyo.ag/1868/v1` |

## Authentication

Authorization is optional:
```
Authorization: Bearer YOUR_API_KEY
```

Calls without an API key are supported.
With an API key, partners can receive higher RPS limits (up to 10x) and revshare.

## Rate Limits

- Without API key (Aggregator API): 60 requests/minute
- With API key: up to 10x higher
- Limits are subject to change; abusive traffic or persistently low swap-to-quote ratios may be throttled

Request an API key via [this form](https://forms.gle/usDeWvH21Z85UccZ6).

## Workflow

### Step 1: Get Quote (Optional)
Preview the swap without transaction data:

```bash
POST /v1/quote
{
  "tokenIn": "INPUT_TOKEN_ADDRESS",
  "tokenOut": "OUTPUT_TOKEN_ADDRESS",
  "amountIn": "AMOUNT_IN_WEI"
}
```

### Step 2: Get Swap Transaction

```bash
POST /v1/swap
{
  "tokenIn": "INPUT_TOKEN_ADDRESS",
  "tokenOut": "OUTPUT_TOKEN_ADDRESS",
  "amountIn": "AMOUNT_IN_WEI",
  "userAddress": "WALLET_ADDRESS",
  "slippage": 0.01
}
```

### Step 3: Execute Transactions

The response contains a `transactions` array. Execute them in order:

**For ERC20 input tokens:**
1. Execute `approve` transaction (if present)
2. Execute `swap` transaction

**For native token (ETH) input:**
1. Execute the `swap` transaction from `transactions`
2. Use `transactions[].value` exactly as returned by the API
3. For native token sells, this value is typically `amountIn`; for buys, `maxInputAmount`
4. Do not manually override `value` if `transactions[].value` is already present

## Parameters

### Quote Parameters (`POST /v1/quote`)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| tokenIn | string | Yes | Input token address. Use `0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee` for native token |
| tokenOut | string | Yes | Output token address |
| amountIn | string | Conditional | Amount to sell in wei (for sell mode) |
| amountOut | string | Conditional | Amount to buy in wei (for buy mode) |
| slippage | number | No | Slippage tolerance (0.01 = 1%). Default: 0.005 |
| partnerFeeBps | integer | No | Partner fee in basis points (100 = 1%) |
| includedSources | array | No | DEX source IDs to include exclusively (see /v1/sources) |
| excludedSources | array | No | DEX source IDs to exclude (see /v1/sources) |

### Swap Additional Parameters (`POST /v1/swap`)

`/v1/swap` accepts all quote parameters plus:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| userAddress | string | Yes | Wallet executing the swap |
| approveMax | boolean | No | If true, approve unlimited amount |

## Response Schema

```json
{
  "userAddress": "0x...",
  "toAddress": "0x...",
  "calldata": "0x...",
  "quote": {
    "tokenIn": "0x...",
    "tokenOut": "0x...",
    "amountIn": "1000000000000000000",
    "amountOut": "3500000000",
    "minOutputAmount": "3465000000",
    "maxInputAmount": "1010000000000000000",
    "slippage": 0.01,
    "blockNumber": 12345678,
    "tokens": [...],
    "swaps": [...],
    "sourcesAndSinks": [...],
    "partnerFee": null,
    "partnerId": null
  },
  "transactions": [
    {
      "to": "0x...",
      "data": "0x...",
      "value": "0"
    }
  ],
  "transactionExplanations": ["Approve USDC spending", "Execute swap"],
  "txCostNative": "500000000000000",
  "txCostUsd": 1.75
}
```

## Example: Swap 1 ETH for USDC on HyperEVM

```python
import requests

response = requests.post(
    "https://api.kyo.ag/999/v1/swap",
    headers={
        "Content-Type": "application/json"
    },
    json={
        "tokenIn": "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
        "tokenOut": "0xb88339cb7199b77e23db6e890353e22632ba630f",
        "amountIn": "1000000000000000000",  # 1 ETH
        "userAddress": "0xYOUR_WALLET",
        "slippage": 0.01
    }
)

swap_data = response.json()

# Execute with web3
for tx in swap_data["transactions"]:
    web3.eth.send_transaction({
        "to": tx["to"],
        "data": tx["data"],
        "value": int(tx.get("value", "0")),
        "from": "0xYOUR_WALLET"
    })
```

## Error Handling

| Error Code | Description | Solution |
|------------|-------------|----------|
| INVALID_TOKEN | Token address not found | Verify token contract address |
| NO_ROUTE_FOUND | No swap path exists | Try different token pair or smaller amount |
| INSUFFICIENT_LIQUIDITY | Not enough liquidity | Reduce swap amount |
| INVALID_AMOUNT | Amount is zero or negative | Provide valid positive amount |
| INVALID_PARAMETERS | Request parameters are invalid | Check required fields and types |
| INTERNAL_ERROR | Server-side error | Retry or contact support |

## Tips for Agents

1. **Always check `transactions` array length** - may contain 1 (swap only) or 2 (approve + swap)
2. **Use `minOutputAmount`** for slippage protection verification
3. **Native token address** is always `0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee`
4. **Amounts are in wei** - multiply by 10^decimals
5. **Quote first** if you only need price information without transaction data
