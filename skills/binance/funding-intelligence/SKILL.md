---
title: Binance Funding Rate Intelligence
description: 4 funding rate analysis tools for Binance futures markets. Scans funding rates across all pairs, detects extreme funding arbitrage opportunities, analyzes historical funding trends, and identifies spot-futures basis spread (contango/backwardation). Use this skill when users ask about funding rates, funding arbitrage, basis spread, contango, backwardation, or funding cost analysis. All endpoints are public and no API keys are required.
metadata:
  version: "1.1.0"
  author: mefai-dev
license: MIT
---

# Binance Funding Rate Intelligence Skill

## Overview

| Tool | Function | Endpoints Combined | Use Case |
|------|----------|-------------------|----------|
| scan_funding_rates | Funding Rate Heatmap | premiumIndex(all) + fundingInfo | Scan all pairs for current funding rates |
| detect_funding_extremes | Extreme Funding Detector | premiumIndex(all) + fundingInfo | Find arbitrage opportunities from extreme rates |
| analyze_funding_history | Historical Funding Analyzer | fundingRate(limit=500) | Deep dive into a symbol's funding rate history |
| scan_basis_spread | Basis Spread Scanner | premiumIndex(all) | Identify contango/backwardation across all pairs |

## Use Cases

1. **Funding Rate Monitoring**: Scan all futures pairs for current funding rates, sorted by magnitude — identify which pairs have the highest/lowest rates
2. **Arbitrage Detection**: Find extreme funding rates (>0.03%) with severity classification and actionable arbitrage hints (short perp + long spot, etc.)
3. **Funding Cost Analysis**: Analyze historical funding rates for a symbol — trend direction, cumulative cost, annualized projection, volatility
4. **Basis Spread Analysis**: Identify contango (futures premium) and backwardation (futures discount) across all pairs with annualized estimates

## Installation

```bash
pip install binance-intelligence-mcp
```

---

## Tool 1: scan_funding_rates

Fetches premiumIndex (all symbols) + fundingInfo to produce a funding rate heatmap sorted by absolute rate.

### Binance Endpoints Used

| Endpoint | Method | Parameters |
|----------|--------|------------|
| `/fapi/v1/premiumIndex` | GET | (no params — returns all symbols) |
| `/fapi/v1/fundingInfo` | GET | (no params — returns all symbols) |

### Request Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| top_n | int | No | 20 | Number of top results to return |

### Computed Fields Per Symbol

| Field | Computation |
|-------|-------------|
| funding_rate | lastFundingRate × 100 (as percentage) |
| annualized_apr | rate × (24/interval_hours) × 365 × 100 |
| premium_pct | (markPrice - indexPrice) / indexPrice × 100 |
| mins_to_next_funding | (nextFundingTime - now) / 60000 |
| direction | LONGS_PAY (rate > 0.01%), SHORTS_PAY (rate < -0.01%), NEUTRAL |

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| tool | string | `"scan_funding_rates"` |
| total_symbols | integer | Total futures pairs analyzed |
| showing | integer | Number of results returned (≤ top_n) |
| summary.avg_rate_pct | float | Market-wide average funding rate % |
| summary.positive_count | integer | Pairs with positive funding |
| summary.negative_count | integer | Pairs with negative funding |
| summary.most_positive | string | Symbol with highest positive rate |
| summary.most_negative | string | Symbol with lowest negative rate |
| results | array | Sorted by absolute funding rate descending |
| results[].symbol | string | Trading pair |
| results[].funding_rate | float | Current funding rate as % |
| results[].annualized_apr | float | Annualized rate as % |
| results[].premium_pct | float | Mark vs index premium % |
| results[].mins_to_next_funding | float | Minutes until next settlement |
| results[].direction | string | Payment direction |

### Example Response

```json
{
  "tool": "scan_funding_rates",
  "total_symbols": 245,
  "showing": 3,
  "summary": {
    "avg_rate_pct": 0.0082,
    "positive_count": 180,
    "negative_count": 52,
    "neutral_count": 13,
    "most_positive": "DOGEUSDT",
    "most_negative": "XRPUSDT"
  },
  "results": [
    {
      "symbol": "DOGEUSDT",
      "funding_rate": 0.12,
      "annualized_apr": 262.8,
      "mark_price": 0.0802,
      "index_price": 0.0800,
      "premium_pct": 0.25,
      "mins_to_next_funding": 42.5,
      "interval_hours": 4,
      "direction": "LONGS_PAY"
    }
  ]
}
```

---

## Tool 2: detect_funding_extremes

Scans all futures pairs and filters for abnormally high/low funding rates with severity classification and arbitrage suggestions.

### Binance Endpoints Used

| Endpoint | Method | Parameters |
|----------|--------|------------|
| `/fapi/v1/premiumIndex` | GET | (no params — returns all symbols) |
| `/fapi/v1/fundingInfo` | GET | (no params — returns all symbols) |

### Request Parameters

No parameters — scans all pairs automatically.

### Severity Classification

| Level | Condition (positive) | Condition (negative) |
|-------|---------------------|---------------------|
| EXTREME | rate ≥ 0.1% | rate ≤ -0.05% |
| HIGH | rate ≥ 0.05% | rate ≤ -0.02% |
| ELEVATED | rate ≥ 0.03% | — |

### Urgency Classification

| Level | Condition |
|-------|-----------|
| IMMINENT | < 60 minutes to next funding |
| SOON | < 240 minutes to next funding |
| UPCOMING | ≥ 240 minutes to next funding |

### Scoring Formula

```
score = abs(rate) × 10000 + abs(premium_pct) × 10
```

### Arbitrage Hints

- Positive extreme rate → "Short perp + long spot to collect funding"
- Negative extreme rate → "Long perp + short spot to collect funding"

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| tool | string | `"detect_funding_extremes"` |
| total_extreme | integer | Number of symbols with extreme funding |
| severity_counts | object | Count per severity level |
| results | array | Sorted by opportunity score descending |
| results[].symbol | string | Trading pair |
| results[].funding_rate_pct | float | Funding rate as % |
| results[].severity | string | EXTREME, HIGH, or ELEVATED |
| results[].score | float | Opportunity score |
| results[].urgency | string | IMMINENT, SOON, or UPCOMING |
| results[].annualized_apr | float | Annualized rate as % |
| results[].arbitrage_hint | string | Suggested arbitrage action |

### Example Response

```json
{
  "tool": "detect_funding_extremes",
  "total_extreme": 5,
  "severity_counts": {
    "EXTREME": 1,
    "HIGH": 2,
    "ELEVATED": 2
  },
  "results": [
    {
      "symbol": "MEMEUSDT",
      "funding_rate_pct": 0.15,
      "severity": "EXTREME",
      "score": 17.5,
      "urgency": "IMMINENT",
      "mins_to_next_funding": 25.3,
      "annualized_apr": 164.25,
      "mark_price": 0.0254,
      "index_price": 0.0251,
      "premium_pct": 1.195,
      "interval_hours": 8,
      "arbitrage_hint": "Short perp + long spot to collect funding"
    }
  ]
}
```

---

## Tool 3: analyze_funding_history

Fetches historical funding rates for a single symbol and computes comprehensive statistics, trends, and projections.

### Binance Endpoints Used

| Endpoint | Method | Parameters |
|----------|--------|------------|
| `/fapi/v1/fundingRate` | GET | symbol, limit (default: 500) |

### Request Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| symbol | str | No | BTCUSDT | Trading pair to analyze |
| limit | int | No | 500 | Number of historical periods (max: 1000) |

### Computed Analytics

| Category | Metrics |
|----------|---------|
| Statistics | average, median, std_dev, min, max (all as %) |
| Trend | direction (INCREASING/DECREASING/STABLE), old vs new quarter comparison |
| Cumulative | total funding cost %, annualized cost % |
| Extremes | count of periods with rate > 0.05% or < -0.05% |
| Volatility | score 0-100 based on std deviation |
| Distribution | positive/negative/zero period counts |

### Trend Detection Logic

Compares average rate of most recent 25% of periods vs oldest 25%:
- Difference > 0.001% → INCREASING
- Difference < -0.001% → DECREASING
- Otherwise → STABLE

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| tool | string | `"analyze_funding_history"` |
| symbol | string | Trading pair |
| periods_analyzed | integer | Number of funding periods analyzed |
| statistics.average_pct | float | Mean funding rate % |
| statistics.median_pct | float | Median funding rate % |
| statistics.std_dev_pct | float | Standard deviation % |
| statistics.min_pct | float | Minimum rate % |
| statistics.max_pct | float | Maximum rate % |
| trend.direction | string | INCREASING, DECREASING, or STABLE |
| cumulative.total_funding_pct | float | Sum of all funding payments % |
| cumulative.annualized_cost_pct | float | Projected annual funding cost % |
| extremes.total_extreme | integer | Count of extreme periods |
| volatility_score | float | Volatility score (0-100) |
| distribution.positive_periods | integer | Periods with positive funding |
| distribution.negative_periods | integer | Periods with negative funding |

### Example Response

```json
{
  "tool": "analyze_funding_history",
  "symbol": "BTCUSDT",
  "periods_analyzed": 500,
  "time_range": {
    "start_ms": 1695000000000,
    "end_ms": 1709568000000
  },
  "statistics": {
    "average_pct": 0.0085,
    "median_pct": 0.0075,
    "std_dev_pct": 0.012,
    "min_pct": -0.045,
    "max_pct": 0.062
  },
  "trend": {
    "direction": "INCREASING",
    "old_quarter_avg_pct": 0.005,
    "new_quarter_avg_pct": 0.012
  },
  "cumulative": {
    "total_funding_pct": 4.25,
    "annualized_cost_pct": 9.3075
  },
  "extremes": {
    "extreme_positive_count": 8,
    "extreme_negative_count": 3,
    "total_extreme": 11
  },
  "volatility_score": 12.0,
  "distribution": {
    "positive_periods": 420,
    "negative_periods": 72,
    "zero_periods": 8
  }
}
```

---

## Tool 4: scan_basis_spread

Uses premiumIndex (all symbols) to compute spot-futures basis spread and classify market structure.

### Binance Endpoints Used

| Endpoint | Method | Parameters |
|----------|--------|------------|
| `/fapi/v1/premiumIndex` | GET | (no params — returns all symbols) |

### Request Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| top_n | int | No | 20 | Number of top results to return |

### Computed Fields

| Field | Computation |
|-------|-------------|
| basis_pct | (markPrice - indexPrice) / indexPrice × 100 |
| state | CONTANGO (basis > 0.01%), BACKWARDATION (basis < -0.01%), FLAT |
| annualized_basis_pct | lastFundingRate × 3 × 365 × 100 |

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| tool | string | `"scan_basis_spread"` |
| total_symbols | integer | Total pairs analyzed |
| showing | integer | Results returned (≤ top_n) |
| summary.avg_basis_pct | float | Market-wide average basis % |
| summary.contango_count | integer | Pairs in contango |
| summary.backwardation_count | integer | Pairs in backwardation |
| summary.flat_count | integer | Pairs with flat basis |
| summary.max_contango_symbol | string | Highest contango pair |
| summary.max_backwardation_symbol | string | Deepest backwardation pair |
| results | array | Sorted by absolute basis descending |
| results[].symbol | string | Trading pair |
| results[].basis_pct | float | Basis spread as % |
| results[].state | string | CONTANGO, BACKWARDATION, or FLAT |
| results[].annualized_basis_pct | float | Annualized basis from funding rate |

### Example Response

```json
{
  "tool": "scan_basis_spread",
  "total_symbols": 245,
  "showing": 3,
  "summary": {
    "avg_basis_pct": 0.015,
    "contango_count": 180,
    "backwardation_count": 45,
    "flat_count": 20,
    "max_contango_symbol": "DOGEUSDT",
    "max_backwardation_symbol": "XRPUSDT"
  },
  "results": [
    {
      "symbol": "DOGEUSDT",
      "mark_price": 0.0802,
      "index_price": 0.0800,
      "basis_pct": 0.25,
      "state": "CONTANGO",
      "funding_rate_pct": 0.12,
      "annualized_basis_pct": 131.4
    }
  ]
}
```

---

## Binance API Endpoints Reference

All endpoints below are **public** — no API key or authentication required.

| Endpoint | Base URL | Description |
|----------|----------|-------------|
| `GET /fapi/v1/premiumIndex` | fapi.binance.com | Premium index, mark price, funding rate (single or all symbols) |
| `GET /fapi/v1/fundingInfo` | fapi.binance.com | Funding rate info (interval, cap, floor) for all symbols |
| `GET /fapi/v1/fundingRate` | fapi.binance.com | Historical funding rate records |

## Notes

1. All tools use **Binance Futures public endpoints only** — zero API keys needed
2. Rate limiting is handled internally via asyncio Semaphore (max 10 concurrent requests)
3. Funding rates are displayed as percentages (0.01% = 0.0001 raw)
4. Annualized calculations assume 8-hour funding intervals unless fundingInfo specifies otherwise
5. Install via `pip install binance-intelligence-mcp`, run via `python -m binance_intelligence`
