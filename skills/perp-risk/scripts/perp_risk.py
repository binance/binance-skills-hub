#!/usr/bin/env python3
"""perp_risk.py — deterministic perpetual position sizing calculator.

Self-contained, stdlib-only, no network, no external dependencies.
Reads a JSON object from stdin, writes a JSON object to stdout.
Reads and writes nothing else; makes no outbound calls of any kind.

Formulas (all caller-supplied; nothing is fetched):
    risk_budget   = equity_usdt * risk_pct / 100
    quantity      = risk_budget / |entry_price - stop_price|
    notional      = quantity * entry_price
    initial_margin= notional / leverage
    stop_dist_pct = |entry_price - stop_price| / entry_price * 100
    target_loss   = notional * target_adverse_move_pct / 100   (optional)
    extra_margin  = max(0, target_loss - equity_usdt)          (optional)

The liquidation figure is a GENERIC approximation only: it assumes a
100/leverage percentage buffer from entry and ignores maintenance-margin
tiers, fees, funding and risk limits. It is not an exchange liquidation price.

This is a calculator, not advice, and it never places, modifies or cancels
an order.

Exit codes: 0 success, 2 invalid input (message on stderr as JSON).
"""

from __future__ import annotations

import json
import sys

LIQUIDATION_WARNING = (
    "Generic estimate only; exchange-specific MMR, fees and funding are not included."
)


class InputError(ValueError):
    """Raised for any caller input that cannot produce a meaningful result."""


def _num(payload: dict, key: str, *, required: bool = True):
    """Fetch a finite float from payload with type validation."""
    if key not in payload or payload[key] is None:
        if required:
            raise InputError(f"{key} is required")
        return None
    value = payload[key]
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        raise InputError(f"{key} must be a number")
    if value != value or value in (float("inf"), float("-inf")):
        raise InputError(f"{key} must be a finite number")
    return float(value)


def calculate_risk(payload: dict) -> dict:
    """Validate inputs and return the sizing result as a plain dict."""
    if not isinstance(payload, dict):
        raise InputError("request body must be a JSON object")

    equity_usdt = _num(payload, "equity_usdt")
    risk_pct = _num(payload, "risk_pct")
    entry_price = _num(payload, "entry_price")
    stop_price = _num(payload, "stop_price")
    leverage = _num(payload, "leverage")
    target_pct = _num(payload, "target_adverse_move_pct", required=False)

    side = payload.get("side")
    if not isinstance(side, str):
        raise InputError("side is required and must be 'long' or 'short'")

    # --- validation, mirroring the reference implementation exactly ---
    if equity_usdt <= 0:
        raise InputError("equity_usdt must be > 0")
    if not 0 < risk_pct <= 100:
        raise InputError("risk_pct must be in (0, 100]")
    if entry_price <= 0:
        raise InputError("entry_price must be > 0")
    if stop_price <= 0:
        raise InputError("stop_price must be > 0")
    if leverage <= 0:
        raise InputError("leverage must be > 0")
    if side not in {"long", "short"}:
        raise InputError("side must be long or short")

    stop_distance = abs(entry_price - stop_price)
    if stop_distance == 0:
        raise InputError("entry_price and stop_price must differ")

    if side == "long" and stop_price >= entry_price:
        raise InputError("long stop_price must be below entry_price")
    if side == "short" and stop_price <= entry_price:
        raise InputError("short stop_price must be above entry_price")

    if target_pct is not None and not 0 < target_pct < 100:
        raise InputError("target_adverse_move_pct must be in (0, 100)")

    # --- deterministic sizing ---
    risk_budget = equity_usdt * risk_pct / 100.0
    quantity = risk_budget / stop_distance
    notional = quantity * entry_price
    initial_margin = notional / leverage
    stop_distance_pct = stop_distance / entry_price * 100.0

    target_loss = None
    extra_margin = None
    if target_pct is not None:
        target_loss = notional * target_pct / 100.0
        extra_margin = max(0.0, target_loss - equity_usdt)

    # --- generic liquidation approximation (100 / leverage buffer) ---
    buffer_pct = 100.0 / leverage
    if side == "long":
        est_liq = entry_price * (1 - buffer_pct / 100.0)
    else:
        est_liq = entry_price * (1 + buffer_pct / 100.0)

    return {
        "risk_budget_usdt": round(risk_budget, 8),
        "quantity": round(quantity, 8),
        "position_notional_usdt": round(notional, 8),
        "initial_margin_usdt": round(initial_margin, 8),
        "stop_distance_price": round(stop_distance, 8),
        "stop_distance_pct": round(stop_distance_pct, 8),
        "estimated_liquidation_price": round(est_liq, 8),
        "liquidation_estimate_warning": LIQUIDATION_WARNING,
        "target_adverse_move_loss_usdt": (
            None if target_loss is None else round(target_loss, 8)
        ),
        "extra_margin_for_target_move_usdt": (
            None if extra_margin is None else round(extra_margin, 8)
        ),
    }


def main(argv: list[str]) -> int:
    raw = sys.stdin.read()
    if not raw.strip():
        print(json.dumps({"error": "empty input; send a JSON object on stdin"}),
              file=sys.stderr)
        return 2
    try:
        payload = json.loads(raw)
    except json.JSONDecodeError as exc:
        print(json.dumps({"error": f"invalid JSON: {exc}"}), file=sys.stderr)
        return 2
    try:
        result = calculate_risk(payload)
    except InputError as exc:
        print(json.dumps({"error": str(exc)}), file=sys.stderr)
        return 2
    print(json.dumps(result, indent=2, sort_keys=False))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
