# SolonPad agent API reference

Base: `https://solonpad.fun`. The API is a convenience view over an on-chain indexer —
`VERIFY.md` in the pinned repo (`github.com/solonlend/solonpad-skill`) shows how to
spot-check any figure against the chain before trusting it with value. Poll politely
(Cloudflare-fronted; send a real User-Agent).

## GET /api/launches?chain=arc|rh

Full indexed list: `{ rows, blockNumber, indexing }`. Each row carries `source` (which
pad created the pool), `hook`, `poolKey`, `curve` (curve launches), `price`,
`change24h`, `originDomain`. Covers SolonPad's own launches **and** external pads
(Pons, pools.trade, Minara, Azex, open v4 pools). External sources are indexed from the
moment of integration onward (no historical backfill); rows may be marked `truncated`.

## GET /api/changes?chain=arc|rh[&since=cursor]

Incremental discovery feed.

- No `since` → `{ events: [], cursor }` (initialization).
- Poll every 15–60 s. `events` are `new_launch` records (v1; more event types later).
- `cursor` is opaque — always keep the newest.
- Empty `events` returns the same cursor.
- HTTP `410` = cursor expired: refetch without `since`, continue from the fresh cursor,
  and reconcile against `/api/launches` if completeness matters.
- `truncated: true` = more waiting: poll again immediately.

## GET /api/factsheet/{token}?chain=arc|rh

One-call due-diligence data: `{ asof, identity, age, market, fees, tradeable,
structure, flags }`.

**Tri-state fields.** Each group lists its `unavailable` and `notApplicable` keys:

- `null` **and** listed in `unavailable` → not known. **Never read it as zero.**
- Listed in `notApplicable` → this token cannot have the field (e.g. a curve token has
  no hook tax).
- Neither state may add or subtract score in the verdict below.

`fees` discloses every cost before a trade: `routerFeeBps`, the pool hook's
`buyTaxBps`/`sellTaxBps` where present, `lpFeeBps`. `tradeable.value=false` comes with a
`reason` — believe it; the router reverts anyway.

## Verdict — rule-based score

Start from 100. Apply the **worst matching row only** per field; different fields stack.
Score only fields the factsheet actually returned; an `unavailable` field skips its row
and counts in coverage.

| Field | Condition | Deduct |
|---|---|---|
| `structure.holderCount` | < 5 / < 20 / < 100 | −20 / −10 / −4 |
| `tradeable.value` | false | −25 |
| `market.volume24h` | == 0 | −12 |
| `market.trades24h` | < 5 | −6 |
| `fees` max(buyTaxBps, sellTaxBps) | > 1000 / > 500 | −20 / −8 |
| `age` | < 10 min | −10 |
| `market.liquidity` | < $500 / < $2K | −20 / −8 |
| `flags.cloneNameHits` | > 0 | −10 |

- **Coverage** = executed rows ÷ 8; report it next to the score. Below 5/8, label the
  score indicative only.
- Output every deduction as `field → measured value → points`.
- Close every verdict with: *"rule-based read of indexed data, not advice."*
- Grades: ≥80 active · ≥60 stagnant, look closer · <60 avoid or wait. A score is a
  liveness/structure read, **not** a statement that any token is safe or recommended.

## Execution rails — `[FINANCIAL EXECUTION]`

Moving value requires the principal's explicit authorization; otherwise stay read-only.
With it, every step is mandatory:

1. **Gate**: refuse while `tradeable.value != true`.
2. **Estimate**: `amountIn × spot` minus hook tax minus router fee — list each line,
   do not net silently.
3. **minOut** = estimate × (1 − slippage), slippage ≤ 5% unless the principal set
   another. Never send `minOut = 0`.
4. **Approve exact amounts** (quote side for buys, token side for sells; on Arc the
   native-USDC ERC-20 view is the same balance as gas — 6 decimals vs 18, convert
   explicitly).
5. **Reconcile the receipt**: received vs minOut vs estimate. v4 swaps refund unspent
   input on partial fills — check amounts received, not tx success.
6. On revert, decode the selector with the repo's `errors.json`; an unknown selector
   means a third-party contract reverted, not SolonPad's.
