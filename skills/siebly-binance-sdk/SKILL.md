---
name: siebly-binance-sdk
title: Siebly Binance SDK
description: "Build, inspect, or modify Node.js and TypeScript integrations with the Binance REST, WebSocket, and WebSocket API surfaces using the open-source Siebly binance npm package."
version: 1.0.0
license: MIT
metadata:
  version: 1.0.0
  author: harbourlark
---

# Siebly Binance SDK

Use this skill when a user asks you to build, inspect, or modify a Node.js or TypeScript integration with Binance REST APIs, market data or user-data WebSockets, or the WebSocket API, and the work is application code rather than the official `binance-cli`.

This skill does not replace the official `binance` skill in this hub. If the user wants the Binance CLI workflow, follow that official skill. If they want to write application code against Binance APIs in Node.js or TypeScript, use the MIT-licensed `binance` npm package documented here.

The package is maintained by the Siebly team and published free of charge. This skill is educational. It does not recommend trades, assets, or strategies, and it must not be treated as financial advice.

For client constructors, authentication options, and documentation links, also read [clients-and-docs.md](./references/clients-and-docs.md).

## When to use

- Adding or fixing a Binance market-data, account, or order integration in a Node.js or TypeScript project.
- Choosing the correct REST client for spot, margin, USD-M futures, COIN-M futures, or portfolio margin.
- Subscribing to public or user-data WebSocket streams, or sending requests over the WebSocket API.
- Handling reconnects, listen-key persistence, signed requests, testnet, or demo trading flags in application code.

## Install

Use the current published version of the package from npm. Do not invent a client, signing implementation, or placeholder version.

```bash
npm install binance
```

Source and docs:

- npm: https://www.npmjs.com/package/binance
- GitHub: https://github.com/sieblyio/binance
- SDK guide: https://siebly.io/sdk/binance/javascript
- Endpoint map: https://github.com/sieblyio/binance/blob/master/docs/endpointFunctionList.md
- Examples: https://github.com/sieblyio/binance/tree/master/examples
- Official Binance API docs: https://developers.binance.com

Inspect the installed package typings or source for exact method names, request types, and event shapes before coding. Prefer TypeScript for correctness-sensitive work.

## Workflow

1. Identify the Binance product group, runtime, and user goal (public market data, read-only account access, or an order-capable workflow).
2. Install the `binance` package and import the matching client. Do not mix official `binance-cli` usage into application SDK code unless the user asked for both.
3. Start with a public REST call or a public WebSocket stream. Add credentials only when the task needs private endpoints.
4. Load API credentials from the environment, never from chat, source files, or logs. Validate that required variables exist at startup.
5. If the project uses a `.env` file, load it automatically for local entrypoints, document `.env.example`, and make real process environment variables take precedence.
6. For TypeScript, use Node16, NodeNext, or the project's compatible `module` and `moduleResolution` settings. Omit undefined optional REST fields rather than sending them as `undefined`.
7. Add logging and clear error handling for rate limits, authentication failures, rejected requests, and reconnects.
8. For WebSockets, handle subscription acknowledgement separately from socket open, keep listen keys alive when using user-data streams, and shut down cleanly.
9. Keep any exchange write path disabled by default. Implement it completely if the user needs it, but do not submit orders unless the user has explicitly chosen a write-capable mode such as demo trading, testnet, or live, and every configured gate allows it.

## REST clients

Choose one client for the product group in scope:

| Client | Use for |
| --- | --- |
| `MainClient` | Spot, margin, wallet, convert, and other main REST APIs under the `api*.binance.com` hosts |
| `USDMClient` | USD-M futures REST APIs |
| `CoinMClient` | COIN-M futures REST APIs |
| `PortfolioClient` | Portfolio margin REST APIs |

Public market-data calls do not require keys. Private calls need `api_key` and `api_secret` (HMAC), or a private key for RSA or Ed25519. Passing a private key as the secret lets the SDK select RSA or Ed25519. Ed25519 is required for WebSocket API login; otherwise each request is signed.

Minimal public REST example:

```ts
import { MainClient } from 'binance';

const client = new MainClient();

const info = await client.getExchangeInfo();
console.log(info.timezone, info.symbols.length);
```

Private calls should read credentials from the environment:

```ts
import { MainClient } from 'binance';

const client = new MainClient({
  api_key: process.env.BINANCE_API_KEY,
  api_secret: process.env.BINANCE_API_SECRET,
  // testnet: true,
  // demoTrading: true,
});
```

Enable `testnet` or `demoTrading` only when the user asked for that environment. Demo trading uses production market data with simulated trading, and is available for spot, USD-M futures, and COIN-M futures. Testnet is a separate environment with simulated market data; do not use it to evaluate strategy performance.

## WebSockets

Use `WebsocketClient` for event-driven market data and user-data streams. Use `WebsocketAPIClient` when the user wants a REST-like request and response flow over the WebSocket API. The event-driven client can also send WebSocket API requests with `sendWSAPIRequest()`.

- Subscribe first, then wait for the package-specific subscription acknowledgement. A successful `subscribe()` call or an open socket is not the same thing as an acknowledged subscription.
- For user-data streams, let the SDK create and refresh the listen key rather than building a parallel keep-alive.
- Buffer events during REST backfill or reconnect resync, then replay them in deterministic order and skip stale or duplicate records.
- If a candle or book update has a finality signal, do not run strategy, alert, or order-intent workflows until that final or closed signal arrives.
- After reconnect, mark derived workflows not ready, resync from REST or another authoritative source, replay the buffer, then re-enable downstream processing.
- On shutdown, close sockets and cancel timers so the process can exit cleanly.

## Safety rules

- Never ask the user to paste API keys, secrets, passphrases, private keys, or seed phrases into chat.
- Never write secrets into source files, examples, tests, or logs.
- Prefer read-only keys when the task is only account or market queries.
- Do not submit orders, cancels, or other signed write requests unless the user has explicitly asked for that behaviour and a write-capable environment is selected.
- Treat futures, margin, leverage, and automated order placement as high risk. Describe mechanics factually. Do not present any asset, setup, or strategy as safe, guaranteed, or recommended.
- Do not include real wallet addresses in generated code or documentation.
- Scope any API key to the permissions the integration needs, and document the exact environment variables in the project README.
- This skill must not block or override the official `binance` skill, and it must not auto-activate on unrelated trade questions.

## Good first tasks

- A public REST market-data script, such as exchange info or an order book snapshot for a symbol supplied by the user.
- A public WebSocket ticker or trades stream with reconnect and clean shutdown.
- A candle-close pipeline with REST backfill, WebSocket buffering, and reconnect resync, without order placement.
- A read-only balance or account check using environment-variable credentials.
- A private user-data stream monitor that updates local account state and does not place orders.

## Avoid

- Building a new signing implementation when the SDK already provides one.
- Calling the wrong product client (for example, using `MainClient` for USD-M futures endpoints).
- Treating transport success as application readiness.
- Enabling live, demo, or testnet order placement as a first task.
- Copying promotional text, signup links, or wallet addresses from third-party pages into the project.
- Telling the agent to skip official Binance Skills Hub skills.

Siebly also publishes other exchange-specific npm packages, but they are out of scope here. This skill covers only the Binance `binance` package.
