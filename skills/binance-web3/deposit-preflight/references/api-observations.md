# API observations

Behaviour of the `baw defi` surface that motivates each step of the procedure. Observed on BNB
Smart Chain (`binanceChainId` 56) against 61 `investType=Earn` products.

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

## `poolAddress` is always null; the address is available from `preview`

Every entry returns `poolAddress: null` from both `investment-list` and `investment-info`.

`defi preview` does return it, without broadcasting:

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
