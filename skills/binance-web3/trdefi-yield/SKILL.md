---
name: trdefi-yield
description: 'Manage treasury float and earn idle USDC yield without custody via TRDEFI — non-custodial allowance (ERC-2612), virtual Aqua strategies, wallet-safe. List pools, get quote, activate yield. Use when users ask to manage treasury float, idle funds, idle USDC yield, non-custodial yield, treasury yield, wallet-safe yield, allowance yield, virtual strategy, Aqua pool, TRDEFI yield, idle stablecoin, treasury optimization, yield without pool deposit.'
version: "0.1.0"
license: MIT
---

# TRDEFI Yield — Non-Custodial Treasury Yield (Idle Funds)

TRDEFI provides non-custodial treasury infrastructure for idle stablecoin float ($500K–$50M+ USDC/USDT). Funds remain in the user's wallet (Safe/multisig); only revocable allowances (ERC-2612/EIP-3009) are moved at the user's price via approved router. No pool deposit, no custody transfer, no TRDEFI keys. Live at yield.trdefi.com.

This skill exposes TRDEFI's Aqua virtual strategies as agent tools. It is neutral, factual, and educational — not investment advice. All quotes are `eth_call` simulations, verifiable on-chain. Protocol fee 0.02% all-in to 0x4C96dA02d7120BFb81594d0e924B237e0c74660d (same on Ethereum/Base/Arbitrum/Optimism/Polygon), x402-compatible, exact amount+deadline, revocable via approve(0)+dock in 1 tx.

## When to Use

Use whenever the user says: "manage treasury float", "idle USDC yield", "non-custodial yield", "treasury yield", "wallet-safe yield", "allowance yield", "virtual strategy", "Aqua pool", "TRDEFI yield", "idle stablecoin", "idle funds yield", "treasury optimization", "yield without pool deposit", "activate treasury yield", "list treasury strategies", "get yield quote", "yield without custody", "put idle funds to work".

## APIs Used

| Method | Endpoint | Description | Required Parameters | Optional Parameters | Authentication |
|--------|----------|-------------|---------------------|---------------------|--------------|
| GET | https://yield.trdefi.com/.netlify/functions/strategies?resource=list | List active Aqua virtual strategies (Shipped events from AQUA_CORE) | — | chain (all/ethereum/base/arbitrum/optimism/polygon), filter (active/docked/all), pair (all/usdc-usdt), limit (1-100) | No |
| GET | https://yield.trdefi.com/.netlify/functions/strategies?resource=quote | Get verifiable quote via SwapVM Router (eth_call, no gas) | hash (bytes32), amount (base units) | chain (base), direction (aToB/bToA) | No |
| GET | https://yield.trdefi.com/.netlify/functions/strategies?resource=quote | Propose yield activation (reuse quote + permit hint, x402) | hash, amount, agentWallet (0x...) | chain, direction | No (agent wallet signs locally) |

## Binaries Used

- `curl` — for direct API inspection
- `node` (>=22) — for local `npx skills add` testing (no root required)

## How it Works

1. **Discover** — Agent calls `list_aqua_pools` (wraps `resource=list`). Returns active strategies across 5 chains, verified USDC/USDT and unverified pairs. No pool TVL lock — virtual X0/Y0.
2. **Quote** — Agent calls `get_quote` with `hash` + `amount` + `chain`. Returns `amountIn/amountOut/orderHash` via `quote` eth_call on SwapVM Router 0x111111338c5091e8440b67B168bae16a668AC0De. Protocol fee 0.02% all-in included in quote, x402 hint returned.
3. **Activate** — Agent proposes `ERC-2612` permit for exact amount+deadline. User/agent wallet signs locally, calls router, fee splits on-chain to 0x4C96... in same tx. No TRDEFI custody. Revocable via `approve(0)` + `dock()` in 1 tx. All events verifiable via Etherscan/Basescan. No transfer of idle funds to an external LP — funds stay in wallet until eligible order flow.

## Use Cases

- **Treasury discovery:** "List active Aqua pools on Base and Ethereum" → `list_aqua_pools(chain=all, limit=20)`
- **Yield simulation:** "Get quote for 1M USDC on TR-01 Base" → `get_quote(hash=0x..., chain=base, amount=1000000000000)`
- **Idle funds activation:** "Activate 500K idle USDC yield without custody" → `swap_propose` flow with agent wallet, x402 payment in same tx
- **Cross-chain comparison:** "Compare USDC/USDT strategies across Ethereum vs Base" → two `list` + `quote` calls
- **Risk-first funnel:** `list` → `quote` → verify `pair_verified` → check `strategy_hash` on explorer

## References

- TRDEFI: https://yield.trdefi.com
- Docs: https://yield.trdefi.com/presentation.html
- API Docs: `references/api.md` (quote/list examples)
- Aqua Core: 0x1111113ccf1426a8e30e2bff5e005d929bf6a90a, SwapVM Router: 0x111111338c5091e8440b67B168bae16a668AC0De
- WebMCP (backend-only, no pill): `yield.trdefi.com/webmcp.js` provides identical tools via `document.modelContext` for browser agents

## Security & Disclaimer

- This skill holds no private keys, signs nothing, sends nothing on-chain. It returns quotes and unsigned permit hints; the agent wallet signs locally.
- Use a dedicated low-privilege wallet with limited allowance. Never use a primary treasury for testing. Store any TRDEFI API key in `.env` with `0600` permissions, never pass via CLI `--key` (leaks to `ps`/`history`).
- Smart contract bugs, policy misconfiguration, and integration issues can still exist. Users are responsible for reviewing quotes and allowances. Not investment advice, at your own risk, TRDEFI and Binance not liable.
- Content is neutral, factual, and educational. No coin promotion, no asset presented as guaranteed/safe/recommended. No valid wallet address in examples (use `0x0000000000000000000000000000000000000000` placeholder).

