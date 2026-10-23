# Binance-CLI Sandbox Fix — Timeout Patch

> Working document for the shared branch `feature/bnb-hub-integration` between `cripto-web3/binance-skills-hub` and `cripto-web3/bnb-hub`.

## Problem

`binance-cli` (v1.3.0) fails on every public endpoint inside the sandbox with the message
`Request failed after 3 retries`, even though plain `curl`, native `fetch`, and the `axios`
package all reach `api.binance.com` without any problem.

## Root cause

The failure is **not** a network or authentication issue. It is caused by the default HTTP
request timeout baked into `@binance/common` (the shared connector library used by
`@binance/spot` and all other Binance connectors):

```js
// @binance/common/dist/index.mjs — ConfigurationRestAPI
this.baseOptions = {
  timeout: param.timeout ?? 1e3,   // <-- 1000 ms default
  // ...
};
```

In this sandbox the round-trip latency to `api.binance.com` is typically **1.5–5 seconds**
(first request in a sequence can take even longer due to TLS/connection warm-up). Every
request therefore aborts well before a response arrives, and the built-in retry loop
(`retries: 3`, `backoff: 1000 ms`) exhausts its attempts and surfaces as
`Request failed after 3 retries`.

An additional complication: the ESM bundle (`@binance/common/dist/index.mjs`) calls
`globalAxios.request(...)`, while a separate CJS bundle (`dist/index.js`) exists with its
own copy of the retry logic. Patching only one of them does nothing if the runtime loads
the other, so the fix must be applied to the exact file the ESM entry point imports
(`exports: { "import": "./dist/index.mjs" }`).

## Fix

Patch `node_modules/@binance/binance-cli/node_modules/@binance/common/dist/index.mjs`:

1. Raise the default REST request timeout from `1e3` (1000 ms) to `15000` ms.
2. Optionally replace the `await globalAxios.request(...)` call inside
   `httpRequestFunction` with a native `fetch` + `AbortController` using the same timeout,
   which removes the bundled axios adapter chain (`["xhr", "http", "fetch"]`) from the
   hot path entirely.

### Reproduction and verification

```bash
# Before the patch
$ binance-cli spot ticker --symbol BTCUSDT
Request failed after 3 retries

# After the patch (Node v26.7.0 or v22.13.0, both verified)
$ binance-cli spot ticker --symbol BTCUSDT
{
  "symbol": "BTCUSDT",
  "priceChange": "7763.08000000",
  "priceChangePercent": "12.038",
  ...
}

$ binance-cli spot ping        # exit 0
$ binance-cli spot exchange-info
{ "timezone": "UTC", ... }
```

## Environment notes

| Item | Value |
| --- | --- |
| CLI version | `@binance/binance-cli@1.3.0` |
| Node.js (original sandbox) | v22.13.0 |
| Node.js latest (installed) | v26.7.0 (Current) — requires `libatomic1` on Ubuntu 24.04 |
| Latest LTS available | v24.19.0 (Krypton) |
| Default adapter chain in bundled axios | `["xhr", "http", "fetch"]` |
| Default retries / backoff | 3 / 1000 ms |

Notes on Node.js 26: the binary needs `libatomic.so.1` (`sudo apt-get install -y libatomic1`)
before it starts. Global packages installed under Node 22 are **not** shared with Node 26,
so `binance-cli` must be reinstalled after switching versions, and the timeout patch must
be re-applied to the fresh `node_modules` copy.

## Recommendations

A permanent fix upstream would be either a higher default `timeout` (e.g. 30000 ms) in
`ConfigurationRestAPI`, or making the fetch-based path the default for Node environments.
Until then, this patch script (`scripts/patch-binances-cli-timeout.py`, added in this
branch) can be run after every `npm install -g @binance/binance-cli`.
