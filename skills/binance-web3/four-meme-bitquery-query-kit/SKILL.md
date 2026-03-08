---
name: four_meme_bitquery_query_kit
description: Provides a query-first analytics toolkit for Four.meme using Bitquery GraphQL/streams (trades, bonding progress, migrations, liquidity, and trader behavior).
---

# Four.Meme Bitquery Query Kit

## Usage

- Category: Ecosystem
- Mode: guide
- Version: 0.1.0

## Input Example

```json
{
  "action": "token_analytics_snapshot",
  "tokenAddress": "0x...",
  "include": ["ohlcv", "bonding_curve", "top_traders", "liquidity", "migrations"],
  "lookbackHours": 24
}
```

## Workflow

1. Confirm data access prerequisites:
   - Bitquery API token configured.
   - BSC network scope selected.
2. Build query pack by goal:
   - market data: latest trades, OHLCV, price change.
   - lifecycle: new tokens, bonding progress, near-graduation set.
   - migration: liquidity-add and Pancake migration tracking.
   - trader profile: top buyers/sellers and wallet-level activity.
3. Execute queries as read-only GraphQL requests.
4. Normalize output into a compact report:
   - momentum score.
   - liquidity durability score.
   - concentration and churn risk flags.
5. If execution intent appears, handoff to trade-specific skills with confirmation gates.

## Guardrails

- This skill is analysis-only and must not execute buy/sell transactions.
- Mark mempool observations as provisional until confirmed by on-chain events.
- Cap query rate and payload size to avoid API throttling.
- If token identity is ambiguous, stop and request exact contract address.

## Source Anchors

- Bitquery Four Meme API examples: https://github.com/bitquery/four-meme-api
- Four Meme API docs hub: https://docs.bitquery.io/docs/blockchain/BSC/four-meme-api/
- Four Meme mempool docs: https://docs.bitquery.io/docs/blockchain/BSC/four-meme-mempool-API/
