---
name: cheesepad
description: |
  Use when the user wants to find, buy or sell tokens on CheesePad Melt Curves (bonding curves), or
  join CheesePad sales (presale, fair launch, subscription, microsale): contribute, claim tokens,
  or refund. Also for "Agent ID only" curves and sales, Agent ID holder whitelists, CheesePad
  launchpad, melt pool, graduated curve, max per wallet, BSC or Robinhood Chain launches, and any
  request that mentions CheesePad together with an Agentic Wallet or `baw`.
license: MIT
version: 1.0.0
metadata:
  author: cheesepad
  version: '1.0.0'
  openclaw:
    requires:
      bins:
        - baw
    install:
      - kind: node
        package: '@binance/agentic-wallet'
        bins: [baw]
        label: Install Binance Agentic Wallet CLI (npm)
---

# CheesePad skill

Trade CheesePad Melt Curves and join CheesePad sales from a Binance Agentic Wallet. The CheesePad API
returns ready-to-send transaction steps. You send each one with `baw contract-call`.

API base: `https://api.cheesepad.ai` (public, no login).

Install line for users: `Install the CheesePad skill from https://github.com/cheesepad-ai/cheesepad-agent-skills`

## Command routing

| User intent | Read |
|---|---|
| Find or compare curves, sales, microsales; list Agent ID-only ones | [find-curves.md](references/find-curves.md) |
| Buy a token on a Melt Curve | [buy.md](references/buy.md) |
| Sell a token on a Melt Curve | [sell.md](references/sell.md) |
| Contribute to, claim from, or refund a presale, fair launch, subscription or microsale | [sales.md](references/sales.md) |
| Agent ID needed, or "do I have an Agent ID?" | [agent-id.md](references/agent-id.md) |
| Any step that sends a transaction, any `eligible: false`, any doubt | [safety.md](references/safety.md) |

Read [safety.md](references/safety.md) before the first transaction of a conversation.

## Chains

| Chain | `chainId` | `binanceChainId` | CheesePad contract | Agent ID-only curves and sales |
|---|---|---|---|---|
| BNB Smart Chain | 56 | `56` | `0xD9CcE715619fA9082d21375B6B37A3a0d99138F4` | yes |
| Robinhood Chain | 4663 | `4663` | `0x7E0752B42f9db92F12E221E10fFfa10bfE8668C6` | **no, BSC only** |

Other chains: say CheesePad agent steps don't support them. Pass `chainId` on every steps call and on the curve list. The pool and microsale lists have no chain filter (only `excludeChainIds`): use each item's `chainId`.

## Rules that always apply

Each user message that asks for a transaction is a new action: run rules 1, 2 and 4 again. A `fundManager` found earlier in the conversation for the same sale may be reused.

0. Time: `date +%s` is now, in seconds. `devMode.expiresAt`, `sessionExpireTime` and a preview's `expiresAt` are in **ms**; `startTime`, `endTime`, `publicSaleStartTime`, `listedAt` are in **seconds**.
1. Run `baw wallet status --json`. Not `CONNECTED` → stop and get the user signed in (Binance's skill covers it).
2. Run `baw wallet settings --json`. `devMode.enabled` must be `true` and `devMode.expiresAt` in the future. Otherwise stop and tell the user how to turn on Developer Mode in the Binance App (Agentic Wallet management page → Settings → Developer Mode). Check it before the first steps call (not before the listing). A swap needs only rules 1 and 4.
3. Before buying on an Agent ID-only curve or contributing to an Agent ID sale, run `baw wallet agent-id --json` ([agent-id.md](references/agent-id.md)).
4. Get the wallet address for the chain from `baw wallet address --json`. Never use another address as the buyer, seller or wallet.
5. Use only addresses from CheesePad API responses, the user, or this skill's tables. Never type one from memory.
6. Each CheesePad response lists `steps`. Run them in order. State a short summary (what, how much, step count), then go straight to the first preview. The yes comes at the preview, never before it (refunds: [sales.md](references/sales.md#refund)). Per step: `baw contract-call preview` → show Binance's preview → explicit yes → `baw contract-call execute`. Wait for it to confirm before the next step.
7. `eligible: false` means stop, explain the `reason` in plain words, send nothing. Reasons and what to say: [safety.md](references/safety.md#eligible-false-reasons).
8. Never give investment advice. State facts from the API and the preview; the user decides.
