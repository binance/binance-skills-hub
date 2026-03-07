---
title: Capital Rotation
description: |
  Track capital flow between crypto sectors in real-time. Detect when smart money
  rotates from Meme → AI → RWA → DePIN by monitoring sector-level market cap changes,
  volume shifts, and momentum. Uses CoinGecko Categories API (free, no auth).
metadata:
  version: "1.0"
  author: mefai-dev
license: MIT
---

# Capital Rotation Radar

## Overview

| Source | Data | Free |
|--------|------|------|
| CoinGecko Categories API | Sector market caps, 24h volume, 24h% change | Yes, no auth |
| CoinGecko Markets API | Individual coins per sector with full market data | Yes, no auth |

## Use Cases

1. **Sector Rotation Detection** — "AI sector gained $2B in 24h while Meme lost $1.5B" — capital is rotating
2. **Narrative Momentum** — Which sectors have the strongest inflows right now?
3. **Contrarian Signals** — Sectors with massive outflows may be bottoming — mean reversion opportunity
4. **Portfolio Rebalancing** — Align your portfolio with the macro capital flow direction
5. **Early Narrative Entry** — Detect rising sectors before they become mainstream narratives

## Key Sectors to Track

| Category ID | Name | Why |
|-------------|------|-----|
| `meme-token` | Meme | Retail sentiment proxy, first to pump/dump |
| `ai-agents` | AI Agents | Hottest narrative, institutional interest |
| `ai-meme-coins` | AI Meme | Intersection of AI + meme narratives |
| `real-world-assets-rwa` | RWA | Institutional flow indicator |
| `depin` | DePIN | Infrastructure narrative |
| `gaming` | Gaming / GameFi | Retail engagement proxy |
| `layer-1` | Layer 1 | Infrastructure capital flow |
| `layer-2` | Layer 2 | Scaling narrative |
| `decentralized-finance-defi` | DeFi | TVL-driven capital flow |
| `smart-contract-platform` | Smart Contract Platforms | Ecosystem capital rotation |
| `stablecoins` | Stablecoins | Flight-to-safety indicator |

---

## API 1: All Categories with Market Data

Returns all 750+ crypto categories with aggregated market data. One call gives you the entire sector map.

### Request

```
GET https://api.coingecko.com/api/v3/coins/categories
```

### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `order` | string | No | `market_cap_desc` | Sort: `market_cap_desc`, `market_cap_asc`, `market_cap_change_24h_desc`, `market_cap_change_24h_asc`, `name_desc`, `name_asc` |

### Example Request

```bash
curl "https://api.coingecko.com/api/v3/coins/categories?order=market_cap_change_24h_desc"
```

### Response

```json
[
  {
    "id": "ai-agents",
    "name": "AI Agents",
    "market_cap": 8945123456.78,
    "market_cap_change_24h": 12.45,
    "content": "AI agent tokens enable autonomous...",
    "top_3_coins": [
      "https://coin-images.coingecko.com/coins/images/.../small/token.png"
    ],
    "top_3_coins_id": ["virtuals-protocol", "ai16z", "fartcoin"],
    "volume_24h": 2345678901.23,
    "updated_at": "2026-03-04T16:15:30.019Z"
  }
]
```

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Category slug (use as filter in markets API) |
| `name` | string | Human-readable category name |
| `market_cap` | number | Total sector market cap in USD |
| `market_cap_change_24h` | number | 24h market cap change as percentage |
| `volume_24h` | number | Total 24h trading volume in USD |
| `top_3_coins` | string[] | Image URLs for top 3 coins |
| `top_3_coins_id` | string[] | CoinGecko IDs of top 3 coins |
| `content` | string/null | Category description |
| `updated_at` | string | ISO 8601 timestamp |

---

## API 2: Category ID List (Lightweight)

Returns just IDs and names — useful for building category selectors.

### Request

```
GET https://api.coingecko.com/api/v3/coins/categories/list
```

### Response

```json
[
  {"category_id": "meme-token", "name": "Meme"},
  {"category_id": "ai-agents", "name": "AI Agents"},
  {"category_id": "real-world-assets-rwa", "name": "Real World Assets (RWA)"},
  {"category_id": "depin", "name": "DePIN"}
]
```

**Total:** ~756 categories available.

---

## API 3: Coins Within a Category

Returns individual coins for a specific sector with full market data.

### Request

```
GET https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&category={category_id}
```

### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `vs_currency` | string | Yes | — | Target currency (`usd`, `btc`, `eur`) |
| `category` | string | Yes | — | Category slug from categories API |
| `order` | string | No | `market_cap_desc` | Sort order |
| `per_page` | int | No | 100 | Results per page (max 250) |
| `page` | int | No | 1 | Page number |
| `sparkline` | bool | No | false | Include 7-day sparkline |

### Example Request

```bash
curl "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&category=ai-agents&per_page=10&page=1"
```

### Response

```json
[
  {
    "id": "virtuals-protocol",
    "symbol": "virtual",
    "name": "Virtuals Protocol",
    "image": "https://coin-images.coingecko.com/coins/images/.../small/virtual.png",
    "current_price": 1.23,
    "market_cap": 1234567890,
    "market_cap_rank": 85,
    "total_volume": 234567890,
    "price_change_percentage_24h": 15.67,
    "market_cap_change_percentage_24h": 14.23,
    "circulating_supply": 1000000000,
    "ath": 5.07,
    "ath_change_percentage": -75.2,
    "atl": 0.0089,
    "atl_change_percentage": 13720.0
  }
]
```

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | CoinGecko coin ID |
| `symbol` | string | Token ticker |
| `name` | string | Token name |
| `image` | string | Token icon URL |
| `current_price` | number | Current price in USD |
| `market_cap` | number | Market cap in USD |
| `market_cap_rank` | number | Global rank |
| `total_volume` | number | 24h trading volume |
| `price_change_percentage_24h` | number | 24h price change % |
| `market_cap_change_percentage_24h` | number | 24h market cap change % |
| `circulating_supply` | number | Circulating supply |
| `ath` | number | All-time high price |
| `ath_change_percentage` | number | % from ATH |

---

## Rotation Detection Algorithm

### Step 1: Fetch Sector Snapshots

Call `/coins/categories` to get all sectors with market cap and 24h change.

### Step 2: Filter Key Sectors

Track these 10 core sectors:

```
SECTORS = [
  "meme-token", "ai-agents", "ai-meme-coins",
  "real-world-assets-rwa", "depin", "gaming",
  "layer-1", "layer-2", "decentralized-finance-defi",
  "smart-contract-platform"
]
```

### Step 3: Calculate Flow Signals

For each sector, compute:
- **Momentum** = `market_cap_change_24h` (positive = inflow, negative = outflow)
- **Volume Intensity** = `volume_24h / market_cap` (higher = more active trading)
- **Flow Direction** = momentum > 0 → INFLOW, momentum < 0 → OUTFLOW

### Step 4: Rotation Matrix

```
| From          | To            | Signal Strength |
|---------------|---------------|-----------------|
| Meme (-8.5%)  | AI (+12.4%)   | STRONG          |
| DeFi (-3.2%)  | RWA (+6.1%)   | MODERATE        |
| Gaming (-1.5%)| DePIN (+4.2%) | MODERATE        |
```

**Signal Strength:**
- Strong: both sectors > 5% absolute change in opposite directions
- Moderate: both sectors > 2% absolute change
- Weak: smaller movements

### Step 5: Narrative Score (0-100)

```
For each sector:
  base = market_cap_change_24h (capped at ±20)
  volume_boost = min(10, volume_intensity × 100)
  narrative_score = 50 + (base × 2.5) + volume_boost
  clamp(0, 100)
```

---

## Recipes

### Recipe 1: Sector Rotation Dashboard

```
Show current capital rotation across crypto sectors:
1. Fetch /coins/categories
2. Filter to 10 key sectors
3. Sort by market_cap_change_24h
4. Display: Sector name | MCap | 24h Change% | Volume | Flow Direction (↑/↓)
5. Color: green for inflow, red for outflow
6. Show rotation arrows between top gainer and top loser
```

### Recipe 2: Sector Deep Dive

```
Analyze {sector} in detail:
1. Fetch /coins/categories for sector overview
2. Fetch /coins/markets?category={sector_id} for top 20 coins
3. Show: sector total MCap, volume, 24h change
4. List top performers and worst performers within sector
5. Calculate sector concentration (top 3 coins % of total)
```

### Recipe 3: Narrative Momentum Alert

```
Find sectors with strongest momentum right now:
1. Fetch /coins/categories?order=market_cap_change_24h_desc
2. Take top 5 gaining sectors and bottom 5 losing sectors
3. For top gainers: "Capital flowing INTO: AI Agents (+12%), RWA (+6%)"
4. For top losers: "Capital flowing OUT OF: Meme (-8%), Gaming (-4%)"
5. Calculate rotation pairs (money leaving X is entering Y)
```

### Recipe 4: Contrarian Signal

```
Find sectors that may be bottoming for mean reversion:
1. Fetch /coins/categories?order=market_cap_change_24h_asc
2. Take bottom 5 sectors (biggest losers)
3. For each, fetch /coins/markets to find individual coins near ATL
4. Flag sectors where volume is increasing despite price dropping (accumulation signal)
5. "Contrarian opportunity: {sector} down -12% but volume up 45%"
```

---

## Rate Limits

| Aspect | Limit |
|--------|-------|
| Calls/minute | 30 (free tier) |
| Monthly cap | ~10,000 calls |
| Cache TTL | 30 seconds (server-side) |
| Rate exceeded | HTTP 429 with `retry-after: 60` |

## Notes

- CoinGecko Categories API is completely free, no API key required
- Base URL: `https://api.coingecko.com/api/v3/` (free tier)
- Optional: register for free Demo API key for better rate limit tracking
- If using Demo key: pass via `x-cg-demo-api-key` header
- The `/coins/categories` endpoint returns ALL 750+ categories in one call — cache aggressively
- `market_cap_change_24h` is the key field for rotation detection
- Categories update every ~5 minutes
- For the rotation radar, calling `/coins/categories` once every 5 minutes uses only ~288 calls/day
- CORS headers present (`access-control-allow-origin: *`) — works from browser
