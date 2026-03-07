---
title: Protocol TVL Tracker
description: |
  BSC DeFi protocol rankings by Total Value Locked (TVL). Fetches protocol data from DefiLlama,
  filters for BSC presence, and ranks by BSC-specific TVL.
  Use this skill when users ask about BSC DeFi rankings, protocol TVL, top DeFi on BNB Chain,
  or TVL comparisons between protocols.
metadata:
  version: "1.0"
  author: mefai-dev
license: MIT
---

# Protocol TVL Tracker Skill

## Overview

Ranks DeFi protocols on BSC by their chain-specific Total Value Locked,
using DefiLlama's comprehensive protocol data.

## Data Source

| Source | Endpoint | TTL |
|--------|----------|-----|
| DefiLlama | `https://api.llama.fi/protocols` | 300s |

## Key Implementation Notes

- DefiLlama uses `"Binance"` (not `"BSC"`) as the chain name in `chainTvls`
- BSC TVL path: `protocol.chainTvls.Binance`
- Chain presence check: `protocol.chains.includes("Binance")`

## Fields

| Field | Description |
|-------|-------------|
| name | Protocol name |
| category | DeFi category (DEX, Lending, Yield, etc.) |
| bscTvl | TVL on BSC specifically |
| totalTvl | Total TVL across all chains |
| bscPct | Percentage of total TVL on BSC |
| change_1d | 24h TVL change percentage |
| change_7d | 7d TVL change percentage |

## Summary Stats
- Total BSC DeFi TVL (sum of all protocols)
- Number of active protocols on BSC

## Usage Examples

- "What are the top DeFi protocols on BSC by TVL?"
- "How much TVL does PancakeSwap have on BSC?"
- "Show BSC DeFi protocol rankings"
