---
title: Composite Anomaly Detector
description: Real-time multi-signal anomaly detection system that fuses 6 independent market anomaly indicators into a unified severity-ranked alert dashboard for Binance futures markets
metadata:
  version: "1.0.0"
  author: mefai-dev
license: MIT
---

# Composite Anomaly Detector

## Overview

The Composite Anomaly Detector is a real-time market surveillance system that monitors 6 independent anomaly signals across Binance futures markets. Instead of relying on a single indicator, it fuses multiple uncorrelated data sources into a unified severity classification — enabling traders to identify unusual market conditions that single-metric dashboards would miss.

Inspired by composite fault detection systems in industrial monitoring, this skill treats each anomaly signal as an independent sensor. When multiple sensors trigger simultaneously, the probability of a genuine market event (rather than noise) increases dramatically.

## Architecture

### The 6 Anomaly Signals

| # | Signal | Source | Threshold | What It Detects |
|---|--------|--------|-----------|-----------------|
| 1 | VWAP Deviation | `ticker/24hr` | >1.5% from VWAP | Price diverging from volume-weighted fair value |
| 2 | Large Move | `ticker/24hr` | >8% 24h change | Abnormal price displacement |
| 3 | Funding Extreme | `premiumIndex` | >10 bps | Extreme leverage positioning |
| 4 | OI Spike | `openInterestHist` | >3% change | Rapid position buildup or liquidation cascade |
| 5 | Spread Anomaly | `bookTicker` (both) | >15 bps futures-spot gap | Market structure stress or arbitrage opportunity |
| 6 | Taker Flow | `takerlongshortRatio` | ratio >1.4 or <0.7 | Aggressive directional order flow imbalance |

### Severity Classification

| Level | Signals Firing | Interpretation |
|-------|---------------|----------------|
| CRITICAL | 4+ | Multiple simultaneous anomalies — high probability event |
| HIGH | 3 | Significant multi-dimensional stress |
| MEDIUM | 2 | Elevated activity, worth monitoring |
| LOW | 1 | Single anomaly, could be noise |
| NORMAL | 0 | All signals within normal ranges |

## API Endpoints

### 1. Futures 24h Ticker

Provides price, volume, VWAP, and change data for anomaly signals 1 and 2.

**Method:** `GET`
**URL:** `https://fapi.binance.com/fapi/v1/ticker/24hr`

**Response fields used:**
| Field | Type | Description |
|-------|------|-------------|
| `symbol` | string | Trading pair |
| `lastPrice` | string | Current price |
| `weightedAvgPrice` | string | 24h VWAP |
| `priceChangePercent` | string | 24h price change % |
| `quoteVolume` | string | 24h quote volume |

### 2. Premium Index

Provides funding rate data for anomaly signal 3.

**Method:** `GET`
**URL:** `https://fapi.binance.com/fapi/v1/premiumIndex`

**Response fields used:**
| Field | Type | Description |
|-------|------|-------------|
| `symbol` | string | Trading pair |
| `lastFundingRate` | string | Last funding rate (decimal) |

### 3. Book Ticker (Futures + Spot)

Compares best bid/ask across markets for anomaly signal 5.

**Method:** `GET`
**Futures URL:** `https://fapi.binance.com/fapi/v1/ticker/bookTicker`
**Spot URL:** `https://api.binance.com/api/v3/ticker/bookTicker`

**Response fields used:**
| Field | Type | Description |
|-------|------|-------------|
| `symbol` | string | Trading pair |
| `bidPrice` | string | Best bid price |
| `askPrice` | string | Best ask price |

### 4. Taker Buy/Sell Ratio

Measures aggressive order flow imbalance for anomaly signal 6.

**Method:** `GET`
**URL:** `https://fapi.binance.com/futures/data/takerlongshortRatio`

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `symbol` | string | Yes | Trading pair (e.g., BTCUSDT) |
| `period` | string | Yes | Time period (e.g., 1h) |
| `limit` | int | No | Number of records (default 1) |

### 5. Open Interest History

Tracks position buildup velocity for anomaly signal 4.

**Method:** `GET`
**URL:** `https://fapi.binance.com/futures/data/openInterestHist`

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `symbol` | string | Yes | Trading pair |
| `period` | string | Yes | Time period (e.g., 1h) |
| `limit` | int | No | Number of records (default 3) |

## Example: curl

```bash
# Fetch all futures tickers (bulk)
curl -s "https://fapi.binance.com/fapi/v1/ticker/24hr" | python3 -m json.tool | head -30

# Fetch premium index for funding rates
curl -s "https://fapi.binance.com/fapi/v1/premiumIndex" | python3 -m json.tool | head -20

# Fetch taker buy/sell ratio for BTC
curl -s "https://fapi.binance.com/futures/data/takerlongshortRatio?symbol=BTCUSDT&period=1h&limit=1"

# Fetch OI history for ETH
curl -s "https://fapi.binance.com/futures/data/openInterestHist?symbol=ETHUSDT&period=1h&limit=3"
```

## Use Cases

1. **Risk Management** — Identify when multiple stress signals converge, indicating heightened liquidation or flash crash risk
2. **Event Detection** — Detect coordinated market movements (listings, delistings, regulatory news) through multi-signal correlation
3. **Trading Signals** — Use CRITICAL severity as a high-conviction directional or hedging signal
4. **Market Surveillance** — Monitor portfolio assets for early warning of structural market changes
5. **Volatility Forecasting** — Track anomaly counts as a leading indicator of upcoming volatility regime changes

## Algorithm Details

### Signal Independence

Each of the 6 signals monitors a different market dimension:
- **Price** (VWAP, Move) — raw price behavior
- **Derivatives** (Funding, OI) — leverage and positioning
- **Microstructure** (Spread, Flow) — order book and execution

This orthogonality ensures that multi-signal triggers represent genuine market events rather than correlated noise from a single source.

### Severity Scoring

The severity classification follows a Bayesian-inspired approach: assuming each signal has a ~5-10% false positive rate, the probability of 4+ simultaneous false positives is astronomically low (<0.001%), making CRITICAL alerts highly reliable.

## Notes

- All endpoints are public and require no authentication
- Refresh interval: 30 seconds (configurable)
- Default watchlist: 12 major futures pairs (BTC, ETH, BNB, SOL, XRP, DOGE, ADA, AVAX, LINK, LTC, APT, ARB)
- Thresholds are calibrated for major pairs; low-cap assets may trigger more frequently
- The system is additive: additional anomaly signals can be integrated without architectural changes
