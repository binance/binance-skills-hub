---
title: BSC Chain Growth Tracker
description: |
  BNB Chain ecosystem growth analytics combining historical TVL tracking, multi-chain comparison,
  and real-time ecosystem health metrics.
  Tracks BNB Chain TVL growth since genesis, compares with competing chains,
  and provides daily trend data for ecosystem health monitoring.
  Use this skill when users ask about BNB Chain growth, BSC TVL history, chain comparison,
  ecosystem health, BNB Chain vs Ethereum, how BSC has grown, or chain market share.
metadata:
  version: "1.0"
  author: mefai-dev
license: MIT
---

# BSC Chain Growth Tracker Skill

## Overview

Provides comprehensive BNB Chain ecosystem growth analytics through three complementary data views: historical TVL tracking, multi-chain comparison, and real-time chain rankings. Together, these paint a complete picture of BNB Chain's position and trajectory in the broader DeFi ecosystem.

| Feature | Details |
|---------|---------|
| Data Source | DefiLlama Chain Analytics API |
| Chain Focus | BNB Chain (BSC) with multi-chain comparison |
| Historical Data | 1,951 daily data points since November 2020 |
| Chains Tracked | 434 blockchain networks |
| Update Frequency | Hourly for current data, daily for historical |

## Use Cases

1. Track BNB Chain TVL growth trajectory since network launch
2. Compare BNB Chain TVL with competing L1/L2 chains (Ethereum, Solana, Arbitrum, etc.)
3. Identify TVL trend direction — is capital flowing into or out of BSC?
4. Calculate BNB Chain's market share of total DeFi TVL
5. Analyze TVL correlation with BNB token price movements
6. Detect capital migration patterns between chains
7. Generate historical growth reports for ecosystem analysis
8. Monitor daily TVL changes to identify significant capital movements

## API 1: BNB Chain Historical TVL

### Method: GET

**URL:**
```
https://api.llama.fi/v2/historicalChainTvl/BSC
```

**Headers:**
```
Accept: application/json
```

**Request Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| (none) | — | — | Chain name is specified as path segment. Use `BSC` for BNB Chain |

**Example Request:**
```bash
curl -s "https://api.llama.fi/v2/historicalChainTvl/BSC"
```

**Response Example:**
```json
[
  {
    "date": 1604102400,
    "tvl": 12873962
  },
  {
    "date": 1604188800,
    "tvl": 14293847
  },
  {
    "date": 1620864000,
    "tvl": 34847291034
  },
  {
    "date": 1772496000,
    "tvl": 5486885558
  },
  {
    "date": 1772582400,
    "tvl": 5709532488
  }
]
```

**Response Fields:**

| Field | Type | Description |
|-------|------|-------------|
| (root) | array | Array of daily TVL snapshots, ordered chronologically |
| date | integer | Unix timestamp (start of day, UTC, in seconds) |
| tvl | number | Total Value Locked on BNB Chain at end of that day (USD) |

## API 2: All Chains Current TVL Ranking

### Method: GET

**URL:**
```
https://api.llama.fi/v2/chains
```

**Headers:**
```
Accept: application/json
```

**Request Parameters:**

No parameters required. Returns all 434 tracked chains.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| (none) | — | — | Returns all chains with current TVL data |

**Example Request:**
```bash
curl -s "https://api.llama.fi/v2/chains"
```

**Response Example:**
```json
[
  {
    "gecko_id": "ethereum",
    "tvl": 56180360777.62,
    "tokenSymbol": "ETH",
    "cmcId": "1027",
    "name": "Ethereum",
    "chainId": 1
  },
  {
    "gecko_id": "binancecoin",
    "tvl": 5709301086.16,
    "tokenSymbol": "BNB",
    "cmcId": "1839",
    "name": "BSC",
    "chainId": 56
  },
  {
    "gecko_id": "solana",
    "tvl": 8294710283.45,
    "tokenSymbol": "SOL",
    "cmcId": "5426",
    "name": "Solana",
    "chainId": null
  },
  {
    "gecko_id": null,
    "tvl": 4829301847.23,
    "tokenSymbol": "ETH",
    "cmcId": null,
    "name": "Arbitrum",
    "chainId": 42161
  }
]
```

**Response Fields:**

| Field | Type | Description |
|-------|------|-------------|
| (root) | array | Array of all tracked chains (434 entries), unsorted |
| gecko_id | string or null | CoinGecko identifier for the chain's native token. `null` for chains without a CoinGecko listing |
| tvl | number | Current Total Value Locked on this chain (USD). Updated hourly |
| tokenSymbol | string or null | Native token ticker symbol (e.g., `"BNB"`, `"ETH"`, `"SOL"`). `null` for some chains |
| cmcId | string or null | CoinMarketCap identifier. `null` for unlisted chains |
| name | string | Chain name — this is the identifier used across all DefiLlama endpoints (e.g., `"BSC"`, `"Ethereum"`, `"Arbitrum"`) |
| chainId | integer or null | EVM chain ID (e.g., `56` for BSC, `1` for Ethereum). `null` for non-EVM chains (Solana, Aptos, etc.) |

## API 3: Global Historical TVL (All Chains Combined)

### Method: GET

**URL:**
```
https://api.llama.fi/v2/historicalChainTvl
```

**Headers:**
```
Accept: application/json
```

**Request Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| (none) | — | — | No chain specified — returns aggregate TVL across all chains |

**Example Request:**
```bash
curl -s "https://api.llama.fi/v2/historicalChainTvl"
```

**Response Example:**
```json
[
  {
    "date": 1573689600,
    "tvl": 628921043
  },
  {
    "date": 1772582400,
    "tvl": 102847291034
  }
]
```

**Response Fields:**

| Field | Type | Description |
|-------|------|-------------|
| (root) | array | Daily aggregate TVL across all tracked chains |
| date | integer | Unix timestamp (start of day, UTC, in seconds) |
| tvl | number | Combined TVL across all 434 chains (USD) |

## Derived Analytics

These metrics can be calculated by combining the three APIs:

| Metric | Formula | Description |
|--------|---------|-------------|
| BSC Market Share | `BSC TVL / Global TVL × 100` | BNB Chain's percentage of total DeFi TVL |
| TVL Rank | Sort all chains by `tvl` descending | BNB Chain's position among all chains |
| Daily TVL Change | `today.tvl - yesterday.tvl` | Absolute USD change in TVL |
| Daily TVL Change % | `(today.tvl - yesterday.tvl) / yesterday.tvl × 100` | Percentage change in TVL |
| 7d Moving Average | Average of last 7 daily TVL values | Smoothed TVL trend line |
| ATH TVL | Max value in historical TVL array | All-time high TVL (BSC peaked at ~$34.8B in May 2021) |
| ATH Distance | `(current - ATH) / ATH × 100` | How far current TVL is from its peak |
| Growth Since Genesis | `(current - first) / first × 100` | Total growth since first recorded TVL |

## Notes

1. All TVL values are in USD
2. Timestamps are Unix epoch in **seconds** (not milliseconds) — multiply by 1000 for JavaScript `Date`
3. The chain name for BNB Chain in DefiLlama is `"BSC"` (not "BNB Chain" or "Binance"). This identifier must be used exactly in URL paths
4. Historical TVL data for BSC starts from November 1, 2020 (Unix timestamp `1604102400`), with approximately 1,951 daily entries
5. The `/v2/chains` endpoint returns all 434 chains in an unsorted array — sort by `tvl` descending for ranking
6. Some fields may be `null`: `gecko_id`, `tokenSymbol`, `cmcId`, and `chainId` are not available for all chains
7. BSC's `chainId` is `56` — this corresponds to the EVM chain ID used in MetaMask and other wallets
8. For multi-chain comparison, use the same chain names from the `/v2/chains` response as path segments in `/v2/historicalChainTvl/{chain}`
9. The global TVL endpoint (no chain specified) aggregates across all chains, useful for calculating market share
10. BNB Chain consistently ranks in the top 3-5 chains by TVL globally, with current TVL approximately $5.7B
11. Rate limiting: DefiLlama free tier allows approximately 500 requests per 5 minutes
