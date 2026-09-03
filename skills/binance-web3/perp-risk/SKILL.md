---
name: perp-risk
description: |
  Deterministic position sizing and risk calculator for a leveraged perpetual position,
  before the order is placed. From account equity, a chosen risk budget (as % of equity),
  an intended entry price, a stop-loss price, leverage and side, it returns position size,
  risk budget in USDT, position notional, initial margin, stop distance and a GENERIC
  estimated liquidation price. Call it before opening or increasing a leveraged perpetual
  position when the agent needs deterministic, machine-readable sizing derived from account
  equity and risk tolerance. It is a read-only calculator: it does not place orders, it does
  not model any specific exchange's maintenance-margin tiers, fees, funding or risk parameters,
  and it is not investment advice.
metadata:
  author: SangJieGe
  version: 1.0.0
---

# Perp Risk

Perpetual position sizing and risk calculator. Given equity, risk %, entry, stop, leverage
and side, it computes the position size that keeps the worst-case stop-loss loss inside the
risk budget, plus the resulting notional, initial margin, stop distance, and a **generic**
estimated liquidation price for sanity-checking.

## When to Use

Use this skill **before opening or modifying a leveraged perpetual position** when the agent
needs deterministic position sizing — i.e. it must turn a risk-per-trade decision into a
concrete currency quantity and notional before quoting any order size.

Trigger intents include:

| Agent intent | Why this skill |
|---|---|
| "How much of X can I buy at entry E with a stop at S risking 1% of equity?" | Deterministic quantity from equity + risk budget + entry + stop |
| "What notional and margin does this position need at Nx leverage?" | Position notional + initial margin |
| "How far is my stop, and where is my liquidation roughly?" | Stop distance + generic liquidation estimate |
| "If the market moves adversely by Y%, what do I lose / need extra?" | `target_adverse_move_pct` extra funding check |

Do **not** call it when there is no stop-loss price yet — sizing a position without a defined
exit stop is out of scope. Do not call it to place, modify or cancel any order; it only estimates.

## What It Does

Read-only, deterministic calculator. It accepts caller-supplied account and trade parameters
and returns validated sizing numbers. It has **no market-data, symbol, or venue dependency** —
prices and equity are supplied by the caller, not fetched. Outputs are stable and machine-readable
(JSON), suitable for an agent to act on before execution.

It does **not** operate any order path and does **not** model exchange-specific liquidation
(maintenance-margin tiers, fee rates, funding, or risk-tier parameters are not included).

## Input

JSON request body. Required fields:

| Field | Type | Meaning |
|---|---|---|
| `equity_usdt` | number > 0 | Account usable equity in USDT |
| `risk_pct` | number in (0, 100] | Portion of equity budgeted as the intended stop-loss risk |
| `entry_price` | number > 0 | Intended entry price |
| `stop_price` | number > 0 | Stop-loss; must differ from entry and sit on the correct side (below entry for long, above for short) |
| `leverage` | number > 0 | Intended leverage multiplier |
| `side` | string | `"long"` or `"short"` |

Optional field:

| Field | Type | Meaning |
|---|---|---|
| `target_adverse_move_pct` | number in (0, 100) | If supplied, also reports the USDT loss at that adverse move and any extra margin needed if it exceeds equity |

## Output

JSON response. Deterministic fields:

| Field | Meaning |
|---|---|
| `risk_budget_usdt` | The USDT amount at risk per this trade from the stop |
| `quantity` | Position size in base units |
| `position_notional_usdt` | Notional value of the position |
| `initial_margin_usdt` | Required initial margin at chosen leverage |
| `stop_distance_price` | Absolute price distance entry → stop |
| `stop_distance_pct` | Stop distance as % of entry |

Estimate field (always accompanied by the generic warning):

| Field | Meaning |
|---|---|
| `estimated_liquidation_price` | **Generic** estimate only (`100 / leverage` distance model) |
| `liquidation_estimate_warning` | Present whenever the generic liquidation estimate is returned |

Conditional field (present only when `target_adverse_move_pct` supplied, else `null`):

| Field | Meaning |
|---|---|
| `target_adverse_move_loss_usdt` | Loss in USDT at the target adverse move |
| `extra_margin_for_target_move_usdt` | Extra margin needed if that loss exceeds equity |

## API

HTTP endpoint (the supplied account/trade parameters are passed straight through):

```
POST https://sangjiege.online/perp-risk/v1/perp/risk
```

Authentication: none required — the service does **not** depend on Binance API credentials.

Input validation errors return `HTTP 400` with a descriptive message (invalid sign, zero stop
distance, wrong stop side for `side`, out-of-range percentages). There is **no**
`ALLOW` / `WARN` / `BLOCK` decision output from this endpoint — it is a pure calculator; the
caller decides whether the returned sizing is acceptable.

## Example

A LONG perp risk-budgeted sizing:

```json
{
  "equity_usdt": 10000,
  "risk_pct": 1,
  "entry_price": 50000,
  "stop_price": 48000,
  "leverage": 10,
  "side": "long"
}
```

Expected shape: `risk_budget_usdt = 100`, stop distance = 2000 pts, `quantity ≈ 0.05`,
`position_notional_usdt ≈ 2500`, `initial_margin_usdt ≈ 250`, and a generic liquidation price
≈ 45000 (entry down 10% under the `100 / leverage` model) with `liquidation_estimate_warning` present.

## Use Cases

1. **Pre-order sizing**: Agent computes a concrete quantity and stop before sending any perp order.
2. **Risk-budget planning**: Agent confirms that the chosen stop keeps the worst-case loss at (or
   around) `risk_pct` of equity.
3. **Margin check**: Agent verifies the initial margin a candidate position would consume under a chosen leverage.
4. **Sanity-check liquidation**: Agent reviews the generic liquidation estimate before committing
   to a stop far from the current price.
5. **Adverse-move assessment**: Agent checks how much a `target_adverse_move_pct` would cost and
   whether the extra margin is fundable from equity.

## Notes / Limitations

- `estimated_liquidation_price` is a **generic modelling approximation** (buffer ≈ `100 / leverage`
  %), **not** an exchange-specific liquidation engine. Exchange maintenance-margin rate, fee rates,
  funding, and tiered risk rules are **not** modelled.
- No funding, fees, or slippage are considered in sizing.
- No symbol or market-data dependency: prices are supplied by the caller, not fetched.
- Framing is generic USDT-nominated equity + generic margin; not wired to any specific venue.
- Do not report the generic liquidation number as an exchange-accurate liquidation level.
- This skill only describes how to use the existing read-only capability; it adds no new Binance
  API or order-management functionality, does not place orders, does not move funds, and is not
  investment advice.
