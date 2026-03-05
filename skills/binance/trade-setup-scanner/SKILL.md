---
name: "Trade Setup Scanner"
description: "Automated technical analysis scanner — RSI, MACD, Bollinger Bands, Volume spikes"
category: "trading"
api_type: "REST"
auth_required: false
data_source: "Binance Spot Klines"
---

# Trade Setup Scanner

## Overview

Scans 12 major trading pairs for actionable technical analysis setups using RSI, MACD, Bollinger Bands, and volume analysis. Identifies oversold/overbought conditions, trend reversals, volatility squeezes, and volume anomalies in real-time.

## API Reference

### Data Source

```
GET https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1h&limit=100
```

Scanned pairs: BTCUSDT, ETHUSDT, BNBUSDT, SOLUSDT, XRPUSDT, DOGEUSDT, ADAUSDT, AVAXUSDT, DOTUSDT, LINKUSDT, MATICUSDT, LTCUSDT

**Kline Response:**
```json
[
  [1772704800000, "72591.59", "73558.15", "72517.06", "73388.92", "1589.26", ...]
]
```

Fields: [openTime, open, high, low, close, volume, closeTime, quoteVolume, trades, takerBuyBase, takerBuyQuote, ignore]

## Indicators Computed

### RSI (14-period)
- **Oversold**: RSI <= 30 → BUY signal
- **Overbought**: RSI >= 70 → SELL signal
- **Approaching**: RSI 30-35 or 65-70 → WATCH signal

### MACD (12, 26, 9)
- **Bull Cross**: Histogram turns positive → BUY signal
- **Bear Cross**: Histogram turns negative → SELL signal

### Bollinger Bands (20, 2)
- **Lower Touch**: Price <= lower band → BUY signal
- **Upper Touch**: Price >= upper band → SELL signal
- **Squeeze**: Band width < 2% → Volatility expansion imminent (WATCH)

### Volume Analysis
- **Volume Spike**: Current volume > 2.5x 20-period average → Signal in direction of price move

## Signal Strength

Each setup is scored 0-100:
| Setup | Base Strength |
|-------|--------------|
| RSI Extreme (< 25 or > 75) | 85-100 |
| MACD Cross | 70 |
| BB Touch | 65 |
| BB Squeeze | 55 |
| Volume Spike | 45-90 (scaled by spike magnitude) |

## Use Cases

- **Swing Trading**: Identify oversold bounces and overbought reversals
- **Momentum Trading**: MACD crosses for trend entry
- **Volatility Trading**: BB squeezes signal upcoming breakouts
- **Confirmation**: Volume spikes validate price moves

## Notes

- Uses 1-hour candles (100 periods = ~4 days of data)
- All computations happen client-side, no server-side TA
- Indicators refresh every 30 seconds
- Public Binance API, no authentication required
