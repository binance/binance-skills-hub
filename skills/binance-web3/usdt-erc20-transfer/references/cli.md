# USDT ERC-20 Transfer — CLI Reference

## binance_usdt_transfer.ts (All-in-One)

| Command | Mode | Description |
|---------|------|-------------|
| `bun run scripts/binance_usdt_transfer.ts` | dry-run | Binance signed API check + ECDSA sign (no broadcast) |
| `bun run scripts/binance_usdt_transfer.ts --send` | send | Full flow with confirmation prompt → broadcast |
| `bun run scripts/binance_usdt_transfer.ts --amount=<USDT>` | dry/send | Transfer a fixed USDT amount (clamped to balance) |
| `bun run scripts/binance_usdt_transfer.ts binance` | dry-run | Binance signed API only (skip Ethereum transfer) |

## ecdsa_sign_usdt.ts (Ethereum Only)

| Command | Mode | Description |
|---------|------|-------------|
| `bun run scripts/ecdsa_sign_usdt.ts` | dry-run | Sign + verify ECDSA transaction (no broadcast) |
| `bun run scripts/ecdsa_sign_usdt.ts --send` | send | Real broadcast after `y/n` confirmation |
| `bun run scripts/ecdsa_sign_usdt.ts --amount=<USDT>` | dry/send | Fixed amount transfer |

## binance_secret_sign.ts (Binance Only)

| Command | Description |
|---------|-------------|
| `bun run scripts/binance_secret_sign.ts account` | HMAC-SHA256 signed request → GET /api/v3/account (real response) |
| `bun run scripts/binance_secret_sign.ts withdraw` | HMAC-SHA256 signed withdraw request (demo — signature only, not broadcast) |

## Signature Schemes

**Ethereum (ECDSA secp256k1):** EIP-1559 transaction signed with `privateKeyToAccount().signTransaction()`; signature (v, r, s) recoverable to the sender address.

**Binance (HMAC-SHA256):** `signature = HMAC-SHA256(queryString, SECRET_KEY)` with `timestamp` and `recvWindow` parameters; sent via `X-MBX-APIKEY` header.

## Output (.data file)

Each run appends to `.data` (chmod 600): `address_receipt`, `binance_signed_account`, `ethereum_usdt_transfer` (tx hash + Etherscan URL), etc.

## Key Mismatch Behavior

If `PRIVATE_KEY` does not derive to `ETH_ADDRESS_SENDER`, the script stops immediately with a clear error.
The derived key is never used for broadcast in that case.
