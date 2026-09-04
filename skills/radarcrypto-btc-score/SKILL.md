---
name: radarcrypto-btc-score
description: |
  Composite Bitcoin market-state snapshot from a single public endpoint: a 0-100 score,
  five weighted sub-scores (trend, derivatives, momentum, flow, risk) and ~40 underlying
  indicators - funding rate, open interest, long/short and taker ratios, RSI, MACD,
  moving averages, BTC/ETH dominance, Fear & Greed, DXY and SPY correlation.
  Use when the user asks what current BTC market conditions look like, wants derivatives
  positioning or momentum context, or when an agent needs one machine-readable snapshot
  of BTC market state instead of querying several data sources separately.
metadata:
  author: wendersonalves1982-oss
  version: "1.0"
license: MIT
---

# RadarCrypto BTC Score

Reads a single public JSON endpoint that aggregates Bitcoin market data into a composite
score plus the indicators behind it. No API key. Updated every 2 minutes.

This skill reports market state. It does not recommend any action, asset or position.

## Usage

```bash
node scripts/cli.mjs score        # composite score, zone and price
node scripts/cli.mjs subscores    # the five weighted dimensions
node scripts/cli.mjs indicators   # all raw indicators
node scripts/cli.mjs full         # everything, human readable
node scripts/cli.mjs json         # raw JSON, for piping
```

Endpoint: `https://radarcrypto.com.br/api/indicators.json`
Set `RADARCRYPTO_API` to point at a different host.

## Score zones

The composite score is bucketed into three descriptive zones. The labels describe the
model's reading of current conditions - they are not instructions.

| Range | Zone label | What it describes |
|-------|-----------|-------------------|
| 0-39 | RISCO | Indicators are predominantly stressed |
| 40-69 | NEUTRO | Indicators are mixed or offsetting |
| 70-100 | COMPRA | Indicators are predominantly constructive |

Zone labels come from the upstream model and are Portuguese strings (`RISCO`, `NEUTRO`, `COMPRA`). They are the model's own naming for each band, not a recommendation from this skill. `risk_signal` carries a second short label for the same reading.
`capitulation.active` marks conditions the model classifies as forced selling, with the
triggering reasons listed in `capitulation.reasons`.

## Sub-scores

Five dimensions, each 0-100, combined into the headline score:

- `tendencia` - moving-average structure and alignment
- `derivativos` - funding, open interest, long/short and taker ratios
- `momentum` - RSI and MACD state
- `fluxo` - dominance shifts and market-cap flow
- `risco` - macro and correlation stress (DXY, SPY correlation)

Reading them separately shows what moved the headline: a 61 driven by strong trend but
weak risk describes a different market than the reverse.

## Response shape

```json
{
  "updated_at": "2026-08-30T13:32:06Z",
  "engine_version": "4.0",
  "score": 61,
  "score_zone": "NEUTRO",
  "score_range": "40-69",
  "risk_signal": "AGUARDAR",
  "capitulation": { "active": false, "reasons": [], "text": null },
  "sub_scores": { "tendencia": 70, "derivativos": 53, "momentum": 68, "fluxo": 57, "risco": 41 },
  "indicators": { "btc_price": 78686.2, "funding_rate": 0.000094, "rsi": 68, "...": "~40 fields" }
}
```

## Notes

- Requires Node >= 18 (global `fetch`). Zero dependencies. Runs unprivileged.
- Some `indicators` fields are Portuguese human-readable labels (`funding_status`,
  `ls_status`); all numeric fields are language-neutral.
- Informational and educational only. Not financial advice.
