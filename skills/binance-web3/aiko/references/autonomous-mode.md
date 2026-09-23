# Why Aiko Doesn't Trade By Itself

Aiko's `decide` command is deliberately a pure, read-only calculation with no side effects. This
is not a missing feature — it's a boundary kept on purpose, for reasons worth stating explicitly
since "an agent that decides on its own" is exactly what Aiko was asked to be.

## Why the default has no autonomous execution path

- **Every other trading-capable skill in this hub requires human confirmation before a
  state-changing call.** `binance-agentic-wallet` states it plainly: "Confirm before execution.
  Confirm with the user each time before any state-changing command." Aiko wiring itself around
  that check — even indirectly, by calling `baw` in a loop keyed off its own `decision` field —
  would defeat a safeguard that exists for a reason: real funds move, and a wrong call is not
  reversible.
- **Skills in this hub run with full agent permissions on whatever machine installs them.** A
  published skill that fires trades unattended is something a stranger could install and walk
  away from, not just something its author runs carefully. The blast radius of a mistake (a bad
  composite score, a stale audit, an upstream API hiccup) is somebody else's money, not a bug
  report.
- **The hub's own trading rules require output to stay neutral, factual, and educational** — an
  autonomous executor is, by construction, no longer just informational.

## If you still want this

Aiko's `decide` output is plain JSON specifically so it *can* be consumed by something else. If
you build a personal automation on top of it, that automation is your code, running with your
API keys, under your judgment — not a feature of this skill. At minimum:

- **Default to dry-run.** Log what it *would* have done before ever letting it place a real
  order.
- **Use a trade-only API key with withdrawals disabled**, scoped to the smallest permission set
  that works.
- **Hard-cap position size and daily loss**, enforced in code, not just as a setting you trust
  yourself to respect.
- **Require `riskVeto: false` and a minimum `confidence`** before acting on any decision — never
  act on a low-confidence read just because the bucket happened to be `LEAN_BUY`.
- **Keep a kill switch and an audit log** you actually check.
- **Never remove the confirmation step from `binance-agentic-wallet` itself** — build your
  automation to call it the same way a human-directed session would, so the same safety checks
  (audit pre-check, slippage disclosure, etc.) still run.

None of the above is enforced by Aiko or by this hub. It's the minimum a reasonable person would
want in place before letting code they wrote spend real money without asking first.
