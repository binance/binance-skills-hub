---
title: AI Market Assistant
description: Interactive conversational AI that answers natural language questions about any Binance-listed asset using real-time market data from multiple API endpoints
metadata:
  version: "1.0.0"
  author: mefai-dev
license: MIT
---

# AI Market Assistant

An interactive, conversational AI interface that accepts natural language queries about any Binance-listed asset and responds with comprehensive, real-time market analysis synthesized from 9+ Binance API endpoints simultaneously.

## Overview

Unlike traditional dashboard panels that display static data, the AI Market Assistant operates as a **conversational interface** — users type questions in plain English and receive structured, human-readable market intelligence. Each query triggers parallel API calls across spot, futures, funding, positioning, and order book data, then synthesizes the results into actionable analysis with a computed Smart Money Score, health grade, and market regime classification.

### Key Capabilities

- **Single-Asset Deep Analysis**: Comprehensive breakdown of any trading pair across 9 data dimensions
- **Multi-Asset Comparison**: Side-by-side analysis of two assets with relative scoring
- **Market-Wide Scanning**: Identify top opportunities, risks, and anomalies across configurable watchlists
- **Funding Rate Analysis**: Cross-asset funding comparison for carry trade identification
- **Health Assessment**: Market microstructure quality scoring for execution environment evaluation
- **Risk Detection**: Multi-signal anomaly detection combining 6 independent risk indicators

## Architecture

### Data Pipeline (Per Symbol)

Each analysis query fetches data from these Binance API endpoints in parallel:

| # | Endpoint | Data Extracted |
|---|----------|---------------|
| 1 | `GET /fapi/v1/ticker/24hr` | Price, volume, 24h change, high/low |
| 2 | `GET /fapi/v1/premiumIndex` | Funding rate, mark price, index price |
| 3 | `GET /fapi/v1/ticker/bookTicker` | Best bid/ask, spread calculation |
| 4 | `GET /futures/data/globalLongShortAccountRatio` | Retail long/short ratio |
| 5 | `GET /futures/data/topLongShortAccountRatio` | Top trader account ratio |
| 6 | `GET /futures/data/topLongShortPositionRatio` | Top trader position ratio (smart money) |
| 7 | `GET /futures/data/takerlongshortRatio` | Taker buy/sell pressure |
| 8 | `GET /futures/data/openInterestHist` | Open interest change over time |
| 9 | `GET /fapi/v1/ticker/bookTicker` (spot) | Spot price for basis calculation |

### Computed Metrics

From the raw API data, the assistant computes:

1. **Smart Money Score (0-100)**: 6-factor weighted composite
   - Smart Money Direction (25%): `topLongShortPositionRatio` — institutional positioning
   - Retail Contrarian (15%): Inverted `globalLongShortAccountRatio` — fade the crowd
   - Smart vs Retail Divergence (20%): Gap between top trader and retail positioning
   - Taker Pressure (15%): `takerlongshortRatio` — aggressive buyer/seller flow
   - Funding Signal (10%): Contrarian funding rate signal — extreme funding = reversal
   - OI Momentum (15%): Open interest change rate — position buildup detection

2. **Health Grade (A-F)**: 5-metric microstructure quality
   - Bid-ask spread (bps)
   - Spot-futures basis gap
   - Funding rate deviation from neutral
   - Taker balance (buy vs sell equilibrium)
   - OI stability (change rate)

3. **Market Regime**: Classification into ACCUMULATION, DISTRIBUTION, POSITIONING, or NEUTRAL

4. **Anomaly Flags**: Detected when thresholds are breached
   - Funding extreme (|rate| > 0.05%)
   - OI spike (|change| > 10%)
   - Taker imbalance (ratio deviation > 20% from neutral)
   - Smart-retail divergence (>30% gap)

## Commands

### `analyze <SYMBOL>`
Deep analysis of a single asset.

**Example Input:**
```
analyze BTCUSDT
```

**Response includes:**
- Current price, 24h change, volume
- Smart Money Score with factor breakdown
- Health grade with metric details
- Market regime classification
- Active anomaly alerts
- Directional verdict with confidence assessment

### `compare <SYMBOL1> <SYMBOL2>`
Side-by-side comparison of two assets.

**Example Input:**
```
compare BTCUSDT ETHUSDT
```

**Response includes:**
- Parallel data for both assets
- Relative Smart Money Score comparison
- Health grade comparison
- Which asset has stronger institutional positioning
- Funding rate differential

### `summary`
Market-wide overview across the default watchlist (BTC, ETH, BNB, SOL, DOGE, XRP, ADA, AVAX, LINK, DOT).

**Response includes:**
- Top bullish and bearish assets by Smart Money Score
- Most/least healthy markets
- Active anomalies across all watched assets
- Overall market sentiment assessment

### `risk`
Risk-focused scan highlighting potential dangers.

**Response includes:**
- Assets with extreme funding rates (potential squeeze)
- Assets with OI spikes (potential liquidation cascade)
- Unhealthy microstructure warnings
- Smart-retail divergence alerts

### `opportunities`
Opportunity scan for high-conviction setups.

**Response includes:**
- Assets with strong Smart Money Score (>65)
- Divergence plays (smart money vs retail disagreement)
- Funding carry opportunities
- Accumulation regime detections

### `funding`
Cross-asset funding rate comparison and carry analysis.

**Response includes:**
- Sorted funding rates across all watched assets
- Annualized funding yield calculations
- Extreme funding alerts
- Long vs short funding bias summary

### `health`
Market microstructure quality assessment.

**Response includes:**
- Health grades for all watched assets
- Spread analysis
- Basis gap assessment
- Execution environment recommendations

## API Endpoints Used

### 1. Futures 24hr Ticker
```
GET /fapi/v1/ticker/24hr?symbol={symbol}
```
**Response fields used:** `lastPrice`, `priceChangePercent`, `volume`, `quoteVolume`, `highPrice`, `lowPrice`

### 2. Premium Index (Funding)
```
GET /fapi/v1/premiumIndex?symbol={symbol}
```
**Response fields used:** `lastFundingRate`, `markPrice`, `indexPrice`, `nextFundingTime`

### 3. Book Ticker (Spread)
```
GET /fapi/v1/ticker/bookTicker?symbol={symbol}
```
**Response fields used:** `bidPrice`, `askPrice`, `bidQty`, `askQty`

### 4. Global Long/Short Account Ratio
```
GET /futures/data/globalLongShortAccountRatio?symbol={symbol}&period=1h&limit=1
```
**Response fields used:** `longShortRatio`, `longAccount`, `shortAccount`

> **Note:** This is a Binance-exclusive endpoint not available on other exchanges.

### 5. Top Trader Account Ratio
```
GET /futures/data/topLongShortAccountRatio?symbol={symbol}&period=1h&limit=1
```
**Response fields used:** `longShortRatio`, `longAccount`, `shortAccount`

> **Note:** This is a Binance-exclusive endpoint.

### 6. Top Trader Position Ratio
```
GET /futures/data/topLongShortPositionRatio?symbol={symbol}&period=1h&limit=1
```
**Response fields used:** `longShortRatio`, `longAccount`, `shortAccount`

> **Note:** This is a Binance-exclusive endpoint. Represents institutional/smart money positioning.

### 7. Taker Buy/Sell Ratio
```
GET /futures/data/takerlongshortRatio?symbol={symbol}&period=1h&limit=1
```
**Response fields used:** `buySellRatio`, `buyVol`, `sellVol`

> **Note:** This is a Binance-exclusive endpoint.

### 8. Open Interest History
```
GET /futures/data/openInterestHist?symbol={symbol}&period=1h&limit=2
```
**Response fields used:** `sumOpenInterest`, `sumOpenInterestValue`

### 9. Spot Book Ticker
```
GET /api/v3/ticker/bookTicker?symbol={symbol}
```
**Response fields used:** `bidPrice`, `askPrice` — used for spot-futures basis calculation

## Smart Money Score Algorithm

```
Inputs:
  topPosRatio    = topLongShortPositionRatio.longShortRatio
  globalRatio    = globalLongShortAccountRatio.longShortRatio
  topAcctRatio   = topLongShortAccountRatio.longShortRatio
  takerRatio     = takerlongshortRatio.buySellRatio
  fundingRate    = premiumIndex.lastFundingRate
  oiCurrent      = openInterestHist[0].sumOpenInterestValue
  oiPrevious     = openInterestHist[1].sumOpenInterestValue

Factors:
  smartDir       = clamp(topPosRatio / 3, 0, 1)      × 25
  retailContra   = clamp((2 - globalRatio) / 2, 0, 1) × 15
  divergence     = clamp(|topPosRatio - globalRatio| / 2, 0, 1) × 20
  takerPressure  = clamp(takerRatio / 2, 0, 1)        × 15
  fundingSignal  = clamp((0.001 - |fundingRate|) / 0.001, 0, 1) × 10
  oiMomentum     = clamp((oiCurrent / oiPrevious - 0.95) / 0.1, 0, 1) × 15

Score = smartDir + retailContra + divergence + takerPressure + fundingSignal + oiMomentum
Direction = Score >= 60 ? "LONG" : Score <= 35 ? "SHORT" : "NEUTRAL"
```

## Health Grade Algorithm

```
Metrics (each scored 0-20):
  spreadScore    = max(0, 20 - spreadBps × 2)
  basisScore     = max(0, 20 - |spotFuturesGap%| × 10)
  fundingScore   = max(0, 20 - |fundingRate| × 20000)
  takerScore     = max(0, 20 - |takerRatio - 1| × 40)
  oiScore        = max(0, 20 - |oiChange%| × 2)

Health = spreadScore + basisScore + fundingScore + takerScore + oiScore
Grade  = Health >= 80 ? "A" : >= 60 ? "B" : >= 40 ? "C" : >= 20 ? "D" : "F"
```

## Use Cases

1. **Quick Market Check**: "What's happening with BTC right now?" → `analyze BTCUSDT`
2. **Rotation Decision**: "Should I rotate from ETH to SOL?" → `compare ETHUSDT SOLUSDT`
3. **Morning Briefing**: "Give me the market overview" → `summary`
4. **Risk Management**: "Any red flags I should know about?" → `risk`
5. **Trade Discovery**: "Where are the best setups?" → `opportunities`
6. **Carry Strategy**: "Which assets have the best funding?" → `funding`
7. **Execution Timing**: "Is the market healthy enough to enter?" → `health`

## Integration Notes

- All endpoints are public (no API key required for read-only data)
- Binance-exclusive endpoints (`globalLongShortAccountRatio`, `topLongShortPositionRatio`, `takerlongshortRatio`) provide data unavailable on any other exchange
- Responses are synthesized client-side — no external AI API calls required
- The conversational format makes complex multi-endpoint analysis accessible to non-technical users
- Default watchlist is configurable; supports any Binance USDT perpetual futures pair

## Response Format

All responses use structured natural language with:
- Emoji-free professional formatting
- Numerical data with appropriate precision
- Color-coded severity indicators (green/yellow/red)
- Actionable verdicts with confidence qualifiers
- Timestamp and data freshness indicators
