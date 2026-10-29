---
name: magister
description: Risk-governed portfolio agent workflow for Binance Agent OS. Use when a user wants an LLM to propose trades but keep execution behind deterministic guardrails and human approval: separate an analyst agent from a rules-based risk engine, queue approved orders, and execute them through an AI assistant connected to the Binance Agent OS MCP server.
version: 1.0.0
license: MIT
---

# Magister

Magister is a reference workflow for building a human-in-the-loop trading agent on Binance Agent OS. It answers one question: how do you let an AI propose trades without letting the AI place them unchecked? The answer is separation of duties.

```
Analyst (LLM, proposes trades)
   -> Risk engine (deterministic rules, clamps and rejects)
      -> Order desk (approved orders, queued)
         -> AI assistant executes via the Agent OS MCP server
              after the human approves in chat
         -> Audit ledger (append-only JSONL + daily report)
```

## Prerequisites

- Python 3.11 or later and the `uv` package manager
- An OpenAI-compatible API key for the analyst model
- A Binance account in an eligible region
- An AI client that supports remote MCP servers (Codex CLI, ChatGPT, Claude, Cursor, or VS Code)

## Replication steps

1. Clone the reference implementation: `git clone https://github.com/vickman787/magister`, then `cd magister`, then `uv sync`.
2. Copy `.env.example` to `.env` and set `OPENAI_API_KEY`.
3. Exercise the guardrails offline: `uv run python -m magister.main demo` queues a small simulated order, and `uv run python -m magister.main report` shows the audit ledger. Queue `--quote 200` to see the risk engine clamp the size, or create `data/kill_switch` to see all orders stop.
4. Connect Binance Agent OS in the AI client: `codex mcp add binance-mcp-server --url https://agent.binance.com/mcp/agentic` (older Codex versions do not accept extra OAuth flags). Approve the Binance consent screen; Binance creates a dedicated Agentic sub-account on first authorization.
5. Fund the Agentic sub-account from the Binance web UI (Profile, Dashboard, Sub-account, Asset Management, Transfer). Only this balance is reachable by the agent, and the platform grants no withdrawal scope.
6. Queue an order: `uv run python -m magister.main run`, or `uv run python -m magister.main demo --symbol BTCUSDT --quote 10`.
7. In the AI client, ask it to read `data/orders.jsonl` and place the pending order, restating it first. Approve in chat when the order is restated; Binance fills it inside the Agentic sub-account via the Agent OS MCP server.
8. Record the fill with the values the client reports: `uv run python -m magister.main record-fill --id <order_id> --base-qty <quantity> --avg-price <price>`.
9. Inspect the trail: `uv run python -m magister.main report` shows positions, exposure, and realized PnL reconstructed from the append-only ledger.

## Safety model

- The analyst model never holds Binance access.
- Risk limits live in `config/risk_limits.yaml`: per-symbol caps, total exposure, maximum open positions, a daily-loss stop, an allowed-symbol whitelist, and a kill-switch file checked before every order.
- No API keys are stored on the machine. Execution flows through the Agent OS MCP server with OAuth and in-chat human approval.
- The Agentic sub-account has no withdrawal scope and must be funded manually, so the blast radius is bounded by the amount you deposit.

## Notes

- Educational reference material. Nothing here is investment advice, and no asset is promoted or guaranteed.
- Full documentation lives at https://github.com/vickman787/magister.
