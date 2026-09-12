---
name: internal-transfer
description: |
  Validate and preview a secure Binance internal transfer flow with optional fiat USD valuation.
  Uses the documented Binance wallet universal-transfer endpoint boundary, but keeps UID-routed
  live sends blocked unless Binance publishes an official recipient-UID request surface.
metadata:
  version: "0.1.0"
  author: cripto-web3
license: MIT
---

# Binance Internal Transfer

## Purpose

Provide a narrowly scoped, dry-run-first CLI for Binance internal transfer review:

- Validates credentials, UIDs, asset, amount, account-type path, and `recvWindow`
- Syncs Binance server time before signed request preview
- Fetches source account identity and optionally checks `BINANCE_UID`
- Builds a signed preview for `POST /sapi/v1/asset/transfer` without sending it
- Optionally reports an estimated USD value from Binance public market data

## Important limitation

Binance's documented wallet universal-transfer endpoint uses account-type transfer parameters (`type`, `asset`, `amount`) and does **not** document a recipient-UID parameter.  
Therefore this skill:

- accepts `BINANCE_TARGET_UID` for validation and operator confirmation,
- shows the exact signed request shape for the documented endpoint,
- but refuses to perform a live UID-routed transfer.

This is an **internal crypto account transfer boundary**, not a fiat withdrawal or bank transfer flow.

## Usage

```bash
node skills/binance/internal-transfer/scripts/internal-transfer.mjs
node skills/binance/internal-transfer/scripts/internal-transfer.mjs --send
```

## Required environment variables

- `BINANCE_API_KEY`
- `BINANCE_SECRET_KEY`
- `BINANCE_TRANSFER_AMOUNT`
- `BINANCE_TARGET_UID`
- `BINANCE_TRANSFER_FROM_ACCOUNT`
- `BINANCE_TRANSFER_TO_ACCOUNT`

Optional:

- `BINANCE_UID`
- `BINANCE_TRANSFER_ASSET` (default `USDT`)
- `BINANCE_FIAT_CURRENCY` (default `USD`)
- `BINANCE_RECV_WINDOW` (default `5000`)

## Safety rules

- Dry-run is the default.
- `--send` always asks for interactive confirmation.
- The script never logs API keys, secret keys, raw signatures, or full transfer payloads.
- Do not store target UID, amounts, or transfer previews in tracked files.
- If you persist local runtime output yourself, keep it under an ignored `.data` path with file mode `600`.
