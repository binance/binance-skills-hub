---
name: Cross-Exchange Arbitrage Monitor
description: Monitor real-time price deviations across the 8 exchanges that feed Binance's futures index price. Detect cross-exchange arbitrage opportunities by comparing constituent exchange prices against the weighted index, with spread tracking and deviation alerts.
tags:
  - Binance
  - Futures
  - Arbitrage
  - Cross-Exchange
  - Index Price
  - Market Microstructure
author: Binance Community
---

# Cross-Exchange Arbitrage Monitor

## Overview

The Cross-Exchange Arbitrage Monitor leverages Binance's Index Price Constituents API to reveal the exact exchanges and weights that feed into each futures contract's index price. By comparing individual exchange prices against the weighted composite index, this skill identifies real-time price deviations that represent cross-exchange arbitrage opportunities.

Binance calculates index prices using a weighted average from up to 8 major exchanges: Binance, OKX, Coinbase, Bybit, Bitget, KuCoin, Gate.io, and MXC. This skill exposes the normally-hidden price discrepancies between these venues.

## API Reference

### Get Index Price Constituents

Retrieves the constituent exchanges, their prices, and weight contributions to a symbol's index price.

- **Method:** `GET`
- **URL:** `https://fapi.binance.com/fapi/v1/constituents`
- **Authentication:** None (Public)
- **Rate Limit:** 2 requests per second

#### Query Parameters

| Parameter | Type   | Required | Description                          |
|-----------|--------|----------|--------------------------------------|
| symbol    | STRING | Yes      | Trading pair symbol (e.g., BTCUSDT)  |

#### Example Request

```bash
curl -s "https://fapi.binance.com/fapi/v1/constituents?symbol=BTCUSDT"
```

#### Example Response

```json
{
  "symbol": "BTCUSDT",
  "time": 1772669382244,
  "constituents": [
    {
      "exchange": "binance",
      "symbol": "BTCUSDT",
      "price": "72576.17",
      "weight": "0.43478261"
    },
    {
      "exchange": "okex",
      "symbol": "BTC-USDT",
      "price": "72579.70",
      "weight": "0.13043478"
    },
    {
      "exchange": "coinbase",
      "symbol": "BTC-USDT",
      "price": "72596.60",
      "weight": "0.13043478"
    },
    {
      "exchange": "bybit",
      "symbol": "BTCUSDT",
      "price": "72574.00",
      "weight": "0.06521739"
    },
    {
      "exchange": "bitget",
      "symbol": "BTCUSDT",
      "price": "72566.72",
      "weight": "0.06521739"
    },
    {
      "exchange": "kucoin",
      "symbol": "BTC-USDT",
      "price": "72583.50",
      "weight": "0.06521739"
    },
    {
      "exchange": "gateio",
      "symbol": "BTC_USDT",
      "price": "72576.60",
      "weight": "0.04347826"
    },
    {
      "exchange": "mxc",
      "symbol": "BTCUSDT",
      "price": "72572.54",
      "weight": "0.06521739"
    }
  ]
}
```

#### Response Fields

| Field                   | Type   | Description                                      |
|------------------------|--------|--------------------------------------------------|
| symbol                 | STRING | Futures trading pair                             |
| time                   | LONG   | Timestamp of the price snapshot (ms)             |
| constituents           | ARRAY  | Array of constituent exchange objects             |
| constituents.exchange  | STRING | Exchange name (binance, okex, coinbase, etc.)    |
| constituents.symbol    | STRING | Trading pair symbol on that exchange             |
| constituents.price     | STRING | Current price on that exchange                   |
| constituents.weight    | STRING | Weight contribution to the index (0.0 to 1.0)   |

## Calculation Methods

### Weighted Index Price
```
indexPrice = Σ (constituent.price × constituent.weight)
```

### Price Deviation (basis points)
```
deviation_bps = ((exchange_price - index_price) / index_price) × 10000
```

### Cross-Exchange Spread
```
spread_bps = max_deviation - min_deviation
```

## Use Cases

1. **Cross-Exchange Arbitrage Detection**: Identify when one exchange's price significantly deviates from the index, indicating a potential arbitrage opportunity between venues.

2. **Index Manipulation Awareness**: Monitor whether a single exchange with high weight is pushing the index price in a direction that doesn't reflect broader market consensus.

3. **Exchange Health Monitoring**: Detect when an exchange's price becomes stale or disconnected, which might indicate API issues, liquidity problems, or localized market events.

4. **Liquidation Risk Assessment**: Understanding which exchanges drive the index price helps traders assess liquidation risk, as futures positions are marked against the index, not spot price.

5. **Market Microstructure Research**: Study how quickly price information propagates across exchanges and which venues lead price discovery.

## Notes

- Binance holds the largest weight (~43%) in most index calculations, meaning its spot price has the most influence on futures mark prices
- The number of constituent exchanges varies by trading pair; major pairs like BTCUSDT typically have 8, while smaller pairs may have fewer
- Weights can change as Binance periodically reviews and adjusts the index methodology
- Price deviations exceeding 5 basis points across major pairs are unusual and worth investigating
- The endpoint returns real-time snapshots; for time-series analysis, polling at regular intervals is recommended
