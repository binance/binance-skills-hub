---
name: bitfence
description: |
  Fetch a pre-transaction risk score and advisory recommendation for tokens on Solana, Base,
  Ethereum, Arbitrum, BSC, and HyperEVM before the user trades, swaps, or provides liquidity.
  Read-only; never signs or moves funds. Use when the user asks "is this token safe?",
  "check this token", or before interacting with an unfamiliar token.
version: "0.7.7"
license: Apache-2.0
metadata:
  author: bitfence
---

# Bitfence — pre-transaction risk infrastructure for AI agents operating on-chain

Bitfence is an **optional, user-controlled** pre-transaction risk-scoring service for tokens on Solana, Base, Ethereum, Arbitrum, BSC, and HyperEVM. When the user is about to interact with an unfamiliar token, this skill lets you fetch a risk assessment from the public Bitfence API so the user can make an informed decision.

Bitfence is **read-only**. It does not sign transactions, broadcast transactions, hold funds, or interact with the user's wallet. It returns a JSON risk report and nothing more.

This skill provides advisory guardrails. **The user is always the final authority.** If the user explicitly chooses to proceed after seeing a risk warning, that is their decision and you should respect it.

---

## Privacy and data sent

Bitfence only ever receives **public on-chain identifiers**. Specifically:

- **Token risk endpoint** (`GET /v1/risk/{chain}/{token_address}`) — sends only the chain name and the public token contract address. No wallet address, no portfolio, no transaction details.
- **Contextual endpoint** (`POST /v1/risk/contextual`) — additionally sends the position size and total portfolio size in USD, **only when the user has explicitly opted in to contextual analysis**. No wallet address is ever transmitted.

Do not call the contextual endpoint without the user's awareness that position-size context will be shared with the API.

---

## Cost transparency

Bitfence is monetised via the x402 protocol — each scoring request costs a small amount of USDC on Base mainnet (typically a few tenths of a cent). Before you begin using Bitfence in a session:

- **Inform the user** that risk checks are paid and will draw from the wallet's USDC balance on Base mainnet.
- **Ask for the user's consent** the first time you call Bitfence in a session, or when the user has not previously authorised paid risk checks.
- **Do not call Bitfence repeatedly** in tight loops, batch operations, or polling patterns. Use it once per distinct trade decision.
- If the user declines paid checks, fall back to whatever native safety checks you and the user have agreed on.

If x402 payment fails, do not retry blindly. Inform the user that the wallet needs USDC on Base mainnet to use Bitfence, and let the user decide whether to top up or skip the check.

---

## Available endpoints

Base URL: `https://api.bitfence.ai`

| Method | Path | Purpose | Paid? |
|---|---|---|---|
| `GET` | `/` | Service metadata — name, version, status. | Free |
| `GET` | `/health` | Health probe. Returns `200 OK` when operational. | Free |
| `GET` | `/v1/risk/{chain}/{token_address}` | Token risk assessment. `chain` is `solana`, `base`, `ethereum`, `arbitrum`, `bsc`, or `hyperevm`. | Yes (x402) |
| `POST` | `/v1/risk/contextual` | Position-aware risk assessment with slippage, MEV exposure, and a suggested position cap. | Yes (x402) |

---

## When Bitfence is useful

Bitfence is most useful before the user is about to interact with an **unfamiliar or unverified token**. Typical situations:

- A token swap or DEX trade involving a token the user has not traded before
- A purchase of a token recommended by an external source the user has not vetted
- Providing liquidity or staking into a pool involving an unfamiliar token

Bitfence is **not needed** for:

- Transfers of native gas tokens (SOL, ETH) between the user's own wallets
- Transactions exclusively involving well-established stablecoins (USDC, USDT, DAI)
- Tokens the user has already verified earlier in the session

If you are unsure whether a check is warranted, ask the user.

---

## How to call Bitfence

**Token risk only** — use when the position size is not yet known:

```
GET https://api.bitfence.ai/v1/risk/{chain}/{token_address}
```

Supported chains: `solana`, `base`, `ethereum`, `arbitrum`, `bsc`, `hyperevm` (lowercase).

Examples:
```
GET https://api.bitfence.ai/v1/risk/solana/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v
GET https://api.bitfence.ai/v1/risk/base/0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
GET https://api.bitfence.ai/v1/risk/ethereum/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2
```

**Contextual risk** — use only when the user has opted in to share the position size:

```
POST https://api.bitfence.ai/v1/risk/contextual
Content-Type: application/json

{
  "chain": "solana",
  "token": "<token_address>",
  "position_size_usd": <amount>,
  "agent_portfolio_usd": <total_portfolio>
}
```

The contextual response adds estimated slippage, MEV exposure category, and a suggested position cap.

---

## How to interpret the response

The response contains a `recommendation` field. Treat it as **advisory**:

| `recommendation` | Suggested behaviour |
|---|---|
| `PROCEED` | The risk check found no significant concerns. You may proceed with the transaction as planned. |
| `REQUIRE_HUMAN_APPROVAL` | The risk check found notable concerns. Surface the `reasoning` field to the user and ask whether they want to proceed before doing so. |
| `BLOCK` | The risk check detected a serious safety concern. Stop, surface every flag in `flags_triggered` together with the `reasoning` text to the user, and ask the user to make an explicit, informed decision. The user remains free to override after seeing the warnings. |

Treat `confidence < 0.5` as a sign that the underlying data was incomplete or contested; mention this to the user when reporting the result. When independent data sources disagreed on a fact, the `reasoning` field names it ("Cross-source disagreement on: …") and that fact is excluded from confidence. A `degraded` object in the response names exactly which data sources were unavailable — if `degraded.recommendation_capped` is `true`, the recommendation was capped at `REQUIRE_HUMAN_APPROVAL` because a safety-critical check could not run, not because a threat was measured.

The user is always the final authority. Your job is to present the risk findings accurately and let the user decide.

---

## Circuit breakers

If `flags_triggered` is non-empty, the API has detected one or more hard safety conditions. Measured threats (`honeypot` — a token whose sell path measurably reverts — `high_sell_tax`, `selfdestruct`) override even trusted tokens. Heuristic flags (for example `hidden_owner_and_mint`, `hidden_owner_and_mint_evm`, `balance_mutable`, `modifiable_tax`, `lp_fully_unlocked_deployer_held`, `lp_unlock_imminent`, `already_rugged`, `extreme_holder_concentration`, `insider_cohort_concentration`, `deployer_concentration_young_token`, `no_dex_pool_micro_holders`, `micro_holder_count`) indicate strong risk evidence for unknown tokens. Each entry is the name of the circuit breaker that fired; the human-readable explanation is in the `reasoning` field.

When this happens:
- Present every flag name and the `reasoning` text to the user.
- Recommend not proceeding and explain why.
- If the user explicitly chooses to proceed anyway after being informed, respect their decision and acknowledge it clearly in your response.

---

## Error handling

If Bitfence returns an error or is unreachable:
- Inform the user that the risk check could not complete.
- Offer the user the choice to proceed without the check, retry, or abandon the action.
- Do not silently retry more than once.

---

## Example response

Verbatim v0.7.6 response for wrapped SOL (confidence truncated for display). Illustrative API output only — not an endorsement or safety guarantee for any asset:

```json
{
  "chain": "solana",
  "token_address": "So11111111111111111111111111111111111111112",
  "risk_score": 15,
  "risk_level": "LOW",
  "confidence": 0.64,
  "recommendation": "PROCEED",
  "reasoning": "Wrapped SOL (wSOL) is on the curated trusted-token registry; the risk score is capped at 15 and heuristic breakers do not floor it. Measured threats would still override the cap. Cross-source disagreement on: liquidity_usd, lp_burned_pct, holder_count — excluded from confidence grounding. Pool is established (age ≥ 30 days).",
  "flags_triggered": [],
  "trusted_token": "Wrapped SOL (wSOL)",
  "cached": true,
  "cache_source": "l1",
  "analysis_ms": 630,
  "response_ms": 0,
  "version": "0.7.6"
}
```

`trusted_token` and `degraded` only appear when they apply; a clean fresh assessment omits both and has `"cached": false, "cache_source": null`.

For the contextual endpoint, an additional `context` object is returned with slippage, MEV exposure, and a `suggested_max_usd` position cap.

---

## Response fields reference

```
risk_score          integer 0–100     Composite risk score. 0 = safe, 100 = maximum risk.
risk_level          string            LOW | MEDIUM | HIGH (advisory tier)
confidence          float 0–1         Coverage of live on-chain data. Below 0.5 = limited data.
recommendation      string            Advisory action. See table above.
reasoning           string            Human-readable explanation. Quote to the user when relevant.
flags_triggered     array of strings  Names of circuit breakers that fired. Empty when none did.
trusted_token       string, optional  Curated registry label (e.g. "Circle (USDC)"). Only present on a match.
degraded            object, optional  Present iff a safety-critical data source was unavailable:
  missing_sources           Data sources that were dark, e.g. ["lp_lock_data"]
  checks_not_run            Breakers that could not reach a conclusion
  recommendation_capped     True when the missing checks forbid a PROCEED
cached              boolean           True if the response came from cache.
cache_source        string or null    "l1" | "l2" when cached, null on a fresh assessment.
analysis_ms         integer           Time the underlying analysis took (cached responses keep the original).
response_ms         integer           Wall-clock time for this request.
version             string            API version that produced the assessment.

context.*           (contextual endpoint only)
  pool_liquidity_usd          Total liquidity in the token's primary pool
  estimated_slippage_pct      Slippage % for the specified position size
  effective_cost_usd          Cost after slippage
  max_safe_position_usd       Largest position keeping slippage low
  portfolio_concentration_pct Position as % of total portfolio
  mev_exposure                Sandwich attack risk: low | medium | high
  suggested_max_usd           Recommended position cap
```

---

## Supported chains

| Chain | Identifier | Token address format |
|---|---|---|
| Solana | `solana` | Base58 mint address (32–44 chars) |
| Base | `base` | `0x`-prefixed 42-char hex address |
| Ethereum | `ethereum` | `0x`-prefixed 42-char hex address |
| Arbitrum | `arbitrum` | `0x`-prefixed 42-char hex address |
| BSC | `bsc` | `0x`-prefixed 42-char hex address |
| HyperEVM | `hyperevm` | `0x`-prefixed 42-char hex address |

---

## Useful links

- Website: https://www.bitfence.ai
- Twitter / X: https://x.com/bitfenceai
- API root: https://api.bitfence.ai

Bitfence is operated by the Bitfence team as an independent, read-only risk oracle. It does not custody user funds, does not have the ability to move user funds, and does not communicate with the user's wallet beyond receiving x402 micropayments that the user's agent voluntarily initiates.
