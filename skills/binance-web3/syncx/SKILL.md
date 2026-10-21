---
name: syncx
description: One-command SyncX workflow for cross-posting crypto content to Binance Square and X/Twitter, with optional Telegram and Threads targets.
metadata:
  author: brief-onchain
  version: "1.0"
---

# SyncX Multi-Platform Publisher

## Usage

- Category: Ecosystem
- Mode: integration
- Version: 0.1.0

## Input Example

```json
{
  "text": "BTC retrace then continuation; watch 4h structure.",
  "platforms": ["square", "twitter"],
  "twitterMode": "official"
}
```

## Workflow

1. Clone SyncX repo and enter project directory:
   ```bash
   git clone https://github.com/SyncX2026/SyncX.git
   cd SyncX
   ```
2. Initialize local config:
   ```bash
   python3 scripts/publish_sync.py --init-config
   ```
3. Fill `.env` with platform credentials.
4. Run doctor checks before any publish:
   ```bash
   python3 scripts/publish_sync.py \
     --doctor \
     --platforms square,twitter \
     --twitter-mode official
   ```
5. Publish once and fan out by platform:
   ```bash
   python3 scripts/publish_sync.py \
     --text "BTC retrace then continuation; watch 4h structure." \
     --platforms square,twitter \
     --twitter-mode official
   ```
6. Use dry-run for safe validation:
   ```bash
   python3 scripts/publish_sync.py \
     --text "test" \
     --platforms square,twitter,tg,threads \
     --twitter-mode official \
     --dry-run
   ```

## Platform Routing

- `square`: Binance Square OpenAPI publishing.
- `twitter` + `official`: X API v2 credential path.
- `twitter` + `browser`: session-cookie path (`auth_token` + `ct0`).
- `tg`: Telegram Bot API publishing.
- `threads`: optional Graph API publishing.

## Guardrails

- Run `--doctor` before each publish batch.
- Keep secrets only in local `.env`; never print full token values.
- Treat per-platform failure as partial failure and continue reporting the others.

## Source Anchors

- Repo: https://github.com/SyncX2026/SyncX
- Script entrypoint: https://github.com/SyncX2026/SyncX/blob/main/scripts/publish_sync.py
