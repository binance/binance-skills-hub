---
name: price-ticker
description: Query real-time Binance spot & futures price tickers, 24h stats, and klines for any trading pair via public REST APIs (no authentication required). Use whenever users ask for current crypto price, 24h change, volume, or historical candles for a Binance trading pair — even if they don't explicitly mention Binance APIs.
metadata:
  version: 0.1.0
  author: hermes-scan-01
license: MIT
---

# Binance Price Ticker Skill

Fetch real-time market data from Binance **public** REST endpoints (no API key needed).
All data is factual and educational — this skill does **not** promote any asset, does
**not** present any coin as safe/recommended, and shares **no wallet addresses**
(per Binance Skills Hub trading rules).

## Base URLs
- Spot: `https://api.binance.com/api/v3`  (or public mirror `https://data-api.binance.vision/api/v3`)
- Futures (USD-M): `https://fapi.binance.com/fapi/v1`

## Available Tools

### 1. get_price — latest price for a symbol
```bash
curl -s "https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT"
# -> {"symbol":"BTCUSDT","price":"64000.00"}
```

### 2. get_24h — 24h rolling statistics
```bash
curl -s "https://api.binance.com/api/v3/ticker/24hr?symbol=ETHUSDT"
# -> priceChange, priceChangePercent, highPrice, lowPrice, volume, etc.
```

### 3. get_klines — historical candles (OHLCV)
```bash
# interval: 1m 5m 15m 1h 4h 1d ; limit: 1-1000
curl -s "https://api.binance.com/api/v3/klines?symbol=BNBUSDT&interval=1h&limit=24"
# -> array of [openTime, open, high, low, close, volume, closeTime, ...]
```

### 4. get_exchange_info — tradable pairs & filters
```bash
curl -s "https://api.binance.com/api/v3/exchangeInfo?symbols=%5B%22BTCUSDT%22%5D"
```

## Usage Notes
- Symbol format: `BASE+QUOTE`, e.g. `BTCUSDT`, `SOLUSDT`, `ETHBTC`.
- Public endpoints are rate-limited (~600 req/min/IP). Cache results for ≥1s.
- For authenticated order/history endpoints, see Binance Skills Hub `binance/` skills
  that read `BINANCE_API_KEY` / `BINANCE_API_SECRET` from env (NOT included here).

## Safety
- Educational only. Not financial advice.
- Never include a wallet address or private key in any output.
- Do not imply any asset is "safe", "guaranteed", or "recommended".
