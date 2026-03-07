---
title: Trader Retail Divergence
description: Binance Futures top trader vs retail sentiment divergence analysis. Compares top trader long/short ratios with global retail ratios to identify smart money positioning.
metadata:
  version: "1.0.0"
  author: mefai-dev
license: MIT
---

# Top Trader vs Retail Divergence

Compare positioning between Binance's top traders (by account and position) and retail traders. Identifies divergence where professional traders are positioned differently from the crowd.

## Quick Reference

| Endpoint | Description | Required | Optional | Authentication |
|----------|-------------|----------|----------|----------------|
| `/futures/data/topLongShortAccountRatio` (GET) | Top trader account long/short ratio | symbol, period | limit | No |
| `/futures/data/globalLongShortAccountRatio` (GET) | Retail account long/short ratio | symbol, period | limit | No |
| `/futures/data/topLongShortPositionRatio` (GET) | Top trader position long/short ratio | symbol, period | limit | No |

## API Details

### Get Top Trader Long/Short Account Ratio

**Method:** `GET`

**URL:** `https://fapi.binance.com/futures/data/topLongShortAccountRatio`

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `symbol` | string | Yes | Trading pair (e.g., BTCUSDT) |
| `period` | string | Yes | Time period: 5m, 15m, 30m, 1h, 2h, 4h, 6h, 12h, 1d |
| `limit` | integer | No | Number of data points (default 30, max 500) |

### Get Global (Retail) Long/Short Account Ratio

**Method:** `GET`

**URL:** `https://fapi.binance.com/futures/data/globalLongShortAccountRatio`

**Parameters:** Same as top trader endpoint

### Get Top Trader Long/Short Position Ratio

**Method:** `GET`

**URL:** `https://fapi.binance.com/futures/data/topLongShortPositionRatio`

**Parameters:** Same as top trader endpoint

**Example Request:**

```bash
# Top traders
curl -s "https://fapi.binance.com/futures/data/topLongShortAccountRatio?symbol=BTCUSDT&period=1h&limit=1"

# Retail
curl -s "https://fapi.binance.com/futures/data/globalLongShortAccountRatio?symbol=BTCUSDT&period=1h&limit=1"

# Top trader positions
curl -s "https://fapi.binance.com/futures/data/topLongShortPositionRatio?symbol=BTCUSDT&period=1h&limit=1"
```

**Response Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `symbol` | string | Trading pair |
| `longShortRatio` | string | Long/short ratio |
| `longAccount` | string | Percentage of long accounts (0-1) |
| `shortAccount` | string | Percentage of short accounts (0-1) |
| `timestamp` | long | Data timestamp |

### Divergence Calculation

```
Top Trader Long% = topLongShortAccountRatio.longAccount × 100
Retail Long% = globalLongShortAccountRatio.longAccount × 100
Divergence = Top Trader Long% - Retail Long%
```

- **Positive divergence**: Top traders more bullish than retail — potential upside
- **Negative divergence**: Top traders more bearish than retail — potential downside

## Use Cases

1. **Smart Money Following**: Align positions with top traders when significant divergence exists
2. **Contrarian Signals**: When retail is overwhelmingly one-sided, consider the opposite direction
3. **Confirmation**: Use divergence as confirmation for other technical/fundamental signals
4. **Risk Management**: Reduce position size when top traders disagree with your direction
5. **Multi-Symbol Screening**: Scan divergence across major pairs to find the strongest signals

## Notes

- All three endpoints are public and require no authentication
- Top trader data represents accounts in the top 20% by open position value
- Account ratio counts accounts; position ratio counts contract value
- Data is available in periods from 5 minutes to 1 day
- Historical data up to 500 periods available for trend analysis
- Divergence above 10% is typically considered significant
