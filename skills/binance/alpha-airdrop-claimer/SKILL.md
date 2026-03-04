---
name: alpha-airdrop-claimer
description: Discover and track Binance Alpha airdrop tokens with eligibility requirements, claim lifecycle, and early-stage token intelligence from DexScreener data.
metadata:
  version: 1.0.0
  author: Community
license: MIT
---

# Alpha Airdrop Claimer

Discover tokens featured in the Binance Alpha program, track airdrop eligibility requirements, and monitor the claim lifecycle. Combines Binance Alpha program data with DexScreener token profiles for early-stage token intelligence.

## Quick Reference

| Endpoint | Description | Authentication |
|----------|-------------|----------------|
| `GET /bapi/alpha/v1/token/list` | Alpha token list | Web3 Wallet |
| `GET /token-profiles/latest/v1` | Latest token profiles | No |
| `GET /token-boosts/top/v1` | Top boosted tokens | No |

## API Details

### DexScreener Latest Profiles (Public)

Retrieve recently created token profiles for discovery and research.

**Method:** `GET`

**URL:** `https://api.dexscreener.com/token-profiles/latest/v1`

**Authentication:** None required

**Example Request:**

```bash
curl 'https://api.dexscreener.com/token-profiles/latest/v1'
```

**Response Fields:**

| Field | Type | Description |
|-------|------|-------------|
| [].url | string | Token profile URL |
| [].chainId | string | Chain identifier |
| [].tokenAddress | string | Contract address |
| [].name | string | Token name |
| [].symbol | string | Token symbol |
| [].description | string | Token description |
| [].icon | string | Token icon URL |

### DexScreener Top Boosts (Public)

Retrieve tokens with the most community boosts — indicates organic interest.

**Method:** `GET`

**URL:** `https://api.dexscreener.com/token-boosts/top/v1`

**Example Request:**

```bash
curl 'https://api.dexscreener.com/token-boosts/top/v1'
```

**Response Fields:**

| Field | Type | Description |
|-------|------|-------------|
| [].chainId | string | Chain identifier |
| [].tokenAddress | string | Contract address |
| [].amount | integer | Number of boosts |
| [].totalAmount | integer | Total boost amount |
| [].description | string | Token description |

### Binance Alpha Program

The Binance Alpha section highlights early-stage tokens being evaluated for listing. Access is through the Binance Web3 Wallet.

**Alpha Token Lifecycle:**

| Stage | Description |
|-------|-------------|
| 1. Discovery | Token appears in Alpha section |
| 2. Eligibility | Complete volume/holding requirements |
| 3. Qualification | Verify via Binance wallet |
| 4. Distribution | Airdrop during claim window |
| 5. Vesting | Some tokens have unlock schedules |

**Eligibility Criteria (Typical):**

| Requirement | Description |
|-------------|-------------|
| Trading Volume | Meet minimum trading volume in period |
| Token Holding | Hold specific tokens for qualifying period |
| Wallet Connection | Connect Binance Web3 Wallet |
| KYC Status | Complete identity verification |
| Region | Some airdrops are region-restricted |

### Claim Guide Steps

1. **Check Alpha Section** — Monitor Binance Alpha for eligible tokens
2. **Meet Requirements** — Complete trading volume or holding period
3. **Verify Eligibility** — Check status through Binance wallet
4. **Claim Window** — Claim during the distribution window
5. **Monitor Vesting** — Track vesting schedule for locked tokens

## Use Cases

1. **Token Discovery** — Find newly profiled tokens before mainstream attention
2. **Airdrop Tracking** — Monitor Alpha program for upcoming airdrops
3. **Eligibility Check** — Verify if you qualify for current airdrop campaigns
4. **Early Research** — Research boosted tokens with DexScreener data
5. **Portfolio Diversification** — Discover early-stage tokens across chains

## Notes

- DexScreener endpoints are **public** — no authentication required
- Binance Alpha API requires **Web3 Wallet** connection (not REST accessible)
- Token boosts on DexScreener indicate community interest, not guaranteed quality
- Always verify token contracts on-chain before interacting
- Airdrop eligibility requirements change per campaign
- Some Alpha tokens have vesting periods — tokens are locked until unlock date
- Cross-reference with GoPlus security check before investing in discovered tokens
- Alpha program availability varies by region
- Not all Alpha tokens will be listed on Binance — it's an evaluation program
- Use DexScreener data as supplementary intelligence for Alpha token research
