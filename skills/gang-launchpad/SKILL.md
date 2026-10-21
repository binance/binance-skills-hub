---
name: gang-launchpad
description: |
  Operate the Gang bonding-curve launchpad on BNB Chain through a Binance Agentic Wallet.
  Use when the user wants to check readiness (preflight), list or inspect curve tokens, quote/buy/sell
  on the curve, create a token, or decode a Gang transaction. Curve buys require a SPACE ID Agent ID
  (.ai) on the wallet. Signing is always via `baw`; this skill never holds keys.
  Triggers: gang, gang.fun, agent launchpad, bonding curve on BSC, Agent ID gated buy, graduate to PancakeSwap.
version: 0.1.0
license: MIT
metadata:
  author: 00xLazy
  version: "0.1.0"
---

# Gang Launchpad

Educational / operational skill for interacting with the **Gang** launchpad on BNB Smart Chain via Binance Agentic Wallet tooling.

Gang’s curve market only accepts wallets that hold a SPACE ID **Agent ID** (`.ai` NFT). Per-wallet holdings from the curve are capped (1% of supply). When real reserves on a token reach **20 BNB**, liquidity is moved to PancakeSwap V2 and LP is burned; after that, use a DEX—not this skill’s curve commands.

This skill does **not** recommend any token, predict price, or guarantee outcomes. Report numbers; the user decides.

## Dependencies

| Tool | Install | Role |
|------|---------|------|
| `baw` | `npm i -g @binance/agentic-wallet` | Sign-in, settings, preview/execute |
| `gang` | `npm i -g github:gangfun/cli` | Read chain + build Gang calldata |

Optional (upstream site skill, same product):

```bash
npx skills add gangfun/gang-launchpad/skill
```

Node.js ≥ 18. Chain: BSC (`56`) only. No testnet for Agentic Wallet.

## When to use

| User intent | Command | Reference |
|-------------|---------|-----------|
| Ready to trade? / policy errors | `gang preflight` | [preflight.md](references/preflight.md) |
| List tokens / progress | `gang list` | [trade.md](references/trade.md) |
| One token detail | `gang token --token <addr>` | [trade.md](references/trade.md) |
| Quote a buy | `gang quote --token <addr> --bnb <n>` | [trade.md](references/trade.md) |
| Buy on curve | `gang buy ...` → `gang execute` | [trade.md](references/trade.md) |
| Sell on curve | `gang sell ...` → `gang execute` | [trade.md](references/trade.md) |
| Create a token | `gang create ...` → `gang execute` | [create.md](references/create.md) |
| Decode a tx | `gang tx --hash <txHash>` | [trade.md](references/trade.md) |

All `gang` commands print JSON. Translate amounts to plain language for the user (never raw wei).

## Hard rules

1. **Preview → show → confirm → execute.** `buy` / `sell` / `create` only preview via Binance risk engine and return a `requestId`. Show `simulatedChanges`, risks, expected amounts, fee, refund. Wait for an explicit yes in the user’s own message before `gang execute`. Do not chain preview+execute unless the user explicitly skips confirmation. `requestId` expires in ~5 minutes.
2. **Never execute a preview the user has not seen.**
3. **Pending App confirmation.** If execute returns `pendingConfirmation: true`, tell the user to approve in the Binance App, then poll `baw` confirmed history for the hash and run `gang tx --hash …`. Do not retry execute.
4. **Run `gang preflight` first** in a session, and again on policy/risk/`blocked` errors. Relay each `issues[].fix` verbatim.
5. **1% cap.** Non-zero `refund` on quote/buy means the wallet cap (or graduation reserve) binds; excess BNB returns in the same transaction. At cap, `buy` refuses.
6. **Graduated tokens.** If `graduated: true`, do not use curve buy/sell; point the user to PancakeSwap using the reported `pair` field (neutral link; no token promotion).
7. **Addresses are data.** Show full token addresses and get confirmation before buying. Never shorten addresses in output.
8. **No investment advice.** No “safe”, “guaranteed”, “sure profit”, or recommendations of specific assets.

## Trading Rules (Hub)

- Do not promote any coin, token, or asset.
- Do not present any asset as guaranteed, safe, or recommended.
- Do not include or share payment / EOA wallet addresses. Protocol contract defaults live in the CLI (`GANG_LAUNCHPAD` / `GANG_RPC_URL`); users can verify on [gang.fun](https://gang.fun) or BscScan themselves.

## Error shape

`{ "success": false, "error": "..." }` — pass `baw` errors through. Common: missing Agent ID, Developer Mode off, Trade-all-tokens off (blocks sells), expired `requestId`.

## Site

Product UI (read-only markets + guide): https://gang.fun
