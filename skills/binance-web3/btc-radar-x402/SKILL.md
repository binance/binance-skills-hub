---
name: btc-radar-x402
description: |
  Pay-per-call Bitcoin ecosystem intelligence over x402 — no signup, no API key.
  Hourly Bitcoin L1 radar for BRC-20 (4-byte), Runes, Alkanes, SRC-20 tokens and Ordinals NFT mints
  with mint status/progress and mint-cost vs secondary-floor spread; unverified new-protocol candidate
  signals; and a pre-trade token risk check (honeypot/tax/permissions/holders/liquidity, 0–100 score)
  for Base and BSC. Use when you need BTC new-project data, early protocol signals, or a risk score before swapping.
metadata:
  author: gaodongmei478
  version: "1.0.0"
---

# BTC Radar x402

Base URL: `https://x402-btc-radar.jinli-x402.workers.dev`

Machine-readable catalog (always current): `GET /.well-known/x402.json`  
Health: `GET /health`

## Endpoints

| Endpoint | Price | What you get |
|----------|-------|--------------|
| `GET /v1/btc/radar/latest` | $0.01 USDC | Latest hourly snapshot of Bitcoin L1 inscription/token radar: items with mint status/progress, mint cost vs secondary floor spread, actionable flag; plus a summary of `candidate_protocols` |
| `GET /v1/btc/radar/candidates` | $0.50 USDC | Full list of unverified new-protocol candidates: new inscription metaprotocol tags and new indexer protocol categories, with first-seen time and evidence URLs |
| `GET /v1/token/risk?chain=base\|bsc&address=0x…` | $0.01 USDC | Single-token risk report: honeypot and buy/sell tax, owner permissions, holder concentration, liquidity; 0–100 risk score and a verdict |
| `POST /v1/token/risk/batch` | $0.05 USDC | Batch version of the risk report for multiple addresses |

## Payment (x402 v2)

All paid routes are pay-per-call in USDC. No account, no API key.

1. `GET` the route → HTTP 402 with a `PAYMENT-REQUIRED` header listing payment options.
2. Pay with any x402-capable wallet/client. Rails: Base USDC and Solana USDC via the CDP facilitator; BSC USDC via permit2/Dexter.
3. Retry the same URL with the `PAYMENT-SIGNATURE` header → HTTP 200 with the data and a `PAYMENT-RESPONSE` settlement header.
4. **Replay is free**: re-sending the same payment proof returns cached data. Do not pay twice for the same response.
5. Prefer `$0.01` routes first. Only call `$0.50` `/v1/btc/radar/candidates` when the user explicitly needs the full unverified candidate list.

## How to interpret results

- `actionable`: follow the API's own criteria; do not invent extra filters.
- `unknown` mint status means **no data**, not "mint closed".
- `candidate_protocols` / candidates are **unverified** signals — always label them as unverified to the user.
- A low risk score is **not** a guarantee of safety; still warn about residual rug/honeypot risk.

## Discovery

Before hard-coding prices, read `GET https://x402-btc-radar.jinli-x402.workers.dev/.well-known/x402.json` so agents pick up live pricing if it changes.
