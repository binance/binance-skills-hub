---
title: Dexscreener Intelligence
description: |
  Leverage DexScreener's public API to discover new token listings, search DEX pairs across
  multiple chains, analyze on-chain trading activity (buys/sells/volume), and track token
  profiles with social links and branding data. Combines pair-level metrics with profile
  intelligence for comprehensive DEX token analysis.
metadata:
  version: "1.0.0"
  author: mefai-dev
license: MIT
---

# DexScreener Intelligence

Comprehensive DEX token analysis using DexScreener's public API — discover new listings, analyze trading pairs, and track token profiles across all major chains.

## Why This Matters

DexScreener aggregates DEX data from 80+ chains and 200+ DEXes. It's the primary discovery tool for new tokens before they reach CEX listings. This skill provides structured access to that data for automated analysis.

---

## API Endpoints

### 1. Latest Token Profiles

Discover newly created or updated token profiles — the earliest signal that a project is establishing its presence.

```
GET https://api.dexscreener.com/token-profiles/latest/v1
```

**Parameters:** None

**Response:** Array of token profile objects.

| Field | Type | Description |
|-------|------|-------------|
| `url` | string | DexScreener profile URL |
| `chainId` | string | Chain identifier (`solana`, `bsc`, `ethereum`, `base`, `arbitrum`, etc.) |
| `tokenAddress` | string | Contract address |
| `icon` | string | Token icon image URL (CDN) |
| `header` | string | Profile header image URL |
| `description` | string | Project description text |
| `links` | array | Social/website links `[{label, type, url}]` |

**Link Types:** `website`, `twitter`, `telegram`, `discord`, `medium`, `github`

**Example:**

```bash
curl "https://api.dexscreener.com/token-profiles/latest/v1"
```

**Rate Limit:** 60 requests/minute

---

### 2. Token Boosted (Promoted Tokens)

Get tokens that have active paid promotions on DexScreener — indicates marketing spend and project commitment.

```
GET https://api.dexscreener.com/token-boosts/latest/v1
```

**Parameters:** None

**Response:** Array of boosted token objects.

| Field | Type | Description |
|-------|------|-------------|
| `url` | string | DexScreener URL |
| `chainId` | string | Chain identifier |
| `tokenAddress` | string | Contract address |
| `amount` | number | Boost amount (USD spent) |
| `totalAmount` | number | Total lifetime boost amount |
| `icon` | string | Token icon URL |
| `description` | string | Project description |
| `links` | array | Social links |

**Example:**

```bash
curl "https://api.dexscreener.com/token-boosts/latest/v1"
```

**Rate Limit:** 60 requests/minute

---

### 3. Search Pairs

Full-text search across all DEX pairs by token name, symbol, or address.

```
GET https://api.dexscreener.com/latest/dex/search
```

**Parameters:**

| Parameter | Required | Description |
|-----------|----------|-------------|
| `q` | Yes | Search query (name, symbol, or address) |

**Response Fields (per pair):**

| Field | Type | Description |
|-------|------|-------------|
| `chainId` | string | Chain identifier |
| `dexId` | string | DEX identifier (e.g., `pancakeswap`, `uniswap`, `raydium`) |
| `pairAddress` | string | Pair contract address |
| `baseToken` | object | `{address, name, symbol}` |
| `quoteToken` | object | `{address, name, symbol}` |
| `priceNative` | string | Price in quote token |
| `priceUsd` | string | Price in USD |
| `txns` | object | Transaction counts: `{m5, h1, h6, h24}` each with `{buys, sells}` |
| `volume` | object | Volume in USD: `{m5, h1, h6, h24}` |
| `priceChange` | object | Price change %: `{m5, h1, h6, h24}` |
| `liquidity` | object | `{usd, base, quote}` |
| `fdv` | number | Fully diluted valuation |
| `marketCap` | number | Market cap |
| `pairCreatedAt` | number | Pair creation timestamp (ms) |
| `labels` | array | DEX labels (e.g., `["v3"]`, `["v2"]`) |
| `url` | string | DexScreener URL |

**Example:**

```bash
# Search by name
curl "https://api.dexscreener.com/latest/dex/search?q=pepe"

# Search by address
curl "https://api.dexscreener.com/latest/dex/search?q=0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c"
```

**Rate Limit:** 300 requests/minute

---

### 4. Token Pairs by Address

Get all DEX pairs for a specific token — shows which DEXes and pools it trades on.

```
GET https://api.dexscreener.com/tokens/v1/{chainId}/{tokenAddress}
```

**Parameters:**

| Parameter | Required | Description |
|-----------|----------|-------------|
| `chainId` | Yes | Chain: `bsc`, `ethereum`, `solana`, `base`, `arbitrum`, `polygon`, etc. |
| `tokenAddress` | Yes | Token contract address |

**Response:** Array of pair objects (same structure as search results).

**Example:**

```bash
# Get all WBNB pairs on BSC
curl "https://api.dexscreener.com/tokens/v1/bsc/0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c"

# Get all pairs for a Solana token
curl "https://api.dexscreener.com/tokens/v1/solana/So11111111111111111111111111111111111111112"
```

**Rate Limit:** 300 requests/minute

---

### 5. Token Orders & Boosts

Check if a token has active promotions or profile orders on DexScreener.

```
GET https://api.dexscreener.com/orders/v1/{chainId}/{tokenAddress}
```

**Parameters:**

| Parameter | Required | Description |
|-----------|----------|-------------|
| `chainId` | Yes | Chain identifier |
| `tokenAddress` | Yes | Token contract address |

**Response:**

| Field | Type | Description |
|-------|------|-------------|
| `orders` | array | Profile orders `[{chainId, tokenAddress, type, status, paymentTimestamp}]` |
| `boosts` | array | Active boosts with amounts |

**Order Status Values:** `approved`, `on-hold`, `processing`, `cancelled`

**Example:**

```bash
curl "https://api.dexscreener.com/orders/v1/bsc/0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c"
```

**Rate Limit:** 300 requests/minute

---

## Analytical Recipes

### Recipe 1: New Token Discovery Pipeline

Find the freshest tokens before they trend:

```bash
# Step 1: Get latest profiles (newly created tokens)
PROFILES=$(curl -s "https://api.dexscreener.com/token-profiles/latest/v1")

# Step 2: For each interesting token, get its pair data
# (Extract chainId and tokenAddress from profiles)
curl -s "https://api.dexscreener.com/tokens/v1/bsc/TOKEN_ADDRESS"

# Step 3: Filter by criteria
# - Liquidity > $10,000
# - 24h volume > $5,000
# - Pair created within last 24 hours
# - Has social links (website + twitter minimum)
```

**Quality Indicators:**

| Signal | Weight | Description |
|--------|--------|-------------|
| Has website + Twitter | +20 | Basic legitimacy |
| Has Telegram community | +10 | Active community |
| Profile icon uploaded | +5 | Visual branding effort |
| Description provided | +5 | Project documentation |
| Multiple DEX pairs | +15 | Multi-pool liquidity |
| Buy/Sell ratio > 1.5 | +15 | Demand exceeding supply |
| Liquidity > $50K | +15 | Meaningful pool size |
| Volume/Liquidity > 2 | +15 | Active trading relative to pool |

### Recipe 2: Boost-Driven Alpha

Tokens spending money on DexScreener promotion are signaling commitment:

```bash
# Get boosted tokens
BOOSTED=$(curl -s "https://api.dexscreener.com/token-boosts/latest/v1")

# Cross-reference with pair data for volume/price analysis
# High boost amount + rising volume = marketing driving real demand
# High boost amount + flat volume = marketing without traction
```

**Interpretation:**

| Boost Amount | Volume Trend | Signal |
|-------------|-------------|--------|
| > $500 | Rising | Strong — marketing driving real demand |
| > $500 | Flat/Declining | Weak — spending without traction |
| < $100 | Rising | Organic — growth without paid promotion |
| Multiple boosts | Any | Dedicated team with marketing budget |

### Recipe 3: Cross-Chain Pair Analysis

Compare token performance across different chains and DEXes:

```bash
# Search for a token across all chains
curl -s "https://api.dexscreener.com/latest/dex/search?q=PEPE"

# Compare:
# - Which chain has highest liquidity?
# - Which DEX has best volume?
# - Price discrepancies between chains (arbitrage opportunity)
# - Buy/sell ratio differences across chains
```

### Recipe 4: DEX Liquidity Health Check

For any token, evaluate the health of its DEX liquidity:

```bash
# Get all pairs for a token
curl -s "https://api.dexscreener.com/tokens/v1/bsc/TOKEN_ADDRESS"

# Evaluate:
# - Total liquidity across all pools
# - Concentration risk (single pool vs distributed)
# - Volume-to-liquidity ratio (>5 = high activity, <0.5 = stagnant)
# - Transaction count trend (m5 → h1 → h6 → h24)
```

**Liquidity Health Score:**

| Metric | Healthy | Warning | Critical |
|--------|---------|---------|----------|
| Total Liquidity | > $100K | $10K–$100K | < $10K |
| Volume/Liquidity | 0.5–5 | 5–20 | > 20 (wash) or < 0.1 |
| Buy/Sell Ratio (h24) | 0.7–1.5 | 0.5–0.7 or 1.5–3 | < 0.5 or > 3 |
| Pool Count | 2+ | 1 | 0 |

---

## Supported Chains

DexScreener supports 80+ chains. Key chain identifiers:

| Chain ID | Name |
|----------|------|
| `bsc` | BNB Smart Chain |
| `ethereum` | Ethereum |
| `solana` | Solana |
| `base` | Base |
| `arbitrum` | Arbitrum |
| `polygon` | Polygon |
| `avalanche` | Avalanche |
| `optimism` | Optimism |
| `sui` | Sui |
| `ton` | TON |

---

## Important Notes

- All endpoints are **public** — no API key or authentication required
- Response data is **real-time** from on-chain DEX activity
- Rate limits are generous (60-300 req/min) — implement reasonable caching (30-60s)
- Token profile data (icon, description, links) is **user-submitted** — verify independently
- Boost/order data indicates marketing spend, not token quality
- Always cross-reference DexScreener data with security audits (GoPlus, Token Audit) before trading
