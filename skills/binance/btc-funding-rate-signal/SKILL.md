---
title: BTC Funding Rate Arbitrage Signal
description: >
 Monitor Bitcoin perpetual contract funding rates on Binance to identify
 cash-and-carry arbitrage opportunities. Fetches real-time and predicted
 funding rates for BTCUSDT (USD-margined) and BTCUSD_PERP (coin-margined),
 calculates annualized yield net of trading fees, and classifies signal
 strength. Use this skill when users ask about BTC funding rates, perpetual
 contract carry yield, delta-neutral strategies, basis trading, or passive
 income from derivatives markets. This skill is informational only and does
 not place any orders.
metadata:
 version: 1.0.0
 author: DuanWangye9527
license: MIT
---

# BTC Funding Rate Arbitrage Signal

A signal and intelligence tool that monitors Bitcoin perpetual contract funding
rates on Binance and identifies cash-and-carry arbitrage opportunities in
real time. Covers both BTCUSDT (USD-margined) and BTCUSD_PERP (coin-margined)
contracts to provide a dual-lens view of market sentiment.

**Scope:** Signal generation only. This skill reads market data and computes
metrics — it does not submit, modify, or cancel any orders.

---

## Background: Funding Rate Mechanics

Perpetual contracts have no expiry date. Exchanges use a funding rate mechanism
to keep the contract price anchored to the spot price. Every settlement interval
(typically every 8 hours), one side pays the other:

- **Positive rate** → longs pay shorts (contract trading at a premium to spot)
- **Negative rate** → shorts pay longs (contract trading at a discount to spot)

**Cash-and-carry arbitrage** exploits high positive funding rates by holding a
delta-neutral position: long spot BTC + short an equal notional in perpetual
contracts. Price moves cancel out, and the trader collects funding payments at
each settlement interval.

**Why BTCUSDT vs BTCUSD_PERP matters:**
- BTCUSDT (USD-margined): collateral and P&L settled in USDT
- BTCUSD_PERP (coin-margined): collateral and P&L settled in BTC
- When their rates diverge, it signals whether leveraged demand is coming from
 fiat-denominated or crypto-native participants — a useful sentiment indicator

---

## API Endpoints

All endpoints are public and require no authentication.

### 1. Latest Settled Funding Rate

Returns the most recently settled funding rate.

**BTCUSDT**
```
GET https://fapi.binance.com/fapi/v1/fundingRate?symbol=BTCUSDT&limit=1
```

**BTCUSD_PERP**
```
GET https://dapi.binance.com/dapi/v1/fundingRate?symbol=BTCUSD_PERP&limit=1
```

Example curl:
```bash
curl -s 'https://fapi.binance.com/fapi/v1/fundingRate?symbol=BTCUSDT&limit=1' \
 -H 'Accept-Encoding: identity'
```

Example response:
```json
[
 {
 "symbol": "BTCUSDT",
 "fundingRate": "0.00082000",
 "fundingTime": 1741161600000,
 "markPrice": "87430.21"
 }
]
```

---

### 2. Real-Time Mark Price and Predicted Funding Rate

Returns the current mark price, index price, and predicted next funding rate.
This is the most important endpoint for live signal generation.

**BTCUSDT**
```
GET https://fapi.binance.com/fapi/v1/premiumIndex?symbol=BTCUSDT
```

**BTCUSD_PERP**
```
GET https://dapi.binance.com/dapi/v1/premiumIndex?symbol=BTCUSD_PERP
```

Example curl:
```bash
curl -s 'https://fapi.binance.com/fapi/v1/premiumIndex?symbol=BTCUSDT' \
 -H 'Accept-Encoding: identity'
```

Example response:
```json
{
 "symbol": "BTCUSDT",
 "markPrice": "87430.21000000",
 "indexPrice": "87418.50000000",
 "estimatedSettlePrice": "87422.80000000",
 "lastFundingRate": "0.00082000",
 "nextFundingTime": 1741176000000,
 "interestRate": "0.00010000",
 "time": 1741172800000
}
```

Key fields:
| Field | Description |
|---|---|
| `markPrice` | Current contract mark price |
| `indexPrice` | Underlying spot index price |
| `lastFundingRate` | Most recently settled rate |
| `nextFundingTime` | Unix timestamp (ms) of next settlement |

---

### 3. Funding Rate Settlement Interval

Returns configuration for the contract, including the settlement interval in
hours. Always read this before computing annualized yield — do not assume 8h.

**BTCUSDT**
```
GET https://fapi.binance.com/fapi/v1/fundingInfo
```

**BTCUSD_PERP**
```
GET https://dapi.binance.com/dapi/v1/fundingInfo
```

Example curl:
```bash
curl -s 'https://fapi.binance.com/fapi/v1/fundingInfo' \
 -H 'Accept-Encoding: identity' | python3 -c \
 "import json,sys; data=json.load(sys.stdin); \
 [print(d) for d in data if d['symbol']=='BTCUSDT']"
```

Relevant fields:
| Field | Description |
|---|---|
| `symbol` | Contract symbol |
| `fundingIntervalHours` | Settlement interval in hours (commonly 8) |
| `adjustedFundingRateCap` | Maximum allowed funding rate per interval |
| `adjustedFundingRateFloor` | Minimum allowed funding rate per interval |

---

## Signal Computation

### Step 1 — Annualized Yield

```
settlements_per_year = (24 / fundingIntervalHours) × 365
annualized_yield (%) = lastFundingRate × settlements_per_year × 100
```

Example for BTCUSDT with rate = 0.00082 and 8h interval:
```
settlements_per_year = (24 / 8) × 365 = 1095
annualized_yield = 0.00082 × 1095 × 100 = 89.79%
```

### Step 2 — Net Yield After Fees

Binance standard trading fees (VIP 0): 0.02% maker / 0.05% taker per leg.
A cash-and-carry trade opens two legs (spot buy + futures short) and closes two
legs at exit. Use taker fees for a conservative estimate.

```
round_trip_fee_cost (%) = 4 × taker_fee × 100
 = 4 × 0.0005 × 100 = 0.20%

net_annualized_yield (%) = annualized_yield − round_trip_fee_cost
```

Note: fee tiers vary by user VIP level and BNB fee discount. Use 0.20% as a
conservative baseline; inform the user that their actual cost may be lower.

### Step 3 — Basis (Spread)

```
basis_bps = ((markPrice − indexPrice) / indexPrice) × 10000
```

Positive basis confirms contract is trading at a premium to spot, consistent
with a high positive funding rate. A large discrepancy between basis and funding
rate may indicate data latency — refetch before acting.

### Step 4 — Time to Next Settlement

```
seconds_to_settlement = (nextFundingTime − current_unix_ms) / 1000
```

If `seconds_to_settlement < 300` (5 minutes), the predicted rate is near-final
and can be treated as the actual rate for the upcoming settlement.

### Step 5 — Signal Classification

| Signal Level | Annualized Net Yield | Interpretation |
|---|---|---|
| `WATCH` | 10% – 20% | Elevated but modest; monitor for continuation |
| `SIGNAL` | 20% – 50% | Meaningful opportunity; assess position sizing |
| `STRONG` | 50% – 100% | High-conviction window; typically short-lived |
| `EXTREME` | > 100% | Market euphoria; elevated liquidation risk |
| `NEUTRAL` | < 10% | No actionable signal |
| `NEGATIVE` | < 0% | Funding favors shorts; inverse carry opportunity |

---

## Sentiment Overlay: BTCUSDT vs BTCUSD_PERP Divergence

After fetching both contracts, compute the rate spread:

```
rate_spread = BTCUSDT_rate − BTCUSD_PERP_rate
```

Interpretation:
| Spread | Interpretation |
|---|---|
| BTCUSDT >> BTCUSD_PERP | Leveraged demand driven by fiat (USDT) buyers — retail-heavy |
| BTCUSD_PERP >> BTCUSDT | Leveraged demand from crypto-native holders — institutional or miner hedging |
| Rates roughly equal | Balanced participation across market segments |

---

## Output Format

Present results in the following structured format. Always include the
disclaimer at the end.

```
═══════════════════════════════════════════════
 BTC FUNDING RATE SIGNAL — {timestamp UTC}
═══════════════════════════════════════════════

CONTRACT               BTCUSDT (USD-M)    BTCUSD_PERP (Coin-M)
─────────────────────────────────────────────────────────────────────
Last Rate              +0.0082%           +0.0051%
Annualized             +89.8%             +55.8%
Net (est.)             +89.6%             +55.6%
Mark Price             $87,430.21         $87,428.90
Basis                  +1.3 bps           +1.2 bps
Settlement In          3h 42m             3h 42m
Signal Level           ⚡ STRONG           📶 SIGNAL
─────────────────────────────────────────────────────────────────────

SENTIMENT OVERLAY
Rate Spread (USDT − USD): +0.0031%
→ Elevated USDT-margined demand. Leverage is predominantly fiat-driven,
 consistent with retail momentum buying.

STRATEGY CONTEXT
A cash-and-carry position on BTCUSDT would collect ~+0.0082% per settlement
(~$7.16 per $87,300 notional), 3 times per day, as long as the rate holds.
Net annualized yield after estimated fees: ~89.6%.

Key risks to monitor:
• Rate reversion: funding rates can drop sharply after peak sentiment passes
• Liquidation gap: extreme moves may cause margin shortfall on the short leg
• Execution friction: slippage on large positions reduces effective yield

⚠️ DISCLAIMER: This output is informational only. It does not constitute
investment or financial advice. Funding rates can change at any time. Past
rates are not indicative of future rates. Always assess your own risk
tolerance before entering any position. See Binance Terms of Use.
═══════════════════════════════════════════════
```

---

## Trigger Phrases

Use this skill when the user asks questions such as:

- "What is the BTC funding rate right now?"
- "Is there a funding rate arbitrage opportunity in BTC?"
- "What's the annualized yield from BTC carry trade?"
- "Show me the basis between BTC spot and perp"
- "How much can I earn from delta-neutral BTC strategy?"
- "Compare BTCUSDT and BTCUSD_PERP funding rates"
- "Is the BTC funding rate positive or negative?"
- "When is the next BTC funding settlement?"

---

## Error Handling

| Scenario | Recommended Response |
|---|---|
| `fapi` or `dapi` endpoint returns non-200 | Inform user that Binance Futures API is temporarily unavailable; suggest retrying in a few minutes |
| `fundingIntervalHours` field missing | Default to 8h and note the assumption in output |
| `nextFundingTime` is in the past | The settlement just occurred; refetch `premiumIndex` to get updated predicted rate |
| Basis and funding rate have opposite signs | Flag as potential data inconsistency; advise user to verify on Binance Futures UI before acting |

---

## Rate Limits

These endpoints are public REST endpoints on the Futures API.

| Endpoint | Weight |
|---|---|
| `/fapi/v1/fundingRate` | 1 |
| `/fapi/v1/premiumIndex` | 1 |
| `/fapi/v1/fundingInfo` | 1 |
| `/dapi/v1/*` equivalents | 1 each |

Total weight per full signal scan: **6**. Binance Futures REST API limit is
2400 weight per minute. No rate limit concerns for typical usage.

---

## Scope Boundaries (v1.0)

This MVP version intentionally excludes the following (reserved for v2):

- Multi-symbol scanning beyond BTC
- Historical funding rate volatility scoring
- Automated order execution
- Cross-exchange funding rate comparison
- Portfolio margin sufficiency checks
- WebSocket streaming (polling only)