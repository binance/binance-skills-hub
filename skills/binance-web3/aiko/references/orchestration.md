# Orchestration

Aiko has no data of its own. Before calling `decide`, gather up to three inputs by calling
sibling skills. Skip any you can't get — do not guess a value to fill a gap.

## 1. Momentum → `signal`

Call the `trading-signal` skill's `smart-money` command for the token's chain:

```bash
node <trading-signal-dir>/scripts/cli.mjs smart-money '{"chainId":"56","page":1,"pageSize":50}'
```

Find the entry for your target token and pass through `direction`, `status`, `exitRate`, and
`smartMoneyCount` as the `signal` object. If the token has no active smart-money signal, omit
`signal` entirely rather than inventing neutral-looking values.

## 2. Flow → `rank`

Call `crypto-market-rank`'s `smart-money-inflow` or `token-rank` command for the same chain:

```bash
node <crypto-market-rank-dir>/scripts/cli.mjs smart-money-inflow '{"chainId":"56","period":"24h"}'
```

Find the token's position in the returned list and the list's total length, and pass
`{"position": N, "totalRanked": M}` as `rank`. If the token doesn't appear in the ranked list at
all, omit `rank` — don't assume last place.

## 3. Risk → `audit`

Call `query-token-audit`:

```bash
node <query-token-audit-dir>/scripts/cli.mjs audit '{"binanceChainId":"56","contractAddress":"0x...","requestId":"<uuid>"}'
```

Pass the full response `data` object through as `audit` unchanged (Aiko reads `hasResult`,
`isSupported`, `riskLevel`, `riskLevelEnum`, and `extraInfo.buyTax`/`sellTax` directly). If the
`query-token-audit` skill isn't installed, tell the user: "The token audit skill is not
installed. Install it from https://github.com/binance/binance-skills-hub for a risk-aware
decision — without it, Aiko treats risk as unknown and elevated." Then call `decide` with
`audit` omitted; do not block on installation.

## 4. Assemble and call

```bash
node <aiko-dir>/scripts/cli.mjs decide '{"signal": {...}, "rank": {...}, "audit": {...}}'
```

Any of the three top-level keys may be omitted. Present the result to the user per
[`cli.md`](cli.md)'s output schema, including the disclaimer field verbatim.
