---
name: top_movers
description: Ranks top symbols by 24h change or quote volume with optional liquidity filter.
metadata:
  author: brief-onchain
  version: "1.0"
---

# Top Movers Radar

## Usage

- Category: Analytics
- Mode: live
- Version: 0.1.0

## Input Example

{
  "quoteAsset": "USDT",
  "limit": 8,
  "minQuoteVolume": 50000000,
  "sortBy": "change"
}

## Local Install (planned)

npx @skillshub/top-movers-radar
