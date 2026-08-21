---
name: four_meme_agentic_ops
description: Runs a human-in-the-loop agentic operating loop for Four.meme (discover, score, confirm, execute, monitor, and journal). Use when users ask for automated strategy support without granting fully autonomous hot-wallet trading.
metadata:
  author: brief-onchain
  version: "1.0"
---

# Four.Meme Agentic Ops

## Usage

- Category: Ecosystem
- Mode: guide
- Version: 0.1.0

## Input Example

```json
{
  "goal": "momentum_entry",
  "riskTier": "medium",
  "maxCapitalBnb": 0.6,
  "entrySlices": 3,
  "confirmationMode": "human_in_the_loop"
}
```

## Operating Loop

1. Discover candidates (read-only):
   ```bash
   npx fourmeme token-list
   npx fourmeme token-rankings
   ```
2. Score each candidate with a fixed rubric:
   - liquidity quality
   - price acceleration
   - holder concentration
   - tax and transfer constraints
3. Build a proposed execution plan (size, slices, and invalidation).
4. Ask for explicit confirmation on every write action.
5. Execute using trade commands from the approved plan:
   ```bash
   npx fourmeme quote-buy ...
   npx fourmeme buy ...
   npx fourmeme quote-sell ...
   npx fourmeme sell ...
   ```
6. Monitor and journal:
   ```bash
   npx fourmeme events <fromBlock> [toBlock]
   ```
   Record rationale, execution hash, and post-trade outcome.

## Agentic Policy

- Keep default mode as assistive, not autonomous.
- Require explicit user confirmation for all on-chain writes.
- Apply hard risk caps before each order (`maxCapitalBnb`, `maxLossBnb`, `maxSlippageBps`).
- Re-check wallet and quote right before execution to avoid stale state.

## Source Anchors

- four-meme-ai package + command list: https://www.npmjs.com/package/four-meme-ai
- Four.meme protocol integration page: https://four-meme.gitbook.io/four.meme/brand/protocol-integration
