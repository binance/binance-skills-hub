---
title: Global Market Pulse
description: |
  Global cryptocurrency market overview dashboard. Shows total market cap, 24h volume,
  BTC dominance, market dominance distribution, and DeFi market summary.
  Use this skill when users ask about overall crypto market status, market cap,
  BTC dominance, DeFi market size, or general market conditions.
metadata:
  version: "1.0"
  author: mefai-dev
license: MIT
---

# Global Market Pulse Skill

## Overview

Provides a comprehensive snapshot of the global cryptocurrency market using
CoinGecko's free Global API endpoints.

## Data Sources

| Source | Endpoint | TTL |
|--------|----------|-----|
| CoinGecko | `https://api.coingecko.com/api/v3/global` | 60s |
| CoinGecko | `https://api.coingecko.com/api/v3/global/decentralized_finance_defi` | 60s |

## Display Components

### Market Summary Cards
- Total crypto market capitalization (USD)
- 24h trading volume
- BTC dominance percentage
- 24h market cap change

### Dominance Bar
Colored horizontal bar showing market share:
BTC | ETH | USDT | BNB | SOL | Others

### DeFi Section
| Field | Description |
|-------|-------------|
| defi_market_cap | Total DeFi market cap |
| trading_volume_24h | DeFi 24h volume |
| defi_dominance | DeFi share of total crypto market |
| top_coin_name | Leading DeFi coin by market cap |
| top_coin_defi_dominance | Top coin's share of DeFi market |

## Usage Examples

- "What's the total crypto market cap?"
- "Show me BTC dominance"
- "How big is the DeFi market?"
