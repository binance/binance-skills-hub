---
title: Liquidation Heatmap
description: |
  Estimate liquidation price levels by combining futures premium index, open interest changes,
  long/short account ratios, and funding rate data. Identifies crowded leverage zones where
  cascading liquidations are most likely to occur.
metadata:
  version: "1.0.0"
  author: mefai-dev
license: MIT
---

# Liquidation Heatmap

Predict high-probability liquidation zones by analyzing leverage crowding, funding rate extremes, and long/short imbalances across Binance USDM Futures.

## Why This Matters

Cascading liquidations are the primary driver of extreme price moves in crypto futures. When leveraged positions cluster at similar price levels, a small move can trigger a chain reaction. This skill identifies those danger zones before they trigger.

No single API endpoint tells you where liquidations will happen. This skill combines 3 independent data sources to estimate liquidation clusters.

---

## Data Sources

### 1. Premium Index (Funding + Mark Price)

```
GET https://fapi.binance.com/fapi/v1/premiumIndex
```

**Parameters:**

| Parameter | Required | Default | Description |
|-----------|----------|---------|-------------|
| `symbol` | No | — | Specific pair (e.g., `BTCUSDT`). Omit for all symbols. |

**Response Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `symbol` | string | Trading pair |
| `markPrice` | string | Current mark price |
| `lastFundingRate` | string | Last funding rate (decimal, e.g., `0.0001` = 0.01%) |
| `nextFundingTime` | number | Next funding timestamp (ms) |
| `interestRate` | string | Interest rate component |
| `indexPrice` | string | Index price from spot exchanges |
| `estimatedSettlePrice` | string | Estimated settlement price |

**Example:**

```bash
# Get all futures premium indices
curl "https://fapi.binance.com/fapi/v1/premiumIndex"

# Single symbol
curl "https://fapi.binance.com/fapi/v1/premiumIndex?symbol=BTCUSDT"
```

**Rate Limit:** 10 requests/minute

---

### 2. Global Long/Short Account Ratio

```
GET https://fapi.binance.com/futures/data/globalLongShortAccountRatio
```

**Parameters:**

| Parameter | Required | Default | Description |
|-----------|----------|---------|-------------|
| `symbol` | Yes | — | Trading pair (e.g., `BTCUSDT`) |
| `period` | Yes | — | Time period: `5m`, `15m`, `30m`, `1h`, `2h`, `4h`, `6h`, `12h`, `1d` |
| `limit` | No | 30 | Number of data points (max 500) |

**Response Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `symbol` | string | Trading pair |
| `longAccount` | string | Long account ratio (0-1) |
| `shortAccount` | string | Short account ratio (0-1) |
| `longShortRatio` | string | Long/short ratio |
| `timestamp` | number | Data timestamp (ms) |

**Example:**

```bash
# BTC long/short ratio, hourly, last 24 data points
curl "https://fapi.binance.com/futures/data/globalLongShortAccountRatio?symbol=BTCUSDT&period=1h&limit=24"
```

**Rate Limit:** 10 requests/minute

---

### 3. 24hr Ticker (Volume + Price Range)

```
GET https://fapi.binance.com/fapi/v1/ticker/24hr
```

**Parameters:**

| Parameter | Required | Default | Description |
|-----------|----------|---------|-------------|
| `symbol` | No | — | Specific pair. Omit for all. |

**Response Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `symbol` | string | Trading pair |
| `lastPrice` | string | Last traded price |
| `highPrice` | string | 24h high |
| `lowPrice` | string | 24h low |
| `volume` | string | 24h base asset volume |
| `quoteVolume` | string | 24h quote asset volume (USDT) |
| `priceChangePercent` | string | 24h price change % |

**Example:**

```bash
curl "https://fapi.binance.com/fapi/v1/ticker/24hr?symbol=BTCUSDT"
```

**Rate Limit:** 10 requests/minute

---

## Liquidation Zone Estimation Algorithm

### Core Concept

Binance uses mark price (not last price) for liquidation. When funding rates are extreme and long/short ratios are heavily skewed, the crowded side is vulnerable to cascading liquidations.

### Step 1: Identify Leverage Crowding

```
crowding_score = |longAccount - shortAccount| × 100
```

| Crowding Score | Interpretation |
|---------------|----------------|
| > 20 | Extreme — one side heavily dominant |
| 10–20 | High — significant imbalance |
| 5–10 | Moderate — mild skew |
| < 5 | Balanced — no clear crowding |

### Step 2: Funding Rate Severity

```
funding_severity = |lastFundingRate| × 10000   (in basis points)
```

| Funding (bps) | Level | Meaning |
|--------------|-------|---------|
| > 10 | Extreme | Crowded longs paying heavy premium |
| 5–10 | High | Above-average leverage cost |
| 1–5 | Normal | Standard market conditions |
| < 0 | Negative | Shorts paying longs (bearish crowd) |

### Step 3: Estimate Liquidation Price Bands

For a typical 10x leveraged position:

```
# If longs are crowded (longAccount > 0.55):
long_liq_band_upper = markPrice × 0.95    (5% below mark)
long_liq_band_lower = markPrice × 0.90    (10% below mark)

# If shorts are crowded (shortAccount > 0.55):
short_liq_band_lower = markPrice × 1.05   (5% above mark)
short_liq_band_upper = markPrice × 1.10   (10% above mark)
```

Adjust bands by leverage assumption:

| Assumed Leverage | Liquidation Distance from Mark |
|-----------------|-------------------------------|
| 5x | ~18% |
| 10x | ~9% |
| 20x | ~4.5% |
| 50x | ~1.8% |
| 100x | ~0.9% |

### Step 4: Composite Risk Score (0–100)

```
risk_score = (crowding_score × 0.4) + (funding_severity × 0.3) + (volume_rank × 0.3)
```

Where `volume_rank` is normalized 0-100 based on 24h quote volume percentile.

---

## Analytical Recipes

### Recipe 1: Liquidation Danger Map

Scan all futures pairs to find the highest-risk liquidation zones:

```bash
# Step 1: Get all premium indices
curl -s "https://fapi.binance.com/fapi/v1/premiumIndex" > premium.json

# Step 2: Get L/S ratios for top volume pairs
for SYMBOL in BTCUSDT ETHUSDT BNBUSDT SOLUSDT XRPUSDT; do
  curl -s "https://fapi.binance.com/futures/data/globalLongShortAccountRatio?symbol=$SYMBOL&period=1h&limit=1"
  sleep 0.2
done

# Step 3: Combine and score — high funding + skewed L/S = danger zone
```

**Signal Interpretation:**

| Condition | Signal |
|-----------|--------|
| Funding > 0.05% AND longAccount > 0.60 | HIGH RISK — long liquidation cascade likely |
| Funding < -0.03% AND shortAccount > 0.60 | HIGH RISK — short squeeze incoming |
| Funding > 0.10% AND crowding > 20 | EXTREME — imminent liquidation event |
| Funding normal AND L/S balanced | LOW RISK — no liquidation pressure |

### Recipe 2: Funding Rate Divergence Alert

Track when funding rates diverge significantly from price action:

```bash
# Positive funding + price dropping = trapped longs
# Negative funding + price rising = trapped shorts

# Get premium index
curl -s "https://fapi.binance.com/fapi/v1/premiumIndex?symbol=BTCUSDT"

# Get 24hr ticker for price change
curl -s "https://fapi.binance.com/fapi/v1/ticker/24hr?symbol=BTCUSDT"
```

| Funding | Price 24h | Signal |
|---------|-----------|--------|
| > +0.05% | Dropping | Trapped Longs — liquidation likely below |
| < -0.03% | Rising | Trapped Shorts — squeeze likely above |
| > +0.05% | Rising | Momentum — trend continuation |
| < -0.03% | Dropping | Momentum — trend continuation |

### Recipe 3: Historical Leverage Cycles

Track L/S ratio changes over time to identify leverage buildup:

```bash
# Get 24 hours of L/S data (hourly)
curl -s "https://fapi.binance.com/futures/data/globalLongShortAccountRatio?symbol=BTCUSDT&period=1h&limit=24"
```

**Pattern Recognition:**

| Pattern | Meaning |
|---------|---------|
| L/S ratio rising steadily for 6+ hours | Long leverage building up — correction risk increasing |
| L/S ratio dropping steadily for 6+ hours | Short leverage building — bounce risk increasing |
| Sudden L/S spike (>5% in 1 hour) | Mass position opening — reversal signal |
| L/S reversal after extreme | Leverage flush complete — new trend starting |

---

## Use Cases

1. **Risk Management** — Know when your position is on the crowded side before liquidation cascades hit
2. **Contrarian Trading** — Fade extreme leverage positioning for mean-reversion trades
3. **Entry Timing** — Wait for liquidation flushes to complete before entering positions
4. **Alert Systems** — Monitor funding rate extremes and L/S imbalances for automated warnings

---

## Important Notes

- Liquidation prices are **estimates** — actual liquidation depends on individual position leverage, margin mode, and maintenance margin
- Binance does not publish a public liquidation feed — this skill estimates zones from indirect data
- Funding rates settle every 8 hours — the `nextFundingTime` field shows when
- All endpoints are public and require no authentication
- Rate limits apply — implement caching (recommended: 30-60 second TTL)
- Data is for USDM perpetual futures only (not COIN-M)
