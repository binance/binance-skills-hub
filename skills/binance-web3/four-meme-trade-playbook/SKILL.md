---
name: four_meme_trade_playbook
description: Creates quote-first Four.meme buy and sell execution plans with slippage, loss limits, and event-level reconciliation. Use when users ask to buy, sell, scale in, or scale out Four.meme tokens.
metadata:
  author: brief-onchain
  version: "1.0"
---

# Four.Meme Trade Playbook

## Usage

- Category: Ecosystem
- Mode: guide
- Version: 0.1.0

## Input Example

```json
{
  "action": "buy",
  "tokenAddress": "0x...",
  "amountBnb": 0.25,
  "maxSlippageBps": 150,
  "maxLossBnb": 0.02,
  "confirmation": "required"
}
```

## Workflow

1. Confirm token metadata and manager version:
   ```bash
   npx fourmeme token-info <tokenAddress>
   ```
2. Generate quote before execution:
   ```bash
   npx fourmeme quote-buy <tokenAddress> <amountOrFunds>
   npx fourmeme quote-sell <tokenAddress> <amountWei>
   ```
3. Validate quote against policy:
   - `slippageBps <= maxSlippageBps`
   - `expectedLoss <= maxLossBnb`
   - liquidity and tax flags reviewed
4. Ask for explicit order confirmation (`CONFIRM_BUY` or `CONFIRM_SELL`).
5. Execute trade after confirmation:
   ```bash
   npx fourmeme buy <tokenAddress> <amountOrFunds> ...
   npx fourmeme sell <tokenAddress> <amountWei> [minFundsWei]
   ```
6. Reconcile with recent events:
   ```bash
   npx fourmeme events <fromBlock> [toBlock]
   ```

## Guardrails

- Enforce quote-first; never jump directly to `buy` or `sell`.
- If TokenManager version is unsupported, stop and report.
- Require human confirmation for any non-read operation.
- Prefer partial-size execution when volatility is high.

## Source Anchors

- four-meme-ai package + command surface: https://www.npmjs.com/package/four-meme-ai
- Four.meme protocol integration page: https://four-meme.gitbook.io/four.meme/brand/protocol-integration
