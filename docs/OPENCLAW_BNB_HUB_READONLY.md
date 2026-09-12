# OpenClaw BNB Hub — Read-only Profile

## Purpose

This document defines a conservative BNB Chain metadata-review profile for OpenClaw. It is intended for describing, reviewing, or validating public chain and token metadata. It is not a wallet integration, transaction workflow, trading tool, or persistent monitoring service.

## Permitted data

The profile may retain only the minimum public context needed to review a separately approved read-only lookup.

| Field | Permitted use |
|---|---|
| `chain_id` | Identifies the explicitly selected public chain. |
| `block_number` | Records a public block height. |
| `block_timestamp` | Records the time associated with a public block. |
| `block_hash_short` | Stores only a truncated hash for display or comparison. |
| `token_label` | Records a public token label when the chain and source are explicit. |
| `contract_address` | Records a public contract identifier only when required for token metadata review. |
| `source` | Names the approved public source of the lookup. |
| `connection_state` | Communicates `offline`, `review-pending`, or a separately approved read-only state. |

## Required safeguards

The profile must begin in the `offline` state. Before any online query is enabled, reviewers must approve the provider, request method, requested fields, retention period, and failure-handling policy. A read-only query must be limited to the approved information and must not expand into account discovery or wallet monitoring.

The profile must use a fixed allowlist. It must reject unapproved URLs, dynamically discovered tools, background jobs, scheduled polling, WebSocket subscriptions, and automatic export flows unless each capability is separately reviewed and approved.

## Prohibited data and operations

| Category | Prohibited items |
|---|---|
| Credentials | Private keys, seed phrases, API keys, session tokens, login data, or credentials in environment variables. |
| Account data | Binance IDs, full wallet addresses, recipients, amounts, balances, account histories, or portfolio records. |
| Transactions | Signing, sending, approvals, swaps, transfers, deposits, withdrawals, payments, or order placement. |
| Network writes | JSON-RPC and REST write methods, including `eth_sendTransaction`, `eth_sendRawTransaction`, signing methods, and approval methods. |
| Automation | Autonomous monitors, streaming workers, schedulers, or exports to external services. |

## Publication and local-only boundary

Only this policy document and other content that contains no local metadata may be published. Operational status files, scan results, account references, transfer metadata, login files, and all `.data` files remain local-only and must be ignored by Git.

## Validation checklist

Before enabling any approved read-only lookup, validate the following conditions.

- The request is an explicitly reviewed read-only request and is present in the fixed allowlist.
- The request does not contain credentials, account identifiers, recipient data, an amount, or a transaction payload.
- The connection state changes only after the approved provider and request scope have been recorded.
- Any external publication is reviewed separately and does not include local-only metadata.
- The OpenClaw guardrail rejects trading, transfers, withdrawals, payments, approvals, signing, and network writes.

> This profile is policy documentation only. It does not grant network access, supply a provider URL, create a wallet connection, or authorize a transaction.
