---
name: farmdash-signal-architect
title: FarmDash Signal Architect
description: Prepare user-authorized EVM swap quotes and transactions with authoritative simulation and zero-custody local signing through FarmDash.
version: 4.2.1
license: MIT
metadata:
  author: Parmasanandgarlic
  version: 4.2.1
---

# FarmDash Signal Architect

A third-party skill for DeFi swap estimates, firm quotes, simulation, transaction preparation, and settlement verification. It is not a Binance service or an endorsement and does not access Binance exchange accounts or place Binance account orders. It does not select or promote assets.

## Execution truth and authority

- **USER_SIGNED = operational.** The user reviews and authorizes the exact transaction; signing and broadcast stay in the user's wallet/client. A compatible locally controlled wallet/agent can perform the local signing step under the user's explicit authority; no particular wallet brand is required.
- **BOUNDED_AUTONOMOUS_AGENT_LOCAL_SIGNER = preparation_only.** Bounded autonomy is an optional architecture, not a production-qualified execution route. Do not start unattended execution or infer readiness from tool discovery, session creation, API access, or a delegation record.
- FarmDash is zero-custody for this compatibility-swap flow: it prepares transaction data, verifies authorization, and records settlement evidence. It never receives, stores, logs, or signs with user or agent private keys and does not broadcast compatibility swaps.
- Commercial authentication/access is separate from transaction authority. API keys, subscription access, credits, or payment buy API capacity, never permission to sign or spend. Session authentication is not wallet authority.
- Never ask for, accept, store, or transmit private keys, seed phrases, wallet exports, or Binance credentials. Keep signing secrets exclusively in the user's wallet or explicitly configured local agent signer.

## Discovery and privacy

Read `GET https://www.farmdash.one/api/v1/agent/status` first. Fail closed if the requested capability, provider, or prerequisite is disabled or unavailable. Configure the MCP runtime from `https://www.farmdash.one/.well-known/mcp.json`; discover the current tool schemas rather than assuming an inventory count or a remote transport. REST callers must follow `https://www.farmdash.one/agents/openapi.yaml` and its server/path definitions.

Before sending wallet or transaction context, disclose that FarmDash can receive public addresses, asset contracts, chain IDs, amounts, signature bytes, request/session identifiers, and optional API authentication. Obtain permission for that disclosure. Do not publish personal addresses in examples or logs. If the client supports attribution, send `X-ClawHub-Skill: farmdash-signal-architect`; this header is attribution only, not authentication or spending authority.

## Mandatory workflow

1. Establish the user's intended source/destination chain, independently verified asset contracts and decimals, raw integer amount, recipient, and slippage limit. A request for information is not permission to prepare or sign a swap.
2. Call `get_swap_quote` without `idempotencyKey` for a provider-neutral **indicative estimate**. It makes no trading-provider quote call and contains no executable calldata. **Estimate != firm quote**; never treat a price-based preview as execution-ready.
3. Only on an explicit request to prepare a swap, call `get_swap_quote` with exact trade parameters plus `walletAddress`, `toAddress`, explicit `slippage`, and a stable `idempotencyKey`. The REST equivalent is `POST /api/v1/agent/quote-intent`. Use automatic selection among live enabled providers unless the user has explicitly chosen an enabled provider. Do not assume that a discovered provider is active.
4. Check the returned firm quote, execution readiness, approvals, ordered provider plan, signature requirements, and continuation instructions. A prerequisite recipe is not an executable swap. Resolve required approvals locally with separate explicit confirmation, wait for receipt, and obtain a fresh quote when instructed. Unknown steps or unsupported recipes halt; never flatten a multi-step plan into its first transaction.
5. Call `simulate_swap_execution` with `intentId` equal to `simulationRequirements.intent_id` (`fd_intent_*`) and the same wallet. Do not substitute the `qi_*` quote-cache `intentId`. Require a successful, fresh **authoritative simulation** of the actual bound transaction, not a Camp Guard policy verdict or estimated gas. If route, tokens, chain, amount, recipient, wallet, slippage, or calldata changes, re-quote and re-simulate.
6. Run the relevant allowance and policy/risk checks. Present the exact contracts, chain IDs, raw amount, recipient, minimum output, slippage, expiry, approval spender/amount, all quoted service/provider/network costs, and simulation results/risks. Require fresh explicit user confirmation before local authorization signing. Never minimize fees or turn a risk flag into asset advice.
7. Build the documented authorization payload with a fresh nonce and sign it locally using the user's wallet's EIP-191 flow. Call `execute_swap` with the exact bound fields, local signature, nonce, and the returned `simulation_id` as `simulationId`. Despite its name, this tool **prepares** the transaction; it is not broadcast, confirmation, or settlement.
8. Independently compare the final unsigned transaction with the expected target, chain, value, recipient, and calldata. The user's wallet/client then signs the blockchain transaction locally and broadcasts it. FarmDash does neither. Reject mismatches or missing evidence before signing.
9. After wallet broadcast, use `confirm_swap` with the authenticated owning `sessionId`, `agentAddress`, `sessionToken`, prepared swap's `feeEventId`, and wallet-produced `txHash`. Session credentials authenticate the record, not signing authority. Only canonical receipt/finality and exact expected fee-transfer verification establish durable settlement. Do not invent a transaction hash or report submission as success.

## Optional bounded-delegation architecture (preparation only)

Explain, but do not activate, an agent-local-signer design only when asked. A signed delegation would need allowed chain IDs, protocol/router and asset allowlists, per-transaction value limits, session/remaining budgets, approval/allowance limits, slippage and gas ceilings, validity/expiry, cooldowns, revocation, and an explicitly registered signer. Every action would still require fresh authoritative simulation and policy enforcement. Keys stay local; registration or a signed policy alone does not promote the current `preparation_only` route to operational. Missing bounds mean halt, not assumed consent.

## Failure and settlement discipline

- Stop on disabled capabilities, policy halts, stale/failed simulations, changed intent parameters, missing prerequisites/evidence, unsupported networks, or absent explicit confirmation.
- Reuse an idempotency key only for retries of the same logical trade. Never reuse it for changed parameters or treat a changed quote as previously authorized.
- Honor typed `retryable` failures and `Retry-After` with bounded backoff. Resolve allowance, balance, signature, authentication, and paused-provider prerequisites instead of blindly retrying or fanning out calls.
- Ambiguous broadcast means hold and reconcile receipts; do not resubmit or claim settlement without evidence. Record timestamps, provenance, request/intent identifiers, and confirmed outcomes separately from estimates.

## References

- Canonical skill: https://www.farmdash.one/openclaw-skills/farmdash-signal-architect/SKILL.md
- OpenAPI: https://www.farmdash.one/agents/openapi.yaml
- MCP discovery: https://www.farmdash.one/.well-known/mcp.json
- Live capabilities: https://www.farmdash.one/api/v1/agent/status
- Integration documentation: https://www.farmdash.one/docs
- Security boundaries: https://www.farmdash.one/security

This is transaction-preparation guidance, not investment advice, a recommendation, a liquidity guarantee, or assurance that an asset or route is safe. Adapted from canonical FarmDash main `3b6a83dd5bfa239c85b68797bd27651294f335ab` for Binance's neutral contribution format; the execution readiness above intentionally preserves the user's current operational/preparation-only boundary.
