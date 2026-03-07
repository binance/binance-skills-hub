---
title: Futures Term Structure Analyzer
description: Analyze the futures term structure by combining basis rate data, quarterly delivery settlement prices, and exchange information. Detect contango and backwardation regimes, track annualized carry yield, and monitor quarterly settlement cycles across all Binance USDM Futures pairs.
metadata:
  version: "1.0.0"
  author: mefai-dev
license: MIT
---

# Futures Term Structure Analyzer

## Overview

The Futures Term Structure Analyzer combines three complementary Binance APIs to provide a complete view of the futures market's pricing structure over time. By analyzing the relationship between spot, perpetual, and quarterly futures prices, this skill identifies carry trade opportunities, detects regime changes between contango and backwardation, and tracks historical quarterly settlement outcomes.

## API Reference

### 1. Futures Basis Data

Retrieves the historical basis (futures price minus index price) for any pair and contract type.

- **Method:** `GET`
- **URL:** `https://fapi.binance.com/futures/data/basis`
- **Authentication:** None (Public)

#### Query Parameters

| Parameter    | Type   | Required | Description                                         |
|-------------|--------|----------|-----------------------------------------------------|
| pair        | STRING | Yes      | Trading pair (e.g., BTCUSDT)                        |
| contractType| STRING | Yes      | PERPETUAL, CURRENT_QUARTER, or NEXT_QUARTER         |
| period      | STRING | Yes      | 5m, 15m, 30m, 1h, 2h, 4h, 6h, 12h, 1d             |
| limit       | INT    | No       | Default 30, max 500                                  |

#### Example Request

```bash
curl "https://fapi.binance.com/futures/data/basis?pair=BTCUSDT&contractType=PERPETUAL&period=1h&limit=5"
```

#### Example Response

```json
[
  {
    "indexPrice": "73626.24413043",
    "contractType": "PERPETUAL",
    "basisRate": "-0.0006",
    "futuresPrice": "73580.30",
    "annualizedBasisRate": "",
    "basis": "-45.94413043",
    "pair": "BTCUSDT",
    "timestamp": 1772654400000
  }
]
```

#### Response Fields

| Field              | Type   | Description                                          |
|-------------------|--------|------------------------------------------------------|
| indexPrice        | STRING | Weighted average index price across exchanges        |
| contractType      | STRING | Contract type (PERPETUAL/CURRENT_QUARTER/NEXT_QUARTER) |
| basisRate         | STRING | Basis as a percentage (basis / indexPrice)            |
| futuresPrice      | STRING | Futures contract price                               |
| annualizedBasisRate| STRING | Annualized basis (empty for perpetuals)             |
| basis             | STRING | Absolute basis (futuresPrice - indexPrice)           |
| pair              | STRING | Trading pair                                         |
| timestamp         | LONG   | Data timestamp (ms)                                  |

### 2. Quarterly Delivery Settlement Prices

Retrieves historical settlement prices for all past quarterly delivery events.

- **Method:** `GET`
- **URL:** `https://fapi.binance.com/futures/data/delivery-price`
- **Authentication:** None (Public)

#### Query Parameters

| Parameter | Type   | Required | Description                    |
|-----------|--------|----------|--------------------------------|
| pair      | STRING | Yes      | Trading pair (e.g., BTCUSDT)   |

#### Example Request

```bash
curl "https://fapi.binance.com/futures/data/delivery-price?pair=BTCUSDT"
```

#### Example Response

```json
[
  {"deliveryTime": 1766707200000, "deliveryPrice": 88832.7},
  {"deliveryTime": 1758844800000, "deliveryPrice": 109049.7},
  {"deliveryTime": 1750982400000, "deliveryPrice": 107046.1},
  {"deliveryTime": 1743120000000, "deliveryPrice": 85302.8},
  {"deliveryTime": 1735257600000, "deliveryPrice": 94335.4}
]
```

#### Response Fields

| Field         | Type   | Description                              |
|--------------|--------|------------------------------------------|
| deliveryTime | LONG   | Settlement timestamp (ms)                |
| deliveryPrice| FLOAT  | Final settlement price at delivery       |

### 3. Futures Exchange Information

Provides contract specifications including delivery dates and onboard dates for all futures symbols.

- **Method:** `GET`
- **URL:** `https://fapi.binance.com/fapi/v1/exchangeInfo`
- **Authentication:** None (Public)

Returns an object with a `symbols` array. Each symbol includes:

| Field                | Type   | Description                                    |
|---------------------|--------|------------------------------------------------|
| symbol              | STRING | Full symbol (e.g., BTCUSDT_250627)             |
| pair                | STRING | Base pair (e.g., BTCUSDT)                      |
| contractType        | STRING | PERPETUAL, CURRENT_QUARTER, NEXT_QUARTER       |
| deliveryDate        | LONG   | Delivery date timestamp (ms)                   |
| onboardDate         | LONG   | When the contract was listed (ms)              |
| status              | STRING | TRADING, SETTLING, DELIVERING, DELISTED        |
| maintMarginPercent  | STRING | Maintenance margin rate                        |
| requiredMarginPercent| STRING | Initial margin rate                           |
| liquidationFee      | STRING | Liquidation penalty fee rate                   |

## Analysis Methods

### Contango / Backwardation Detection

```
basisRate > 0  → Contango (futures premium over spot)
basisRate < 0  → Backwardation (futures discount to spot)
```

### Annualized Carry Yield (Perpetual)

For perpetual contracts, the annualized carry is derived from the funding rate:

```
annualizedCarry = fundingRate × 3 × 365 × 100  (for 8-hour funding)
annualizedCarry = fundingRate × 6 × 365 × 100  (for 4-hour funding)
```

### Annualized Carry Yield (Quarterly)

For quarterly contracts with a known delivery date:

```
daysToExpiry = (deliveryDate - now) / 86400000
annualizedBasis = (basisRate / daysToExpiry) × 365 × 100
```

### Basis Trend Analysis

```
basisTrend = (latest_basisRate - oldest_basisRate) × 10000  (in bps)
```

Positive trend = deepening contango (market becoming more bullish).
Negative trend = moving toward backwardation (market becoming bearish).

## Use Cases

1. **Cash-and-Carry Arbitrage**: When the annualized basis exceeds borrowing costs, traders can buy spot and sell futures for a risk-free yield. The term structure shows the optimal contract to sell (current vs. next quarter).

2. **Regime Change Detection**: A shift from contango to backwardation (or vice versa) across multiple pairs simultaneously signals a major market sentiment shift and potential trend reversal.

3. **Quarterly Roll Analysis**: As delivery approaches, the basis between current and next quarter contracts reveals roll yield and expected price impact of contract rollovers.

4. **Settlement Price History**: Historical delivery prices provide context for where the market has settled in previous cycles, useful for understanding quarterly patterns and seasonality.

5. **Funding Rate vs. Basis Comparison**: Comparing perpetual funding rates with quarterly basis rates reveals inconsistencies that can be exploited through calendar spread trades.

6. **Market Structure Health**: Persistent backwardation in bull markets or persistent contango in bear markets may indicate unusual market stress or positioning.

## Notes

- The `basis` endpoint supports all three contract types: PERPETUAL, CURRENT_QUARTER, and NEXT_QUARTER, allowing full term structure analysis
- `annualizedBasisRate` is only populated for quarterly contracts; for perpetuals, use the funding rate calculation instead
- Settlement prices are available dating back to the earliest Binance quarterly futures contracts
- Quarterly contracts are settled on the last Friday of the delivery month at 08:00 UTC
- The exchange info endpoint includes `liquidationFee` and `marketTakeBound` which are important for understanding true carry trade costs
- Historical basis data is available for the last 30 days; for longer analysis, data should be accumulated over time
- Basis tends to compress as delivery approaches (convergence); tracking this convergence rate reveals whether the roll will be smooth or volatile
