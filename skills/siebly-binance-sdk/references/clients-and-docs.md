# Clients, authentication, and docs

Supporting notes for the Siebly Binance SDK skill. Prefer this file for constructor and documentation detail, and keep generated application code aligned with the current typings in the installed `binance` package.

## Package

- Name: `binance`
- Licence: MIT
- Install: `npm install binance`
- npm: https://www.npmjs.com/package/binance
- Source: https://github.com/sieblyio/binance
- Guide: https://siebly.io/sdk/binance/javascript
- Endpoint map: https://github.com/sieblyio/binance/blob/master/docs/endpointFunctionList.md
- Examples: https://github.com/sieblyio/binance/tree/master/examples
- Official API reference: https://developers.binance.com

The skill version is independent of the npm package version. Always install the current published package.

## REST clients

Import from `binance`:

```ts
import {
  MainClient,
  USDMClient,
  CoinMClient,
  PortfolioClient,
} from 'binance';
```

| Class | Product group |
| --- | --- |
| `MainClient` | Spot, cross and isolated margin, wallet, convert, sub-accounts, and other main REST APIs |
| `USDMClient` | USD-M futures |
| `CoinMClient` | COIN-M futures |
| `PortfolioClient` | Portfolio margin |

Common constructor options include `api_key`, `api_secret`, `testnet`, and `demoTrading`. Credentials are optional for public endpoints.

## WebSocket clients

```ts
import { WebsocketClient, WebsocketAPIClient } from 'binance';
```

| Class | Use for |
| --- | --- |
| `WebsocketClient` | Event-driven market-data and user-data streams, including optional WebSocket API requests through `sendWSAPIRequest()` |
| `WebsocketAPIClient` | REST-like promise calls over the WebSocket API |

User-data stream helpers can create and refresh listen keys. Do not build a second listen-key keep-alive unless the installed typings show that you must.

Useful events include message handlers on the websocket client (including formatted-message handlers where enabled) and a reconnect event after a dropped connection is restored. Confirm the exact event names in the installed typings before coding.

## Authentication

Binance signed requests support:

- HMAC, with an API key and secret
- RSA, when a private key is supplied
- Ed25519, when a private key is supplied (required for WebSocket API login; otherwise each request is signed)

Do not paste keys into chat or source control. Document environment variable names in the project README, for example `BINANCE_API_KEY` and `BINANCE_API_SECRET`.

## Testing environments

- `demoTrading: true` uses production market data with simulated trading, for spot, USD-M futures, and COIN-M futures.
- `testnet: true` points the client at Binance testnet. Market data there is simulated and is not a reliable basis for strategy evaluation.

Only enable these flags when the user asked for that environment.

## Official Binance docs

When you need request parameters or exchange behaviour, prefer the official developer docs for the product in scope, then confirm the matching SDK method in the endpoint map or typings:

- https://developers.binance.com/docs/binance-spot-api-docs/rest-api/general-endpoints
- https://developers.binance.com/docs/derivatives
