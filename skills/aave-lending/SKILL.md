---
name: aave-lending
description: |
  Aave V3 and V4 lending data and non-custodial transaction building, through the official Aave MCP
  server at https://mcp.aave.com. Live supply and borrow APY, reserve caps, available liquidity and
  utilization, a wallet's collateral and debt, health factor and distance to liquidation, net APY,
  claimable rewards, Savings GHO, and DAO governance proposals. Builds unsigned transactions for
  supply, borrow, repay, withdraw, collateral toggles, e-mode and reward claims, which the user
  signs in their own wallet.
  Use when the user asks about Aave rates or markets, an onchain lending position, a health factor
  or liquidation risk, borrowing capacity, Aave rewards, Savings GHO, Aave governance, or wants to
  prepare an Aave transaction. Trigger on: Aave, aToken, health factor, e-mode, supply APY, borrow
  APY, liquidation threshold, LTV, utilization, isolation mode, GHO, sGHO, stkGHO, hub, spoke.
metadata:
  author: aave
  version: "1.0"
license: MIT
---

# Aave Lending Skill

## Overview

Aave is an onchain lending protocol. A user supplies assets to earn a variable rate and can borrow
against that collateral up to a per-asset limit. The position stays open while its health factor is
above 1. Below 1, part of it can be liquidated by anyone.

This skill drives the official Aave MCP server, which wraps the same SDK behind app.aave.com (V3)
and pro.aave.com (V4), so the numbers match what the user sees in the app, V4 hub and spoke
accounting included. One endpoint serves both protocol versions and every chain Aave is deployed on.

Non-custodial. The server holds no keys and cannot move funds. Write tools return an unsigned
transaction or EIP-712 payload for the user's own wallet to sign.

## Setup

Add the server once. It speaks streamable HTTP and needs no API key or account.

| Client | Command or setting |
|---|---|
| Claude Code | `claude mcp add --transport http aave https://mcp.aave.com` |
| Codex CLI | `~/.codex/config.toml`, `[mcp_servers.aave]` with `url = "https://mcp.aave.com"` |
| Cursor | `~/.cursor/mcp.json`, `{ "mcpServers": { "aave": { "url": "https://mcp.aave.com" } } }` |
| VS Code | `code --add-mcp '{"name":"aave","type":"http","url":"https://mcp.aave.com"}'` |
| Claude Desktop, ChatGPT | Settings, Connectors, add a custom connector at `https://mcp.aave.com` |
| Anything else | Add a remote streamable-HTTP MCP server at `https://mcp.aave.com` |

## Which tool answers what

| User intent | Tool |
|---|---|
| Cold start, what is available | `get_started` |
| Chains and markets | `get_chains`, `get_markets` |
| One reserve in depth: caps, liquidity, LTV, liquidation threshold | `get_reserve_details` |
| Rate history | `get_apy_history`, `get_protocol_history` |
| Collateral, debt, health factor, net APY for a wallet | `get_user_summary` |
| Per-position rows | `get_user_positions`, `get_position_items` |
| Past activity | `get_user_activity` |
| Claimable rewards | `get_user_rewards`, `prepare_claim_rewards` |
| Savings GHO | `get_sgho_vault`, `get_sgho_preview`, `prepare_sgho_action` |
| Governance | `search_governance_proposals`, `get_governance_proposal`, `get_proposal_votes` |
| What a supply, borrow, repay or withdraw would do | `preview_action` |
| Build that transaction | `prepare_action` |
| Collateral toggle, e-mode | `prepare_set_collateral`, `prepare_set_emode` |
| Concepts, caveats, how a number is defined | `get_aave_guide` |

## Workflow

1. Discover with `get_markets`, or `get_started` on a cold turn.
2. Inspect with `get_reserve_details` and `get_user_summary`.
3. Simulate with `preview_action`. Do not skip this before a borrow or a withdraw. It returns the
   health factor the action would leave behind.
4. Build with `prepare_action`.
5. Give the unsigned transaction to the user to sign in their own wallet.

Nothing is committed until the user signs, so build the transaction rather than asking permission to
build one. State the choice you made and let the user accept or reject the payload.

## Rules

- Amounts are main units, `"10.5"`, never wei. Never guess a token's decimals or a contract address.
- Most tools take `version`: `v3`, `v4` or `all`. A tool that takes none says so in its first words.
- Six reads nest their payload under `data.v4` and `data.v3`: `get_chains`, `get_markets`,
  `get_user_summary`, `get_user_positions`, `get_user_activity` and `get_user_rewards`. Every other
  tool returns its payload on `data` directly, `preview_action` and the `prepare_*` family included.
- A result may carry `warnings`. Level `error` means the action cannot succeed as built, so stop and
  fix it or tell the user rather than preparing past it. `warning` means it will succeed and the
  user should be told. `info` is context.
- Every USD figure is Aave's oracle price, read from Chainlink feeds and named as `priceSource` on
  a reserve read. It is the price the protocol liquidates against, not a market quote. Attribute it
  when quoting one.
- A frozen reserve still permits withdraw and repay, and only stops new supply and borrow. A paused
  reserve stops all four. Do not tell a user to abandon a position they should be closing.
- Follow `next_actions` when a result carries them.

## Safety

- A health factor below 1 means the position can be liquidated. Report the resulting health factor
  whenever a preview or a prepared action lowers it.
- A health factor near 1 leaves no room for a price move. Show the number and let the user decide.
- Rates are variable and move block to block. A quoted APY is the rate now, not a promise.
- Nothing here needs a private key or a seed phrase. Never ask for one, and never accept one.
- This skill reports protocol data. It does not recommend any asset, position or strategy.

## Links

- Server: https://mcp.aave.com
- Docs: https://docs.aave.com
- App: https://app.aave.com for V3, https://pro.aave.com for V4
