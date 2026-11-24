# Find curves and sales

All calls are public `GET` requests to `https://api.cheesepad.ai`. Use `curl -s`. Lists return
`{ docs: [...], totalDocs, page, totalPages, hasNextPage, ... }`.

## Melt Curves

`GET /bonding-curve/list`

| Param | Values |
|---|---|
| `chainId` | `56`, `4663`. Always pass it |
| `filterBy` | `active` (not graduated), `graduated`. Default: none (all curves). **Leave it out for buys, sells and any token that may have graduated**: the listing's `state` picks the curve or swap path |
| `agentIdOnly` | `true` → only Agent ID-only curves (BSC) |
| `keyword` | name or symbol, up to 128 chars |
| `sortBy` | `trending`, `newest`, `volume`, `progress`, `marketcap`, `price` |
| `pair` | `all`, `native`, `bnb`, `bstock` |
| `owner` | creator address |
| `page`, `limit` | default 1 and 20, `limit` ≤ 100 |

`GET /bonding-curve/detail?chainId=<id>&fundManager=<addr>` (or `&token=<addr>`) returns one curve.

Several items match → list them (name, symbol, token address, chain) and ask which. The user gave an address → match it to `token.address` and confirm by address. One match by name → state its name, symbol, token address and chain in the summary (names can be cloned).

A listing with `state` `1` or `listedAt` set has graduated: skip the steps call and go to the Graduated curve section of [buy.md](buy.md#graduated-curve) or [sell.md](sell.md#graduated-curve).

Item fields to use:

| Field | Meaning |
|---|---|
| `fundManager` | The curve's id. Pass it to the buy and sell endpoints |
| `token.address`, `token.symbol`, `token.name`, `token.decimals` | The token |
| `quoteToken` | What the curve is priced in. The zero address means the chain's native coin |
| `state` | `0` = active; anything else is not tradable on the curve |
| `listedAt` | Set once the token graduated to a DEX |
| `progressBps` | Progress to graduation, 10000 = full |
| `agentIdOnly` | `true` → buyers need an Agent ID |
| `maxWalletBps` | Per-wallet limit as basis points of supply; `0` = no limit |

## Pool sales (presale, fair launch, subscription)

`GET /v2/discovery/pools`

| Param | Values |
|---|---|
| `status` | `all`, `live`, `upcoming`, `ended` |
| `type` | `all`, `presale`, `fairlaunch`, `subscription` |
| `agentIdOnly` | `true` → only pools whose whitelist is Agent ID holders |
| `keyword`, `sort`, `verified`, `protected`, `excludeChainIds`, `page`, `limit` | as in the website's Explore page |

There is no `chainId` filter. Read `chainId` on each item, or pass `excludeChainIds=97`.

Item fields to use: `chainId`, `pool.fundManager` (the sale's id for the steps endpoints), `pool.poolType` (`0` presale, `1` fair launch, `2` subscription; the steps response's `saleKind` names it too),
`pool.startTime`, `pool.endTime`, `pool.publicSaleStartTime`, `pool.state` (`0` active, `1`
finalized, `2` cancelled), `token.address`, `token.symbol`, `currency.address`,
`currency.symbol`, `currency.decimals`, `whitelistSource`.

`pool.minContribution`, `pool.maxContribution`, `pool.hardCap` (wei of `currency`; `maxContribution` 0 or absent = none): state them to the user and use them to pick an amount. The API enforces them (`below_min_contribution`, `above_max_contribution`, `hardcap_reached`).

`whitelistSource`: `list` = an uploaded list of wallets; `agentId` = Agent ID holders only, until
`pool.publicSaleStartTime`.

## Microsales

`GET /v2/discovery/microsales` takes `agentIdOnly=true`, `listed`, `sort`
(`newest`, `endingSoon`, `hardCap`), `keyword`, `excludeChainIds`, `page`, `limit`.

Item fields: `chainId`, `fundManager`, `startTime`, `endTime`, `state`, `currency`, `agentIdOnly`, `maxContribution`, `hardCap`.

## After finding one

Show the user: name, symbol, chain, price token or currency, state, and whether it is Agent
ID-only or has a per-wallet limit. Then go to [buy.md](buy.md), [sell.md](sell.md) or
[sales.md](sales.md). Listings are not endorsements and carry no advice.
