---
name: jaga-risk-guard
description: |
  Deterministic risk guardrails for a spot subaccount an AI agent trades. Use when the user wants to
  protect, guard or de-risk a portfolio; to enforce a stop-loss, trailing stop, take-profit, per-asset
  position cap, total exposure cap, flash-crash circuit breaker, daily-loss limit or max-drawdown rule;
  to ask what rule is closest to tripping; or to review whether a trading agent's activity has pushed
  the account outside the user's limits. Takes an account snapshot plus prices from any Binance MCP
  server or CLI and returns the rule violations and the exact sell-to-quote orders that would restore
  the limits. The decision path is pure arithmetic — no model output can widen a limit, and the skill
  never buys, never withdraws and never proposes anything but selling back to the quote asset.
version: 1.0.0
license: MIT
---

# Jaga risk guard

An agent that trades and an agent that guards should not be the same agent. This skill is the guard: it
reads what an account actually holds, compares it against limits the user set in advance, and reports
what breached and what selling back to the quote asset would fix it. It computes; it does not execute.

## When to use it

- The user asks to protect a portfolio, set a stop-loss or trailing stop, cap how much of the book one
  asset may be, cap total exposure, or stop trading after losing N% in a day.
- The user asks "what is closest to tripping?" or "am I still inside my limits?".
- Another agent (or a person) has been trading the account and the user wants the damage checked.
- A market move looks violent and the user wants to know whether a rule fires.

Do not use it to pick trades, to size entries, or to judge whether an asset is good. It has no opinion
about any asset — only about how much of one the user said they would tolerate.

## Inputs

Two things, in whatever shape your Binance MCP server or CLI returns them — the skill normalises the
common ones (`{balances:[…]}`, `{data:{…}}`, `[{asset,free}]`, `{BTC:0.1}`, `{SYMBOL:price}`,
`[{symbol,price}]`, `{symbol:{price}}`):

1. **Account balances** — from an account/balance tool.
2. **Prices** — from a ticker/prices tool. Include the quote pair for every asset held; assets without a
   direct pair are valued through a USDT/USDC/BTC bridge and counted, never traded.

Plus a **rules file** the user owns. Copy `references/rules.example.json` and edit the numbers; the
comments in `references/rules.md` explain what each one does and what a sane starting value looks like.

## How to run it

```bash
node scripts/risk-check.mjs --account account.json --prices prices.json --rules rules.json
```

Add `--state state.json` and the skill remembers the cost basis, the high-water mark and the day's
starting equity between calls. **Keep this file.** Without it every run treats the current price as the
entry price, so a stop-loss can never fire and a trailing stop has nothing to trail — the check silently
becomes much weaker than it looks. Pass `--json` for machine-readable output.

```
🛡️  portfolio 1,365.36 USDC · peak 1,412.90 · drawdown 3.4% / 12%

⚠️  2 violations
   [max-position]  ETH is 56.8% of portfolio (limit 40%)
   [trailing-stop] ETH down 4.6% from high 2,912.40 (trail 4%)

   suggested: SELL ETHUSDC ~229.40 (full position)

   closest to tripping: max-position ETH 56.8/40 (142%) · trailing-stop ETH 4.6/4 (115%)
```

## What to do with the output

- **Show the user the violations and the suggested sells before anything is placed.** The suggestion is
  a sell-to-quote market order sized in quote value, or the full base quantity for a full exit.
- Place orders only through the host's own trading tool, and only after the user agrees. This skill has
  no keys, no order endpoint and no network access.
- Re-run after the fills. A rule that keeps firing means the position was not actually reduced.
- `headroom` in the JSON output is every rule's live reading against its limit, hottest first. That is
  the deterministic answer to "what is closest to tripping" — quote it instead of estimating.

## The rules

| Rule | Fires when | Suggested action |
|---|---|---|
| `stop-loss` | asset falls N% below its cost basis | sell the position to quote |
| `trailing-stop` | asset falls N% from its high-water mark while in profit | sell the position to quote |
| `take-profit` | asset rises N% above its cost basis | realise the position |
| `max-position` | one asset exceeds N% of the portfolio | trim the excess only |
| `max-exposure` | non-quote assets exceed N% of the portfolio | trim every position pro-rata |
| `circuit-breaker` | price falls N% from the high of a short rolling window | sell the position to quote |
| `daily-loss` | portfolio is down N% since 00:00 UTC | de-risk everything |
| `max-drawdown` | portfolio is down N% from its peak | de-risk everything |

Entries are a running cost basis: when a position grows, the new lot is averaged in at its price; a trim
keeps the basis. Limits can be overridden per asset (`rules.assets.BTC.stopLossPct`). Deposits and
withdrawals are detected and rebased, so moving money in or out never reads as a drawdown.

## Limits worth stating out loud

- Spot only, one quote asset, long-only book. No futures, no margin, no liquidation distance.
- It reports on the snapshot it is given. It is not a monitor: something has to call it on a schedule.
- It suggests sells; enforcing them, approving them and logging them are the host's job. The full agent
  that does run the loop, execute through MCP, keep a hash-chained audit trail and hold a human approval
  gate is at <https://github.com/PugarHuda/jaga-agent> (MIT, same engine file as `scripts/engine.mjs`).
- Nothing here is financial advice, and no asset is treated as safe or recommended — the skill only
  compares numbers to limits the user chose.
