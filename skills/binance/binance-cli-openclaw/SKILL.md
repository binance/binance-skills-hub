---
name: binance-cli-openclaw
description: |
  OpenClaw-oriented Binance CLI skill for core Spot operations: account info, ticker prices,
  order placement, order status checks, and QR decoding from local images or image URLs.
  Uses the local `binance-cli` profile/auth flow.
metadata:
  version: "1.0.0"
  author: cripto-web3
  openclaw:
    requires:
      bins:
        - node
        - binance-cli
license: MIT
---

# Binance-cli OpenClaw

## Purpose

Provide a minimal, CLI-style command surface for OpenClaw workflows that need core Binance Spot actions:

- Read account information
- Read market ticker prices
- Place spot orders
- Check order status
- Decode QR code(s) from image path or image URL

## Setup

1. Ensure `binance-cli` is installed and available.
2. Configure authentication using the existing Binance skill auth guide: [`../binance/references/auth.md`](../binance/references/auth.md).
3. For QR decoding, install Python 3 packages: `pip install opencv-python`.
4. Run commands through the local wrapper script in `scripts/cli.mjs`.

## Commands

Invocation pattern:

```bash
node <skill-dir>/scripts/cli.mjs <command> '<json_params>'
```

| Command | Purpose | Required fields |
|---|---|---|
| `account-info` | Get Spot account information | none |
| `ticker-price` | Get symbol ticker price | `symbol` |
| `order-place` | Place a Spot order | `symbol`, `side`, `type`, and quantity-style field |
| `order-status` | Get order status | `symbol` + `orderId` or `origClientOrderId` |
| `decode-qr` | Decode QR code(s) from image file or URL | one of `imagePath`/`image`/`path` OR `imageUrl`/`url` |

## Example usage

```bash
node <skill-dir>/scripts/cli.mjs account-info '{}'
node <skill-dir>/scripts/cli.mjs ticker-price '{"symbol":"BTCUSDT"}'
node <skill-dir>/scripts/cli.mjs order-place '{"symbol":"BTCUSDT","side":"BUY","type":"MARKET","quoteOrderQty":"25"}'
node <skill-dir>/scripts/cli.mjs order-status '{"symbol":"BTCUSDT","orderId":"123456"}'
node <skill-dir>/scripts/cli.mjs decode-qr '{"imagePath":"/tmp/deposit-qr.png"}'
node <skill-dir>/scripts/cli.mjs decode-qr '{"imageUrl":"https://example.com/qr.png"}'
```

## Safety notes

- For production order placement, require explicit user confirmation before running `order-place`.
- Never print or persist raw API credentials.
- Prefer `--profile <name>` isolation when managing multiple Binance accounts.
