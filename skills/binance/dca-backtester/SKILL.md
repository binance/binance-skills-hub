---
title: DCA Backtester
description: Dollar-cost averaging backtester that simulates DCA strategies over historical Binance data, comparing daily, weekly, and monthly accumulation versus lump-sum investing with ROI, drawdown, and cost-basis analysis.
metadata:
  version: "1.0.0"
  author: mefai-dev
license: MIT
---

# DCA Backtester

Interactive backtesting tool that simulates dollar-cost averaging strategies using historical Binance kline data. Users select a pair, DCA frequency (daily/weekly/monthly), investment amount per period, and backtest window (30-365 days). Shows total invested, portfolio value, ROI, average cost basis, max drawdown, and side-by-side comparison with a lump-sum entry at the start of the period.

## Quick Reference

| Endpoint | Description | Required | Optional | Authentication |
|----------|-------------|----------|----------|----------------|
| `/api/v3/klines` (GET) | Kline/Candlestick data | symbol, interval | startTime, endTime, limit | No |

## Parameters

* **symbol**: Trading pair (e.g., BTCUSDT)
* **interval**: `1d` for daily close prices
* **limit**: Up to `1000` candles (covers ~2.7 years of daily data)

## Supported Pairs

BTCUSDT, ETHUSDT, BNBUSDT, SOLUSDT, XRPUSDT, DOGEUSDT, ADAUSDT, AVAXUSDT, LINKUSDT, SUIUSDT, APTUSDT, ARBUSDT, OPUSDT, NEARUSDT, LTCUSDT

## User Inputs

| Input | Description | Default |
|-------|-------------|---------|
| Symbol | Trading pair dropdown | BTCUSDT |
| Amount | Investment per period (USDT) | 100 |
| Frequency | Daily / Weekly / Monthly | Weekly |
| Period | Backtest window in days: 30, 90, 180, 365 | 90 |

## How It Works

1. User selects pair, amount per period, frequency, and backtest window
2. Fetches daily klines via `/api/v3/klines` for the selected period
3. **DCA Simulation**: At each DCA interval (daily/weekly/monthly), calculates how many units purchased at that day's close price
4. Accumulates: total units acquired, total USDT invested, running cost basis
5. **Lump-Sum Comparison**: Calculates result of investing the same total amount on day 1
6. **Current Value**: `total_units * current_price`
7. **ROI**: `(current_value - total_invested) / total_invested * 100`
8. **Average Cost Basis**: `total_invested / total_units`
9. **Max Drawdown**: Largest peak-to-trough decline in portfolio value during the period
10. Visual chart showing DCA portfolio value curve vs lump-sum curve over time

## Output

| Output | Description |
|--------|-------------|
| Summary | "Investing $100/week in BTC over 90 days: $1,300 invested → $1,487 value (14.4% ROI)" |
| DCA Stats Card | Total invested, current value, ROI %, avg cost basis, total units acquired |
| Lump-Sum Card | Same metrics for lump-sum comparison |
| Winner Badge | Which strategy performed better and by how much |
| Drawdown | Maximum drawdown percentage during the period |
| Visual Chart | Portfolio value over time: DCA line vs lump-sum line |
| Buy Points | Each DCA purchase marked on the price chart (date, price, units bought) |

## DCA vs Lump-Sum Analysis

| Metric | DCA | Lump-Sum |
|--------|-----|----------|
| Entry | Spread across N periods | Single entry at start |
| Risk | Lower — averages out volatility | Higher — fully exposed to timing |
| Uptrend | Typically underperforms lump-sum | Captures full upside from day 1 |
| Downtrend | Outperforms — buys more at lower prices | Full drawdown exposure |
| Sideways/Volatile | Often outperforms — benefits from volatility | No averaging benefit |

## Refresh

Button-triggered only (no auto-refresh). Each simulation fetches fresh historical data.

## Use Cases

- Backtest DCA strategies before committing real capital
- Compare dollar-cost averaging vs timing the market with historical evidence
- Understand how frequency (daily vs weekly vs monthly) affects outcomes
- Educational tool showing the power of consistent accumulation in volatile markets
- Evaluate which pairs benefited most from DCA over different time horizons
- Pre-planning tool for Binance Auto-Invest configuration
