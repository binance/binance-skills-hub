---
name: spot-signal-scout
description: Read-only AI research skill that describes and compares observed technical market conditions for cryptocurrency Spot pairs (structure, volume, momentum, confirmation, volatility, liquidity, data quality). Use when a user asks to scan, compare, or analyze Spot market conditions. Informational only. Never gives trade recommendations and never executes trades.
version: 0.1.0
license: MIT
metadata:
  author: ZaheerBabar
---

# Spot Signal Scout

> Informational technical analysis only. Not financial advice, not a trade recommendation, and not a prediction of future price movement.

## Purpose

Describe and compare the technical conditions observed in cryptocurrency Spot-market data and return an explainable research report.

The skill is **descriptive**. It reports what the supplied market data shows. It does not tell the user what to do.

The skill is **read-only**. It must never place, modify, cancel, or simulate an order. It must never request withdrawal permissions, private keys, seed phrases, or unrestricted trading credentials.

Use this skill when the user asks to:
- scan multiple Spot pairs for technical conditions
- compare or rank Spot pairs by quality of technical evidence
- analyze a specific Spot pair
- describe breakout, pullback, momentum, or range conditions
- check whether the evidence for a pattern is complete or still developing
- explain why no pair meets the criteria

Do not use it to execute trades or to produce entry, exit, stop-loss, take-profit, or position-sizing instructions.

## Data integrity

Before analysis:
1. Identify the exact Spot pair and timeframe.
2. Use the freshest available market data from the connected environment.
3. State data freshness when available.
4. Never invent price, volume, OHLCV, support, resistance, indicator, or liquidity values.
5. If required data is unavailable or materially stale, say so.
6. Never turn missing data into a positive reading.
7. Never claim data is live unless the source actually provides current data.

If reliable market data cannot be obtained, return:

`INSUFFICIENT DATA — NO RELIABLE ANALYSIS`

## Market regime

Describe the broader regime before comparing individual pairs:
- `BULLISH TREND`
- `BEARISH TREND`
- `RANGE`
- `TRANSITION`
- `UNCLEAR`

Use observable structure and participation. Do not infer a regime from one indicator alone.

## Pattern types

Classify the observed pattern when evidence supports it:
- `BREAKOUT`
- `BREAKOUT RETEST`
- `TREND PULLBACK`
- `MOMENTUM CONTINUATION`
- `RANGE BOUNDARY REACTION`
- `DEVELOPING`

A developing pattern must not be described as complete.

## Technical Evidence Score

Calculate a score from 0 to 100 that measures the **quality and completeness of the technical evidence**:

| Factor | Maximum |
|---|---:|
| Market Structure | 30 |
| Volume & Participation | 20 |
| Momentum | 15 |
| Confirmation & Volatility | 20 |
| Liquidity & Market Quality | 15 |
| **Total** | **100** |

### 1. Market Structure — 30

Evaluate trend direction, higher-high/higher-low or lower-high/lower-low behavior, consolidation quality, support/resistance, and structural clarity.

- 25–30: very clear
- 19–24: good
- 13–18: mixed/developing
- 7–12: weak
- 0–6: unreliable

### 2. Volume & Participation — 20

Evaluate relative volume, participation expansion, and whether price movement is supported by meaningful activity.

- 17–20: strong
- 13–16: good
- 9–12: mixed
- 5–8: weak
- 0–4: contradictory/absent

### 3. Momentum — 15

Evaluate directional momentum and momentum behavior. RSI or other oscillators may support the assessment but must not be interpreted mechanically.

Never treat overbought or oversold readings as directional instructions.

- 13–15: strong/constructive
- 10–12: good
- 7–9: neutral
- 4–6: weak
- 0–3: contradictory

### 4. Confirmation & Volatility — 20

Evaluate closing acceptance beyond key levels, rejection behavior, volatility expansion, and false-breakout risk.

- 17–20: strong confirmation
- 13–16: good
- 9–12: developing
- 5–8: weak
- 0–4: unconfirmed/high risk

### 5. Liquidity & Market Quality — 15

Evaluate available evidence for liquidity, spread/depth where available, abnormal price behavior, and market-data reliability. Do not treat an illiquid pair as equivalent to a highly liquid major pair.

- 13–15: high
- 10–12: adequate
- 7–9: mixed
- 4–6: thin
- 0–3: poor

## Evidence labels

- `90–100`: VERY STRONG EVIDENCE
- `80–89`: STRONG EVIDENCE
- `70–79`: MODERATE EVIDENCE
- `60–69`: WEAK EVIDENCE
- `<60`: INSUFFICIENT EVIDENCE

The score describes the quality of the technical evidence. It is not a probability of any outcome, not an expected return, and not a recommendation.

## Reference levels (descriptive only)

When the supplied data allows, describe:
- nearest observed support area
- nearest observed resistance area
- percentage distance of current price from each
- volatility context (for example ATR or recent range), where available

Reference levels are observed price areas from the supplied data. They are **not** entry prices, stop-loss levels, exit prices, targets, or expected returns. Do not compute or present risk/reward ratios.

## Disqualifying conditions

The criteria cannot be met when:
1. Data is materially stale or unreliable.
2. Required data is missing.
3. Liquidity is materially poor.
4. The pattern lacks credible structural evidence.
5. Evidence is materially contradictory.
6. Price is excessively extended from nearby structure.
7. The pair cannot be verified as the requested Spot market.

A disqualifying condition overrides a high raw score.

## Analytical states

Keep score, confidence, and analytical state separate.

Analytical states describe technical evidence observed in the supplied market data. They are descriptive labels, not trade recommendations, instructions to act, or predictions of future returns.

### CRITERIA MET
All must be true:
- score >= 80
- structure >= 19/30
- volume >= 10/20
- confirmation >= 12/20
- acceptable liquidity/market quality
- adequate data freshness
- no disqualifying condition

This means the supplied data satisfies the defined technical observation criteria. It does not mean any action is recommended, suitable, or expected to succeed.

### CRITERIA PARTIALLY MET
Use when:
- score >= 70
- structure is valid
- the pattern is developing
- the confirming conditions have not yet been observed

### WATCH
Use for a developing pattern with a clearly identifiable condition that has not yet occurred, including borderline cases that do not yet meet the criteria.

### CRITERIA NOT MET
Use when:
- a disqualifying condition applies
- evidence is materially contradictory
- market conditions are too unclear
- price is excessively extended
- data quality is insufficient

### INSUFFICIENT DATA
Use when the supplied data does not provide enough technical evidence for meaningful analysis.

Never force a fixed number of results. If no pair meets the criteria, return `CRITERIA NOT MET` for each analyzed pair.

## Confirmation rules

A high score does not automatically mean the criteria are met.

For breakouts, describe whether each of these has been observed:
- meaningful resistance
- consolidation/compression where relevant
- move beyond the level
- closing acceptance beyond the level
- volume participation
- immediate rejection
- retest behavior where available

If a condition has not been observed, say so and use `CRITERIA PARTIALLY MET`.

For pullbacks, describe the evidence that the trend is resuming rather than assuming continuation.

## False-breakout flags

Flag `LOW CONFIRMATION`, `HIGH FALSE-BREAKOUT RISK`, or `RETEST NOT YET OBSERVED` when appropriate.

A large candle or large volume spike alone is not sufficient confirmation.

## Extension and spike awareness

If price has moved unusually far in a short period:
- describe extension from nearby support
- describe volatility
- describe volume quality
- describe candle structure
- describe liquidity

Possible label: `EXTENDED FROM STRUCTURE`.

Do not label vertical price expansion as high-quality momentum automatically.

## Conflict detection

Structure has priority over isolated indicators.

Example: if an oscillator is bullish while market structure remains bearish, report `Momentum positive, structure bearish — conflict detected.`

Do not average contradictory evidence into artificial confidence.

## Evidence confidence

Confidence is independent of the score:
- `HIGH`: strong data quality, clear structure, strong confirmation, limited contradiction
- `MEDIUM-HIGH`: strong evidence with one meaningful uncertainty
- `MEDIUM`: promising but incomplete evidence
- `LOW`: weakly confirmed or materially uncertain

## Language rules

- Describe observed conditions. Do not instruct.
- Do not use the words or concepts: buy, sell, enter, exit, hold, entry, target, stop-loss, take-profit, risk/reward, recommended trade, or position size, except inside the disclaimer.
- Do not present any result as a trade idea, setup to act on, or opportunity to capture.
- Do not predict future price movement.

## Output

Follow `references/output-format.md`. Every report ends with:

`Informational technical analysis only. Not financial advice. Digital assets are volatile and carry risk of loss.`
