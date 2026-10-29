---
name: four_meme_mcp_ops_guard
description: Hardens Four.meme MCP-server operations with read-only defaults, explicit trade confirmations, and secret-isolation policies.
metadata:
  author: brief-onchain
  version: "1.0"
---

# Four.Meme MCP Ops Guard

## Usage

- Category: Ecosystem
- Mode: guide
- Version: 0.1.0

## Input Example

```json
{
  "action": "setup_mcp_guarded_mode",
  "mode": "read_only",
  "tradeConfirmation": "required",
  "providers": ["fourmeme", "bitquery"],
  "sessionTtlMinutes": 30
}
```

## Workflow

1. Prepare MCP server baseline:
   - verify tool list and command surface.
   - separate read endpoints from write endpoints.
2. Apply guarded defaults:
   - start in read-only mode.
   - require explicit user confirmation before any write tool call.
   - enforce per-session order/value/slippage caps.
3. Isolate secrets:
   - private keys only in env/secret manager.
   - no plaintext key handling in prompts, logs, or reports.
4. Add observability hooks:
   - request log with redaction.
   - action journal with tx hash and rationale.
5. Run validation checklist:
   - read calls healthy.
   - write calls blocked unless confirmation flag is present.

## Guardrails

- Do not execute autonomous trading loops from MCP.
- Refuse execution if confirmation metadata is missing.
- Revoke temporary operator rights at session end.
- On provider outage, degrade to read-only diagnostics and stop writes.

## Source Anchors

- MCP reference implementation (Four.meme): https://github.com/sunneeee/fourtrader-mcp
- Alternate active fork for comparison: https://github.com/menscheck/fourtrader-mcp
- Bitquery data layer used by MCP flows: https://docs.bitquery.io/docs/blockchain/BSC/four-meme-api/
