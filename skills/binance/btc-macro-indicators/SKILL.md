---
title: BTC Macro Cycle Indicators
description: "Pi Cycle Top, Rainbow Chart, and Golden Ratio Multiplier for Bitcoin cycle analysis"
metadata:
  version: "1.0.0"
  author: mefai-dev
license: MIT
---

# BTC Macro Cycle Indicators

## Overview

Long-term Bitcoin cycle indicators that help identify market phases, potential tops/bottoms, and key support/resistance levels using moving average relationships and logarithmic regression models.

### Indicators

1. **Pi Cycle Top** — 111-day MA vs 350-day MA x2. Historically signals cycle tops within 3 days when the 111d MA crosses above.
2. **Rainbow Chart** — Logarithmic regression bands classifying BTC into 9 zones from "Fire Sale" to "Maximum Bubble."
3. **Golden Ratio Multiplier** — Fibonacci multiples (1.6x, 2x, 3x, 5x, 8x, 13x, 21x) of the 350-day MA as dynamic S/R levels.

## API Reference

### Pi Cycle Top

```
GET https://charts.bitcoin.com/api/v1/charts/pi-cycle-top
```

**Response:**
```json
{
  "success": true,
  "chart": "pi-cycle-top",
  "dataPoints": 1500,
  "data": {
    "price": [{"timestamp": 1643155200000, "price": 36914.77}],
    "ma111": [{"timestamp": ..., "value": ...}],
    "ma350x2": [{"timestamp": ..., "value": ...}],
    "crosses": [{"timestamp": ..., "type": "bullish|bearish"}]
  }
}
```

### Rainbow Chart

```
GET https://charts.bitcoin.com/api/v1/charts/rainbow
```

**Response includes:**
- `data.price` — Daily BTC price array
- `data.zones` — 9 rainbow zone definitions (name, color, bounds)
- `data.currentZone` — Which zone BTC is currently in
- `data.priceZoneHistory` — Historical zone classifications

### Golden Ratio Multiplier

```
GET https://charts.bitcoin.com/api/v1/charts/golden-ratio
```

**Response includes:**
- `data.goldenRatioData` — Array with `{timestamp, price, dma350, levels: {level_1_6, level_2, level_3, level_5, level_8, level_13, level_21}}`

## Use Cases

- **Cycle Top Detection**: Monitor Pi Cycle for 111d/350dx2 MA convergence
- **Accumulation Zones**: Rainbow Chart identifies optimal DCA zones (blue/green bands)
- **Dynamic S/R**: Golden Ratio levels provide Fibonacci-based price targets
- **Risk Management**: Combine indicators for cycle position assessment

## Notes

- All endpoints are public, no authentication required
- Data updates daily
- Historical accuracy: Pi Cycle has called every major cycle top since 2013
- Rainbow zones are backtested against 10+ years of BTC data
