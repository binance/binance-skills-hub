---
title: Liquidation Magnet Estimator
description: "Estimates liquidation cluster zones that attract price movement using OI and leverage data"
metadata:
  version: "1.0.0"
  author: mefai-dev
license: MIT
---

# Liquidation Magnet Estimator

## Overview

Estimates where liquidation clusters exist at various leverage levels (5x, 10x, 20x, 50x, 100x) and determines which direction price is most likely to be "pulled" based on the imbalance of long vs short liquidation values. Combines open interest, long/short ratio, and taker data to model liquidation pressure.

## API Reference

### Required Endpoints

```
GET https://fapi.binance.com/fapi/v1/ticker/24hr?symbol=BTCUSDT
GET https://fapi.binance.com/futures/data/openInterestHist?symbol=BTCUSDT&period=1h&limit=24
GET https://fapi.binance.com/futures/data/topLongShortPositionRatio?symbol=BTCUSDT&period=1h&limit=1
GET https://fapi.binance.com/futures/data/globalLongShortAccountRatio?symbol=BTCUSDT&period=1h&limit=1
GET https://fapi.binance.com/futures/data/takerlongshortRatio?symbol=BTCUSDT&period=1h&limit=1
```

## Liquidation Zone Calculation

For each leverage level L:
- **Long Liquidation Price** = `currentPrice * (1 - 100/L/100)`
- **Short Liquidation Price** = `currentPrice * (1 + 100/L/100)`

### OI Distribution by Leverage

| Leverage | Est. Market Share |
|----------|------------------|
| 5x-10x | 30% of OI |
| 10x-25x | 35% of OI |
| 25x-50x | 20% of OI |
| 50x-100x | 15% of OI |

### Magnet Direction

The side with more estimated liquidation value acts as a "magnet" — market makers and whales tend to push price toward larger liquidation clusters to capture that liquidity.

- **Magnet DOWN**: More long liquidations below → price attracted downward
- **Magnet UP**: More short liquidations above → price attracted upward
- **Strength**: `|longLiqValue - shortLiqValue| / totalLiqValue * 100`

## Key Metrics

| Metric | Source |
|--------|--------|
| Current Price | `ticker/24hr` |
| Long/Short Ratio | `globalLongShortAccountRatio` |
| OI Change 24h | `openInterestHist` (first vs last) |
| Taker Buy/Sell | `takerlongshortRatio` |

## Supported Pairs

BTC, ETH, BNB, SOL, XRP, DOGE — selectable via UI toggle.

## Use Cases

- **Liquidation Hunting**: Position in the direction of the magnet
- **Stop Loss Placement**: Avoid placing stops in liquidation-dense zones
- **Leverage Awareness**: Understand where cascading liquidations could trigger
- **Risk Assessment**: OI change + L/S ratio shows market positioning

## Notes

- Estimations based on aggregate data — actual liquidation levels depend on individual position entry prices
- Higher leverage positions are closer to current price and more easily triggered
- All endpoints are public Binance Futures API, no authentication required
- Refreshes every 30 seconds
