---
name: bap578_vault_checklist
description: Outputs a concise checklist for vault-controller and operator safety.
metadata:
  author: brief-onchain
  version: "1.0"
---

# BAP578 Vault Checklist

## Usage

- Category: BAP578 Dev
- Mode: guide
- Version: 0.1.0

## Input Example

```json
{
  "includeTokenFlows": true
}
```

## Output Example

```text
- Vault controller whitelist: only approved adapters can debit
- Token operator auth: ownerOf(tokenId) is mandatory
- Native/ERC20 transfer paths validate amount and receiver
```

## Security Notes

- Validate debit paths for non-controller rejection.
- Include fee-on-transfer balance-delta checks when token flows are enabled.

## Install

`npx @skillshub/bap578-vault-checklist`
