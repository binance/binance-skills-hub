# AILN Discovery

Neutral HTTP integration: discover available tools and optionally run a sponsored search. No wallet, API key, runtime dependency or visitor payment is required. This contribution does not replace the official AILN SKILL.

## Installation

Copy this folder into your agent's documented skill directory and read SKILL.md. If this contribution is merged into the upstream default branch, Node.js 22+ users can use the upstream documented installer:

```sh
npx skills add https://github.com/binance/binance-skills-hub
```

The upstream installation route is conditional on acceptance; this is not a claim of current listing. The generic upstream installer is documented in its README. Agent-specific installation has not been tested.

## Example

Ask: "Discover the tools available at AILN using initialize and tools/list; stop before any paid call." SKILL.md includes the JSON-RPC payloads. For an explicitly requested sponsored search, follow its asynchronous response and rate-limit rules.

## Verification and scope

Public MCP initialize/tools/list and one sponsored query were checked on 2026-11-02 (HTTP 200, completed, chargedMicros=0). Public official SKILL and archive were checked again on 2026-11-03. Paid settlement and agent-specific runtime installation were not verified by these checks.

Prepared against CONTRIBUTING blob f245a39f965aea7df6ecb9dd9083cdb2cdc00a88 and README blob b0ab06d16b6915787fef303e248c2c1549eafe51. MIT applies only to this contribution text. No artwork or declaration is included.
