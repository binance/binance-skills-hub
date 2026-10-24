---
name: chainlink-usd-fee-pricing
description: |
  Price fixed USD-denominated fees (or any USD amounts) in BNB on-chain using the
  Chainlink BNB/USD oracle on BNB Smart Chain (BSC). Covers: the canonical BNB/USD
  feed address and AggregatorV3 interface, reading latestRoundData safely, the
  integer conversion formula (USD cents → wei of BNB), freshness and validity
  checks, frontend display patterns, and a live production reference deployment.

  Use this skill when users ask about:
  - Charging a fixed USD price (e.g. "$0.20 per action") paid in BNB
  - Reading Chainlink price feeds on BSC from Solidity or a script
  - Converting USD to BNB on-chain without an off-chain price API
  - Oracle staleness / safety checks for price-dependent transactions
metadata:
  author: m284743
  version: "1.0"
---

# Chainlink USD Fee Pricing on BSC

## Overview

A common contract requirement: "the user pays $X, in BNB, whatever BNB costs right
now." Hard-coding a BNB amount breaks as soon as the price moves; querying an
off-chain API introduces a trusted third party. The on-chain answer is the
**Chainlink BNB/USD price feed**: read the current price inside the transaction
and convert the USD amount to wei at execution time.

## Canonical Feed

| Item     | Value                                          |
|----------|------------------------------------------------|
| Chain    | BNB Smart Chain (chainId 56)                   |
| Pair     | BNB / USD                                      |
| Contract | `0x0567F2323251f0Aab15c8dFb1967E4e8A7D42aeE`   |
| Decimals | 8 (answer is USD price × 1e8)                  |

Always confirm feed addresses against the official Chainlink data-feeds directory
before deploying; addresses differ per chain.

## Reading the Price

`latestRoundData()` selector: `0xfeaf968c`

```solidity
interface IAggregatorV3 {
    function latestRoundData() external view returns (
        uint80 roundId,
        int256 answer,      // BNB/USD price, 8 decimals
        uint256 startedAt,
        uint256 updatedAt,
        uint80 answeredInRound
    );
}
```

Return-word layout for raw `eth_call`: word 0 = roundId, word 1 = answer
(int256), word 2 = startedAt, word 3 = updatedAt, word 4 = answeredInRound.

## The Conversion Formula

To charge `feeUsd8` USD (expressed with 8 decimals, e.g. $0.20 → `20_000_000`):

```solidity
IAggregatorV3 constant BNB_USD =
    IAggregatorV3(0x0567F2323251f0Aab15c8dFb1967E4e8A7D42aeE);

uint256 public constant FEE_USD_8 = 20_000_000; // $0.20

function feeWei() public view returns (uint256) {
    (, int256 price, , uint256 updatedAt, ) = BNB_USD.latestRoundData();
    require(price > 0, "oracle: bad price");
    require(block.timestamp - updatedAt < 1 hours, "oracle: stale");
    return (FEE_USD_8 * 1e18) / uint256(price); // wei of BNB
}
```

Derivation: `price` is USD per BNB × 1e8, and 1 BNB = 1e18 wei, so

```text
feeWei = feeUsd8 × 1e18 / price
```

Both numerator terms are integers; divide last to preserve precision.

## Usage Patterns

- **Contract-enforced fee**: compute `feeWei()` inside the paid function and
  `require(msg.value >= feeWei())`, then forward to the fee recipient. The fee is
  identical for every caller at every block, with no off-chain coordination.
- **Frontend pre-display**: call `feeWei()` (a `view` function) via `eth_call`
  right before building the transaction, and display the live BNB amount. Never
  cache it — it changes every block the oracle updates.
- **Off-chain estimation**: `scripts/usd_fee_quote.mjs` (included) does the same
  math from raw `eth_call` with no dependencies.

## Safety Checklist

1. `answer > 0` — reject non-positive prices (oracle malfunction).
2. `block.timestamp - updatedAt < threshold` — reject stale rounds. BNB/USD on
   BSC updates frequently; 1 hour is a conservative bound, tighter is better for
   high-value flows.
3. Optionally `answeredInRound >= roundId` — guards against incomplete rounds.
4. Integer math only — never float; divide last.
5. Consider a hard floor/ceiling on `feeWei` if a mispriced round would be
   catastrophic for your use case.

## Live Reference Deployment (Case Study)

A production use of this exact pattern on BSC, inspectable on BscScan:

| Component         | Address                                      |
|-------------------|----------------------------------------------|
| Token contract    | `0x67B8c7abeB7A6b6ef29f15032423AfAB4006888f` |
| Quotable function | `claimFeeWei()` — selector `0x9596fd4d`       |

The contract charges a fixed USD-denominated claim fee converted to BNB at
execution time via the feed above; the conversion is a public `view` function, so
anyone can independently verify the live quote with a single `eth_call`.

*This deployment is cited strictly as an educational reference for the oracle
pricing pattern. Nothing here is a recommendation, endorsement, or guarantee of
any asset.*
