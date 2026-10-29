---
name: rove
description: Agent-native execution-path compiler for Binance. Compiles user economic intent into typed ExecutionIntent, prices competing execution paths against live Binance state, rejects constraint violations with deterministic reasons, ranks survivors, and presents Route Cards for approval.
metadata:
  version: 1.0.0
  author: winsznx
license: MIT
---

# Rove — Agent-Native Binance Execution-Path Compiler

Rove lets a Binance user describe the economic outcome they want without forcing them to manually choose the Binance product first.

The core mechanism is:

> **compile → reject → rank → confirm**

The primary product artifact is the **Route Card**.

---

## 1. When to Use Rove

Use Rove whenever the user expresses an economic or trading intent involving Binance:
- Buying or selling tokens (e.g. "Buy $750 of BNB", "Sell 2.5 ETH with lowest fee")
- Hedging exposure without disposing of assets (e.g. "Hedge 70% of my BNB for 24h, don't sell my BNB, keep leverage below 1.5x")
- Flattening exposure or offsetting positions
- What-if constraint updates (e.g. "Same hedge, but cap carry at 10 bps")

---

## 2. Critical Architecture Rule

- **Language intelligence belongs to the host agent.**
- **Financial correctness belongs to deterministic Rove code.**

### The host model may:
1. Compile user statements into typed `ExecutionIntent`.
2. Ask the minimum decision-changing clarifying question if required inputs are missing.
3. Explain deterministic results and Route Cards to the user.

### The host model MUST NOT authoritatively perform:
- Fee arithmetic
- Slippage calculation
- Order-book walking
- Leverage computation
- Funding carry projection
- Route eligibility
- Route ranking
- Order sizing or final order request construction

All quantitative, financial, constraint, and ranking logic is strictly performed by deterministic code in `@rove/core`.

---

## 3. The 4-Step Operational Flow

### Step 1: Compile Intent
Compile user natural language into an `ExecutionIntent` object:
```json
{
  "version": "1",
  "objective": "buy | sell | hedge | flatten",
  "asset": "BNB",
  "amount": { "type": "notional", "value": "750", "currency": "USDT" },
  "horizon": { "value": 24, "unit": "hours" },
  "must_retain_underlying": true,
  "max_leverage": "1.5",
  "max_estimated_carry_bps": "10.0",
  "max_observed_execution_cost_bps": "8.0",
  "urgency": "normal"
}
```

### Step 2: Price & Reject
Rove captures live comparison state across eligible products from Binance Agent OS within a bounded time window (`<= 2000 ms` skew):
- **Spot**: Walk live order book, compute VWAP slippage + authoritative account commission.
- **Convert**: Real-time RFQ quote spread delta.
- **USD-M Perpetual**: Mark price execution fee + projected funding carry over horizon.
- **Margin / COIN-M**: Evaluated against live account enablement; if disabled, rejected cleanly as `PRODUCT_UNAVAILABLE`.

Deterministic constraints are enforced:
- `must_retain_underlying=true` rejects routes that dispose of the protected asset (`RETAIN_UNDERLYING_CONFLICT`).
- Leverage cap enforcement (`LEVERAGE_LIMIT`).
- Cost ceiling enforcement (`EXECUTION_COST_LIMIT`).
- Carry ceiling enforcement (`CARRY_LIMIT`).
- Stale quote detection (`QUOTE_EXPIRED`).

### Step 3: Deterministic Ranking
Surviving paths are ranked without arbitrary AI scores:
1. Hard constraints pass
2. Complete required cost data
3. Lower observed immediate execution cost
4. Lower estimated carry under the declared scenario
5. Fresher quote
6. Operational complexity tie-break (Convert > Spot > USD-M)

### Step 4: Route Card Presentation & User Approval
Render the Route Cards to the user. Always separate **Observed Now** from **Estimated Over Horizon**.
