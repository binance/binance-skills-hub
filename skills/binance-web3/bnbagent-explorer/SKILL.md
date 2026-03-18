---
name: bnbagent-explorer
description: BNBAgent Explorer — Live dashboard and developer toolkit for ERC-8183 Agentic Commerce and ERC-8004 Trustless Agents on BNB Chain. Includes security audit, TypeScript SDK, Solidity hook templates, and MCP server.
metadata:
  version: 1.0.0
  author: Mefai
license: MIT
---

# BNBAgent Explorer

Live dashboard and open-source developer toolkit for ERC-8183 (Agentic Commerce Protocol) and ERC-8004 (Trustless Agents) on BNB Chain.

**Live Demo**: [mefai.io/bnbagent](https://mefai.io/bnbagent)

## Summary

BNBAgent Explorer is the first community-built explorer for the ERC-8183 agent commerce standard on BNB Chain. It provides real-time visibility into onchain agent infrastructure — identity registries, job escrows, reputation systems, and compliance verification.

The project includes:
- **8-Panel Live Dashboard** reading from BNB Chain mainnet
- **Security Audit** of ERC-8183 and ERC-8004 contracts (Slither + manual review)
- **TypeScript SDK** (`@mefai/bnbagent-js`) — first JS SDK for ERC-8183
- **7 Solidity Hook Templates** for ERC-8183 IACPHook
- **MCP Server** enabling AI agents to interact with onchain agent infrastructure

## Binance Skills Used

| Skill | Standard | Usage |
|-------|----------|-------|
| ERC-8004 Identity Registry | ERC-8004 | Agent discovery, NFT-based identity on BNB Chain |
| ERC-8004 Reputation Registry | ERC-8004 | Feedback signals, reputation scoring |
| ERC-8183 TaskMarket | ERC-8183 | Job escrow lifecycle (create, fund, submit, complete) |
| BRC-8004 (BNB Chain) | ERC-8004 | BNB Chain-specific identity contracts |
| IACPHook System | ERC-8183 | Hook templates for job lifecycle customization |
| PGTR Forwarder | ERC-8194 | Payment-gated transaction relay |
| BNB Chain RPC | BSC | Real-time chain data indexing |
| BSCScan API | BSC | Contract verification and address lookup |

## Tech Stack

- **Frontend**: Vanilla JS, CSS Grid, Canvas charts — zero dependencies
- **Backend**: Python FastAPI, SQLite, Web3.py — event indexing from BSC mainnet
- **SDK**: TypeScript + ethers.js v6 — read ERC-8004/ERC-8183 from any chain
- **Hooks**: Solidity ^0.8.24, Foundry — 7 ready-to-deploy templates
- **MCP**: Python mcp package — 10 tools for AI agent interaction
- **Audit**: Slither 0.11.5, solc 0.8.24 — 14 findings documented

## Features

### 8 Dashboard Panels
1. **Network Overview** — Live stats (agents, tasks, escrows, feedbacks) with auto-refresh
2. **Job Lifecycle Explorer** — Visual state machine with event timeline
3. **Agent Registry Browser** — Search and inspect ERC-8004 agents on BNB Chain
4. **Live Escrow Monitor** — Track active escrows with status indicators
5. **Dispute & Arbitration** — ERC-8183 dispute flow documentation
6. **Hook System Inspector** — IACPHook interface analysis
7. **Agent Economy Analytics** — Charts, leaderboards, event timeline
8. **ERC-8183 Compliance Checker** — 14-point audit checklist

### Security Audit
- 5 contracts reviewed (1,791 lines of code)
- 14 findings: 7 Medium, 5 Low, 4 Informational
- Slither static analysis with 62 raw detections
- Manual code review of escrow safety, state machine, hook system
- Full report included in repository

### Developer Tools
- **@mefai/bnbagent-js**: TypeScript SDK with IdentityClient, ReputationClient, TaskMarketClient
- **bnbagent-hooks**: 7 Solidity templates (ReputationGate, Bidding, Timelock, MultisigEvaluator, FeeDistribution, Whitelist, Escalation)
- **bnbagent-mcp**: 10 MCP tools for reading agents, tasks, reputation, and network stats

## Architecture

```
BNB Chain Mainnet ─── BRC8004 Identity Registry ─┐
                  ─── BRC8004 Reputation Registry ─├── FastAPI Indexer ── SQLite ── REST API
                                                   │
Base Sepolia ───── TaskMarket (ERC-8183) ──────────┘         │
                                                              │
                                              mefai.io/bnbagent (Frontend)
                                              mefai.io/api/bnbagent (API)
```

## Contract Addresses

| Contract | Address | Network |
|----------|---------|---------|
| IdentityRegistry (BRC8004) | `0xfA09B3397fAC75424422C4D28b1729E3D4f659D7` | BNB Chain Mainnet |
| ReputationRegistry (BRC8004) | `0x17860530385Bdde7992c4Da71B9ec7791E474C08` | BNB Chain Mainnet |
| IdentityRegistry (ERC-8004) | `0x8004A169FB4a3325136EB29fA0ceB6D2e539a432` | Multi-chain |
| ReputationRegistry (ERC-8004) | `0x8004BAa17C55a88189AE136b182e5fdA19dE9b63` | Multi-chain |
| TaskMarket Proxy | `0x2c5aee4b8aee143d832fc398ae52bca7f4ec525d` | Base Sepolia |

## Testing

1. Visit [mefai.io/bnbagent](https://mefai.io/bnbagent) to see the live dashboard
2. API: `curl https://mefai.io/api/bnbagent/stats`
3. Agents: `curl https://mefai.io/api/bnbagent/agents`

## Multi-Language Support

Dashboard available in: English, Turkish, Chinese (Simplified), Korean, Japanese

## Installation (Developer Tools)

```bash
# TypeScript SDK
npm install @mefai/bnbagent-js ethers

# MCP Server
pip install bnbagent-mcp

# Hook Templates
git clone https://github.com/mefai-dev/bnbagent-hooks
cd bnbagent-hooks && forge build
```

## Open Source Repositories

- **Explorer Dashboard**: [mefai-dev/bnbagent-explorer](https://github.com/mefai-dev)
- **Security Audit**: [mefai-dev/bnbagent-audit](https://github.com/mefai-dev)
- **TypeScript SDK**: [mefai-dev/bnbagent-js](https://github.com/mefai-dev)
- **Hook Templates**: [mefai-dev/bnbagent-hooks](https://github.com/mefai-dev)
- **MCP Server**: [mefai-dev/bnbagent-mcp](https://github.com/mefai-dev)
