---
name: farmdash-camp-guard
title: FarmDash Camp Guard
description: Review EVM allowances, route risk, unsigned transaction envelopes, and delegation policy before signing. Security verdicts only; never signs, broadcasts, or changes approvals.
version: 1.1.2
license: MIT
metadata:
  author: Parmasanandgarlic
  version: 1.1.2
---

# FarmDash Camp Guard

A third-party, read-only security and policy skill. Use before an EVM approval, swap, deposit, hedge, or exit that the user has independently requested. It does not choose or promote assets, execute transactions, grant/revoke allowances, sign messages, broadcast, or access Binance exchange accounts or orders. It is not a Binance service or endorsement.

Camp Guard returns `pass`, `review`, or `halt` verdicts from supplied evidence. Its transaction policy tool returns `simulation.status: "not_run"`: it does **not** perform RPC execution simulation. A pass is not authorization, insurance, a contract audit, or a guarantee of safety or execution success.

## Discovery and disclosure

- Read `GET https://www.farmdash.one/api/v1/agent/status` and discover active schemas using `https://www.farmdash.one/.well-known/mcp.json`. Configure the documented MCP transport; do not invent a remote endpoint or assume a tool exists because an older manual lists it.
- Required tools are `audit_allowance_risk`, `simulate_transaction_risk`, and, for route/health/net-edge checks, `run_risk_sentinel`. Missing capability or evidence means stop and report the limitation.
- Inputs are EVM-shaped. Do not pass Solana transactions/identifiers or guess chain/address mappings.
- Before transmitting wallet, allowance, or transaction data, disclose what FarmDash will receive and obtain explicit permission for that check. Do not include raw personal wallet addresses in examples or published output. Never request or transmit private keys, seed phrases, wallet exports, Binance credentials, or signing secrets.
- Commercial authentication/API access is separate from execution authority. If supported, send `X-ClawHub-Skill: farmdash-camp-guard` as attribution only, never authentication or permission to spend.

## Allowance review: `audit_allowance_risk`

Collect independently verified token contract and spender addresses, chain, raw-unit allowance, and intended raw-unit `requiredAmount` where known. Supply `allowances` entries with `token`, `spender`, `allowance`, `requiredAmount`, optional `amountUsd`, and `spenderVerified`; optional `walletAddress` must be user-authorized for disclosure. When no intended spend is known, omit its comparison value and explicitly mark spend-relative sizing unassessed. Never manufacture amounts or infer spender identity from a name/icon.

Set `spenderVerified: true` only after an independent canonical deployment check, not because a builder or API labels it verified. Review unlimited approvals, unknown spenders, high exposure, token-decimal mismatches, and cumulative allowance exposure against the user's allowance budget. Prefer exact or narrowly buffered approvals: more than 20% above `requiredAmount` requires review; more than 10x is high risk requiring remediation, not user acceptance alone.

A `halt` blocks handoff. For `review`, explain every flag, remediate, and rerun; confirmation alone is not a pass. This skill may recommend a review of a revocation plan but never builds, signs, or submits a revocation. Any requested allowance change belongs to a separate authorized wallet workflow, with independent verification and local signing.

## Route and health review: `run_risk_sentinel`

Supply either a verified swap-shaped route (`fromChainId`, `toChainId`, `fromToken`, `toToken`, `fromAmount`) or known manual risk inputs such as `healthFactor`, `liquidationBufferPct`, `expectedUpsideUsd`, `gasUsd`, `bridgeFeeUsd`, and `riskBufferUsd`. Preserve provenance and timestamps; mark absent evidence explicitly. Surface returned allowance, route, health, depeg, net-edge, and halt findings without presenting estimated upside as a recommendation or hiding risk behind APY/points.

Risk analysis is neither transaction authority nor broadcast/settlement evidence. An indicative estimate is not a firm quote. In a swap workflow, the execution skill must obtain the firm intent and fresh authoritative simulation separately.

## Unsigned transaction review: `simulate_transaction_risk`

1. Capture the expected envelope independently **before** receiving the builder's final payload: exact `to`, numeric `chainId`, raw `value`, and SHA-256 hash of exact calldata (`dataHash`). Do not derive the expectation from the payload being tested.
2. Supply `transaction.to`, `transaction.data`, `transaction.value`, `transaction.chainId`, and that independent `expectedTransaction`. Compare target, chain, value, and calldata hash exactly. Any mismatch is a halt; a missing expected envelope is incomplete evidence and blocks handoff.
3. Report the policy result and explicitly state `simulation.status: "not_run"`. Require a separate fresh authoritative wallet/RPC execution simulation of the actual final bound transaction before signing/broadcast. Estimated gas, builder labels, and a Camp Guard pass cannot replace it.
4. Recheck after any payload/route change. High/critical flags, stale evidence, unknown contracts, or missing simulation remain blocking pending remediation and rerun.

## Bounded-delegation policy review

**USER_SIGNED = operational; BOUNDED_AUTONOMOUS_AGENT_LOCAL_SIGNER = preparation_only.** Camp Guard can review proposed delegation bounds but does not register authority, activate automation, or attest that an autonomous route is production-qualified. Do not present these local reviewer checks as fields or guarantees automatically enforced by the API.

Compare a proposed action with the independently captured, explicitly signed policy and verify:

- Chain allowlist, protocol/router allowlists, asset allowlists, and exact permitted recipient/target.
- Per-transaction value limits, remaining session budgets, and aggregate spend; unknown spend accounting blocks approval.
- Approval/allowance budgets, verified spender, and exposure remaining after previous actions.
- Slippage and gas ceilings, fresh quote/simulation validity, and permitted action type.
- Validity/expiry, cooldowns, registered local signer, and current revocation status with documented revocation instructions.

Missing, expired, revoked, unregistered, or exceeded bounds produce a local `halt`. A signature or paid API entitlement alone grants no broader authority. User/agent signing and broadcast remain exclusively inside the independently authorized local wallet/runtime boundary; FarmDash never receives user or agent private keys. Policy review never promotes the current preparation-only architecture to live execution.

## Optional Binance Agentic Wallet evidence

When the user already uses Binance Agentic Wallet, follow its skill for the exact read-only approval-listing and contract-call-preview commands. Independently map the returned EVM evidence without guessing. Preserve that wallet's own preview/simulation findings separately from FarmDash's policy verdict. Camp Guard does not invoke an execution command or replace Binance's token audit/transaction preview.

- [Binance Agentic Wallet skill](../../binance-web3/binance-agentic-wallet/SKILL.md)
- [Approval reference](../../binance-web3/binance-agentic-wallet/references/approvals.md)
- [Contract-call preview reference](../../binance-web3/binance-agentic-wallet/references/external-sign.md)

## Pre-sign report and handoff

Report (1) allowance verdict/flags and sizing basis, (2) route/health/net-edge evidence, (3) transaction policy outcome with `simulation.status: "not_run"`, (4) independent expected-envelope match, (5) spender-verification basis, (6) actual authoritative simulation provenance/freshness, and (7) relevant delegation bounds/revocation status or `not applicable`.

Continue to a separate wallet/execution skill only when all relevant verdicts are `pass` and required evidence is present. That skill must still present exact transaction terms and obtain fresh explicit user authorization; a Camp Guard pass is never consent. This skill never signs, broadcasts, or changes approvals. It cannot detect every malicious contract, oracle failure, depeg, bridge failure, or social-engineering attack.

## References

- Canonical skill: https://www.farmdash.one/openclaw-skills/farmdash-camp-guard/SKILL.md
- MCP discovery: https://www.farmdash.one/.well-known/mcp.json
- OpenAPI: https://www.farmdash.one/agents/openapi.yaml
- Live capabilities: https://www.farmdash.one/api/v1/agent/status
- Security boundaries: https://www.farmdash.one/security

Adapted from canonical FarmDash main `3b6a83dd5bfa239c85b68797bd27651294f335ab` for neutral security-only distribution. No asset recommendation, affiliate/referral promotion, or safety guarantee is implied.
