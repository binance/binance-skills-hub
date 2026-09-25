---
name: four_meme_mempool_sentinel
description: Builds real-time pending-transaction watchlists for Four.meme and upgrades alerts only after event-level confirmation, reducing false positives.
metadata:
  author: brief-onchain
  version: "1.0"
---

# Four.Meme Mempool Sentinel

## Usage

- Category: Ecosystem
- Mode: guide
- Version: 0.1.0

## Input Example

```json
{
  "action": "watch_pending_flows",
  "windowSeconds": 45,
  "minBuyBnb": 0.3,
  "trackWallets": ["0x..."],
  "alertLevels": ["watch", "hot", "critical"]
}
```

## Workflow

1. Define watch universe:
   - active Four.meme contracts.
   - tracked wallets (smart money / known launch wallets).
   - thresholds by BNB size and tx burst frequency.
2. Subscribe pending transactions (mempool) and decode candidates:
   - buy bursts.
   - repeated wallet fan-out.
   - suspicious pre-liquidity traffic.
3. Score pending signals quickly:
   - size score.
   - wallet quality score.
   - crowding score.
4. Confirm with chain events before escalation:
   ```bash
   npx fourmeme events <fromBlock> [toBlock]
   npx fourmeme token-info <tokenAddress>
   ```
5. Emit dual-state alerts:
   - `pending_signal` (unconfirmed).
   - `confirmed_signal` (post-event verified).

## Guardrails

- Keep this skill read-only and monitoring-first.
- Never auto-trade from pending transactions alone.
- Expire stale pending alerts after the configured window.
- If data-provider latency is high, downgrade alert confidence.

## Source Anchors

- Bitquery Four Meme API (mempool + migration analytics): https://docs.bitquery.io/docs/blockchain/BSC/four-meme-api/
- Community MCP integration reference: https://github.com/sunneeee/fourtrader-mcp
- Four.meme CLI events verification: https://github.com/four-meme-community/four-meme-ai
