# API observations

Behaviour of the `baw defi` surface that motivates each step of the procedure. Observed on BNB
Smart Chain (`binanceChainId` 56), which returns **61 `Earn` products and 529 `LiquidityPool`
products** across 10 protocols — 590 in total.

## `investType` accepts two values, not three

`baw defi protocol-list --help` and `investment-list --help` both document
`Earn, Loan, LiquidityPool`. Passing `Loan` returns:

```json
{ "success": false,
  "error": { "code": 1001001, "name": "UNKNOWN_ERROR",
             "message": "Invalid investType value. Supported values: Earn, LiquidityPool." } }
```

The CLI help text and the API disagree.

## The two product types behave differently, and the difference matters

|  | `Earn` | `LiquidityPool` |
|---|---|---|
| count on chain 56 | 61 | 529 |
| `poolAddress` | `null` on every product | populated on every product |
| `apyType` | `APY` | `APR` |
| median advertised rate | 0.72% | 196% |
| highest advertised rate | 12.44% | 16,121.58% |

Sampled 8 of each; the `poolAddress` split was 0/8 populated for `Earn` and 8/8 populated for
`LiquidityPool`.

Consequences for the procedure:

- For `LiquidityPool`, the contract can be read straight from `investment-info`. Step 3 can verify
  it directly.
- For `Earn`, it cannot, and `defi preview` is the only route to the address. Step 2 exists for
  this case.
- An `APR` on a concentrated-liquidity position is an annualised fee rate. It is not a return a
  depositor receives, and it does not account for impermanent loss. Presenting an `APR` and an
  `APY` in the same sorted list invites a comparison that does not hold.

The highest advertised rate on the whole surface is a `LiquidityPool` product at 16,121.58% APR
against $278K of TVL. An agent that ranks the listing by rate and deposits into the top entry lands
there.

## `investment-list` omits deposit eligibility

`investment-list` does not return `investable`. `investment-info` does, one product at a time.

A delisted product therefore remains in the listing with its rate intact. Sorting the listing by
APY placed such a product first; simulating a deposit on it returned:

```json
{ "success": false,
  "error": { "code": 60001002, "name": "INVESTMENT_NOT_INVESTABLE",
             "message": "This investment product has been delisted and no longer accepts new deposits. You can still redeem or withdraw your existing position." } }
```

An agent that ranks the listing by yield and deposits into the top entry meets this error rather
than the listing.

## For `Earn`, the address is only available from `preview`

`Earn` entries return `poolAddress: null` from both `investment-list` and `investment-info`.
(`LiquidityPool` entries do carry it — see the table above.)

`defi preview` returns it for either type, without broadcasting:

```json
{ "feeAndContract": {
    "interactWith": { "address": "0x..." },
    "estimatedNetworkFee": { "amount": "...", "tokenSymbol": "BNB", "valueUsd": "..." } },
  "balanceChange": [ { "tokenSymbol": "...", "amount": "-0.005", "valueUsd": "..." },
                     { "tokenSymbol": "...", "amount": "...",    "valueUsd": "..." } ],
  "warnings": [] }
```

This makes contract identity checkable before signing. Step 3 of the procedure relies on it.

## `investmentName` is not unique within a protocol

Several products can share a protocol and an asset while differing materially in rate. In one
observed case a single protocol carried six lending products for the same stablecoin, spanning
roughly 1.8% to 34.7%. Nothing in `investment-list` distinguishes them beyond `investmentId`.

Resolving the specific contract is therefore necessary before any rate or size can be interpreted.

## Symbol spelling differs from third-party indexes

The surface writes `BSC_ETH` where common third-party indexes write `ETH`, and `BNB` where they
write `WBNB`. Cross-referencing without normalising these produces false reports of "no
independent record", which materially overstates how much of the listing is unverifiable.

## Not every target contract implements `name()` / `symbol()`

Several products resolve to contracts that hold bytecode but return nothing for `name()` or
`symbol()`. This is ordinary for vault and adapter contracts and is **not** evidence of a
mismatch. Treating silence as failure produces false accusations against live protocols; the
procedure records it as not tested.

## `preview --action redeem` reports exit structure

With no position open, a product whose withdrawal path is wired up returns:

```json
{ "success": false,
  "error": { "code": 60003001, "name": "INVESTMENT_NO_POSITION",
             "message": "You don't have any position in this investment product." } }
```

Reaching the position check indicates the exit path exists. A delisted product returns the same,
consistent with its message that existing positions remain redeemable.

## `preview` validates balance before anything else

`preview` returns `INSUFFICIENT_BALANCE` when the wallet does not hold the asset, so a deposit
cannot be simulated for an asset that is not held. The procedure records this as not tested rather
than as a property of the product.

## Scope

DeFi commands answered only on `binanceChainId` 56 at the time of writing. Other chain ids
returned `This chain is not supported yet`, though the wallet itself addresses seven chains.
