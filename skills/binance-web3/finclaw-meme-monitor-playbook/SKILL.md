---
name: finclaw_meme_monitor_playbook
description: Adapts FinClaw's social-signal and market-analysis flow into a Four.meme candidate discovery and manual-launch decision playbook.
---

# FinClaw Meme Monitor Playbook

## Usage

- Category: Ecosystem
- Mode: guide
- Version: 0.1.0

## Input Example

```json
{
  "action": "daily_meme_scan",
  "channels": ["x", "rss"],
  "chain": "bsc",
  "launchVenue": "four.meme",
  "autoExecute": false
}
```

## Workflow

1. Collect social and feed signals:
   - trending symbols/keywords.
   - mention velocity and repeat-source rate.
2. Enrich with market context:
   - liquidity baseline.
   - holder concentration.
   - recent trade burst and volatility.
3. Score candidates with a fixed rubric:
   - narrative strength.
   - liquidity readiness.
   - concentration risk.
4. Produce ranked watchlist:
   - top candidates.
   - invalidation conditions.
   - recommended manual next action.
5. Optional handoff:
   - route approved candidates to create/trade skills only after explicit confirmation.

## Guardrails

- Keep `autoExecute=false` by default.
- Never treat social momentum as sufficient execution signal.
- Separate analysis output from any wallet-signing operation.
- Require final human confirmation before create/buy/sell actions.

## Source Anchors

- FinClaw upstream project: https://github.com/Fin-Chelae/FinClaw
- Four.meme CLI integration baseline: https://github.com/four-meme-community/four-meme-ai
- Four.meme protocol docs: https://four-meme.gitbook.io/four.meme/brand/protocol-integration
