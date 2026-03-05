---
title: Spot Futures Basis
description: Binance Spot vs USDM Futures basis spread analysis. Combines spot ticker prices with futures premium index to calculate contango/backwardation across all trading pairs.
metadata:
  version: "1.0.0"
  author: mefai-dev
license: MIT
---

# Spot-Futures Basis Spread

Calculate the price difference (basis) between Binance Spot and USDM Futures markets. Identifies contango (futures premium) and backwardation (futures discount) conditions across all USDT pairs.

## Quick Reference

| Endpoint | Description | Required | Optional | Authentication |
|----------|-------------|----------|----------|----------------|
| `/api/v3/ticker/24hr` (GET) | Spot 24hr ticker data | None | symbol, symbols | No |
| `/fapi/v1/premiumIndex` (GET) | Futures mark price + funding rate | None | symbol | No |

## API Details

### Step 1: Get Spot Prices

**Method:** `GET`

**URL:** `https://api.binance.com/api/v3/ticker/24hr`

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `symbol` | string | No | Single symbol (e.g., BTCUSDT) |
| `symbols` | string | No | JSON array of symbols |

**Example Request:**

```bash
curl -s "https://api.binance.com/api/v3/ticker/24hr"
```

### Step 2: Get Futures Premium Index

**Method:** `GET`

**URL:** `https://fapi.binance.com/fapi/v1/premiumIndex`

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `symbol` | string | No | Single symbol (omit for all) |

**Example Request:**

```bash
curl -s "https://fapi.binance.com/fapi/v1/premiumIndex"
```

**Response Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `symbol` | string | Trading pair symbol |
| `markPrice` | string | Current mark price |
| `indexPrice` | string | Current index price |
| `lastFundingRate` | string | Last funding rate |
| `nextFundingTime` | long | Next funding timestamp |
| `interestRate` | string | Interest rate |

### Step 3: Calculate Basis

```
Basis% = ((Futures Mark Price - Spot Price) / Spot Price) × 100
Annualized Basis% = Basis% × 365
```

- **Positive basis (contango)**: Futures trading at a premium — bullish sentiment or carry trade opportunity
- **Negative basis (backwardation)**: Futures trading at a discount — bearish sentiment or funding arbitrage

## Use Cases

1. **Cash-and-Carry Arbitrage**: Go long spot + short futures when basis is high, collect the premium as risk-free yield
2. **Market Sentiment**: Wide contango across most pairs indicates bullish market sentiment; backwardation indicates bearish
3. **Funding Rate Correlation**: Compare basis with funding rates to identify convergence opportunities
4. **Pair Selection**: Find pairs with the highest basis for carry trade strategies
5. **Risk Monitoring**: Track basis compression/expansion as a leading indicator of market moves

## Notes

- Both endpoints are public and require no authentication
- Spot ticker returns ~2000+ pairs; filter by USDT suffix for comparison
- Futures premium index returns ~600+ USDT-M perpetual contracts
- Basis calculation requires matching symbols between spot and futures
- Funding rate is applied every 8 hours; annualized funding = rate × 3 × 365
- Mark price includes a funding basis to prevent unnecessary liquidations
