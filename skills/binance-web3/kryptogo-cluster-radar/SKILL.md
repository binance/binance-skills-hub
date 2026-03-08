---
name: kryptogo_cluster_radar
description: Read-only token intelligence workflow adapted from KryptoGO cluster analysis. Tracks whale and smart-money accumulation across BSC/Solana/Base/Monad with trading flows omitted from current integration scope.
---

# KryptoGO Cluster Radar (Read-Only)

## Usage

- Category: Ecosystem
- Mode: guide
- Version: 0.1.0

## Input Example

```json
{
  "chainId": 56,
  "tokenAddress": "0x...",
  "focus": "cluster_accumulation",
  "timeframes": ["15m", "1h", "4h", "1d"],
  "includeSignalDashboard": true
}
```

## Integration Scope

Allowed analysis endpoints:

- `GET /token-overview`
- `GET /analyze/:token_mint`
- `GET /analyze-cluster-change/:token_mint`
- `POST /balance-history`
- `POST /token-wallet-labels`
- `GET /agent/trending-tokens`
- `GET /signal-dashboard` (Pro/Alpha tier)

Not included in this adaptation:

- `POST /agent/swap`
- `POST /agent/submit`
- Any `swap.py` / cron auto-trading flow
- Any requirement for `SOLANA_PRIVATE_KEY`

## Analysis Flow

1. Fetch token baseline:
   - price, market cap, holders, liquidity, risk level.
2. Run cluster scan:
   - measure concentration ratio and top-entity structure.
3. Run cluster-trend scan:
   - check 15m/1h/4h/1d change for accumulation vs distribution.
4. Verify risky labels with holdings:
   - combine wallet labels with `balance-history` to detect active sell pressure.
5. Optional market-wide discovery:
   - `signal-dashboard` first (if tier allows), fallback to `trending-tokens`.
6. Output read-only conclusion:
   - accumulation score, concentration risk, active sell-pressure risk, key watch addresses.

## Guardrails

- Never request or store private keys.
- Keep outputs analysis-focused (insider holdings, accumulation/distribution, risk interpretation).
- BSC/Base/Monad are treated as analysis-only chains.
- If user asks to trade, provide analysis summary and separate that from execution guidance.

## Source Anchors

- Upstream skill: https://github.com/kryptogo/kryptogo-meme-trader/tree/main/skill
- API reference: https://github.com/kryptogo/kryptogo-meme-trader/blob/main/skill/references/api-reference.md
- Concepts: https://github.com/kryptogo/kryptogo-meme-trader/blob/main/skill/references/concepts.md
