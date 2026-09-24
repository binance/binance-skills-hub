---
name: assetfare-route-quote
description: Read-only AssetFare cross-chain route evaluation for AI agents. Use when a user wants a fresh quote or an ordered provider-path comparison across supported Solana, Base, Arbitrum, Robinhood, Polygon, and Optimism asset endpoints. Returns capabilities, expected/minimum receive, costs, and a strictly validated direct-route summary. Never accepts wallet data, authenticates, prepares actions, signs, submits, or moves funds.
version: 0.1.0
license: MIT
metadata:
  author: odaiin
---

# AssetFare Route Quote

Use this skill to inspect AssetFare's current public route capabilities and obtain one fresh, read-only quote for an exact chain, asset, and USD amount. The bundled client sends no wallet address, credential, session identifier, signature, or transaction.

This is an evaluation tool, not an execution tool. It never authenticates, creates a session, prepares an action, signs, submits, or moves funds.

## Commands

Run from this skill directory with Node.js 22 or newer.

```bash
# Read current capabilities and evaluation guidance (GET only)
node scripts/route-quote.mjs capabilities

# Representative economic evaluation at USD 1,000
node scripts/route-quote.mjs quote \
  --from-chain solana --from-token USDC \
  --to-chain base --to-token USDC \
  --amount-usd 1000

# USD 1 reachability smoke only — not an economic comparison
node scripts/route-quote.mjs quote \
  --from-chain solana --from-token USDC \
  --to-chain base --to-token USDC \
  --amount-usd 1
```

The quote command always reads capabilities first, then sends exactly these five public fields to `/v2/quote`:

```json
{
  "from_chain": "solana",
  "from_token": "USDC",
  "to_chain": "base",
  "to_token": "USDC",
  "amount_usd": 1000
}
```

Do not add wallet, authentication, session, recipient, prepare, signature, or transaction fields.

## Workflow

1. Ask for the source chain and asset, destination chain and asset, and intended USD amount if any is missing. Do not read a wallet or infer an amount from a balance.
2. Run `capabilities` immediately before quoting. Stop if the strict capabilities check fails.
3. Run one `quote` for the user's exact intended amount. Never reuse a quote obtained for another amount and never treat a stored example as current.
4. Report the requested endpoints and amount, quote timestamp and TTL, expected and minimum receive, token-path costs, unpriced costs, and the ordered `direct_route_summary.steps` provider path.
5. State where the one-basis-point AssetFare service fee is collected. Provider, protocol, and network costs are additional where the response says so.
6. Explain the route classification:
   - `direct_protocol_only`: every disclosed route step is a direct protocol integration.
   - `external_intent`: the route uses Across for Robinhood ingress. Across may internally source or aggregate destination liquidity.
7. Stop after presenting the quote. This skill has no execution continuation.

## Amount Guidance

- USD 1 is accepted for connectivity and reachability smoke testing only. Do not use it to judge economic competitiveness.
- USD 1,000 is the representative evaluation amount in the current capabilities contract.
- Current guidance says native-USDC economic evaluation starts at USD 50. That is not a route minimum and not a guarantee of better pricing.
- Always compare every provider fresh at the exact intended amount, timestamp, route, and asset form.

## Comparison Rules

- Never say AssetFare is always cheapest, best, fastest, or guaranteed to win.
- Never rank an all-in result when `rankable_all_in` is false or any network gas remains in `unpriced_costs`.
- Compare expected receive with expected receive and minimum receive with minimum receive. Do not mix those semantics.
- Attribute each provider's own fees, gas scope, ETA, expiry, and route semantics.
- Treat a quote as stale when its TTL has elapsed; obtain a new quote instead of extrapolating.
- A quote or directory listing is not evidence that a user selected or completed a transfer.

## Validation and Failure Handling

The client fails closed unless all of the following hold:

- the capabilities contract declares 76 routes, 168 ordered steps, exactly one AssetFare basis point, and no server signing or submission;
- the response binds the requested endpoints and amount;
- `direct_route_summary` exactly matches the known 76-route topology;
- provider order, action kind, endpoints, base-unit amount continuity, raw route evidence, and the one fee-collection step agree;
- Across ingress is classified as external intent and never as direct-only;
- AssetFare route aggregation flags remain false, scoped only to AssetFare's route engine;
- no private key, seed, signature, signed transaction, or submitted material appears anywhere in the response.

If the command prints `assetfare_route_quote_failed`, do not guess, repair, or execute a route. Report that the read-only quote could not be validated and suggest retrying later.

## Noncustodial Boundary

- Never ask for or accept a private key, seed phrase, key file, wallet address, signature, session, or access token.
- Never call AssetFare authentication, prepare, session, action, sign, or submit endpoints.
- Never pass the output into a wallet automatically.
- A caller considering execution must independently verify every chain, asset, recipient, amount, fee, minimum receive, approval, calldata, and deadline in a separate caller-approved workflow.

See [references/api.md](references/api.md) for the exact network and response contract.
