---
name: liquidity-lifecycle
description: |
  Track the complete liquidity lifecycle of any token — from LP creation to lock status,
  holder concentration, DEX distribution, and rug probability estimation.
  Combines GoPlus Security API (LP holders, lock status, DEX pairs) with DexScreener
  (real-time liquidity, volume, pair data) to build a comprehensive liquidity health profile.
metadata:
  author: mefai-dev
  version: "1.0"
---

# Liquidity Lifecycle Tracker

## Overview

| Source | Data | Free |
|--------|------|------|
| GoPlus Security API | LP holders, lock status, DEX list, holder concentration | Yes |
| DexScreener API | Real-time liquidity, volume, pair age, transactions | Yes |

## Use Cases

1. **Rug Pull Detection** — Check if LP is locked, who holds the most LP tokens, and whether large LP withdrawals have occurred
2. **Liquidity Health Score** — Combine lock status, holder distribution, and DEX depth into a single 0-100 score
3. **LP Holder Tracking** — Monitor top LP holders: are they contracts (lock/farm) or EOAs (potential dumpers)?
4. **Multi-DEX Distribution** — See all DEX pairs, their liquidity depth, and which DEX dominates
5. **New Token Due Diligence** — Before buying, check liquidity age, lock status, and concentration

## Supported Chains

| Chain | GoPlus chainId | DexScreener chainId |
|-------|---------------|---------------------|
| BSC | `56` | `bsc` |
| Ethereum | `1` | `ethereum` |
| Solana | `solana` | `solana` |
| Base | `8453` | `base` |
| Arbitrum | `42161` | `arbitrum` |
| Polygon | `137` | `polygon` |
| Avalanche | `43114` | `avalanche` |

---

## API 1: GoPlus Token Security — LP Data

Returns LP holder list, lock status, DEX pairs, and holder concentration for any token.

### Request

```
GET https://api.gopluslabs.io/api/v1/token_security/{chainId}?contract_addresses={address}
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `chainId` | string | Yes | Chain ID (e.g., `56` for BSC) |
| `contract_addresses` | string | Yes | Token contract address |

### Example Request

```bash
curl "https://api.gopluslabs.io/api/v1/token_security/56?contract_addresses=0x0e09fabb73bd3ade0a17ecc321fd13a19e81ce82"
```

### Response — LP-Related Fields

```json
{
  "code": 1,
  "message": "OK",
  "result": {
    "0x0e09...": {
      "lp_holder_count": "50322",
      "lp_total_supply": "209476.69027798463699495",
      "is_in_dex": "1",
      "lp_holders": [
        {
          "address": "0xa5f8c5dbd5f286960b9d90548680ae5ebff07652",
          "is_contract": 1,
          "balance": "110192.99",
          "percent": "0.526012",
          "is_locked": 0,
          "tag": ""
        }
      ],
      "dex": [
        {
          "name": "PancakeV2",
          "liquidity_type": "UniV2",
          "liquidity": "7351206.82",
          "pair": "0x0ed7e52944161450477ee417de9cd3a859b14fd0"
        }
      ],
      "holder_count": "1896226",
      "holders": [
        {
          "address": "0x000...dead",
          "is_contract": 0,
          "balance": "3325273714",
          "percent": "0.904899",
          "is_locked": 1
        }
      ]
    }
  }
}
```

### LP Holder Fields

| Field | Type | Description |
|-------|------|-------------|
| `address` | string | LP holder wallet/contract address |
| `is_contract` | int | `1` = contract (farm/lock/router), `0` = EOA (wallet) |
| `balance` | string | LP token balance held |
| `percent` | string | Fraction of total LP supply (0-1) |
| `is_locked` | int | `1` = tokens locked in lock contract, `0` = unlocked |
| `tag` | string | Label if known (e.g., "PancakeSwap") |

### DEX Pair Fields

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | DEX name (PancakeV2, UniswapV3, etc.) |
| `liquidity_type` | string | AMM type: `UniV2`, `UniV3`, `UniV4` |
| `liquidity` | string | USD liquidity value |
| `pair` | string | Pair contract address |

### Other Useful Fields

| Field | Type | Description |
|-------|------|-------------|
| `lp_holder_count` | string | Total number of LP holders |
| `lp_total_supply` | string | Total LP token supply |
| `is_in_dex` | string | `"1"` = listed on DEX |
| `holder_count` | string | Total token holders |
| `is_proxy` | string | `"1"` = upgradeable proxy contract |
| `owner_address` | string | Contract owner |
| `is_honeypot` | string | `"1"` = honeypot detected |
| `buy_tax` | string | Buy tax (0-1 scale) |
| `sell_tax` | string | Sell tax (0-1 scale) |

---

## API 2: DexScreener Token — Real-Time Liquidity

Returns all trading pairs for a token with real-time liquidity, volume, and transaction data.

### Request

```
GET https://api.dexscreener.com/tokens/v1/{chainId}/{address}
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `chainId` | string | Yes | Chain slug (`bsc`, `ethereum`, `solana`) |
| `address` | string | Yes | Token contract address |

### Example Request

```bash
curl "https://api.dexscreener.com/tokens/v1/bsc/0x0e09fabb73bd3ade0a17ecc321fd13a19e81ce82"
```

### Response Fields (per pair)

| Field | Type | Description |
|-------|------|-------------|
| `pairAddress` | string | DEX pair contract address |
| `baseToken.symbol` | string | Token symbol |
| `baseToken.name` | string | Token name |
| `priceUsd` | string | Current price in USD |
| `liquidity.usd` | number | Total liquidity in USD |
| `liquidity.base` | number | Base token liquidity |
| `liquidity.quote` | number | Quote token liquidity |
| `volume.h24` | number | 24h volume |
| `volume.h1` | number | 1h volume |
| `txns.h24.buys` | number | 24h buy transactions |
| `txns.h24.sells` | number | 24h sell transactions |
| `priceChange.h24` | number | 24h price change % |
| `pairCreatedAt` | number | Pair creation timestamp (ms) |
| `fdv` | number | Fully diluted valuation |
| `marketCap` | number | Market cap |

---

## Liquidity Health Score Algorithm

Combine GoPlus + DexScreener data into a 0-100 score:

| Factor | Points | Condition |
|--------|--------|-----------|
| LP Locked | 0-30 | `sum(locked_lp_percent)` × 30 |
| LP Concentration | 0-20 | Top holder < 50% = 20, < 80% = 10, else 0 |
| Liquidity Depth | 0-20 | > $100K = 20, > $10K = 10, > $1K = 5, else 0 |
| Pair Age | 0-15 | > 30d = 15, > 7d = 10, > 1d = 5, else 0 |
| Holder Count | 0-15 | > 1000 = 15, > 100 = 10, > 10 = 5, else 0 |

**Score tiers:**
- 80-100: **SAFE** (green) — locked LP, distributed holders, deep liquidity
- 50-79: **CAUTION** (yellow) — partial lock or moderate concentration
- 0-49: **DANGER** (red) — unlocked LP, high concentration, shallow liquidity

---

## Recipes

### Recipe 1: Quick Liquidity Check

```
Check if {token_address} on {chain} has locked liquidity:
1. Call GoPlus API with the token address
2. Sum is_locked LP holder percentages
3. If total locked > 80% → "LP is well locked"
4. If total locked < 20% → "WARNING: Most LP is unlocked"
5. Show top 5 LP holders with lock status
```

### Recipe 2: Full Liquidity Report

```
Generate a complete liquidity report for {token_address}:
1. Fetch GoPlus data (LP holders, DEX list, holder info)
2. Fetch DexScreener data (real-time liquidity, volume, pair age)
3. Calculate Liquidity Health Score
4. Show: Score, Lock %, Top LP Holders, DEX Distribution, Pair Age, Volume/Liquidity ratio
5. Flag any red flags (unlocked LP > 50%, single holder > 80%, no lock contract)
```

### Recipe 3: Rug Risk Assessment

```
Assess rug pull risk for {token_address}:
1. Check LP lock status (GoPlus lp_holders.is_locked)
2. Check if owner can modify (owner_change_balance, can_take_back_ownership)
3. Check honeypot status (is_honeypot)
4. Check tax levels (buy_tax, sell_tax > 10% = warning)
5. Check holder concentration (top holder > 50% = warning)
6. Calculate composite rug risk score
```

---

## Notes

- GoPlus API is free, no authentication required, rate limit ~30 req/min
- DexScreener API is free, no authentication, rate limit 300 req/min
- All GoPlus numeric fields are strings — convert with `parseFloat()`
- `is_locked` in GoPlus only indicates if the LP tokens are held by a known lock contract
- For detailed lock expiry times, cross-reference with lock platforms (Team.Finance, Unicrypt)
- The `dex` array can contain 50+ pairs for popular tokens — aggregate by DEX name for overview
