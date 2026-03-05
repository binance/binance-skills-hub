---
title: Stablecoin Flow Tracker
description: |
  Cross-chain stablecoin supply tracker. Shows stablecoin circulating supply on BSC vs other chains,
  with chain distribution visualization and per-stablecoin breakdown.
  Use this skill when users ask about stablecoin flows, USDT/USDC supply on BSC,
  cross-chain stablecoin movement, or chain liquidity comparisons.
metadata:
  version: "1.0"
  author: mefai-dev
license: MIT
---

# Stablecoin Flow Tracker Skill

## Overview

Tracks stablecoin circulating supply across chains using DefiLlama's Stablecoins API.
Focuses on BSC allocation with cross-chain comparison.

## Data Sources

| Source | Endpoint | TTL |
|--------|----------|-----|
| DefiLlama | `https://stablecoins.llama.fi/stablecoins?includePrices=true` | 300s |
| DefiLlama | `https://stablecoins.llama.fi/stablecoinchains` | 300s |

## Display Components

### Summary Cards
- BSC total stablecoin supply
- Number of stablecoins on BSC
- Top stablecoin on BSC

### Chain Distribution Bar
Colored horizontal bar showing proportional stablecoin supply across top chains
(Ethereum, BSC, Tron, Solana, etc.)

### Per-Stablecoin Table
| Field | Description |
|-------|-------------|
| symbol | Stablecoin ticker (USDT, USDC, etc.) |
| bscCirculating | Circulating supply on BSC |
| totalCirculating | Total supply across all chains |
| bscPct | BSC share of total supply |
| pegMechanism | Peg type (fiat-backed, algorithmic, etc.) |

## Usage Examples

- "How much USDT is on BSC?"
- "Compare stablecoin supply across chains"
- "Show BSC stablecoin market share"
