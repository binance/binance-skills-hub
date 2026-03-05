---
title: Market DNA Helix
description: Real-time 3D double-helix visualization that encodes live market intelligence from 5 Binance intelligence endpoints into an interactive DNA structure. Each trading pair becomes a node on the helix with visual encoding of smart money scores, funding rates, regime states, basis spreads, and accumulation signals.
metadata:
  version: 1.0.0
  author: mefai-dev
license: MIT
---

# Market DNA Helix

A Three.js-powered 3D double-helix visualization that maps real-time market intelligence data onto an interactive DNA structure. Combines 5 Binance intelligence endpoints into a single unified view where each trading pair becomes a node on the helix, visually encoding composite scores, funding dynamics, market regimes, and accumulation patterns.

**Live Demo:** [mefai.io/superbsc/dna](https://mefai.io/superbsc/dna)

## Overview

Market DNA renders ~50 trading pairs as nodes on a rotating 3D double helix. The bull strand (green) and bear strand (red) form the backbone. Each node's color, size, glow, and branches encode different market signals. Data fly particles stream from corner overlay panels directly to their corresponding nodes in real time.

### Visual Encoding

| Visual Property | Data Source | Encoding |
|----------------|-------------|----------|
| Node color | Smart Money composite (0-100) | Green (bullish) → Yellow (neutral) → Red (bearish) |
| Node size | Market significance rank | BTC largest → altcoins smallest |
| Glow effect | Extreme funding or VOLATILE_BREAKOUT regime | Pulsing halo |
| Rung color | Basis spread state | Green (contango) / Red (backwardation) / Gray (flat) |
| RSI branch | RSI indicator | Green (<30) / Yellow (30-70) / Red (>70) |
| MACD branch | MACD momentum | Green (positive) / Red (negative) |
| Funding branch | Funding rate | Green (negative/longs paid) / Red (positive/shorts paid) |
| OI branch | Open interest change | Green (rising) / Red (falling) |
| Twist speed | Average ATR across market | Higher volatility = faster rotation |

## Data Sources

Five parallel API calls, refreshed every 30 seconds:

| Endpoint | Data Used | Authentication |
|----------|-----------|----------------|
| `/api/intelligence/smart-money` (GET) | Composite score, bias, 6-factor breakdown | No |
| `/api/intelligence/funding-scan?top_n=50` (GET) | Funding rate, direction, annualized APR | No |
| `/api/intelligence/regime` (GET) | Market regime, ATR%, ADX, volume change | No |
| `/api/intelligence/basis-spread?top_n=50` (GET) | Basis %, contango/backwardation state | No |
| `/api/intelligence/accumulation` (GET) | Accumulation composite, signal, sub-scores | No |

### Response Structure

#### Smart Money Radar
```json
{
  "tool": "smart_money_radar",
  "count": 12,
  "results": [
    {
      "symbol": "BTCUSDT",
      "composite": 78.5,
      "bias": "BULLISH",
      "factors": {
        "top_position_ratio": 0.85,
        "top_account_ratio": 1.0,
        "global_ls_ratio": 0.92,
        "taker_ratio": 0.12,
        "oi_trend": 0.65,
        "price_momentum": 0.23
      }
    }
  ]
}
```

#### Funding Scan
```json
{
  "results": [
    {
      "symbol": "BTCUSDT",
      "funding_rate": -0.0042,
      "direction": "LONGS_PAID",
      "annualized_apr": -15.3
    }
  ],
  "summary": {
    "avg_rate_pct": -0.0018,
    "positive_count": 8,
    "negative_count": 4
  }
}
```

#### Regime Detection
```json
{
  "results": [
    {
      "symbol": "BTCUSDT",
      "regime": "TRENDING",
      "indicators": {
        "atr_pct": 1.82,
        "adx": 32.5,
        "volume_change_pct": 15.3
      }
    }
  ],
  "regime_summary": {
    "TRENDING": ["BTCUSDT", "ETHUSDT"],
    "RANGING": ["BNBUSDT", "XRPUSDT"],
    "VOLATILE_BREAKOUT": ["DOGEUSDT"]
  }
}
```

#### Basis Spread
```json
{
  "results": [
    {
      "symbol": "BTCUSDT",
      "basis_pct": 0.045,
      "state": "CONTANGO"
    }
  ],
  "summary": {
    "contango_count": 8,
    "backwardation_count": 3
  }
}
```

#### Accumulation
```json
{
  "results": [
    {
      "symbol": "BTCUSDT",
      "composite": 72.3,
      "signal": "STRONG",
      "scores": {
        "volume_surge": 0.85,
        "oi_buildup": 0.72,
        "stealth_mode": 0.61,
        "buyer_aggression": 0.78
      }
    }
  ]
}
```

## Features

### 3D Helix Structure
- Double helix with bull (green) and bear (red) backbone strands
- Inner accent helix (gold/gray) and outer structural helix
- CatmullRomCurve3 → TubeGeometry for smooth curves
- ~50 nodes with market-significance-based sizing

### Interactive Elements
- **Hover**: Tooltip with composite, RSI, MACD, funding, regime
- **Click**: Detail sidebar with full 6-section breakdown (Smart Money, RSI/MACD, Funding, Regime, Basis, Accumulation, DNA Forces)
- **Orbit**: Mouse drag to rotate, scroll to zoom, auto-rotation

### Data Stream Visualization
- 800 particle points flying inward toward the helix (Three.js Points)
- DOM data fly labels spawning from corner overlays to specific node screen positions
- CSS animated stream lines sweeping across the canvas

### Side Panels
- **Smart Money Flow**: Composite scores with bar indicators
- **Buy/Sell Signals**: Live signal generation every 3 seconds
- **Accumulation Scanner**: Accumulation composite with signal strength

### Corner Overlays
- **Top-left**: Regime states per symbol
- **Top-right**: Extreme funding rates
- **Bottom-left**: Basis spread percentages
- **Bottom-right**: RSI and MACD values

### Metrics Bar
Real-time aggregate metrics: Composite, Funding, Bull/Bear count, Regime, RSI, MACD, ATR, Volume, Basis

## Technical Stack

| Component | Technology |
|-----------|-----------|
| 3D Engine | Three.js v0.162.0 (ES module via CDN importmap) |
| Controls | OrbitControls with auto-rotate |
| Rendering | WebGL with antialias, fog, multi-point lighting |
| Data | 5 parallel fetch calls with Promise.all |
| Refresh | 30-second interval with full helix rebuild |
| Styling | Standalone CSS with Binance theme variables |
| Mobile | Desktop-only with graceful fallback message |

## Architecture

```
Browser (Three.js + Vanilla JS, zero framework dependencies)
    │
    ├── 3D Scene (WebGL Canvas)
    │   ├── Stars (4000 particles)
    │   ├── Grid rings (ground plane)
    │   ├── Stream particles (800, flying inward)
    │   ├── Main helix (bull + bear backbone tubes)
    │   ├── Inner helix (accent)
    │   ├── Outer helix (structural)
    │   ├── Nodes (~50 spheres with significance sizing)
    │   ├── Rungs (basis-colored connections)
    │   ├── Branches (RSI/MACD/OI/Funding per node)
    │   ├── Glow spheres (extreme conditions)
    │   └── Labels (canvas-texture sprites)
    │
    ├── DOM Overlays
    │   ├── Corner data panels (regime/funding/basis/RSI)
    │   ├── Data fly particles (corner → node projection)
    │   ├── Tooltip (hover)
    │   └── Detail sidebar (click)
    │
    └── Side Panels
        ├── Smart Money Flow feed
        ├── Buy/Sell Signal feed
        └── Accumulation Scanner feed
    │
    v
FastAPI Proxy → Binance Intelligence APIs (5 endpoints, 30s cache)
```

## File Structure

```
frontend/
├── dna.html           # Standalone page (importmap + canvas + panels)
├── css/dna.css        # Theme-matched CSS (no main.css dependency)
└── js/dna.js          # Three.js visualization engine

proxy/
└── main.py            # /dna route handler
```

## Quick Start

```bash
# Clone the terminal
git clone https://github.com/mefai-dev/superbsc-.git
cd superbsc-

# Install dependencies
pip install fastapi uvicorn httpx python-dotenv

# Run
make dev
```

Navigate to `http://localhost:8000/dna`

## Parameters

### Intelligence API Endpoints

All endpoints are GET requests with no authentication required.

* **top_n**: Number of results to return (default: 50, used in funding-scan and basis-spread)

### Enums

* **regime**: TRENDING | RANGING | VOLATILE_BREAKOUT | ACCUMULATION
* **bias**: BULLISH | BEARISH | NEUTRAL
* **state**: CONTANGO | BACKWARDATION | FLAT
* **signal**: STRONG | MODERATE | WEAK

## Source Code

- **Repository**: [github.com/mefai-dev/superbsc-](https://github.com/mefai-dev/superbsc-)
- **Live Demo**: [mefai.io/superbsc/dna](https://mefai.io/superbsc/dna)
