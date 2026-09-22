---
name: onchain-pay-action-ref-verify
description: |
  Derives and independently verifies action_ref — a deterministic,
  content-addressed identifier (SHA-256 of RFC 8785 JCS canonicalization,
  action-ref-v1 spec) — for a declared Onchain-Pay pre-order request/result
  pair, and checks it against an on-chain anchor (AnchorRegistry,
  permissionless anchor(bytes32)) if one exists. Read-only, no trading, no
  order placement. Use when an agent or a downstream party needs an
  externally checkable record of what a pre-order call declared and
  returned, independent of the merchant account's own logs — e.g. "give me
  a recomputable reference for this pre-order I just made" or "verify this
  action_ref against the anchor."
metadata:
  version: "0.1.0"
  author: giskard09
license: MIT
---

# Onchain-Pay action_ref Verify

Derives `action_ref` for a Binance Onchain-Pay `pre-order` request/result
pair per [`action-ref-v1`](https://github.com/giskard09/argentum-core/blob/master/docs/spec/action-ref.md)
(SHA-256 of the RFC 8785 JCS canonicalization of 4 fields: `agent_id`,
`action_type`, `scope`, `timestamp`), and optionally verifies a claimed
anchor against `AnchorRegistry` — a permissionless `anchor(bytes32)`
contract deployed at the same CREATE2 address on Base, Arbitrum One, and
Ink (`0x49fEcA52bC634a9Ab773226D16619deC547794aa`).

## Why this exists

Binance's own Agent OS launch coverage acknowledged a gap: asked how
Binance assesses what caused a given agent trading action, Jeff Li told
TechCrunch (2026-08-20), *"We really cannot see the reasoning of what the
user's action is."*[^1] This skill does not answer *why* an action
happened — that's a different, harder problem. It answers a narrower,
adjacent one: given a declared `pre-order` request and its response, can
any third party — not just the merchant, not just Binance — recompute a
content-addressed identifier for that exact pair and confirm an
independent, operator-external timestamp of when (if ever) it was
anchored on a public chain? That's orthogonal to reasoning or intent, and
this skill makes no claim to close that gap — only the separate one of
externally-checkable record-keeping for a single Onchain-Pay call.

[^1]: [TechCrunch, "Binance now lets AI agents trade, but keeping them in check is largely up to users," 2026-08-20](https://techcrunch.com/2026/08/20/binance-now-lets-ai-agents-trade-but-keeping-them-in-check-is-largely-up-to-users/).

## Use Cases

### 1. Derive a recomputable reference after a pre-order call

**When to use**: after calling `buy/pre-order` (see
[`skills/binance/onchain-pay/SKILL.md`](../onchain-pay/SKILL.md)), derive
an `action_ref` from the declared request/response so any third party can
independently confirm what was asked for and what came back.

### 2. Verify a claimed anchor

**When to use**: given an `action_ref` and a claimed anchor tx, confirm
the `Anchored(bytes32,address,uint256)` event exists on-chain for that
exact ref — without trusting the party that claims it.

## How it works

1. Build the 4-field preimage: `agent_id` (caller-declared), `action_type`
   (`binance.onchain_pay.buy.pre_order`), `scope` (endpoint + network),
   `timestamp` (RFC 3339 UTC, ms precision).
2. `action_ref = SHA256(JCS(preimage))`.
3. Also hash the full declared `params` (the pre-order request fields) and
   `result` (the pre-order response — `data.link`, `data.linkExpireTime`)
   as an additive envelope (`params_digest`, `result_digest`) — these do
   not enter `action_ref` itself, they travel alongside it as
   independently recomputable context.
4. If an anchor is claimed, query `eth_getLogs` on the target chain for
   `AnchorRegistry`'s `Anchored` event with `topics[1] == action_ref`.

```bash
# 1. derive action_ref + envelope from a request/response you actually have
python3 scripts/produce.py '<request_json>' '<response_json>' \
  --agent-id "<your-agent-id>" --timestamp "<RFC3339-UTC-ms>"

# 2. check a claimed anchor against the chain (a block hint is required —
#    public RPC rejects an unbounded eth_getLogs scan)
python3 scripts/verify_anchor.py <action_ref> --chain base --near-block <N>
```

Both scripts are read-only, stdlib-only Python, and neither calls
Binance's API — `produce.py` takes JSON you already have; `verify_anchor.py`
queries public chain RPC directly.

## Worked example

A full, independently-reproducible instance — derivation, envelope, and a
real on-chain anchor on Base mainnet — is published at
[`giskard09/binance-onchain-pay-action-ref-anchor`](https://github.com/giskard09/binance-onchain-pay-action-ref-anchor).
It is explicitly a **synthetic** worked example (see that repo's
`PROVENANCE.md`): no real Binance merchant account, no real pre-order.
Read it before using this skill against a real account.

## Scope and limits

- Read-only. No order placement, no trading, no wallet address collection.
- Does not evaluate whether a pre-order's parameters are safe, favorable,
  or advisable — only whether a declared request/result pair is
  recomputable and (optionally) anchored.
- Does not require any change to Binance's `onchain-pay` API or Binance's
  participation. The anchor is written by whoever chooses to anchor it —
  the merchant, the agent's operator, or a third party — using the
  permissionless `AnchorRegistry` contract.

## License

MIT.
