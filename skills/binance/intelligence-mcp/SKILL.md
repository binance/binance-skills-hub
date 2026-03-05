---
name: intelligence-mcp
description: |
  Computed intelligence tools for Binance futures markets. Combines multiple public Binance API endpoints
  into derived analytics: accumulation detection, whale trade scanning, market impact simulation,
  smart money positioning, candlestick pattern recognition, pair correlation, regime classification, and DCA backtesting.
  Use this skill when users ask about market conditions, smart money activity, accumulation signals,
  whale trades, order book impact, candlestick patterns, asset correlations, market regime, or DCA strategy comparison.
  All endpoints are public — no API keys required.
metadata:
  author: mefai-dev
  version: "1.0.0"
---

# Binance Intelligence MCP Skill

## Overview

| Tool | Function | Endpoints Combined | Use Case |
|------|----------|-------------------|----------|
| detect_accumulation | Smart Accumulation Detector | klines + OI hist + premiumIndex + takerRatio | Detect stealth institutional buying |
| scan_whale_trades | Whale Footprint Scanner | aggTrades | Find large trades, classify by size |
| simulate_market_impact | Market Impact Simulator | depth | Calculate slippage for large orders |
| smart_money_radar | Smart Money Radar (6-Factor) | 6 futures data endpoints | Composite positioning analysis |
| scan_candlestick_patterns | Candlestick Pattern Scanner | klines | Detect hammer, engulfing, doji, star patterns |
| compute_correlation_matrix | Pair Correlation Matrix | klines per symbol | Pearson correlation between pairs |
| classify_market_regime | Market Regime Classifier | klines + premiumIndex | ADX/ATR regime detection |
| backtest_dca | DCA Backtester | klines (1d) | DCA vs lump-sum comparison |

## Use Cases

1. **Accumulation Detection**: Identify stealth buying before price moves — volume surge, OI buildup, quiet funding, taker aggression
2. **Whale Tracking**: Scan aggregate trades for large orders ($50K+), classify as Dolphin/Whale/Mega, track net pressure
3. **Order Execution Planning**: Simulate market impact of large orders — slippage, fill levels, impact cost
4. **Smart Money Analysis**: 6-factor composite from top trader ratios, global sentiment, taker flow, OI trend, price momentum
5. **Pattern Recognition**: Detect classic candlestick patterns with confidence scores across multiple pairs
6. **Portfolio Correlation**: Build correlation matrix to find diversification opportunities or correlated pairs
7. **Regime Awareness**: Classify whether market is trending, ranging, volatile breakout, or low activity
8. **Strategy Backtesting**: Compare DCA vs lump-sum investment performance over historical data

## Installation

```bash
pip install binance-intelligence-mcp
```

---

## Tool 1: detect_accumulation

Combines 4 Binance endpoints to produce a composite accumulation score (0-100) per symbol.

### Binance Endpoints Used

| Endpoint | Method | Parameters |
|----------|--------|------------|
| `/fapi/v1/klines` | GET | symbol, interval=4h, limit=30 |
| `/futures/data/openInterestHist` | GET | symbol, period=4h, limit=30 |
| `/fapi/v1/premiumIndex` | GET | symbol |
| `/futures/data/takerlongshortRatio` | GET | symbol, period=4h, limit=30 |

### Request Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| symbols | list[str] | No | Top 12 futures pairs | Symbols to analyze (e.g., ["BTCUSDT", "ETHUSDT"]) |

### Scoring Algorithm

| Sub-Score | Weight | Source | Logic |
|-----------|--------|--------|-------|
| volume_surge | 25% | klines | Current volume vs 20-period moving average |
| oi_buildup | 30% | openInterestHist | Linear regression slope of OI, normalized by mean |
| stealth_mode | 20% | premiumIndex | Funding rate proximity to zero |
| buyer_aggression | 25% | takerBuySellRatio | Taker buy ratio deviation from 0.5 |

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| tool | string | `"detect_accumulation"` |
| count | integer | Number of successfully analyzed symbols |
| results | array | Sorted by composite score descending |
| results[].symbol | string | Trading pair (e.g., "BTCUSDT") |
| results[].scores.volume_surge | float | Volume surge score (0-100) |
| results[].scores.oi_buildup | float | Open interest buildup score (0-100) |
| results[].scores.stealth_mode | float | Stealth mode score (0-100) |
| results[].scores.buyer_aggression | float | Buyer aggression score (0-100) |
| results[].composite | float | Weighted composite score (0-100) |
| results[].signal | string | `"STRONG"` (>=70), `"MODERATE"` (>=45), `"WEAK"` |
| errors | array | Symbols that failed with error messages |

### Example Response

```json
{
  "tool": "detect_accumulation",
  "count": 3,
  "results": [
    {
      "symbol": "SOLUSDT",
      "scores": {
        "volume_surge": 72.5,
        "oi_buildup": 68.3,
        "stealth_mode": 85.1,
        "buyer_aggression": 61.2
      },
      "composite": 71.4,
      "signal": "STRONG"
    },
    {
      "symbol": "BTCUSDT",
      "scores": {
        "volume_surge": 45.2,
        "oi_buildup": 52.1,
        "stealth_mode": 78.4,
        "buyer_aggression": 48.7
      },
      "composite": 55.8,
      "signal": "MODERATE"
    }
  ],
  "errors": []
}
```

---

## Tool 2: scan_whale_trades

Scans aggregate trades and classifies large orders by size tier.

### Binance Endpoints Used

| Endpoint | Method | Parameters |
|----------|--------|------------|
| `/fapi/v1/aggTrades` | GET | symbol, limit=500 |

### Request Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| symbols | list[str] | No | Top 12 futures pairs | Symbols to scan |
| min_usd | float | No | 50000 | Minimum trade size in USD |

### Trade Classification

| Tier | Size Range | Label |
|------|-----------|-------|
| Dolphin | $50K – $250K | DOLPHIN |
| Whale | $250K – $1M | WHALE |
| Mega | > $1M | MEGA |

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| tool | string | `"scan_whale_trades"` |
| count | integer | Number of symbols with whale activity |
| results | array | Per-symbol whale trade data |
| results[].symbol | string | Trading pair |
| results[].whale_trades | array | Individual whale trades |
| results[].whale_trades[].usd_value | float | Trade value in USD |
| results[].whale_trades[].side | string | `"BUY"` or `"SELL"` |
| results[].whale_trades[].tier | string | `"DOLPHIN"`, `"WHALE"`, or `"MEGA"` |
| results[].whale_trades[].price | float | Execution price |
| results[].whale_trades[].quantity | float | Trade quantity |
| results[].net_pressure | float | Net buy - sell volume in USD |
| results[].buy_volume | float | Total buy volume in USD |
| results[].sell_volume | float | Total sell volume in USD |
| results[].biggest_trade | object | Largest single trade |

---

## Tool 3: simulate_market_impact

Walks the order book to calculate real slippage, fill levels, and impact cost.

### Binance Endpoints Used

| Endpoint | Method | Parameters |
|----------|--------|------------|
| `/fapi/v1/depth` | GET | symbol, limit=1000 |

### Request Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| symbol | str | No | BTCUSDT | Trading pair |
| side | str | No | BUY | `"BUY"` or `"SELL"` |
| amount_usd | float | No | 100000 | Order size in USD |

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| tool | string | `"simulate_market_impact"` |
| symbol | string | Trading pair |
| side | string | Order side |
| amount_usd | float | Requested order size |
| market_price | float | Current best price |
| avg_fill_price | float | Volume-weighted average fill price |
| worst_fill_price | float | Price of the last level consumed |
| slippage_pct | float | Slippage percentage from market price |
| impact_cost_usd | float | Total slippage cost in USD |
| levels_consumed | integer | Number of order book levels consumed |
| total_quantity | float | Total quantity filled |
| filled_pct | float | Percentage of order filled (< 100 if book exhausted) |

### Example Response

```json
{
  "tool": "simulate_market_impact",
  "symbol": "BTCUSDT",
  "side": "BUY",
  "amount_usd": 100000,
  "market_price": 68542.10,
  "avg_fill_price": 68543.25,
  "worst_fill_price": 68548.90,
  "slippage_pct": 0.0017,
  "impact_cost_usd": 1.68,
  "levels_consumed": 12,
  "total_quantity": 1.459,
  "filled_pct": 100.0
}
```

---

## Tool 4: smart_money_radar

6-factor composite positioning analysis combining top trader, global, and taker data.

### Binance Endpoints Used

| Endpoint | Method | Parameters |
|----------|--------|------------|
| `/futures/data/topLongShortPositionRatio` | GET | symbol, period=4h, limit=30 |
| `/futures/data/topLongShortAccountRatio` | GET | symbol, period=4h, limit=30 |
| `/futures/data/globalLongShortAccountRatio` | GET | symbol, period=4h, limit=30 |
| `/futures/data/takerlongshortRatio` | GET | symbol, period=4h, limit=30 |
| `/futures/data/openInterestHist` | GET | symbol, period=4h, limit=30 |
| `/fapi/v1/klines` | GET | symbol, interval=4h, limit=30 |

### Request Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| symbols | list[str] | No | Top 12 futures pairs | Symbols to analyze |

### Factor Scores

| Factor | Source | Range | Logic |
|--------|--------|-------|-------|
| position_ratio | topLongShortPositionRatio | -1 to +1 | Top trader position trend |
| account_ratio | topLongShortAccountRatio | -1 to +1 | Top trader account trend |
| global_sentiment | globalLongShortAccountRatio | -1 to +1 | Global long/short sentiment |
| taker_pressure | takerlongshortRatio | -1 to +1 | Buyer vs seller aggression |
| oi_momentum | openInterestHist | -1 to +1 | Open interest trend direction |
| price_momentum | klines | -1 to +1 | Price direction alignment |

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| tool | string | `"smart_money_radar"` |
| count | integer | Successfully analyzed symbols |
| results | array | Sorted by composite score descending |
| results[].symbol | string | Trading pair |
| results[].factors | object | Individual factor scores (-1 to +1) |
| results[].composite | float | Weighted composite score (0-100) |
| results[].signal | string | `"STRONG_BULLISH"`, `"BULLISH"`, `"NEUTRAL"`, `"BEARISH"`, `"STRONG_BEARISH"` |

---

## Tool 5: scan_candlestick_patterns

Detects classic candlestick patterns with confidence scores.

### Binance Endpoints Used

| Endpoint | Method | Parameters |
|----------|--------|------------|
| `/fapi/v1/klines` | GET | symbol, interval, limit=50 |

### Request Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| symbols | list[str] | No | Top 12 futures pairs | Symbols to scan |
| interval | str | No | 4h | Kline interval: `"1h"` or `"4h"` |

### Detected Patterns

| Pattern | Direction | Detection Logic |
|---------|-----------|----------------|
| Hammer | BULLISH | Small body at top, long lower wick >= 2x body |
| Inverted Hammer | BULLISH | Small body at bottom, long upper wick >= 2x body |
| Bullish Engulfing | BULLISH | Green candle body fully engulfs prior red candle |
| Bearish Engulfing | BEARISH | Red candle body fully engulfs prior green candle |
| Doji | NEUTRAL | Body < 10% of total range |
| Morning Star | BULLISH | 3-candle reversal: red, small body/doji, green |
| Evening Star | BEARISH | 3-candle reversal: green, small body/doji, red |
| Three White Soldiers | BULLISH | 3 consecutive green candles with higher closes |
| Three Black Crows | BEARISH | 3 consecutive red candles with lower closes |

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| tool | string | `"scan_candlestick_patterns"` |
| count | integer | Symbols with detected patterns |
| results | array | Per-symbol pattern data |
| results[].symbol | string | Trading pair |
| results[].patterns | array | Detected patterns |
| results[].patterns[].pattern | string | Pattern name |
| results[].patterns[].direction | string | `"BULLISH"`, `"BEARISH"`, or `"NEUTRAL"` |
| results[].patterns[].confidence | float | Confidence score (0-100) |

---

## Tool 6: compute_correlation_matrix

Calculates Pearson correlation matrix from close price series.

### Binance Endpoints Used

| Endpoint | Method | Parameters |
|----------|--------|------------|
| `/fapi/v1/klines` | GET | symbol, interval, limit (per symbol) |

### Request Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| symbols | list[str] | No | Top 12 futures pairs | 4-12 symbols for correlation |
| interval | str | No | 4h | Kline interval |
| limit | int | No | 90 | Number of candles for correlation window |

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| tool | string | `"compute_correlation_matrix"` |
| symbols | array | Ordered symbol list |
| matrix | array[array] | NxN Pearson correlation matrix (-1.0 to +1.0) |
| strongest_pair | object | Highest positive correlation pair |
| weakest_pair | object | Most negative correlation pair |

### Example Response

```json
{
  "tool": "compute_correlation_matrix",
  "symbols": ["BTCUSDT", "ETHUSDT", "SOLUSDT"],
  "matrix": [
    [1.0, 0.87, 0.72],
    [0.87, 1.0, 0.81],
    [0.72, 0.81, 1.0]
  ],
  "strongest_pair": {
    "pair": ["BTCUSDT", "ETHUSDT"],
    "correlation": 0.87
  },
  "weakest_pair": {
    "pair": ["BTCUSDT", "SOLUSDT"],
    "correlation": 0.72
  }
}
```

---

## Tool 7: classify_market_regime

Classifies market regime using ADX, ATR, and volume analysis.

### Binance Endpoints Used

| Endpoint | Method | Parameters |
|----------|--------|------------|
| `/fapi/v1/klines` | GET | symbol, interval=1h, limit=168 |
| `/fapi/v1/premiumIndex` | GET | symbol |

### Request Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| symbols | list[str] | No | Top 12 futures pairs | Symbols to classify |

### Regime Classification Logic

| Regime | Condition | Description |
|--------|-----------|-------------|
| VOLATILE_BREAKOUT | ADX >= 40 and ATR% >= 1.5% | High directional momentum with expanding volatility |
| TRENDING | ADX >= 25 | Sustained directional movement |
| LOW_ACTIVITY | ATR% < 0.5% and volume change < 20% | Low volatility, low volume |
| RANGING | Default | Sideways price action |

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| tool | string | `"classify_market_regime"` |
| count | integer | Successfully classified symbols |
| regime_summary | object | Symbols grouped by regime |
| results | array | Per-symbol classification |
| results[].symbol | string | Trading pair |
| results[].regime | string | `"TRENDING"`, `"RANGING"`, `"VOLATILE_BREAKOUT"`, `"LOW_ACTIVITY"` |
| results[].direction | string | `"UP"` or `"DOWN"` (only for TRENDING/VOLATILE_BREAKOUT) |
| results[].indicators.adx | float | Average Directional Index value |
| results[].indicators.plus_di | float | Positive Directional Indicator |
| results[].indicators.minus_di | float | Negative Directional Indicator |
| results[].indicators.atr | float | Average True Range (absolute) |
| results[].indicators.atr_pct | float | ATR as percentage of price |
| results[].indicators.volume_change_pct | float | Recent vs older volume change % |
| results[].indicators.funding_rate | float | Current funding rate |

### Example Response

```json
{
  "tool": "classify_market_regime",
  "count": 2,
  "regime_summary": {
    "TRENDING": ["BTCUSDT"],
    "RANGING": ["ETHUSDT"]
  },
  "results": [
    {
      "symbol": "BTCUSDT",
      "regime": "TRENDING",
      "direction": "UP",
      "indicators": {
        "adx": 35.72,
        "plus_di": 28.41,
        "minus_di": 12.53,
        "atr": 1250.45,
        "atr_pct": 1.823,
        "volume_change_pct": 15.34,
        "funding_rate": 0.000125
      }
    }
  ],
  "errors": []
}
```

---

## Tool 8: backtest_dca

Compares Dollar-Cost Averaging vs lump-sum investment over historical data.

### Binance Endpoints Used

| Endpoint | Method | Parameters |
|----------|--------|------------|
| `/fapi/v1/klines` | GET | symbol, interval=1d, limit=total_days |

### Request Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| symbol | str | No | BTCUSDT | Trading pair |
| amount | float | No | 100 | USD per buy interval |
| interval_days | int | No | 7 | Days between each DCA buy |
| total_days | int | No | 365 | Total backtest period in days |

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| tool | string | `"backtest_dca"` |
| symbol | string | Trading pair |
| dca.total_invested | float | Total USD invested via DCA |
| dca.current_value | float | Current portfolio value |
| dca.total_quantity | float | Total quantity accumulated |
| dca.average_cost | float | Average cost per unit |
| dca.num_buys | integer | Number of DCA purchases |
| dca.roi_pct | float | DCA return on investment % |
| lump_sum.total_invested | float | Total USD invested at day 0 |
| lump_sum.current_value | float | Current lump-sum portfolio value |
| lump_sum.roi_pct | float | Lump-sum return on investment % |
| winner | string | `"DCA"` or `"LUMP_SUM"` |

### Example Response

```json
{
  "tool": "backtest_dca",
  "symbol": "BTCUSDT",
  "dca": {
    "total_invested": 5200,
    "current_value": 6142.50,
    "total_quantity": 0.0892,
    "average_cost": 58295.96,
    "num_buys": 52,
    "roi_pct": 18.13
  },
  "lump_sum": {
    "total_invested": 5200,
    "current_value": 5876.40,
    "roi_pct": 13.01
  },
  "winner": "DCA"
}
```

---

## Binance API Endpoints Reference

All endpoints below are **public** — no API key or authentication required.

| Endpoint | Base URL | Description |
|----------|----------|-------------|
| `GET /fapi/v1/klines` | fapi.binance.com | Futures kline/candlestick data |
| `GET /fapi/v1/aggTrades` | fapi.binance.com | Futures compressed aggregate trades |
| `GET /fapi/v1/depth` | fapi.binance.com | Futures order book depth |
| `GET /fapi/v1/premiumIndex` | fapi.binance.com | Premium index and funding rate |
| `GET /futures/data/openInterestHist` | fapi.binance.com | Open interest statistics history |
| `GET /futures/data/topLongShortPositionRatio` | fapi.binance.com | Top trader long/short position ratio |
| `GET /futures/data/topLongShortAccountRatio` | fapi.binance.com | Top trader long/short account ratio |
| `GET /futures/data/globalLongShortAccountRatio` | fapi.binance.com | Global long/short account ratio |
| `GET /futures/data/takerlongshortRatio` | fapi.binance.com | Taker buy/sell volume ratio |

## Notes

1. All tools use **Binance Futures public endpoints only** — zero API keys needed
2. Rate limiting is handled internally via asyncio Semaphore (max 10 concurrent requests)
3. Default symbols: BTCUSDT, ETHUSDT, BNBUSDT, SOLUSDT, XRPUSDT, DOGEUSDT, ADAUSDT, AVAXUSDT, DOTUSDT, MATICUSDT, LINKUSDT, LTCUSDT
4. All scores are normalized to 0-100 range
5. Factor scores in smart_money_radar are normalized to -1 to +1 range
6. Install via `pip install binance-intelligence-mcp`, run via `python -m binance_intelligence`
