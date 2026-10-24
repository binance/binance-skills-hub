# SolonPad V3 agent API reference

Base: `https://solonpad.fun`. The API is a convenience view over an on-chain indexer —
the pinned repo (`github.com/solonlend/solonpad-skill`, `VERIFY.md`) shows how to
spot-check any figure against the chain before trusting it with value. Poll politely
(Cloudflare-fronted; send a real User-Agent). Every `/api/v3` response is wrapped in
`{chainId, asOfBlock, indexerLag, stale, tickers, data}`; amounts are base-unit decimal
strings — parse with BigInt.

## Discovery and coin state

- `GET /api/v3/coins` — every V3 coin: token, poolId, quote kind, settlement kind,
  creator, swap count, readiness.
- `GET /api/v3/coins/{coin}/rounds` — the coin's next holder-dividend round: today's
  accrued budget, sealed entries, the round minimum, and why it is waiting.
- `GET /api/v3/pools/{coin}/fees` — creator rights: owner of the fee NFT, accrued,
  claimable, paid.

## Dividends and payouts

- `GET /api/v3/pools/{coin}/rewards/{account}` — an account's holder credits: each credit
  with its round, ready/staged/paid amounts, and whether the next daily push (00:10 UTC,
  ≥ $2 threshold) will include it.
- `GET /api/v3/payouts` — every staged/paid/blocked transfer and the push schedule.
- `GET /api/v3/reports?kind=&limit=` — payout reports: each stock-buying round with every
  Arc and home-chain transaction step, so a reader can audit a round end to end.
- `GET /api/v3/revenue/daily` · `/revenue/summary` — fees per day split into the six
  buckets, plus hook volume.

## Stock layer

- `GET /api/v3/stocks/reserves/assets` — proof of reserves per stock: token supply on
  Arc, vault balance on the stock's home chain, covered flag, and the exact `cast`
  command to re-check each number yourself.
- `GET /api/v3/stocks/assets` — each listed stock's status, price source and caps.
- `GET /api/v3/oracle/prices` · `/stocks/pool-prices` — oracle status (Stale while US
  markets are closed) and the live venue pool prices that orders actually fill at.
- `POST /api/v3/stocks/quote` — a buy/sell quote: service fee, message fee, minOut,
  gross floor, and the route comparison.
- `GET /api/v3/orders?user=` · `/orders/{id}` — stock orders with every step on both
  chains (order amounts on the home chain are 6-decimal; Arc amounts are 18-decimal).

## Staking and Desk

- `GET /api/v3/staking/stats` · `/staking/{account}` — staking totals; an account's
  stake in the current pool and the original pool (labelled `legacy`).
- `GET /api/v3/desks` · `/desks/{id}` · `/accounts/{a}/desks` — Desk card supply, mint
  price, and per-card dividend credits.
- `GET /api/v3/buybacks/ledger` — buyback lots and the burn-sink totals.

## Config and meta

- `GET /api/v3/config` — live parameters: fee split, order size limits, push threshold,
  eligibility mode.
- `GET /api/v3/overview` · `/developers` — TVL inputs; every contract address with its
  ABI hash.

## Rules for the agent

1. **Trust the chain over the API.** Any mismatch means stop using the endpoint for value
   decisions; the repo's verifier re-derives the critical numbers read-only.
2. **Financial execution needs the principal's explicit authorization.** Quote first,
   itemize every fee line, always set `minOut`/`maxIn`/deadline, approve exact amounts,
   reconcile the receipt. Never send `minOut = 0`.
3. **Closed-market semantics must be disclosed**: stock orders fill at the live venue
   pool price even when the official market is closed; the signed `minOut` is the only
   price floor.
4. On revert, decode the first 4 bytes of the return data with the repo's `errors.json`
   (421 selectors); an unknown selector means a third-party contract reverted.
