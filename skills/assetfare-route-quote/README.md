# AssetFare Route Quote skill

This standalone skill adds a read-only AssetFare cross-chain quote evaluator to Binance Skills Hub. It does not modify or depend on Binance Agentic Wallet and does not request wallet permissions.

## Requirements

- Node.js 22 or newer
- Network access to `https://api.assetfare.dev`
- No API key, account, wallet, or additional package

## Usage

From this directory:

```bash
node scripts/route-quote.mjs capabilities

node scripts/route-quote.mjs quote \
  --from-chain solana --from-token USDC \
  --to-chain base --to-token USDC \
  --amount-usd 1000
```

The first command performs one public GET. The quote command performs one public capabilities GET followed by one quote POST containing exactly `from_chain`, `from_token`, `to_chain`, `to_token`, and `amount_usd`.

The client uses a fixed HTTPS origin, rejects redirects, applies a 45-second request timeout, accepts JSON only, and limits each response to 1 MiB and 16,384 chunks. Its bounded lossless parser preserves base-unit integers above JavaScript's safe-number range for exact amount binding. It returns a reduced quote-only projection after validating the ordered provider path and noncustodial boundary.

## Tests

Tests use Node's built-in test runner and mocked `fetch`. They make no network request and no AssetFare POST.

```bash
node --check scripts/route-quote.mjs
node --test scripts/route-quote.test.mjs
```

The suite covers all 76 routes and 168 ordered provider steps against the pinned Core topology digest, plus hostile response mutations, unsafe-integer precision, request-field isolation, USD 1/1,000 guidance, Across classification, response bounds, and error sanitization.

## Scope

This skill exposes only capabilities and quote evaluation. It has no wallet, authentication, session, prepare, signing, submission, or transfer feature.
