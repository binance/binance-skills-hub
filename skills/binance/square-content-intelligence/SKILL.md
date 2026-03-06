---
name: square-content-intelligence
description: |
  Data-driven content creation engine for Binance Square that combines 8 Binance API endpoints
  to generate market-aware posts with live data. Supports 7 content template types,
  built-in Post Analyzer for scam detection, preview mode, scheduling, hashtag optimization,
  and post history tracking.
metadata:
  version: 1.1.0
  author: mefai-dev
license: MIT
---

# Square Content Intelligence

## Overview

Square Content Intelligence transforms Binance Square posting from manual text entry into a
data-driven content pipeline. Instead of writing posts from scratch, it pulls real-time data
from 8 Binance API endpoints and generates 7 structured content templates populated with
live market metrics.

**Live Demo**: [mefai.io/superbsc](https://mefai.io/superbsc) — Content Studio layout

### Content Pipeline

| Stage | Action | Data Source |
|-------|--------|-------------|
| 1. Template Selection | User picks one of 7 content types | — |
| 2. Symbol Selection | User selects trading pair(s) | — |
| 3. Data Collection | Parallel fetch from up to 8 endpoints | Binance APIs |
| 4. Content Generation | Template populated with live metrics | Computed |
| 5. Preview & Edit | User reviews and modifies content | — |
| 6. Post to Square | Published via Square OpenAPI | Square API |

## Data Sources

8 parallel API endpoints feed live market data into content templates:

| # | API Endpoint | Data Extracted | Content Use |
|---|-------------|----------------|-------------|
| 1 | Square Post API | — | Posts content to Binance Square |
| 2 | Smart Money Radar | Composite score (0-100), bias direction, 6 factor breakdown | Market calls, smart money alerts |
| 3 | Funding Rate Scanner | Rate %, annualized APR, direction, extreme flags | Funding snapshots, contrarian signals |
| 4 | Regime Detection | Market state classification (TRENDING, RANGING, VOLATILE_BREAKOUT) | Regime change alerts, market briefs |
| 5 | Accumulation Scanner | Composite score, signal strength, sub-factor scores | Watchlists, accumulation reports |
| 6 | Basis Spread | Contango/backwardation state, annualized basis % | Market structure analysis |
| 7 | Spot Ticker (`/api/v3/ticker/24hr`) | Price, 24h volume, 24h change %, high, low | All templates — price context |
| 8 | Top Trader Ratios (`/futures/data/topLongShortPositionRatio`) | Long/short ratio, timestamp | Positioning data for all templates |

### Square Post API

**Endpoint**: `POST https://www.binance.com/bapi/composite/v1/public/pgc/openApi/content/add`

**Request Headers**:

| Header | Required | Description |
|--------|----------|-------------|
| X-Square-OpenAPI-Key | Yes | Square OpenAPI Key |
| Content-Type | Yes | `application/json` |
| clienttype | Yes | `binanceSkill` |

**Request Body**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| bodyTextOnly | string | Yes | Post content text (supports #hashtags) |

**Response**:
```json
{
  "code": "000000",
  "message": null,
  "data": {
    "id": "298177291743282"
  }
}
```

Post URL on success: `https://www.binance.com/square/post/{data.id}`

### Spot Ticker API

**Endpoint**: `GET https://api.binance.com/api/v3/ticker/24hr?symbol={SYMBOL}`

**Response Fields Used**:

| Field | Type | Template Use |
|-------|------|-------------|
| lastPrice | string | Current price display |
| priceChangePercent | string | 24h change indicator |
| volume | string | Trading volume context |
| highPrice | string | Daily range |
| lowPrice | string | Daily range |
| quoteVolume | string | Dollar volume |

### Top Trader Long/Short Ratio

**Endpoint**: `GET https://fapi.binance.com/futures/data/topLongShortPositionRatio`

**Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| symbol | string | Yes | e.g. BTCUSDT |
| period | string | Yes | 5m, 15m, 30m, 1h, 2h, 4h, 6h, 12h, 1d |
| limit | int | No | Default 30, max 500 |

**Response Fields Used**:

| Field | Type | Template Use |
|-------|------|-------------|
| longShortRatio | string | Positioning bias |
| longAccount | string | Long percentage |
| shortAccount | string | Short percentage |
| timestamp | long | Data freshness |

### Smart Money Radar (Internal)

**Endpoint**: `GET /api/scanner/smart-money`

6-factor composite model producing:

| Output | Type | Values |
|--------|------|--------|
| score | int | 0-100 composite smart money score |
| bias | string | LONG, SHORT, NEUTRAL |
| regime | string | ACCUMULATION, DISTRIBUTION, POSITIONING, NEUTRAL |

**Factors**: Smart Money Direction, Retail Contrarian, Smart vs Retail Divergence, Taker Pressure, Funding Signal, OI Momentum.

### Funding Rate Scanner (Internal)

**Endpoint**: `GET /api/futures/funding-scan`

| Output | Type | Template Use |
|--------|------|-------------|
| rate | float | Current funding rate % |
| annualizedAPR | float | Annualized rate |
| direction | string | POSITIVE / NEGATIVE |
| extreme | bool | True if rate exceeds threshold |

### Regime Detection (Internal)

**Endpoint**: `GET /api/scanner/regime`

| Output | Type | Values |
|--------|------|--------|
| regime | string | TRENDING, RANGING, VOLATILE_BREAKOUT |
| confidence | float | 0-1 confidence level |
| previousRegime | string | Last detected regime |

### Accumulation Scanner (Internal)

**Endpoint**: `GET /api/scanner/accumulation`

| Output | Type | Template Use |
|--------|------|-------------|
| compositeScore | int | 0-100 accumulation strength |
| signalStrength | string | STRONG, MODERATE, WEAK |
| volumeSurge | float | Volume factor score |
| oiBuildUp | float | OI buildup score |
| stealthMode | float | Stealth accumulation score |
| buyerAggression | float | Taker ratio score |

### Basis Spread (Internal)

**Endpoint**: `GET /api/futures/basis`

| Output | Type | Template Use |
|--------|------|-------------|
| state | string | CONTANGO, BACKWARDATION |
| annualizedBasis | float | Basis as annualized % |
| spotPrice | float | Current spot price |
| futuresPrice | float | Current futures price |

## Content Templates

### Template 1: Market Brief

Daily or weekly summary combining top movers, regime state, and health score.

**Data Sources**: Spot Ticker (top 10 by volume), Regime Detection, Smart Money Radar

**Example Output**:
```
Market Brief — 2026-03-06

Regime: TRENDING (confidence: 0.87)
Smart Money Score: 72/100 — LONG bias

Top Movers (24h):
BTC  $94,250  +3.2%  Vol: $28.5B
ETH  $3,410   +5.1%  Vol: $14.2B
SOL  $148.30  +7.8%  Vol: $3.1B

Market Health: 78/100
Top traders: 62% long vs 38% short

#MarketBrief #BTC #CryptoMarket #Binance
```

### Template 2: Smart Money Alert

Triggered when Smart Money Score crosses threshold (>75 bullish, <25 bearish).

**Data Sources**: Smart Money Radar, Spot Ticker, Top Trader Ratios

**Example Output**:
```
Smart Money Alert — BTCUSDT

Score: 82/100 — STRONG LONG
Bias shifted from NEUTRAL to LONG

Factor Breakdown:
Position Direction: 0.85 (LONG)
Retail Contrarian: 0.72 (crowd is short)
Taker Pressure: 0.78 (aggressive buying)
OI Momentum: +12.4% (4h)

Price: $94,250 (+3.2% 24h)
Top Traders: 68% Long / 32% Short

#SmartMoney #BTC #TradingSignals
```

### Template 3: Funding Rate Snapshot

Extreme funding rates with contrarian analysis.

**Data Sources**: Funding Rate Scanner, Spot Ticker, Top Trader Ratios

**Example Output**:
```
Funding Rate Snapshot

Extreme Rates Detected:

DOGEUSDT  +0.0892%  (APR: 97.3%)  — Overcrowded long
SOLUSDT   +0.0645%  (APR: 70.1%)  — High premium
BTCUSDT   +0.0102%  (APR: 11.1%)  — Normal

Contrarian Signal: Consider short DOGE (extreme long bias + 97% APR)
Market Context: 72% of top traders are long

#FundingRate #Contrarian #CryptoTrading
```

### Template 4: Sector Rotation Report

Multi-sector accumulation vs distribution analysis.

**Data Sources**: Accumulation Scanner (12 pairs), Regime Detection

**Example Output**:
```
Sector Rotation Report

Accumulation Detected:
ETH    Score: 84  Signal: STRONG  — Stealth buying
LINK   Score: 78  Signal: STRONG  — OI buildup
AVAX   Score: 71  Signal: MODERATE

Distribution Detected:
DOGE   Score: 22  Signal: WEAK  — Smart money exiting
SHIB   Score: 18  Signal: WEAK

Market Regime: TRENDING
Capital rotating from meme to infrastructure

#SectorRotation #SmartMoney #CryptoAnalysis
```

### Template 5: Regime Change Alert

Triggered when market regime transitions between states.

**Data Sources**: Regime Detection, Smart Money Radar, Spot Ticker

**Example Output**:
```
Regime Change Alert

RANGING → TRENDING (confidence: 0.91)

Previous: Range-bound for 3 days
New State: Directional trend emerging

Smart Money Score: 76/100 (LONG)
BTC: $94,250 breaking above range high
Volume surge: +45% vs 7d average

Action: Regime shifts often precede sustained moves.
Watch for follow-through in next 4-8 hours.

#RegimeChange #MarketStructure #BTC
```

### Template 6: Accumulation Watchlist

Top symbols showing stealth accumulation patterns.

**Data Sources**: Accumulation Scanner (all pairs), Spot Ticker

**Example Output**:
```
Accumulation Watchlist — Top Picks

Strongest Accumulation (Score > 70):

1. ETH   Score: 84  Price: $3,410  24h: +5.1%
   Volume Surge: 82  OI Build: 88  Stealth: 79

2. LINK  Score: 78  Price: $18.40  24h: +3.8%
   Volume Surge: 74  OI Build: 81  Stealth: 76

3. AVAX  Score: 71  Price: $42.10  24h: +2.9%
   Volume Surge: 68  OI Build: 75  Stealth: 70

Institutional positioning detected before price moves.

#Accumulation #InstitutionalFlow #CryptoWatchlist
```

### Template 7: Custom Analysis

User picks any symbol for a comprehensive data-backed post.

**Data Sources**: All 8 endpoints for selected symbol

**Example Output**:
```
Deep Analysis — BTCUSDT

Price: $94,250 (+3.2% 24h)
Range: $91,100 — $94,800
Volume: $28.5B (24h)

Smart Money: 82/100 — LONG
Regime: TRENDING (0.87 confidence)
Funding: +0.0102% (APR: 11.1%) — Normal
Basis: +0.15% CONTANGO (annualized: 5.8%)

Top Traders: 68% Long / 32% Short
Accumulation Score: 74/100 — MODERATE

Verdict: Sustained institutional accumulation with
trending regime. Funding rates are neutral — room
for further upside before overcrowding.

#BTC #Bitcoin #MarketAnalysis #DeepDive
```

## Post Analyzer — Scam Detection

The Post Analyzer verifies any Binance Square post against live market data and returns a trust score (0-100). Paste any Square post and the system cross-references every claim against real-time Binance API data.

### How It Works

| Step | Action | Data Source |
|------|--------|-------------|
| 1. Symbol Detection | Identifies mentioned symbols (ticker or full name) | PAIRS list + name map |
| 2. Data Fetch | Pulls live data for detected symbols | Spot Ticker + Premium Index + Top Traders |
| 3. Claim Verification | Runs 7 automated checks against real data | Computed |
| 4. Scoring | Calculates trust score from check results | Computed |
| 5. Verdict | Generates human-readable assessment | Computed |

### 7 Verification Checks

| # | Check | What It Verifies | Pass Condition |
|---|-------|------------------|----------------|
| 1 | Price Accuracy | Price claims (e.g. "$50,000") | Within 10% of current market price |
| 2 | Direction Claim | Bullish/bearish sentiment | Aligns with 24h change + top trader positioning |
| 3 | Gain Claims | Extreme predictions (e.g. "1000x", "500%") | No unrealistic gain predictions |
| 4 | FOMO/Urgency | Manipulation language ("guaranteed", "last chance") | Fewer than 2 urgency phrases |
| 5 | Funding Rate | Claimed funding rates | Within 0.02% of actual premium index rate |
| 6 | Data Freshness | Date references in post | Date matches current day |
| 7 | Symbol Detection | Identifies which tokens are discussed | At least 1 symbol recognized |

### Scoring

| Score | Grade | Label |
|-------|-------|-------|
| 90-100 | A+ | Highly Reliable |
| 80-89 | A | Reliable |
| 70-79 | B | Mostly Accurate |
| 60-69 | C | Some Concerns |
| 40-59 | D | Unreliable |
| 0-39 | F | Potentially Misleading |

Posts generated by Content Studio are automatically verified as data-driven (score 100) since all figures are fetched from live Binance APIs at generation time.

### API

**Endpoint**: `POST /api/square/analyze`

**Request Body**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| text | string | Yes | The Square post content to analyze |
| isOwn | boolean | No | True if generated by Content Studio (returns 100) |

**Response**:
```json
{
  "score": 25,
  "grade": "F",
  "label": "Potentially Misleading",
  "checks": [
    {"name": "Price Accuracy", "status": "fail", "detail": "Claimed prices don't match current BTC price of $68,994"},
    {"name": "Direction Claim", "status": "fail", "detail": "Post claims bullish but data shows 24h: -3.27%"},
    {"name": "Gain Claims", "status": "fail", "detail": "Contains extreme gain predictions"},
    {"name": "FOMO/Urgency", "status": "fail", "detail": "Contains 2 urgency/FOMO phrases"}
  ],
  "verdict": "This post has 4 issue(s): Price mismatch, Direction contradicts data, Unrealistic gain prediction, FOMO manipulation detected.",
  "symbols": ["BTC"]
}
```

## Content Generation Pipeline

```
User Input
    │
    ├─ Select Template (1-7)
    ├─ Select Symbol(s)
    │
    ▼
Parallel Data Fetch
    │
    ├─ Spot Ticker ─────── GET /api/v3/ticker/24hr
    ├─ Top Traders ─────── GET /futures/data/topLongShortPositionRatio
    ├─ Smart Money ─────── GET /api/scanner/smart-money
    ├─ Funding Scan ────── GET /api/futures/funding-scan
    ├─ Regime ──────────── GET /api/scanner/regime
    ├─ Accumulation ────── GET /api/scanner/accumulation
    ├─ Basis ───────────── GET /api/futures/basis
    │
    ▼
Template Engine
    │
    ├─ Populate template with live data
    ├─ Generate hashtags from content context
    ├─ Apply character limit (2000 chars max)
    │
    ▼
Preview Panel
    │
    ├─ User reviews generated content
    ├─ Edit mode for manual adjustments
    │
    ▼
Post to Square
    │
    ├─ POST /bapi/composite/v1/public/pgc/openApi/content/add
    ├─ Return post URL on success
    └─ Store in post history
```

## Features

### Template Picker Bar
7 template buttons in the panel header. Each template pulls different data combinations:

| Template | Endpoints Used | Trigger |
|----------|---------------|---------|
| Market Brief | Spot + Regime + Smart Money | Manual / Daily schedule |
| Smart Money Alert | Smart Money + Spot + Traders | Score > 75 or < 25 |
| Funding Snapshot | Funding + Spot + Traders | Manual / Extreme rates |
| Sector Rotation | Accumulation (x12) + Regime | Manual / Weekly |
| Regime Change | Regime + Smart Money + Spot | Regime transition |
| Accumulation Watchlist | Accumulation (all) + Spot | Manual |
| Custom Analysis | All 8 endpoints | Manual |

### Hashtag Optimization
Automatically appends relevant hashtags based on template type and symbol:
- Symbol tags: `#BTC`, `#ETH`, `#SOL`
- Template tags: `#MarketBrief`, `#SmartMoney`, `#FundingRate`
- Context tags: `#Binance`, `#CryptoTrading`, `#TradingSignals`

### Post History
Tracks all published posts with timestamp, template used, and post URL.
Stored in browser localStorage for persistence.

### Custom Messages
Users can add their own commentary to any generated template. The custom text is inserted
between the generated content and hashtags, allowing personal analysis alongside data.

### Preview Mode
Full content preview before posting. Edit mode allows manual adjustments.
Character counter ensures posts stay within 2000-character Square limit.

## Error Handling

All 17 Square API error codes with user-friendly messages:

| Code | Description | User Message |
|------|-------------|-------------|
| 000000 | Success | Post published successfully |
| 10004 | Network error | Network error. Please try again |
| 10005 | KYC required | Identity verification required to post |
| 10007 | Feature unavailable | Feature currently unavailable |
| 20002 | Sensitive words | Content contains restricted words. Please edit |
| 20013 | Content too long | Content exceeds character limit |
| 20020 | Empty content | Cannot publish empty content |
| 20022 | Sensitive words (detailed) | Content flagged for review. Check highlighted sections |
| 20041 | URL security risk | URL in content flagged as security risk |
| 30004 | User not found | Account not found |
| 30008 | User banned | Account restricted from posting |
| 220003 | API Key not found | Invalid API Key. Check configuration |
| 220004 | API Key expired | API Key expired. Generate a new key |
| 220009 | Daily limit exceeded | Daily post limit reached. Try again tomorrow |
| 220010 | Unsupported content type | Content type not supported |
| 220011 | Empty body | Content body cannot be empty |
| 2000001 | Permanently blocked | Account permanently restricted |
| 2000002 | Device blocked | Device permanently restricted |

## Technical Stack

| Component | Technology |
|-----------|-----------|
| Frontend Panel | JavaScript ES6+, Web Components (extends BasePanel) |
| Proxy Layer | Python FastAPI, async HTTP client |
| Data Cache | In-memory LRU with stale-while-revalidate (60s fresh, 300s stale) |
| State Storage | Browser localStorage (post history, API key) |
| Content Rendering | Template literals with data interpolation |
| API Transport | HTTPS with GZip compression |

## Architecture

```
Browser (Content Studio Panel)
    │
    ├─ Template Picker ──── 7 content types
    ├─ Symbol Selector ──── 52 trading pairs
    ├─ Content Preview ──── Edit + character count
    ├─ Action Buttons ───── Generate / Edit / Post / Schedule
    └─ Post History ─────── Published posts log
    │
    ▼
FastAPI Proxy (Server-Side)
    │
    ├─ GET  /api/square/preview ───── Generates content from template + live data
    ├─ POST /api/square/post ──────── Proxies to Square API (holds API key)
    ├─ POST /api/square/analyze ───── Post Analyzer (scam detection vs live data)
    │
    ▼
Binance APIs
    │
    ├─ /bapi/composite/v1/public/pgc/openApi/content/add  (Square Post)
    ├─ /api/v3/ticker/24hr                                 (Spot Data)
    ├─ /futures/data/topLongShortPositionRatio              (Positioning)
    ├─ Smart Money Radar Engine                             (Composite Score)
    ├─ Funding Rate Scanner                                 (Rate Analysis)
    ├─ Regime Detection Engine                              (State Classification)
    ├─ Accumulation Scanner                                 (Stealth Detection)
    └─ Basis Spread Engine                                  (Contango/Backwardation)
```

## File Structure

```
frontend/
├── js/panels/square-content.js    # Panel component (extends BasePanel)
proxy/
├── routes/square.py               # Square API proxy + content generation
├── main.py                        # Route registration
```

## Quick Start

```bash
# Clone and run
git clone https://github.com/mefai-dev/binance-skills-hub.git
cd binance-skills-hub

# Start the proxy server
cd proxy && pip install -r requirements.txt
python -m proxy

# Open Content Studio layout in browser
# Navigate to CEX > Content Studio
```

## Parameters

### Content Generation Request

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| template | string | Yes | Template type: `market-brief`, `smart-money-alert`, `funding-snapshot`, `sector-rotation`, `regime-change`, `accumulation-watchlist`, `custom-analysis` |
| symbol | string | Depends | Required for templates 2,3,5,7. e.g. `BTCUSDT` |
| symbols | string[] | Depends | Required for templates 1,4,6. Array of symbols |

### Enums

**Template Types**: `market-brief` | `smart-money-alert` | `funding-snapshot` | `sector-rotation` | `regime-change` | `accumulation-watchlist` | `custom-analysis`

**Regime Values**: `TRENDING` | `RANGING` | `VOLATILE_BREAKOUT`

**Smart Money Bias**: `LONG` | `SHORT` | `NEUTRAL`

**Accumulation Signal**: `STRONG` | `MODERATE` | `WEAK`

**Basis State**: `CONTANGO` | `BACKWARDATION`

## Source Code

- **Repository**: [github.com/mefai-dev/binance-skills-hub](https://github.com/mefai-dev/binance-skills-hub)
- **Live Demo**: [mefai.io/superbsc](https://mefai.io/superbsc) — Content Studio layout
