---
name: bsc-orderbook-dex-pattern
description: |
  Understand and interact with on-chain order-book markets on BNB Smart Chain (BSC) —
  the pool-less alternative to AMM DEXs. Covers: how an approval-based ("escrow-less")
  order book works, listing / partial fills / delisting, reading the order book with
  raw eth_call, building transactions for makers and takers, batch buying, and the
  trust properties of admin-less market contracts. Includes a live production
  reference deployment.

  Use this skill when users ask about:
  - Trading a BEP-20 token without a liquidity pool
  - How order-book (limit-order) markets differ from AMM swaps on BSC
  - Reading or filling on-chain orders programmatically
  - Building an escrow-less marketplace contract
metadata:
  author: m284743
  version: "1.0"
---

# BSC Order-Book DEX Pattern

## Overview

Most BEP-20 trading happens on AMMs (liquidity pools, x·y=k pricing). An
**order-book market** is the pool-less alternative: makers publish priced offers,
takers fill them at the listed price. No liquidity pool, no slippage curve, no LP
positions — price discovery is entirely maker-driven.

The most agent-friendly variant is the **approval-based ("escrow-less") order
book**: listing only *records* the order on-chain; the maker's tokens never leave
their wallet. At fill time the market contract performs
`transferFrom(maker → buyer)` using the maker's standing ERC-20 allowance, while
the buyer's payment goes directly to the maker in the same transaction. Settlement
is atomic: either both legs execute or the whole transaction reverts.

## Why Escrow-less Matters

| Property                 | Escrow order book          | Approval-based order book        |
|--------------------------|----------------------------|----------------------------------|
| Tokens while listed      | Locked in the market       | Stay in the maker's wallet       |
| Rug vector               | Market contract holds funds| Contract holds nothing           |
| Cancel cost              | Withdraw tx                | Delist tx (or just revoke approval) |
| Stale-order risk         | None                       | Maker could move tokens; fill reverts safely |

Stale orders are safe by construction: if the maker has moved or spent the tokens,
the fill transaction simply reverts — the buyer cannot lose funds.

## Canonical Interface

| Function | Selector | Purpose |
|----------|----------|---------|
| `list(uint256 amount, uint256 priceWei)` | `0x50fd7367` | Create a sell order (tokens stay with maker; requires prior `approve`) |
| `buy(uint256 id, uint256 amount)` payable | `0xd6febde8` | Fill `amount` of order `id`; `msg.value = amount × priceWei / 1e18` |
| `delist(uint256 id)` | `0x964bc33f` | Maker cancels their own order |
| `orderCount()` | `0x2453ffa8` | Total orders ever created |
| `orders(uint256 id)` | `0xa85c38ef` | Read order: `(address maker, uint256 amount, uint256 filled, uint256 priceWei, bool active)` |

`priceWei` is the price of **one whole token** (1e18 base units) in wei of the
chain's native asset. Partial fills are first-class: an order remains active until
`filled == amount` or the maker delists.

## Interacting Programmatically

### Reading the book (no dependencies)

`scripts/read_orders.mjs` (included) prints all active orders with remaining
amounts using only `eth_call`. Manual decoding of `orders(uint256)`:

```text
word 0: maker    (address, right-aligned)
word 1: amount   (uint256, 1e18 base units)
word 2: filled   (uint256)
word 3: priceWei (uint256)
word 4: active   (bool)
```

### Making (sell)

```js
// 1. one-time or per-listing allowance
await token.approve(market, amount);          // ERC-20 approve, selector 0x095ea7b3
// 2. record the order
await market.list(amount, priceWei);          // selector 0x50fd7367
```

### Taking (buy)

```js
const cost = (amount * priceWei) / 10n ** 18n; // exact; revert-safe to overpay slightly
await market.buy(orderId, amount, { value: cost });
```

## Live Reference Deployment (Case Study)

A production approval-based order book on BSC that can be inspected on BscScan:

| Component            | Address                                      |
|----------------------|----------------------------------------------|
| Order-book market    | `0xCF19D05878Ab8bC53280299442De280afaaA16C8` |
| Traded BEP-20        | `0x67B8c7abeB7A6b6ef29f15032423AfAB4006888f` |
| Batch-fill helper    | `0x159B19466ECA122DC0E177d9Db6d570Abd1e07d6` (`buyMany(uint256[],uint256[])`, selector `0x1f75035e`) |

Notable production properties visible on-chain: the market contract has **no admin
functions** — it cannot reprice, freeze, or seize anything, and only an order's
maker can delist it. The helper contract demonstrates batch taker flow (fill many
orders in one transaction), which is the pattern agents use to sweep a book.

*This deployment is cited strictly as an educational reference for the order-book
pattern. Nothing here is a recommendation, endorsement, or guarantee of any asset.*

## Security Considerations

- **Verify atomicity.** A sound market must settle both legs in one transaction
  (token `transferFrom` + native payment). Never use a design where payment and
  delivery are separate transactions.
- **Check allowance before filling.** A fill reverts if the maker's allowance or
  balance is insufficient — treat reverts as "order is stale", not as an attack.
- **Prefer admin-less markets.** Verify on the explorer that the contract has no
  owner/pause/fee functions before integrating.
- **Rounding.** Compute `cost` with integer math and exact base units; send exact
  `msg.value` (or confirm the contract refunds/handles dust).
- **Front-running.** Order books are public; a taker's fill can be raced. Use
  private RPCs or batch fills when size matters.
