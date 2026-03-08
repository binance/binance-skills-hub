---
name: four_meme_tax_token_guard
description: Plans TaxToken creation with fee-split sanity checks, anti-sniping defaults, explicit confirmation gates, and post-launch tax-info reconciliation.
---

# Four.Meme Tax Token Guard

## Usage

- Category: Ecosystem
- Mode: guide
- Version: 0.1.0

## Input Example

```json
{
  "action": "create_tax_token",
  "name": "Tax Agent Coin",
  "symbol": "TAXA",
  "taxFeeRate": 5,
  "taxBurnRate": 0,
  "taxDivideRate": 0,
  "taxLiquidityRate": 100,
  "taxRecipientRate": 0,
  "budgetBnb": 0.01,
  "dryRun": true
}
```

## Workflow

1. Run baseline checks:
   ```bash
   npx fourmeme verify
   ```
2. Build tax config and validate hard constraints before any write:
   - all rates in allowed ranges.
   - `burn + divide + liquidity + recipient = 100`.
   - recipient address required when recipient rate > 0.
3. Dry-run the command preview (recommended):
   ```bash
   npx fourmeme create-instant --image=... --name=... --short-name=... --desc=... --label=... --tax-token --tax-fee-rate=5 --tax-burn-rate=0 --tax-divide-rate=0 --tax-liquidity-rate=100 --tax-recipient-rate=0
   ```
   Or use `create-api` -> `create-chain` if the user wants two-step control.
4. Ask explicit confirmation with final fee table and expected BNB spend.
5. Execute create only after confirmation.
6. Post-create reconciliation:
   ```bash
   npx fourmeme tax-info <tokenAddress>
   npx fourmeme token-info <tokenAddress>
   npx fourmeme events <fromBlock> [toBlock]
   ```

## Guardrails

- Never accept plain-text private keys in chat.
- Treat anti-sniping windows and tax defaults as risk controls, not guaranteed protection.
- Refuse execution when fee splits are invalid or ambiguous.
- Keep trading disabled in the same turn unless user separately confirms trade intent.

## Source Anchors

- Four.meme CLI TaxToken options: https://github.com/four-meme-community/four-meme-ai
- Four.meme tax-token/X-Mode update: https://four-meme.gitbook.io/four.meme/blog/product-update-new-tax-token-model-with-x-mode-on-four.meme
- Four.meme protocol integration + latest ABI/API notes: https://four-meme.gitbook.io/four.meme/brand/protocol-integration
