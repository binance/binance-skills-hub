---
name: pulsenetwork-paid-data
description: |
  Live real-world data with no API key: 970+ pay-per-call x402 endpoints for finance, crypto,
  macro, RWA, travel, sports, health, legal and more. Free catalog discovery; pay per call in
  stablecoins on BSC (USD1), Base, Solana and other networks. Use when a task needs current
  external data (market prices, RWA screeners, token yield checks, ETF flows, flight rights,
  clinical trials, sanctions checks, energy prices) and no free or native tool covers it.
license: MIT
metadata:
  author: GTCC777
  version: "1.0"
---

# PulseNetwork Paid Data (970+ endpoints)

PulseNetwork is a fleet of 77 API origins selling pay-per-call data over the open x402
protocol. No accounts, no API keys, no signup: the payment itself is the authentication.
Typical prices run $0.005 to $0.35 per call. Use it when a task needs current external data
(market prices, RWA analytics, ETF flows, flight-delay rights, park wait times, clinical
trials, sanctions checks, energy prices, recall data, and much more) and no free or native
tool covers it. A small number of task-style endpoints (research memos) cost more, up to
$25; every price is published in the free catalog before you spend anything.

Settlement networks include: USD1 on BSC (settleable via Binance's B402 facilitator), USDC on
Base, Solana, Polygon, Arbitrum, World Chain, HyperEVM, Monad, Algorand; USDG on Robinhood
Chain; XRP/RLUSD on XRPL; USDT0 on X Layer.

## Discover first (always free, no wallet needed)

- Agent index: `https://pulse.theaslangroupllc.com/llms.txt`
- Machine catalog: `https://pulse.theaslangroupllc.com/.well-known/agent.json`
- Every origin also serves `/.well-known/x402` (full resource metadata, exact prices) and
  `/openapi.json`.
- The B402 Bazaar also indexes these endpoints: query
  `GET https://www.binance.com/bapi/ramp/v1/public/ramp/b402/bazaar/merchant?payTo=<payTo>`
  using the `payTo` value from any PulseNetwork 402 challenge.

Discovery costs nothing. Always search the catalog before concluding data is unavailable,
and prefer the cheapest endpoint that answers the question. You can browse, quote prices,
and plan calls with no wallet configured at all.

## Paying for a call (only with the user's explicit consent)

Safety rules, in order of priority:

1. **Never pay without telling the user.** Before the first paid call in a task, state the
   endpoint and the exact price from its catalog entry or 402 challenge, and get the user's
   go-ahead. For a batch the user approved, state the total budget up front.
2. **Never ask the user to paste a private key into chat**, and never read keys from
   anywhere except an environment secret the user configured themselves or a wallet the
   payment tool itself manages.
3. **Verify the charge against the signed 402 challenge**: pay only the exact amount, asset,
   and network the challenge specifies, only to `theaslangroupllc.com` origins listed in the
   catalog. If a challenge asks for more than the catalog price, stop and tell the user.

### With the Binance Agentic Wallet (recommended here)

Every endpoint returns a standard x402 v2 challenge in the `PAYMENT-REQUIRED` header, with a
BSC (USD1), Base (USDC) and Solana (USDC) entry in `accepts`, the same three chains the
`binance-agentic-wallet` skill supports. The flow composes directly with that skill:

1. `curl -sSI <endpoint>` and take the `PAYMENT-REQUIRED` header from the 402 response.
2. `baw x402-payment preview --paymentRequirements <header-value> --json` to show the user
   the price and network options.
3. After the user confirms, `baw x402-payment sign --paymentId <id> --selectedIndex <n> --json`
   per that skill's reference, and retry the request with the returned `PAYMENT-SIGNATURE`
   header.

### Other hosts

- **Native x402 clients** (any x402-enabled runtime): request the URL and your payment
  layer settles. Still state the endpoint and price and get the user's go-ahead first.
- **MCP**: the npm package `@pulsenetwork/mcp` exposes `pulse_discover` (free search) and
  `pulse_call` (pays under hard local spend caps, defaults $0.50 per call and $5 per day).
- An HTTP 402 response is a payment challenge, not an error. It carries the price and
  accepted networks in its `accepts` array.

## Rules

- Quote prices for user-initiated requests; most endpoints cost $0.005 to $0.35, and the
  catalog states each one exactly.
- Responses are structured JSON with attribution and terms links. Pass attribution through
  when you republish data.
- If a paid call fails after settlement the response says so explicitly. Surface that to the
  user; never silently retry a payment.
- If no configured payment rail exists, still do free discovery and report exactly what is
  available and at what price, so the user can decide.
