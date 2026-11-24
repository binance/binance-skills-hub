# Agent ID

An Agent ID is a `.ai` name claimed in the Binance App. Some CheesePad curves, pools and
microsales are for Agent ID holders only. They exist on **BSC (56) only**.

## Check

`baw wallet agent-id --json`

| Result | Meaning |
|---|---|
| `data.claimed: true` | The wallet holds an Agent ID (`data.agentId`, for example `alice.ai`). Continue |
| `data.claimed: false` | No Agent ID, or a claim not yet confirmed. Stop |
| error code `20003008` | Binance's Agent ID service is down. This is not "no Agent ID". Say so and try later |

Run it once. Do not poll. Do not guess eligibility from balances or addresses.

## When to check

| Action | Check? |
|---|---|
| Buy on a curve with `agentIdOnly: true` | yes |
| Contribute to a pool with `whitelistSource: agentId` | yes while `date +%s` < `pool.publicSaleStartTime` (seconds); from then on, or when it is 0, anyone may contribute. Not live yet or ended: the steps call's reason says so |
| Contribute to a microsale with `agentIdOnly: true` | yes |
| Sell, claim, refund | no |
| Any curve or sale on Robinhood Chain | no: none is Agent ID-only there |

## If not claimed

Tell the user: claim an Agent ID in the Binance App → Web3 Wallet → Agent ID (name rules and the
claim flow are in Binance's Agent ID claim FAQ). It takes tens of seconds to confirm, and the check
may lag up to a minute. Then stop. If the user says they just claimed, suggest checking again in a minute.

The Agent ID is held by the agentic wallet's own address. CheesePad also checks on its side: `agent_id_required` from a steps endpoint means CheesePad finds none on this wallet. `agent_id_required` while `claimed: true`: don't wait or retry in this turn. Tell the user CheesePad doesn't see an Agent ID on this wallet yet (it can lag about a minute after a claim), to ask again in a minute, and if it persists to check the claim in the Binance App. Never loop.

## Pools: how the Agent ID window works

Pool owners can set the whitelist to Agent ID holders. Holders may contribute from the sale start
until the public start (`publicSaleStartTime`), up to the pool's maximum contribution per wallet.
After that anyone can. The owner can switch the source, so check the live listing.
