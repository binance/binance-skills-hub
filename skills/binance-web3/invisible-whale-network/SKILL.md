---
title: Invisible Whale Network
description: Entity clustering engine that identifies wallets belonging to the same entity using transaction timing analysis, gas price patterns, and fund flow graph analysis to reveal the true whale landscape on BSC.
metadata:
  version: 1.0.0
  author: mefai-dev
license: MIT
---

# Invisible Whale Network

Entity clustering engine for BSC that identifies wallets belonging to the same operator using transaction timing correlation, gas price fingerprinting, and fund flow graph analysis. Traditional whale trackers show individual wallets. This skill reveals the true whale landscape by clustering multi-wallet operators into unified entities and analyzing their combined strategies.

## Overview

On-chain whale tracking is fundamentally broken. A single entity operating 47 wallets appears as 47 independent small holders. Whale leaderboards show wallet rankings, not entity rankings. When "Wallet A" sells, it looks bearish, but that entity's other 46 wallets are accumulating. The visible picture is the opposite of reality.

Invisible Whale Network solves this by applying entity clustering algorithms to BSC transaction data. Wallets are grouped into entities based on four signal types: transaction timing correlation (wallets transacting within tight time windows), gas price patterns (wallets using identical non-standard gas prices), direct and indirect fund flows (wallets sharing funding sources), and common token holding patterns (wallets holding the same obscure tokens in similar proportions).

## Operational Modes

### Mode 1: Cluster Discovery

Input any BSC address and discover all connected wallets belonging to the same entity.

**Request:**

```
POST /invisible-whale-network/cluster-discovery
```

**Request Body:**

```json
{
  "address": "0x...",
  "chainId": "56",
  "maxDepth": 3,
  "minConfidence": 0.7,
  "timeRange": "90d"
}
```

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| address | string | Yes | BSC wallet address to analyze |
| chainId | string | Yes | Chain ID: `56` for BSC |
| maxDepth | integer | No | Maximum graph traversal depth (default: 3, max: 5) |
| minConfidence | float | No | Minimum clustering confidence threshold 0.0-1.0 (default: 0.7) |
| timeRange | string | No | Historical analysis window: `30d`, `90d`, `180d`, `365d` (default: `90d`) |

**Response Fields:**

| Field | Type | Description |
|-------|------|-------------|
| entityId | string | Unique entity identifier (hash) |
| seedAddress | string | Input address used as starting point |
| clusterSize | integer | Total wallets identified in this entity |
| totalValueUsd | string | Combined value across all entity wallets (USD) |
| wallets | array | List of clustered wallet objects |
| clusteringSignals | array | Evidence types used for clustering |
| confidenceScore | float | Overall entity clustering confidence (0.0-1.0) |

**Wallet Object:**

| Field | Type | Description |
|-------|------|-------------|
| address | string | Wallet address |
| balanceUsd | string | Current total balance in USD |
| firstSeen | long | First transaction timestamp (ms) |
| lastActive | long | Most recent transaction timestamp (ms) |
| transactionCount | integer | Total transaction count |
| connectionType | string | How this wallet is linked: `timing`, `gas_pattern`, `fund_flow`, `token_overlap`, `multi_signal` |
| connectionConfidence | float | Individual connection confidence (0.0-1.0) |
| role | string | Inferred role: `primary`, `accumulator`, `distributor`, `mixer`, `dormant` |

**Clustering Signal Types:**

| Signal | Description | Weight |
|--------|-------------|--------|
| `timing_correlation` | Transactions within 30-second windows across wallets | 0.30 |
| `gas_fingerprint` | Identical non-standard gas price or gas limit patterns | 0.25 |
| `fund_flow_direct` | Direct BNB/token transfers between wallets | 0.25 |
| `fund_flow_indirect` | Shared funding source within 2 hops | 0.15 |
| `token_overlap` | Holding same low-cap tokens in similar proportions | 0.05 |

---

### Mode 2: Entity Strategy Decoder

Analyzes the NET strategy across all wallets in an entity cluster. Reveals the true intent hidden behind distributed wallet activity.

**Request:**

```
POST /invisible-whale-network/entity-strategy
```

**Request Body:**

```json
{
  "entityId": "0xentity...",
  "chainId": "56",
  "tokenFilter": "0xtoken...",
  "timeRange": "30d"
}
```

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| entityId | string | Yes | Entity ID from cluster discovery |
| chainId | string | Yes | Chain ID: `56` for BSC |
| tokenFilter | string | No | Filter analysis to specific token contract address |
| timeRange | string | No | Analysis window: `7d`, `14d`, `30d`, `90d` (default: `30d`) |

**Response Fields:**

| Field | Type | Description |
|-------|------|-------------|
| entityId | string | Entity identifier |
| strategyClassification | string | `accumulation`, `distribution`, `hedging`, `wash_trading`, `neutral` |
| strategyConfidence | float | Classification confidence (0.0-1.0) |
| netPositionChange | string | Net token position change across all wallets |
| visibleVsTrue | object | Comparison of single-wallet view vs entity-level view |
| tokenBreakdown | array | Per-token strategy analysis |
| timeline | array | Chronological strategy events |

**Visible vs True Object:**

| Field | Type | Description |
|-------|------|-------------|
| largestWalletAction | string | What the most visible wallet appears to be doing |
| largestWalletChange | string | Visible wallet position change |
| entityNetAction | string | What the entity is actually doing across all wallets |
| entityNetChange | string | True net position change |
| mismatch | boolean | Whether visible action contradicts true action |
| mismatchSeverity | string | `none`, `minor`, `major`, `opposite` |

**Token Breakdown Entry:**

| Field | Type | Description |
|-------|------|-------------|
| contractAddress | string | Token contract address |
| symbol | string | Token symbol |
| netBought | string | Total tokens bought across entity |
| netSold | string | Total tokens sold across entity |
| netChange | string | Net position change |
| walletsBuying | integer | Number of entity wallets buying |
| walletsSelling | integer | Number of entity wallets selling |
| avgBuyPrice | string | Volume-weighted average buy price |
| avgSellPrice | string | Volume-weighted average sell price |

---

### Mode 3: True Whale Leaderboard

Entity-based ranking of largest holders for any BSC token. Shows the real concentration of ownership that wallet-level analysis misses.

**Request:**

```
POST /invisible-whale-network/true-whale-leaderboard
```

**Request Body:**

```json
{
  "contractAddress": "0x...",
  "chainId": "56",
  "limit": 25,
  "page": 1,
  "minEntitySize": 2
}
```

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| contractAddress | string | Yes | Token contract address |
| chainId | string | Yes | Chain ID: `56` for BSC |
| limit | integer | No | Results per page (default 25, max 100) |
| page | integer | No | Page number starting from 1 |
| minEntitySize | integer | No | Minimum wallets per entity to include (default: 2) |

**Response Fields:**

| Field | Type | Description |
|-------|------|-------------|
| contractAddress | string | Token contract address |
| symbol | string | Token symbol |
| totalSupply | string | Token total supply |
| entityLeaderboard | array | Entity-ranked holder list |
| concentrationMetrics | object | Ownership concentration statistics |

**Entity Leaderboard Entry:**

| Field | Type | Description |
|-------|------|-------------|
| entityRank | integer | Entity-based rank |
| entityId | string | Entity identifier |
| walletCount | integer | Number of wallets in entity |
| totalHolding | string | Combined token holding across all wallets |
| holdingPercent | string | Percentage of total supply held |
| totalValueUsd | string | Combined holding value in USD |
| largestWallet | object | Most visible wallet details |
| largestWalletRank | integer | Traditional wallet-based rank of largest wallet |
| recentActivity | string | `accumulating`, `distributing`, `holding`, `mixed` |
| firstAccumulation | long | Earliest purchase timestamp across entity (ms) |

**Largest Wallet Object:**

| Field | Type | Description |
|-------|------|-------------|
| address | string | Wallet address |
| holding | string | Individual wallet holding |
| walletRank | integer | Traditional single-wallet rank |

**Concentration Metrics:**

| Field | Type | Description |
|-------|------|-------------|
| top10EntitiesPercent | string | Top 10 entities combined holding (%) |
| top10WalletsPercent | string | Top 10 wallets combined holding (%) for comparison |
| giniCoefficient | string | Ownership inequality measure (0-1) |
| hiddenConcentration | string | Difference between entity and wallet concentration (%) |
| entityCount | integer | Total distinct entities identified |

---

### Mode 4: Coordination Alert

Detects when multiple independent entities begin executing the same strategy simultaneously. Coordinated moves across unrelated whale entities signal informed trading or market manipulation.

**Request:**

```
POST /invisible-whale-network/coordination-alert
```

**Request Body:**

```json
{
  "chainId": "56",
  "contractAddress": "0x...",
  "timeWindow": "4h",
  "minEntities": 3,
  "alertType": "all"
}
```

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| chainId | string | Yes | Chain ID: `56` for BSC |
| contractAddress | string | No | Filter to specific token (omit for chain-wide scan) |
| timeWindow | string | No | Coordination detection window: `1h`, `4h`, `12h`, `24h` (default: `4h`) |
| minEntities | integer | No | Minimum independent entities for coordination signal (default: 3) |
| alertType | string | No | Filter: `all`, `accumulation`, `distribution`, `new_token` (default: `all`) |

**Response Fields:**

| Field | Type | Description |
|-------|------|-------------|
| alerts | array | Active coordination alerts |
| scanTimestamp | long | Scan execution timestamp (ms) |
| tokensScanned | integer | Number of tokens analyzed |
| alertCount | integer | Total active alerts |

**Alert Object:**

| Field | Type | Description |
|-------|------|-------------|
| alertId | string | Unique alert identifier |
| contractAddress | string | Token contract address |
| symbol | string | Token symbol |
| alertType | string | `coordinated_accumulation`, `coordinated_distribution`, `coordinated_new_entry` |
| severity | string | `low`, `medium`, `high`, `critical` |
| entityCount | integer | Number of independent entities involved |
| combinedVolumeUsd | string | Total coordinated volume in USD |
| timeWindowStart | long | Coordination window start timestamp (ms) |
| timeWindowEnd | long | Coordination window end timestamp (ms) |
| entities | array | Participating entity summaries |
| priceImpact | string | Price change during coordination window (%) |
| historicalOutcome | object | What happened after similar past coordinations |

**Entity Summary in Alert:**

| Field | Type | Description |
|-------|------|-------------|
| entityId | string | Entity identifier |
| walletCount | integer | Wallets in this entity |
| action | string | `buy`, `sell`, `transfer_in` |
| volumeUsd | string | Entity's volume in this coordination |
| avgPrice | string | Entity's average execution price |

**Historical Outcome:**

| Field | Type | Description |
|-------|------|-------------|
| sampleSize | integer | Number of similar past events |
| avgPriceChange24h | string | Average price change 24h after (%) |
| avgPriceChange7d | string | Average price change 7d after (%) |
| bullishOutcomePercent | string | Percentage that resulted in price increase |

---

## Data Sources

| Source | Endpoint / Method | Data Provided |
|--------|-------------------|---------------|
| BSC RPC | `eth_getBlockByNumber`, `eth_getTransactionReceipt` | Transaction details, timestamps, gas prices, internal transactions |
| BSC RPC | `eth_getLogs` with Transfer topic | Token transfer events for fund flow analysis |
| BscScan API | `/api?module=account&action=txlist` | Full transaction history for wallet analysis |
| BscScan API | `/api?module=account&action=tokentx` | Token transfer history across wallets |
| BscScan API | `/api?module=account&action=txlistinternal` | Internal transactions (contract-to-contract fund flows) |
| BscScan API | `/api?module=token&action=tokenholderlist` | Token holder lists for overlap analysis |
| PancakeSwap Subgraph | GraphQL pair and swap queries | DEX trading activity per wallet |

## Parameters

### Global Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| chainId | string | Blockchain network: `56` (BSC) |
| address | string | BSC wallet address (0x-prefixed, 42 characters) |
| contractAddress | string | Token contract address |
| entityId | string | Entity cluster identifier from discovery results |
| timeRange | string | Analysis window: `7d`, `14d`, `30d`, `90d`, `180d`, `365d` |
| limit | integer | Results per page |
| page | integer | Pagination page number |

## Output Format

All responses follow this structure:

```json
{
  "code": "000000",
  "message": null,
  "data": {
    "mode": "cluster-discovery",
    "chainId": "56",
    "timestamp": 1710000000000,
    "results": {}
  },
  "success": true
}
```

## Examples

### Example 1: Discover Entity Cluster from Single Wallet

**Request:**
```bash
curl -X POST '/invisible-whale-network/cluster-discovery' \
-H 'Content-Type: application/json' \
-H 'User-Agent: binance-web3/1.0 (Skill)' \
-d '{
  "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18",
  "chainId": "56",
  "maxDepth": 3,
  "minConfidence": 0.75
}'
```

**Response:**
```json
{
  "code": "000000",
  "data": {
    "entityId": "entity_8f3a2b1c",
    "seedAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18",
    "clusterSize": 23,
    "totalValueUsd": "4250000",
    "confidenceScore": 0.87,
    "wallets": [
      {
        "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18",
        "balanceUsd": "890000",
        "firstSeen": 1700000000000,
        "lastActive": 1710340000000,
        "transactionCount": 1247,
        "connectionType": "primary",
        "connectionConfidence": 1.0,
        "role": "primary"
      },
      {
        "address": "0xabc123...456",
        "balanceUsd": "340000",
        "firstSeen": 1702000000000,
        "lastActive": 1710338000000,
        "transactionCount": 456,
        "connectionType": "timing",
        "connectionConfidence": 0.92,
        "role": "accumulator"
      },
      {
        "address": "0xdef789...012",
        "balanceUsd": "210000",
        "firstSeen": 1705000000000,
        "lastActive": 1710335000000,
        "transactionCount": 234,
        "connectionType": "gas_pattern",
        "connectionConfidence": 0.88,
        "role": "accumulator"
      }
    ],
    "clusteringSignals": [
      {
        "type": "timing_correlation",
        "strength": 0.91,
        "details": "17 wallets transact within 30-second windows of seed wallet"
      },
      {
        "type": "gas_fingerprint",
        "strength": 0.85,
        "details": "12 wallets use identical gas limit 247891 (non-standard)"
      },
      {
        "type": "fund_flow_direct",
        "strength": 0.94,
        "details": "Seed wallet funded 8 wallets directly with BNB"
      }
    ]
  },
  "success": true
}
```

### Example 2: Reveal True Strategy

**Request:**
```bash
curl -X POST '/invisible-whale-network/entity-strategy' \
-H 'Content-Type: application/json' \
-H 'User-Agent: binance-web3/1.0 (Skill)' \
-d '{
  "entityId": "entity_8f3a2b1c",
  "chainId": "56",
  "tokenFilter": "0xcake_address...",
  "timeRange": "14d"
}'
```

**Response:**
```json
{
  "code": "000000",
  "data": {
    "entityId": "entity_8f3a2b1c",
    "strategyClassification": "accumulation",
    "strategyConfidence": 0.89,
    "netPositionChange": "+2450000",
    "visibleVsTrue": {
      "largestWalletAction": "selling",
      "largestWalletChange": "-180000",
      "entityNetAction": "accumulating",
      "entityNetChange": "+2450000",
      "mismatch": true,
      "mismatchSeverity": "opposite"
    },
    "tokenBreakdown": [
      {
        "contractAddress": "0xcake_address...",
        "symbol": "CAKE",
        "netBought": "2800000",
        "netSold": "350000",
        "netChange": "+2450000",
        "walletsBuying": 19,
        "walletsSelling": 4,
        "avgBuyPrice": "2.34",
        "avgSellPrice": "2.51"
      }
    ]
  },
  "success": true
}
```

### Example 3: True Whale Leaderboard for a Token

**Request:**
```bash
curl -X POST '/invisible-whale-network/true-whale-leaderboard' \
-H 'Content-Type: application/json' \
-H 'User-Agent: binance-web3/1.0 (Skill)' \
-d '{
  "contractAddress": "0xcake_address...",
  "chainId": "56",
  "limit": 5
}'
```

**Response:**
```json
{
  "code": "000000",
  "data": {
    "contractAddress": "0xcake_address...",
    "symbol": "CAKE",
    "entityLeaderboard": [
      {
        "entityRank": 1,
        "entityId": "entity_8f3a2b1c",
        "walletCount": 23,
        "totalHolding": "12500000",
        "holdingPercent": "3.42",
        "totalValueUsd": "29250000",
        "largestWallet": {
          "address": "0x742d35Cc...",
          "holding": "890000",
          "walletRank": 847
        },
        "recentActivity": "accumulating",
        "firstAccumulation": 1700000000000
      }
    ],
    "concentrationMetrics": {
      "top10EntitiesPercent": "28.4",
      "top10WalletsPercent": "15.2",
      "giniCoefficient": "0.73",
      "hiddenConcentration": "13.2",
      "entityCount": 4521
    }
  },
  "success": true
}
```

### Example 4: Detect Coordinated Whale Moves

**Request:**
```bash
curl -X POST '/invisible-whale-network/coordination-alert' \
-H 'Content-Type: application/json' \
-H 'User-Agent: binance-web3/1.0 (Skill)' \
-d '{
  "chainId": "56",
  "contractAddress": "0xcake_address...",
  "timeWindow": "4h",
  "minEntities": 3
}'
```

**Response:**
```json
{
  "code": "000000",
  "data": {
    "alerts": [
      {
        "alertId": "alert_9c2d1e",
        "contractAddress": "0xcake_address...",
        "symbol": "CAKE",
        "alertType": "coordinated_accumulation",
        "severity": "high",
        "entityCount": 5,
        "combinedVolumeUsd": "8900000",
        "timeWindowStart": 1710320000000,
        "timeWindowEnd": 1710334400000,
        "entities": [
          {"entityId": "entity_8f3a2b1c", "walletCount": 23, "action": "buy", "volumeUsd": "2100000", "avgPrice": "2.31"},
          {"entityId": "entity_4a7b9d2e", "walletCount": 15, "action": "buy", "volumeUsd": "1850000", "avgPrice": "2.33"},
          {"entityId": "entity_6c1f8e3a", "walletCount": 8, "action": "buy", "volumeUsd": "1700000", "avgPrice": "2.32"}
        ],
        "priceImpact": "+4.7",
        "historicalOutcome": {
          "sampleSize": 34,
          "avgPriceChange24h": "+8.2",
          "avgPriceChange7d": "+15.6",
          "bullishOutcomePercent": "76.5"
        }
      }
    ],
    "scanTimestamp": 1710345600000,
    "tokensScanned": 1,
    "alertCount": 1
  },
  "success": true
}
```

## Architecture

### Graph Construction Layer

1. **Transaction Collector** -- Ingests all BSC transactions for target addresses via RPC batch calls. Processes blocks in parallel with 100-block batch windows.
2. **Fund Flow Graph** -- Constructs weighted directed graph where nodes are addresses and edges are fund transfers. Edge weights encode transfer frequency, volume, and recency.
3. **Timing Matrix** -- Builds NxN correlation matrix of transaction timestamps across candidate wallets. High correlation (>0.85) between wallets that are not directly transacting indicates shared operator.

### Clustering Engine

1. **Signal Extraction** -- For each wallet pair, extracts timing correlation, gas fingerprint similarity, fund flow connectivity, and token overlap scores.
2. **Weighted Scoring** -- Combines signals using calibrated weights (timing: 0.30, gas: 0.25, fund_flow: 0.25, indirect_flow: 0.15, token_overlap: 0.05).
3. **Community Detection** -- Applies Louvain algorithm on the weighted graph to identify wallet communities (entities). Modularity threshold set at 0.4.
4. **Confidence Assignment** -- Each cluster receives a confidence score based on signal diversity (multi-signal connections score higher than single-signal).

### Strategy Analysis Layer

1. **Position Aggregator** -- Sums token balances and trade history across all entity wallets to compute net position changes.
2. **Strategy Classifier** -- Classifies entity behavior using rules: net buying with distributed wallets = accumulation, net selling from concentrated wallets = distribution, opposing positions = hedging, circular flows = wash trading.
3. **Mismatch Detector** -- Compares largest-wallet behavior against entity-level behavior to identify deceptive distribution patterns.

### Coordination Detection

1. **Cross-Entity Monitor** -- Tracks independent entities and flags when 3+ unrelated entities execute same-direction trades within the configured time window.
2. **Historical Comparator** -- Matches coordination patterns against historical database to provide outcome statistics.

## Risk Disclaimers

1. **Not financial advice.** Entity clustering and coordination detection are analytical tools. They do not predict future price movements or guarantee the accuracy of entity identification.
2. **Clustering is probabilistic.** Wallet clustering uses statistical correlation, not deterministic proof. Two wallets flagged as belonging to the same entity may in fact be independent actors with coincidentally similar behavior.
3. **False positives.** Automated trading bots, copy-trading services, and institutional custodians may trigger false entity clustering due to synchronized transaction patterns.
4. **Privacy considerations.** This tool analyzes publicly available on-chain data only. It does not access any private or off-chain information.
5. **Coordination does not imply manipulation.** Multiple entities buying the same token simultaneously may reflect shared public information rather than coordinated action.
6. **Data completeness.** Entity clusters are based on observable on-chain activity. Wallets with minimal transaction history or wallets using privacy-enhancing techniques may not be correctly clustered.

## User Agent Header

Include `User-Agent` header with the following string: `binance-web3/1.0 (Skill)`

## Notes

1. All timestamps are in milliseconds (Unix epoch)
2. All USD values are strings to preserve decimal precision
3. Entity IDs are stable across queries but may merge as new evidence is discovered
4. Cluster discovery is computationally intensive; responses may take 5-15 seconds for high-depth queries
5. The skill processes BSC addresses only; multi-chain entity linking is not supported in this version
6. Gas fingerprinting is most effective on wallets with 50+ transactions
7. Rate limit: 30 requests per minute per API key (lower than other skills due to computational cost)
