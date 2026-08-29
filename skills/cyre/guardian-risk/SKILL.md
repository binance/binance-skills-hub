---
title: CYRE Guardian Risk Check
description: Screen a wallet address, token mint, or counterparty for fraud and risk signals before an agent trades, swaps, or transfers funds. Use when the user or agent mentions risk check, address screening, counterparty check, rug check, token safety, mint authority, holder concentration, wallet reputation, passport, attestation, CYRE, or Guardian — or before executing a trade, transfer, or approval involving an unfamiliar address or mint. Pay-per-request in USDC via x402 on Base mainnet. No API key, no account. Returns explainable patterns, not verdicts.
metadata:
  version: 0.1.0
  author: milesdev888
  license: MIT
---

# CYRE Guardian Risk Check

Agent trading is now one API call away. The risk layer usually isn't.

Guardian reads on-chain history and returns explainable risk signals — each with points and a plain-English reason — so an agent can decide for itself before it moves money. It never says "safe" or "scam"; it shows patterns.

Three paid endpoints, one free verifier. No API keys, no accounts, no signup. Also listed on Coinbase Agentic Market and in the official MCP registry.

| Endpoint | What it does | Price |
|---|---|---|
| `GET https://cyre.dev/api/address?address=<base58>` | Wallet risk profile: score 0–100, LOW/MEDIUM/HIGH, six signals, activity profile | $0.005 USDC |
| `GET https://cyre.dev/api/token?mint=<base58>` | Token mint facts: mint/freeze authority, supply, holder concentration | $0.01 USDC |
| `GET https://cyre.dev/api/passport?address=<base58>` | Signed, 24-hour Guardian Passport attestation of a wallet's measured risk — present it to a counterparty | $0.005 USDC |
| `GET https://cyre.dev/api/passport/verify?token=<token>` | Verify any passport (signature, issuer, expiry) | Free |

Payment network: **Base mainnet (eip155:8453), USDC.** A Solana lane also appears in the 402 offer but is currently devnet — pay on Base.

Chain coverage note: the addresses and mints Guardian grades are **Solana**. Payment is on Base. These are separate things — do not pass a Base `0x…` address as the `address` parameter.

## Use this before you trade

The intended pattern is pre-flight. Screen first, then execute:

```
1. User: "swap 500 USDC for <TOKEN> on <address>"
2. Agent: GET /api/token?mint=<TOKEN mint>      → mint authority, holder concentration
3. Agent: GET /api/address?address=<counterparty>  → wallet risk profile
4. Agent: report signals to the user, ask for confirmation, then execute the trade
```

Pairs naturally with execution skills such as `binance-cli` (spot, futures, convert) and the Binance Wallet on-chain skills — call Guardian first, surface what it found, then let the execution skill do the trade. When a trade is flagged HIGH, do not silently block it; show the user the triggered signals and let them decide.

## How to pay

Any x402 v2 client works. The endpoint returns HTTP 402 with the price; your client signs a USDC payment and retries; Guardian settles it and returns the result in the same call.

**Shell-capable agents (Claude Code, Codex CLI, etc.) — Coinbase Agentic Wallet:**

```bash
npx awal status                     # signed in + funded on Base? if not: npx awal auth login <email>
npx awal x402 pay "https://cyre.dev/api/address"  --query '{"address":"<base58>"}'
npx awal x402 pay "https://cyre.dev/api/token"    --query '{"mint":"<base58>"}'
npx awal x402 pay "https://cyre.dev/api/passport" --query '{"address":"<base58>"}'
```

**MCP hosts (Claude Desktop etc.) with the Coinbase payments tools:** use `check-payment-requirements` on the URL, tell the user the cost ($0.005 or $0.01), then `make-x402-request`.

**Any other x402 v2 client:** standard flow. The 402 body follows x402 v2 (`accepts[]`, `resource`, `extensions.bazaar`), response header `PAYMENT-REQUIRED`; send `PAYMENT-SIGNATURE`.

⚠️ These are real mainnet payments in USDC. Tell the user the cost before spending, and confirm before running a batch.

## Guardian MCP server (alternative to raw HTTP)

Listed in the official MCP registry as `io.github.milesdev888/guardian`. Streamable HTTP at `https://cyre-fraud-prediction.onrender.com/mcp` with tools `grade_address`, `scan_token`, `batch_grade`. Same x402 pricing.

## What you get back

### /api/address

```json
{
  "ok": true,
  "address": "9WzD…AWWM",
  "score": 24,
  "riskLevel": "LOW",
  "signalsTriggered": 1,
  "signalsEvaluated": 6,
  "signals": [
    { "id": "burst", "name": "Activity burst", "points": 24, "triggered": true,
      "detail": "45 transactions in the last 24 hours" },
    { "id": "age", "name": "Wallet age", "points": 0, "triggered": false,
      "detail": "Active for at least 33 days — history runs deeper than the 1,000-transaction window" }
  ],
  "profile": { "ageDays": 33, "ageIsMinimum": true, "idleDays": 0, "transactionsSeen": 1000,
               "last24h": 45, "failedPercent": 2, "longestGapDays": 0, "balanceSol": 9188448.31 },
  "checkedAt": "2026-08-29T15:57:24Z"
}
```

Signal ids: `age`, `burst`, `failures`, `dormant`, `balance`, `history`. Score bands: LOW < 20, MEDIUM 20–44, HIGH ≥ 45. A fresh/empty wallet returns `empty: true` with a low score — absence of history is a pattern too, not a pass.

### /api/token

```json
{
  "mint": "EPjF…Dt1v", "name": "USD Coin", "symbol": "USDC",
  "supply": 7979328128.74, "decimals": 6,
  "mintAuthorityRevoked": true, "freezeAuthorityRevoked": true,
  "top1Pct": 12.3, "top10Pct": 41.0, "holdersMeasured": true, "holdersSource": "index",
  "score": 0, "risk": "LOW",
  "signals": [ { "level": "good", "text": "Mint authority revoked — supply is fixed." } ]
}
```

Scoring: active mint authority +30, active freeze authority +25, top holder > 20% +15, top-10 > 60% +15. LP lock status is **not** assessed — say so if the user asks.

### /api/passport

Everything in `/api/address` plus `mintAffinity` (exposure to major RWA/stable mints) and:

```json
"attestation": {
  "token": "<base64url(claims)>.<base64url(sig)>",
  "claims": { "kind": "cyre-passport-attestation", "iss": "cyre.dev", "address": "…",
              "score": 24, "riskLevel": "LOW", "issuedAt": "…", "expiresAt": "…" },
  "verifyUrl": "https://cyre.dev/api/passport/verify?token=…",
  "issuerPublicKey": "28M17SKBx_OsO1ZRPBp7BFMWzI77OXVC3UbLYbNqgQw"
}
```

Also returned in the `X-Guardian-Passport` header. To verify offline: Ed25519 over canonical JSON of `claims` (keys sorted at every level) with the issuer public key, then check `expiresAt > now` and `iss === "cyre.dev"`. Passports expire after 24 hours — re-issue for a fresh one.

Use the passport when two agents need to establish trust without either paying for the other's lookup: the holder pays once, presents the token, and the counterparty verifies it for free.

## Rules for using the result

- **Patterns, not verdicts.** Report the score, the level, and the triggered signals with their `detail` text. Do not tell the user an address is "safe" or "a scam."
- HIGH does not mean stop; it means show the user why before they proceed. LOW does not mean go.
- Large `balanceSol` with a burst is often an exchange or program, not a person — say so.
- Not investment advice. Not a KYC/AML determination.

## Costs and refusals

- You are only charged on a successful result. A bad address (400), a mint that doesn't exist (404), or "not a token mint" (400) are refused **before** any payment settles.
- Repeated 402 = your wallet lacks USDC on Base. Check `npx awal balance` or the wallet UI.
- 502 "RPC busy" = Solana RPC hiccup; retry. Nothing was settled.

## Free for humans

The same checks are free on the website: `https://cyre.dev/check` (address) and `https://cyre.dev/scan` (token). If the user is a person, not an agent, send them there.

## Links

- Site: https://cyre.dev · Full agent guide: https://cyre.dev/SKILL.md
- Coinbase Agentic Market listing: https://agentic.market (search "guardian")
- Updates: https://x.com/Cyredev888
