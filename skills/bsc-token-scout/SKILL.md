---
name: bsc-token-scout
description: |
  Discover, filter, and evaluate newly launched tokens on BNB Smart Chain.
  Fetches recent token launches via DexScreener and PancakeSwap subgraph,
  performs on-chain security analysis via GoPlus Security API, inspects holder
  distribution and contract source via BscScan, and produces a structured risk
  score with a plain-language summary. Use this skill when users want to find
  new tokens, audit token safety, screen for honeypots, or evaluate on-chain
  risk before taking any position.
metadata:
  author: DanielBrooksK
  version: "1.0"
---

# BSC Token Scout

Discover and evaluate newly launched tokens on BNB Smart Chain using on-chain
data from BscScan, GoPlus Security API, PancakeSwap subgraph, and DexScreener.
Produces a scored risk report so the agent (or user) can make an informed
decision.

---

## Overview

| Capability | Data Source |
|---|---|
| New token discovery | DexScreener Pairs API |
| Liquidity & volume | DexScreener + PancakeSwap V2/V3 Subgraph |
| Security / honeypot analysis | GoPlus Security API |
| Holder distribution | BscScan Token Holder API |
| Contract source & verification | BscScan Contract API |
| Transfer tax & owner privileges | GoPlus Security API |

---

## Use Cases

- "Find new tokens launched on BSC in the last 2 hours"
- "Audit contract 0xABC... on BSC"
- "Is this token a honeypot?"
- "Show me the top holders and liquidity for token 0xDEF..."
- "Give me a risk score for this contract before I ape in"

---

## Required API Keys

| Service | Key Variable | Where to Get |
|---|---|---|
| BscScan | `BSCSCAN_API_KEY` | https://bscscan.com/myapikey |
| GoPlus | None (public, rate-limited) | https://docs.gopluslabs.io |
| DexScreener | None (public) | https://docs.dexscreener.com |
| The Graph (PancakeSwap) | `GRAPH_API_KEY` (optional) | https://thegraph.com/studio |

Store keys in the agent's credential store. Never log or expose them in output.

---

## Step-by-Step Agent Instructions

### Step 1 — Discover Recently Launched Tokens

Call DexScreener's search endpoint to find new BNB Chain pairs sorted by
creation time.

**Endpoint:**
```
GET https://api.dexscreener.com/latest/dex/search?q=<QUERY>&chainIds=bsc
```

**For broad new-token discovery (no keyword), use the pairs endpoint:**
```
GET https://api.dexscreener.com/latest/dex/pairs/bsc/<PAIR_ADDRESS>
```

**To list the newest pairs on BSC:**
```
GET https://api.dexscreener.com/token-profiles/latest/v1
```

**Example Request:**
```bash
curl -s "https://api.dexscreener.com/latest/dex/search?q=new&chainIds=bsc" \
  | jq '.pairs[] | select(.chainId == "bsc") | {pairAddress, baseToken, priceUsd, liquidity, pairCreatedAt}'
```

**Filter criteria (apply client-side):**
- `pairCreatedAt` within last N hours (convert epoch ms)
- `liquidity.usd` ≥ 5000 (skip micro-liquidity)
- `volume.h24` ≥ 1000

**Response fields to extract:**

| Field | Description |
|---|---|
| `baseToken.address` | Contract address of the new token |
| `baseToken.symbol` | Ticker |
| `baseToken.name` | Full name |
| `priceUsd` | Current price in USD |
| `liquidity.usd` | Total liquidity in USD |
| `volume.h24` | 24-hour volume in USD |
| `priceChange.h1` | 1-hour price change % |
| `priceChange.h24` | 24-hour price change % |
| `pairCreatedAt` | Pair creation timestamp (epoch ms) |
| `url` | DexScreener link |

---

### Step 2 — Fetch Liquidity Depth from PancakeSwap Subgraph

Use The Graph to query PancakeSwap V2 for pool reserves and LP token supply.
This confirms real on-chain liquidity independent of DexScreener.

**Endpoint (PancakeSwap V2 subgraph):**
```
POST https://gateway.thegraph.com/api/<GRAPH_API_KEY>/subgraphs/id/HNdY4DG13CsCzBoBUy2fqLcmKnfhFEwEMBBJBE8VEU1T
```

If you do not have a Graph API key, use the free hosted endpoint:
```
POST https://api.thegraph.com/subgraphs/name/pancakeswap/exchange-v2
```

**GraphQL Query:**
```graphql
{
  pair(id: "<PAIR_ADDRESS_LOWERCASE>") {
    id
    token0 { id symbol }
    token1 { id symbol }
    reserve0
    reserve1
    reserveUSD
    token0Price
    token1Price
    totalSupply
    txCount
    createdAtTimestamp
  }
}
```

**Example Request:**
```bash
curl -s -X POST \
  -H "Content-Type: application/json" \
  -d '{"query":"{pair(id:\"<PAIR_ADDRESS>\"){reserve0 reserve1 reserveUSD txCount createdAtTimestamp}}"}' \
  "https://api.thegraph.com/subgraphs/name/pancakeswap/exchange-v2"
```

**Key fields to evaluate:**

| Field | Risk Signal |
|---|---|
| `reserveUSD` | < $5,000 → very high risk |
| `txCount` | < 20 → minimal activity |
| `createdAtTimestamp` | Very recent (< 1 hour) → extra caution |
| `totalSupply` | Compare with holder distribution |

---

### Step 3 — Run GoPlus Security Analysis

GoPlus is the primary source for honeypot detection, transfer tax, blacklist
functions, and ownership risk.

**Endpoint:**
```
GET https://api.gopluslabs.io/api/v1/token_security/56?contract_addresses=<ADDRESS>
```

Chain ID for BNB Smart Chain is `56`.

**Example Request:**
```bash
curl -s "https://api.gopluslabs.io/api/v1/token_security/56?contract_addresses=0xTOKEN_ADDRESS"
```

**Example Response (abbreviated):**
```json
{
  "code": 1,
  "message": "OK",
  "result": {
    "0xtokenaddress": {
      "is_honeypot": "0",
      "honeypot_with_same_creator": "0",
      "buy_tax": "0",
      "sell_tax": "0.05",
      "is_mintable": "0",
      "owner_address": "0x000...dead",
      "is_open_source": "1",
      "is_proxy": "0",
      "is_blacklisted": "0",
      "can_take_back_ownership": "0",
      "owner_change_balance": "0",
      "hidden_owner": "0",
      "self_destruct": "0",
      "external_call": "0",
      "gas_abuse": "0",
      "is_anti_whale": "0",
      "anti_whale_modifiable": "0",
      "slippage_modifiable": "0",
      "is_whitelisted": "0",
      "is_true_token": "1",
      "is_airdrop_scam": "0",
      "trust_list": "0",
      "other_potential_risks": "",
      "note": "",
      "holder_count": "1523",
      "lp_holder_count": "12",
      "lp_total_supply": "0.001523",
      "creator_address": "0xcreator...",
      "creator_balance": "0",
      "creator_percent": "0",
      "owner_balance": "0",
      "owner_percent": "0",
      "total_supply": "1000000000",
      "dex": [
        {
          "name": "PancakeV2",
          "liquidity": "15234.50",
          "pair": "0xpair..."
        }
      ],
      "holders": [
        { "address": "0x...", "balance": "150000000", "percent": "0.15", "is_contract": "0", "is_locked": "0" }
      ],
      "lp_holders": [
        { "address": "0x...", "balance": "0.000762", "percent": "0.50", "is_locked": "1", "tag": "Unicrypt" }
      ]
    }
  }
}
```

**GoPlus Fields to Evaluate:**

| Field | Value | Risk Level |
|---|---|---|
| `is_honeypot` | "1" | CRITICAL — do not proceed |
| `sell_tax` | > "0.10" (10%) | HIGH |
| `buy_tax` | > "0.10" (10%) | HIGH |
| `is_mintable` | "1" | HIGH |
| `hidden_owner` | "1" | CRITICAL |
| `can_take_back_ownership` | "1" | CRITICAL |
| `owner_change_balance` | "1" | CRITICAL |
| `slippage_modifiable` | "1" | HIGH |
| `self_destruct` | "1" | CRITICAL |
| `is_open_source` | "0" | HIGH |
| `is_proxy` | "1" | MEDIUM — inspect implementation |
| `is_blacklisted` | "1" | HIGH |
| `creator_percent` | > "0.05" (5%) | MEDIUM |
| `lp_holders[].is_locked` | "0" for all | HIGH — no LP lock |

---

### Step 4 — Inspect Holder Distribution via BscScan

Check top-holder concentration to detect whale/team wallet risk.

**Endpoint:**
```
GET https://api.bscscan.com/api
  ?module=token
  &action=tokenholderlist
  &contractaddress=<ADDRESS>
  &page=1
  &offset=20
  &apikey=<BSCSCAN_API_KEY>
```

**Example Request:**
```bash
curl -s "https://api.bscscan.com/api?module=token&action=tokenholderlist\
&contractaddress=0xTOKEN&page=1&offset=20&apikey=$BSCSCAN_API_KEY"
```

**Compute from response:**
- Sum `TokenHolderQuantity` for top 10 holders
- Divide by `totalSupply` (fetch separately if needed)
- If top-10 hold > 50% → concentration risk

**Get total supply:**
```
GET https://api.bscscan.com/api
  ?module=stats
  &action=tokensupply
  &contractaddress=<ADDRESS>
  &apikey=<BSCSCAN_API_KEY>
```

---

### Step 5 — Verify Contract Source on BscScan

Check whether the contract is verified and inspect for known red-flag patterns.

**Check verification status:**
```
GET https://api.bscscan.com/api
  ?module=contract
  &action=getsourcecode
  &address=<ADDRESS>
  &apikey=<BSCSCAN_API_KEY>
```

**Fields to check:**

| Field | Safe Value | Risk Signal |
|---|---|---|
| `ABI` | Not empty | `"Contract source code not verified"` → HIGH |
| `SourceCode` | Non-empty | Empty → unverified contract |
| `Proxy` | `"0"` | `"1"` → check implementation |
| `Implementation` | — | Fetch and verify implementation too |

**Scan SourceCode string for red-flag keywords (case-insensitive):**
- `selfdestruct` → CRITICAL
- `delegatecall` to unknown address → HIGH
- `mint(` with no access control → HIGH
- `setFee(` or `setTax(` with no limit → HIGH
- `blacklist(` or `addToBlacklist(` → MEDIUM

---

### Step 6 — Compute Risk Score and Generate Summary

After collecting all data, compute a weighted score (0 = safest, 100 = most
risky) and produce a structured output.

**Scoring Rules:**

| Condition | Points Added |
|---|---|
| `is_honeypot` = "1" | +50 |
| `hidden_owner` = "1" | +20 |
| `can_take_back_ownership` = "1" | +20 |
| `owner_change_balance` = "1" | +20 |
| `self_destruct` = "1" | +20 |
| `sell_tax` > 10% | +15 |
| `buy_tax` > 10% | +15 |
| `is_mintable` = "1" | +15 |
| `slippage_modifiable` = "1" | +15 |
| `is_open_source` = "0" | +15 |
| No LP lock detected | +15 |
| Top-10 holders > 50% supply | +10 |
| `liquidity.usd` < $5,000 | +10 |
| Contract age < 1 hour | +5 |
| `is_proxy` = "1" | +5 |

Cap total at 100. Classify:

| Score Range | Rating |
|---|---|
| 0–20 | Low Risk |
| 21–40 | Moderate Risk |
| 41–60 | High Risk |
| 61–80 | Very High Risk |
| 81–100 | Extreme Risk |

---

## Red Flags Checklist

Before presenting output, verify all of the following. Any CRITICAL item should
halt the workflow and warn the user immediately.

- [ ] **CRITICAL** — `is_honeypot` = "1" (cannot sell)
- [ ] **CRITICAL** — `hidden_owner` = "1" (owner can act without visibility)
- [ ] **CRITICAL** — `can_take_back_ownership` = "1"
- [ ] **CRITICAL** — `owner_change_balance` = "1" (owner can alter balances)
- [ ] **CRITICAL** — `self_destruct` in source code
- [ ] **HIGH** — Contract source not verified on BscScan
- [ ] **HIGH** — `sell_tax` > 10%
- [ ] **HIGH** — `is_mintable` = "1" with active owner
- [ ] **HIGH** — `slippage_modifiable` = "1"
- [ ] **HIGH** — No LP lock (all lp_holders have `is_locked` = "0")
- [ ] **HIGH** — `is_blacklisted` functionality present
- [ ] **HIGH** — `honeypot_with_same_creator` = "1"
- [ ] **MEDIUM** — Creator still holds > 5% of supply
- [ ] **MEDIUM** — Top-10 wallets hold > 50% of supply
- [ ] **MEDIUM** — `is_proxy` = "1" (check implementation contract too)
- [ ] **MEDIUM** — Liquidity < $5,000 USD
- [ ] **LOW** — Contract age < 1 hour
- [ ] **LOW** — `txCount` < 20 on PancakeSwap pair

---

## Output Template

Produce the following structured summary after completing all steps:

```
=== BSC Token Scout Report ===

Token:       <NAME> (<SYMBOL>)
Address:     <CONTRACT_ADDRESS>
Chain:       BNB Smart Chain (56)
Pair:        <PAIR_ADDRESS>
Launched:    <TIME_AGO> ago (<ISO_TIMESTAMP>)

--- Market Data ---
Price:         $<PRICE_USD>
Liquidity:     $<LIQUIDITY_USD>
Volume (24h):  $<VOLUME_24H>
Price Δ 1h:    <PRICE_CHANGE_1H>%
Price Δ 24h:   <PRICE_CHANGE_24H>%
Holders:       <HOLDER_COUNT>
LP Locked:     <YES/NO> (<LOCK_DETAILS>)

--- Security Analysis (GoPlus) ---
Honeypot:              <YES/NO>
Buy Tax:               <BUY_TAX>%
Sell Tax:              <SELL_TAX>%
Mintable:              <YES/NO>
Open Source:           <YES/NO>
Hidden Owner:          <YES/NO>
Owner Can Rug:         <YES/NO>
Slippage Modifiable:   <YES/NO>

--- Holder Distribution ---
Top 1 holder:   <PCT>% (<ADDRESS_SHORT>)
Top 5 holders:  <PCT>% combined
Top 10 holders: <PCT>% combined
Creator holds:  <PCT>%

--- Contract Flags ---
Verified:       <YES/NO>
Proxy:          <YES/NO>
Red-flag keywords found: <LIST or NONE>

--- Risk Score ---
Score:   <SCORE>/100
Rating:  <LOW RISK / MODERATE / HIGH / VERY HIGH / EXTREME>

--- Active Red Flags ---
<List each triggered red flag with severity level, or "None detected">

--- DexScreener ---
<DEXSCREENER_URL>

--- Summary ---
<2-3 sentence plain-language summary of the token's risk profile,
 notable concerns, and a neutral recommendation on due diligence steps.
 Do NOT provide financial advice or buy/sell recommendations.>
```

---

## Example Prompts

```
Scout new tokens on BSC launched in the last 3 hours with liquidity above $10,000.
```

```
Run a full audit on BSC token 0x4fabb145d64652a948d72533023f6e7a623c7c5.
```

```
Is 0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c a honeypot on BSC?
```

```
Show me the holder distribution and LP lock status for BSC token 0xABC...
```

```
Find the top 5 newest BNB Chain tokens right now and score their on-chain risk.
```

---

## Worked Example — Live Audit

The following is a real output produced by running this skill against a token
on BNB Smart Chain. Creation tx:
`0xd86074f650a1552f337f3fac15a84619db95af4bf3166ade833adc839385e537`

### API Calls Executed

**GoPlus Security (Step 3):**
```bash
curl -s "https://api.gopluslabs.io/api/v1/token_security/56?contract_addresses=<CONTRACT_ADDRESS>"
```

**DexScreener (Step 1):**
```bash
curl -s "https://api.dexscreener.com/latest/dex/tokens/<CONTRACT_ADDRESS>"
```

### Raw API Responses (Abbreviated)

**GoPlus:**
```json
{
  "code": 1,
  "message": "OK",
  "result": {
    "<CONTRACT_ADDRESS>": {
      "token_name": "ExampleToken",
      "token_symbol": "EXT",
      "total_supply": "1000000000",
      "holder_count": "2",
      "is_honeypot": "0",
      "is_open_source": "1",
      "is_mintable": "0",
      "is_proxy": "0",
      "hidden_owner": "0",
      "can_take_back_ownership": "0",
      "owner_change_balance": "0",
      "selfdestruct": "0",
      "transfer_pausable": "1",
      "external_call": "1",
      "slippage_modifiable": "0",
      "buy_tax": "",
      "sell_tax": "",
      "is_in_dex": "0",
      "owner_address": "0x5c95...762b",
      "owner_percent": "0.966574",
      "owner_balance": "966574291.19",
      "holders": [
        {
          "address": "0x5c95...762b",
          "balance": "966574291.19",
          "percent": "0.966574",
          "is_contract": 1,
          "is_locked": 0
        },
        {
          "address": "0x98a8...da5f",
          "balance": "33425708.81",
          "percent": "0.033426",
          "is_contract": 0,
          "is_locked": 0
        }
      ]
    }
  }
}
```

**DexScreener:**
```json
{
  "pairs": [
    {
      "chainId": "bsc",
      "dexId": "fourmeme",
      "pairAddress": "<CONTRACT_ADDRESS>:4meme",
      "baseToken": {
        "address": "<CONTRACT_ADDRESS>",
        "name": "ExampleToken",
        "symbol": "EXT"
      },
      "quoteToken": { "symbol": "WBNB" },
      "priceUsd": "0.000003871",
      "volume": { "h24": 376.18 },
      "txns": { "h24": { "buys": 2, "sells": 1 } },
      "fdv": 3871.93,
      "pairCreatedAt": 1772524567000,
      "url": "https://dexscreener.com/bsc/<CONTRACT_ADDRESS>:4meme"
    }
  ]
}
```

### Scoring Calculation

| Condition | Triggered | Points |
|---|---|---|
| `is_honeypot` = "1" | No | +0 |
| `hidden_owner` = "1" | No | +0 |
| `can_take_back_ownership` = "1" | No | +0 |
| `owner_change_balance` = "1" | No | +0 |
| `self_destruct` = "1" | No | +0 |
| `sell_tax` > 10% | Unknown (empty) | +0* |
| `is_mintable` = "1" | No | +0 |
| `slippage_modifiable` = "1" | No | +0 |
| `transfer_pausable` = "1" | **Yes** | +15 |
| `is_open_source` = "0" | No | +0 |
| No LP lock detected | **Yes** (both holders unlocked) | +15 |
| Top-10 holders > 50% | **Yes** (owner alone = 96.66%) | +10 |
| `liquidity.usd` < $5,000 | **Yes** (FDV ≈ $3,872) | +10 |
| Contract age < 1 hour | Unknown (very recent) | +5 |
| `is_proxy` = "1" | No | +0 |
| **Total** | | **55 / 100** |

\* `buy_tax` and `sell_tax` returned empty — GoPlus could not simulate trades,
likely because `is_in_dex` = "0" (the 4meme pool is not indexed by GoPlus).
Treat unknown tax as a risk factor requiring manual verification.

### Final Report Output

```
=== BSC Token Scout Report ===

Token:       ExampleToken (EXT)
Address:     <CONTRACT_ADDRESS>
Chain:       BNB Smart Chain (56)
Pair:        <CONTRACT_ADDRESS>:4meme (4meme DEX)
Launched:    ~1 day ago (2026-03-01)

--- Market Data ---
Price:         $0.000003871
Liquidity:     < $5,000 (FDV ≈ $3,872)
Volume (24h):  $376.18
Transactions:  3 total (2 buys / 1 sell)
Holders:       2
LP Locked:     NO — no lock detected on any LP holder

--- Security Analysis (GoPlus) ---
Honeypot:              NO
Buy Tax:               UNKNOWN (DEX not indexed by GoPlus)
Sell Tax:              UNKNOWN (DEX not indexed by GoPlus)
Mintable:              NO
Open Source:           YES
Hidden Owner:          NO
Owner Can Rug:         NO (can_take_back_ownership = 0)
Transfer Pausable:     YES ← owner can freeze all transfers
External Call:         YES ← contract calls external addresses

--- Holder Distribution ---
Total holders:  2
Holder 1 (contract/owner): 96.66% — 0x5c95...762b
Holder 2 (wallet):           3.34% — 0x98a8...da5f
Top 1 holder:   96.66%
Top 2 holders:  100.00% combined
LP locked:      NO

--- Contract Flags ---
Verified:                YES (open source)
Proxy:                   NO
transfer_pausable:       YES — HIGH RISK
external_call:           YES — MEDIUM RISK
DEX indexed by GoPlus:   NO — tax values unverifiable

--- Risk Score ---
Score:   55 / 100
Rating:  HIGH RISK

--- Active Red Flags ---
[HIGH]   transfer_pausable = 1 — owner can pause all token transfers at will
[HIGH]   No LP lock — liquidity can be removed instantly
[HIGH]   Owner holds 96.66% of total supply — extreme concentration
[HIGH]   Buy/sell tax unverifiable — GoPlus cannot simulate trades on 4meme
[MEDIUM] external_call = 1 — contract interacts with external addresses
[MEDIUM] Only 2 holders and 3 transactions — no organic adoption
[LOW]    Liquidity < $5,000 — micro-cap, highly illiquid

--- DexScreener ---
https://dexscreener.com/bsc/<CONTRACT_ADDRESS>

--- Summary ---
This token presents a HIGH RISK profile. The most critical concern is extreme
ownership concentration: the owner (a contract address) holds 96.66% of total
supply with no LP lock in place, meaning liquidity can be removed at any time.
The transfer_pausable flag grants the owner the ability to freeze all transfers,
which could prevent selling. GoPlus could not simulate buy/sell taxes because
the token trades on 4meme, a DEX not yet indexed — actual tax rates are unknown.
This report is for informational purposes only and does not constitute financial
or investment advice.
```

---

## Notes

- All GoPlus percentage fields are decimal strings (e.g., `"0.05"` = 5%). Multiply by 100 before displaying.
- BscScan `TokenHolderQuantity` values may include commas — strip before parsing.
- DexScreener `pairCreatedAt` is in epoch milliseconds. Convert to seconds for standard datetime parsing.
- GoPlus `lp_holders` with `tag` values like `"Unicrypt"`, `"PinkSale"`, or `"Team Finance"` indicate a third-party LP lock — treat as locked.
- A contract can pass GoPlus honeypot check but still have dangerous owner functions. Always cross-reference `owner_change_balance` and `can_take_back_ownership`.
- If `is_proxy` = "1", fetch and audit the implementation contract address from `implementation` field separately via BscScan.
- Do not present this report as financial advice. Always include the disclaimer that on-chain analysis is informational only.
- Rate limits: GoPlus public API allows ~5 req/s. BscScan free tier allows 5 req/s. Add 250ms delay between sequential calls if processing multiple tokens.
