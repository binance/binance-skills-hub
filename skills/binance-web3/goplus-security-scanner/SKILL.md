---
title: GoPlus Security Scanner
description: |
  Third-party token security verification using GoPlus Security API. Detects honeypots,
  rug-pull risks, malicious contracts, hidden owners, tax manipulation, and blacklist
  mechanisms. Cross-validates Binance's built-in audit with independent on-chain analysis
  across 40+ chains.
metadata:
  version: "1.0.0"
  author: mefai-dev
license: MIT
---

# GoPlus Security Scanner

Independent, third-party token security analysis using GoPlus Security API — the most comprehensive on-chain security scanner with coverage across 40+ blockchains.

## Why This Matters

Binance's built-in Token Audit skill provides one layer of security verification. GoPlus provides a completely independent second opinion with deeper contract analysis. When both agree a token is safe, confidence is high. When they disagree, that's a critical warning signal.

**Key difference from Token Audit:** GoPlus provides granular contract-level analysis (hidden ownership, self-destruct capability, proxy contracts, tax modification functions) that goes beyond basic audit checks.

---

## API Endpoints

### 1. Token Security Detection

The primary endpoint — comprehensive contract security analysis.

```
GET https://api.gopluslabs.io/api/v1/token_security/{chainId}
```

**Parameters:**

| Parameter | Required | Description |
|-----------|----------|-------------|
| `chainId` | Yes (path) | Chain ID: `56` (BSC), `1` (ETH), `solana`, `8453` (Base), etc. |
| `contract_addresses` | Yes (query) | Comma-separated contract addresses (max 100) |

**Response Fields — Contract Analysis:**

| Field | Type | Values | Description |
|-------|------|--------|-------------|
| `is_open_source` | string | `0`/`1` | Contract source code verified |
| `is_proxy` | string | `0`/`1` | Uses proxy pattern (upgradeable) |
| `is_mintable` | string | `0`/`1` | New tokens can be minted |
| `can_take_back_ownership` | string | `0`/`1` | Owner can reclaim ownership after renouncing |
| `owner_change_balance` | string | `0`/`1` | Owner can modify balances |
| `hidden_owner` | string | `0`/`1` | Hidden ownership mechanism detected |
| `selfdestruct` | string | `0`/`1` | Contract has self-destruct function |
| `external_call` | string | `0`/`1` | Makes external contract calls |

**Response Fields — Trading Safety:**

| Field | Type | Values | Description |
|-------|------|--------|-------------|
| `is_honeypot` | string | `0`/`1` | Cannot sell after buying |
| `cannot_buy` | string | `0`/`1` | Buying is blocked |
| `cannot_sell_all` | string | `0`/`1` | Cannot sell full balance |
| `buy_tax` | string | `0`-`1` | Buy tax percentage (decimal) |
| `sell_tax` | string | `0`-`1` | Sell tax percentage (decimal) |
| `slippage_modifiable` | string | `0`/`1` | Tax/slippage can be changed |
| `personal_slippage_modifiable` | string | `0`/`1` | Per-address tax modification |
| `trading_cooldown` | string | `0`/`1` | Enforced cooldown between trades |
| `transfer_pausable` | string | `0`/`1` | Transfers can be paused |
| `transfer_tax` | string | `0`/`1` | Tax on transfers (not just trades) |
| `anti_whale_modifiable` | string | `0`/`1` | Anti-whale rules can be modified |

**Response Fields — Blacklist/Whitelist:**

| Field | Type | Values | Description |
|-------|------|--------|-------------|
| `is_blacklisted` | string | `0`/`1` | Has blacklist mechanism |
| `is_whitelisted` | string | `0`/`1` | Has whitelist mechanism |
| `is_anti_whale` | string | `0`/`1` | Has anti-whale max transaction limits |

**Response Fields — Market Data:**

| Field | Type | Description |
|-------|------|-------------|
| `token_name` | string | Token name |
| `token_symbol` | string | Token symbol |
| `total_supply` | string | Total token supply |
| `holder_count` | string | Number of token holders |
| `lp_holder_count` | string | Number of LP holders |
| `lp_total_supply` | string | Total LP token supply |
| `is_in_cex` | object | `{listed, cex_list}` — CEX listing status |
| `is_in_dex` | string | `0`/`1` — listed on any DEX |

**Response Fields — Ownership:**

| Field | Type | Description |
|-------|------|-------------|
| `owner_address` | string | Current contract owner address |
| `owner_balance` | string | Owner's token balance |
| `owner_percent` | string | Owner's percentage of supply |
| `creator_address` | string | Contract deployer address |
| `creator_balance` | string | Creator's token balance |
| `creator_percent` | string | Creator's percentage of supply |

**Response Fields — Honeypot History:**

| Field | Type | Description |
|-------|------|-------------|
| `honeypot_with_same_creator` | string | `0`/`1` — creator has deployed honeypots before |
| `trust_list` | string | `0`/`1` — on GoPlus trusted token list |

**Response Fields — Holder Distribution:**

| Field | Type | Description |
|-------|------|-------------|
| `holders` | array | Top 10 holders: `[{address, tag, is_contract, balance, percent, is_locked}]` |
| `lp_holders` | array | Top 10 LP holders: `[{address, tag, balance, percent, is_locked}]` |
| `dex` | array | DEX listings: `[{name, liquidity, pair, liquidity_type}]` |

**Example:**

```bash
# Check WBNB security on BSC
curl "https://api.gopluslabs.io/api/v1/token_security/56?contract_addresses=0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c"

# Check multiple tokens at once (batch)
curl "https://api.gopluslabs.io/api/v1/token_security/56?contract_addresses=0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c,0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56"

# Check on Ethereum
curl "https://api.gopluslabs.io/api/v1/token_security/1?contract_addresses=0xdAC17F958D2ee523a2206206994597C13D831ec7"

# Check on Solana
curl "https://api.gopluslabs.io/api/v1/token_security/solana?contract_addresses=So11111111111111111111111111111111111111112"
```

**Rate Limit:** 30 requests/minute (free tier)

---

### 2. Supported Chains

List all chains supported by GoPlus security detection.

```
GET https://api.gopluslabs.io/api/v1/supported_chains
```

**Response:** `{result: [{id, name}]}`

**Key Chains:**

| Chain ID | Name |
|----------|------|
| `1` | Ethereum |
| `56` | BSC |
| `137` | Polygon |
| `42161` | Arbitrum |
| `8453` | Base |
| `10` | Optimism |
| `43114` | Avalanche |
| `324` | zkSync Era |
| `59144` | Linea |
| `solana` | Solana |
| `tron` | Tron |

**Example:**

```bash
curl "https://api.gopluslabs.io/api/v1/supported_chains"
```

---

## Security Scoring Algorithm

### Risk Classification

Score tokens on a 0-100 safety scale based on GoPlus results:

```
safety_score = 100

# Critical risks (-30 each)
if is_honeypot == "1":         safety_score -= 30
if cannot_buy == "1":          safety_score -= 30
if cannot_sell_all == "1":     safety_score -= 30

# High risks (-20 each)
if hidden_owner == "1":        safety_score -= 20
if selfdestruct == "1":        safety_score -= 20
if can_take_back_ownership == "1": safety_score -= 20
if owner_change_balance == "1":    safety_score -= 20

# Medium risks (-10 each)
if slippage_modifiable == "1":     safety_score -= 10
if is_blacklisted == "1":         safety_score -= 10
if transfer_pausable == "1":      safety_score -= 10
if is_proxy == "1":               safety_score -= 10

# Low risks (-5 each)
if is_mintable == "1":            safety_score -= 5
if external_call == "1":         safety_score -= 5
if trading_cooldown == "1":      safety_score -= 5

# Tax penalties
if float(buy_tax) > 0.05:        safety_score -= 15   # >5% buy tax
if float(sell_tax) > 0.05:       safety_score -= 15   # >5% sell tax

# Positive signals (+5 each)
if is_open_source == "1":        safety_score += 5
if trust_list == "1":            safety_score += 5

safety_score = max(0, min(100, safety_score))
```

### Risk Levels

| Score | Level | Color | Action |
|-------|-------|-------|--------|
| 80-100 | SAFE | Green | Low risk — standard due diligence applies |
| 60-79 | CAUTION | Yellow | Some risks detected — review before trading |
| 40-59 | WARNING | Orange | Multiple risks — trade with extreme caution |
| 0-39 | DANGER | Red | High risk of rug-pull or honeypot — avoid |

---

## Analytical Recipes

### Recipe 1: Dual-Audit Cross-Validation

Cross-reference GoPlus with Binance's built-in Token Audit:

```bash
# Step 1: GoPlus check
curl -s "https://api.gopluslabs.io/api/v1/token_security/56?contract_addresses=CONTRACT_ADDRESS"

# Step 2: Binance Token Audit (via Skills Hub query-token-audit)
# Compare results — discrepancies are red flags

# Agreement Matrix:
# Both SAFE → High confidence safe
# GoPlus SAFE + Binance WARN → Investigate tax/audit differences
# GoPlus WARN + Binance SAFE → Check contract-level risks GoPlus found
# Both DANGER → Avoid — confirmed high risk
```

### Recipe 2: Creator Reputation Check

Assess the deployer's track record:

```bash
# Check token security — look at honeypot_with_same_creator field
curl -s "https://api.gopluslabs.io/api/v1/token_security/56?contract_addresses=CONTRACT_ADDRESS"

# If honeypot_with_same_creator == "1":
#   → Creator has deployed honeypots before
#   → IMMEDIATE RED FLAG regardless of other scores
#   → Check creator_address to see all their deployments
```

### Recipe 3: Holder Concentration Risk

Analyze token distribution for dump risk:

```bash
# From the response, examine:
# - holders[0].percent → if > 0.50 → extreme concentration risk
# - Sum of top 10 holders → if > 0.80 → high dump risk
# - creator_percent → if > 0.10 → insider risk
# - owner_percent → if > 0.05 → governance risk
# - lp_holders → check if LP is locked (is_locked: 1)
```

**Holder Risk Table:**

| Top 10 Concentration | LP Locked | Risk |
|----------------------|-----------|------|
| < 30% | Yes | LOW — distributed, LP secured |
| < 30% | No | MEDIUM — distributed but LP can be pulled |
| 30-60% | Yes | MEDIUM — concentrated but LP locked |
| 30-60% | No | HIGH — concentrated AND LP vulnerable |
| > 60% | Any | CRITICAL — whale can dump entire supply |

### Recipe 4: Batch Security Screening

Audit multiple tokens in one request for portfolio-level security:

```bash
# Audit up to 100 tokens in one call
ADDRESSES="0xaddr1,0xaddr2,0xaddr3,0xaddr4,0xaddr5"
curl -s "https://api.gopluslabs.io/api/v1/token_security/56?contract_addresses=$ADDRESSES"

# Parse results: any token with safety_score < 60 should be flagged
# Useful for: portfolio audits, watchlist screening, scanner integration
```

---

## Supported Chains (40+)

GoPlus supports security detection on 40+ chains including all major EVM chains, Solana, and Tron. Use the `/supported_chains` endpoint for the full current list.

**Most relevant for Binance ecosystem:**
- `56` — BNB Smart Chain (BSC)
- `204` — opBNB
- `1` — Ethereum
- `solana` — Solana
- `8453` — Base
- `42161` — Arbitrum

---

## Important Notes

- GoPlus is a **third-party** security service — independent from Binance
- All endpoints are **public** and require **no API key** (free tier: 30 req/min)
- Security analysis is **point-in-time** — contract upgrades or ownership changes can alter risk after scanning
- A clean GoPlus report does **not guarantee** safety — always combine with fundamental analysis
- `is_proxy == "1"` means the contract is upgradeable — the owner could change behavior at any time
- Batch requests (up to 100 addresses) are recommended for efficiency
- Response includes `dex` array showing DEX listings with liquidity amounts
- `is_in_cex.cex_list` shows which centralized exchanges list the token
