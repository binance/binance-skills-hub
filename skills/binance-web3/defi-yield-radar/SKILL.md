---
name: defi-yield-radar
description: |
  DeFi yield pool scanner for BSC (BNB Chain). Fetches real-time yield data from DefiLlama,
  filters for BSC pools, and presents APY, TVL, IL risk, and stablecoin classification.
  Use this skill when users ask about DeFi yields, farming opportunities, APY comparisons,
  yield farming on BSC, or stablecoin yield strategies.
metadata:
  version: "1.0.0"
  author: mefai-dev
license: MIT
---

# DeFi Yield Radar Skill

## Overview

Scans all DeFi yield pools on BSC via the DefiLlama Yields API, providing a sortable,
filterable view of farming opportunities ranked by APY and TVL.

## Data Source

| Endpoint | Description |
|----------|-------------|
| `https://yields.llama.fi/pools` (GET) | Fetches all DeFi yield pools across chains |

## How It Works

1. Fetches all pools from DefiLlama Yields API
2. Filters for BSC (BNB Chain) pools only
3. Sorts by APY descending
4. Classifies pools by stablecoin status and IL risk
5. Presents top pools with APY, TVL, project name, and risk indicators

## Example Prompts

- "Show me the highest yield pools on BSC"
- "What stablecoin farming options are on BNB Chain?"
- "Find BSC pools with no impermanent loss"
- "Compare APY across BSC DeFi protocols"
- "Which BSC pools have TVL over $1M?"

## Output Format

| Pool | Project | APY | TVL | IL Risk | Stablecoin |
|------|---------|-----|-----|---------|------------|
| USDT-USDC | PancakeSwap | 12.5% | $45M | No | Yes |
| BNB-BUSD | Venus | 8.2% | $120M | Yes | No |

## Tech Stack

- JavaScript (ES6+)
- DefiLlama Yields API
- No API key required
