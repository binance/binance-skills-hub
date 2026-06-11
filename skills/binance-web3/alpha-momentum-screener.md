---
title: Alpha Token Momentum Screener
description: Discover and monitor tokens listed on the Binance Alpha on-chain marketplace. Computes a heuristic momentum score from publicly available volume, holder growth, and 24h price data. Useful for discovery and monitoring — not a trading signal. No API key required.
metadata:
  version: 1.1.0
  author: Aureneaux
license: MIT
---

> **Disclaimer:** This skill is informational only. All scores are custom heuristics derived from public data. Nothing in this document constitutes investment advice or an official Binance signal. Past data patterns do not predict future performance.

# Alpha Token Momentum Screener

## Overview

This skill gives AI agents access to token data from the Binance Alpha on-chain marketplace — a publicly accessible list of emerging tokens that have been surfaced through Binance's Alpha program. It enables two capabilities:

1. **Token lookup** — given any token symbol, check whether it appears on the Binance Alpha list and retrieve its publicly available market data (volume, holders, price change, market cap).

2. **Trending discovery** — fetch the top N tokens from the Alpha list ranked by a composite heuristic score based on volume, holder activity, and recent price momentum.

This is a **monitoring and discovery tool**. It surfaces tokens that are currently active on the Alpha marketplace for further research — it does not predict prices or recommend trades.

## Use Cases

- **Research agents**: Retrieve publicly available market data (holder count, market cap, FDV, liquidity) for any token on the Alpha list
- **Watchlist agents**: Monitor the Alpha list for new token additions or changes in activity metrics
- **Portfolio agents**: Track holder growth trends and volume changes over time for tokens of interest
- **Discovery agents**: Identify tokens with recent increases in on-chain activity for manual review

## API Endpoints Used

All endpoints are **public — no API key required**.

### Token List
```
GET https://www.binance.com/bapi/defi/v1/public/wallet-direct/buw/wallet/cex/alpha/all/token/list
```
Returns all tokens currently active on the Alpha marketplace with publicly available fields: price, 24h change, volume, market cap, holder count, FDV, liquidity, CEX listing status, hot tag, and alphaId.

### 24hr Ticker (per token)
```
GET https://www.binance.com/bapi/defi/v1/public/alpha-trade/ticker?symbol={alphaId}USDT
```
Returns rolling 24h statistics for a specific Alpha token.

## Scoring Heuristic

> **Important:** The scores below are a custom heuristic developed independently. They are not an official Binance score, rating, or signal of any kind. They reflect patterns observed in publicly available data and should be treated as one input among many in any research process.

### Single Token Score (`getAlphaSignal(asset)`)

| Condition | Points |
|-----------|--------|
| Token found on Binance Alpha list | +8 |
| Token has a Binance spot pair (`listingCex = true`) | +2 |
| `hotTag = true` (elevated holder activity) | +3 |
| Volume in top 10% of Alpha tokens (by 24h USDT volume) | +4 |
| Volume in top 25% of Alpha tokens | +2 |
| Price +0 to +15% over 24h | +3 |
| Price >+15% over 24h (potentially extended) | -3 |
| Price <-20% over 24h (sharp decline) | -5 |
| Token marked offline or offsell by Alpha | -8 |
| Token on Alpha list but no spot pair | +2 |

Score is clamped to the range [-15, +15]. Higher scores indicate more on-chain activity relative to other Alpha tokens at the time of the request — not a prediction of future performance.

### Trending List (`getAlphaTrending(limit)`)

Ranks all active Alpha tokens by a composite heuristic:
- Has a Binance spot pair: +20 pts (ensures token is accessible)
- Hot tag active: +10 pts
- Price momentum 0–20%: up to +10 pts
- Volume (log-scaled relative to list): up to +15 pts

Returns only tokens with a Binance spot pair to ensure the data includes a tradeable USDT ticker.

## Implementation

```javascript
import { getAlphaSignal, getAlphaTrending } from './skills/alpha-signal.js';

// Look up a single token
const result = await getAlphaSignal('ONDO');
// Returns: { score: 13, found: true, listingCex: true, hotTag: true, pct24h: 4.2, narrative: [...] }

// Get top 15 tokens by activity heuristic
const trending = await getAlphaTrending(15);
// Returns: [{ asset: 'ONDO', score: 42.1, volume24h: 1234567, pct24h: 4.2, hotTag: true, listingCex: true }, ...]
```

## Integration Pattern (Discovery Workflow)

```javascript
// Pre-scan: add Alpha tokens to a monitoring list for further review
const alphaTop = await getAlphaTrending(15);
const alphaSymbols = alphaTop
  .map(t => t.asset.toUpperCase())
  .filter(a => !existingWatchlist.includes(a));

// These tokens are added for monitoring — further analysis required before any action
monitoringList = [...alphaSymbols, ...monitoringList];
```

## Caching

- Token list: 20-minute TTL (reduces API load while keeping data reasonably fresh)
- Per-token ticker: 3-minute TTL
- All caching is in-memory; no disk writes required

## Response Fields

### `getAlphaSignal(asset)` response
```json
{
  "score": 13,
  "found": true,
  "alphaId": "ALPHA_042",
  "holders": 12847,
  "marketCap": "45230000",
  "volume24h": "2341000",
  "pct24h": 4.2,
  "listingCex": true,
  "hotTag": true,
  "hardWarning": false,
  "narrative": [
    "Token found on Binance Alpha list (+8pts)",
    "Token has a Binance spot pair (+2pts)",
    "hotTag active — elevated holder activity (+3pts)",
    "Volume in top 10% of Alpha list by 24h USDT (+4pts)",
    "Price +4.2% over 24h (+3pts)"
  ]
}
```

### `getAlphaTrending(limit)` response
```json
[
  {
    "asset": "ONDO",
    "alphaId": "ALPHA_042",
    "score": 42.1,
    "volume24h": 2341000,
    "pct24h": 4.2,
    "holders": 12847,
    "hotTag": true,
    "listingCex": true,
    "marketCap": 45230000
  }
]
```

## Notes

- Only tokens with a Binance spot pair are returned by `getAlphaTrending` to ensure ticker data is available
- Tokens on the Alpha list without a spot pair receive a score of +2 from `getAlphaSignal` and are flagged as monitor-only
- The skill handles API failures gracefully with in-memory cached fallback data
- Error responses from the Alpha API (e.g. token not found) are caught and returned as `{ found: false, score: 0 }`
- Built as part of DCA Claw v3, submitted to the Binance "Build the Future with AI Claw" contest (Mar 2026)
