# deposit-preflight

A pre-check procedure for `defi deposit`, mirroring the one `security.md` already mandates for
swaps.

## Why

`references/security.md` in `binance-agentic-wallet` requires an agent to audit the target token,
present every risk item, and obtain explicit acknowledgement before building a swap — and forbids
skipping it silently.

There is no counterpart before a DeFi deposit. An agent receives a protocol name and an APY from
`investment-list`, and that is the whole basis on which it moves funds.

Four properties of the listing make that basis thin:

- `poolAddress` is `null` on every `Earn` product, so for those the listing never says which
  contract a deposit enters. (`LiquidityPool` products do carry it.)
- `investable` is absent from `investment-list`. A delisted product therefore stays visible, and
  can sit at the top when the listing is sorted by rate; the deposit fails only later, with
  `INVESTMENT_NOT_INVESTABLE`.
- One protocol frequently runs several pools for the same asset at materially different rates, and
  the listing does not distinguish them.
- `Earn` reports `APY` and `LiquidityPool` reports `APR`, and the two sit in one sortable list.
  On chain 56 that list holds 61 `Earn` products with a median of 0.72% and 529 `LiquidityPool`
  products with a median of 196%, topped by one at 16,121.58% against $278K of TVL. An agent
  ranking by rate lands there.

For `Earn`, the address is still reachable — `defi preview` returns `feeAndContract.interactWith`
without broadcasting anything. This skill uses it.

## What it does

Seven steps, all against non-broadcasting simulations: listing status, simulation, on-chain
identity, value conservation, exit path, rate against the pool's own history, and capacity.

Verdicts are three-valued — verified, failed, or not tested — so that a product which could not be
checked is never recorded as one that passed.

See [SKILL.md](SKILL.md) for the procedure.

## Dependencies

`@binance/agentic-wallet` (the `baw` CLI), and read access to any public node for the chain being
checked. No additional installation is required by the procedure itself.

## Notes

This procedure checks identity, status, value, exit structure, rate context and capacity. It is not
a security audit, and it makes no statement about the suitability of any product.

A reference implementation for BNB Smart Chain is at
[github.com/ranimth0707/nullius](https://github.com/ranimth0707/nullius) (MIT).
