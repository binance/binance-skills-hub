---
name: erc8004_fast_auth
description: Implements a fast authorization runbook for ERC-8004 agent identity operations using ERC-721 approvals and immediate revoke controls. Use when users ask for quick agent authorization, delegated execution windows, or session-scoped operator permissions.
---

# ERC8004 Fast Auth

## Usage

- Category: Ecosystem
- Mode: guide
- Version: 0.1.0

## Input Example

```json
{
  "operation": "grant_operator",
  "chain": "bsc",
  "identityRegistry": "0x...",
  "agentId": 1,
  "operator": "0x...",
  "scope": "session",
  "ttlMinutes": 30
}
```

## Fast Authorization Flow

1. Ensure identity exists (if not, register first):
   ```bash
   npx fourmeme 8004-register <name> [imageUrl] [description]
   npx fourmeme 8004-balance <ownerAddress>
   ```
2. Choose scope:
   - single agent: `approve(operator, agentId)`
   - session batch: `setApprovalForAll(operator, true)`
3. Apply authorization on the ERC-721 identity registry contract.
4. Verify authorization state before any delegated action:
   - `getApproved(agentId)`
   - `isApprovedForAll(owner, operator)`
5. Execute delegated action window.
6. Revoke immediately at window end:
   - `approve(address(0), agentId)` or
   - `setApprovalForAll(operator, false)`

## Optional Wallet Rebind (ERC8004)

- If rotating the payment wallet, use `setAgentWallet(agentId, newWallet, deadline, signature)` and verify with `getAgentWallet(agentId)`.
- Keep this step separate from operator grants to reduce blast radius.

## Guardrails

- Prefer the smallest scope and shortest TTL possible.
- Never keep `setApprovalForAll` active longer than necessary.
- Require human confirmation for grant and revoke steps.
- Log granted operator, scope, start time, and revoke tx hash.

## Source Anchors

- ERC-8004 draft specification: https://ercs.ethereum.org/ERCS/erc-8004
- four-meme-ai package (8004 commands): https://www.npmjs.com/package/four-meme-ai
