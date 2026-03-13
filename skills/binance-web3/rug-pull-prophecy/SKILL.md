---
title: Rug Pull Prophecy
description: Behavioral rug pull prediction engine that analyzes developer wallet behavior patterns, liquidity decay trends, and social-vs-onchain divergence to predict rug pulls 24-72 hours before they happen.
metadata:
  version: 1.0.0
  author: mefai-dev
license: MIT
---

# Rug Pull Prophecy

Behavioral rug pull prediction engine for BSC tokens. This skill goes beyond static contract audits by continuously monitoring developer wallet behavior patterns, liquidity pool decay trends, and the divergence between social media hype and on-chain reality. It assigns dynamic risk scores and predicts rug pulls 24-72 hours before execution.

## Overview

Most rug pull detection tools perform one-time contract audits: checking for mint functions, ownership renouncement, and LP locks. These are trivially bypassed by sophisticated actors who use time-delayed mechanisms, multi-wallet strategies, and social engineering.

Rug Pull Prophecy takes a fundamentally different approach. Instead of auditing code, it audits behavior. Developer wallets follow predictable patterns before a rug: LP removal testing, mixer interactions, fund distribution to fresh wallets, and coordinated social media campaigns to attract final victims. This skill tracks these behavioral signals across four operational modes and assigns a composite risk score updated every 60 seconds.

## Operational Modes

### Mode 1: Risk Countdown

Ranks BSC tokens by rug probability score based on multi-factor behavioral analysis.

**Scoring Formula:**

| Factor | Weight | Description |
|--------|--------|-------------|
| Dev Wallet Behavior | 40% | Wallet age, mixer interactions, fund distribution patterns, historical rug association |
| LP Decay Trend | 30% | Rate of liquidity erosion, projected days to critical threshold, lock bypass patterns |
| Social Divergence | 20% | Gap between social media growth metrics and on-chain holder/volume decline |
| Contract Risk Flags | 10% | Upgradeable proxy, hidden mint, transfer restrictions, fee manipulation |

**Risk Levels:**

| Score Range | Level | Description |
|-------------|-------|-------------|
| 0-20 | Safe | Normal behavioral patterns, stable liquidity, organic growth |
| 21-40 | Watch | Minor anomalies detected, monitoring recommended |
| 41-60 | Warning | Multiple risk factors active, elevated caution advised |
| 61-80 | Danger | Strong behavioral signals matching pre-rug patterns |
| 81-100 | Critical | Imminent rug probability, multiple confirmed pre-rug behaviors |

**Request:**

```
POST /rug-pull-prophecy/risk-countdown
```

**Request Body:**

```json
{
  "chainId": "56",
  "sortBy": "riskScore",
  "sortOrder": "desc",
  "minMarketCap": "10000",
  "maxTokenAge": 604800,
  "limit": 50,
  "page": 1
}
```

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| chainId | string | Yes | Chain ID: `56` for BSC |
| sortBy | string | No | Sort field: `riskScore`, `marketCap`, `lpDecayRate`, `tokenAge` |
| sortOrder | string | No | `asc` or `desc` (default: `desc`) |
| minMarketCap | string | No | Minimum market cap in USD |
| maxTokenAge | long | No | Maximum token age in seconds |
| limit | integer | No | Results per page (default 50, max 200) |
| page | integer | No | Page number starting from 1 |

**Response Fields:**

| Field | Type | Description |
|-------|------|-------------|
| contractAddress | string | BSC token contract address |
| symbol | string | Token symbol |
| name | string | Token name |
| riskScore | integer | Composite risk score (0-100) |
| riskLevel | string | `safe`, `watch`, `warning`, `danger`, `critical` |
| devWalletScore | float | Dev wallet behavior subscore (0-100) |
| lpDecayScore | float | LP decay trend subscore (0-100) |
| socialDivergenceScore | float | Social vs on-chain divergence subscore (0-100) |
| contractRiskScore | float | Contract risk flags subscore (0-100) |
| marketCap | string | Current market cap in USD |
| liquidityUsd | string | Current LP value in USD |
| projectedDaysToCritical | integer | Estimated days until LP reaches critical level |
| lastUpdated | long | Last score update timestamp (ms) |

---

### Mode 2: Dev Wallet Timeline

Chronological behavioral map of developer wallet actions compared against known pre-rug patterns.

**Request:**

```
POST /rug-pull-prophecy/dev-wallet-timeline
```

**Request Body:**

```json
{
  "contractAddress": "0x...",
  "chainId": "56",
  "timeRange": "30d",
  "includeConnectedWallets": true
}
```

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| contractAddress | string | Yes | Token contract address |
| chainId | string | Yes | Chain ID: `56` for BSC |
| timeRange | string | No | Analysis window: `7d`, `14d`, `30d`, `90d` (default: `30d`) |
| includeConnectedWallets | boolean | No | Include wallets funded by dev wallet (default: `true`) |

**Response Fields:**

| Field | Type | Description |
|-------|------|-------------|
| devAddress | string | Primary developer wallet address |
| connectedWallets | array | List of wallets funded directly or indirectly by dev |
| timeline | array | Chronological event list |
| patternMatches | array | Matched pre-rug behavioral patterns |
| behaviorSummary | object | Aggregated behavior classification |

**Timeline Event Types:**

| Event Type | Description |
|------------|-------------|
| `lp_add` | Liquidity added to DEX pool |
| `lp_remove` | Liquidity removed from DEX pool |
| `lp_remove_test` | Small LP removal (testing withdrawal mechanism) |
| `mixer_interaction` | Transaction to/from known mixer contracts (Tornado Cash forks) |
| `new_wallet_transfer` | Funds sent to freshly created wallet (age < 24h) |
| `token_mint` | Additional token supply minted |
| `ownership_transfer` | Contract ownership transferred to new address |
| `proxy_upgrade` | Proxy contract implementation changed |
| `large_sell` | Dev wallet sold significant token holdings |
| `multisig_change` | Multisig signers or threshold modified |

**Pattern Matches:**

| Pattern | Description | Historical Rug Correlation |
|---------|-------------|---------------------------|
| `lp_test_withdraw` | Small LP removal followed by re-add within 1 hour | 73% |
| `fund_distribution` | Dev funds split across 5+ new wallets within 48 hours | 81% |
| `mixer_staging` | Funds moved to mixer-adjacent addresses | 89% |
| `mint_and_dump` | Token minting followed by sells within same block range | 92% |
| `social_pump_prep` | Burst of social activity while dev distributes funds | 77% |

---

### Mode 3: Liquidity Decay Tracker

Monitors LP erosion rate even when liquidity is nominally "locked". Locked LP can still lose value through impermanent loss, paired-asset manipulation, and partial unlock mechanisms.

**Request:**

```
POST /rug-pull-prophecy/liquidity-decay
```

**Request Body:**

```json
{
  "contractAddress": "0x...",
  "chainId": "56",
  "timeRange": "30d",
  "projectionDays": 90
}
```

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| contractAddress | string | Yes | Token contract address |
| chainId | string | Yes | Chain ID: `56` for BSC |
| timeRange | string | No | Historical analysis window (default: `30d`) |
| projectionDays | integer | No | Forward projection in days (default: 90, max: 365) |

**Response Fields:**

| Field | Type | Description |
|-------|------|-------------|
| contractAddress | string | Token contract address |
| currentLiquidityUsd | string | Current total LP value in USD |
| lpLockStatus | string | `locked`, `partially_locked`, `unlocked` |
| lockExpiry | long | Lock expiration timestamp (ms), null if unlocked |
| lockPlatform | string | Lock provider (e.g., PinkLock, Mudra, Team.Finance) |
| dailyDecayRate | string | Average daily LP value change (%) |
| weeklyDecayRate | string | Average weekly LP value change (%) |
| projectedCriticalDate | long | Timestamp when LP projected to reach critical level (ms) |
| criticalThresholdUsd | string | LP level below which token becomes illiquid |
| decayHistory | array | Daily LP value snapshots |
| decayCause | string | Primary cause: `impermanent_loss`, `partial_unlock`, `paired_asset_decline`, `active_removal` |

**Decay History Entry:**

| Field | Type | Description |
|-------|------|-------------|
| timestamp | long | Snapshot timestamp (ms) |
| liquidityUsd | string | Total LP value in USD |
| changePercent | string | Change from previous snapshot (%) |
| lpTokensBurned | string | LP tokens burned/removed in period |
| event | string | Notable event if any (`removal`, `addition`, `unlock`) |

---

### Mode 4: Hype vs Reality

Detects divergence between social media hype and on-chain fundamentals. High divergence is a classic pre-rug signal: projects pump social metrics to attract buyers while insiders quietly exit.

**Request:**

```
POST /rug-pull-prophecy/hype-vs-reality
```

**Request Body:**

```json
{
  "contractAddress": "0x...",
  "chainId": "56",
  "timeRange": "14d"
}
```

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| contractAddress | string | Yes | Token contract address |
| chainId | string | Yes | Chain ID: `56` for BSC |
| timeRange | string | No | Analysis window: `7d`, `14d`, `30d` (default: `14d`) |

**Response Fields:**

| Field | Type | Description |
|-------|------|-------------|
| divergenceScore | integer | Hype-reality gap score (0-100, higher = more divergent) |
| divergenceLevel | string | `aligned`, `minor_gap`, `significant_gap`, `extreme_divergence` |
| socialMetrics | object | Social media growth indicators |
| onchainMetrics | object | On-chain fundamental indicators |
| insiderActivity | object | Insider selling and LP removal activity |
| historicalComparison | array | Similar past divergence patterns and outcomes |

**Social Metrics:**

| Field | Type | Description |
|-------|------|-------------|
| telegramMemberGrowth | string | Telegram member change (%) over period |
| telegramMessageRate | string | Average messages per hour |
| twitterMentionGrowth | string | Twitter mention change (%) over period |
| twitterFollowerGrowth | string | Twitter follower change (%) over period |
| socialSentiment | string | `very_positive`, `positive`, `neutral`, `negative` |

**On-Chain Metrics:**

| Field | Type | Description |
|-------|------|-------------|
| uniqueHolderChange | string | Holder count change (%) over period |
| volumeChange | string | Trading volume change (%) over period |
| avgTransactionSize | string | Average transaction size in USD |
| newWalletBuyerPercent | string | Percentage of buyers from wallets < 24h old |
| insiderSellingVolume | string | Volume sold by top 50 holders in USD |

---

## Data Sources

| Source | Endpoint / Method | Data Provided |
|--------|-------------------|---------------|
| BSC RPC | `eth_getTransactionByHash`, `eth_getLogs` | Wallet transactions, contract events, internal transfers |
| PancakeSwap Subgraph | GraphQL queries on pair entities | LP reserves, swap events, mint/burn events |
| BscScan API | `/api?module=contract&action=getsourcecode` | Contract verification status, source code |
| BscScan API | `/api?module=token&action=tokenholderlist` | Top token holders, holder distribution |
| BscScan API | `/api?module=account&action=tokentx` | Token transfer history for dev wallets |
| DEX Screener API | `/latest/dex/tokens/{address}` | Real-time price, volume, liquidity data |
| Lock Platform APIs | PinkLock, Mudra, Team.Finance contract reads | LP lock status, unlock schedules |

## Parameters

### Global Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| chainId | string | Blockchain network: `56` (BSC) |
| contractAddress | string | Token contract address (0x-prefixed, 42 characters) |
| timeRange | string | Analysis window: `7d`, `14d`, `30d`, `90d` |
| limit | integer | Results per page (default 50, max 200) |
| page | integer | Pagination page number |

## Output Format

All responses follow this structure:

```json
{
  "code": "000000",
  "message": null,
  "data": {
    "mode": "risk-countdown",
    "chainId": "56",
    "timestamp": 1710000000000,
    "results": [],
    "pagination": {
      "page": 1,
      "pageSize": 50,
      "total": 1234
    }
  },
  "success": true
}
```

## Examples

### Example 1: Get Top Risk Tokens

**Request:**
```bash
curl -X POST '/rug-pull-prophecy/risk-countdown' \
-H 'Content-Type: application/json' \
-H 'User-Agent: binance-web3/1.0 (Skill)' \
-d '{
  "chainId": "56",
  "sortBy": "riskScore",
  "sortOrder": "desc",
  "minMarketCap": "50000",
  "limit": 10
}'
```

**Response:**
```json
{
  "code": "000000",
  "data": {
    "mode": "risk-countdown",
    "results": [
      {
        "contractAddress": "0xabc123...def",
        "symbol": "MOONX",
        "name": "MoonX Token",
        "riskScore": 87,
        "riskLevel": "critical",
        "devWalletScore": 92.5,
        "lpDecayScore": 78.3,
        "socialDivergenceScore": 88.1,
        "contractRiskScore": 45.0,
        "marketCap": "340000",
        "liquidityUsd": "28000",
        "projectedDaysToCritical": 4,
        "lastUpdated": 1710345600000
      }
    ]
  },
  "success": true
}
```

### Example 2: Analyze Dev Wallet Behavior

**Request:**
```bash
curl -X POST '/rug-pull-prophecy/dev-wallet-timeline' \
-H 'Content-Type: application/json' \
-H 'User-Agent: binance-web3/1.0 (Skill)' \
-d '{
  "contractAddress": "0xabc123...def",
  "chainId": "56",
  "timeRange": "14d",
  "includeConnectedWallets": true
}'
```

**Response:**
```json
{
  "code": "000000",
  "data": {
    "devAddress": "0xdev456...789",
    "connectedWallets": [
      {"address": "0xwallet1...", "fundedAmount": "2.5", "fundedTime": 1710200000000},
      {"address": "0xwallet2...", "fundedAmount": "1.8", "fundedTime": 1710250000000}
    ],
    "timeline": [
      {
        "timestamp": 1710100000000,
        "eventType": "lp_add",
        "details": "Added 15 BNB + 1000000 MOONX to PancakeSwap LP",
        "txHash": "0xtx1..."
      },
      {
        "timestamp": 1710200000000,
        "eventType": "new_wallet_transfer",
        "details": "Sent 2.5 BNB to freshly created wallet 0xwallet1...",
        "txHash": "0xtx2..."
      },
      {
        "timestamp": 1710300000000,
        "eventType": "lp_remove_test",
        "details": "Removed 0.1 BNB worth of LP, re-added 45 minutes later",
        "txHash": "0xtx3..."
      }
    ],
    "patternMatches": [
      {
        "pattern": "fund_distribution",
        "confidence": 0.85,
        "description": "Dev funds split across 2 new wallets within 48 hours",
        "historicalRugCorrelation": 0.81
      },
      {
        "pattern": "lp_test_withdraw",
        "confidence": 0.91,
        "description": "Small LP removal followed by re-add within 1 hour",
        "historicalRugCorrelation": 0.73
      }
    ]
  },
  "success": true
}
```

### Example 3: Track Liquidity Decay

**Request:**
```bash
curl -X POST '/rug-pull-prophecy/liquidity-decay' \
-H 'Content-Type: application/json' \
-H 'User-Agent: binance-web3/1.0 (Skill)' \
-d '{
  "contractAddress": "0xabc123...def",
  "chainId": "56",
  "timeRange": "30d",
  "projectionDays": 60
}'
```

**Response:**
```json
{
  "code": "000000",
  "data": {
    "contractAddress": "0xabc123...def",
    "currentLiquidityUsd": "28000",
    "lpLockStatus": "partially_locked",
    "lockExpiry": 1712000000000,
    "lockPlatform": "PinkLock",
    "dailyDecayRate": "-2.3",
    "weeklyDecayRate": "-14.8",
    "projectedCriticalDate": 1711200000000,
    "criticalThresholdUsd": "5000",
    "decayCause": "impermanent_loss",
    "decayHistory": [
      {"timestamp": 1709700000000, "liquidityUsd": "52000", "changePercent": "0", "event": null},
      {"timestamp": 1709786400000, "liquidityUsd": "49800", "changePercent": "-4.2", "event": null},
      {"timestamp": 1709872800000, "liquidityUsd": "43500", "changePercent": "-12.7", "event": "removal"}
    ]
  },
  "success": true
}
```

### Example 4: Check Hype vs Reality Divergence

**Request:**
```bash
curl -X POST '/rug-pull-prophecy/hype-vs-reality' \
-H 'Content-Type: application/json' \
-H 'User-Agent: binance-web3/1.0 (Skill)' \
-d '{
  "contractAddress": "0xabc123...def",
  "chainId": "56",
  "timeRange": "14d"
}'
```

**Response:**
```json
{
  "code": "000000",
  "data": {
    "divergenceScore": 82,
    "divergenceLevel": "extreme_divergence",
    "socialMetrics": {
      "telegramMemberGrowth": "+340",
      "telegramMessageRate": "45.2",
      "twitterMentionGrowth": "+520",
      "twitterFollowerGrowth": "+280",
      "socialSentiment": "very_positive"
    },
    "onchainMetrics": {
      "uniqueHolderChange": "-12.5",
      "volumeChange": "-35.8",
      "avgTransactionSize": "85.40",
      "newWalletBuyerPercent": "68.3",
      "insiderSellingVolume": "145000"
    },
    "insiderActivity": {
      "top50SellingPercent": "23.5",
      "devWalletActivity": "distributing",
      "lpRemovalEvents": 2
    }
  },
  "success": true
}
```

## Architecture

### Data Collection Layer

1. **BSC Node Connection** -- Maintains persistent WebSocket connection to BSC RPC node for real-time block and transaction monitoring
2. **Event Indexer** -- Indexes PancakeSwap LP events (Mint, Burn, Swap), token Transfer events, and contract ownership events
3. **Wallet Graph Builder** -- Constructs directed graph of fund flows from developer wallets to identify connected addresses

### Analysis Engine

1. **Behavioral Pattern Matcher** -- Compares observed wallet behavior sequences against a database of 500+ confirmed rug pull behavioral timelines
2. **LP Decay Modeler** -- Fits exponential decay curves to liquidity data, projects future LP values accounting for impermanent loss and paired-asset volatility
3. **Social Scraper** -- Polls Telegram member counts, Twitter follower counts, and mention volumes at 15-minute intervals
4. **Divergence Calculator** -- Normalizes social and on-chain metrics to comparable scales, computes weighted divergence score

### Scoring Engine

1. **Factor Scoring** -- Each of the four factors (dev behavior, LP decay, social divergence, contract risk) produces an independent 0-100 score
2. **Composite Weighting** -- Factors are combined using the weighted formula: `0.4 * dev + 0.3 * lp + 0.2 * social + 0.1 * contract`
3. **Temporal Adjustment** -- Recent events weighted more heavily than older events using exponential time decay
4. **Confidence Calibration** -- Final score adjusted by data completeness factor (tokens with limited history receive wider confidence intervals)

### Update Cycle

- Risk scores refresh every 60 seconds
- Dev wallet timeline updates on each new BSC block (~3 seconds)
- LP decay snapshots taken every hour
- Social metrics polled every 15 minutes

## Risk Disclaimers

1. **Not financial advice.** Risk scores are statistical indicators based on historical pattern analysis and do not guarantee future outcomes. A high risk score does not confirm a rug pull will occur, and a low risk score does not guarantee safety.
2. **Historical correlation is not causation.** Pattern matches are based on behaviors observed in past rug pulls. Legitimate projects may exhibit similar patterns for valid reasons.
3. **Data latency.** On-chain data has inherent processing delays. Social media metrics may lag behind real-time activity by up to 15 minutes.
4. **False positives.** New or unconventional projects may trigger elevated risk scores due to unusual but legitimate developer behavior.
5. **Scope limitation.** This skill monitors BSC tokens only. Cross-chain rug mechanisms involving bridge exploits or multi-chain liquidity removal may not be fully captured.
6. **Always DYOR.** This tool supplements but does not replace personal due diligence. Verify contract code, team identity, and project fundamentals independently before making investment decisions.

## User Agent Header

Include `User-Agent` header with the following string: `binance-web3/1.0 (Skill)`

## Notes

1. All timestamps are in milliseconds (Unix epoch)
2. All USD values are strings to preserve decimal precision
3. Percentage fields are pre-formatted numbers (append `%` for display)
4. Contract addresses must be valid BSC addresses (0x-prefixed, 42 characters)
5. The skill processes BSC tokens with at least one PancakeSwap liquidity pool
6. Tokens with less than 7 days of on-chain history will have reduced scoring accuracy
7. Rate limit: 60 requests per minute per API key
