---
name: grid-trading-analyzer
description: Analyze optimal grid trading parameters using Binance spot kline data with ATR, Bollinger Band, and historical volatility calculations.
metadata:
  version: 1.0.0
  author: Community
license: MIT
---

# Grid Trading Analyzer

Analyze optimal grid trading parameters for any Binance spot trading pair using technical indicators. Calculates ATR(14), Bollinger Bands(20,2), and Historical Volatility from kline data to suggest grid bounds, spacing, and estimated profit per grid level.

## Quick Reference

| Endpoint | Description | Authentication |
|----------|-------------|----------------|
| `GET /api/v3/klines` | Kline/candlestick data | No |
| `POST /sapi/v1/algo/spot/newOrderTwap` | Algo grid order (TWAP) | Yes (HMAC) |

## API Details

### Get Kline Data (Public)

Retrieve historical candlestick data for technical analysis and grid parameter calculation.

**Method:** `GET`

**URL:** `https://data-api.binance.vision/api/v3/klines`

**Query Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| symbol | string | Yes | — | Trading pair (e.g., BTCUSDT) |
| interval | string | Yes | — | Kline interval: 1m, 3m, 5m, 15m, 30m, 1h, 2h, 4h, 6h, 8h, 12h, 1d, 3d, 1w, 1M |
| limit | integer | No | 500 | Number of klines (max 1000) |

**Example Request:**

```bash
curl 'https://data-api.binance.vision/api/v3/klines?symbol=BTCUSDT&interval=4h&limit=100'
```

**Response Format:**

Each kline is an array: `[openTime, open, high, low, close, volume, closeTime, quoteVolume, trades, takerBuyBase, takerBuyQuote, ignore]`

| Index | Description |
|-------|-------------|
| 0 | Open time (ms) |
| 1 | Open price |
| 2 | High price |
| 3 | Low price |
| 4 | Close price |
| 5 | Volume |
| 6 | Close time (ms) |
| 7 | Quote asset volume |

### Technical Analysis Formulas

**ATR(14) — Average True Range:**
```
TR = max(High - Low, |High - PrevClose|, |Low - PrevClose|)
ATR = SMA(TR, 14)
```

**Bollinger Bands(20,2):**
```
SMA = average(close, 20)
StdDev = stddev(close, 20)
Upper = SMA + 2 * StdDev
Lower = SMA - 2 * StdDev
BBWidth = (Upper - Lower) / SMA * 100
```

**Historical Volatility:**
```
Returns = ln(close[i] / close[i-1])
HV = stddev(returns) * 100
```

**Grid Parameters:**
```
GridUpper = Price + ATR * 2
GridLower = Price - ATR * 2
GridSpacing = (GridUpper - GridLower) / GridCount
EstProfitPerGrid = GridSpacing / Price * 100
```

### Algo Grid Order (Signed)

Place algorithmic grid orders via Binance SAPI.

**Method:** `POST`

**URL:** `https://api.binance.com/sapi/v1/algo/spot/newOrderTwap`

**Authentication:** HMAC-SHA256 signed

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| symbol | string | Yes | Trading pair |
| side | string | Yes | BUY or SELL |
| quantity | decimal | Yes | Order quantity |
| duration | integer | Yes | Duration in seconds |
| timestamp | integer | Yes | Current timestamp (ms) |
| signature | string | Yes | HMAC-SHA256 signature |

## Use Cases

1. **Grid Setup Optimization** — Calculate optimal grid bounds based on volatility metrics
2. **Volatility Assessment** — Determine if current market conditions suit grid trading
3. **Risk Sizing** — Use ATR to set appropriate grid spacing for risk management
4. **Pair Comparison** — Compare volatility across pairs to find best grid candidates
5. **Backtesting Parameters** — Use historical kline data to validate grid configurations

## Notes

- Kline data endpoint is **public** — no authentication required
- `data-api.binance.vision` is the geo-unrestricted Binance market data endpoint
- ATR(14) is used as the primary volatility measure for grid spacing
- Bollinger Band width indicates whether the market is compressed (low BB width) or volatile
- Higher volatility generally means wider grids but more profit per grid level
- Grid count of 5-30 is typical; more grids = smaller profit per grid but more trades
- Algo order endpoints require API key with trading permissions
- Use testnet (`testnet.binance.vision`) for testing grid strategies
