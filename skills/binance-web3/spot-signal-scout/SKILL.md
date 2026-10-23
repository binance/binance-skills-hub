---
name: spot-signal-scout
title: Spot Signal Scout
description: Read-only AI research skill for screening and ranking cryptocurrency Spot setups using market regime, structure, volume, momentum, confirmation, risk/reward, liquidity, and data-quality checks. Use when a user asks to scan, compare, rank, or analyze Spot market setups. Never executes trades.
version: 0.1.0
license: MIT
metadata:
  version: 0.1.0
  author: ZaheerBabar
---

# Spot Signal Scout

## Purpose

Analyze cryptocurrency Spot-market setups and return a ranked, explainable research report.

The skill is **read-only**. It must never place, modify, cancel, or simulate an order as if it were executed. It must never request withdrawal permissions, private keys, seed phrases, or unrestricted trading credentials.

Use this skill when the user asks to:
- scan multiple Spot pairs for setups
- rank Spot opportunities
- analyze a specific Spot pair
- evaluate a breakout, pullback, momentum, or range setup
- determine whether a setup is confirmed or still needs confirmation
- explain why no valid setup exists

Do not use it to execute trades.

## Data integrity

Before analysis:
1. Identify the exact Spot pair and timeframe.
2. Use the freshest available market data from the connected environment.
3. State data freshness when available.
4. Never invent price, volume, OHLCV, support, resistance, indicator, liquidity, or target values.
5. If required data is unavailable or materially stale, say so.
6. Never turn missing data into a positive signal.
7. Never claim data is live unless the source actually provides current data.

If reliable market data cannot be obtained, return:

`INSUFFICIENT DATA — NO RELIABLE SETUP`

## Market regime

Assess the broader regime before ranking individual setups:
- `BULLISH TREND`
- `BEARISH TREND`
- `RANGE`
- `TRANSITION`
- `UNCLEAR`

Use observable structure and participation. Do not infer a regime from one indicator alone.

## Setup types

Classify the setup when evidence supports it:
- `BREAKOUT`
- `BREAKOUT RETEST`
- `TREND PULLBACK`
- `MOMENTUM CONTINUATION`
- `RANGE REVERSAL`
- `WATCHLIST`

A developing setup must not be presented as confirmed.

## Six-factor score

Calculate a score from 0 to 100:

| Factor | Maximum |
|---|---:|
| Market Structure | 25 |
| Volume & Participation | 20 |
| Momentum | 15 |
| Confirmation & Volatility | 15 |
| Risk/Reward | 15 |
| Liquidity & Market Quality | 10 |
| **Total** | **100** |

### 1. Market Structure — 25

Evaluate trend direction, higher-high/higher-low or lower-high/lower-low behavior, consolidation quality, support/resistance, and structural clarity.

- 21–25: very clear
- 16–20: good
- 11–15: mixed/developing
- 6–10: weak
- 0–5: unreliable

### 2. Volume & Participation — 20

Evaluate relative volume, breakout volume, participation expansion, and whether price movement is supported by meaningful activity.

- 17–20: strong
- 13–16: good
- 9–12: mixed
- 5–8: weak
- 0–4: contradictory/absent

### 3. Momentum — 15

Evaluate directional momentum and momentum behavior. RSI or other oscillators may support the assessment but must not be interpreted mechanically.

Never assume overbought = sell or oversold = buy.

- 13–15: strong/constructive
- 10–12: good
- 7–9: neutral
- 4–6: weak
- 0–3: contradictory

### 4. Confirmation & Volatility — 15

Evaluate breakout acceptance, closing behavior, rejection, volatility expansion, and false-breakout risk.

- 13–15: strong confirmation
- 10–12: good
- 7–9: developing
- 4–6: weak
- 0–3: unconfirmed/high risk

### 5. Risk/Reward — 15

Define a defensible trigger, invalidation, and target. Preferred minimum R:R: `2.0:1`. R:R below `1.5:1` should normally be rejected from the primary ranked list unless the user explicitly asks for lower-R:R setups. Never create unrealistic targets solely to improve R:R.

### 6. Liquidity & Market Quality — 10

Evaluate available evidence for liquidity, spread/depth where available, abnormal price behavior, and market-data reliability. Do not treat an illiquid pair as equivalent to a highly liquid major pair.

## Score labels

- `90–100`: EXCEPTIONAL
- `80–89`: STRONG
- `70–79`: WATCH
- `60–69`: WEAK
- `<60`: AVOID

The score measures research quality. It is not a probability of profit and is not a guarantee.

## Hard rejection rules

A setup cannot be confirmed when:
1. Data is materially stale or unreliable.
2. Invalidation cannot be defined.
3. R:R is clearly inadequate.
4. Liquidity is materially poor.
5. The breakout lacks credible structural evidence.
6. Evidence is materially contradictory.
7. Price is excessively extended from the logical trigger.
8. Required data is missing.
9. The pair cannot be verified as the requested Spot market.

A hard rejection overrides a high raw score.

## Decision state

Keep score, confidence, and decision state separate.

### CONFIRMED SETUP
All must be true:
- score >= 80
- structure >= 16/25
- volume >= 10/20
- confirmation >= 10/15
- R:R >= 2.0:1
- acceptable liquidity/market quality
- adequate data freshness
- no hard rejection

### WAIT FOR CONFIRMATION
Use when:
- score >= 70
- structure is valid
- setup is developing
- required trigger/confirmation has not occurred

### WATCH
Use for a developing setup with a clearly identifiable future condition, including borderline setups that do not yet meet confirmation requirements.

### NO TRADE
Use when:
- a hard rejection applies
- R:R is inadequate
- evidence is materially contradictory
- market is too unclear
- setup is excessively extended
- data quality is insufficient

### AVOID
Use for low-quality conditions that are not worth monitoring.

Never force a fixed number of winners. If no setup qualifies, return `NO VALID SETUP FOUND`.

## Confirmation rules

A high score does not automatically mean confirmation.

For breakouts, evaluate:
- meaningful resistance
- consolidation/compression where relevant
- breakout attempt
- closing acceptance
- volume participation
- immediate rejection
- retest behavior where available

If the trigger has not occurred, use `WAIT FOR CONFIRMATION`.

For pullbacks, require evidence that the trend is actually resuming rather than assuming continuation.

## False-breakout protection

Flag `LOW CONFIRMATION`, `HIGH FALSE-BREAKOUT RISK`, or `WAIT FOR RETEST` when appropriate.

A large candle or large volume spike alone is not sufficient confirmation.

## Pump/spike protection

If price has moved unusually far in a short period:
- assess extension from support
- assess volatility
- assess volume quality
- assess candle structure
- assess liquidity
- assess whether R:R remains realistic

Possible verdict: `EXTENDED — WAIT FOR REASSESSMENT`.

Do not label vertical price expansion as a high-quality momentum setup automatically.

## Conflict detection

Structure has priority over isolated indicators.

Example: if an oscillator is bullish while market structure remains bearish, report `Momentum positive, structure bearish — conflict detected.`

Do not average contradictory evidence into artificial confidence.

## Confidence

Confidence is independent of the score:
- `HIGH`: strong data quality, clear structure, strong confirmation, limited contradiction
- `MEDIUM-HIGH`: strong setup with one meaningful uncertainty
- `MEDIUM`: promising but incomplete evidence
- `LOW`: speculative, weakly confirmed, or materially uncertain

A
