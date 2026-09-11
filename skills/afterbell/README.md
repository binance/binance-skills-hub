# AFTERBELL — market protection for tokenized equities

**AFTERBELL is an autonomous safety agent for AI agents trading Binance bStocks
through Agent OS.**

A bStock trades around the clock. The U.S. stock it takes its price from does
not: it trades on weekday sessions and then stops updating. So a token can keep
moving all weekend while the last independent price of the thing underneath it
gets older and older.

AFTERBELL measures that gap and treats it as a risk input. The longer the
reference market has been shut, the less new exposure it will permit. It applies
the same idea when the token book is thin, when the token and the reference
price disagree, when the instrument cannot be identified exactly, or when
current account holdings are unknown.

It is a check, not a trader. It returns a size and a reason. It never places,
changes, or cancels an order, and it holds no exchange credential.

## What is in this skill

[`SKILL.md`](SKILL.md) — when to use it, how to call it, what a result means,
and what it refuses to do.

## What it does between requests

The monitor runs unattended. Each cycle is reduced to the bands the limits
already respond to, and when one of them moves it records the change on its own
and says why it matters:

```text
AFTERBELL noticed a material change on NVDABUSDT.

Reference market: RTH_OPEN -> CLOSED_WEEKEND
Safety posture: Clear -> Smaller size

The market that supplies the independent price changed session.
The size AFTERBELL is willing to stand behind changed as a result.

Nobody asked for this. No order was created and no authorization was issued.
```

Nothing is signed when this happens and no order is created. An authorization
is bound to one specific proposal, and a background observation has no proposal
behind it. The record exists so a later request is judged against a current
picture rather than a stale one. Read it with `get_safety_posture`.

## What it is built on

Measurements come from ordinary deterministic code, not from a model. A model
can explain a result; it cannot supply a price, a limit, or an outcome.

Published measurements, from the project's own recorder:

- 39,895 recorded order books and 36,045 reference prices
- 868 regular-hours observations per token against a 300 minimum, plus 1,440
  observations captured across a market holiday
- 35 hostile request patterns across two market conditions, none of which
  raised the permitted size above its control
- 6 of 6 positive controls, so the test cannot pass by refusing everything

The reports are generated, not written by hand:
[calibration](https://github.com/Jennycruzy/afterbell/blob/main/docs/calibration.md),
[evaluation](https://github.com/Jennycruzy/afterbell/blob/main/docs/evaluation.md).

## How it reaches an order

AFTERBELL signs a short-lived, single-use authorization for a size it permitted.
A supported client submits exactly that, and the record written afterwards
carries the requested, permitted, and actually-spent amounts side by side, with
the spent amount read back from the venue response.

One order has been placed this way end to end: a 5.00 USDT buy of `NVDABUSDT`,
of which 4.86192 USDT was spent, recorded in
[`docs/live-acceptance.md`](https://github.com/Jennycruzy/afterbell/blob/main/docs/live-acceptance.md).

To be exact about what that guarantees: the venue's own tools do not check
AFTERBELL's signature, and the account session belongs to the client rather than
to this package. So the promise is about the handoff — that path never produces
an order larger than AFTERBELL permitted, and the record shows what was actually
spent. It is not a restriction on everything the client's own credential can do.
Restricting that would mean holding it, which this skill does not.

## Links

- Source and tests: <https://github.com/Jennycruzy/afterbell>
- Live dashboard: <https://afterbell.site>

Tokenized securities are certificates and do not imply direct ownership of the
share underneath. This is a technical control, not advice or a recommendation.
