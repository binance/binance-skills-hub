---
name: bsc_rpc_fanout_check
description: Validates BSC RPC endpoints for health, latency, and block drift.
---

# BSC RPC Fanout Check

## Usage

- Category: Infrastructure
- Mode: live
- Version: 0.1.0

## Input Example

```json
{
  "method": "eth_blockNumber",
  "sampleSize": 2,
  "blockDriftThreshold": 2,
  "endpoints": [
    "https://bsc-dataseed.binance.org",
    "https://bsc-dataseed1.defibit.io"
  ]
}
```

## Local Install (planned)

```bash
npx @skillshub/bsc-rpc-fanout-check
```
