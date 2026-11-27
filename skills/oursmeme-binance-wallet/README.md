# oursmeme-binance-wallet

Permissionless 0-fee perp launchpad on BNB Chain where anyone can launch their own BTC/ETH/Gold perp market in minutes and route fees to holders/LPs/creators.

This skill integrates **Binance Agentic Wallet** (`@binance/agentic-wallet` / `baw` CLI) with OursMeme's dedicated 50-tool remote MCP server (`https://devapi.ours.meme/api/baw/mcp`), enabling:

- **32 read-only analytics tools** (no wallet access required): live quotes, 24h volume, funding tiers, whale open interest, liquidation feeds, LP history, and account PnL.
- **2 Binance Agentic Wallet readiness tools**: `baw_get_setup` (gas/USDC/allowance & live contract allowlist inspection) and `baw_build_approve` (exact-budget USDC approval, never `maxUint256`).
- **16 unsigned calldata builders**: non-custodial transaction building for `baw contract-call preview -> execute` (open/close positions, margin management, TP/SL, LP deposit/withdraw, rewards claim, and bounded `SubaccountRouter` authorization/revocation).

## Requirements

- Any MCP-compatible client (Claude Code, Cursor, Windsurf, Codex, OpenClaw) or `curl` for direct HTTP calls.
- For on-chain transaction preview/execution: Binance Agentic Wallet (`baw` CLI / `@binance/agentic-wallet`). Read-only analytics require no wallet or API key.
- No custom binaries or bundled scripts are required.

## Quick Read-Only Test (No Wallet Required)

Fetch platform rules and live overview across BTC / ETH / XAU markets:

```bash
curl -s https://devapi.ours.meme/api/baw/tools/get_overview \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{}'
```

Fetch the live official contract allowlist before verifying any transaction target:

```bash
curl -s https://devapi.ours.meme/api/baw/whitelist
```

## Security Model

- **Keyless MPC Custody:** Master funds remain in Binance Agentic Wallet; the remote MCP server only returns read-only analytics and unsigned calldata.
- **No Hardcoded Addresses:** Agents dynamically cross-check `--to` targets against `/api/baw/whitelist`.
- **Mandatory Preview & Confirmation:** Every write flow requires `baw contract-call preview` and explicit user confirmation prior to `execute`.
- **Exact-Amount Approvals:** Unlimited `maxUint256` approvals are avoided by design.

## Links

- **Glama Verified MCP Connector:** https://glama.ai/mcp/connectors/meme.ours.devapi/ours-meme-binance-agentic-wallet-mcp
- **Upstream Skills Repository:** https://github.com/muranwirebaugh-cmyk/oursmeme-agent-skills
- **OpenAPI 3.1 Spec:** https://devapi.ours.meme/api/agent/openapi.json
- **Documentation:** https://ours.meme/baw.md

## Disclaimer

This skill is an informational and developer integration tool only. It does not constitute financial, investment, or trading advice, and does not endorse or promote any token or market. Users are solely responsible for reviewing transaction previews and managing on-chain risk.
