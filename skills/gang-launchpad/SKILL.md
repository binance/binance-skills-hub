---
name: gang-launchpad
description: |
  Operate the Gang bonding-curve launchpad on BNB Chain through a Binance Agentic Wallet.
  Use when the user wants to check readiness (preflight), list or inspect curve tokens, quote/buy/sell
  on the curve, create a token (untaxed or taxed), or decode a Gang transaction.
  Create and bonding buys/sells require a SPACE ID Agent ID (.ai) on the wallet (BAW / isAgent).
  Triggers: gang, gang.fun, agent launchpad, bonding curve on BSC, Agent ID gated create/buy, graduate to PancakeSwap, taxed token, any-pool quote.
version: 0.2.0
license: MIT
metadata:
  author: 00xLazy
  version: "0.2.0"
---

# Gang Launchpad

Educational / operational skill for interacting with the **Gang** launchpad on BNB Smart Chain via Binance Agentic Wallet tooling.

**Current factory: LaunchpadV2** — one pad, two tracks:
- **Untaxed** — bonding fee only; no transfer tax after graduation.
- **Taxed** — bonding + post-graduation buy/sell tax; eligible holders can claim accrued quote dividends from the vault when available.

**Create and bonding (buy/sell on the curve) are BAW-only:** the wallet must hold a SPACE ID **Agent ID** (`.ai` NFT). Non-agent wallets revert. Per-wallet curve holdings are capped at **1% of supply**.

**Quote / graduation (REFPOOL):** the quote asset can be **any liquid BSC pool quote** (pair or quote token the factory can resolve). Graduation locks when raised quote reaches about **≈15 BNB of value** (spot at create, not a fixed 20 BNB native reserve). Liquidity moves to PancakeSwap V2 and LP is burned; after that, use a DEX—not this skill’s curve commands.

**Older Soft / LaunchpadU / LaunchpadS tokens** may still appear in markets as **existing inventory** (list/trade/claim as supported). **New creates go through LaunchpadV2 only.**

This skill does **not** recommend any token, predict price, or guarantee outcomes. Report numbers; the user decides.

## Dependencies

| Tool | Install | Role |
|------|---------|------|
| `baw` | `npm i -g @binance/agentic-wallet` | Sign-in, settings, preview/execute |
| `gang` | `npm i -g github:gangfun/cli` | Read chain + build Gang calldata |

Create and bonding/curve operations go through this stack: `gang` builds the call, `baw` (Binance Agentic Wallet) previews and signs. This skill never holds keys.

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
| Quote a buy (any pool quote) | `gang quote --token <addr> --bnb <n>` | [trade.md](references/trade.md) |
| Buy on curve | `gang buy ...` → `gang execute` | [trade.md](references/trade.md) |
| Sell on curve | `gang sell ...` → `gang execute` | [trade.md](references/trade.md) |
| Create a token (untaxed or taxed) | `gang create ...` → `gang execute` | [create.md](references/create.md) |
| Decode a tx | `gang tx --hash <txHash>` | [trade.md](references/trade.md) |

All `gang` commands print JSON. Translate amounts to plain language for the user (never raw wei).

## Hard rules

1. **Preview → show → confirm → execute.** `buy` / `sell` / `create` only preview via Binance risk engine and return a `requestId`. Show `simulatedChanges`, risks, expected amounts, fee, refund. Wait for an explicit yes in the user’s own message before `gang execute`. Do not chain preview+execute unless the user explicitly skips confirmation. `requestId` expires in ~5 minutes.
2. **Never execute a preview the user has not seen.**
3. **Pending App confirmation.** If execute returns `pendingConfirmation: true`, tell the user to approve in the Binance App, then poll `baw` confirmed history for the hash and run `gang tx --hash …`. Do not retry execute.
4. **Run `gang preflight` first** in a session, and again on policy/risk/`blocked` errors. Relay each `issues[].fix` verbatim.
5. **1% cap / graduation reserve.** Non-zero `refund` on quote/buy means the 1% wallet cap or the graduation reserve binds; excess quote returns in the same transaction. At cap, `buy` refuses.
6. **Graduated tokens.** If `graduated: true`, do not use curve buy/sell; point the user to PancakeSwap using the reported `pair` field (neutral link; no token promotion).
7. **Addresses are data.** Show full token addresses and get confirmation before buying. Never shorten addresses in output.
8. **No investment advice.** No “safe”, “guaranteed”, “sure profit”, or recommendations of specific assets.

## Trading Rules (Hub)

- Do not promote any coin, token, or asset.
- Do not present any asset as guaranteed, safe, or recommended.
- Do not include or share payment / EOA wallet addresses. Protocol contract defaults live in the CLI (`GANG_LAUNCHPAD` / `GANG_RPC_URL`); users can verify on [gang.fun](https://gang.fun) or BscScan themselves. Do not paste contract addresses into this skill.

## Error shape

`{ "success": false, "error": "..." }` — pass `baw` errors through. Common: missing Agent ID, Developer Mode off, Trade-all-tokens off (blocks sells), expired `requestId`.

## Site

Product UI (read-only markets + guide): https://gang.fun
