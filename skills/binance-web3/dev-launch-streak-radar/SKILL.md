---
name: dev_launch_streak_radar
description: Detects whether a launcher wallet keeps opening new Pancake pairs on consecutive days and returns streak/risk signals. Use when users ask if a dev is continuously launching tokens, repeatedly opening markets, or needs launch-frequency risk checks on BSC.
metadata:
  author: brief-onchain
  version: "1.0"
---

# Dev Launch Streak Radar

## Usage

- Category: Onchain Risk
- Mode: live
- Version: 0.1.0

## Input Example

```json
{
  "launcher": "0x1111111111111111111111111111111111111111",
  "days": 7,
  "minStreakDays": 3,
  "guideOnly": false,
  "includeDexScreener": false,
  "maxDexChecks": 6,
  "minLiquidityUsd": 5000
}
```

## What It Does

1. Scans Pancake V2 `PairCreated` events in the selected window.
2. Attributes pair-creation transactions to the given launcher address.
3. Computes consecutive-day launch streak and launch counts.
4. Optionally enriches launched tokens with DexScreener liquidity snapshots.
5. Optionally executes agent-configured APIs from `extraApis` and merges responses.

## Guide-Only Mode

Use this when your AI/agent just needs API integration advice first:

```json
{
  "launcher": "0x1111111111111111111111111111111111111111",
  "guideOnly": true
}
```

This returns provider suggestions and a config template without onchain calls.

## Free vs Enhanced Mode

- Free default: public BSC RPC only (no API key).
- Better stability: pass your own `rpcUrl` in input.
- Better alerts: in your own agent workflow, merge extra providers as optional enrichment.

## Recommended Optional APIs (BYO)

1. DexScreener API: pair liquidity/volume snapshot
2. GoPlus Token Security API: token risk flags
3. Honeypot.is API: honeypot/tax simulation checks
4. Etherscan/BscScan Logs API: indexed fallback for logs and tx history

The skill provides guidance fields so your AI can decide when to call these providers.

## Agent-Configured API Execution

If your agent already has API keys, pass request specs in `extraApis`:

```json
{
  "launcher": "0x1111111111111111111111111111111111111111",
  "days": 7,
  "extraApis": [
    {
      "name": "GoPlusSecurity",
      "method": "GET",
      "url": "https://api.gopluslabs.io/api/v1/token_security/56?contract_addresses=0xToken1,0xToken2",
      "headers": {
        "Authorization": "Bearer ${GOPLUS_API_KEY}"
      }
    }
  ]
}
```

After configuration, the skill returns merged API responses in `apiEnrichment`.

## Install

Use Playground (local runtime) or load this SKILL in your own agent workflow.
