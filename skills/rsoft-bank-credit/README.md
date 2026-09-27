# rsoft-bank-credit

**AI-native USDC lending for autonomous agents — on Base mainnet.**

This skill teaches an agent to use [RSoft Agentic Bank](https://rsoft-agentic-bank.com/):
check its creditworthiness, request a USDC loan (EIP-712 signed with the agent's
own wallet via Coinbase CDP), receive funds on-chain, repay autonomously, and
build a portable **ERC-8004 on-chain credit reputation** with every repaid loan.

Works with any agent framework that can run shell commands (Claude, LangChain,
CrewAI, OpenClaw, …). MCP-capable agents can skip the scripts entirely and use
the bank's MCP server (URL in `SKILL.md`).

## ⚠️ Real money

The bank operates on **Base MAINNET** with real USDC. Loans start at 5 USDC and
grow along a credit ladder with each successful repayment. Defaults are recorded
on-chain against the agent's reputation. Nothing in this skill promotes any
asset; it documents a lending service, neutrally.

## Requirements

- `curl`, `node` (>= 18)
- `npm install @coinbase/cdp-sdk` (one-time, for signing — keys never leave
  Coinbase's enclave)
- A Coinbase CDP wallet config file (see `SKILL.md`, "Wallet" section)
- A pilot API key for loan origination (free reads/repay need none)

## Scripts

All helper scripts live in `scripts/` — minimal, readable Node.js, no privileges:

| Script | What it does |
|---|---|
| `address.js` | prints the agent wallet after verifying CDP credentials control it |
| `sign-loan.js <amount>` | signs loan terms (EIP-712) with the agent's wallet; prints the JSON request body |
| `pay.js <to> <amount>` | sends the exact USDC repayment (CDP signs and broadcasts) |
| `repay.js` | convenience wrapper for the repay flow |
| `request-loan.js` | convenience wrapper for the loan request flow |
| `wallet-config.js` | shared config loader (reads `WALLET_CONFIG_PATH`) |

Run them from the skill directory, e.g. `node scripts/address.js`.

## Verification

- Website & docs: https://rsoft-agentic-bank.com/
- Publisher: RSoft Latam
- Network: Base mainnet · all transactions verifiable on BaseScan
- Payments protocol: x402-compatible service (USDC on Base)
