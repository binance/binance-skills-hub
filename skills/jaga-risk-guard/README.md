# jaga-risk-guard

Deterministic risk guardrails for a spot subaccount an AI agent trades.

An agent that trades and an agent that guards should not be the same agent: whatever talks a trading
agent into an oversized position — a poisoned news item, an ambiguous instruction, a confident model on
a bad day — is talking to the same context that would have to say no. This skill keeps the "no" in
arithmetic instead. It reads the account, compares it against limits the user set in advance, and
reports what breached and what selling back to the quote asset would fix.

```bash
node scripts/risk-check.mjs --account account.json --prices prices.json \
  --rules rules.json --state state.json
```

```
🛡️  portfolio 1,365.36 USDC · peak 1,412.90 · drawdown 3.4% / 12%

⚠️  2 violations
   [max-position]  ETH is 56.8% of portfolio (limit 40%)
   [trailing-stop] ETH down 4.6% from high 2,912.40 (trail 4%)

   suggested (nothing is placed by this skill):
   SELL ETHUSDC ~229.4 (full position)

   closest to tripping: max-position ETH 56.88/40 (142%) · trailing-stop ETH 4.6/4 (115%)
```

Exit code is `1` when something breached and `0` when the book is inside every limit, so it drops
straight into a scheduled check.

## Files

| Path | What it is |
|---|---|
| `SKILL.md` | when to use it, inputs, output, limits |
| `scripts/risk-check.mjs` | the CLI: snapshot in, violations and suggested sells out |
| `scripts/engine.mjs` | the rules as a pure function — no I/O, no model, no network |
| `scripts/shapes.mjs` | normalises account/price shapes from different Binance MCP servers and CLIs |
| `references/rules.md` | every threshold, what it does, and a sane starting value |
| `references/rules.example.json` | a rules file to copy and edit |

Node 18+ (Node 22+ recommended). No dependencies, no keys, no network access, no order endpoint.

## Scope

Spot, one quote asset, long-only. It reports on the snapshot it is handed — something else has to call
it on a schedule, show the user the result and place any order. The full agent that runs the loop,
executes through MCP, keeps a SHA-256 hash-chained audit trail and holds a human approval gate is
[jaga-agent](https://github.com/PugarHuda/jaga-agent); `scripts/engine.mjs` here is the same file.

Not financial advice. No asset is recommended, promoted or described as safe — the skill only compares
numbers against limits the user chose.

MIT licensed.
