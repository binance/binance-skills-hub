---
name: riskguard
description: Analyze market risk before preparing or executing a trade. Requires explicit user approval before execution.
metadata:
  version: 0.2.0
  author: Beny
license: MIT
---

# RiskGuard

## Purpose

RiskGuard is a risk-control layer for AI trading agents.

It requires market analysis and risk assessment before preparing a trade proposal, and explicit user approval before execution.

## When to Use

Use RiskGuard whenever the user expresses an intent to trade, including requests to:

- buy
- sell
- long
- short
- open
- close
- place an order

RiskGuard must activate even when the user does not explicitly request market analysis.

## Mandatory Workflow

**Pre-check:** If trade intent is detected, activate RiskGuard before performing any trade-related action.

Do not install trading CLIs, configure trading tools, connect trading accounts, request API keys, prepare execution infrastructure, or execute trades before the user explicitly approves the exact trade proposal.

For every trade intent:

1. Analyze the relevant market conditions.
2. Assess the key risks of the requested trade.
3. Provide a clear recommendation.
4. Prepare a trade proposal.
5. Present the proposal to the user.
6. Wait for explicit approval.
7. After explicit approval, perform only the setup required for the approved trade.
8. Execute only the exact approved proposal.

Do not skip the analysis or approval stage.

## Approval Policy

Follow the detailed approval requirements in:

[`references/approval-policy.md`](./references/approval-policy.md)

Execution requires explicit approval of the specific trade proposal.

Conversational agreement such as "ok", "oke", "gas", or "lanjut" must not be treated as execution authorization.

## Trade Proposal

Every proposal should clearly state:

- Proposal ID
- Symbol
- Side
- Order type
- Entry price or entry condition
- Position size
- Leverage, if applicable
- Stop loss
- Take profit
- Risk/reward assessment
- Key risks
- Confidence level
- Approval status

The proposal must be presented to the user before execution.

## Risk Gate

A trade proposal without stop loss and take profit must be marked as INCOMPLETE.

Recommendation must be "Do not execute yet" until risk parameters are specified.

When Risk Gate is triggered:

- Confidence level must be Low.
- Approval status must be BLOCKED - Missing risk params.
- The agent must not enter AWAITING_APPROVAL state.
- The agent must request stop loss and take profit values before proceeding.

## Execution Readiness

Before requesting final approval or attempting execution:

- Check whether an active Binance profile or valid API credentials are available.
- If no active Binance profile or valid API credentials are found, automatically fall back to Simulation Mode.
- Do not request, collect, or configure Binance API credentials for a simulation.
- Clearly state that the agent is running in Demo/Testnet Simulation Mode before requesting final approval.
- Never attempt a real order when authentication is unavailable.

## Proposal State

RiskGuard should maintain the following logical states:

```text
IDLE
  ↓
ANALYZING
  ↓
ADVISED
  ↓
PROPOSED
  ↓
AWAITING_APPROVAL
  ↓
APPROVED
  ↓
EXECUTING
  ↓
COMPLETED
```

## Proposal Integrity

Approval is bound to the exact proposal presented to the user.

If any material trade parameter changes, including:

- Symbol
- Side
- Entry
- Position size
- Leverage
- Stop loss
- Take profit

 the previous approval becomes invalid.

A new proposal and explicit approval are required.

## Simulation Mode

When simulation mode is enabled:

- Never submit real orders.
- Never modify real orders.
- Never cancel real orders.
- Clearly label simulated execution.
- Never imply that a simulated order was submitted or filled.

## Execution Principle

When execution is authorized, execute only the exact parameters contained in the approved proposal.

RiskGuard must not silently modify an approved trade.
