# perp-risk

Deterministic, offline perpetual position sizing calculator for AI agents.

Given account equity, a risk budget (% of equity), an intended entry price, a stop-loss price,
leverage and side, it returns position size, risk budget, position notional, initial margin, stop
distance, and a **generic** estimated liquidation price.

- Runs entirely locally. No network calls, no credentials, no accounts.
- Does not place, modify or cancel orders.
- Does not model any venue's maintenance-margin tiers, fees or funding.
- Not investment advice.

See [SKILL.md](./SKILL.md) for the full agent-facing specification, input/output contract, and
the formulas.

## Requirements

Python 3.8+ standard library only. Nothing to install — no pip packages, no binaries, no
environment variables, no API keys.

## Usage

The script reads one JSON object on stdin and writes one JSON object on stdout.

```bash
echo '{"equity_usdt":10000,"risk_pct":1,"entry_price":50000,
       "stop_price":48000,"leverage":10,"side":"long"}' \
  | python3 scripts/perp_risk.py
```

Output:

```json
{
  "risk_budget_usdt": 100.0,
  "quantity": 0.05,
  "position_notional_usdt": 2500.0,
  "initial_margin_usdt": 250.0,
  "stop_distance_price": 2000.0,
  "stop_distance_pct": 4.0,
  "estimated_liquidation_price": 45000.0,
  "liquidation_estimate_warning": "Generic estimate only; exchange-specific MMR, fees and funding are not included.",
  "target_adverse_move_loss_usdt": null,
  "extra_margin_for_target_move_usdt": null
}
```

Exit code `0` on success. Exit code `2` when the input is rejected, with a JSON
`{"error": "..."}` object on stderr. Nothing is written to disk.

It can also be imported as a library:

```python
import sys
sys.path.insert(0, "scripts")
from perp_risk import calculate_risk, InputError

result = calculate_risk({
    "equity_usdt": 10000, "risk_pct": 1,
    "entry_price": 50000, "stop_price": 48000,
    "leverage": 10, "side": "long",
})
```

## Input fields

Required: `equity_usdt` (> 0), `risk_pct` (0–100], `entry_price` (> 0), `stop_price` (> 0, below
entry for `long`, above entry for `short`), `leverage` (> 0), `side` (`"long"` or `"short"`).

Optional: `target_adverse_move_pct` (0–100) — when supplied, also reports the USDT loss at that
adverse move and any extra margin needed if it exceeds equity.

Validation is strict. There is no silent coercion and no defaulting.

## Running the tests

```bash
python3 scripts/test_perp_risk.py
```

Expected result: `RESULT: ALL 23 CHECKS PASS`.

The suite is self-contained. Every expected value is a hand-computed constant derived from the
formulas in SKILL.md, with the arithmetic written out as a comment, so the numbers can be audited
by reading the file. It covers 7 valid cases (long/short, 1×–125× leverage, 0.1%–100% risk
budget, both branches of the optional adverse-move calculation) and 16 rejection cases (invalid
equity, out-of-range risk, entry equal to stop, stop on the wrong side for the direction, invalid
side, zero leverage, negative price, missing field, wrong type, and malformed stream input).

No network access is used or required at any point.

## Liquidation estimate caveat

`estimated_liquidation_price` uses a **generic `100 / leverage` buffer from entry**. It ignores
maintenance-margin rate, fee rates, funding, and tiered risk limits, so it is **not** a venue
liquidation price. It always ships with a `liquidation_estimate_warning` field for that reason.
Never present it as an exchange-accurate liquidation level.
