---
name: gang
description: |
  Use when the user wants to launch, buy, sell, upload a logo, or look up tokens on Gang — the agent-only launchpad on BNB Chain
  where the bonding curve (内盘) is open only to Binance Agentic Wallets holding a .ai Agent ID.
  Triggers: gang, gang.fun, agent launchpad, internal market / 内盘, bonding curve buy/sell, launch a token for my agent,
  upload logo, graduate to PancakeSwap, check launchpad tokens, my gang holdings, 1% wallet cap, Agent ID gated token.
metadata:
  author: gangfun
  version: '0.2.1'
  requires:
    bins: [baw, gang]
  install:
    - kind: node
      package: '@binance/agentic-wallet'
      bins: [baw]
      label: Binance Agentic Wallet CLI
    - kind: node
      package: 'github:gangfun/cli'
      bins: [gang]
      label: Gang CLI (@gangfun/cli@0.2.1)
---

# Gang Skill

Gang is a bonding-curve launchpad on BNB Chain whose internal market only accepts **Binance Agentic Wallets that hold a
.ai Agent ID**. Every wallet may hold at most **1% of a token's supply** from the curve. Buys and sells pay a **1% fee**.

**New create → LaunchpadV2 only** (logoURI / taxed / any-pair). Soft / LaunchpadU / LaunchpadS: **no new create**; buy/sell/claim existing only.
When a **new** token raises ≈ **15 BNB** it graduates to PancakeSwap V2 (LP burned). Soft archive tokens still graduate at 20 BNB on-chain.
Before graduation tokens **cannot be transferred**, only bought and sold on the curve.

The `gang` CLI reads the chain and builds calldata; all signing goes through the user's Agentic Wallet via `baw`.
It never holds keys.

Install: `npm i -g @gangfun/cli@0.2.1 --registry=https://npm.pkg.github.com` or `npm i -g github:gangfun/cli`.

## Command Routing

| User intent | Command | Reference |
|---|---|---|
| Am I ready to use Gang? / policy error | `gang preflight` | [preflight.md](references/preflight.md) |
| List tokens | `gang list` | [trade.md](references/trade.md) |
| One token | `gang token --token <addr>` | [trade.md](references/trade.md) |
| Quote | `gang quote --token <addr> --bnb <n>` | [trade.md](references/trade.md) |
| Buy | `gang buy …` → `gang execute` | [trade.md](references/trade.md) |
| Sell | `gang sell …` → `gang execute` | [trade.md](references/trade.md) |
| Upload logo | `gang upload-logo --file <path>` | [create.md](references/create.md) |
| Create (V2) | `gang create --name <n> --symbol <s> [--logo-uri URL \| --logo <file>] [--taxed] [--pair-or-quote 0x…]` → execute | [create.md](references/create.md) |
| Execute / decode | `gang execute` / `gang tx` | [trade.md](references/trade.md) |

Every command prints JSON. Pass results in plain language, never raw wei.

## Hard rules

- **Preview → show → confirm → execute.** Never chain unless user skips confirmation.
- **Create = LaunchpadV2 only.** Soft/U/S create refused. Do not advertise Soft create or lead with **20 BNB** as the create path.
- **Logo.** `gang upload-logo --file …` or `gang create --logo ./file.png`. UI: https://gang.fun/dev/logo.
- **Sells may need App approval** (`pendingConfirmation`).
- **Run `gang preflight` first**; relay `issues[].fix`.
- **1% cap**; graduated → PancakeSwap via `pair`.
- **No investment advice.**

## Errors

`{ "success": false, "error": "…" }` — common: `NO_AGENT_ID`, Soft/U/S create refused, trade-all-tokens off, expired preview.
