---
title: Cross Signal Analysis
description: |
  Cross-reference multiple Binance Web3 data sources to detect high-confidence trading signals
  through convergence analysis. Combines smart money signals, social hype, trending data, meme rankings,
  and smart money inflow to score tokens by multi-source alpha convergence.
  Use this skill when users ask for the strongest opportunities, alpha detection, signal convergence,
  or want to find tokens where multiple independent indicators agree simultaneously.
metadata:
  version: "1.0"
  author: mefai-dev
license: MIT
---

# Cross-Signal Analysis Skill

## Overview

This skill combines 5 independent Binance Web3 data sources to detect tokens where multiple bullish (or bearish) signals converge simultaneously. Individual signals are noisy — when 3-5 independent sources agree on the same token, that is statistically significant alpha.

| Data Source | Signal Type | Weight |
|-------------|-------------|--------|
| Smart Money Signals | SM buying/selling a token | 25 points |
| Social Hype Rank | Social buzz and sentiment | 0-20 points |
| Trending Tokens | Appears on trending list | 20 points |
| Meme Rank | High breakout score on Pulse | 0-15 points |
| Smart Money Inflow | Net SM capital flowing in | 20 points |

**Maximum convergence score: 100 points**

## Use Cases

1. **Alpha Detection**: Find tokens where 3+ independent signals converge — the strongest buy opportunities
2. **Signal Validation**: Validate a single signal (e.g., SM buy) by checking if other sources confirm it
3. **Risk Filtering**: Avoid tokens with only one signal source (likely noise)
4. **Social-Smart Divergence**: Detect when smart money accumulates while social hype is low (stealth accumulation)
5. **Distribution Detection**: Find tokens with high social hype but smart money selling (distribution / retail trap)
6. **Multi-Timeframe Acceleration**: Track SM inflow pace across 1h/4h/24h to detect accelerating accumulation

## Supported Chains

| Chain | chainId |
|-------|---------|
| BSC | 56 |
| Solana | CT_501 |

---

## Data Source 1: Smart Money Signals

Retrieves active smart money buy/sell signals.

### Method: POST

**URL**:
```
https://web3.binance.com/bapi/defi/v1/public/wallet-direct/buw/wallet/web/signal/smart-money
```

**Request**:
```json
{
  "smartSignalType": "",
  "page": 1,
  "pageSize": 100,
  "chainId": "56"
}
```

**Key Fields for Cross-Signal**:

| Field | Type | Usage |
|-------|------|-------|
| contractAddress | string | Token identifier (join key) |
| ticker | string | Token symbol |
| direction | string | `buy` or `sell` |
| smartMoneyCount | number | Number of SM addresses (higher = stronger) |
| alertPrice | string | Price when signal triggered |
| currentPrice | string | Current price |
| maxGain | string | Maximum gain since signal (%) |
| status | string | `active`, `timeout`, `completed` |

**Scoring**: +25 points if direction = `buy`, -25 if direction = `sell`

---

## Data Source 2: Social Hype Rank

Retrieves social sentiment and buzz scores.

### Method: GET

**URL**:
```
https://web3.binance.com/bapi/defi/v1/public/wallet-direct/buw/wallet/market/token/pulse/social/hype/rank/leaderboard
```

**Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| chainId | string | Yes | Chain ID |
| sentiment | string | No | `All`, `Positive`, `Negative`, `Neutral` |
| targetLanguage | string | Yes | Translation target: `en` |
| timeRange | number | Yes | `1` = 24 hours |
| socialLanguage | string | No | `ALL` for all languages |

**Example**:
```bash
curl 'https://web3.binance.com/bapi/defi/v1/public/wallet-direct/buw/wallet/market/token/pulse/social/hype/rank/leaderboard?chainId=56&sentiment=All&socialLanguage=ALL&targetLanguage=en&timeRange=1' \
-H 'Accept-Encoding: identity'
```

**Key Fields for Cross-Signal**:

| Field | Type | Usage |
|-------|------|-------|
| metaInfo.contractAddress | string | Token identifier (join key) |
| metaInfo.symbol | string | Token symbol |
| socialHypeInfo.socialHype | number | Hype score (0-100+) |
| socialHypeInfo.sentiment | string | Overall sentiment direction |
| marketInfo.priceChange | number | 24h price change (%) |

**Scoring**: `min(socialHype / 5, 20)` points — scales 0-20

---

## Data Source 3: Trending Tokens

Retrieves currently trending tokens.

### Method: POST

**URL**:
```
https://web3.binance.com/bapi/defi/v1/public/wallet-direct/buw/wallet/market/token/pulse/unified/rank/list
```

**Request**:
```json
{
  "rankType": 10,
  "page": 1,
  "size": 200
}
```

> `rankType: 10` = Trending. Other options: `11` (Top Search), `20` (Alpha), `40` (Stock).

**Key Fields for Cross-Signal**:

| Field | Type | Usage |
|-------|------|-------|
| contractAddress | string | Token identifier (join key) |
| symbol | string | Token symbol |
| price | string | Current price |
| percentChange24h | string | 24h price change (%) |
| volume24h | string | 24h volume (USD) |
| marketCap | string | Market cap (USD) |

**Scoring**: +20 points for presence in trending list

---

## Data Source 4: Meme Rank

Retrieves top meme tokens scored by breakout potential.

### Method: GET

**URL**:
```
https://web3.binance.com/bapi/defi/v1/public/wallet-direct/buw/wallet/market/token/pulse/exclusive/rank/list
```

**Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| chainId | string | Yes | Chain ID: `56` (BSC) |

**Example**:
```bash
curl 'https://web3.binance.com/bapi/defi/v1/public/wallet-direct/buw/wallet/market/token/pulse/exclusive/rank/list?chainId=56' \
-H 'Accept-Encoding: identity'
```

**Key Fields for Cross-Signal**:

| Field | Type | Usage |
|-------|------|-------|
| contractAddress | string | Token identifier (join key) |
| symbol | string | Token symbol |
| score | string | Algorithm breakout score (0-5+) |
| rank | integer | Rank position |

**Scoring**: `min(parseFloat(score) * 3, 15)` points — scales 0-15

---

## Data Source 5: Smart Money Inflow

Retrieves tokens ranked by net smart money capital inflow.

### Method: POST

**URL**:
```
https://web3.binance.com/bapi/defi/v1/public/wallet-direct/tracker/wallet/token/inflow/rank/query
```

**Request**:
```json
{
  "chainId": "56",
  "period": "24h",
  "tagType": 2
}
```

**Period Options**: `5m`, `1h`, `4h`, `24h`

**Key Fields for Cross-Signal**:

| Field | Type | Usage |
|-------|------|-------|
| ca | string | Token contract address (join key) |
| tokenName | string | Token name |
| inflow | number | Net SM inflow (USD) |
| traders | integer | Number of SM addresses trading |

**Scoring**: +20 points for presence in inflow list with positive net inflow

---

## Cross-Signal Algorithm

### Step 1: Fetch All Sources (Parallel)

```
Promise.allSettled([
  fetch Smart Money Signals,
  fetch Social Hype Rank,
  fetch Trending Tokens,
  fetch Meme Rank,
  fetch Smart Money Inflow
])
```

### Step 2: Build Address Maps

Index each data source by `contractAddress` (lowercase) for O(1) lookup:

```
smMap:      contractAddress → { direction, smartMoneyCount, alertPrice, currentPrice }
socialMap:  contractAddress → { socialHype, sentiment }
trendMap:   contractAddress → { price, volume, percentChange }
memeMap:    contractAddress → { score, rank }
inflowMap:  contractAddress → { inflow, traders }
```

### Step 3: Score Each Token

For every unique token address across all maps:

```
score = 0
sources = 0

if smMap[addr] AND direction == "buy":
    score += 25, sources++
if socialMap[addr]:
    score += min(socialHype / 5, 20), sources++
if trendMap[addr]:
    score += 20, sources++
if memeMap[addr]:
    score += min(parseFloat(memeScore) * 3, 15), sources++
if inflowMap[addr]:
    score += 20, sources++
```

### Step 4: Filter and Rank

- **Minimum threshold**: `sources >= 2` (at least 2 independent confirmations)
- **Sort by**: `score` descending
- **Tier classification**:

| Score | Tier | Interpretation |
|-------|------|----------------|
| 80-100 | Extreme Alpha | Rare — 4-5 sources converging. Highest conviction |
| 60-79 | Strong Alpha | 3-4 sources. High confidence signal |
| 40-59 | Moderate | 2-3 sources. Worth investigating |
| < 40 | Weak | Single source or low scores. Likely noise |

---

## Advanced Analysis Patterns

### Pattern 1: Social-Smart Divergence

Detects tokens where smart money and social sentiment disagree — often the most profitable signals.

**Logic**:
```
STEALTH ACCUMULATION:
  socialHype < 30 AND smDirection == "buy" AND smCount >= 3
  → Smart money loading before the crowd notices

DISTRIBUTION TRAP:
  socialHype > 50 AND smDirection == "sell" AND smCount >= 2
  → Smart money exiting while retail buys the hype

CONFIRMED BULL:
  socialHype > 50 AND smDirection == "buy"
  → Both agree — momentum play

CONFIRMED BEAR:
  socialHype < 20 AND smDirection == "sell"
  → Both agree — avoid
```

**Data Sources Needed**: Smart Money Signals + Social Hype Rank

### Pattern 2: Smart Money Acceleration

Detects tokens where SM accumulation pace is increasing across timeframes.

**Logic**:
```
Fetch Smart Money Inflow for periods: 1h, 4h, 24h

paceRatio = (inflow_1h * 4) / inflow_4h

if paceRatio > 1.5 → ACCELERATING (SM buying faster in recent hours)
if paceRatio < 0.5 → DECELERATING (SM slowing down)
else → STEADY
```

**Data Sources Needed**: Smart Money Inflow (3 calls with different `period`)

### Pattern 3: Funding-Signal Cross (requires futures-analytics skill)

Combines futures derivatives data with on-chain smart money signals.

**Logic**:
```
Fetch Premium Index (all symbols) from fapi.binance.com
Fetch Smart Money Signals from web3.binance.com

For each futures symbol:
  if fundingRate > 0.03% AND smDirection == "sell":
    → CROWDED LONG + SM SELLING = strong short signal
  if fundingRate < -0.01% AND smDirection == "buy":
    → CROWDED SHORT + SM BUYING = strong long signal
```

**Why it works**: Extreme funding means one side is overleveraged. When smart money takes the opposite side, a squeeze often follows.

---

## Example: Full Cross-Signal Request Sequence

### 1. Fetch Smart Money Signals (BSC)
```bash
curl -X POST 'https://web3.binance.com/bapi/defi/v1/public/wallet-direct/buw/wallet/web/signal/smart-money' \
-H 'Content-Type: application/json' -H 'Accept-Encoding: identity' \
-d '{"smartSignalType":"","page":1,"pageSize":100,"chainId":"56"}'
```

### 2. Fetch Social Hype (BSC)
```bash
curl 'https://web3.binance.com/bapi/defi/v1/public/wallet-direct/buw/wallet/market/token/pulse/social/hype/rank/leaderboard?chainId=56&sentiment=All&socialLanguage=ALL&targetLanguage=en&timeRange=1' \
-H 'Accept-Encoding: identity'
```

### 3. Fetch Trending (BSC)
```bash
curl -X POST 'https://web3.binance.com/bapi/defi/v1/public/wallet-direct/buw/wallet/market/token/pulse/unified/rank/list' \
-H 'Content-Type: application/json' -H 'Accept-Encoding: identity' \
-d '{"rankType":10,"chainId":"56","page":1,"size":200}'
```

### 4. Fetch Meme Rank (BSC)
```bash
curl 'https://web3.binance.com/bapi/defi/v1/public/wallet-direct/buw/wallet/market/token/pulse/exclusive/rank/list?chainId=56' \
-H 'Accept-Encoding: identity'
```

### 5. Fetch Smart Money Inflow (BSC, 24h)
```bash
curl -X POST 'https://web3.binance.com/bapi/defi/v1/public/wallet-direct/tracker/wallet/token/inflow/rank/query' \
-H 'Content-Type: application/json' -H 'Accept-Encoding: identity' \
-d '{"chainId":"56","period":"24h","tagType":2}'
```

### 6. Process Results

Join all responses by `contractAddress` → compute convergence score → filter `sources >= 2` → sort by score descending → return top results with source breakdown.

---

## Notes

1. All 5 data sources are public and require no authentication
2. Icon URLs require prefix: `https://bin.bnbstatic.com` + path
3. Execute all 5 requests in parallel for optimal performance (<2 second total latency)
4. Contract addresses should be lowercased before comparison across sources
5. For multi-chain coverage, run the same pipeline for each `chainId` separately
6. Convergence signals are most reliable during high-volume market hours
7. Cache results for 30-60 seconds to avoid excessive API calls
8. The scoring algorithm is configurable — adjust weights based on backtesting results
