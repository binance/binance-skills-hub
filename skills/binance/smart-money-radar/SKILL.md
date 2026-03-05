---
title: Smart Money Radar
description: Real-time institutional vs retail positioning intelligence using 6 Binance-exclusive data signals to generate composite Smart Money Scores, divergence alerts, and market regime classification
metadata:
  version: "1.0.0"
  author: mefai-dev
license: MIT
---

# Smart Money Radar

## Overview

Smart Money Radar is an institutional positioning intelligence system that uses **6 data signals exclusive to Binance** — data that no other cryptocurrency exchange publishes — to generate composite Smart Money Scores, detect smart-vs-retail divergences, and classify market regimes in real-time.

The core insight: Binance is the only exchange that simultaneously publishes top trader positioning (account ratio AND position ratio), global retail positioning, taker buy/sell ratios, and detailed open interest history. By combining these orthogonal data streams, Smart Money Radar reveals what institutional traders are doing **before** price reflects it.

## Why This Skill Is Unique

### Binance-Exclusive Data Advantage

| Data Signal | Binance | Bybit | OKX | Kraken | Coinbase |
|-------------|---------|-------|-----|--------|----------|
| Top Trader L/S Account Ratio | **YES** | No | No | No | No |
| Top Trader L/S Position Ratio | **YES** | No | No | No | No |
| Global L/S Account Ratio | **YES** | Partial | Partial | No | No |
| Taker Buy/Sell Volume Ratio | **YES** | No | No | No | No |
| Historical Open Interest | **YES** | Partial | Partial | No | No |
| Premium Index + Funding | **YES** | Yes | Yes | No | No |

**Result: 4 out of 6 signals are ONLY available on Binance.** This skill cannot be replicated on any other exchange.

## Architecture

### The 6 Factor Model

Each factor is normalized to a -1 to +1 scale where positive = bullish, negative = bearish:

#### Factor 1: Smart Money Direction
**Source:** `topLongShortPositionRatio` (Binance-exclusive)
**What it measures:** What the top 20% of traders by position size are doing
**Signal:** ratio > 1 = smart money going long, ratio < 1 = going short
```
smartDir = clamp((topPosRatio - 1) × 5, -1, +1)
```

#### Factor 2: Retail Contrarian
**Source:** `globalLongShortAccountRatio`
**What it measures:** What ALL traders are doing (dominated by retail)
**Signal:** Inverted — when retail goes long, it's a bearish signal (and vice versa)
```
retailContra = clamp((1 - retailRatio) × 5, -1, +1)
```

#### Factor 3: Smart vs Retail Divergence
**Source:** Computed from Factor 1 and Factor 2 sources
**What it measures:** The gap between institutional and retail positioning
**Signal:** Large divergence = high-conviction signal (smart money disagrees with crowd)
```
divergence = clamp((topPosRatio - retailRatio) × 3, -1, +1)
```

#### Factor 4: Taker Pressure
**Source:** `takerlongshortRatio` (Binance-exclusive)
**What it measures:** Aggressive order flow — are buyers or sellers hitting the book harder?
**Signal:** ratio > 1 = aggressive buying, ratio < 1 = aggressive selling
```
takerPressure = clamp((takerRatio - 1) × 5, -1, +1)
```

#### Factor 5: Funding Signal (Contrarian)
**Source:** `premiumIndex`
**What it measures:** Leverage positioning balance via funding rate
**Signal:** Contrarian — negative funding = longs get paid = bullish (market is under-positioned long)
```
fundingSignal = clamp(-fundingBps × 0.1, -1, +1)
```

#### Factor 6: OI Momentum
**Source:** `openInterestHist`
**What it measures:** Whether new positions are being opened (conviction) or closed (retreat)
**Signal:** Rising OI = conviction behind the current direction
```
oiMomentum = clamp(oiChange% × 0.3, -1, +1)
```

### Composite Smart Money Score (0-100)

```
avgSignal = mean(all 6 factors)
agreeing = count(factors with same sign as avgSignal AND magnitude > 0.1)
confluence = agreeing / 6

smartScore = min(100, |avgSignal| × confluence × 250)
```

The score rewards both signal strength (magnitude) and factor agreement (confluence). A strong signal backed by 6/6 factors scores much higher than a strong signal backed by only 2/6 factors.

### Direction Classification

| avgSignal | Direction | Meaning |
|-----------|-----------|---------|
| > +0.08 | **LONG** | Smart money is bullish |
| < -0.08 | **SHORT** | Smart money is bearish |
| -0.08 to +0.08 | **NEUTRAL** | No clear institutional bias |

### Market Regime Classification

| Condition | Regime | Interpretation |
|-----------|--------|----------------|
| Score ≥ 60 + LONG + OI rising | **ACCUMULATION** | Institutions quietly building long positions |
| Score ≥ 60 + SHORT + OI rising | **DISTRIBUTION** | Institutions distributing / building shorts |
| Score ≥ 40 + stable OI | **POSITIONING** | Institutions adjusting positions without conviction |
| All other | **NEUTRAL** | No clear institutional activity |

### Auto-Generated Market Brief

When Smart Score ≥ 50, the system generates a natural language intelligence brief:

> *"Smart money accumulating. Retail going short, longs getting paid."*

This condenses the 6-factor analysis into a single actionable sentence, making institutional positioning immediately understandable.

## API Endpoints

### 1. Top Trader Long/Short Account Ratio (Binance-Exclusive)

**Method:** `GET`
**URL:** `https://fapi.binance.com/futures/data/topLongShortAccountRatio`

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `symbol` | string | Yes | Trading pair (e.g., BTCUSDT) |
| `period` | string | Yes | Time period: 5m, 15m, 30m, 1h, 2h, 4h, 6h, 12h, 1d |
| `limit` | int | No | Number of records (default 30, max 500) |

**Response:**
```json
[{
  "symbol": "BTCUSDT",
  "longShortRatio": "1.8340",
  "longAccount": "0.6471",
  "shortAccount": "0.3529",
  "timestamp": 1709600000000
}]
```

### 2. Top Trader Long/Short Position Ratio (Binance-Exclusive)

**Method:** `GET`
**URL:** `https://fapi.binance.com/futures/data/topLongShortPositionRatio`

Same parameters and response format as Account Ratio, but measures by contract value rather than account count.

### 3. Global Long/Short Account Ratio

**Method:** `GET`
**URL:** `https://fapi.binance.com/futures/data/globalLongShortAccountRatio`

Same parameters. Represents ALL traders (retail-dominated).

### 4. Taker Buy/Sell Volume Ratio (Binance-Exclusive)

**Method:** `GET`
**URL:** `https://fapi.binance.com/futures/data/takerlongshortRatio`

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `symbol` | string | Yes | Trading pair |
| `period` | string | Yes | Time period |
| `limit` | int | No | Records count |

**Response:**
```json
[{
  "buySellRatio": "1.2500",
  "buyVol": "125000000",
  "sellVol": "100000000",
  "timestamp": 1709600000000
}]
```

### 5. Premium Index (Funding Rate)

**Method:** `GET`
**URL:** `https://fapi.binance.com/fapi/v1/premiumIndex`

**Response fields used:**
| Field | Description |
|-------|-------------|
| `lastFundingRate` | Current funding rate (decimal) |
| `markPrice` | Current mark price |
| `indexPrice` | Index (spot average) price |

### 6. Open Interest History

**Method:** `GET`
**URL:** `https://fapi.binance.com/futures/data/openInterestHist`

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `symbol` | string | Yes | Trading pair |
| `period` | string | Yes | Time period |
| `limit` | int | No | Records count (3 for trend detection) |

## Example: curl

```bash
# Factor 1 & 3: Top trader position ratio (BINANCE-EXCLUSIVE)
curl -s "https://fapi.binance.com/futures/data/topLongShortPositionRatio?symbol=BTCUSDT&period=1h&limit=1"
# → [{"longShortRatio":"1.834","longAccount":"0.647","shortAccount":"0.353",...}]

# Factor 2: Global retail L/S ratio
curl -s "https://fapi.binance.com/futures/data/globalLongShortAccountRatio?symbol=BTCUSDT&period=1h&limit=1"

# Factor 4: Taker buy/sell ratio (BINANCE-EXCLUSIVE)
curl -s "https://fapi.binance.com/futures/data/takerlongshortRatio?symbol=BTCUSDT&period=1h&limit=1"
# → [{"buySellRatio":"1.25","buyVol":"125000000","sellVol":"100000000",...}]

# Factor 5: Funding rate
curl -s "https://fapi.binance.com/fapi/v1/premiumIndex?symbol=BTCUSDT" | python3 -c "
import json, sys; d = json.load(sys.stdin)
print(f'Funding: {float(d[\"lastFundingRate\"])*10000:.1f} bps')
"

# Factor 6: OI history (3 periods for trend)
curl -s "https://fapi.binance.com/futures/data/openInterestHist?symbol=BTCUSDT&period=1h&limit=3"

# Complete Smart Money analysis in one script
python3 -c "
import requests, json

sym = 'BTCUSDT'
base = 'https://fapi.binance.com'

top_pos = requests.get(f'{base}/futures/data/topLongShortPositionRatio?symbol={sym}&period=1h&limit=1').json()
retail = requests.get(f'{base}/futures/data/globalLongShortAccountRatio?symbol={sym}&period=1h&limit=1').json()
taker = requests.get(f'{base}/futures/data/takerlongshortRatio?symbol={sym}&period=1h&limit=1').json()
premium = requests.get(f'{base}/fapi/v1/premiumIndex?symbol={sym}').json()

smart_ratio = float(top_pos[0]['longShortRatio'])
retail_ratio = float(retail[0]['longShortRatio'])
taker_ratio = float(taker[0]['buySellRatio'])
funding_bps = float(premium['lastFundingRate']) * 10000

print(f'{sym} Smart Money Analysis:')
print(f'  Smart L/S:  {smart_ratio:.3f} ({\"LONG\" if smart_ratio > 1 else \"SHORT\"} bias)')
print(f'  Retail L/S: {retail_ratio:.3f} ({\"LONG\" if retail_ratio > 1 else \"SHORT\"} bias)')
print(f'  Divergence: {smart_ratio - retail_ratio:+.3f}')
print(f'  Taker B/S:  {taker_ratio:.3f} ({\"buyers\" if taker_ratio > 1 else \"sellers\"} aggressive)')
print(f'  Funding:    {funding_bps:+.1f} bps ({\"longs pay\" if funding_bps > 0 else \"shorts pay\"})')
"
```

## Use Cases

1. **Signal Generation** — Use Smart Score ≥ 60 with LONG/SHORT direction as a high-conviction trading signal. The 6-factor confluence dramatically reduces false positives compared to single-indicator signals.

2. **Retail Fade Strategy** — When smart money divergence is high (Factor 3), take the institutional side. Historical evidence shows top traders consistently outperform retail positioning.

3. **Accumulation Detection** — Identify when institutions are quietly building positions (ACCUMULATION regime) before the move becomes obvious to retail.

4. **Risk Management** — When your existing position conflicts with smart money direction, consider reducing size or hedging.

5. **Funding Arbitrage Enhancement** — Combine funding signal (Factor 5) with smart money direction to identify funding arbitrage opportunities where the carry trade is also supported by institutional flow.

6. **Market Regime Timing** — Use regime classification to adjust strategy: trend-follow during ACCUMULATION/DISTRIBUTION, mean-revert during NEUTRAL.

## Dashboard Components

### Hero Card
Shows the #1 ranked signal with:
- Asset name and direction (LONG/SHORT)
- Smart Money Score (0-100) with color coding
- Factor agreement count (e.g., "5/6 factors aligned")
- Regime classification
- Auto-generated intelligence brief

### Summary Stats
- **Strong Signals**: Count of assets with Score ≥ 60
- **Smart Bullish**: Count of assets with LONG direction
- **Smart Bearish**: Count of assets with SHORT direction

### Asset Table
| Column | Description |
|--------|-------------|
| Symbol | Asset name |
| Signal | LONG / SHORT / NEUTRAL badge |
| Score | Visual bar + numeric score (0-100) |
| Regime | ACCUMULATION / DISTRIBUTION / POSITIONING / NEUTRAL |
| Factors | 6 factor badges showing individual direction: SM↑ RT↓ DV↑ TK↑ FN↑ OI↑ |
| 24h% | Price change for context |

## Notes

- All 6 endpoints are public and require no authentication
- 4 out of 6 data sources are exclusive to Binance (not available on any other exchange)
- Refresh interval: 25 seconds
- Default watchlist: 12 major futures pairs (BTC, ETH, BNB, SOL, XRP, DOGE, ADA, AVAX, LINK, LTC, APT, ARB)
- The system is designed around signal orthogonality — each factor measures a different market dimension to minimize correlated false positives
- Smart Money Score should be used in conjunction with technical analysis, not as a standalone trading system
- Historical backtesting suggests scores ≥ 70 with 5+ agreeing factors have the highest win rate
- During extreme volatility events, all factors may temporarily align regardless of smart money activity — use the OI Momentum factor as a filter for genuine position building vs panic-driven moves
