---
name: portfolio-weight-agent
description: |
  Decide whether a Binance spot portfolio should be rebalanced right now — and be
  able to answer no. The user declares target weights once; this computes NAV,
  per-position drift and volatility-scaled tolerance bands from live Binance data,
  prices the correction against real order-book depth, and then judges whether
  acting now beats waiting. It can decline a single leg while acting on the others.
  Use when the user asks: "is my portfolio off target", "should I rebalance",
  "what should I buy and sell to get back to my weights", "why didn't you sell X",
  "I want 50% BTC, 30% ETH, 20% cash", "add a basket of AI tokens at 15%".
  Do NOT use for price predictions, entry/exit timing on a single asset, futures,
  margin, or anything that is not weight drift in a spot portfolio.
  It never places an order. Orders go to the Binance MCP server, where Binance
  asks the user to confirm each one.
metadata:
  author: Himess
  version: "1.0.0"
license: MIT
---

# Portfolio Weight Agent Skill

## Overview

Rebalancing means selling what went up and buying what went down. That is
psychologically hard, so most people never do it. This agent proposes the trade
so the user only has to approve it.

The refinement that makes it an agent rather than a threshold rule: **not every
breach should be corrected now.** An asset mid-crash is a falling knife, and
buying into it is worse than waiting. This can decline that leg while acting on
the others in the same check.

Two layers, and the boundary between them is the point:

| Layer | What it decides | Model involved |
|---|---|---|
| Deterministic core | NAV, drift, tolerance bands, order-book slippage, fees, exchange filters, whether the buys are payable | **Never** |
| Judgment | Whether to act now, on which legs, by which execution method | Yes — schema-constrained, with a deterministic fallback |

Every figure the user sees is computed. The model writes prose containing
placeholders and the server substitutes real values, so a fabricated number
cannot reach the user.

## When to Use This Skill

| User intent | Tool |
|---|---|
| Declare or change target weights | `set_allocation` |
| "Add a basket of AI tokens at 15%" — a category, not tickers | `set_allocation` (a basket target) |
| "Am I off target?" — numbers only, no opinion | `review_portfolio` |
| "Should I rebalance?" — the full decision with a plan | `propose_rebalance` |
| "Why didn't you sell AVAX?" | `explain_decision` |
| "What has it decided before?" | `list_decisions` |

## Setup

This skill drives an MCP server. Add it once:

```bash
# Hosted — nothing to install
claude mcp add --transport http portfolio-weight-agent https://portfolio-weight-agent.vercel.app/api/mcp

# Or from a clone, over stdio
claude mcp add portfolio-weight-agent -- node --env-file-if-exists=.env --import tsx src/mcp/stdio.ts
```

Pair it with Binance's own server, which is where balances and orders live:

```bash
claude mcp add --transport http binance https://agent.binance.com/mcp/agentic
```

Market data needs no credentials. A judgment provider key (any of several) turns
on the timing decision; without one every figure is still computed and the agent
falls back to the plain band rule, labelled as such.

## Commands

| Tool | Purpose | Required args |
|---|---|---|
| `set_allocation` | Declare target weights. A basket target names a *category* and is resolved to real tradable symbols, returned with its rationale and what it deliberately excluded. | `targets` |
| `review_portfolio` | NAV, per-position target/current/drift/band, and which positions are outside their band. Pure arithmetic on live prices — no model is consulted. | `holdings` |
| `propose_rebalance` | The full loop. Returns the verdict, the reasoning, the fact sheet it was decided from, and the ordered legs with exact quantities. On a decline it returns the trade it *refused*, sized and priced. | `holdings` |
| `explain_decision` | Answers from the stored fact sheet of the last verdict, not a fresh look at the market. | — |
| `list_decisions` | The decision log, append-only. | — |

Optional args worth passing when you have them: `tracking` on `set_allocation`
(`patient` / `balanced` / `tight` / `continuous`), and `daysSinceLastRebalance`
plus `askedLast24h` on `propose_rebalance` — staleness and how often the user has
already been interrupted both feed the timing call.

## Rules

- **Read balances from the Binance MCP server and pass them in as `holdings`.**
  This server holds no credentials and cannot see an account. Call
  `spot.getAccount` on the Binance server, then hand the non-zero balances over
  as `[{ symbol, qty }]`. Cash is `USDT` unless the allocation says otherwise.

- **It never places an order.** `propose_rebalance` returns a plan. Send the legs
  through the Binance MCP server (`spot.newOrder`), in the order given, and
  Binance will ask the user to confirm each one. Do not describe an order as
  placed until Binance has confirmed it.

- **A decline is an answer, not a failure.** If the verdict is `HOLD` or
  `PARTIAL`, report it as the decision. Do not re-run the tool hoping for a
  different verdict — the timing layer is deliberately allowed to say no, and
  re-rolling it until it agrees defeats the entire product.

- **The band is per position, not a single number.** A large total drift can
  coexist with nothing worth trading, because it is spread thin. Bands scale with
  each asset's own realized volatility, so a jumpy asset tolerates more drift than
  a calm one at the same target weight. Report the per-position band, not just the
  total.

- **A resolved basket is pinned.** Once the user approves a category's members,
  they do not re-resolve on their own. Never silently change what a basket
  contains — re-resolve only when the user asks.

- **`explain_decision` answers from the past.** It uses the fact sheet the verdict
  was made from, not the market as it is now. That is deliberate: the user is
  asking why a decision was made, not what you would decide today.

- **Quantities are the server's, never yours.** Do not compute, round, or restate
  an order size. Use the numbers returned verbatim.

## What this skill cannot do

Stated plainly, because each is a design decision rather than a gap:

- **No order placement.** Every write goes through Binance's own confirm gate.
- **No withdrawal.** Measured, not asserted: the authenticated Binance MCP
  `tools/list` returns 81 tools and the only one matching "withdraw" is
  `wallet.withdrawHistory`, which reads past withdrawals. There is no tool that
  moves funds off the account.
- **No futures, margin or leverage.** The consent screen offers them; this
  workflow does not use them, and a spot rebalancer that borrows is a different
  product.
- **No background execution.** The Binance MCP session is bound to the user's own
  client via OAuth with no `client_credentials` grant, so nothing runs unattended.
  Drift is watched server-side and the user is notified; the decision and the
  approval both happen with a person present.

## Neutrality

This skill takes the user's own target weights as given. It does not choose
assets, rank them, or hold a view on any of them, and the tickers in this
document are examples of phrasing rather than suggestions. A resolved
category is a mapping from the user's words to tradable symbols, returned
with its reasoning and its exclusions for the user to accept or edit — not a
recommendation. Nothing here is investment advice, and no outcome is safe or
guaranteed.

## Reference

Design, measurements and evidence: <https://github.com/Himess/portfolio-weight-agent>

The tool list is captured from a live `tools/list` over stdio rather than written
by hand — see `docs/mcp-agent-tools.json` in that repository, reproducible with
`npm run mcp:check`.
