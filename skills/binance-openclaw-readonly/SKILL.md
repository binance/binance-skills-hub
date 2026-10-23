---
name: binance-openclaw-readonly
description: Enforce a Binance Mainnet read-only boundary for OpenClaw. Use when an agent must inspect explicitly allowed market, account, order-history, or trade-history data without placing orders or moving assets.
metadata:
  version: 1.0.0
  author: cripto-web3
license: MIT
---

# Binance OpenClaw Read-Only

Use this skill only for an OpenClaw workflow that is deliberately configured as **read-only**. This skill is a policy boundary, not an authentication method and not a trading interface. An account identifier alone never authenticates an API request.

> **Default decision:** If a request is not explicitly listed as permitted below, reject it. Do not try a different endpoint, method, CLI subcommand, or on-chain route to work around the policy.

## Permitted scope

Allow only `GET` requests for the following Binance Spot REST paths. Read the API documentation for the exact response fields and parameters before making any authenticated read request.[1]

| Purpose | Permitted paths |
| --- | --- |
| Service and market metadata | `/api/v3/ping`, `/api/v3/time`, `/api/v3/exchangeInfo` |
| Public market data | `/api/v3/depth`, `/api/v3/trades`, `/api/v3/aggTrades`, `/api/v3/klines`, `/api/v3/avgPrice`, `/api/v3/ticker/24hr`, `/api/v3/ticker`, `/api/v3/ticker/bookTicker` |
| Account and historical reads | `/api/v3/account`, `/api/v3/account/commission`, `/api/v3/order`, `/api/v3/openOrders`, `/api/v3/allOrders`, `/api/v3/myTrades` |

For authenticated account reads, use a separate credential whose exchange permissions are restricted to reading account information. Keep credentials in the agent platform's protected secret store; never put them in prompts, chat output, source control, `.data`, `login.data`, shell history, or a skill file.

## Non-negotiable blocks

Reject all write methods, including `POST`, `PUT`, `PATCH`, and `DELETE`. Also reject every request that creates, changes, cancels, or funds a transaction, including spot or futures orders, convert requests, transfers, withdrawals, payments, C2C actions, loans, staking subscriptions, on-chain signing, and any method not in the allowlist.

This block also applies when another installed skill exposes such a function. Installing a skill does **not** grant it execution authority in a read-only OpenClaw workflow.

| Request category | Required response |
| --- | --- |
| Order, cancellation, conversion, transfer, withdrawal, payment, or signing request | Decline execution. State that the active workflow is read-only. |
| Unlisted endpoint or non-GET method | Decline execution. Do not substitute an alternative route. |
| Credential sent in chat or file content | Do not repeat or store it. Direct the user to protected secret management. |
| Portfolio update from a QR code or image | Do not save automatically. Present extracted candidates and require explicit confirmation in the consuming application. |

## Operational checks

Before running an allowed request, verify that the base URL is an intended Binance API host, the method is `GET`, and the pathname exactly matches the allowlist. Record only non-sensitive operational metadata needed for auditing, such as the request category, timestamp, outcome, and whether a response was received. Do not log API headers, signatures, secret values, full account identifiers, QR payloads, or private response data.

If a local validator is available, run it before enabling the workflow. A compliant validator must make zero network requests while it checks the configuration, and it must fail closed for an absent or malformed read-only policy.

## References

[1]: https://developers.binance.com/en/docs/binance-spot-api-docs/rest-api "Binance Spot API — REST API"
