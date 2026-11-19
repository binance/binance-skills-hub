# AlgoRover Research

Historical strategy discovery and reproducible backtests using AlgoRover Research 0.1.5. This community contribution is independent of Binance and uses an external hosted service. It requires no exchange API keys, wallet addresses, deposits, order placement, or root access.

## Connection

Install this skill folder in a compatible agent, then separately add `https://research.algorover.ai/mcp` as a Streamable HTTP MCP server named `algorover-research`. The agent must support remote MCP and browser OAuth. Installing the skill alone does not establish the connection.

For a client using Cursor-compatible MCP configuration:

```json
{"mcpServers":{"algorover-research":{"url":"https://research.algorover.ai/mcp"}}}
```

Use the client's OAuth interface when personal runs or reports require authorization. Requested scopes are `research:read research:run`. Verify connection by calling `search_strategies` with `locale: "en"` or `locale: "zh-CN"`.

## Examples

- Discover available historical research strategies and explain their presets.
- Prepare a supported 90-day backtest and show its configuration before starting.
- Retrieve metrics and a report for my completed research task.
- Cancel my selected active research task and verify cancellation.

## Dependencies and validation

The external dependency is AlgoRover Research's hosted MCP service and its browser OAuth flow. This folder contains documentation only; it installs no binaries or background processes.

Existing Research 0.1.5 validation established remote initialization, discovery of 16 tools, and public strategy queries. Skill installation was tested with the official skills CLI. These are publisher validation results, not evidence of Binance client compatibility. A full authorized backtest in the Binance Skills Hub environment has not been validated; maintainers should verify remote MCP and OAuth support before acceptance.

## Publisher and licensing

Publisher: AlgoRover / Rivendell Holdings Investment Limited.

The three documentation files in this folder are offered under the included MIT license. The hosted service, its source code, and its other assets are outside that license.

- [Public documentation](https://github.com/algorover/algorover-research)
- [Support](https://www.algorover.ai/en/help/)
- [Privacy](https://www.algorover.ai/privacy/)
- [Service terms](https://www.algorover.ai/terms/)

Historical performance does not establish future returns. Content is for research and education and does not recommend any asset.
