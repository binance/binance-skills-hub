---
name: defi-yield-radar
description: |
  DeFi yield pool scanner for BSC (BNB Chain). Fetches real-time yield data from DefiLlama,
  filters for BSC pools, and presents APY, TVL, IL risk, and stablecoin classification.
  Use this skill when users ask about DeFi yields, farming opportunities, APY comparisons,
  yield farming on BSC, or stablecoin yield strategies.
metadata:
  author: binance-web3-team
  version: "1.0"
---

# DeFi Yield Radar Skill

## Overview

Scans all DeFi yield pools on BSC via the DefiLlama Yields API, providing a sortable,
filterable view of farming opportunities ranked by APY and TVL.

## Data Source

| Source | Endpoint | TTL |
|--------|----------|-----|
| DefiLlama | `https://yields.llama.fi/pools` | 120s |

## Fields

| Field | Description |
|-------|-------------|
| project | Protocol name (e.g., PancakeSwap, Venus) |
| symbol | Pool pair symbol (e.g., CAKE-BNB) |
| apy | Total APY (base + reward) |
| apyBase | Base APY from trading fees |
| apyReward | Reward APY from token emissions |
| tvlUsd | Total value locked in USD |
| ilRisk | Impermanent loss risk flag |
| stablecoin | Whether pool contains stablecoins |
| chain | Blockchain (filtered to BSC) |

## Filters

- **All**: Show all BSC pools with TVL > $10K
- **Stablecoin**: Only pools containing stablecoins (lower risk)
- **No IL**: Only pools with no impermanent loss risk

## Usage Examples

- "Show me the highest yield pools on BSC"
- "What stablecoin farming options are on BNB Chain?"
- "Find BSC pools with no impermanent loss"
