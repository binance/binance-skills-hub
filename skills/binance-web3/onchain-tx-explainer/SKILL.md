---
name: onchain-tx-explainer
description: |
  Explain what an on-chain transaction actually did: the called method, native value, gas paid,
  every token/NFT transfer and every approval it granted, plus a plain-language summary.
  Read-only over public RPC — no key, no account, no signing.
  Use for: "what did this transaction do", "explain tx 0x…", "decode this calldata",
  "did this approve unlimited spending", "did my mint actually transfer the NFT",
  "what does this contract call mean", "check this tx before I trust it".
metadata:
  author: solukci
  version: "1.0"
  license: MIT
---

# On-chain Transaction Explainer

## Overview

Two read-only commands that turn a raw hash or raw calldata into the facts a user can check:

| Command | Input | Output |
|---------|-------|--------|
| `tx` | chain + transaction hash | status, method, native value, gas paid, transfers, approvals, warnings, summary lines |
| `calldata` | chain + `to` + `data` | method, decoded arguments, byte length, summary line |

Everything comes from a public RPC endpoint and on-chain reads (`symbol()`, `decimals()`, ERC-165
`supportsInterface`). There is no wallet connection, no credential, and nothing is signed or broadcast.

Use it when a user asks what a transaction did, before they trust an approval they already signed, or
when they paste calldata and want the arguments decoded.

## When to Use This Skill

| User intent | Command |
|-------------|---------|
| "What did this transaction do?" / "explain tx 0x…" | `tx` |
| "Did that approval give unlimited spending?" | `tx` (see `approvals[].unlimited` and `warnings`) |
| "Did the mint actually land in my wallet?" | `tx` (see `transfers[]` with `standard: "erc721"`) |
| "Decode this calldata before I sign it" | `calldata` |
| "Why did this transaction cost so much gas?" | `tx` (see `gas.used`, `gas.priceGwei`, `gas.fee`) |

## Supported Chains

| Chain | `chain` value | chainId |
|-------|---------------|---------|
| BNB Smart Chain | `bsc` | 56 |
| Ethereum | `ethereum` | 1 |
| Base | `base` | 8453 |
| Arbitrum One | `arbitrum` | 42161 |
| Polygon PoS | `polygon` | 137 |
| Robinhood Chain | `robinhood` | 4663 |

`chain` is required; the numeric chainId is accepted too. Several public RPC endpoints are tried in
order for each chain, so a single endpoint outage does not fail the command.

## How to Call the CLI

```bash
node <skill-dir>/scripts/cli.mjs tx '{"chain":"bsc","hash":"0x…"}'
node <skill-dir>/scripts/cli.mjs calldata '{"chain":"bsc","to":"0x…","data":"0x…"}'
```

Arguments are one JSON object string. Output is JSON on stdout; on failure the process exits non-zero
and writes `{"success":false,"error":{"name":…,"message":…}}` to stderr.

## Reading the Result

- `call.name` is only filled for selectors in the built-in table (ERC-20 `transfer`/`approve`/
  `transferFrom`, ERC-721 `safeTransferFrom`/`setApprovalForAll`, common `mint`/`deposit`/`withdraw`).
  Anything else is reported as `kind: "contract-call"` with the raw selector — the CLI never guesses a
  signature it cannot verify, so an agent must not invent one either.
- `transfers[]` is derived from `Transfer` logs. `standard` separates ERC-20 from ERC-721; `mint` and
  `burn` mark transfers from or to the zero address.
- `approvals[]` is derived from `Approval` logs. `unlimited: true` means the allowance equals the
  maximum uint256, and the same finding appears in `warnings[]`.
- Fees are the actual receipt values: `gas.used × gas.priceGwei`, not an estimate.
- `status` is the receipt status. A successful transaction is not a safe one — see Rules.

## Rules

- **Read-only.** Never ask for a private key, seed phrase or signature for this skill. It cannot sign.
- **Report facts, not verdicts.** This is not a security audit. Say what happened; do not call a
  contract or token safe, and do not recommend buying, selling or holding anything.
- **A successful transaction can still be malicious.** When `status` is `success` and the decoded
  action granted an approval or moved a user's tokens, describe the effect and let the user decide.
- **Unlimited approvals deserve an explicit sentence.** Quote `approvals[].spender` and the token, and
  note that the allowance stays until it is revoked.
- **Never fill in an unknown selector.** If `call.name` is null, report the selector and byte length
  and say the method is not in the local table. Do not query a signature database and present a guess
  as fact.
- **Pending is not success.** A missing receipt means the transaction is still pending; say that
  instead of reporting a result.
- **Do not reuse this output as a gas estimate.** It reports gas already spent. Use a gas-quality
  source for a new transaction.
- **Redact when quoting.** When showing a decoded transaction outside the conversation, shorten
  addresses; full addresses are fine in the conversation that asked about them.

## Limits

- EVM chains only; Solana transactions are not decoded by this skill.
- Only the selectors listed above are named. Nested calls inside a multicall are not recursed into —
  the token movements and approvals they produce still appear in `transfers[]` and `approvals[]`.
- Token symbols come from `symbol()` on chain, so a scam token can present any symbol. Never treat the
  symbol as proof of identity; compare the token contract address.

## Full CLI Reference

See [`references/cli.md`](references/cli.md) for parameter tables, every return field and sample
responses.
