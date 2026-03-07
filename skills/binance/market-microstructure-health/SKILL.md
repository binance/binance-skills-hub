---
title: Market Microstructure Health Index
description: Continuous health monitoring system that fuses 5 market microstructure metrics into a single composite health score with letter grades for each Binance futures pair
metadata:
  version: "1.0.0"
  author: mefai-dev
license: MIT
---

# Market Microstructure Health Index

## Overview

The Market Microstructure Health Index provides continuous quality monitoring for Binance futures markets by combining 5 independent microstructure metrics into a single health score (0-100) with intuitive letter grades (A through F).

Unlike simple spread or volume indicators, this system evaluates the structural integrity of a market from multiple angles — measuring how tight spreads are, how aligned spot and futures prices remain, how stable funding rates are, how balanced buyer/seller flow is, and how smoothly open interest evolves.

The result is a single number that answers: "How healthy is this market right now?"

## Architecture

### The 5 Health Metrics

Each metric starts from a base score of 100 and applies penalties proportional to stress:

| # | Metric | Max Penalty | Source | What It Measures |
|---|--------|-------------|--------|------------------|
| 1 | Spread Quality | -30 | `bookTicker` (futures) | Bid-ask tightness in basis points |
| 2 | Spot-Futures Alignment | -20 | `bookTicker` (both) | Price consistency across markets |
| 3 | Funding Stability | -20 | `premiumIndex` | Leverage positioning balance |
| 4 | Taker Balance | -15 | `takerlongshortRatio` | Buy/sell flow equilibrium |
| 5 | OI Stability | -15 | `openInterestHist` | Position change smoothness |

**Total possible penalty: -100 (score range: 0-100)**

### Health Score Calculation

```
Health Score = 100 - Spread Penalty - Gap Penalty - Funding Penalty - Taker Penalty - OI Penalty

Where:
  Spread Penalty  = min(30, spread_bps × 3)
  Gap Penalty     = min(20, sf_gap_bps × 0.5)
  Funding Penalty = min(20, |funding_bps| × 1.5)
  Taker Penalty   = min(15, |taker_ratio - 1| × 30)
  OI Penalty      = min(15, oi_volatility% × 3)
```

### Letter Grade Scale

| Grade | Score Range | Interpretation |
|-------|------------|----------------|
| A | 80-100 | Excellent microstructure, tight spreads, balanced flow |
| B | 60-79 | Good quality, minor stress indicators |
| C | 40-59 | Moderate stress, some metrics elevated |
| D | 20-39 | Poor quality, multiple stress signals |
| F | 0-19 | Severe microstructure breakdown |

## Metric Details

### 1. Spread Quality (Max Penalty: -30)

Measures the futures bid-ask spread in basis points. Tighter spreads indicate better liquidity and lower execution costs.

```
spread_bps = ((ask - bid) / midpoint) × 10000
penalty = min(30, spread_bps × 3)
```

- BTC/ETH typically: 0.1-0.5 bps → penalty 0-1.5
- Mid-caps: 1-3 bps → penalty 3-9
- Stressed: 5+ bps → penalty 15-30

### 2. Spot-Futures Alignment (Max Penalty: -20)

Measures the price gap between spot and futures mid-prices. Large gaps indicate arbitrage pressure or market stress.

```
sf_gap_bps = |((futures_mid - spot_mid) / spot_mid)| × 10000
penalty = min(20, sf_gap_bps × 0.5)
```

- Normal: 0-5 bps → penalty 0-2.5
- Elevated: 10-20 bps → penalty 5-10
- Stressed: 30+ bps → penalty 15-20

### 3. Funding Stability (Max Penalty: -20)

Measures how far the funding rate deviates from neutral (0%). Extreme funding indicates leveraged crowding.

```
funding_bps = |last_funding_rate| × 10000
penalty = min(20, funding_bps × 1.5)
```

- Normal (0.01%): ~1 bps → penalty 1.5
- Elevated (0.05%): ~5 bps → penalty 7.5
- Extreme (0.1%+): ~10+ bps → penalty 15-20

### 4. Taker Balance (Max Penalty: -15)

Measures how balanced aggressive buy vs sell orders are. A ratio near 1.0 indicates equilibrium.

```
deviation = |taker_buy_sell_ratio - 1.0|
penalty = min(15, deviation × 30)
```

- Balanced (0.95-1.05): penalty 0-1.5
- Mild imbalance (0.8-1.2): penalty 6
- Strong imbalance (0.5 or 1.5): penalty 15

### 5. OI Stability (Max Penalty: -15)

Measures the average percentage change in open interest over recent periods. Rapid OI changes indicate position buildup or liquidation cascades.

```
oi_volatility = avg(|OI_change_%| over 3 periods)
penalty = min(15, oi_volatility × 3)
```

- Stable (<1% change): penalty 0-3
- Active (2-3% change): penalty 6-9
- Volatile (5%+ change): penalty 15

## API Endpoints

### 1. Futures 24h Ticker

**Method:** `GET`
**URL:** `https://fapi.binance.com/fapi/v1/ticker/24hr`

Provides price change data for context (24h% column).

### 2. Futures Book Ticker

**Method:** `GET`
**URL:** `https://fapi.binance.com/fapi/v1/ticker/bookTicker`

Provides best bid/ask for futures spread calculation.

### 3. Spot Book Ticker

**Method:** `GET`
**URL:** `https://api.binance.com/api/v3/ticker/bookTicker`

Provides best bid/ask for spot-futures alignment calculation.

### 4. Premium Index

**Method:** `GET`
**URL:** `https://fapi.binance.com/fapi/v1/premiumIndex`

Provides funding rate for stability metric.

### 5. Taker Buy/Sell Ratio

**Method:** `GET`
**URL:** `https://fapi.binance.com/futures/data/takerlongshortRatio`

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `symbol` | string | Yes | Trading pair |
| `period` | string | Yes | Time period (1h) |

### 6. Open Interest History

**Method:** `GET`
**URL:** `https://fapi.binance.com/futures/data/openInterestHist`

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `symbol` | string | Yes | Trading pair |
| `period` | string | Yes | Time period (1h) |
| `limit` | int | No | Records to return (3) |

## Example: curl

```bash
# Futures book ticker for spread analysis
curl -s "https://fapi.binance.com/fapi/v1/ticker/bookTicker" | python3 -c "
import json, sys
data = json.load(sys.stdin)
for t in data:
    if t['symbol'] == 'BTCUSDT':
        bid, ask = float(t['bidPrice']), float(t['askPrice'])
        mid = (bid + ask) / 2
        spread_bps = ((ask - bid) / mid) * 10000
        print(f\"BTC Spread: {spread_bps:.2f} bps\")
"

# Spot book ticker for alignment check
curl -s "https://api.binance.com/api/v3/ticker/bookTicker?symbol=BTCUSDT"

# Funding rate
curl -s "https://fapi.binance.com/fapi/v1/premiumIndex?symbol=BTCUSDT" | python3 -c "
import json, sys
d = json.load(sys.stdin)
print(f\"Funding: {float(d['lastFundingRate'])*10000:.1f} bps\")
"

# Taker ratio
curl -s "https://fapi.binance.com/futures/data/takerlongshortRatio?symbol=BTCUSDT&period=1h&limit=1"

# OI history
curl -s "https://fapi.binance.com/futures/data/openInterestHist?symbol=BTCUSDT&period=1h&limit=3"
```

## Use Cases

1. **Execution Quality Assessment** — Check health score before entering a large position; Grade A markets offer the best fills and lowest slippage
2. **Market Stress Early Warning** — Deteriorating health scores across multiple assets signal systemic stress before price moves
3. **Pair Selection** — When choosing between similar setups, prefer the asset with the higher health score for better execution
4. **Liquidity Monitoring** — Track how health scores change across trading sessions (Asian, European, US) to optimize execution timing
5. **Risk-Adjusted Position Sizing** — Scale position size inversely with health deterioration; smaller positions in Grade D/F markets
6. **Market Comparison** — Compare microstructure quality across assets to identify the most efficiently traded pairs

## Dashboard Interpretation

### Summary Row
- **Healthy**: Count of pairs with Grade A (score >= 80)
- **Avg Score**: Average health score across all monitored pairs
- **Stressed**: Count of pairs with score < 50

### Table Columns
| Column | Description |
|--------|-------------|
| Symbol | Asset name |
| Grade | Letter grade badge (A/B/C/D/F) with color coding |
| Health | Visual bar + numeric score (0-100) |
| Penalties | Breakdown of which metrics are penalizing: SPR (spread), GAP (spot-futures), FND (funding), TKR (taker), OI (open interest). Red badges indicate penalties > 5 points |
| 24h% | Price change for context |

## Notes

- All endpoints are public and require no authentication
- Refresh interval: 20 seconds (more frequent than other panels due to microstructure sensitivity)
- Default watchlist: 12 major futures pairs
- Health scores are relative to the calibrated thresholds; absolute values depend on market conditions
- Grade A does not mean "buy" — it means the market structure is healthy for trading
- The penalty breakdown helps identify the specific source of market stress
- During exchange maintenance or extreme volatility, scores may temporarily drop across all assets
