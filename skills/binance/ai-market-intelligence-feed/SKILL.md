---
title: AI Market Intelligence Feed
description: Real-time natural language market analysis engine that synthesizes 6 independent analytical dimensions across Binance futures markets into prioritized, human-readable intelligence events — like a Bloomberg Terminal analyst watching the market 24/7
metadata:
  version: "1.0.0"
  author: mefai-dev
license: MIT
---

# AI Market Intelligence Feed

## Overview

The AI Market Intelligence Feed is a real-time market analysis engine that synthesizes data from 6 independent analytical dimensions into prioritized, natural language intelligence events. Rather than presenting raw data in tables and charts, it generates human-readable market analysis — transforming the question from "what is the data?" to "what does the data mean?"

Every 30 seconds, it scans 12 major assets across all signal dimensions simultaneously and produces a prioritized feed of market events ranked by severity (CRITICAL → HIGH → MEDIUM → LOW), each with a natural language explanation of what's happening and why it matters.

This is the equivalent of having a dedicated market analyst watching every data stream 24/7 and alerting you only when something significant occurs.

## Architecture

### The 6 Analytical Dimensions

The Intelligence Feed doesn't just monitor prices — it synthesizes insights from 6 independent analytical engines:

| Dimension | What It Analyzes | Data Sources (Binance-Exclusive marked ★) |
|-----------|-----------------|-------------------------------------------|
| **Smart Money** | Institutional vs retail positioning | ★ topLongShortPositionRatio, ★ topLongShortAccountRatio, globalLongShortAccountRatio, ★ takerBuySellRatio, premiumIndex, openInterestHist |
| **Anomaly Detection** | Multi-signal anomaly convergence | VWAP deviation, 24h moves, funding extremes, OI spikes, spot-futures gaps, taker flow |
| **Divergence** | Smart money vs retail disagreement | ★ topLongShortPositionRatio vs globalLongShortAccountRatio |
| **Funding Analysis** | Leverage positioning extremes | premiumIndex funding rates |
| **Open Interest** | Position buildup/unwind velocity | openInterestHist (3-period trend) |
| **Microstructure** | Market quality and execution risk | bookTicker (futures + spot), premiumIndex, ★ takerBuySellRatio, openInterestHist |

### Event Types

#### 1. Smart Money Signal
**Trigger:** Smart Money Score ≥ 55 (6-factor composite)
**Severity:** CRITICAL (≥75), HIGH (≥60), MEDIUM (≥55)

Example output:
> Smart Money Score 82/100 — Top traders going long aggressively while retail is heavily short. 5/6 factors aligned (LONG). Funding at -4.2bps — longs getting paid to hold. OI rising 3.8% — new positions being opened with conviction. Microstructure: Grade A (92/100).

#### 2. Anomaly Alert
**Trigger:** 3+ out of 6 anomaly signals firing simultaneously
**Severity:** CRITICAL (5+), HIGH (4), MEDIUM (3)

Example output:
> 4/6 anomaly signals firing: VWAP +1.8%, OI spike +4.2%, taker 1.38, funding extreme. Smart Money reading: LONG (72/100). Microstructure: Grade B.

#### 3. Divergence Alert
**Trigger:** Top trader and retail L/S ratios on opposite sides with gap > 0.3
**Severity:** HIGH

Example output:
> Smart-Retail Divergence — Top traders are long (1.82) while retail is short (0.74). Divergence gap: 1.08. Historically, smart money wins this divergence.

#### 4. Funding Extreme
**Trigger:** |Funding rate| > 15 basis points
**Severity:** MEDIUM

Example output:
> Funding rate extreme: -15.2bps (negative). Market is crowded short — contrarian LONG signal. Current 24h: +2.34%.

#### 5. OI Surge
**Trigger:** |OI change| > 5% in recent periods
**Severity:** HIGH (>8%), MEDIUM (>5%)

Example output:
> Open Interest surged +7.3% in recent hours. Significant new position buildup — watch for breakout or squeeze. Price: +1.45% 24h.

#### 6. Microstructure Stress
**Trigger:** Health score < 35 (out of 100)
**Severity:** HIGH (<20), MEDIUM (<35)

Example output:
> Microstructure degraded to Grade D (28/100). Spread: 4.2bps. Spot-futures gap: 22bps. Exercise caution — poor execution environment for large orders.

### Priority Ranking

Events are ranked by a composite priority score that considers both severity and signal strength:

```
Smart Money:  smartScore + (CRITICAL: +100, HIGH: +50, MEDIUM: +0)
Anomaly:      anomalyCount × 20
Divergence:   base 65
Funding:      |fundingBps| × 2
OI:           |oiChange| × 5
Health:       (100 - healthScore) / 2
```

This ensures CRITICAL smart money signals always appear at the top, followed by multi-signal anomalies, then individual alerts.

### Feed Management

- Events are deduplicated by symbol + type (one entry per asset per signal type)
- History maintains up to 50 events with rolling replacement
- Each refresh cycle generates new events and replaces stale ones
- Timestamps show when each event was last updated

## Dashboard Components

### Header
- **LIVE INTELLIGENCE** indicator with pulsing green dot
- **Market Bias** badge: BULLISH / BEARISH / MIXED (based on directional event count)

### Stats Bar
| Stat | Description |
|------|-------------|
| Critical | Count of CRITICAL severity events |
| High | Count of HIGH severity events |
| Events | Total active events |
| Bias | Long vs Short event ratio (e.g., "5L/2S") |

### Event Cards
Each event card displays:
- **Severity badge** (CRITICAL/HIGH/MEDIUM) with color coding
- **Symbol** in large bold text
- **Direction badge** (LONG/SHORT/ALERT/NEUTRAL)
- **Event type label** (SMART MONEY / ANOMALY / DIVERGENCE / FUNDING / OPEN INTEREST / MICROSTRUCTURE)
- **Timestamp** (HH:MM UTC)
- **Natural language analysis** — the full intelligence text

Visual hierarchy:
- CRITICAL events have red left border with subtle red gradient background
- HIGH events have yellow left border with subtle yellow gradient
- MEDIUM events have blue left border
- Cards stack vertically in priority order

## API Endpoints

All endpoints used are the same as documented in the Smart Money Radar skill, plus spot bookTicker:

### Additional: Spot Book Ticker
**Method:** `GET`
**URL:** `https://api.binance.com/api/v3/ticker/bookTicker`

Used for spot-futures alignment calculation in the microstructure dimension.

## Use Cases

1. **Passive Market Monitoring** — Leave the feed open and let it alert you when something significant happens. No need to watch 12 charts simultaneously.

2. **Trading Decision Support** — When multiple event types converge on the same asset (Smart Money + Anomaly + Divergence), the conviction level is extremely high.

3. **Risk Management** — Microstructure stress alerts warn you before placing large orders in degraded market conditions.

4. **Market Narrative Understanding** — Instead of interpreting raw numbers, read natural language explanations of what's happening and why.

5. **Social Media Content** — Intelligence events are written in shareable format — copy/paste to Twitter/X for instant market commentary.

6. **Team Communication** — Share the feed with your trading team as a real-time market briefing.

## What Makes This Unique

1. **Natural Language Output** — Not another dashboard with numbers. Actual sentences that explain market dynamics.

2. **Multi-Dimensional Synthesis** — Combines 6 independent analytical engines that would normally require 6 separate tools.

3. **Binance-Exclusive Data** — 4 out of 9 data sources are only available on Binance, creating intelligence that cannot be replicated on any other exchange.

4. **Prioritized by Significance** — Not a firehose of alerts. Events are ranked so the most important information is always at the top.

5. **Event Deduplication** — Prevents alert fatigue by maintaining one entry per asset per signal type, updated on each cycle.

## Notes

- All endpoints are public and require no authentication
- Refresh interval: 30 seconds
- Default watchlist: 12 major futures pairs
- History maintains up to 50 events with rolling replacement
- The feed is designed for passive monitoring — it watches the market so you don't have to
- Natural language generation is template-based (deterministic, no LLM required) ensuring consistent, reliable output
- Events can be used as input for automated trading systems by parsing the structured event data
