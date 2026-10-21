---
name: aiko
description: |
  Multi-signal decision-fusion engine for a single token: combines trading-signal momentum,
  crypto-market-rank flow/leaderboard position, and query-token-audit risk into one composite
  decision (LEAN_BUY / NEUTRAL / LEAN_SELL / AVOID) with a confidence score and full rationale.
  Aiko reasons over data that sibling skills fetch — it makes no network calls itself, holds no
  credentials, and never executes a trade.
  Use for: "what does Aiko think about $X", "give me one decision from these signals",
  "synthesize the audit and the trading signal", "risk-weighted read on this token",
  "combine momentum, flow, and risk into a call", "should this even be on my radar".
version: 0.1.0
license: MIT
metadata:
  author: 0xMerl
---

# Aiko Skill

## Overview

Aiko is a **decision-fusion layer**, not a data source. It takes signals already fetched from
other installed skills — [`trading-signal`](../trading-signal/SKILL.md) (momentum),
[`crypto-market-rank`](../crypto-market-rank/SKILL.md) (flow / leaderboard position), and
[`query-token-audit`](../query-token-audit/SKILL.md) (risk) — and reduces them to a single
composite score, a decision bucket, a confidence level, and a plain-language rationale.

It exists because those three skills each answer a narrow question ("is smart money buying?",
"is this trending?", "is the contract dangerous?") and a user asking "what do you think about
this token" needs those combined and weighed against each other, not three separate reports.

**Aiko's own script performs no HTTP calls and requires no API keys or wallet connection.**
All network access happens through the sibling skills listed above; Aiko only does the scoring
arithmetic. See [`references/orchestration.md`](references/orchestration.md) for how to gather
those inputs step by step.

## When to Use This Skill

| User intent | Command |
|--------------|---------|
| Fuse momentum + flow + risk signals for one token into a single decision | `decide` |

## How to Call

```bash
node <skill-dir>/scripts/cli.mjs decide '<json_input>'
```

`<json_input>` is an object with up to three optional keys — `signal` (from `trading-signal`),
`rank` (from `crypto-market-rank`), and `audit` (from `query-token-audit`). Any key you omit is
treated as "no data available" and scored neutrally rather than guessed at. Full field-level
schema, worked examples, and the exact scoring formula are in
[`references/cli.md`](references/cli.md).

## Decision Buckets

| Bucket | Meaning |
|--------|---------|
| `LEAN_BUY` | Composite score ≥ 70, no risk veto, momentum not bearish |
| `NEUTRAL` | Composite score 45–69, or signals conflict, or too little data |
| `LEAN_SELL` | Composite score < 45 and momentum not bullish |
| `AVOID` | Risk veto triggered (see below) — overrides every other input |

These labels are deliberately hedged (`LEAN_*`, not `BUY`/`SELL`) — see Trading Rules below.

## Risk Veto

If `query-token-audit` reports `riskLevel >= 4`, or buy/sell tax over 10%, Aiko forces `AVOID`
regardless of how bullish the momentum or flow signals are. A missing or unavailable audit is
scored as elevated risk (30/100), never as neutral — absence of a red flag is not the same as a
green one. This mirrors the audit-gating behavior already required of
[`binance-agentic-wallet`](../binance-agentic-wallet/references/security.md) before any swap.

## Confidence

Confidence reflects how many of the three signal sources were actually available, not how
strong the composite score is — a unanimous `LEAN_BUY` built from one data source is reported as
low-confidence. Always surface the confidence number alongside the decision; do not present a
low-confidence decision with the same weight as a high-confidence one.

## Execution Boundary — read before doing anything else

Aiko produces a **recommendation object only**. It never places an order, never calls a
state-changing endpoint, and never should be wired to do so silently.

- If the user wants to act on Aiko's decision, hand off to
  [`binance-agentic-wallet`](../binance-agentic-wallet/SKILL.md) or the
  [`binance`](../../binance/binance/SKILL.md) trading skill, and follow **that skill's own**
  confirmation rules in full — do not shortcut them because Aiko already "decided."
  `binance-agentic-wallet` requires explicit user confirmation before every state-changing
  command; that requirement is not optional and Aiko does not change it.
- Do **not** build a loop that reads Aiko's `decision` field and calls a trading skill
  automatically without a human in the middle. If a user explicitly wants that kind of
  unattended automation, read
  [`references/autonomous-mode.md`](references/autonomous-mode.md) first — it lays out why the
  default flow requires confirmation and what a user would need to build (and accept
  responsibility for) themselves to remove it.

## Trading Rules

Per the hub's contribution rules, Aiko's output must stay neutral, factual, and educational:

- Never rephrase a `LEAN_BUY`/`LEAN_SELL` bucket as a guarantee or promotion of the asset.
- Always include the disclaimer field from the script's output verbatim; do not shorten it away.
- Never fabricate a value for a signal that wasn't supplied — report it as unavailable and let
  that lower the confidence score instead.

## Full Reference

- [`references/orchestration.md`](references/orchestration.md) — step-by-step: which sibling
  skill to call for each input, and what to do when one isn't installed.
- [`references/cli.md`](references/cli.md) — full input/output schema, scoring formula, and
  worked examples.
- [`references/autonomous-mode.md`](references/autonomous-mode.md) — why unattended execution is
  out of scope by default, and the safeguards a user would need to add if they build it anyway.
