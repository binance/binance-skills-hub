---
name: lonestaroracle-token-safety
description: Vet an EVM or Solana token's contract security, honeypot risk, and holder concentration before an agent interacts with or trades it. Returns a structured risk assessment from the LoneStarOracle TokenScope API, pay-per-call over x402.
version: 1.0.0
license: MIT
---

# LoneStarOracle Token Safety Check

Run a due-diligence risk check on any token **before** interacting with it — swapping, adding liquidity, or executing a trade. It returns a structured risk assessment (not investment advice) so an agent can decide whether a token is too risky to touch.

## When to use

- Before a trade or swap involving an unfamiliar or newly launched token.
- When a user or upstream signal references a token by contract address and you need a safety read.
- As a pre-trade gate: flag or block interactions with tokens that score high-risk or as honeypots.

## How to call it

A single HTTP GET, gated by the x402 payment protocol (USDC on Base or Solana, $0.15 per call). Any x402-capable client (`x402-fetch`, `@x402/fetch`, or an MCP x402 payment tool) handles the 402 → pay → 200 loop automatically. No API key or account is required, and the pay-to details come from the 402 response, so nothing needs to be hardcoded.

```
GET https://token.lonestaroracle.xyz/report?address=<TOKEN_ADDRESS>&chain=<CHAIN>
```

- `address` — the token contract address (EVM `0x…`) or Solana mint (base58).
- `chain` — one of `eth`, `base`, `bsc`, `arbitrum`, `polygon`, or `solana`. If omitted, the chain is auto-detected from the address format.

A free, unmetered `GET /demo?address=…&chain=…` returns the same structure for testing the integration before wiring up payment.

## What it returns

A JSON risk report. Key fields:

- `risk_score` — integer 0–10 (higher means more risk).
- `risk_flags` — list, e.g. `honeypot_detected`, `unverified_contract`, `high_holder_concentration`, `mint_authority_active`, `freeze_authority_active`, `low_liquidity`, `high_sell_tax`.
- `is_honeypot` / `honeypot_reason` — whether the token blocks normal selling.
- `verified` — whether the contract source is public / open-source.
- `top10_concentration_pct` — share held by the top 10 holders.
- `liquidity_usd`, `market_cap`, `volume_24h`, `price_usd` — DEX market data.
- `narrative` — a short plain-language summary of the findings.

## How to interpret (factual, not a recommendation)

- `is_honeypot: true`, or a `honeypot_detected` flag, means the token cannot be sold normally — treat it as unsafe to interact with.
- A high `risk_score` (roughly 7 or above) or `high_holder_concentration` indicates elevated risk; proceed only with explicit user awareness.
- A low score is the **absence of detected red flags**, not an endorsement or a guarantee. Never present any token as safe, guaranteed, or recommended.

## Notes

- Covers EVM chains (Ethereum, Base, BSC, Arbitrum, Polygon) and Solana SPL tokens.
- Data sources include on-chain contract analysis, GoPlus token security, and DEX market data.
- Provider: LoneStarOracle. Full API and catalog: https://docs.lonestaroracle.xyz
