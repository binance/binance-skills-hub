---
title: Token Graduation Tracker
description: |
  Track tokens through their lifecycle from Pulse launchpad launch to Binance Alpha listing
  and potential CEX promotion. Combines Meme Rush (new launches), Meme Rank (breakout scoring),
  Trending list (mainstream attention), and Alpha status tracking to identify tokens
  progressing through the graduation pipeline.
  Use this skill when users ask about new token launches, Alpha candidates, graduation potential,
  token lifecycle, or which meme tokens might get listed on Binance.
metadata:
  version: "1.0"
  author: mefai-dev
license: MIT
---

# Token Graduation Tracker Skill

## Overview

Tokens on BSC follow a predictable lifecycle from launch to potential CEX listing. This skill tracks each stage:

```
LAUNCH → TRENDING → MEME RANKED → ALPHA LISTED → CEX CANDIDATE
  ↓         ↓           ↓              ↓              ↓
Meme Rush  Unified    Exclusive     alphaStatus=1   High KYC +
  API      Rank API   Rank API     + Alpha Points   Volume metrics
```

| Stage | API | Key Signal |
|-------|-----|------------|
| 1. Launch | Meme Rush | New token appears on Pulse launchpad |
| 2. Attention | Unified Token Rank (Trending) | Token enters trending list |
| 3. Breakout Scoring | Meme Rank (Exclusive) | Algorithm assigns breakout score |
| 4. Alpha Listing | Meme Rank `alphaStatus=1` | Token gets listed on Binance Alpha |
| 5. CEX Candidate | Meme Rank + SM Inflow | High KYC holders + Binance user volume |

## Use Cases

1. **Early Discovery**: Find tokens just launched on Pulse before they trend
2. **Graduation Monitoring**: Track which tokens are progressing toward Alpha listing
3. **Alpha Screening**: Filter tokens that already achieved Alpha status
4. **CEX Listing Prediction**: Score Alpha tokens by CEX listing probability
5. **Lifecycle Analytics**: Understand how long each stage takes for successful tokens

## Supported Chains

| Chain | chainId | Notes |
|-------|---------|-------|
| BSC | 56 | Primary chain for Pulse launchpad + Alpha |

---

## Stage 1: New Token Discovery (Meme Rush)

### Method: POST

**URL**:
```
https://web3.binance.com/bapi/defi/v1/public/wallet-direct/buw/wallet/market/token/pulse/meme/rush/list
```

**Headers**: `Content-Type: application/json`, `Accept-Encoding: identity`

**Request Body**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| chainId | string | Yes | `56` (BSC) |
| rankType | integer | Yes | Sort type: `10`=Hot, `20`=New, `30`=MarketCap |
| limit | integer | No | Results count (default 20) |
| holderCountMin | integer | No | Minimum holder count |
| holderCountMax | integer | No | Maximum holder count |
| liquidityMin | number | No | Minimum liquidity (USD) |
| progressMin | number | No | Minimum bonding curve progress (0-100) |
| progressMax | number | No | Maximum bonding curve progress |

**Example — Newest Launches**:
```bash
curl -X POST 'https://web3.binance.com/bapi/defi/v1/public/wallet-direct/buw/wallet/market/token/pulse/meme/rush/list' \
-H 'Content-Type: application/json' -H 'Accept-Encoding: identity' \
-d '{"chainId":"56","rankType":20,"limit":20}'
```

**Example — Hot with Minimum Liquidity**:
```bash
curl -X POST 'https://web3.binance.com/bapi/defi/v1/public/wallet-direct/buw/wallet/market/token/pulse/meme/rush/list' \
-H 'Content-Type: application/json' -H 'Accept-Encoding: identity' \
-d '{"chainId":"56","rankType":10,"limit":20,"liquidityMin":5000}'
```

**Key Response Fields** (`data.list[]`):

| Field | Type | Description |
|-------|------|-------------|
| contractAddress | string | Token contract address |
| symbol | string | Token symbol |
| marketCap | string | Current market cap (USD) |
| holders | integer | Number of holders |
| progress | number | Bonding curve progress (0-100%) |
| age | number | Token age in minutes |
| liquidity | string | Liquidity (USD) |
| volume | string | Trading volume (USD) |
| priceChange | string | Price change since launch (%) |
| createTime | number | Launch timestamp (ms) |

> **Graduation Signal**: When `progress > 80` and `holders > 100`, the token is approaching bonding curve graduation (migration to regular DEX pool). This is a key milestone.

---

## Stage 2: Trending Detection (Unified Token Rank)

### Method: POST

**URL**:
```
https://web3.binance.com/bapi/defi/v1/public/wallet-direct/buw/wallet/market/token/pulse/unified/rank/list
```

**Headers**: `Content-Type: application/json`, `Accept-Encoding: identity`

**Request**:
```json
{
  "rankType": 10,
  "chainId": "56",
  "page": 1,
  "size": 200
}
```

> Use `rankType: 10` for Trending, `rankType: 20` for Alpha tokens specifically.

**Key Response Fields** (`data.tokens[]`):

| Field | Type | Description |
|-------|------|-------------|
| contractAddress | string | Token contract |
| symbol | string | Token symbol |
| price | string | Current price |
| percentChange24h | string | 24h change (%) |
| volume24h | string | 24h volume (USD) |
| marketCap | string | Market cap (USD) |
| holders | string | Holder count |
| kycHolders | string | KYC-verified holder count |
| alphaInfo | object | Alpha listing info (if applicable) |

> **Graduation Signal**: A Meme Rush token appearing in the Trending list indicates growing mainstream attention — it has progressed from Stage 1 to Stage 2.

---

## Stage 3: Breakout Scoring (Meme Rank)

### Method: GET

**URL**:
```
https://web3.binance.com/bapi/defi/v1/public/wallet-direct/buw/wallet/market/token/pulse/exclusive/rank/list
```

**Parameters**: `chainId=56`

**Headers**: `Accept-Encoding: identity`

**Example**:
```bash
curl 'https://web3.binance.com/bapi/defi/v1/public/wallet-direct/buw/wallet/market/token/pulse/exclusive/rank/list?chainId=56' \
-H 'Accept-Encoding: identity'
```

**Key Response Fields** (`data.tokens[]`):

| Field | Type | Description |
|-------|------|-------------|
| contractAddress | string | Token contract |
| symbol | string | Token symbol |
| rank | integer | Rank position (1 = highest breakout potential) |
| score | string | Algorithm breakout score (0-5, higher = better) |
| alphaStatus | integer | **0** = not Alpha, **1** = Alpha listed |
| price | string | Current price |
| marketCap | string | Market cap |
| liquidity | string | Liquidity (USD) |
| holders | string | Total holders |
| kycHolders | string | KYC-verified holders (Binance users) |
| bnUniqueHolders | string | Unique Binance holders |
| volumeBnTotal | string | Total volume by Binance users (USD) |
| volumeBn7d | string | 7-day volume by Binance users |
| countBnTotal | integer | Total Binance user transactions |
| countBn7d | integer | 7-day Binance user transactions |
| uniqueTraderBn | integer | Total unique Binance traders |
| uniqueTraderBn7d | integer | 7-day unique Binance traders |
| impression | integer | Page view / impression count |
| createTime | number | Token creation timestamp |
| migrateTime | number | DEX migration timestamp |
| metaInfo.aiNarrativeFlag | integer | 1 = AI narrative token |

---

## Stage 4-5: Alpha & CEX Graduation Scoring

### Alpha Detection

Filter Meme Rank tokens where `alphaStatus == 1`:

```
alphaTokens = tokens.filter(t => t.alphaStatus === 1)
```

These tokens have been selected by Binance for the Alpha program — a curated list of tokens with potential for CEX listing.

### CEX Graduation Score

For Alpha tokens, compute a graduation probability score:

```
For each token where alphaStatus == 1:

graduationScore = 0

# Binance User Adoption (40 pts max)
kycRatio = kycHolders / holders
graduationScore += min(kycRatio × 100, 20)        # KYC holder percentage
graduationScore += min(uniqueTraderBn / 1000, 20)  # Unique Binance traders

# Volume & Activity (30 pts max)
bnVolShare = volumeBnTotal / (volume || 1)
graduationScore += min(bnVolShare × 30, 15)        # Binance volume share
graduationScore += min(countBn7d / 5000, 15)       # Recent Binance activity

# Market Quality (20 pts max)
graduationScore += min(float(liquidity) / 100000, 10)  # Liquidity depth
graduationScore += min(float(marketCap) / 1000000, 10)  # Market cap size

# Momentum (10 pts max)
graduationScore += min(impression / 50000, 5)       # Community attention
graduationScore += min(float(score) * 2, 5)         # Breakout score

Tiers:
  80-100: HOT CANDIDATE — high probability of CEX listing
  60-79:  STRONG — building momentum
  40-59:  GROWING — on the radar
  < 40:   EARLY — needs more traction
```

---

## Graduation Pipeline Implementation

### Full Lifecycle Scan

```
Step 1: GET Meme Rush (rankType=10, limit=50)
        → Map all new/hot launchpad tokens by contractAddress

Step 2: GET Trending (rankType=10, size=200)
        → Cross-reference: tokens in BOTH Rush AND Trending = Stage 2

Step 3: GET Meme Rank
        → Cross-reference: tokens in Rush/Trending AND Meme Rank = Stage 3
        → Filter alphaStatus=1 = Stage 4
        → Compute graduation score for Stage 4 tokens = Stage 5 candidates

Step 4: Classify each token:
        In Rush only           → STAGE 1: Just Launched
        In Rush + Trending     → STAGE 2: Gaining Attention
        In Meme Rank           → STAGE 3: Breakout Candidate
        alphaStatus=1          → STAGE 4: Alpha Listed
        alphaStatus=1 + score>70 → STAGE 5: CEX Candidate
```

### Time-Series Tracking

```
Run the pipeline every hour and store snapshots.

Track transitions:
  Token X: Stage 1 (day 1) → Stage 2 (day 3) → Stage 3 (day 5) → Stage 4 (day 8)
  Token Y: Stage 1 (day 1) → never progressed → dead

Average graduation time:
  Stage 1→2: typically 2-5 days
  Stage 2→3: typically 1-3 days
  Stage 3→4: varies widely (1 day to never)
```

---

## Smart Money Overlay

Enhance graduation tracking by adding Smart Money Inflow data:

### Method: POST

**URL**:
```
https://web3.binance.com/bapi/defi/v1/public/wallet-direct/tracker/wallet/token/inflow/rank/query
```

**Request**: `{"chainId":"56","period":"24h","tagType":2}`

Cross-reference tokens in the graduation pipeline with SM inflow:

```
For each Stage 3-4 token:
  if token appears in SM Inflow list with positive inflow:
    → SMART MONEY BACKING detected
    → Increase graduation probability
    → Priority alert: SM + Alpha + high score = strongest signal
```

---

## Notes

1. Meme Rank data refreshes approximately every 15 minutes
2. `alphaStatus` field is the definitive indicator of Binance Alpha listing
3. `kycHolders` and `bnUniqueHolders` are the strongest CEX listing indicators
4. `aiNarrativeFlag=1` indicates tokens in the AI narrative category
5. Bonding curve `progress=100` means the token has migrated to a regular DEX pool
6. Icon URLs require prefix: `https://bin.bnbstatic.com` + path
7. The graduation pipeline works best with BSC tokens (chainId=56)
8. Volume and holder metrics from Binance users are unique to this API and not available elsewhere
