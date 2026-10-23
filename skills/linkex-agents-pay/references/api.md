# Linkex API Reference (for this skill)

Base URL: `$LINKEX_BASE_URL` (default `https://linkex.ai`).
Auth: `Authorization: Bearer $LINKEX_API_KEY` unless marked public.

All `/api/*` responses share the envelope:

```json
{ "success": true, "message": "", "data": { ... } }
```

On failure `success` is `false` and `message` carries an error code
(e.g. `X402_INVALID_AMOUNT`). Report it verbatim.

---

## Balance: remaining quota for THIS key

What the user means by "my Linkex balance" is almost always the spending
power of the API key in use — not the whole account. Two OpenAI-compatible
endpoints together give that:

```bash
curl -s "$LINKEX_BASE_URL/v1/dashboard/billing/subscription" \
  -H "Authorization: Bearer $LINKEX_API_KEY"
# -> { "hard_limit_usd": 25.35, ... }   # key's total limit, USD

curl -s "$LINKEX_BASE_URL/v1/dashboard/billing/usage" \
  -H "Authorization: Bearer $LINKEX_API_KEY"
# -> { "total_usage": 1840.98 }         # key's usage, in CENTS
```

**`remaining_usd = hard_limit_usd - total_usage / 100`** (note the unit
mismatch: usage is cents). Report as e.g. "$6.94 of $25.35 left".

Special case — unlimited keys: `hard_limit_usd` comes back as a sentinel
`100000000` when the key has no per-key limit. In that case the key draws
from the account balance instead; read it from:

```bash
curl -s "$LINKEX_BASE_URL/api/user/self/balance" \
  -H "Authorization: Bearer $LINKEX_API_KEY"
# -> { "success": true, "data": { "quota_usd": 196.62, ... } }
```

and report `data.quota_usd` as the balance.

---

## `GET /api/user/topup/x402/config`

Discover whether x402 top-up is enabled, the USD limits, and which
networks/tokens are currently offered. **Always call this before creating an
order** — the network list changes as new chains roll out.

```bash
curl -s "$LINKEX_BASE_URL/api/user/topup/x402/config" \
  -H "Authorization: Bearer $LINKEX_API_KEY"
```

Response `data` (illustrative; addresses are placeholders):

```json
{
  "enabled": true,
  "min_topup_usd": 1,
  "max_topup_usd": 1000,
  "network": "eip155:8453",
  "pay_to": "0x1111111111111111111111111111111111111111",
  "networks": [
    { "network": "eip155:56",   "pay_to": "0x1111111111111111111111111111111111111111", "symbols": ["U", "USDC", "USDT"] },
    { "network": "eip155:8453", "pay_to": "0x1111111111111111111111111111111111111111", "symbols": ["USDC"] }
  ]
}
```

- `network` values are CAIP-2 ids: `eip155:56` = BNB Smart Chain,
  `eip155:8453` = Base, `solana:...` = Solana (when offered).
- `networks[].symbols` are the token symbols accepted on that network.
- If `enabled` is `false`, top-up is unavailable — say so and stop.

---

## `GET /v1/models`

OpenAI-compatible model list for this key.

```bash
curl -s "$LINKEX_BASE_URL/v1/models" \
  -H "Authorization: Bearer $LINKEX_API_KEY"
```

---

## `POST /v1/chat/completions`

OpenAI-compatible chat endpoint. Any OpenAI SDK works by setting
`base_url = $LINKEX_BASE_URL/v1`.

```bash
curl -s "$LINKEX_BASE_URL/v1/chat/completions" \
  -H "Authorization: Bearer $LINKEX_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4o",
    "messages": [{ "role": "user", "content": "ping" }]
  }'
```

A quota-exhausted account typically gets an HTTP 4xx with a quota error —
check the balance and offer the top-up flow
([x402-topup.md](x402-topup.md)).
