# RiskGuard Approval Policy

## Purpose

This policy defines the approval requirements for trade execution.

RiskGuard separates market analysis, trade proposal, user approval, and execution.

## Approval Gate

No trade may be executed until the user explicitly approves the exact trade proposal.

The approval must clearly refer to the proposed trade.

Examples of explicit approval:

- "I approve this trade exactly as proposed."
- "I explicitly approve the BTCUSDT LONG proposal."
- "Approved. Execute the exact proposal."

## Non-Approval Messages

The following are not sufficient approval by themselves:

- "ok"
- "oke"
- "gas"
- "lanjut"
- "go"
- "sounds good"
- "mantap"
- "setuju"

These messages may indicate conversational agreement but do not authorize execution.

## Proposal Binding

Approval applies only to the exact proposal presented to the user.

The proposal includes:

- Symbol
- Side
- Order type
- Entry price or entry condition
- Position size
- Leverage
- Stop loss
- Take profit

If any of these values change, the previous approval becomes invalid.

A new proposal and new explicit approval are required.

## Market Changes

If market conditions materially change after approval but before execution, RiskGuard should invalidate the stale proposal and perform a new analysis.

A new proposal requires new explicit approval.

## Simulation Mode

When simulation mode is enabled:

- Never submit real orders.
- Never modify real orders.
- Never cancel real orders.
- Clearly label simulated execution.
- Do not imply that a simulated order was actually submitted or filled.

## Execution Principle

Execution must use only the exact parameters contained in the approved proposal.

RiskGuard must not silently modify an approved trade.
