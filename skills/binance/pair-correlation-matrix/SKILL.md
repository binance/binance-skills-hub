---
name: pair-correlation-matrix
description: Real-time cross-asset correlation analysis that calculates Pearson correlation coefficients between 12 major Binance pairs, visualized as an interactive heatmap for portfolio diversification and pair trading.
metadata:
  version: 1.0.0
  author: mefai-dev
  display_name: Pair Correlation Matrix
license: MIT
---

# Pair Correlation Matrix

Cross-asset correlation engine that calculates Pearson correlation coefficients between 12 major Binance spot pairs using 4h return data over a configurable lookback period. Displays results as a color-coded heatmap showing which pairs move together (+1) and which move independently or inversely (-1), enabling portfolio diversification analysis and pair trading opportunity detection.

## Quick Reference

| Endpoint | Description | Required | Optional | Authentication |
|----------|-------------|----------|----------|----------------|
| `/api/v3/klines` (GET) | Kline/Candlestick data | symbol, interval | startTime, endTime, limit | No |

## Parameters

* **symbol**: Trading pair (e.g., BTCUSDT)
* **interval**: Candlestick interval — `4h`
* **limit**: Number of candles — `90` (15 days of 4h data, sufficient for statistically significant correlation)

## Pairs Analyzed

BTCUSDT, ETHUSDT, BNBUSDT, SOLUSDT, XRPUSDT, DOGEUSDT, ADAUSDT, AVAXUSDT, LINKUSDT, SUIUSDT, APTUSDT, ARBUSDT

## How It Works

1. Fetches 90 candles of 4h data for each of 12 pairs via `/api/v3/klines`
2. Calculates **percentage returns** for each period: `(close[i] - close[i-1]) / close[i-1]`
3. For each pair combination (66 unique pairs from 12 assets), calculates **Pearson correlation coefficient**:
   - `r = Σ((x - x̄)(y - ȳ)) / √(Σ(x - x̄)² * Σ(y - ȳ)²)`
4. Builds a 12×12 symmetric correlation matrix
5. Color-codes cells: deep red (+1.0 high positive) → white (0 neutral) → deep blue (-1.0 negative)
6. Identifies and highlights:
   - **Highest correlations**: Pairs that move most similarly (redundant exposure)
   - **Lowest correlations**: Best diversification pairs
   - **Negative correlations**: Potential hedge pairs
7. Updates every 5 minutes

## Output

| Output | Description |
|--------|-------------|
| Correlation Heatmap | 12×12 color-coded matrix with correlation coefficients displayed in each cell |
| Top Correlated | Top 5 most correlated pairs (highest redundancy risk) |
| Least Correlated | Top 5 least correlated pairs (best diversification) |
| Negative Pairs | Any pairs with negative correlation (potential hedges) |
| Average Correlation | Market-wide average correlation — high = "risk-on" herding, low = selective market |
| Stats | Overall market correlation regime indicator |

## Correlation Interpretation

| Correlation | Meaning | Color |
|-------------|---------|-------|
| 0.8 to 1.0 | Very high — assets move almost identically | Deep red |
| 0.5 to 0.8 | Moderate — significant co-movement | Light red |
| 0.2 to 0.5 | Low — some co-movement | Light orange |
| -0.2 to 0.2 | Negligible — effectively independent | White/gray |
| -0.5 to -0.2 | Low negative — tend to move opposite | Light blue |
| -1.0 to -0.5 | High negative — strong inverse relationship | Deep blue |

## Market Regime Insights

- **High average correlation (>0.7)**: Market is in "risk-on/risk-off" mode — all assets herding together. Diversification benefit is low.
- **Moderate average (0.4-0.7)**: Normal crypto market — some sector differentiation.
- **Low average (<0.4)**: Selective market — individual asset drivers dominate. Best environment for diversification.

## Refresh

Auto-refreshes every 5 minutes.

## Use Cases

- **Portfolio Diversification**: Identify which pairs provide genuine diversification vs redundant exposure
- **Pair Trading**: Find historically correlated pairs where correlation temporarily breaks down (mean-reversion opportunity)
- **Risk Management**: Understand portfolio concentration — holding 5 highly correlated assets = holding 1 with 5x size
- **Market Regime Detection**: Rising average correlation often precedes high-volatility events
- **Educational**: Demonstrate why "diversified crypto portfolio" often isn't diversified at all
