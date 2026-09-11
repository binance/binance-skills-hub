---
name: afterbell-calendar-risk
description: >-
  Autonomous safety agent for AI agents trading Binance bStocks (tokenized U.S.
  equities). Use before a bStock order: it compares token-market conditions with
  the hours and condition of the underlying U.S. market and returns the largest
  defensible amount, and it notices material safety changes on its own between
  requests. Its limits are deterministic; it never places an order.
license: MIT
metadata:
  version: "1.0.0"
  author: Jennycruzy
---

# AFTERBELL — market protection for tokenized equities

## The idea

AFTERBELL is an autonomous safety agent that serves AI trading agents. bStocks
can trade around the clock. The U.S. market that supplies their reference price
is open for only part of the week. AFTERBELL measures that gap, checks the live
token book, and limits new exposure when the independent price is old or the
market is unusually difficult to trade.

The trading agent owns the intent. AFTERBELL independently owns the safety
limit. Binance Agent OS owns authenticated execution. The limits are computed by
ordinary deterministic code: a language model may explain a result, it cannot
choose the permitted amount or overturn a refusal.

Use this skill before a bStock order. It returns the largest amount the system
is willing to permit and a short explanation. It cannot place, amend, or cancel
an order, and it holds no exchange credential.

## When to use it

- Before buying or selling one of the five supported pairs:
  `NVDABUSDT`, `TSLABUSDT`, `MUBUSDT`, `CRCLBUSDT`, or `SNDKBUSDT`.
- When a request names a company rather than an exact instrument. “Buy Nvidia”
  needs an explicit resolution to the token certificate, issuer, network, and
  underlying stock.
- When a contract address or current account exposure needs checking.

Do not use it to choose an investment or predict a price. It only constrains an
order proposed by something else.

## What it notices on its own

Between requests the monitor keeps watching. When the reference market changes
session, the independent price ages past a threshold the limits respond to, the
book leaves its normal range, the token drifts from the reference, the venue
changes what it reports, or account evidence expires, it records that change and
explains why it matters.

It does not create an order or a standing permission when it does this. The
record is there so that the next request is judged against a current picture.
Ask `get_safety_posture` to read it.

## Adoption

```python
from afterbell import Guard, OrderRequest, Side

guard = Guard.from_policy("config/policy.yaml")
order = OrderRequest("NVDABUSDT", Side.BUY, 5000.0, query="buy Nvidia")
decision = guard.evaluate(order)
if decision.allowed_notional > 0:
    mcp.place_order(order.at(decision.allowed_notional))
```

`order.at()` refuses to increase the requested amount. From a shell:

```bash
python -m afterbell.engine \
  --symbol NVDABUSDT --notional 5000 --query "buy Nvidia"
```

## What a result means

```text
Reference market: weekend closure · reference age 16h
Market timing: smaller size · independent price will not refresh for 73.5h
Liquidity: blocked · regular-hours comparison is not available yet
Price agreement: clear · token is 3 bps from the reference
Corporate actions: caution · current venue status is clear; future notice is not guaranteed
Instrument identity: clear · exact certificate and underlying resolved
Contract address: clear · address matches the checked registry
Account exposure: blocked · recent signed account report was not supplied

Decision: blocked · requested 5,000 → allowed 0 USDT
```

The amount is the smallest safe ceiling from those independent observations.
The result is recorded in the append-only decision history.

## Why an account report can stop an order

Before adding exposure, AFTERBELL needs a recent, signed view of what the
account already holds across the supported symbols. If that report is missing,
stale, unsigned, or altered, the system will not pretend the account is empty.
It refuses new exposure instead.

The report carries signed USDT notionals and a verification signature. It does
not carry an exchange login, and AFTERBELL stores only its identity and result,
not the raw account export.

## Configure the order limit

The starting amount is the `base_notional_usdt` value in
[`config/policy.yaml`](https://github.com/Jennycruzy/afterbell/blob/main/config/policy.yaml). Choose the maximum amount one request may ask for there.
The market checks can reduce it when the reference price is old, the book is
thin, the token and reference disagree, the instrument is unclear, or current
account exposure is not known.

The dashboard shows the current amount and links directly to the configuration.

## What it protects against

- stale or missing underlying-market prices;
- thin books and unusually expensive fills;
- large token/reference price differences;
- reported venue restrictions or corporate-action messages;
- ambiguous instruments and counterfeit contract addresses;
- unknown aggregate account exposure; and
- prompt injection, urgency, authority claims, or fabricated measurements.

All measurements and limits are computed by ordinary deterministic code. A
language model may narrate a recorded result, but it cannot supply a number or
change the result.

## Boundaries and evidence

The public dashboard at <https://afterbell.site> shows the current order limit,
measurements, and recorded decisions. It does not place orders. The recorder,
dashboard, and evaluator hold no exchange credential. Any future order
submission stays outside this dashboard and uses a supported client.

The data report, safety-test report, acceptance record, and signed account-input
runbook are linked from the dashboard and repository:

- [`docs/calibration.md`](https://github.com/Jennycruzy/afterbell/blob/main/docs/calibration.md)
- [`docs/evaluation.md`](https://github.com/Jennycruzy/afterbell/blob/main/docs/evaluation.md)
- [`docs/live-acceptance.md`](https://github.com/Jennycruzy/afterbell/blob/main/docs/live-acceptance.md)
- [`docs/position-input.md`](https://github.com/Jennycruzy/afterbell/blob/main/docs/position-input.md)

Tokenized securities are certificates and do not imply direct ownership of the
underlying share. This skill is a technical control, not advice or a
recommendation.

Source and tests: <https://github.com/Jennycruzy/afterbell>
