---
name: four_meme_graduation_radar
description: Tracks graduation and migration signals from Four.meme bonding curves to Pancake liquidity using rankings, listing flags, and LiquidityAdded events.
---

# Four.Meme Graduation Radar

## Usage

- Category: Ecosystem
- Mode: guide
- Version: 0.1.0

## Input Example

```json
{
  "action": "scan_graduation",
  "orderBy": "Graduated",
  "lookbackBlocks": 1200,
  "maxCandidates": 20,
  "minLiquidityUsd": 20000
}
```

## Workflow

1. Pull graduation candidates first:
   ```bash
   npx fourmeme token-rankings Graduated --barType=HOUR24
   npx fourmeme token-list --listedPancake=true --pageIndex=1 --pageSize=30
   ```
2. Confirm current token state:
   ```bash
   npx fourmeme token-info <tokenAddress>
   npx fourmeme token-get <tokenAddress>
   ```
3. Reconcile migration by events in a fixed window:
   ```bash
   npx fourmeme events <fromBlock> [toBlock]
   ```
   Focus on `LiquidityAdded` + first post-migration swap activity.
4. Optional enrichment via Bitquery Four Meme API:
   - top token creators by liquidity added.
   - top migrated tokens by traded volume.
5. Output a ranked watchlist:
   - migration confidence.
   - liquidity durability.
   - concentration risk and fade risk.

## Guardrails

- Default to read-only analysis.
- Do not place buy/sell orders inside this skill flow.
- Mark mempool-only observations as unconfirmed until on-chain events are finalized.
- If token metadata or manager version checks fail, downgrade confidence and stop execution advice.

## Source Anchors

- Four.meme CLI command surface: https://github.com/four-meme-community/four-meme-ai
- Four Meme liquidity/migration query references: https://docs.bitquery.io/docs/blockchain/BSC/four-meme-api/
- Four.meme protocol integration updates: https://four-meme.gitbook.io/four.meme/brand/protocol-integration
