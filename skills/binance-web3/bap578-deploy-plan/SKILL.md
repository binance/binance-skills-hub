---
name: bap578_deploy_plan
description: Builds a deploy+verify execution plan from environment variables.
metadata:
  author: brief-onchain
  version: "1.0"
---

# BAP578 Deploy Plan

## Usage

- Category: BAP578 Dev
- Mode: guide
- Version: 0.1.0

## Input Example

```json
{
  "network": "bsc-mainnet"
}
```

## Output Example

```text
1. Deploy treasury/vault/adapter contracts in sequence
2. Configure vault controllers and permissions
3. Run verify scripts and store tx hashes
```

## Security Notes

- Keep deployment order deterministic to avoid partial-permission states.
- Verify controller config immediately after deploy.

## Install

`npx @skillshub/bap578-deploy-plan`
