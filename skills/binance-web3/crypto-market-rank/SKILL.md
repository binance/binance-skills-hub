---
name: crypto-market-rank
description: |
  Crypto market rankings and leaderboards. Query trending tokens, top searched tokens, Binance Alpha tokens,
  tokenized stocks, social hype sentiment ranks, smart money inflow token rankings,
  top meme token rankings from Pulse launchpad, and top trader PnL leaderboards.
  Use this skill when users ask about token rankings, market trends, social buzz, meme rankings, breakout meme tokens, or top traders.
metadata:
  author: binance-web3-team
  version: "2.1"
---

# Crypto Market Rank Skill

## Overview

| API | Function | Use Case |
|-----|----------|----------|
| Social Hype Leaderboard | Social buzz ranking | Sentiment analysis, social summaries |
| Unified Token Rank | Multi-type token rankings | Trending, Top Search, Alpha, Stock with filters |
| Smart Money Inflow Rank | Token rank by smart money buys | Discover tokens smart money is buying most |
| Meme Rank | Top meme tokens from Pulse launchpad | Find meme tokens most likely to break out |
| Address Pnl Rank | Top trader PnL leaderboard | Top PnL traders / KOL performance ranking |

## Use Cases

1. **Social Hype Analysis**: Discover tokens with highest social buzz and sentiment
2. **Trending Tokens**: View currently trending tokens (rankType=10)
3. **Top Searched**: See most searched tokens (rankType=11)
4. **Alpha Discovery**: Browse Binance Alpha picks (rankType=20)
5. **Stock Tokens**: View tokenized stocks (rankType=40)
6. **Smart Money Inflow**: Discover which tokens smart money is buying most
7. **Meme Rank**: Find top meme tokens from Pulse launchpad most likely to break out
8. **PnL Leaderboard**: View top-performing trader addresses, PnL, win rates
9. **Filtered Research**: Combine filters for targeted token or address screening

## Supported Chains

| Chain | chainId |
|-------|---------|
| BSC | 56 |
| Base | 8453 |
| Solana | CT_501 |

---

## API 1: Social Hype Leaderboard

### Method: GET

**URL**:
```
https://web3.binance.com/bapi/defi/v1/public/wallet-direct/buw/wallet/market/token/pulse/social/hype/rank/leaderboard/ai
```

**Request Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| chainId | string | Yes | Chain ID |
| sentiment | string | No | Filter: `All`, `Positive`, `Negative`, `Neutral` |
| targetLanguage | string | Yes | Translation target, e.g., `en`, `zh` |
| timeRange | number | Yes | Time range, `1` = 24 hours |
| socialLanguage | string | No | Content language, `ALL` for all |

**Headers**: `Accept-Encoding: identity`

**Example**:
```bash
curl 'https://web3.binance.com/bapi/defi/v1/public/wallet-direct/buw/wallet/market/token/pulse/social/hype/rank/leaderboard/ai?chainId=56&sentiment=All&socialLanguage=ALL&targetLanguage=en&timeRange=1' \
-H 'Accept-Encoding: identity' \
-H 'User-Agent: binance-web3/2.1 (Skill)'
```

**Response** (`data.leaderBoardList[]`):

| Field Path | Type | Description |
|------------|------|-------------|
| metaInfo.logo | string | Icon URL path (prefix `https://bin.bnbstatic.com`) |
| metaInfo.symbol | string | Token symbol |
| metaInfo.chainId | string | Chain ID |
| metaInfo.contractAddress | string | Contract address |
| metaInfo.tokenAge | number | Creation timestamp (ms) |
| marketInfo.marketCap | number | Market cap (USD) |
| marketInfo.priceChange | number | Price change (%) |
| socialHypeInfo.socialHype | number | Total social hype index |
| socialHypeInfo.sentiment | string | Positive / Negative / Neutral |
| socialHypeInfo.socialSummaryBrief | string | Brief social summary |
| socialHypeInfo.socialSummaryDetail | string | Detailed social summary |
| socialHypeInfo.socialSummaryBriefTranslated | string | Translated brief summary |
| socialHypeInfo.socialSummaryDetailTranslated | string | Translated detailed summary |

---

## API 2: Unified Token Rank

### Method: POST (recommended) / GET

**URL**:
```
https://web3.binance.com/bapi/defi/v1/public/wallet-direct/buw/wallet/market/token/pulse/unified/rank/list/ai
```

**Headers**: `Content-Type: application/json`, `Accept-Encoding: identity`

### Rank Types

| rankType | Name | Description |
|----------|------|-------------|
| 10 | Trending | Hot trending tokens |
| 11 | Top Search | Most searched tokens |
| 20 | Alpha | Alpha tokens (Binance Alpha picks) |
| 40 | Stock | Tokenized stock tokens |

### Request Body (all fields optional)

**Core Parameters**:

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| rankType | integer | 10 | Rank type: `10`=Trending, `11`=TopSearch, `20`=Alpha, `40`=Stock |
| chainId | string | - | Chain ID: `1`, `56`, `8453`, `CT_501`|
| period | integer | 50 | Time period: `10`=1m, `20`=5m, `30`=1h, `40`=4h, `50`=24h |
| sortBy | integer | 0 | Sort field (see Sort Options) |
| orderAsc | boolean | false | Ascending order if true |
| page | integer | 1 | Page number (min 1) |
| size | integer | 200 | Page size (max 200) |

**Filter Parameters (Min/Max pairs)**:

| Filter | Type | Description |
|--------|------|-------------|
| percentChangeMin/Max | decimal | Price change range (%) |
| marketCapMin/Max | decimal | Market cap range (USD) |
| volumeMin/Max | decimal | Volume range (USD) |
| liquidityMin/Max | decimal | Liquidity range (USD) |
| holdersMin/Max | long | Holder count range |
| holdersTop10PercentMin/Max | decimal | Top10 holder % range |
| kycHoldersMin/Max | long | KYC holder count (Alpha only) |
| countMin/Max | long | Transaction count range |
| uniqueTraderMin/Max | long | Unique trader count range |
| launchTimeMin/Max | long | Token launch time range (timestamp ms) |

**Advanced Filters**:

| Field | Type | Description |
|-------|------|-------------|
| keywords | string[] | Include symbols matching these keywords |
| excludes | string[] | Exclude these symbols |
| socials | integer[] | Social filter: `0`=at_least_one, `1`=X, `2`=Telegram, `3`=Website |
| alphaTagFilter | string[] | Alpha narrative tags |
| auditFilter | integer[] | Audit: `0`=not_renounced, `1`=freezable, `2`=mintable |
| tagFilter | integer[] | Tag filter: `0`=hide_alpha, `23`=dex_paid, `29`=alpha_points, etc. |

### Sort Options

| sortBy | Field |
|--------|-------|
| 0 | Default |
| 1 | Web default |
| 2 | Search count |
| 10 | Launch time |
| 20 | Liquidity |
| 30 | Holders |
| 40 | Market cap |
| 50 | Price change |
| 60 | Transaction count |
| 70 | Volume |
| 80 | KYC holders |
| 90 | Price |
| 100 | Unique traders |

### Example Request

```bash
curl -X POST 'https://web3.binance.com/bapi/defi/v1/public/wallet-direct/buw/wallet/market/token/pulse/unified/rank/list/ai' \
-H 'Content-Type: application/json' \
-H 'Accept-Encoding: identity' \
-H 'User-Agent: binance-web3/2.1 (Skill)' \
-d '{"rankType":10,"chainId":"1","period":50,"sortBy":70,"orderAsc":false,"page":1,"size":20}'
```

### Response

```json
{
  "code": "000000",
  "data": {
    "tokens": [{ "..." }],
    "total": 100,
    "page": 1,
    "size": 20
  },
  "success": true
}
```

**Token Fields** (`data.tokens[]`):

| Field | Type | Description |
|-------|------|-------------|
| chainId | string | Chain ID |
| contractAddress | string | Contract address |
| symbol | string | Token symbol |
| icon | string | Logo URL path (prefix `https://bin.bnbstatic.com`) |
| price | string | Current price (USD) |
| marketCap | string | Market cap |
| liquidity | string | Liquidity |
| holders | string | Holder count |
| launchTime | string | Launch timestamp (ms) |
| decimals | integer | Token decimals |
| links | string | Social links JSON |
| percentChange{1m,5m,1h,4h,24h} | string | Price change by period (%) |
| volume{1m,5m,1h,4h,24h} | string | Volume by period (USD) |
| volume{1m,5m,1h,4h,24h}Buy/Sell | string | Buy/Sell volume by period |
| count{1m,5m,1h,4h,24h} | string | Transaction count by period |
| count{1m,5m,1h,4h,24h}Buy/Sell | string | Buy/Sell tx count by period |
| uniqueTrader{1m,5m,1h,4h,24h} | string | Unique traders by period |
| alphaInfo | object | Alpha info (tagList, description) |
| auditInfo | object | Audit info (riskLevel, riskNum, cautionNum) |
| tokenTag | object | Token tag info |
| kycHolders | string | KYC holder count |
| holdersTop10Percent | string | Top10 holder percentage |

---

## API 3: Smart Money Inflow Rank

### Method: POST

**URL**:
```
https://web3.binance.com/bapi/defi/v1/public/wallet-direct/tracker/wallet/token/inflow/rank/query/ai
```

**Headers**: `Content-Type: application/json`, `Accept-Encoding: identity`

**Request Body**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| chainId | string | Yes | Chain ID: `56` (BSC), `CT_501` (Solana) |
| period | string | No | Stats window: `5m`, `1h`, `4h`, `24h` |
| tagType | integer | Yes | Address tag type (always `2`) |

### Example Request

```bash
curl -X POST 'https://web3.binance.com/bapi/defi/v1/public/wallet-direct/tracker/wallet/token/inflow/rank/query/ai' \
-H 'Content-Type: application/json' \
-H 'Accept-Encoding: identity' \
-H 'User-Agent: binance-web3/2.1 (Skill)' \
-d '{"chainId":"56","period":"24h","tagType":2}'
```

### Response (`data[]`)

| Field | Type | Description |
|-------|------|-------------|
| tokenName | string | Token name |
| tokenIconUrl | string | Icon URL path (prefix `https://bin.bnbstatic.com`) |
| ca | string | Contract address |
| price | string | Current price (USD) |
| marketCap | string | Market cap (USD) |
| volume | string | Trading volume in period (USD) |
| priceChangeRate | string | Price change in period (%) |
| liquidity | string | Liquidity (USD) |
| holders | string | Total holder count |
| kycHolders | string | KYC holder count |
| holdersTop10Percent | string | Top10 holder percentage |
| count | string | Transaction count in period |
| countBuy / countSell | string | Buy / Sell tx count |
| inflow | number | Smart money net inflow amount (USD) |
| traders | integer | Number of smart money addresses trading this token |
| launchTime | number | Token launch timestamp (ms) |
| tokenDecimals | integer | Token decimals |
| tokenRiskLevel | integer | Risk level (-1=unknown, 1=low, 2=medium, 3=high) |
| link | array | Social links: `[{label, link}]` |
| tokenTag | object | Token tags by category |

---

## API 4: Meme Rank

### Method: GET

**URL**:
```
https://web3.binance.com/bapi/defi/v1/public/wallet-direct/buw/wallet/market/token/pulse/exclusive/rank/list/ai
```

**Headers**: `Accept-Encoding: identity`

**Request Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| chainId | string | Yes | Chain ID: `56` (BSC) |

Returns top 100 meme tokens launched via Pulse platform, scored and ranked by an algorithm evaluating breakout potential.

### Example Request

```bash
curl 'https://web3.binance.com/bapi/defi/v1/public/wallet-direct/buw/wallet/market/token/pulse/exclusive/rank/list/ai?chainId=56' \
-H 'Accept-Encoding: identity' \
-H 'User-Agent: binance-web3/2.1 (Skill)'
```

### Response (`data.tokens[]`)

| Field | Type | Description |
|-------|------|-------------|
| chainId | string | Chain ID |
| contractAddress | string | Contract address |
| symbol | string | Token symbol |
| rank | integer | Rank position |
| score | string | Algorithm score (higher = more likely to break out) |
| alphaStatus | integer | Alpha listing status |
| price | string | Current price (USD) |
| percentChange | string | Price change (%) |
| percentChange7d | string | 7-day price change (%) |
| marketCap | string | Market cap (USD) |
| liquidity | string | Liquidity (USD) |
| volume | string | Total volume (USD) |
| volumeBnTotal | string | Binance user total volume |
| volumeBn7d | string | Binance user 7-day volume |
| holders | string | Total holder count |
| kycHolders | string | KYC holder count |
| bnUniqueHolders | string | Binance unique holder count |
| holdersTop10Percent | string | Top10 holder percentage |
| count | integer | Total transaction count |
| countBnTotal | integer | Binance user total tx count |
| countBn7d | integer | Binance user 7-day tx count |
| uniqueTraderBn | integer | Binance unique traders |
| uniqueTraderBn7d | integer | Binance 7-day unique traders |
| impression | integer | Impression/view count |
| createTime | number | Token creation timestamp (ms) |
| migrateTime | number | Migration timestamp (ms) |
| metaInfo.icon | string | Icon URL path (prefix `https://bin.bnbstatic.com`) |
| metaInfo.name | string | Token full name |
| metaInfo.decimals | integer | Token decimals |
| metaInfo.aiNarrativeFlag | integer | AI narrative flag (1=yes) |
| previewLink | object | Social links: `{website[], x[], telegram[]}` |
| tokenTag | object | Token tags by category |

---

## API 5: Address Pnl Rank

### Method: GET

**URL**:
```
https://web3.binance.com/bapi/defi/v1/public/wallet-direct/market/leaderboard/query/ai
```

**Headers**: `Accept-Encoding: identity`

**Request Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| chainId | string | Yes | Chain ID: `56` (BSC), `CT_501` (Solana) |
| period | string | Yes | Time period: `7d`, `30d`, `90d` |
| tag | string | Yes | Address tag filter: `ALL`, `KOL` |
| sortBy | integer | No | Sort field |
| orderBy | integer | No | Order direction |
| pageNo | integer | No | Page number (min 1) |
| pageSize | integer | No | Page size (max 25) |

**Filter Parameters (Min/Max pairs)**:

| Filter | Type | Description |
|--------|------|-------------|
| PNLMin/Max | decimal | Realized PnL range (USD) |
| winRateMin/Max | decimal | Win rate range (percentage, e.g. `1` = 1%) |
| txMin/Max | long | Transaction count range |
| volumeMin/Max | decimal | Volume range (USD) |

### Example Request

```bash
curl 'https://web3.binance.com/bapi/defi/v1/public/wallet-direct/market/leaderboard/query/ai?tag=ALL&pageNo=1&chainId=CT_501&pageSize=25&sortBy=0&orderBy=0&period=30d' \
-H 'Accept-Encoding: identity' \
-H 'User-Agent: binance-web3/2.1 (Skill)'
```

### Response

```json
{
  "code": "000000",
  "data": {
    "data": [{ "..." }],
    "current": 1,
    "size": 25,
    "pages": 35
  },
  "success": true
}
```

**Address Fields** (`data.data[]`):

| Field | Type | Description |
|-------|------|-------------|
| address | string | Wallet address |
| addressLogo | string | Address avatar URL |
| addressLabel | string | Address display name |
| balance | string | On-chain balance (native token, e.g. SOL/BNB) |
| tags | array | Address tags (e.g. KOL) |
| realizedPnl | string | Realized PnL for the period (USD) |
| realizedPnlPercent | string | Realized PnL percentage |
| dailyPNL | array | Daily PnL list: `[{realizedPnl, dt}]` |
| winRate | string | Win rate for the period |
| totalVolume | string | Total trading volume (USD) |
| buyVolume / sellVolume | string | Buy / Sell volume |
| avgBuyVolume | string | Average buy amount |
| totalTxCnt | integer | Total transaction count |
| buyTxCnt / sellTxCnt | integer | Buy / Sell transaction count |
| totalTradedTokens | integer | Number of tokens traded |
| topEarningTokens | array | Top profit tokens: `[{tokenAddress, tokenSymbol, tokenUrl, realizedPnl, profitRate}]` |
| tokenDistribution | object | PnL distribution: `{gt500Cnt, between0And500Cnt, between0AndNegative50Cnt, ltNegative50Cnt}` |
| lastActivity | number | Last active timestamp (ms) |
| genericAddressTagList | array | Detailed tag info (tagName, logoUrl, extraInfo) |

---

## User Agent Header

Include `User-Agent` header with the following string: `binance-web3/2.1 (Skill)`

## Notes

1. Icon/logo URLs require prefix: `https://bin.bnbstatic.com` + path
2. Unified Token Rank supports both GET and POST; POST is recommended
3. All numeric fields in responses are strings — parse when needed
4. Period fields use shorthand: `{1m,5m,1h,4h,24h}` means separate fields like `percentChange1m`, `percentChange5m`, etc.