---
name: pre-trade-risk
description: |
  Deterministic pre-execution risk decision gate for leveraged perpetual/swap trades. Given the
  proposed trade parameters (symbol, side, equity, entry, stop, leverage, proposed position
  notional), it maps them through a set of generic risk checks and returns an ALLOW / WARN /
  BLOCK decision with a risk score, per-check results, computed metrics and severity-ordered
  warning codes. Call it immediately before executing or modifying a leveraged trade, to decide
  whether the proposed trade satisfies the risk constraints under a generic policy. It is a
  decision gate only — it does NOT execute or modify orders, does not manage positions, and does
  not claim to model a specific exchange's official rules.
metadata:
  author: SangJieGe
  version: 1.0.0
---

# Pre-Trade Risk Guard

Pre-execution risk gate for leveraged trades. It takes **proposed** trade parameters and returns
a structured **ALLOW / WARN / BLOCK** decision so the agent can stop before sending an order that
would breach its generic risk constraints.

## When to Use

Use this skill **immediately before executing or modifying a leveraged trade** when the agent must
decide whether the proposed trade passes a deterministic pre-trade risk gate.

Trigger intents include:

| Agent intent | Why this skill |
|---|---|
| "Is this trade OK to send?" (leverage, notional, stop, risk) | Decision gate before execution |
| Iterating on a candidate trade and re-checking each variant | Concrete ALLOW / WARN / BLOCK verdict |
| Where is this trade risky? | Aggregate `risk_score` + per-check breakdowns |
| Sharpen the generic model with venue data | `maintenance_margin_rate` / `fee_rate` / `funding_rate` |

Do **not** present `ALLOW` as a guarantee, an exchange validation, or investment advice. Do not use
this skill to place, modify or cancel orders — it only gates the decision. Order execution is out of scope.

## What It Does

Deterministic **decision gate** (`ALLOW` / `WARN` / `BLOCK`), not a trade executor. Given
caller-supplied trade parameters, it computes metrics and runs generic checks, then folds them into
one verdict plus a structured breakdown. Where exchange-sharpening parameters
(`maintenance_margin_rate`, `fee_rate`, `funding_rate`) are all supplied, it narrows the liquidation
model to a venue-sharpened one; otherwise it stays explicitly generic and never fabricates a sharper
result.

The threshold policy is a **generic** policy — it does not claim to mirror any particular
exchange's leverage / margin tiers.

## Input

JSON request body. Required fields:

| Field | Type | Meaning |
|---|---|---|
| `symbol` | non-empty string | The traded symbol |
| `side` | string | `"long"` or `"short"` |
| `equity_usdt` | number > 0 | Account usable equity in USDT |
| `entry_price` | number > 0 | Proposed entry price |
| `stop_price` | number > 0 | Stop-loss; must differ from entry and sit on the correct side |
| `leverage` | number > 0 | Proposed leverage |
| `position_notional_usdt` | number > 0 | Proposed position notional |

Optional fields (venue sharpening + risk-budget check):

| Field | Type | Meaning |
|---|---|---|
| `maintenance_margin_rate` | number >= 0 | Exchange maintenance-margin rate (enables sharpened liquidation) |
| `fee_rate` | number >= 0 | Exchange taker/maker fee rate |
| `funding_rate` | number >= 0 | Expected funding rate |
| `target_price` | number > 0 | Optional take-profit / projection |
| `max_risk_pct` | number in (0, 100] | Risk budget as % of equity (enables the risk-budget check) |

## Output

JSON verdict. Structure:

| Field | Meaning |
|---|---|
| `decision` | `ALLOW` \| `WARN` \| `BLOCK` |
| `risk_score` | 0..100 (capped aggregate) |
| `decision_note` | Short human-readable rationale |
| `checks` | Per-check map: `input_sanity`, `leverage`, `exposure`, `stop_loss`, `risk_budget`, `liquidation_buffer` → `PASS` \| `WARN` \| `BLOCK` |
| `metrics` | `equity_usdt`, `position_notional_usdt`, `exposure_ratio`, `initial_margin_usdt`, `stop_distance_pct`, `estimated_loss_at_stop_usdt`, `risk_budget_usdt` (null when no `max_risk_pct`), `risk_budget_exceeded_usdt`, `generic_estimated_liquidation_price`, `generic_liquidation_distance_pct` |
| `warnings` | Severity-ordered list of `{ code, severity, message }` |
| `model` | `{ type: "generic", exchange_specific: bool, disclaimer }`; `exchange_specific` is `true` only when `maintenance_margin_rate`, `fee_rate` AND `funding_rate` are all supplied |

Warning / block codes the checks can surface include: `HIGH_LEVERAGE`, `HIGH_EXPOSURE`,
`WIDE_STOP`, `TIGHT_STOP`, `RISK_BUDGET_EXCEEDED`, `LOW_LIQUIDATION_BUFFER`, `INVALID_STOP_DIRECTION`.

## Decision / Rules

Rule of thumb — one blocking risk drives `BLOCK`, else any warning drives `WARN`, else `ALLOW`:

- **Any check at BLOCK ⇒ `decision = BLOCK`** (e.g. leverage > 30×, exposure > 5× equity,
  estimated loss at stop > risk budget, or the stop sits behind the generic liquidation estimate).
- **Otherwise any WARN ⇒ `decision = WARN`** (e.g. leverage > 15×, exposure > 2× equity,
  stop > 20% or < 0.2% of entry, or stop within ~80% of the generic liquidation distance).
- **Otherwise ⇒ `decision = ALLOW`**.
- `BLOCK` / `WARN` / `ALLOW` reflect a **generic policy**. The venue-sharpened model applies only
  when `maintenance_margin_rate` + `fee_rate` + `funding_rate` are all present; the guard never
  fabricates a sharper result when they are absent.
- Input validation errors return `HTTP 400` (never silently coerced).

## API

HTTP endpoint (the supplied trade parameters are passed straight through):

```
POST https://sangjiege.online/perp-risk/v1/pre-trade-guard
```

Authentication: none required — the service does **not** depend on Binance API credentials.

## Example

Check a high-leverage LONG trade on a $10k account before sending it:

```json
{
  "symbol": "BTCUSDT",
  "side": "long",
  "equity_usdt": 10000,
  "entry_price": 50000,
  "stop_price": 48500,
  "leverage": 25,
  "position_notional_usdt": 100000,
  "max_risk_pct": 1
}
```

This example would surface `HIGH_LEVERAGE` / `HIGH_EXPOSURE` findings, driving a **BLOCK** verdict
with a high `risk_score` and severity-ordered warnings — the agent should stop before sending this order.

## Use Cases

1. **Pre-execution gate**: Agent runs the trade through the guard and refuses to send if `BLOCK`.
2. **Trade iteration**: Agent tweaks leverage / notional / stop and re-checks until `ALLOW` (or a
   consciously accepted `WARN`).
3. **Uniform risk policy**: Every leveraged order — human or autonomous — passes the same
   deterministic gate before execution.
4. **Stop-validity check**: Agent confirms the stop sits on the right side and in front of the
   generic liquidation estimate.
5. **Venue-aware re-check**: When accurate MMR / fee / funding are available, the guard sharpens
   the liquidation model and re-verifies the stop and buffer.

## Notes / Limitations

- The liquidation estimate is a **generic** `100 / leverage` distance model, **not** a venue
  liquidation price. "Stop in front of liquidation" is only meaningful under that approximation.
- Risk thresholds are a **generic** policy, not the leverage/risk tiers of a specific exchange.
- No order execution, no live positions, no portfolio reconciliation, no market fetching — all
  values are caller-supplied.
- This guard does **not** execute or modify trades and never touches funds. `ALLOW` still requires
  the agent to complete execution through its own responsible order path.
- A `WARN` / `BLOCK` verdict should be surfaced truthfully to the user before any order is sent.
- Report `model.exchange_specific` and the generic-policy disclaimer alongside any surfaced verdict,
  so it is not mistaken for a venue rule.
- This skill only describes how to use the existing guard service; it adds no new Binance API or
  order-management capability.
