---
title: Mercury Metaballs
description: Real-time 3D liquid metal visualization that clusters 52 Binance Futures trading pairs into 11 mercury-like metaballs using MarchingCubes algorithm. Each chrome blob represents a market sector (BTC, ETH, DeFi, Meme, AI, etc.) with organic merge/split behavior driven by composite score similarity, orbital dynamics from ATR volatility, and funding-rate vertical displacement. Post-processing bloom creates cinematic liquid metal aesthetics.
metadata:
  version: 1.0.0
  author: mefai-dev
license: MIT
---

# Mercury Metaballs

A Three.js MarchingCubes-powered 3D visualization that renders live market intelligence as chrome liquid metal blobs. 52 trading pairs are clustered into 11 sector groups — each blob's size, orbit, speed, color, and merge behavior is driven by real-time data from 5 Binance intelligence endpoints. Similar clusters naturally merge; diverging clusters split apart. Post-processing UnrealBloom creates cinematic liquid metal reflections.

**Live Demo:** [mefai.io/superbsc/mercury](https://mefai.io/superbsc/mercury)

## Overview

Mercury Metaballs groups ~52 Binance Futures pairs into 11 market sector clusters (BTC, ETH, Major L1, DeFi, Meme, AI, Gaming, Layer 2, New Gen, Infra, Other). Each cluster becomes a chrome metaball orbiting in 3D space. The MarchingCubes algorithm naturally merges blobs with similar composite scores and splits apart diverging sectors — creating an organic, living visualization of market correlation and divergence.

### Visual Encoding

| Visual Property | Data Source | Encoding |
|----------------|-------------|----------|
| Blob size (strength) | Significance x cluster weight | BTC largest (3.0x) → Other smallest (0.7x) |
| Orbit radius | ATR (volatility) | Higher ATR → outer orbit |
| Orbit speed | Market regime | VOLATILE_BREAKOUT 1.5x, TRENDING 1.2x, RANGING 0.7x |
| Y position | Funding rate | Positive funding → above center, negative → below |
| Color tint | Composite score (HSL) | Green (bullish) → Yellow (neutral) → Red (bearish) |
| Bloom glow | Extreme conditions | High funding or volatile regime → stronger glow |
| Merge/split | Composite similarity | Similar scores → blobs merge (MarchingCubes natural) |
| Glow sphere | Extreme funding/volatility | Pulsing halo around extreme clusters |
| Label badge | Cluster identity | Floating name + score overlay per blob |
| Orbital ring | ATR-scaled radius | Ground-plane ring showing orbit path |
| Volatile bounce | VOLATILE_BREAKOUT regime | Extra vertical oscillation |

### Cluster Composition

| Cluster | Symbols | Weight |
|---------|---------|--------|
| BTC | BTCUSDT | 3.0 |
| ETH | ETHUSDT | 2.5 |
| Major L1 | SOL, BNB, XRP, ADA, AVAX, DOT, NEAR, ATOM | 1.8 |
| DeFi | AAVE, UNI, LINK, MKR, CRV, LDO, PENDLE, COMP, SNX, SSV | 1.2 |
| Meme | DOGE, WIF, BLUR | 1.0 |
| AI | FET, RNDR | 1.1 |
| Gaming | SAND, MANA, GALA, AXS | 0.9 |
| Layer 2 | ARB, OP, MATIC, STX | 1.0 |
| New Gen | APT, SUI, SEI, TIA, JUP, INJ | 1.0 |
| Infra | FIL, ALGO, FTM, LTC, CFX, KAS | 0.8 |
| Other | EIGEN, ENA, ORDI, RUNE, ONDO, WOO, DYDX | 0.7 |

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

### MarchingCubes Liquid Metal Engine
- 11 metaballs at resolution 28 (~8K triangles) for 60fps performance
- MeshStandardMaterial with metalness:1.0, roughness:0.015 for chrome appearance
- PMREMGenerator procedural environment map (8-panel studio lighting, no external files)
- Vertex colors blended with HSL composite-to-chrome gradient
- ACESFilmic tone mapping with exposure 1.3

### Organic Merge/Split Behavior
- Clusters with similar composite scores (< 8 point difference) naturally merge via MarchingCubes isosurface
- Diverging clusters (> 25 point difference) visually split apart
- Real-time merge/split count displayed in metrics bar
- Market correlation percentage derived from cluster composite spread

### Interactive Elements
- **Hover**: Raycast MarchingCubes mesh → nearest cluster center → tooltip with symbols, composite, bias, funding, regime, ATR, weight
- **Click**: Detail sidebar with cluster overview, market data, bull/bear forces, symbol breakdown
- **Orbit**: Mouse drag with damping, auto-rotation scaled by market ATR
- **Glow spheres**: Pulsing halos on extreme-condition clusters (volatile breakout, high funding)

### Visual Layers
- 4000 background stars with cool-tinted vertex colors
- 800 stream particles converging toward metaball center
- Floating canvas-texture label badges per cluster (name + score)
- Orbital rings on ground plane showing each cluster's orbit path
- Concentric ground rings (reflective dark metallic plane)
- CSS animated data stream lines sweeping across canvas

### Post-Processing Pipeline
- EffectComposer with RenderPass + UnrealBloomPass (strength 0.5, radius 0.6, threshold 0.82)
- Dynamic bloom intensity: increases during extreme market conditions
- Adaptive FPS monitoring: auto-disables bloom below 28fps, re-enables above 42fps
- Emissive material pulse on hover interaction

### Data Fly Particles
- DOM particles spawning from corner overlays
- Targeted to actual 3D cluster positions (projected to 2D screen coordinates)
- Color-coded by data type: regime (green/red), funding (green/red), ATR (silver), composite (gradient)

### Side Panels
- **Market Pulse**: Top 30 symbols with composite scores and bias indicators
- **Buy/Sell Signals**: Live signal generation every 3 seconds
- **Cluster Scanner**: All 11 clusters with composite, regime, symbol count

### Corner Overlays
- **Top-left**: Regime states per symbol
- **Top-right**: Extreme funding rates
- **Bottom-left**: Basis spread percentages
- **Bottom-right**: Cluster correlation summary

### Metrics Bar
Real-time aggregate metrics: Composite, Funding, Bull/Bear count, Regime, Clusters, Merging, Splitting, Volatility, Correlation

## Technical Stack

| Component | Technology |
|-----------|-----------|
| 3D Engine | Three.js v0.162.0 (ES module via CDN importmap) |
| Metaballs | MarchingCubes (three/addons/objects/MarchingCubes.js) |
| Material | MeshStandardMaterial (metalness:1, roughness:0.015, envMap) |
| Env Map | PMREMGenerator procedural (8-panel studio, no external files) |
| Post-process | EffectComposer + UnrealBloomPass (adaptive) |
| Controls | OrbitControls with auto-rotate + damping |
| Data | 5 parallel fetch calls with Promise.all |
| Refresh | 30-second interval with cluster rebuild |
| Styling | Standalone CSS with Mercury deep-space theme |
| Mobile | Desktop-only with graceful fallback message |

## Architecture

```
Browser (Three.js + Vanilla JS, zero framework dependencies)
    |
    +-- 3D Scene (WebGL Canvas, ACES tone mapping)
    |   +-- Stars (4000 particles, cool-tinted)
    |   +-- Ground plane (reflective metallic + concentric rings)
    |   +-- Stream particles (800, converging inward)
    |   +-- MarchingCubes mesh (11 metaballs, chrome material)
    |   +-- Glow spheres (per-cluster, pulsing on extremes)
    |   +-- Label sprites (canvas-texture badges with name + score)
    |   +-- Orbital rings (per-cluster, ATR-scaled)
    |   +-- Procedural env map (8-panel studio lighting)
    |   +-- 5 point/directional lights (gold, green, red, silver, blue rim)
    |   +-- UnrealBloom post-processing (adaptive)
    |
    +-- DOM Overlays
    |   +-- Corner data panels (regime/funding/basis/correlation)
    |   +-- Data fly particles (corner -> 3D cluster projection)
    |   +-- Tooltip (hover, proximity-based)
    |   +-- Detail sidebar (click, cluster/symbol breakdown)
    |
    +-- Side Panels
        +-- Market Pulse feed (top 30 symbols)
        +-- Buy/Sell Signal feed
        +-- Cluster Scanner feed (11 sectors)
    |
    v
FastAPI Proxy -> Binance Intelligence APIs (5 endpoints, 30s cache)
```

## File Structure

```
frontend/
+-- mercury.html        # Standalone page (importmap + canvas + panels)
+-- css/mercury.css     # Deep-space theme CSS (mercury silver accents)
+-- js/mercury.js       # MarchingCubes visualization engine

proxy/
+-- main.py             # /mercury route handler
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

Navigate to `http://localhost:8000/mercury`

## Parameters

### Intelligence API Endpoints

All endpoints are GET requests with no authentication required.

* **top_n**: Number of results to return (default: 50, used in funding-scan and basis-spread)

### Enums

* **regime**: TRENDING | RANGING | VOLATILE_BREAKOUT | ACCUMULATION
* **bias**: BULLISH | BEARISH | NEUTRAL
* **state**: CONTANGO | BACKWARDATION | FLAT
* **signal**: STRONG | MODERATE | WEAK

## Performance

| Metric | Value |
|--------|-------|
| MarchingCubes resolution | 28 |
| Active metaballs | 11 |
| Triangle count | ~8,000 |
| Target FPS | 60fps |
| Draw calls | 1 (single MarchingCubes mesh) |
| Bloom auto-disable | Below 28fps |
| Env map | Procedural (one-time render at startup) |

## Source Code

- **Repository**: [github.com/mefai-dev/superbsc-](https://github.com/mefai-dev/superbsc-)
- **Live Demo**: [mefai.io/superbsc/mercury](https://mefai.io/superbsc/mercury)
