---
name: charter
description: Submit a proposed trade to CHARTER for a real PASS/VETO/ESCALATE mandate-compliance verdict, simulated against live market data, before it executes.
version: 0.1.0
license: MIT
---

# CHARTER

CHARTER is not a trading agent. It is a mandate and policy layer that other agents' trade proposals must pass through before they can execute. A human writes a plain-English covenant (spend caps, symbol allowlist, leverage limits, daily drawdown halt, confirm-above-$X). CHARTER compiles that into a live policy, simulates every proposal against the real order book, and returns a real PASS, VETO, or ESCALATE verdict. Only a PASS, or a human-confirmed ESCALATE, ever reaches an execution venue. Every step is written to a tamper-evident, hash-chained audit log.

Repo: https://github.com/angelraph/charter

## Why an agent would use this

If your agent already decides what to trade, CHARTER decides whether it is allowed to. Instead of calling a trading venue directly, route the proposal through CHARTER first and get a real accept or reject decision grounded in the user's own stated limits and live market conditions, rather than a static allowlist you have to maintain yourself.

## Calling CHARTER

CHARTER exposes an HTTP API (`charter serve`). All three calls below are plain JSON over HTTP. No SDK is required. If the instance you are calling was started with `CHARTER_API_KEY` set, include it on every request as an `X-Charter-Api-Key` header.

### charter.propose

Submit a trade for a verdict.

```bash
curl -s -X POST http://localhost:4477/propose \
  -H "Content-Type: application/json" \
  -d '{
    "agentId": "my-agent",
    "mandateId": "<mandate-id>",
    "symbol": "BTCUSDT",
    "side": "BUY",
    "usd": 25,
    "reason": "momentum signal crossed threshold",
    "execute": false
  }'
```

Response:

```json
{
  "proposalId": "7b934dba-3aaa-4317-a0c8-e8301e260e65",
  "verdict": {
    "decision": "PASS",
    "reasons": [{ "rule": "spendingCap", "outcome": "ok", "detail": "Notional $25.00 is within the daily cap" }],
    "simulation": { "referencePrice": 77584.63, "projectedSlippageBps": 0, "notionalUsd": 25 }
  },
  "execution": null
}
```

Set `"execute": true` to have CHARTER place the real order immediately when the verdict is `PASS`, or when you are supplying human confirmation for an `ESCALATE`. Leave it `false` for a dry-run verdict only.

### charter.status

Check a previously submitted proposal.

```bash
curl -s http://localhost:4477/status/<proposalId>
```

### charter.mandate

Read the currently active covenant and its limits.

```bash
curl -s "http://localhost:4477/mandate?id=<mandate-id>"
```

## Verdict semantics

- **PASS**: every rule satisfied. Execution proceeds automatically if `execute: true` was set.
- **VETO**: at least one rule was violated (oversized order, disallowed symbol, drawdown halt tripped, and so on). No order is ever placed for a VETO. CHARTER's audit log shows no execution attempt at all for a vetoed proposal.
- **ESCALATE**: no rule was violated, but the order crosses the mandate's `confirmAboveUsd` threshold. CHARTER will not execute this without an explicit `execute: true` on a follow-up call, standing in for a human's confirmation.

## What CHARTER will not do

CHARTER does not promote, recommend, or guarantee the safety of any asset. The symbol and side you send are proposed by your agent, not suggested by CHARTER. CHARTER never handles wallet addresses or private keys. Execution runs entirely through the connected exchange venue's own order-placement API.

## References

- `references/proposal-schema.json`: full Proposal request shape
- `references/verdict-schema.json`: full Verdict response shape
- `scripts/example-client.js`: minimal Node example calling `/propose`
