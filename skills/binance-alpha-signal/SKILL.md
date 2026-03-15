---
title: Binance Alpha Signal
description: Score any crypto asset against the Binance Alpha on-chain token list. Detects CEX-listed Alpha tokens, computes a momentum score from volume percentile, holder growth, and 24h price action, and returns trending tokens for pre-scan asset discovery. No API key required.
metadata:
  version: 1.0.0
  author: /Argeneau
license: MIT
---

# Binance Alpha Signal

## Overview

The Binance Alpha Signal skill gives AI agents native access to the Binance Alpha token ecosystem — an on-chain marketplace of emerging tokens being considered for CEX listing. It enables two key capabilities:

1. **Asset scoring** — given any token symbol, determine if it exists on Binance Alpha, whether it is CEX-listed, and compute a momentum confidence score based on volume, holder growth, and price action.

2. **Trending discovery** — fetch the top N trending Alpha tokens ranked by a composite score of momentum, volume, and CEX listing status. Use this to inject early-discovery assets into any agent's watchlist.

## Use Cases

- **DCA agents**: Discover assets gaining on-chain momentum before wider market awareness
- **Portfolio agents**: Monitor Alpha tokens for CEX listing upgrades that typically trigger price surges
- **Signal agents**: Use Alpha presence as a confirmation signal for bullish setups
- **Research agents**: Get holder count, market cap, FDV, and liquidity for any Alpha token

## API Endpoints Used

All endpoints are **public — no API key required**.

### Token List
```
GET https://www.binance.com/bapi/defi/v1/public/wallet-direct/buw/wallet/cex/alpha/all/token/list
```
Returns all active Alpha tokens with: price, 24h change, volume, market cap, holder count, FDV, liquidity, CEX listing status, hot tag, and alphaId.

### 24hr Ticker (per token)
```
GET https://www.binance.com/bapi/defi/v1/public/alpha-trade/ticker?symbol={alphaId}USDT
```
Returns rolling 24h stats for a specific Alpha token.

## Scoring Logic

### Single Asset Score (`getAlphaSignal(asset)`)

| Condition | Points |
|-----------|--------|
| Token exists on Binance Alpha | +8 |
| CEX-listed (`listingCex = true`) | +2 |
| `hotTag = true` (holder growth trending) | +3 |
| Volume in top 10% of all Alpha tokens | +4 |
| Volume in top 25% of all Alpha tokens | +2 |
| Price +0 to +15% (healthy momentum) | +3 |
| Price >+15% (possibly overextended) | -3 |
| Price <-20% (sharp dump) | -5 |
| Token marked offline or offsell | -8 (hard block) |
| Token on Alpha but NOT CEX-listed | +2 (monitor only) |

Score is clamped to [-15, +15].

### Trending Discovery (`getAlphaTrending(limit)`)

Ranks all active Alpha tokens by a composite score:
- CEX listing: +20 pts (ensures tradeable tokens rank highest)
- Hot tag: +10 pts
- Momentum (0–20% price gain): up to +10 pts
- Volume (log-scaled): up to +15 pts

Returns only CEX-listed tokens to prevent "No stats" errors on pure on-chain tokens.

## Implementation

```javascript
import { getAlphaSignal, getAlphaTrending } from './skills/alpha-signal.js';

// Score a single asset
const result = await getAlphaSignal('ONDO');
// Returns: { score: 13, found: true, listingCex: true, hotTag: true, pct24h: 4.2, narrative: [...] }

// Get top 15 trending Alpha tokens for pre-scan injection
const trending = await getAlphaTrending(15);
// Returns: [{ asset: 'ONDO', score: 42.1, volume24h: 1234567, pct24h: 4.2, hotTag: true, listingCex: true }, ...]
```

## Integration Pattern (DCA Agent)

```javascript
// Pre-scan: inject trending Alpha tokens before scoring cycle
const alphaTop = await getAlphaTrending(15);
const alphaSymbols = alphaTop
  .map(t => t.asset.toUpperCase())
  .filter(a => !existingAssets.includes(a));

assets = [...alphaSymbols, ...existingAssets]; // Alpha tokens get first priority
```

## Caching

- Token list: 20-minute TTL (balance between freshness and API load)
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
  "notCexListed": false,
  "hardWarning": false,
  "narrative": [
    "🔺 Binance Alpha token confirmed (+8pts)",
    "📈 Listed on CEX — institutional discovery (+2pts)",
    "🔥 Alpha hotTag active — holder growth trending (+3pts)",
    "📊 Alpha volume top 10% (2341K USDT 24h) (+4pts)",
    "📈 Alpha price +4.2% — healthy momentum (+3pts)"
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

- Only CEX-listed tokens are returned by `getAlphaTrending` to ensure they have a tradeable USDT spot pair on Binance
- Non-CEX-listed Alpha tokens (BSC-only memecoins) return a score of 2 from `getAlphaSignal` — flagged as "monitor only"
- The skill gracefully handles API failures with cached fallback data
- Built and battle-tested as part of DCA Claw v3 — entered in the Binance "Build the Future with AI Claw" contest (Mar 2026)