---
name: perp-risk
description: |
  Deterministic position sizing for a leveraged perpetual position, computed locally with no
  network calls. Given account equity, a chosen risk budget (as % of equity), an intended entry
  price, a stop-loss price, leverage and side, it returns position size, risk budget, position
  notional, initial margin, stop distance and a GENERIC estimated liquidation price. Use it before
  opening or increasing a leveraged perpetual position when you need to turn a risk-per-trade
  decision into a concrete quantity and notional. It is a pure calculator: it never places,
  modifies or cancels an order, does not model any venue's maintenance-margin tiers, fees or
  funding, and is not investment advice.
license: MIT
metadata:
  version: 2.0.0
  author: SangJieGe
---

# Perp Risk

Local, deterministic perpetual position sizing. Given equity, risk %, entry, stop, leverage and
side, it computes the position size that keeps the worst-case stop-loss loss inside the risk
budget, plus the resulting notional, initial margin, stop distance and a **generic** estimated
liquidation price for sanity-checking.

All arithmetic runs in `scripts/perp_risk.py` on your own machine. The skill sends nothing over
the network and needs no credentials, API keys or accounts.

## When to Use

Use this skill **before opening or modifying a leveraged perpetual position** when you must turn
a risk-per-trade decision into a concrete quantity and notional before quoting an order size.

Trigger intents:

| Agent intent | What this gives |
|---|---|
| "How much can I buy at entry E with a stop at S, risking 1% of equity?" | Quantity from equity + risk budget + entry + stop |
| "What notional and margin does this need at Nx leverage?" | Position notional + initial margin |
| "How far is my stop, and where is liquidation roughly?" | Stop distance + generic liquidation estimate |
| "If price moves adversely by Y%, what do I lose / need to add?" | Optional `target_adverse_move_pct` funding check |

Do **not** use it when there is no stop-loss price yet — sizing without a defined exit stop is
out of scope. Do not use it to place, modify or cancel orders.

## How to Run It

The script reads one JSON object on stdin and writes one JSON object on stdout. Standard library
only; nothing to install.

```bash
echo '{"equity_usdt":10000,"risk_pct":1,"entry_price":50000,
       "stop_price":48000,"leverage":10,"side":"long"}' \
  | python3 scripts/perp_risk.py
```

Exit code `0` means success. Exit code `2` means the input was rejected; the reason is a JSON
`{"error": "..."}` object on stderr. Nothing is fetched and nothing is written to disk.

You may also call it as a library:

```python
import sys; sys.path.insert(0, "scripts")
from perp_risk import calculate_risk, InputError

result = calculate_risk({
    "equity_usdt": 10000, "risk_pct": 1,
    "entry_price": 50000, "stop_price": 48000,
    "leverage": 10, "side": "long",
})
```

## Input

Required fields:

| Field | Type | Meaning |
|---|---|---|
| `equity_usdt` | number > 0 | Account usable equity in USDT |
| `risk_pct` | number in (0, 100] | Portion of equity budgeted as intended stop-loss risk |
| `entry_price` | number > 0 | Intended entry price |
| `stop_price` | number > 0 | Stop-loss; below entry for `long`, above entry for `short` |
| `leverage` | number > 0 | Intended leverage multiplier |
| `side` | `"long"` \| `"short"` | Position direction |

Optional field:

| Field | Type | Meaning |
|---|---|---|
| `target_adverse_move_pct` | number in (0, 100) | If supplied, also reports the loss at that adverse move and any extra margin needed |

Validation is strict: no silent coercion, no defaults. All prices and equity are supplied by you;
the script has no market data and no symbol awareness.

## Output

Deterministic fields:

| Field | Meaning |
|---|---|
| `risk_budget_usdt` | USDT amount at risk from entry to stop |
| `quantity` | Position size in base units |
| `position_notional_usdt` | Notional value of the position |
| `initial_margin_usdt` | Required initial margin at the chosen leverage |
| `stop_distance_price` | Absolute price distance entry → stop |
| `stop_distance_pct` | Stop distance as % of entry |

Estimate field, always paired with its warning:

| Field | Meaning |
|---|---|
| `estimated_liquidation_price` | **Generic** estimate (`100 / leverage` buffer from entry) |
| `liquidation_estimate_warning` | Always present; states what the estimate ignores |

Conditional fields, present only when `target_adverse_move_pct` is supplied (else `null`):

| Field | Meaning |
|---|---|
| `target_adverse_move_loss_usdt` | Loss in USDT at the target adverse move |
| `extra_margin_for_target_move_usdt` | Extra margin needed if that loss exceeds equity |

There is **no** `ALLOW` / `WARN` / `BLOCK` output. This is a calculator; you decide whether the
returned sizing is acceptable.

## Formulas

```
risk_budget    = equity_usdt * risk_pct / 100
stop_distance  = |entry_price - stop_price|
quantity       = risk_budget / stop_distance
notional       = quantity * entry_price
initial_margin = notional / leverage
stop_dist_pct  = stop_distance / entry_price * 100
target_loss    = notional * target_adverse_move_pct / 100      (optional)
extra_margin   = max(0, target_loss - equity_usdt)             (optional)
liq_buffer_pct = 100 / leverage
long  est_liq  = entry_price * (1 - liq_buffer_pct / 100)
short est_liq  = entry_price * (1 + liq_buffer_pct / 100)
```

## Example

A LONG perp sized to risk 1% of a 10,000 USDT account:

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

Returns `risk_budget_usdt = 100`, `stop_distance_price = 2000`,
`stop_distance_pct ≈ 4.0`, `quantity = 0.05`, `position_notional_usdt = 2500`,
`initial_margin_usdt = 250`, and `estimated_liquidation_price = 45000` (entry down 10% under the
`100 / leverage` model) with `liquidation_estimate_warning` present.

## Use Cases

1. **Pre-order sizing**: compute a concrete quantity and stop before sending any perp order.
2. **Risk-budget planning**: confirm the chosen stop keeps worst-case loss at `risk_pct` of equity.
3. **Margin check**: see the initial margin a candidate position consumes at a chosen leverage.
4. **Stop sanity check**: review how much room the stop leaves against the generic liquidation estimate.
5. **Adverse-move assessment**: check what a `target_adverse_move_pct` would cost and whether the
   extra margin is fundable from equity.

## Notes / Limitations

- `estimated_liquidation_price` is a **generic modelling approximation** (buffer ≈ `100 / leverage`
  %), **not** a venue liquidation price. Maintenance-margin rate, fee rates, funding and tiered
  risk limits are **not** modelled. Never report it as an exchange-accurate liquidation level.
- Fees, funding and slippage are not included anywhere in the sizing.
- No symbol, venue or market-data awareness: every price is caller-supplied.
- A result from this skill is a calculation, not a recommendation. It does not execute trades, does
  not touch funds, and is not investment advice.
- If the sizing looks unsafe for the account, say so to the user rather than silently adjusting
  their inputs to obtain a more convenient number.
