---
title: Binance Price Query
description: Query real-time and historical cryptocurrency price data from Binance, including spot prices, 24h statistics, candlestick charts, order book depth, and recent trades. Use this skill whenever you need current or past market pricing information for any trading pair on Binance.
metadata:
  version: 1.0.0
  author: yuhsuam
license: MIT
---

# Binance Price Query

Query real-time and historical price data for any trading pair on Binance using public market data endpoints. No API key is required for read-only price queries.

## Available Commands

### Get Latest Price
Retrieve the latest price for a specific trading pair.

```
GET https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT
```

**Example prompt:** "What is the current price of BTC?"  
**Returns:** `{ "symbol": "BTCUSDT", "price": "67234.50000000" }`

---

### Get 24-Hour Statistics
Retrieve 24-hour rolling window price change statistics.

```
GET https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT
```

**Example prompt:** "Show me BTC 24h stats" / "How much did ETH change in the last 24 hours?"  
**Returns:** price change, percent change, high/low, volume, and trade count for the past 24 hours.

---

### Get Candlestick / Kline Data
Retrieve OHLCV (Open/High/Low/Close/Volume) candlestick data.

```
GET https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1h&limit=24
```

**Supported intervals:** `1m`, `3m`, `5m`, `15m`, `30m`, `1h`, `2h`, `4h`, `6h`, `8h`, `12h`, `1d`, `3d`, `1w`, `1M`

**Example prompt:** "Show me BTC hourly candles for the last 24 hours"

---

### Get Order Book Depth
Retrieve current bid/ask order book.

```
GET https://api.binance.com/api/v3/depth?symbol=BTCUSDT&limit=10
```

**Example prompt:** "What does the BTC order book look like?" / "Show me the top 10 bids and asks for ETHUSDT"

---

### Get Recent Trades
Retrieve the most recent trades for a symbol.

```
GET https://api.binance.com/api/v3/trades?symbol=BTCUSDT&limit=20
```

**Example prompt:** "Show me the latest trades for BNBUSDT"

---

### Get All Prices
Retrieve the latest price for all trading pairs.

```
GET https://api.binance.com/api/v3/ticker/price
```

**Example prompt:** "List all current prices" / "What coins are available?"

---

## Usage Notes

- All endpoints are **public** — no authentication required.
- Symbol format: base asset + quote asset, uppercase, no separator (e.g., `BTCUSDT`, `ETHBTC`, `BNBUSDT`).
- For Futures prices, replace the base URL with `https://fapi.binance.com` (USDS-M) or `https://dapi.binance.com` (COIN-M).
- Rate limits apply: 1200 request weight per minute per IP. Price ticker calls cost 2 weight each; all-ticker calls cost 40 weight.

## Disclaimer

Price data is provided for informational purposes only and does not constitute financial or investment advice. Always verify data independently before making trading decisions.
