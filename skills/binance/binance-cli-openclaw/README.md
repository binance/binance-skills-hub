# Binance-cli OpenClaw

A compact Binance Spot CLI wrapper skill for OpenClaw.

## What it does

This skill provides a single local entry point (`scripts/cli.mjs`) for four common operations:

1. Account info
2. Ticker price lookup
3. Spot order placement
4. Spot order status lookup
5. QR code decoding from local image paths or image URLs

It reuses the existing `binance-cli` authentication/profile model documented in:

- [`../binance/references/auth.md`](../binance/references/auth.md)

## Install / setup

1. Install `binance-cli`.
2. Create/select a profile (or provide env vars supported by `binance-cli`).
3. Install Python dependency for QR decoding:

   ```bash
   pip install opencv-python
   ```

4. Run this wrapper with Node.js.

## Commands

```bash
node scripts/cli.mjs account-info '{}'
node scripts/cli.mjs ticker-price '{"symbol":"BTCUSDT"}'
node scripts/cli.mjs order-place '{"symbol":"BTCUSDT","side":"BUY","type":"MARKET","quoteOrderQty":"25"}'
node scripts/cli.mjs order-status '{"symbol":"BTCUSDT","orderId":"123456"}'
node scripts/cli.mjs decode-qr '{"imagePath":"/tmp/deposit-qr.png"}'
node scripts/cli.mjs decode-qr '{"imageUrl":"https://example.com/qr.png"}'
```

Use `profile` in params to target a non-active profile, for example:

```bash
node scripts/cli.mjs ticker-price '{"symbol":"BNBUSDT","profile":"prod-main"}'
```

## Dry run

To inspect the generated `binance-cli` command without executing it:

```bash
node scripts/cli.mjs ticker-price '{"symbol":"BTCUSDT"}' --dry-run
```

## QR output shape

`decode-qr` always returns JSON and preserves raw payload values:

```json
{
  "success": true,
  "count": 1,
  "results": [
    {
      "raw_value": "bitcoin:bc1q...",
      "recognized_as": ["payment_uri", "wallet_address"]
    }
  ]
}
```

If no QR exists in the image, the command returns:

```json
{
  "success": false,
  "error": "no_qr_found",
  "message": "No QR code found in the provided image"
}
```
