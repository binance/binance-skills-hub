---
title: Market Impact Simulator
description: Order book walk-through simulator that calculates real market impact, slippage, and execution cost for any trade size on Binance spot pairs using full depth data.
metadata:
  version: "1.0.0"
  author: mefai-dev
license: MIT
---

# Market Impact Simulator

Interactive order book analysis tool that walks through the full depth (1000 levels) of any Binance spot pair to calculate the real cost of executing a trade. Shows how many price levels would be consumed, the average and worst fill prices, slippage percentage, and total dollar impact cost.

## Quick Reference

| Endpoint | Description | Required | Optional | Authentication |
|----------|-------------|----------|----------|----------------|
| `/api/v3/depth` (GET) | Order book depth | symbol | limit | No |

## Parameters

* **symbol**: Trading pair symbol (e.g., BTCUSDT)
* **limit**: Order book depth. Valid values: 5, 10, 20, 50, 100, 500, 1000. This skill uses `limit=1000` for maximum accuracy.

## User Inputs

| Input | Description | Default |
|-------|-------------|---------|
| Symbol | Trading pair (15 pairs available) | BTCUSDT |
| Amount | Trade size in USDT | 100,000 |
| Side | BUY or SELL | BUY |

## How It Works

1. User selects a symbol, enters a USDT amount, and chooses BUY or SELL
2. Fetches the full order book (1000 levels) via `/api/v3/depth`
3. Walks through asks (for BUY) or bids (for SELL) sequentially
4. At each price level: calculates how much of the remaining order can be filled at that price
5. Accumulates total quantity filled, total cost, and tracks worst (last) fill price
6. Computes average fill price: `totalCost / totalQuantity`
7. Calculates slippage: `|avgFill - bestPrice| / bestPrice * 100`
8. Renders visual cumulative depth bars showing how the order eats through the book

## Supported Pairs

BTCUSDT, ETHUSDT, BNBUSDT, SOLUSDT, XRPUSDT, DOGEUSDT, ADAUSDT, AVAXUSDT, LINKUSDT, SUIUSDT, APTUSDT, ARBUSDT, OPUSDT, NEARUSDT, LTCUSDT

## Output

| Output | Description |
|--------|-------------|
| Summary | Human-readable sentence: "A $100K BUY on SOL would consume 47 levels, avg fill $141.50 vs market $141.20 (0.21% slippage, $212 cost)" |
| Avg Fill Price | Volume-weighted average execution price |
| Worst Fill Price | Price of the last level consumed |
| Slippage % | Percentage difference between market price and average fill |
| Impact Cost ($) | Dollar cost of slippage |
| Levels Consumed | Number of order book levels eaten through |
| Depth Bars | Visual cumulative value consumed at each price level |

## Refresh

Button-triggered only (no auto-refresh). Each simulation fetches fresh order book data.

## Use Cases

- Understand the real cost of executing large orders before trading
- Compare liquidity depth across different trading pairs
- Educational tool for retail traders to learn about market microstructure and slippage
- Pre-trade analysis for optimal order sizing and execution strategy
