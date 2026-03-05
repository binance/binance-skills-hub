---
name: whale-footprint-scanner
description: Real-time large trade detection across top Binance spot pairs. Scans aggregated trades to identify whale activity ($50K+), classifying trades as Dolphin ($50K+), Whale ($250K+), or Mega ($1M+) with live buy/sell pressure analysis.
metadata:
  version: 1.0.0
  author: MEFAI
  display_name: Whale Footprint Scanner
license: MIT
---

# Whale Footprint Scanner

Real-time detection and classification of large trades across top Binance spot pairs. Scans 500 recent aggregated trades per pair, flags transactions exceeding $50,000, and provides a live feed sorted by size with net buy/sell pressure analysis.

## Quick Reference

| Endpoint | Description | Required | Optional | Authentication |
|----------|-------------|----------|----------|----------------|
| `/api/v3/aggTrades` (GET) | Compressed/Aggregate trades list | symbol | fromId, startTime, endTime, limit | No |

## Parameters

* **symbol**: Trading pair symbol (e.g., BTCUSDT, ETHUSDT, SOLUSDT)
* **limit**: Number of trades to retrieve per pair. Default: 500; Maximum: 1000

## How It Works

1. Fetches 500 recent aggregated trades for each of 10 top pairs via `/api/v3/aggTrades`
2. Calculates USD value: `price * quantity`
3. Filters trades exceeding $50K threshold
4. Classifies by size: Dolphin ($50K+), Whale ($250K+), Mega ($1M+)
5. Determines buy vs sell using the `m` (isBuyerMaker) field
6. Sorts by timestamp descending
7. Computes 1-hour rolling stats: total whale count, net buy/sell pressure, biggest trade

## Pairs Scanned

BTCUSDT, ETHUSDT, SOLUSDT, BNBUSDT, XRPUSDT, DOGEUSDT, ADAUSDT, AVAXUSDT, LINKUSDT, SUIUSDT

## Output

| Output | Description |
|--------|-------------|
| Live Feed | Whale trades sorted by recency with symbol, side, USD value, price, time ago |
| Whale Count | Total whale trades detected in last hour |
| Net Pressure | Net buy minus sell volume in USD |
| Buy/Sell Volume | Separate buy and sell whale volume totals |
| Biggest Trade | Largest single trade detected with symbol and side |

## Trade Classification

| Category | Threshold | Visual |
|----------|-----------|--------|
| Dolphin | $50,000+ | Green badge |
| Whale | $250,000+ | Orange badge |
| Mega | $1,000,000+ | Red badge |

## Refresh

Auto-refreshes every 15 seconds for near real-time whale tracking.

## Use Cases

- Detect institutional buying/selling pressure in real time
- Identify unusual large trades that may precede price moves
- Monitor net whale flow direction across major pairs
- Spot accumulation or distribution patterns before they show up on charts
