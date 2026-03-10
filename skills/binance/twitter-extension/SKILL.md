---
title: twitter-extension
description: |
  Chrome/Firefox browser extension that brings SuperBSC terminal intelligence directly into Twitter/X.
  Detects cashtags ($BTC, $ETH) in tweets, shows real-time price badges, and opens a side panel with
  funding rates, open interest, taker pressure, basis spread, and top trader positioning.
  Supports posting to Binance Square and composing tweets with data-driven content from 5 templates.
metadata:
  version: 1.0.0
  author: mefai-dev
license: MIT
---

# Twitter Extension

## Overview

SuperBSC Twitter Extension transforms Twitter/X into a crypto intelligence feed. When installed,
the extension automatically detects cashtags ($BTC, $ETH, $SOL, etc.) in tweets and enriches them
with real-time price data from Binance APIs. Clicking any enriched cashtag opens a side panel
showing comprehensive analysis from 7 data sources, with the ability to post findings directly
to Binance Square or compose a tweet with data-driven content.

**Live Terminal**: [mefai.io/superbsc](https://mefai.io/superbsc)

### User Flow

| Step | Action | Result |
|------|--------|--------|
| 1 | User browses Twitter/X | Extension scans tweets via MutationObserver |
| 2 | Cashtag detected ($BTC) | Price badge injected next to cashtag |
| 3 | User hovers badge | Tooltip shows price, 24h change, volume |
| 4 | User clicks badge | Chrome Side Panel opens with full analysis |
| 5 | Side panel loads | 9 parallel API calls fetch live data |
| 6 | User clicks "Post to Square" | Template picker, preview, post via Square API |
| 7 | User clicks "Compose Tweet" | Twitter intent opens with generated content |
| 8 | User clicks "Cross-Post" | Posts to Square first, then opens tweet with Square URL |

## Data Sources

9 parallel API endpoints feed the side panel analysis:

| # | Data Source | Endpoint | Analysis Provided |
|---|-----------|----------|------------------|
| 1 | Spot Ticker | `GET /api/v3/ticker/24hr` | Price, 24h change, volume, daily range |
| 2 | Top Trader Ratios | `GET /futures/data/topLongShortPositionRatio` | Long/short positioning bar |
| 3 | Funding Rate | `GET /fapi/v1/premiumIndex` | Rate %, annualized APR, extreme flags, mark price |
| 4 | Basis Spread | `GET /futures/data/basis` | Contango/backwardation, annualized basis % |
| 5 | Open Interest | `GET /fapi/v1/openInterest` | Current OI value |
| 6 | Taker Buy/Sell | `GET /futures/data/takerlongshortRatio` | Buy/sell ratio, pressure direction |
| 7 | Account L/S Ratio | `GET /futures/data/topLongShortAccountRatio` | Retail sentiment long/short bar |
| 8 | OI History | `GET /futures/data/openInterestHist` | 6h OI trend (RISING/FALLING/STABLE) |
| 9 | Futures 24hr | `GET /fapi/v1/ticker/24hr` | Futures price, volume, trades count |

### Spot Ticker API

**Endpoint**: `GET https://api.binance.com/api/v3/ticker/24hr?symbol={SYMBOL}`

**Response Fields Used**:

| Field | Type | Usage |
|-------|------|-------|
| lastPrice | string | Current price in badge and side panel header |
| priceChangePercent | string | 24h change indicator with color coding |
| quoteVolume | string | Dollar volume display |
| highPrice | string | Daily range visualization |
| lowPrice | string | Daily range visualization |

### Top Trader Long/Short Ratio

**Endpoint**: `GET https://fapi.binance.com/futures/data/topLongShortPositionRatio`

**Parameters**:

| Parameter | Type | Required | Value |
|-----------|------|----------|-------|
| symbol | string | Yes | e.g. BTCUSDT |
| period | string | Yes | 1h |
| limit | int | No | 1 |

**Response Fields Used**:

| Field | Usage |
|-------|-------|
| longAccount | Long percentage for positioning bar |
| shortAccount | Short percentage for positioning bar |
| longShortRatio | Ratio display |

### Square Post API

**Endpoint**: `POST https://www.binance.com/bapi/composite/v1/public/pgc/openApi/content/add`

**Request Headers**:

| Header | Required | Description |
|--------|----------|-------------|
| X-Square-OpenAPI-Key | Yes | Square OpenAPI Key (stored in chrome.storage) |
| Content-Type | Yes | `application/json` |
| clienttype | Yes | `binanceSkill` |

**Request Body**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| bodyTextOnly | string | Yes | Post content (max 2000 chars, supports #hashtags) |

**Response**:
```json
{
  "code": "000000",
  "data": { "id": "content_id" }
}
```

Post URL on success: `https://www.binance.com/square/post/{data.id}`

## Content Templates

5 templates for data-driven content generation:

| # | Template | Data Sources | Trigger |
|---|----------|-------------|---------|
| 1 | Market Brief | Spot + Funding + Traders + Taker + OI | Manual |
| 2 | Funding Snapshot | Funding + Spot + Traders | Manual |
| 3 | Regime Change | Spot + Basis + Funding + OI + Traders | Manual |
| 4 | Smart Money Alert | Spot + Traders + Taker | Manual |
| 5 | Custom Analysis | All 9 endpoints | Manual (default) |

### Template Example: Custom Analysis

```
Analysis - BTCUSDT

Price: $94,250 (+3.2% 24h)
Range: $91,100 - $94,800
Volume: $28.5B

Funding: +0.0102% (APR: 11.1%)
Basis: CONTANGO (5.8%)
Open Interest: $28.5B
OI Trend: RISING (+4.2% 6h)
Top Traders: 68% Long / 32% Short
Accounts: 67% Long / 33% Short
Taker: BUYERS (ratio: 1.08)

#BTC #CryptoAnalysis #Binance #SuperBSC

via SuperBSC
```

## Extension Architecture

```
Twitter/X Page
    |
    +-- Content Script (content.js)
    |   +-- MutationObserver: watches tweet DOM
    |   +-- Cashtag Detector: regex $[A-Z]{2,10} vs 52 known pairs
    |   +-- Badge Injector: price + change inline badge
    |   +-- Hover Tooltip: 300ms delay, cached data
    |   +-- Wallet Bridge: MetaMask via window.ethereum (BSC chain)
    |   +-- Click Handler: sets selectedSymbol, opens Side Panel
    |
    +-- Service Worker (background)
    |   +-- Message Router: handles all chrome.runtime messages
    |   +-- API Client: 9 parallel fetches with AbortSignal timeout
    |   +-- LRU Cache: 60s fresh, 300s stale-while-revalidate, 100 max
    |   +-- Square Client: post API + key management + history
    |
    +-- Side Panel (sidepanel/)
    |   +-- Token Header: symbol, price, change, volume, range
    |   +-- Funding Section: rate, APR, mark price, extreme indicator
    |   +-- Traders Section: long/short positioning bar
    |   +-- Taker Section: buy/sell ratio, pressure badge, progress bar
    |   +-- Open Interest Section: current OI, 6h change, trend badge
    |   +-- Basis Section: contango/backwardation badge, annualized %
    |   +-- Account Ratio Section: retail long/short bar
    |   +-- Wallet Section: MetaMask connect, BNB/USDT balance, send BNB
    |   +-- Action Bar: Post to Square, Compose Tweet, Cross-Post
    |   +-- Square Modal: template picker, preview, char counter
    |
    +-- Popup (popup/)
    |   +-- Quick Search: symbol input, opens side panel
    |   +-- Watchlist: 3 default symbols with live prices
    |   +-- Recent Posts: last 5 Square/Twitter posts
    |
    +-- Options (options/)
        +-- Square API Key: secure storage, masked display
        +-- Behavior: auto-enrich toggle, hover tooltip toggle
        +-- Content: default template, post signature
        +-- Watchlist: comma-separated symbol list
```

## Cashtag Detection

The content script uses a combination of regex matching and known-pair filtering:

**Regex**: `\$([A-Za-z]{2,10})\b`

**Known Pairs** (52 supported):
BTC, ETH, BNB, SOL, XRP, DOGE, ADA, AVAX, DOT, MATIC, LINK, UNI, SHIB, LTC, ATOM, FIL,
APT, ARB, OP, IMX, NEAR, ICP, FTM, ALGO, VET, MANA, SAND, AXS, AAVE, GRT, EOS, THETA,
XLM, TRX, ETC, FET, RNDR, INJ, SUI, SEI, TIA, JUP, WIF, PEPE, FLOKI, BONK, ORDI, STX,
RUNE, PENDLE, WLD, JTO

**Meme Coin Prefix Mapping** (for futures endpoints):
- PEPE -> 1000PEPEUSDT
- FLOKI -> 1000FLOKIUSDT
- SHIB -> 1000SHIBUSDT
- BONK -> 1000BONKUSDT

**Performance**:
- MutationObserver with 100ms debounce
- Processed tweets marked with `data-sbsc-processed` attribute
- Price data cached in memory (60s fresh)
- Periodic rescan every 5s for dynamic content

## Badge Rendering

Inline badge injected after each detected cashtag:

```
[$BTC [S] $94,250 +3.2%]
```

Components:
- SuperBSC icon (16x16 PNG)
- Current price (formatted by magnitude)
- 24h change with color coding (green/red)

**Hover Tooltip** (300ms delay):
```
+---------------------------+
| BTC/USDT        $94,250   |
| 24h Change      +3.2%     |
| Volume          $28.5B    |
| _________________________ |
| Click for full analysis    |
+---------------------------+
```

## Error Handling

All 17 Square API error codes handled with user-friendly messages:

| Code | User Message |
|------|-------------|
| 000000 | Success |
| 10004 | Network error. Please try again |
| 10005 | Identity verification required |
| 20002 | Content contains restricted words |
| 20013 | Content exceeds character limit |
| 220003 | Invalid API Key |
| 220004 | API Key expired |
| 220009 | Daily post limit reached |

API calls use `AbortSignal.timeout(10000)` for 10-second timeouts. Failed requests fall back to stale cache data when available.

## Security

| Concern | Implementation |
|---------|---------------|
| API Key Storage | `chrome.storage.local` (encrypted at rest by browser) |
| Key Display | Masked in options (show/hide toggle) |
| XSS Prevention | `textContent` for DOM injection, no `innerHTML` with user data |
| CSP | Manifest V3 default CSP (no inline scripts) |
| CORS | All API calls routed through background service worker |
| Rate Limiting | Client-side: max 10 requests/min per symbol via cache |

## Technical Stack

| Component | Technology |
|-----------|-----------|
| Extension | Manifest V3 (Chrome + Firefox compatible) |
| UI | Vanilla JavaScript, no frameworks |
| Styling | CSS with custom properties (SuperBSC dark theme) |
| State | chrome.storage.local + in-memory LRU cache |
| API | Fetch API with AbortSignal timeout |
| Icons | Custom 3D SVG-designed icons (4 sizes) |

## File Structure

```
extension/
+-- manifest.json
+-- icons/
|   +-- icon-16.png, icon-32.png, icon-48.png, icon-128.png
|   +-- icon-16.svg, icon-48.svg, icon-128.svg
+-- content/
|   +-- content.js         # Twitter DOM injection + cashtag detection
|   +-- content.css         # Badge + tooltip styles
+-- background/
|   +-- service-worker.js   # Message router + side panel control
|   +-- api-client.js       # 9 Binance API endpoint wrappers
|   +-- square-client.js    # Square post API + key + history management
|   +-- cache.js            # LRU cache with TTL
+-- sidepanel/
|   +-- sidepanel.html/css/js  # Full analysis panel with 6 data sections + wallet
+-- popup/
|   +-- popup.html/css/js      # Quick search + watchlist + recent posts
+-- options/
|   +-- options.html/css/js    # Settings page
+-- shared/
|   +-- constants.js, utils.js, theme.js
+-- _locales/
    +-- en/, tr/
```

## Quick Start

```bash
# Clone the repository
git clone https://github.com/mefai-dev/binance-skills-hub.git

# Load extension in Chrome
# 1. Open chrome://extensions
# 2. Enable "Developer mode"
# 3. Click "Load unpacked"
# 4. Select the extension/ directory

# Configure
# 1. Click extension icon -> Settings
# 2. Enter your X-Square-OpenAPI-Key
# 3. Customize watchlist and preferences

# Use
# 1. Go to twitter.com or x.com
# 2. Cashtags ($BTC, $ETH) will show price badges
# 3. Click any badge to open analysis side panel
# 4. Post to Square or compose a tweet with data
```

## Parameters

### Extension Settings

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| squareApiKey | string | - | X-Square-OpenAPI-Key for Binance Square posting |
| autoEnrich | boolean | true | Auto-inject price badges on cashtags |
| hoverTooltip | boolean | true | Show mini preview on badge hover |
| defaultTemplate | string | custom-analysis | Default content template |
| postSignature | string | via SuperBSC | Appended to all posts |
| watchlist | string[] | [BTC, ETH, SOL] | Popup watchlist symbols |

### Enums

**Template Types**: `market-brief` | `smart-money-alert` | `funding-snapshot` | `regime-change` | `custom-analysis`

## Source Code

- **Repository**: [github.com/mefai-dev/binance-skills-hub](https://github.com/mefai-dev/binance-skills-hub)
- **Live Terminal**: [mefai.io/superbsc](https://mefai.io/superbsc)
