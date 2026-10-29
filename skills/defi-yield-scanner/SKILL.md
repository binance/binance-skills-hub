---
title: DeFi Yield Scanner
description: |
  Finds the highest-yield DeFi opportunities for any token across multiple chains
  and protocols. Compares lending rates (Aave, Compound, Venus), liquidity pool APYs,
  and staking yields side by side. Applies safety filters (TVL > $1M, audited protocols
  only) to exclude high-risk farms. Supports single-token lookup ("best yield for USDC"),
  cross-chain comparison ("Aave yield on ETH vs BSC vs Arbitrum"), and batch scanning
  of stablecoins or Binance Alpha tokens. Use when users ask "where should I put my
  USDC to earn yield", "best APY for ETH", "DeFi yield comparison", "highest staking
  rate", "lending rate comparison", or "is this farm safe".
  Part of the four-skill workflow: Smart Money Tracker (discover) → Token Safety Scanner
  (verify) → Cross-Chain DEX Price Scanner (buy cheap) → DeFi Yield Scanner (earn yield).
metadata:
  author: Bob-QoQ
  version: "1.0"
license: MIT
---

# DeFi Yield Scanner

## Overview

| Step | Action | Data Source |
|------|--------|-------------|
| 1 | Fetch all yield pools globally | DefiLlama Yields API |
| 2 | Filter by user's token symbol | Local filtering |
| 3 | Apply safety filters (TVL, audit status) | Local filtering |
| 4 | Rank by APY (split base vs reward) | Local calculation |
| 5 | Optional: compare same protocol across chains | Local grouping |
| 6 | Optional: batch scan stablecoins or Binance Alpha list | Binance Alpha API + Step 1-4 |

### Supported Chains

All chains tracked by DefiLlama (119 chains), including:

| Chain | Common Protocols |
|-------|-----------------|
| Ethereum | Aave V3, Compound V3, Lido, Curve, Convex |
| BSC | Venus, PancakeSwap, Alpaca Finance |
| Arbitrum | Aave V3, GMX, Radiant, Pendle |
| Base | Aave V3, Aerodrome, Moonwell |
| Polygon | Aave V3, QuickSwap, Beefy |
| Optimism | Aave V3, Velodrome, Sonne |

---

## Step 1: Fetch All Yield Pools

### Primary: DefiLlama Yields API

#### Method: GET

**URL**:
```
https://yields.llama.fi/pools
```

No authentication required. No query parameters — returns all pools in one call.

**Rate limit**: No official limit, but cache results for 30 minutes (data updates hourly).

### Response (`data[]`)

| Field | Type | Description |
|-------|------|-------------|
| pool | string | Unique pool UUID |
| chain | string | Chain name (e.g. `Ethereum`, `BSC`) |
| project | string | Protocol slug (e.g. `aave-v3`, `compound-v3`) |
| symbol | string | Token symbol or pair (e.g. `USDC`, `USDC-USDT`) |
| tvlUsd | number | Total value locked in USD |
| apy | number | Total APY (base + reward combined) |
| apyBase | number/null | Base APY from fees/interest only |
| apyReward | number/null | Reward APY from token incentives |
| rewardTokens | array/null | List of reward token addresses |
| exposure | string | `single` (one token) or `multi` (LP pair) |
| il7d | number/null | 7-day impermanent loss (for LP pools) |
| stablecoin | boolean | Whether the pool contains only stablecoins |
| poolMeta | string/null | Extra info (e.g. `Lending`, pool metadata) |

### Example Response

```json
{
  "status": "success",
  "data": [
    {
      "pool": "747c1d2a-c668-4682-b9f9-296708a3dd90",
      "chain": "Ethereum",
      "project": "aave-v3",
      "symbol": "USDC",
      "tvlUsd": 1500000000,
      "apy": 3.5,
      "apyBase": 2.5,
      "apyReward": 1.0,
      "rewardTokens": ["0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9"],
      "exposure": "single",
      "il7d": null,
      "stablecoin": true,
      "poolMeta": "Lending"
    },
    {
      "pool": "a2e332a0-88f1-4641-b5b1-933e32a8d858",
      "chain": "BSC",
      "project": "venus-core-pool",
      "symbol": "USDC",
      "tvlUsd": 320000000,
      "apy": 4.8,
      "apyBase": 3.2,
      "apyReward": 1.6,
      "rewardTokens": ["0xcF6BB5389c92Bdda8a3747Ddb454cB7a64626C63"],
      "exposure": "single",
      "il7d": null,
      "stablecoin": true,
      "poolMeta": null
    }
  ]
}
```

### Fallback: DefiLlama Pro API

If the free endpoint becomes unavailable, the same data is available at:
```
https://pro-api.llama.fi/{API_KEY}/yields/pools
```
Requires a DefiLlama Pro API key.

---

## Step 2: Filter by Token

Match the user's requested token against the `symbol` field.

```
user_token = "USDC"

matching_pools = [
    pool for pool in all_pools
    if user_token.upper() in pool.symbol.upper().split("-")
]
```

**Important**: The `symbol` field may contain pairs like `USDC-USDT` or `WETH-USDC`. Split by `-` and check if the user's token appears in any position.

For single-asset yield only (lending, staking), additionally filter:
```
single_asset_pools = [p for p in matching_pools if p.exposure == "single"]
```

---

## Step 3: Safety Filters

Apply these filters to exclude high-risk opportunities:

| Filter | Threshold | Reason |
|--------|-----------|--------|
| tvlUsd | > $1,000,000 | Minimum liquidity depth |
| apy | < 100% | Unrealistic APY usually means ponzi or temporary |
| project | Known protocols only | Optional: maintain allowlist of audited protocols |

### Audited Protocol Allowlist (recommended)

```
AUDITED_PROTOCOLS = {
    "aave-v3", "aave-v2",
    "compound-v3", "compound-v2",
    "lido", "rocket-pool",
    "curve-dex", "convex-finance",
    "venus-core-pool",
    "pancakeswap-amm-v3",
    "gmx-v2", "radiant-v2",
    "aerodrome-v2", "velodrome-v2",
    "moonwell", "sonne-finance",
    "pendle", "morpho-aavev3",
    "beefy", "yearn-finance",
    "stargate", "benqi-lending",
    "spark", "sky",
    "fluid", "euler",
}
```

### Risk Classification

Assign a risk tier based on TVL + protocol track record:

```
if tvlUsd > 500_000_000 and project in AUDITED_PROTOCOLS:
    risk = "LOW"
elif tvlUsd > 10_000_000 and project in AUDITED_PROTOCOLS:
    risk = "MEDIUM"
else:
    risk = "HIGH"
```

---

## Step 4: Rank by APY

Sort filtered pools by total `apy` descending. Display breakdown:

```
sorted_pools = sort(filtered_pools, key=apy, descending=True)

for each pool:
    display: protocol, chain, total_apy, base_apy, reward_apy, tvl, risk
```

**Key distinction to explain to users**:
- `apyBase`: Sustainable yield from lending interest or trading fees. More reliable.
- `apyReward`: Temporary incentive from token emissions. May decrease or end.

---

## Step 5: Cross-Chain Comparison (Optional)

When the user asks "compare Aave across chains" or "best chain for lending USDC":

```
target_project = "aave-v3"
target_token = "USDC"

aave_pools = [
    p for p in filtered_pools
    if p.project == target_project and target_token in p.symbol
]

group_by_chain = group(aave_pools, key=chain)
sort by apy descending
```

---

## Step 6: Batch Scan (Optional)

### Scan All Stablecoins

Predefined list of major stablecoins:
```
STABLECOINS = ["USDC", "USDT", "DAI", "FRAX", "GHO", "crvUSD", "LUSD", "TUSD"]
```

For each stablecoin, run Steps 2-4. Report the single best opportunity per token.

### Scan Binance Alpha Tokens

Fetch the Binance Alpha list first:

#### Method: GET

**URL**:
```
https://www.binance.com/bapi/defi/v1/public/wallet-direct/buw/wallet/cex/alpha/all/token/list
```

**Headers**: `Accept-Encoding: identity`

For each `tokenSymbol` in the response, search for matching yield pools. Only report tokens that have at least one pool with APY > 1% and TVL > $1M.

---

## Output Format

### Single Token Scan

```
================================================================
  DEFI YIELD SCANNER
  Token: USDC
================================================================

  TOP YIELD OPPORTUNITIES  (safety-filtered, ranked by APY)

  #  Protocol       Chain       APY     Base    Reward   TVL        Risk
  1  Venus          BSC         4.80%   3.20%   1.60%    $320.0M    LOW
  2  Morpho-Aave    Ethereum    4.52%   4.52%   --       $890.5M    LOW
  3  Aave V3        Arbitrum    4.15%   3.10%   1.05%    $1.2B      LOW
  4  Compound V3    Ethereum    3.85%   3.85%   --       $650.0M    LOW
  5  Moonwell       Base        5.20%   2.80%   2.40%    $45.0M     MEDIUM

  [i] Base APY = from interest/fees (sustainable)
  [i] Reward APY = from token incentives (may decrease)

  BEST PICK: Venus on BSC — 4.80% APY, $320M TVL, LOW risk
================================================================
```

### Cross-Chain Comparison

```
================================================================
  CROSS-CHAIN COMPARISON
  Protocol: Aave V3  |  Token: USDC
================================================================

  Chain        APY     Base    Reward   TVL
  Arbitrum     4.15%   3.10%   1.05%    $1.2B
  Optimism     3.92%   3.00%   0.92%    $180.5M
  Ethereum     3.50%   2.50%   1.00%    $1.5B
  Polygon      3.20%   2.80%   0.40%    $95.0M
  Base         3.05%   2.65%   0.40%    $230.0M

  BEST CHAIN: Arbitrum — 4.15% APY
================================================================
```

### Stablecoin Batch Scan

```
================================================================
  STABLECOIN YIELD OVERVIEW  (best opportunity per token)
================================================================

  #  Token   Best Protocol   Chain      APY     TVL        Risk
  1  GHO     Sky             Ethereum   6.20%   $180.0M    MEDIUM
  2  USDC    Venus           BSC        4.80%   $320.0M    LOW
  3  DAI     Spark           Ethereum   4.50%   $1.1B      LOW
  4  USDT    Aave V3         Arbitrum   4.10%   $890.0M    LOW
  5  FRAX    Curve           Ethereum   3.90%   $55.0M     MEDIUM
  6  crvUSD  Curve           Ethereum   3.70%   $120.0M    MEDIUM
================================================================
```

---

## Notes

1. DefiLlama yield data updates hourly — cache results for at least 30 minutes
2. The `/pools` endpoint returns ~14,000 pools in a single call (~2-4 MB). Parse and filter locally.
3. `apy`, `apyBase`, `apyReward` are numbers (not strings) — no type casting needed
4. Some pools have `apyBase` or `apyReward` as null — treat null as 0 for display
5. `exposure: "single"` means single-token deposit (lending/staking); `"multi"` means LP pair
6. LP pools carry impermanent loss risk — flag this for users when `il7d` is significant (> 1%)
7. APY > 50% with a non-audited protocol should always be flagged as HIGH risk
8. The `rewardTokens` field contains contract addresses, not symbols — resolve via Binance token search if needed
9. Pair output with Token Safety Scanner for protocol-level risk: https://github.com/Bob-QoQ/token-safety-scanner
10. Part of the four-skill workflow: Smart Money Tracker → Token Safety Scanner → Cross-Chain DEX Price Scanner → DeFi Yield Scanner
