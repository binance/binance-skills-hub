#!/usr/bin/env python3
"""test_perp_risk.py — self-contained test suite for perp_risk.py.

No network, no external imports, no fixtures outside this folder.
Every expected value below is a hand-computed constant, derived from the
formulas documented in SKILL.md, so this file validates the calculator
without depending on any other implementation.

Run:  python3 scripts/test_perp_risk.py
Exit: 0 all pass, 1 any failure.
"""

from __future__ import annotations

import json
import pathlib
import subprocess
import sys

HERE = pathlib.Path(__file__).resolve().parent
SCRIPT = HERE / "perp_risk.py"


def run(payload) -> tuple[int, dict | None, str]:
    """Invoke the CLI contract: JSON on stdin, JSON on stdout."""
    proc = subprocess.run(
        [sys.executable, str(SCRIPT)],
        input=payload if isinstance(payload, str) else json.dumps(payload),
        capture_output=True,
        text=True,
        timeout=30,
    )
    out = None
    if proc.returncode == 0 and proc.stdout.strip():
        out = json.loads(proc.stdout)
    return proc.returncode, out, proc.stderr


# Hand-computed expectations. Each entry: label, payload, expected-fields.
# Derivation is shown inline so the numbers can be audited by reading.
VALID = [
    (
        "long 10x: equity 10000, risk 1%, entry 50000, stop 48000",
        {"equity_usdt": 10000, "risk_pct": 1, "entry_price": 50000,
         "stop_price": 48000, "leverage": 10, "side": "long"},
        {
            # risk_budget = 10000 * 1 / 100        = 100
            "risk_budget_usdt": 100.0,
            # stop_distance = |50000 - 48000|      = 2000
            "stop_distance_price": 2000.0,
            # stop_pct = 2000 / 50000 * 100        = 4.0
            "stop_distance_pct": 4.0,
            # quantity = 100 / 2000                = 0.05
            "quantity": 0.05,
            # notional = 0.05 * 50000              = 2500
            "position_notional_usdt": 2500.0,
            # margin = 2500 / 10                   = 250
            "initial_margin_usdt": 250.0,
            # liq = 50000 * (1 - (100/10)/100)     = 45000
            "estimated_liquidation_price": 45000.0,
            "target_adverse_move_loss_usdt": None,
            "extra_margin_for_target_move_usdt": None,
        },
    ),
    (
        "short 10x: entry 50000, stop 52000",
        {"equity_usdt": 10000, "risk_pct": 1, "entry_price": 50000,
         "stop_price": 52000, "leverage": 10, "side": "short"},
        {
            "risk_budget_usdt": 100.0,
            "stop_distance_price": 2000.0,
            "quantity": 0.05,
            "position_notional_usdt": 2500.0,
            # liq = 50000 * (1 + 10/100) = 55000
            "estimated_liquidation_price": 55000.0,
        },
    ),
    (
        "1x leverage: liq must be at 0 for long",
        {"equity_usdt": 1000, "risk_pct": 2, "entry_price": 2000,
         "stop_price": 1900, "leverage": 1, "side": "long"},
        {
            # risk_budget = 1000 * 2 / 100 = 20
            "risk_budget_usdt": 20.0,
            # quantity = 20 / 100 = 0.2
            "quantity": 0.2,
            # notional = 0.2 * 2000 = 400
            "position_notional_usdt": 400.0,
            # margin = 400 / 1 = 400
            "initial_margin_usdt": 400.0,
            # liq = 2000 * (1 - 100/100) = 0
            "estimated_liquidation_price": 0.0,
        },
    ),
    (
        "100% risk budget: entire equity at risk",
        {"equity_usdt": 500, "risk_pct": 100, "entry_price": 110000,
         "stop_price": 108000, "leverage": 20, "side": "long"},
        {
            # risk_budget = 500 * 100 / 100 = 500
            "risk_budget_usdt": 500.0,
            # quantity = 500 / 2000 = 0.25
            "quantity": 0.25,
            # notional = 0.25 * 110000 = 27500
            "position_notional_usdt": 27500.0,
            # margin = 27500 / 20 = 1375
            "initial_margin_usdt": 1375.0,
            # liq = 110000 * (1 - 5/100) = 104500
            "estimated_liquidation_price": 104500.0,
        },
    ),
    (
        "target adverse move exceeding equity => extra margin required",
        {"equity_usdt": 1000, "risk_pct": 10, "entry_price": 100,
         "stop_price": 95, "leverage": 10, "side": "long",
         "target_adverse_move_pct": 50},
        {
            # risk_budget = 1000 * 10 / 100 = 100
            "risk_budget_usdt": 100.0,
            # quantity = 100 / 5 = 20
            "quantity": 20.0,
            # notional = 20 * 100 = 2000
            "position_notional_usdt": 2000.0,
            # target_loss = 2000 * 50 / 100 = 1000
            "target_adverse_move_loss_usdt": 1000.0,
            # extra = max(0, 1000 - 1000) = 0
            "extra_margin_for_target_move_usdt": 0.0,
        },
    ),
    (
        "target adverse move within equity => no extra margin",
        {"equity_usdt": 10000, "risk_pct": 1, "entry_price": 100,
         "stop_price": 90, "leverage": 5, "side": "long",
         "target_adverse_move_pct": 5},
        {
            # risk_budget = 100
            "risk_budget_usdt": 100.0,
            # quantity = 100 / 10 = 10
            "quantity": 10.0,
            # notional = 10 * 100 = 1000
            "position_notional_usdt": 1000.0,
            # target_loss = 1000 * 5 / 100 = 50
            "target_adverse_move_loss_usdt": 50.0,
            # extra = max(0, 50 - 10000) = 0
            "extra_margin_for_target_move_usdt": 0.0,
        },
    ),
    (
        "125x leverage: liq buffer only 0.8%",
        {"equity_usdt": 100, "risk_pct": 5, "entry_price": 60000,
         "stop_price": 60500, "leverage": 125, "side": "short"},
        {
            # risk_budget = 100 * 5 / 100 = 5
            "risk_budget_usdt": 5.0,
            # quantity = 5 / 500 = 0.01
            "quantity": 0.01,
            # notional = 0.01 * 60000 = 600
            "position_notional_usdt": 600.0,
            # liq = 60000 * (1 + 0.8/100) = 60480
            "estimated_liquidation_price": 60480.0,
        },
    ),
]

# Invalid inputs. Each must exit 2 with a JSON {"error": ...} on stderr.
INVALID = [
    ("zero equity", {"equity_usdt": 0, "risk_pct": 1, "entry_price": 100,
                     "stop_price": 90, "leverage": 5, "side": "long"}),
    ("negative equity", {"equity_usdt": -1, "risk_pct": 1, "entry_price": 100,
                         "stop_price": 90, "leverage": 5, "side": "long"}),
    ("risk_pct zero", {"equity_usdt": 100, "risk_pct": 0, "entry_price": 100,
                       "stop_price": 90, "leverage": 5, "side": "long"}),
    ("risk_pct above 100", {"equity_usdt": 100, "risk_pct": 101,
                            "entry_price": 100, "stop_price": 90,
                            "leverage": 5, "side": "long"}),
    ("entry equals stop", {"equity_usdt": 100, "risk_pct": 1,
                           "entry_price": 100, "stop_price": 100,
                           "leverage": 5, "side": "long"}),
    ("long stop above entry", {"equity_usdt": 100, "risk_pct": 1,
                               "entry_price": 100, "stop_price": 110,
                               "leverage": 5, "side": "long"}),
    ("short stop below entry", {"equity_usdt": 100, "risk_pct": 1,
                                "entry_price": 100, "stop_price": 90,
                                "leverage": 5, "side": "short"}),
    ("invalid side", {"equity_usdt": 100, "risk_pct": 1, "entry_price": 100,
                      "stop_price": 90, "leverage": 5, "side": "sideways"}),
    ("zero leverage", {"equity_usdt": 100, "risk_pct": 1, "entry_price": 100,
                       "stop_price": 90, "leverage": 0, "side": "long"}),
    ("negative stop price", {"equity_usdt": 100, "risk_pct": 1,
                             "entry_price": 100, "stop_price": -10,
                             "leverage": 5, "side": "long"}),
    ("target pct equals 100", {"equity_usdt": 100, "risk_pct": 1,
                               "entry_price": 100, "stop_price": 90,
                               "leverage": 5, "side": "long",
                               "target_adverse_move_pct": 100}),
    ("missing side", {"equity_usdt": 100, "risk_pct": 1, "entry_price": 100,
                      "stop_price": 90, "leverage": 5}),
    ("string instead of number", {"equity_usdt": "100", "risk_pct": 1,
                                  "entry_price": 100, "stop_price": 90,
                                  "leverage": 5, "side": "long"}),
]


def main() -> int:
    failures: list[str] = []
    passed = 0

    print("=" * 70)
    print("perp_risk.py — self-contained test suite (hand-computed expectations)")
    print("=" * 70)

    print("\nVALID INPUTS")
    print("-" * 70)
    for label, payload, expected in VALID:
        code, got, err = run(payload)
        if code != 0:
            failures.append(f"[{label}] expected exit 0, got {code}: {err.strip()}")
            print(f"  FAIL  {label}\n        exit={code} {err.strip()}")
            continue
        assert got is not None
        mismatch = {
            k: {"expected": v, "got": got.get(k)}
            for k, v in expected.items()
            if got.get(k) != v
        }
        # warning must always ride along with the liquidation estimate
        if "liquidation_estimate_warning" not in got or not got["liquidation_estimate_warning"]:
            mismatch["liquidation_estimate_warning"] = "missing or empty"
        if mismatch:
            failures.append(f"[{label}] {mismatch}")
            print(f"  FAIL  {label}\n        {mismatch}")
        else:
            passed += 1
            print(f"  ok    {label}")

    print("\nINVALID INPUTS (must exit 2 with JSON error on stderr)")
    print("-" * 70)
    for label, payload in INVALID:
        code, out, err = run(payload)
        if code != 2:
            failures.append(f"[{label}] expected exit 2, got {code}")
            print(f"  FAIL  {label}: exit={code} (expected 2)")
            continue
        if out is not None:
            failures.append(f"[{label}] wrote to stdout on a rejected input")
            print(f"  FAIL  {label}: wrote stdout on rejection")
            continue
        try:
            msg = json.loads(err).get("error")
        except json.JSONDecodeError:
            failures.append(f"[{label}] stderr was not JSON: {err!r}")
            print(f"  FAIL  {label}: stderr not JSON")
            continue
        if not msg:
            failures.append(f"[{label}] error message empty")
            print(f"  FAIL  {label}: empty error")
            continue
        passed += 1
        print(f"  ok    {label}: {msg}")

    print("\nMALFORMED STREAM INPUT")
    print("-" * 70)
    for label, raw in [("empty stdin", ""), ("invalid JSON", "{bad"),
                       ("JSON array not object", "[1,2,3]")]:
        code, out, err = run(raw)
        if code != 2:
            failures.append(f"[{label}] expected exit 2, got {code}")
            print(f"  FAIL  {label}: exit={code}")
            continue
        passed += 1
        print(f"  ok    {label}: rejected")

    print("\n" + "=" * 70)
    if failures:
        print(f"RESULT: {len(failures)} FAILURE(S), {passed} passed")
        for f in failures:
            print(f"  - {f}")
        return 1
    print(f"RESULT: ALL {passed} CHECKS PASS")
    return 0


if __name__ == "__main__":
    sys.exit(main())
