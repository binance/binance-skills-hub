---
title: Whale Wallet Intelligence
description: |
  Discover, profile, and track high-performing on-chain wallets (whales, smart money, KOLs).
  Combines the PnL leaderboard, wallet position tracking, and smart money signal APIs into a
  complete whale intelligence pipeline — from discovery to real-time portfolio monitoring.
  Use this skill when users ask about whale activity, top trader wallets, copy trading,
  smart money portfolios, or want to follow successful on-chain traders.
metadata:
  version: "1.0"
  author: mefai-dev
license: MIT
---

# Whale Wallet Intelligence Skill

## Overview

A 3-stage pipeline that transforms raw on-chain data into actionable whale intelligence:

| Stage | API | Purpose |
|-------|-----|---------|
| 1. Discovery | PnL Leaderboard | Find top-performing wallets by PnL, win rate, volume |
| 2. Profiling | Wallet Positions | View all token holdings of a discovered wallet |
| 3. Signal Tracking | Smart Money Signals | Monitor real-time buy/sell activity of whale wallets |

No single API provides this complete picture. The value is in the **pipeline** — connecting wallet discovery to position tracking to live signal monitoring.

## Use Cases

1. **Whale Discovery**: Find the most profitable wallets on BSC/Solana by realized PnL
2. **Portfolio Cloning**: See exactly what tokens a top trader holds right now
3. **Copy Trading Signals**: Get alerts when smart money wallets make new trades
4. **KOL Verification**: Check if a crypto influencer's wallet actually performs well
5. **Wallet Scoring**: Rate wallets by combining PnL, win rate, consistency, and diversification
6. **Stealth Accumulation Detection**: Find tokens that multiple top wallets are quietly buying

## Supported Chains

| Chain | chainId |
|-------|---------|
| BSC | 56 |
| Base | 8453 |
| Solana | CT_501 |

---

## Stage 1: Whale Discovery (PnL Leaderboard)

### Method: GET

**URL**:
```
https://web3.binance.com/bapi/defi/v1/public/wallet-direct/market/leaderboard/query
```

**Headers**: `Accept-Encoding: identity`

**Request Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| chainId | string | Yes | `56` (BSC), `8453` (Base), `CT_501` (Solana) |
| period | string | No | `7d`, `30d`, `90d` (default: 7d) |
| tag | string | No | `ALL`, `KOL` (filter by wallet type) |
| sortBy | integer | No | Sort field (0=default) |
| orderBy | integer | No | Order direction (0=desc) |
| pageNo | integer | No | Page number (min 1) |
| pageSize | integer | No | Items per page (max 25) |
| PNLMin | decimal | No | Minimum realized PnL (USD) |
| PNLMax | decimal | No | Maximum realized PnL (USD) |
| winRateMin | decimal | No | Minimum win rate (1 = 1%) |
| winRateMax | decimal | No | Maximum win rate |
| txMin | long | No | Minimum transaction count |
| volumeMin | decimal | No | Minimum trading volume (USD) |

**Example — Top BSC Whales (30 day)**:
```bash
curl 'https://web3.binance.com/bapi/defi/v1/public/wallet-direct/market/leaderboard/query?tag=ALL&pageNo=1&chainId=56&pageSize=25&sortBy=0&orderBy=0&period=30d' \
-H 'Accept-Encoding: identity'
```

**Example — High Win Rate KOLs**:
```bash
curl 'https://web3.binance.com/bapi/defi/v1/public/wallet-direct/market/leaderboard/query?tag=KOL&pageNo=1&chainId=56&pageSize=25&period=30d&winRateMin=60' \
-H 'Accept-Encoding: identity'
```

**Response Fields** (`data.data[]`):

| Field | Type | Description |
|-------|------|-------------|
| address | string | Wallet address (use as input for Stage 2 & 3) |
| addressLogo | string | Avatar URL |
| addressLabel | string | Display name (if known) |
| balance | string | Native token balance (BNB/SOL) |
| tags | array | Address tags (e.g., `KOL`) |
| realizedPnl | string | Realized PnL for the period (USD) |
| realizedPnlPercent | string | PnL as percentage |
| winRate | string | Win rate (0-1 scale) |
| totalVolume | string | Total trading volume (USD) |
| buyVolume | string | Buy volume (USD) |
| sellVolume | string | Sell volume (USD) |
| avgBuyVolume | string | Average buy amount per trade |
| totalTxCnt | integer | Total transaction count |
| buyTxCnt | integer | Buy transaction count |
| sellTxCnt | integer | Sell transaction count |
| totalTradedTokens | integer | Number of unique tokens traded |
| lastActivity | number | Last active timestamp (ms) |
| dailyPNL | array | Daily PnL breakdown: `[{realizedPnl, dt}]` |
| topEarningTokens | array | Top 3 profitable tokens with details |
| tokenDistribution | object | PnL distribution buckets |
| genericAddressTagList | array | Detailed tags: `[{tagName, logoUrl}]` |

### Top Earning Tokens Structure

```json
{
  "tokenAddress": "0x...",
  "tokenSymbol": "TOKEN",
  "tokenUrl": "/images/...",
  "realizedPnl": "14378.97",
  "profitRate": "1.514"
}
```

### Token Distribution Structure

```json
{
  "gt500Cnt": 5,
  "between0And500Cnt": 42,
  "between0AndNegative50Cnt": 28,
  "ltNegative50Cnt": 12
}
```

> **Tip**: `gt500Cnt` / total = percentage of 500%+ gain trades. High ratio = consistent big winner finder.

---

## Stage 2: Wallet Portfolio (Position Tracking)

### Method: GET

**URL**:
```
https://web3.binance.com/bapi/defi/v3/public/wallet-direct/buw/wallet/address/pnl/active-position-list
```

**Headers**:
```
clienttype: web
clientversion: 1.2.0
Accept-Encoding: identity
```

**Request Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| address | string | Yes | Wallet address from Stage 1 |
| chainId | string | Yes | Chain ID |
| offset | number | No | Pagination offset (default 0) |

**Example — Get Whale Portfolio**:
```bash
curl 'https://web3.binance.com/bapi/defi/v3/public/wallet-direct/buw/wallet/address/pnl/active-position-list?address=0xbf004bff64725914ee36d03b87d6965b0ced4903&chainId=56&offset=0' \
-H 'clienttype: web' -H 'clientversion: 1.2.0' -H 'Accept-Encoding: identity'
```

**Response Fields** (`data.list[]`):

| Field | Type | Description |
|-------|------|-------------|
| contractAddress | string | Token contract address |
| name | string | Token name |
| symbol | string | Token symbol |
| icon | string | Token icon path (prefix `https://bin.bnbstatic.com`) |
| decimals | number | Token decimals |
| price | string | Current price (USD) |
| percentChange24h | string | 24h price change (%) |
| remainQty | string | Quantity held |

> **Tip**: Sort by `price × remainQty` to find the largest positions. Compare with their `topEarningTokens` from Stage 1 to see if they're still holding their winners.

---

## Stage 3: Live Signal Monitoring

### Method: POST

**URL**:
```
https://web3.binance.com/bapi/defi/v1/public/wallet-direct/buw/wallet/web/signal/smart-money
```

**Headers**: `Content-Type: application/json`, `Accept-Encoding: identity`

**Request Body**:
```json
{
  "smartSignalType": "",
  "page": 1,
  "pageSize": 100,
  "chainId": "56"
}
```

**Key Response Fields** (`data[]`):

| Field | Type | Description |
|-------|------|-------------|
| contractAddress | string | Token being traded |
| ticker | string | Token symbol |
| direction | string | `buy` or `sell` |
| smartMoneyCount | number | Number of SM wallets involved |
| alertPrice | string | Price at signal trigger |
| currentPrice | string | Current price |
| maxGain | string | Maximum gain since signal (%) |
| status | string | `active`, `timeout`, `completed` |
| signalTriggerTime | number | Signal timestamp (ms) |
| totalTokenValue | string | Total trade value (USD) |

> **Cross-reference**: Match `contractAddress` from signals with tokens in whale portfolios (Stage 2) to confirm whether top wallets are actually buying what signals suggest.

---

## Intelligence Pipeline

### Pipeline 1: Whale Portfolio Replication

```
Step 1: GET Leaderboard (period=30d, winRateMin=60, PNLMin=10000)
        → Filter wallets with high PnL + high win rate
        → Extract top 5 wallet addresses

Step 2: For each wallet: GET Active Positions
        → Build portfolio snapshot
        → Calculate position values (price × qty)

Step 3: Cross-reference positions across all 5 wallets
        → Tokens held by 3+ wallets = high conviction plays
        → Tokens held by 1 wallet with large position = unique alpha
```

### Pipeline 2: Smart Money Consensus

```
Step 1: GET Leaderboard → top 20 wallet addresses
Step 2: For each wallet → GET Active Positions
Step 3: Count how many top wallets hold each token

Consensus Score:
  5+ wallets hold same token = VERY HIGH CONVICTION
  3-4 wallets = HIGH CONVICTION
  2 wallets = MODERATE
  1 wallet = INDIVIDUAL BET
```

### Pipeline 3: Wallet Health Scoring

```
For each wallet from leaderboard:

healthScore = 0
healthScore += min(winRate * 100, 30)           # max 30 pts for win rate
healthScore += min(realizedPnl / 1000, 25)      # max 25 pts for PnL
healthScore += min(totalTxCnt / 100, 15)        # max 15 pts for activity
healthScore += min(totalTradedTokens / 10, 15)  # max 15 pts for diversification
healthScore += (gt500Cnt / totalTrades) * 15    # max 15 pts for big winners

Tiers:
  80-100: Elite Whale — track closely
  60-79:  Strong Trader — worth following
  40-59:  Average — selective following
  <40:    Risky — avoid copying
```

### Pipeline 4: Stealth Accumulation Detection

```
Step 1: GET SM Signals (active, direction=buy)
Step 2: For each signal token, GET Social Hype
Step 3: Filter: smartMoneyCount >= 3 AND socialHype < 20

Result = tokens that smart money is buying aggressively
         but social media hasn't noticed yet.
         This is the EARLIEST alpha signal.
```

---

## Example: Complete Whale Discovery Session

### 1. Find Top BSC Whales
```bash
curl 'https://web3.binance.com/bapi/defi/v1/public/wallet-direct/market/leaderboard/query?tag=ALL&pageNo=1&chainId=56&pageSize=10&period=30d&winRateMin=50&PNLMin=50000' \
-H 'Accept-Encoding: identity'
```

### 2. Get Portfolio of Best Performer
```bash
curl 'https://web3.binance.com/bapi/defi/v3/public/wallet-direct/buw/wallet/address/pnl/active-position-list?address=WHALE_ADDRESS_HERE&chainId=56&offset=0' \
-H 'clienttype: web' -H 'clientversion: 1.2.0' -H 'Accept-Encoding: identity'
```

### 3. Check Current Smart Money Activity
```bash
curl -X POST 'https://web3.binance.com/bapi/defi/v1/public/wallet-direct/buw/wallet/web/signal/smart-money' \
-H 'Content-Type: application/json' -H 'Accept-Encoding: identity' \
-d '{"smartSignalType":"","page":1,"pageSize":100,"chainId":"56"}'
```

### 4. Cross-Reference & Generate Intelligence
- Compare whale portfolio tokens with active SM signals
- Tokens in both = confirmed whale accumulation
- New signals not in portfolio = potential new entries
- Portfolio tokens with sell signals = potential exits

---

## Notes

1. Leaderboard data updates approximately every hour
2. Position data is near real-time (1-2 minute delay)
3. SM signals update every 5-15 minutes
4. Use `offset` parameter for wallets with 50+ positions
5. Icon URLs require prefix: `https://bin.bnbstatic.com` + path
6. The `dailyPNL` array provides daily granularity for PnL trend analysis
7. Filter leaderboard by `tag=KOL` to specifically track crypto influencer wallets
8. Wallet addresses from leaderboard can be used across all 3 stages
