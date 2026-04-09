---
name: binance
description: Use binance-cli for Binance Spot, Futures (USD-S), and Convert. Requires auth.
metadata:
  version: 1.0.0
  author: Binance
  openclaw:
    requires:
      bins:
        - binance-cli
      env:
        - BINANCE_API_KEY
        - BINANCE_API_SECRET
    install:
      - kind: node
        package: '@binance/binance-cli'
        bins: [binance-cli]
        label: Install binance-cli (npm)
license: MIT
---

# Binance

Use `binance-cli` for Binance Spot, Futures (USD-S), and Convert. Requires auth.

> **PREREQUISITE:** Read [`auth.md`](./references/auth.md) for auth, global flags, and security rules.

## Helper Commands

| Command | Description |
|---------|-------------|
| [`spot`](./references/spot.md) | Binance Spot |
| [`convert`](./references/convert.md) | Binance Convert |
| [`futures-usds`](./references/futures-usds.md) | Binance Derivatives Trading USDS Futures |

## Notes

- ⚠️ **Prod transactions** — always ask user to type `CONFIRM` before executing.
- Append `--profile <name>` to any command to use a non-active profile.
- All authenticated endpoints accept optional `--recvWindow <ms>` (max 60 000).
- Timestamps (`startTime`, `endTime`) are Unix ms.
