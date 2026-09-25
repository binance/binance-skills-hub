---
name: bsc_nft_ops_guide
description: Guides ERC-721 metadata, ownership checks, and transfer-safe operational flow on BSC.
metadata:
  author: brief-onchain
  version: "1.0"
---

# BSC NFT Ops Guide

## Usage

- Category: Ecosystem
- Mode: guide
- Version: 0.1.0

## Input Example

```json
{
  "task": "check_owner",
  "contract": "0x...",
  "tokenId": 1
}
```

## Local Install (planned)

```bash
npx @skillshub/bsc-nft-ops-guide
```

## Notes

- Focuses on safe read-first NFT workflows.
- Transfer operations should require explicit confirmation and preflight checks.
