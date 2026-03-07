---
title: Momentum Cascade Tracker
description: Track how price momentum propagates across crypto assets in real-time, identifying which coins lead, lag, amplify, or diverge from BTC-driven market moves
metadata:
  version: "1.0.0"
  author: mefai-dev
license: MIT
---

# Momentum Cascade Tracker

## Overview

The Momentum Cascade Tracker analyzes how price momentum propagates across crypto assets in real-time. In crypto markets, BTC typically moves first, followed by large-caps, then mid-caps — but the speed, direction, and amplification of this cascade varies dramatically between assets and market regimes.

This skill classifies each asset's relationship to BTC's momentum across multiple timeframes, revealing which coins are **leading** (moving before BTC catches up), **tracking** (following in sync), **lagging** (delayed response), or **diverging** (moving independently).

## Architecture

### Multi-Timeframe Momentum Comparison

The system compares momentum across three timeframes using rolling window tickers:

| Timeframe | Source | Purpose |
|-----------|--------|---------|
| 1 hour | `spot/ticker` (1h window) | Recent momentum direction |
| 4 hours | `spot/ticker` (4h window) | Medium-term trend |
| 24 hours | `futures/ticker24hr` | Full-day context |

### Role Classification Algorithm

Each asset is classified based on its momentum relationship to BTC:

```
BTC Ratio = BTC_1h_change / BTC_4h_change    (BTC's momentum acceleration)
Alt Ratio = ALT_1h_change / ALT_4h_change    (Alt's momentum acceleration)
Lead/Lag  = Alt Ratio / BTC Ratio             (relative acceleration)

If Lead/Lag > 1.3  → LEADING   (moving faster than BTC recently)
If Lead/Lag < 0.7  → LAGGING   (responding slower than BTC)
If same direction  → TRACKING  (moving in sync)
If opposite dir    → DIVERGING (decoupled from BTC)
BTC itself         → LEADER    (reference asset)
```

### Amplification Factor

Measures how much each asset amplifies BTC's moves:

```
Amp_1h = ALT_1h_change / BTC_1h_change
Amp_4h = ALT_4h_change / BTC_4h_change

Amp > 2.0x  → High beta, amplifying BTC moves
Amp ≈ 1.0x  → Moving proportionally to BTC
Amp < 0.5x  → Dampened response to BTC
Amp < 0     → Moving opposite to BTC
```

### Cascade Score

A composite metric combining correlation strength, amplification magnitude, and lead/lag positioning:

```
Cascade Score = |Amp_1h| × (leadLag > 1 ? 1.5 : 0.8) × (followsBTC ? 1.0 : 0.5)
```

Higher scores indicate assets most actively participating in the current market cascade.

## API Endpoints

### 1. Spot Rolling Window Ticker

Provides price change data for custom time windows (1h, 4h).

**Method:** `GET`
**URL:** `https://api.binance.com/api/v3/ticker`

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `symbols` | string | Yes | JSON array of symbols, e.g., `["BTCUSDT","ETHUSDT"]` |
| `windowSize` | string | Yes | Rolling window size: `1h`, `4h`, `1d`, etc. |

**Response fields used:**
| Field | Type | Description |
|-------|------|-------------|
| `symbol` | string | Trading pair |
| `priceChangePercent` | string | Price change % over the window |
| `priceChange` | string | Absolute price change |
| `weightedAvgPrice` | string | VWAP over the window |

**Example:**
```bash
curl -s "https://api.binance.com/api/v3/ticker?symbols=%5B%22BTCUSDT%22,%22ETHUSDT%22%5D&windowSize=1h"
```

### 2. Futures 24h Ticker

Provides full-day price change context for all futures pairs.

**Method:** `GET`
**URL:** `https://fapi.binance.com/fapi/v1/ticker/24hr`

**Response fields used:**
| Field | Type | Description |
|-------|------|-------------|
| `symbol` | string | Trading pair |
| `priceChangePercent` | string | 24h price change % |
| `lastPrice` | string | Current price |
| `volume` | string | 24h volume |

## Example: curl

```bash
# 1h rolling window for multiple symbols
curl -s "https://api.binance.com/api/v3/ticker?symbols=%5B%22BTCUSDT%22,%22ETHUSDT%22,%22SOLUSDT%22%5D&windowSize=1h"

# 4h rolling window
curl -s "https://api.binance.com/api/v3/ticker?symbols=%5B%22BTCUSDT%22,%22ETHUSDT%22,%22SOLUSDT%22%5D&windowSize=4h"

# Futures 24h tickers
curl -s "https://fapi.binance.com/fapi/v1/ticker/24hr" | python3 -c "
import json, sys
data = json.load(sys.stdin)
for t in data:
    if t['symbol'] in ['BTCUSDT','ETHUSDT','SOLUSDT']:
        print(f\"{t['symbol']}: {t['priceChangePercent']}%\")
"
```

## Use Cases

1. **Cascade Trading** — Enter positions on lagging assets when BTC momentum is strong and cascade pattern is established
2. **Divergence Detection** — Identify assets decoupling from the market for potential mean-reversion or trend-change signals
3. **Beta Management** — Select high-amplification assets for leveraged BTC exposure, or low-amp assets for relative stability
4. **Lead Indicator Discovery** — Find altcoins that consistently lead BTC moves (potential early warning signals)
5. **Portfolio Construction** — Balance portfolio between leading, tracking, and diverging assets for optimal risk-adjusted returns
6. **Market Regime Detection** — When most assets are TRACKING with high amplification, the market is in a correlated trend; when many DIVERGE, sector rotation may be occurring

## Interpreting the Dashboard

### Summary Stats
- **Leading BTC**: Count of assets currently moving faster than BTC
- **BTC 1h**: BTC's current 1-hour momentum (sets the reference)
- **Diverging**: Count of assets moving independently from BTC

### Table Columns
| Column | Description |
|--------|-------------|
| Symbol | Asset name |
| Role | LEADER / LEADING / TRACKING / LAGGING / DIVERGING |
| 1h% | 1-hour price change |
| 4h% | 4-hour price change |
| Amp | Amplification factor vs BTC (1h timeframe) |
| 24h% | Full-day price change for context |

## Notes

- All endpoints are public and require no authentication
- Refresh interval: 30 seconds
- Default watchlist: 16 assets (BTC, ETH, BNB, SOL, XRP, DOGE, ADA, AVAX, LINK, LTC, APT, ARB, OP, SUI, INJ, NEAR)
- Uses `api/v3/ticker` with custom `windowSize` parameter — a powerful but underutilized Binance API feature
- The cascade effect is strongest during high-volume trending periods; during low-volume chop, most assets show DIVERGING
- BTC is always classified as LEADER (reference asset) and excluded from lead/lag calculations
