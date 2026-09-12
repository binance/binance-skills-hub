---
name: usdt-erc20-transfer
description: |
  All-in-one USDT (ERC-20) transfer on Ethereum Mainnet with Binance signed-API integration.
  Covers balance check, ECDSA secp256k1 transaction signing, HMAC-SHA256 Binance API signing,
  retry logic, and confirmation prompt before broadcast.
  Use for: "transfer USDT on Ethereum", "sign a token transfer with private key",
  "check USDT balance before sending", "Binance signed API request", "send all USDT to a recipient address".
metadata:
  author: cripto-web3
  version: "1.0"
---

# USDT ERC-20 Transfer Skill (Ethereum + Binance Signing)

## Overview

This skill transfers Tether (USDT, ERC-20) on **Ethereum Mainnet** using an ECDSA secp256k1 private key,
combined with **Binance signed-API authentication** (HMAC-SHA256 with secret key) for exchange-side operations.
All sensitive values are read from a `.env` file — never hard-coded.

## Required .env Variables

| Variable | Purpose |
|----------|---------|
| `PRIVATE_KEY` | ECDSA private key (0x + 64 hex) of the sender address |
| `ETH_ADDRESS_SENDER` | Sender Ethereum address (must match PRIVATE_KEY) |
| `ADDRESS_RECEIPT` | Recipient address |
| `ETH_TOKENCONTRACT_USDT` | USDT contract (`0xdAC17F958D2ee523a2206206994597C13D831ec7`) |
| `BINANCE_API_KEY` | Binance API key (for Binance signed requests) |
| `BINANCE_SECRET_KEY` | Binance secret key (HMAC-SHA256 signing) |
| `ETH_RPC_URL` | Optional — public Ethereum RPC URL |

## Safety Checks (Built In)

Before any broadcast, the scripts verify: recipient address format + EIP-55 checksum + non-zero,
private key ownership of the sender (key pair recovery), USDT/ETH balance sufficiency, gas affordability,
and require an interactive `y/n` confirmation for `--send` mode.

## Usage

```bash
cd skills/binance-web3/usdt-erc20-transfer
bun install        # viem, dotenv, keccak256, axios

# All-in-one: Binance signed API + ECDSA USDT transfer
bun run scripts/binance_usdt_transfer.ts              # dry-run (sign + verify, no broadcast)
bun run scripts/binance_usdt_transfer.ts --send       # real broadcast (confirmation prompt)
bun run scripts/binance_usdt_transfer.ts --amount=50000000  # fixed amount

# Ethereum only (ECDSA secp256k1 signing)
bun run scripts/ecdsa_sign_usdt.ts                    # dry-run
bun run scripts/ecdsa_sign_usdt.ts --send             # real broadcast
bun run scripts/ecdsa_sign_usdt.ts --amount=25000000  # fixed amount

# Binance only (HMAC-SHA256 signed API requests)
bun run scripts/binance_secret_sign.ts account        # signed GET /api/v3/account
bun run scripts/binance_secret_sign.ts withdraw       # signed withdraw request (demo signature only)
```

## Results

Successful operations append a JSON record to the `.data` file (chmod 600), including
tx hash, Etherscan URL, Binance account balances, and signing metadata with timestamps.

## References

- [references/cli.md](references/cli.md) — full CLI reference and option list
