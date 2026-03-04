---
name: multi-chain-portfolio
description: >
  Track any wallet's token holdings across multiple blockchains simultaneously using
  Binance Web3 address API. Supports BSC, Ethereum, Solana, Base, Arbitrum, Polygon,
  and more. Aggregates positions, calculates cross-chain portfolio value, and enables
  whale wallet intelligence across the entire multi-chain ecosystem.
metadata:
  category: wallet-analytics
  tags:
    - wallet
    - portfolio
    - multi-chain
    - address
    - positions
    - whale-tracking
  version: "1.0.0"
  author: mefai-dev
  api_type: public
  authentication: none
---

# Multi-Chain Address Portfolio

Track any wallet address across multiple blockchains simultaneously — aggregate holdings, calculate cross-chain portfolio value, and monitor whale movements across the entire multi-chain ecosystem.

## Why This Matters

The existing `query-address-info` skill queries one chain at a time. In reality, active wallets operate across multiple chains. This skill documents the multi-chain query pattern: how to scan a single address across BSC, Ethereum, Solana, Base, and more in parallel, then aggregate the results into a unified portfolio view.

---

## API Endpoint

### Query Wallet Token Balance

```
GET https://web3.binance.com/bapi/defi/v3/public/wallet-direct/buw/wallet/address/pnl/active-position-list
```

**Required Headers:**

| Header | Value | Description |
|--------|-------|-------------|
| `clienttype` | `web` | Required — API returns error without this |
| `clientversion` | `1.2.0` | Required — minimum version identifier |
| `Accept-Encoding` | `identity` | Recommended — prevents compressed responses |

> **Important:** These headers are mandatory. Without `clienttype: web` and `clientversion: 1.2.0`, the API returns `"illegal parameter"` (code 000002).

**Query Parameters:**

| Parameter | Required | Default | Description |
|-----------|----------|---------|-------------|
| `address` | Yes | — | Wallet address (EVM hex or Solana base58) |
| `chainId` | Yes | — | Chain identifier (see table below) |
| `offset` | No | `0` | Pagination offset for large portfolios |

**Supported Chains:**

| Chain ID | Network | Address Format |
|----------|---------|---------------|
| `56` | BNB Smart Chain | `0x...` (EVM) |
| `1` | Ethereum | `0x...` (EVM) |
| `CT_501` | Solana | Base58 |
| `8453` | Base | `0x...` (EVM) |
| `42161` | Arbitrum | `0x...` (EVM) |
| `137` | Polygon | `0x...` (EVM) |
| `10` | Optimism | `0x...` (EVM) |
| `43114` | Avalanche | `0x...` (EVM) |

**Response Structure:**

```json
{
  "code": "000000",
  "data": {
    "offset": 0,
    "addressStatus": null,
    "list": [
      {
        "chainId": "56",
        "address": "0x...",
        "contractAddress": "0x...",
        "binanceTokenId": "...",
        "name": "Token Name",
        "symbol": "TOKEN",
        "icon": "/images/web3-data/public/token/logos/...",
        "decimals": 18,
        "price": "1.23",
        "percentChange24h": "5.67",
        "remainQty": "1000.0"
      }
    ]
  },
  "success": true
}
```

**Response Fields (per position):**

| Field | Type | Description |
|-------|------|-------------|
| `chainId` | string | Chain the position is on |
| `address` | string | Wallet address |
| `contractAddress` | string | Token contract address |
| `binanceTokenId` | string | Binance internal token identifier |
| `name` | string | Token full name |
| `symbol` | string | Token ticker symbol |
| `icon` | string | Token logo path (prepend `https://bin.bnbstatic.com`) |
| `decimals` | number | Token decimal places |
| `price` | string | Current USD price |
| `percentChange24h` | string | 24-hour price change percentage |
| `remainQty` | string | Quantity of tokens held |

**Example — Single Chain:**

```bash
curl -H "clienttype: web" -H "clientversion: 1.2.0" \
  "https://web3.binance.com/bapi/defi/v3/public/wallet-direct/buw/wallet/address/pnl/active-position-list?address=0x5c1811401a539967a5f5ac55d1acd911349107e0&chainId=56&offset=0"
```

**Rate Limit:** ~30 requests/minute

---

## Multi-Chain Query Pattern

### Parallel Multi-Chain Scan

Query the same address across all supported chains simultaneously:

```bash
ADDRESS="0x5c1811401a539967a5f5ac55d1acd911349107e0"
BASE_URL="https://web3.binance.com/bapi/defi/v3/public/wallet-direct/buw/wallet/address/pnl/active-position-list"
HEADERS='-H "clienttype: web" -H "clientversion: 1.2.0"'

# Scan all EVM chains in parallel
for CHAIN in 56 1 8453 42161 137 10; do
  curl -s $HEADERS "$BASE_URL?address=$ADDRESS&chainId=$CHAIN&offset=0" &
done
wait

# Note: Solana uses a different address format (base58)
# Only query Solana if you have a Solana address
```

### Pagination for Large Portfolios

Some whale wallets hold 100+ tokens. Use offset-based pagination:

```bash
# Page 1 (first batch)
curl -s -H "clienttype: web" -H "clientversion: 1.2.0" \
  "$BASE_URL?address=$ADDRESS&chainId=56&offset=0"

# Page 2 (next batch)
curl -s -H "clienttype: web" -H "clientversion: 1.2.0" \
  "$BASE_URL?address=$ADDRESS&chainId=56&offset=20"

# Continue until response list is empty
```

---

## Analytical Recipes

### Recipe 1: Cross-Chain Portfolio Aggregation

Build a unified portfolio view across all chains:

```
For each chain in [56, 1, 8453, 42161, 137, 10]:
  1. Fetch positions: GET /active-position-list?address=ADDR&chainId=CHAIN
  2. For each position:
     - value_usd = float(price) × float(remainQty)
     - Store: {chain, symbol, qty, price, value_usd, change24h}

Aggregate:
  - total_portfolio_value = sum(value_usd for all positions across all chains)
  - chain_allocation = {chain: sum(values) / total for each chain}
  - top_holdings = sort by value_usd descending, take top 10
```

**Output Table:**

| Chain | Token | Qty | Price | Value | 24h% | % of Portfolio |
|-------|-------|-----|-------|-------|------|---------------|
| BSC | BNB | 100 | $650 | $65,000 | +2.1% | 45% |
| ETH | ETH | 10 | $3,800 | $38,000 | +1.5% | 26% |
| SOL | SOL | 200 | $140 | $28,000 | +3.2% | 19% |
| Base | DEGEN | 50K | $0.02 | $1,000 | -5% | 1% |
| ... | ... | ... | ... | ... | ... | ... |

### Recipe 2: Whale Portfolio Replication

Track a whale's portfolio changes over time:

```
1. Discovery: Use Binance Leaderboard API to find top-PnL wallets
   GET /market/leaderboard/query?chainId=56&period=7d&pageSize=10

2. Portfolio Snapshot: For each whale, fetch multi-chain positions
   - Record: {wallet, timestamp, positions[]}

3. Delta Detection: Compare snapshots hourly
   - New positions = tokens in current but not previous
   - Closed positions = tokens in previous but not current
   - Increased = qty increased (whale is accumulating)
   - Decreased = qty decreased (whale is distributing)

4. Signal: When 3+ whales add the same token → high conviction signal
```

### Recipe 3: Chain Diversity Score

Assess how diversified a wallet is across chains:

```
chain_count = number of chains with positions
position_count = total positions across all chains
top_chain_concentration = max_chain_value / total_value

Diversity Score:
  - chain_count × 10 (max 60)
  - (1 - top_chain_concentration) × 40

Interpretation:
  Score > 70: Highly diversified multi-chain operator
  Score 40-70: Moderate chain diversity
  Score < 40: Single-chain focused
```

### Recipe 4: Portfolio Health Monitor

Combine positions with security scanning for portfolio-level risk:

```
For each position in portfolio:
  1. Get token security: GoPlus API
     GET /api/v1/token_security/{chainId}?contract_addresses={address}

  2. Compute position risk:
     - safety_score from GoPlus
     - position_weight = position_value / total_portfolio
     - weighted_risk = (100 - safety_score) × position_weight

  3. Portfolio Risk Score:
     total_risk = sum(weighted_risk for all positions)

     < 10: LOW RISK portfolio
     10-30: MODERATE RISK
     > 30: HIGH RISK — risky tokens represent significant portfolio weight
```

---

## Cross-Referencing with Other Skills

| Skill | Cross-Reference |
|-------|----------------|
| **Leaderboard** | Find whale addresses to track → feed into multi-chain portfolio |
| **Trading Signals** | Match SM signal tokens with whale portfolio positions |
| **Token Audit** | Audit each portfolio position for security risks |
| **GoPlus Security** | Independent security verification per position |
| **DexScreener** | Get DEX pair data for portfolio tokens |
| **Token Info** | Enrich positions with metadata (logo, links, social) |

---

## Important Notes

- **Headers are mandatory** — `clienttype: web` and `clientversion: 1.2.0` must be included or the API returns error code `000002`
- EVM addresses work across BSC, Ethereum, Base, Arbitrum, Polygon, Optimism, and Avalanche
- Solana addresses use base58 format and chain ID `CT_501`
- Pagination is offset-based — increment by batch size until empty response
- Price data is in USD and updates in near real-time
- `icon` paths should be prefixed with `https://bin.bnbstatic.com` for full URLs
- Rate limiting applies — implement caching (recommended: 60-second TTL per address/chain)
- Some addresses may have 0 positions on certain chains — this is expected
- The API returns positions with non-zero `remainQty` only (no historical/closed positions)
