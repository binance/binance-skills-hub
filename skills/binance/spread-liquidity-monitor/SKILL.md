---
title: Spread Liquidity Monitor
description: Compare bid-ask spreads and liquidity depth between Binance Spot and USDM Futures markets to assess trading costs and market efficiency.
metadata:
  version: "1.0.0"
  author: mefai-dev
license: MIT
---

# Spread & Liquidity Monitor Skill

Monitor real-time bid-ask spreads across both Spot and USDM Futures markets on Binance. Identifies pairs with tight or wide spreads, calculates the spot-futures basis, and helps traders minimize execution costs.

## Quick Reference

| Endpoint | Description | Required | Optional | Authentication |
|----------|-------------|----------|----------|----------------|
| `/api/v3/ticker/bookTicker` (GET) | Spot best bid/ask | None | symbol, symbols | No |
| `/fapi/v1/ticker/bookTicker` (GET) | Futures best bid/ask | None | symbol | No |

## API Details

### Spot Book Ticker

**Endpoint:** `GET https://api.binance.com/api/v3/ticker/bookTicker`

Returns the best bid and ask prices and quantities for spot market.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| symbol | STRING | No | Single symbol (returns all if omitted) |
| symbols | STRING | No | JSON array of symbols |

**Example Request:**

```bash
curl "https://api.binance.com/api/v3/ticker/bookTicker?symbol=BTCUSDT"
```

**Response Fields:**

| Field | Type | Description |
|-------|------|-------------|
| symbol | STRING | Trading pair |
| bidPrice | STRING | Best bid price |
| bidQty | STRING | Best bid quantity |
| askPrice | STRING | Best ask price |
| askQty | STRING | Best ask quantity |

### Futures Book Ticker

**Endpoint:** `GET https://fapi.binance.com/fapi/v1/ticker/bookTicker`

Same response format as spot, but for USDM Futures market.

**Example Response:**

```json
{
  "symbol": "BTCUSDT",
  "bidPrice": "72655.80",
  "bidQty": "4.667",
  "askPrice": "72655.90",
  "askQty": "0.367",
  "time": 1772664873353
}
```

## Computed Metrics

| Metric | Formula | Description |
|--------|---------|-------------|
| Spread (bps) | `(ask - bid) / mid * 10000` | Trading cost in basis points |
| Basis (bps) | `(futMid - spotMid) / spotMid * 10000` | Futures premium/discount vs spot |
| Mid Price | `(bid + ask) / 2` | Fair value estimate |

## Use Cases

1. **Cost Optimization**: Find pairs with tightest spreads for minimal slippage
2. **Basis Trading**: Identify futures premium/discount for cash-and-carry arbitrage
3. **Liquidity Assessment**: Wide spreads signal low liquidity and higher execution risk
4. **Cross-Market Comparison**: Compare spot vs futures liquidity for the same asset

## Notes

- Book ticker data updates in real-time with each order book change
- Calling without symbol returns data for ALL trading pairs (3000+ spot, 500+ futures)
- Spread in basis points: < 1 bps = excellent, 1-5 bps = normal, > 5 bps = wide
- Rate limits: 1200 requests per minute
