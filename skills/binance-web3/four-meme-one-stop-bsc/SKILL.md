---
name: four_meme_one_stop_bsc
description: Runs a one-stop Four.meme workflow that combines token launch, buy execution, tweet material generation, ERC8004 identity setup, and fast operator authorization with revoke discipline. Use when users ask for an end-to-end Four.meme execution playbook instead of separate skills.
metadata:
  author: brief-onchain
  version: "1.0"
---

# Four.Meme One-Stop Launch

## Usage

- Category: Ecosystem
- Mode: guide
- Version: 0.1.0

## Input Example

```json
{
  "goal": "one_stop_flow",
  "create": {
    "name": "Meme Agent Coin",
    "symbol": "MAC",
    "budgetBnb": 0.01
  },
  "trade": {
    "side": "buy",
    "amountBnb": 0.2,
    "maxSlippageBps": 150
  },
  "auth": {
    "operator": "0x...",
    "scope": "session",
    "ttlMinutes": 30
  }
}
```

## One-Stop Sequence

1. Run baseline verification:
   ```bash
   npx fourmeme verify
   ```
2. Create token in two steps with confirmation:
   ```bash
   npx fourmeme create-api <args...>
   npx fourmeme create-chain <args...>
   ```
3. Generate quote and execute trade with confirmation:
   ```bash
   npx fourmeme token-info <tokenAddress>
   npx fourmeme quote-buy <tokenAddress> <amountOrFunds>
   npx fourmeme buy <tokenAddress> <amountOrFunds> ...
   ```
4. Ensure ERC8004 identity readiness:
   ```bash
   npx fourmeme 8004-register <name> [imageUrl] [description]
   npx fourmeme 8004-balance <ownerAddress>
   ```
5. Apply short-lived operator authorization, then revoke:
   - grant: `approve` or `setApprovalForAll(..., true)`
   - verify: `getApproved` or `isApprovedForAll`
   - revoke: `approve(address(0), agentId)` or `setApprovalForAll(..., false)`
6. Generate tweet materials package (single tweet + thread + CTA):
   - Summary tweet: project hook + token symbol + launch context + risk note.
   - Thread draft (3-5 posts): why now, what utility, how to participate.
   - CTA variants: buy-in prompt, community invite, and risk disclaimer.
   - Optional style pass:
     ```bash
     # local rewrite style helper if needed
     npx @skillshub/cz-style-rewrite
     ```
7. Reconcile all writes with events:
   ```bash
   npx fourmeme events <fromBlock> [toBlock]
   ```

## Mandatory Safety Rules

- Follow Four.meme current supported-chain constraints in runtime config.
- Require explicit user confirmation for create, buy, sell, grant, and revoke.
- Never accept plaintext private keys in conversation.
- Keep operator scope minimal and revoke immediately after delegated actions.
- Abort execution if quote exceeds risk caps (`maxSlippageBps`, `maxLossBnb`, `maxCapitalBnb`).

## Source Anchors

- four-meme-ai package and command set: https://www.npmjs.com/package/four-meme-ai
- Four.meme protocol integration: https://four-meme.gitbook.io/four.meme/brand/protocol-integration
- ERC-8004 draft specification: https://ercs.ethereum.org/ERCS/erc-8004
