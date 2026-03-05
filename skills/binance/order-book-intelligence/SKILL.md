---
title: Order Book Intelligence
description: |
  Analyze Binance Spot order book depth, trade flow, and market microstructure to detect
  whale walls, bid/ask imbalances, support/resistance levels, and aggressive order flow direction.
  Uses depth snapshots, recent trades, and compressed aggregate trades for real-time market analysis.
  Use this skill when users ask about order flow, buy/sell pressure, whale walls, liquidity analysis,
  price support/resistance, or market microstructure.
metadata:
  version: "1.0"
  author: mefai-dev
license: MIT
---

# Order Book Intelligence Skill

## Overview

Real-time market microstructure analysis using 3 Binance Spot public endpoints:

| API | Function | Intelligence |
|-----|----------|-------------|
| Order Book Depth | Bid/ask levels with quantities | Wall detection, imbalance, S/R levels |
| Recent Trades | Individual executed trades | Whale trade detection, aggressor flow |
| Aggregate Trades | Compressed trade stream | Volume profile, buy/sell pressure |

## Use Cases

1. **Whale Wall Detection**: Find large limit orders (walls) that act as support/resistance
2. **Buy/Sell Pressure**: Measure aggressive order flow direction in real-time
3. **Liquidity Analysis**: Assess market depth and price impact for large orders
4. **Support/Resistance Discovery**: Find price levels with concentrated liquidity
5. **Spoofing Detection**: Identify walls that repeatedly appear and disappear
6. **Volume Profile**: Build time-based volume distribution at price levels

## Base URL

```
https://api.binance.com
```

> All endpoints are public GET requests. No API key required.
> Alternative: `https://data-api.binance.vision` (faster for market data).

---

## API 1: Order Book Depth

### Method: GET

**URL**:
```
https://api.binance.com/api/v3/depth
```

**Request Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| symbol | string | Yes | Trading pair, e.g., `BTCUSDT` |
| limit | integer | No | Depth levels: `5`, `10`, `20`, `50`, `100`, `500`, `1000`, `5000` |

> **Weight**: 5-50 depending on limit. Use `limit=100` for wall detection, `limit=5000` for full S/R analysis.

**Example — 100 levels**:
```bash
curl 'https://api.binance.com/api/v3/depth?symbol=BTCUSDT&limit=100'
```

**Response**:
```json
{
  "lastUpdateId": 12345678,
  "bids": [
    ["94250.00", "2.35990"],
    ["94249.99", "0.50000"],
    ["94249.50", "1.20000"]
  ],
  "asks": [
    ["94250.01", "1.58400"],
    ["94250.10", "0.30000"],
    ["94250.50", "0.80000"]
  ]
}
```

| Field | Type | Description |
|-------|------|-------------|
| lastUpdateId | number | Sequence number for real-time sync |
| bids | array | Buy orders: `[price, quantity]` sorted by price descending |
| asks | array | Sell orders: `[price, quantity]` sorted by price ascending |

### Analytical Patterns

#### Pattern A: Bid/Ask Imbalance Ratio

```
totalBidQty = sum of all bid quantities
totalAskQty = sum of all ask quantities
imbalanceRatio = totalBidQty / totalAskQty

> 1.5 = Strong buy pressure (more buyers waiting)
< 0.67 = Strong sell pressure (more sellers waiting)
0.8-1.2 = Balanced market
```

#### Pattern B: Whale Wall Detection

```
For each level in bids + asks:
  if quantity > 10 × averageQuantity:
    → WHALE WALL detected at this price

Bid walls = strong support (buyer defending this level)
Ask walls = strong resistance (seller blocking price advance)
```

#### Pattern C: Cumulative Depth Profile

```
For bids: accumulate quantities from best bid downward
For asks: accumulate quantities from best ask upward

Find the price level where cumulative depth reaches:
  25% of total visible depth = near support/resistance
  50% = medium support/resistance
  75% = strong support/resistance
```

---

## API 2: Recent Trades

### Method: GET

**URL**:
```
https://api.binance.com/api/v3/trades
```

**Request Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| symbol | string | Yes | Trading pair |
| limit | integer | No | Number of trades (default 500, max 1000) |

**Example**:
```bash
curl 'https://api.binance.com/api/v3/trades?symbol=BTCUSDT&limit=100'
```

**Response** (array):
```json
[
  {
    "id": 123456789,
    "price": "94250.30",
    "qty": "0.10000",
    "quoteQty": "9425.03",
    "time": 1772629800000,
    "isBuyerMaker": false,
    "isBestMatch": true
  }
]
```

| Field | Type | Description |
|-------|------|-------------|
| id | number | Trade ID |
| price | string | Execution price |
| qty | string | Quantity in base asset |
| quoteQty | string | Quantity in quote asset (USD value) |
| time | number | Execution timestamp (ms) |
| isBuyerMaker | boolean | `true` = seller was aggressor (taker sell), `false` = buyer was aggressor (taker buy) |
| isBestMatch | boolean | Whether trade was at best price |

### Analytical Patterns

#### Pattern D: Whale Trade Detection

```
For each trade:
  usdValue = float(quoteQty)
  if usdValue > 50000:  → WHALE TRADE
  if usdValue > 500000: → MEGA WHALE

Track direction: !isBuyerMaker = aggressive buy, isBuyerMaker = aggressive sell
```

#### Pattern E: Trade Flow Direction

```
In last N trades:
  aggressiveBuyVolume = sum(quoteQty) where isBuyerMaker == false
  aggressiveSellVolume = sum(quoteQty) where isBuyerMaker == true

flowRatio = aggressiveBuyVolume / aggressiveSellVolume

> 1.3 = Net aggressive buying (bullish pressure)
< 0.7 = Net aggressive selling (bearish pressure)
```

#### Pattern F: Volume-Weighted Average Price (VWAP)

```
vwap = sum(price × qty) / sum(qty)

Current price above VWAP = buyers in control (bullish)
Current price below VWAP = sellers in control (bearish)
```

---

## API 3: Aggregate Trades

### Method: GET

**URL**:
```
https://api.binance.com/api/v3/aggTrades
```

**Request Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| symbol | string | Yes | Trading pair |
| limit | integer | No | Number of aggregate trades (default 500, max 1000) |
| fromId | long | No | Start from this aggregate trade ID |
| startTime | long | No | Start timestamp (ms) |
| endTime | long | No | End timestamp (ms) |

**Example**:
```bash
curl 'https://api.binance.com/api/v3/aggTrades?symbol=BTCUSDT&limit=100'
```

**Response** (array):
```json
[
  {
    "a": 987654321,
    "p": "94250.30",
    "q": "0.15000",
    "f": 123456789,
    "l": 123456791,
    "T": 1772629800000,
    "m": false,
    "M": true
  }
]
```

| Field | Type | Description |
|-------|------|-------------|
| a | number | Aggregate trade ID |
| p | string | Price |
| q | string | Quantity |
| f | number | First trade ID in this aggregate |
| l | number | Last trade ID in this aggregate |
| T | number | Timestamp (ms) |
| m | boolean | `true` = seller was maker (taker sell), `false` = buyer taker (taker buy) |
| M | boolean | Best price match |

> **Advantage over Recent Trades**: Aggregate trades compress multiple fills at the same price into one entry, giving cleaner volume analysis.

### Analytical Pattern

#### Pattern G: Large Block Detection

```
For each aggregate trade:
  usdValue = float(p) × float(q)
  tradeCount = l - f + 1   # number of individual fills

  if usdValue > 100000 AND tradeCount == 1:
    → ICEBERG ORDER (large single fill, likely institutional)

  if usdValue > 100000 AND tradeCount > 10:
    → SWEEP (large order eating through multiple levels)
```

---

## Combined Intelligence Recipes

### Recipe 1: Real-Time Market Pressure Score

```
1. GET depth (limit=100) → calculate bid/ask imbalance ratio
2. GET trades (limit=500) → calculate trade flow ratio
3. GET aggTrades (limit=500) → calculate large trade bias

pressureScore =
  (imbalanceRatio × 30) +     # order book weight
  (flowRatio × 40) +          # trade flow weight (most important)
  (largeTradeBuyPct × 30)     # whale activity weight

Normalize to 0-100 scale:
  > 65 = STRONG BUY PRESSURE
  55-65 = MODERATE BUY
  45-55 = NEUTRAL
  35-45 = MODERATE SELL
  < 35 = STRONG SELL PRESSURE
```

### Recipe 2: Support/Resistance Discovery

```
1. GET depth (limit=5000) → full order book
2. Find price levels with quantity > 5× average
3. Group nearby levels (within 0.1% price range)
4. Rank by total grouped quantity

Top 3 bid clusters = KEY SUPPORT LEVELS
Top 3 ask clusters = KEY RESISTANCE LEVELS

Confidence: higher quantity = stronger level
```

### Recipe 3: Whale Activity Monitor

```
Every 10 seconds:
1. GET trades (limit=100)
2. Filter trades where quoteQty > $50,000
3. Track direction (buy/sell) and price

If 3+ whale buys in 1 minute at increasing prices:
  → WHALE ACCUMULATION IN PROGRESS

If 3+ whale sells in 1 minute at decreasing prices:
  → WHALE DISTRIBUTION IN PROGRESS
```

---

## Rate Limits

| Endpoint | Weight | Notes |
|----------|--------|-------|
| Depth (limit ≤ 100) | 5 | Recommended for real-time |
| Depth (limit = 500) | 10 | Full analysis |
| Depth (limit = 5000) | 50 | S/R discovery (use sparingly) |
| Recent Trades | 10 | Per request |
| Aggregate Trades | 2 | Most efficient for volume analysis |

IP rate limit: 6000 weight per minute.

## Notes

1. All prices and quantities are strings — parse to float for calculations
2. Order book is a snapshot — levels change rapidly in active markets
3. `isBuyerMaker=false` means the buyer was the taker (aggressive buyer)
4. Aggregate trades are the most efficient for volume analysis (lowest weight)
5. For real-time monitoring, poll every 5-10 seconds
6. Use `data-api.binance.vision` for lower latency on market data endpoints
7. Combine with kline data for multi-timeframe confluence analysis
