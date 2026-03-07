---
title: Candlestick Pattern Scanner
description: Real-time candlestick pattern recognition engine that scans 15 major Binance spot pairs across multiple timeframes, detecting 8 classic reversal and continuation patterns with confidence scoring.
metadata:
  version: "1.0.0"
  author: mefai-dev
license: MIT
---

# Candlestick Pattern Scanner

Automated technical analysis tool that scans 15 major Binance spot pairs for classic Japanese candlestick patterns across two timeframes (1h and 4h). Detects 8 reversal and continuation patterns with confidence scoring, pattern context (bullish/bearish), and real-time alerting when new patterns form.

## Quick Reference

| Endpoint | Description | Required | Optional | Authentication |
|----------|-------------|----------|----------|----------------|
| `/api/v3/klines` (GET) | Kline/Candlestick data | symbol, interval | startTime, endTime, limit | No |

## Parameters

* **symbol**: Trading pair (e.g., BTCUSDT)
* **interval**: Candlestick interval — `1h` and `4h` (scanned in parallel)
* **limit**: Number of candles — `50` (enough for multi-candle pattern detection)

## Pairs Scanned

BTCUSDT, ETHUSDT, BNBUSDT, SOLUSDT, XRPUSDT, DOGEUSDT, ADAUSDT, AVAXUSDT, LINKUSDT, SUIUSDT, APTUSDT, ARBUSDT, OPUSDT, NEARUSDT, LTCUSDT

## Patterns Detected

| Pattern | Type | Candles | Signal |
|---------|------|---------|--------|
| Hammer | Reversal | 1 | Bullish reversal at bottom |
| Shooting Star | Reversal | 1 | Bearish reversal at top |
| Bullish Engulfing | Reversal | 2 | Bullish reversal — current body fully engulfs previous |
| Bearish Engulfing | Reversal | 2 | Bearish reversal — current body fully engulfs previous |
| Doji | Indecision | 1 | Market indecision — open ≈ close |
| Morning Star | Reversal | 3 | Strong bullish reversal (bearish → small body → bullish) |
| Evening Star | Reversal | 3 | Strong bearish reversal (bullish → small body → bearish) |
| Harami | Reversal | 2 | Current candle body contained within previous candle body |

## How It Works

1. For each of 15 pairs, fetches 50 candles on both 1h and 4h timeframes via `/api/v3/klines`
2. For each candle, calculates body size, upper shadow, lower shadow, and body-to-range ratio
3. **Hammer detection**: Small body at top, lower shadow ≥ 2x body, appears after downtrend
4. **Shooting Star detection**: Small body at bottom, upper shadow ≥ 2x body, appears after uptrend
5. **Engulfing detection**: Current candle body completely engulfs previous candle body, opposite direction
6. **Doji detection**: |open - close| < 10% of high-low range
7. **Morning/Evening Star**: 3-candle pattern — large candle, small gap body, large opposite candle
8. **Harami detection**: Current body entirely within previous body, opposite color
9. Patterns scored by confidence: shadow ratios, volume confirmation, trend context
10. Results sorted by recency and confidence, grouped by timeframe

## Pattern Detection Logic

### Single-Candle Patterns
- **Body ratio**: `|close - open| / (high - low)` — smaller ratio = more shadow-dominant
- **Shadow ratio**: `shadow_length / body_length` — higher ratio = stronger signal
- **Trend context**: 5-candle lookback determines if pattern appears at top or bottom

### Multi-Candle Patterns
- **Engulfing**: `current_body_high > prev_body_high AND current_body_low < prev_body_low`
- **Morning Star**: `candle[-3] bearish AND |candle[-2] body| < 30% of candle[-3] AND candle[-1] bullish`
- **Harami**: `current_body` entirely within `prev_body`, opposite direction

### Confidence Scoring (0-100)
- Base score from pattern geometry (shadow ratios, body containment)
- +20 if volume of pattern candle > 1.5x average volume (volume confirmation)
- +15 if pattern appears after clear trend (5-candle trend strength)
- -20 if pattern is against the dominant trend on higher timeframe

## Output

| Output | Description |
|--------|-------------|
| Pattern Feed | Real-time list of detected patterns sorted by recency, showing pair, timeframe, pattern name, direction, confidence |
| Stats Header | Total patterns detected, bullish count, bearish count, highest confidence pattern |
| Pattern Cards | Top 4 highest-confidence patterns with candle visualization |
| Filter | Filter by pattern type, timeframe, or direction (bullish/bearish) |

## Score Interpretation

| Confidence | Classification |
|------------|---------------|
| 80-100 | High Confidence — strong pattern geometry + volume + trend confirmation |
| 50-79 | Moderate — pattern detected but missing some confirmations |
| 0-49 | Low — pattern geometry present but weak context |

## Refresh

Auto-refreshes every 60 seconds.

## Use Cases

- Identify potential reversal points before they play out
- Screen all major pairs simultaneously for actionable patterns
- Combine with volume and trend analysis for high-conviction entries
- Educational tool for learning Japanese candlestick theory with live market data
- Compare pattern performance across 1h (short-term) and 4h (swing) timeframes
