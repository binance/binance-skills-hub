# The rules, and what to set them to

Every threshold is a percentage the user chooses in advance. The point of writing them down before a
position is open is that a limit agreed in calm is the only kind that survives a crash — and once it is
in this file, no prompt, news headline or model output can widen it.

Copy `rules.example.json`, edit the numbers, keep it next to the state file.

| Field | Required | Meaning | A sane starting point |
|---|---|---|---|
| `quote` | yes | the asset everything is valued in and sold back to | `"USDC"` |
| `stopLossPct` | yes | how far below its cost basis an asset may fall before the position is cut | `8` |
| `maxPositionPct` | yes | the most one asset may be of the whole portfolio | `40` |
| `maxDrawdownPct` | yes | how far the whole portfolio may fall from its peak before everything is de-risked | `15` |
| `minTradeUsd` | yes | ignore dust below this; also the smallest order worth suggesting | `10` |
| `mode` | yes | `"propose"` (suggest) or `"execute"` (a host that trades) — this skill only ever proposes | `"propose"` |
| `trailingStopPct` | no | how far an asset may fall from its own high while in profit | `5` |
| `takeProfitPct` | no | how far above its cost basis an asset may rise before it is realised | `20` |
| `maxExposurePct` | no | the most of the portfolio that may sit in non-quote assets at all | `80` |
| `maxDailyLossPct` | no | how much the portfolio may lose since 00:00 UTC before trading stops for the day | `5` |
| `volatility.dropPct` + `windowSec` | no | flash-crash brake: a fall of this much from the window's high | `6` in `300` seconds |
| `maxTickJumpPct` | no | a price this far from the last accepted one is held for one reading, not trusted | `25` |
| `assets` | no | per-asset overrides, e.g. `{"BTC": {"stopLossPct": 12}}` | — |

## How the numbers behave together

- **Stop-loss vs trailing stop.** The stop-loss measures from what you paid; the trailing stop measures
  from the best price since. A position up 30% and then down 6% has not hit an 8% stop-loss, but it has
  given back most of a 5% trail. Both are worth having; the trailing stop is the one that keeps gains.
- **Position cap vs exposure cap.** The position cap stops one asset dominating; the exposure cap stops
  *every* asset being large at once. A book of four assets at 39% each passes the first and fails the
  second. That is the point.
- **Daily loss vs drawdown.** The daily limit resets at 00:00 UTC and is about stopping a bad day from
  becoming a worse one. The drawdown limit never resets and is about the account as a whole.
- **Circuit breaker window.** Set `windowSec` rather than a tick count if the caller runs on an
  irregular schedule — otherwise "6% within 5 readings" means something different at every cadence.
- **Deposits and withdrawals are not losses.** Money moving in or out is detected from the quantity and
  quote changes and rebases the peak and the day's baseline, so a withdrawal does not read as a
  drawdown and a deposit does not set a fake peak. This only works if the state file is kept.

## What a violation means

Each violation names the rule, the asset, a severity and a plain-language detail with the actual
numbers. The suggested orders are always sells back to `quote`: full position for the cut-and-realise
rules, exactly the excess for the caps, pro-rata for the exposure cap. When several rules fire on one
asset, the largest sell wins and the orders are deduplicated — you never get two orders for one asset.

Nothing in this skill buys, withdraws, transfers or increases exposure. The worst case if every rule
fires at once is an account entirely in the quote asset.
