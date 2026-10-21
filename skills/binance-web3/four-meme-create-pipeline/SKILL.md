---
name: four_meme_create_pipeline
description: Plans and executes Four.meme two-step token creation (create-api then create-chain) with confirmation gates, fee sanity checks, and post-create verification. Use when users ask to launch or issue a new token on Four.meme from an agent workflow.
metadata:
  author: brief-onchain
  version: "1.0"
---

# Four.Meme Create Pipeline

## Usage

- Category: Ecosystem
- Mode: guide
- Version: 0.1.0

## Input Example

```json
{
  "action": "create_token",
  "network": "bsc",
  "name": "Meme Agent Coin",
  "symbol": "MAC",
  "description": "Agent launch token for BSC growth",
  "logoPath": "/path/to/logo.png",
  "label": "Meme",
  "budgetBnb": 0.01,
  "dryRun": true
}
```

## Workflow

1. Run read-only health checks first:
   ```bash
   npx fourmeme verify
   ```
2. Collect creation payload and render a command preview before any write transaction:
   ```bash
   npx fourmeme create-api <args...>
   ```
3. Ask for explicit final confirmation (`CONFIRM_CREATE`) with symbol, expected spend, and wallet address.
4. Execute on-chain creation only after confirmation:
   ```bash
   npx fourmeme create-chain <args...>
   ```
5. Reconcile output with info/events:
   ```bash
   npx fourmeme token-info <tokenAddress>
   npx fourmeme events <fromBlock> [toBlock]
   ```

## Guardrails

- Never execute `create-chain` without explicit user confirmation.
- Default to `dryRun=true` when user intent is ambiguous.
- Refuse to process plain-text private keys in chat or logs.
- Abort if chain is not BSC or if verification fails.

## Source Anchors

- four-meme-ai package + CLI references: https://www.npmjs.com/package/four-meme-ai
- Four.meme protocol integration page: https://four-meme.gitbook.io/four.meme/brand/protocol-integration
