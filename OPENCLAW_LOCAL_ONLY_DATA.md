# OpenClaw Local-only Data Structure

> This document describes a **local-only, read-only** metadata layout for a Binance CLI integration with OpenClaw. It is an operational safety guide, not an authentication guide, trading guide, or transaction workflow.

## Purpose and scope

The `openclaw/.data/` directory is reserved for metadata that must stay on the operator's device. It is deliberately separate from published skills and documentation so that a repository can describe its safety model without publishing account identifiers, wallet addresses, credentials, QR payloads, or transaction details. The Skills Hub repository stores skills as structured `SKILL.md` files; local runtime state belongs outside those published skill directories.[1]

The directory does **not** authenticate a Binance CLI session. A file named `login.data` is only a local state marker and must never contain an API key, secret, session token, password, account identifier, or wallet address.

| Path | Local purpose | Safe summary data | Data that must never be stored or published |
|---|---|---|---|
| `openclaw/.data/login.data` | Records local read-only connection state. | Schema version, `read_only` mode, non-sensitive status label. | API keys, secrets, tokens, passwords, account IDs, wallet addresses. |
| `openclaw/.data/alpha/alpha.data` | Records non-transactional Alpha scan metadata. | Schema version, scan timestamp, ticker references, masked reference indicator. | Full account IDs, order IDs, amounts, recipient addresses, credentials. |
| `openclaw/.data/qrcode/*.data` | Retains a local QR scan summary. | Hashes, source count, safety classification, reference-only ticker labels. | Raw QR payloads, transfer requests, wallet addresses, amounts, recipients. |
| `openclaw/.data/binance/trade.alhfa` | Holds an inactive reference-only marker. | Schema version, inactive state, read-only classification. | Orders, trade instructions, credentials, balances, account or wallet identifiers. |
| `openclaw/.data/transfer.data` | Holds a non-executable transfer metadata summary. | Schema version, validation state, local-only classification. | Sender/recipient addresses, amounts, token instructions, transaction IDs, credentials. |
| `openclaw/.data/skills/bnb-hub/status.data` | Records offline BNB Hub status metadata. | Schema version, `offline` or `read_only` state. | RPC endpoints, streams, credentials, transaction payloads, account or wallet identifiers. |

## Required protections

Every file in `openclaw/.data/` is **local-only**. It must be covered by repository ignore rules and use file permission `600`, so that only the local owner can read or change it. A status or schema check may report a masked value or a boolean result, but it must not print local metadata contents.

| Control | Required behavior | Rationale |
|---|---|---|
| Git exclusion | Keep `.data` files and descendants untracked; reject them in CI if added to a commit. | Prevents accidental publication of runtime metadata. |
| File permission | Set `chmod 600` on every local data file. | Limits local filesystem access to the owning user. |
| Schema validation | Accept only declared non-sensitive keys and reject credential, wallet, account, amount, recipient, order, and transaction fields. | Maintains a small, auditable metadata surface. |
| Output minimization | Return a status, count, hash, or masked reference only. | Avoids exposing local values through logs or user interfaces. |
| Offline validation | Run local schema checks without fetching from Binance or a blockchain RPC. | Makes verification repeatable without creating external activity. |

## Read-only operating model

OpenClaw must treat this directory as metadata only. It must not infer user intent to trade, transfer, withdraw, sign, pay, or broadcast a transaction from any file placed in `openclaw/.data/`. The supported profile permits only explicitly allowlisted public read operations; mutation methods and financial-action language remain blocked.

The following command pattern validates local structure without displaying its contents:

```bash
export PATH="/home/ubuntu/.bun/bin:$PATH"
cd /home/ubuntu/binance

bun run account:check
bun run qrcode:check
bun run alpha:check
bun run transfer:check
bun run bnb:status:check
bun run openclaw:mainnet:check
```

If a check fails, resolve the schema or local file-permission issue. Do not replace it with a credential, do not submit a transaction, and do not upload the file for troubleshooting.

## Safe operational checklist

Before working with a new local metadata file, confirm that it lives below `openclaw/.data/`, is ignored by Git, and has mode `600`. Validate it using the matching local checker, then verify the OpenClaw read-only guardrail. When a user interface displays status, expose only non-sensitive summary fields such as `available`, `validated`, `read-only`, or a count of reference-only entries.

> A filename ending in `.data` does not authorize a financial action. It is a local metadata container only.

## References

[1]: ./README.md "Binance Skills Hub README"
