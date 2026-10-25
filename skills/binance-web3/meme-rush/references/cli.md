# meme-rush — CLI Reference

Complete reference for every command in `scripts/cli.mjs`.

**Invocation pattern:** `node <skill-dir>/scripts/cli.mjs <command> '<json_params>'`
**Exit codes:** `0` success · `1` usage/upstream error · `3` network failure

**Supported chains:** BSC (`56`), Solana (`CT_501`), Base (`8453`, `meme-rush` only).

---

## `meme-rush` — Launchpad lifecycle tracking 

> ⚠️ `rankType` selects the lifecycle stage: `10`=New (freshly created, on bonding curve) · `20`=Finalizing (bonding curve nearly complete, about to migrate) · `30`=Migrated (just migrated to DEX).

```bash
node <skill-dir>/scripts/cli.mjs meme-rush '{"chainId":"CT_501","rankType":10,"limit":20}'
```

### Parameters (body is a JSON object; only `chainId` + `rankType` are required)

**Core:**

| Field | Type | Required | Description |
|---|---|---|---|
| `chainId` | string | **yes** | `"56"` (BSC) · `"CT_501"` (Solana) · `"8453"` (Base) |
| `rankType` | integer | **yes** | `10`=New · `20`=Finalizing · `30`=Migrated |
| `limit` | integer | no | Max results (default 40, **max 100** — larger values are capped at 100) |
| `keywords` / `excludes` | string[] | no | Include / exclude symbol patterns (max 5 each) |

**Token filters (Min/Max pairs):** `progress` (string, 0–100) · `tokenAge` (long, **unit: minutes** — `tokenAgeMax=5` means "created within the last 5 minutes"; on Migrated (`rankType=30`) it is measured from `migrateTime`, i.e. minutes since migration) · `holders` (long) · `liquidity` (string) · `volume` (string) · `marketCap` (string) · `count` / `countBuy` / `countSell` (long) · `netBuy` (string, USD net buy).

**Holder distribution filters (Min/Max, string %):** `holdersTop10Percent` · `holdersDevPercent` · `holdersSniperPercent` · `holdersInsiderPercent` · `bundlerHoldingPercent` · `newWalletHoldingPercent` · `bnHoldingPercent` · `bnHolders` (long) · `kolHolders` (long) · `proHolders` (long) · `smartMoneyHolders` (long).

**Dev & launch filters:** `devMigrateCountMin/Max` (long) · `devPosition` (`2`=dev sold all; **tokens with a `null` `devPosition` also pass this filter** — see "How `null` behaves" below) · `devBurnedToken` (`1`=yes; unlike `devPosition`, this one *does* drop `null` rows) · `excludeDevWashTrading` (`1`=yes) · `excludeInsiderWashTrading` (`1`=yes).

**Tax & fee filters:** `taxRateBuyMin/Max` · `taxRateSellMin/Max` (string %) · `globalFeeMin/Max` (string; works on all chains) — or per chain via `globalFeeFilter: {"<chainId>": {"globalFeeMin": "0.01", "globalFeeMax": "0.5"}}`.

> ⚠️ **Unknown tax passes a tax ceiling.** During filtering, a `null` `taxRateBuy` / `taxRateSell` is treated as `0` (not-yet-migrated Open Four `protocol=2004` `CreatorRewards` tokens are likewise treated as `0`, whatever tax they report), so such tokens always pass `taxRateBuyMax` / `taxRateSellMax` (and fail any `Min > 0`). A returned `null` tax means **unknown** — display it as "unknown", never as `0%`, and do not call it "confirmed low tax". If the user needs confirmed low tax, drop `null`-tax rows locally and say how many were dropped. This is common on Base, where many launchpads report no tax at all.

### How `null` behaves when you filter

A missing value is **not** handled the same way across fields. There are three behaviours, and the difference decides whether a filter quietly keeps or drops the rows you care about:

| Field | `null` vs `Min` | `null` vs `Max` | What it means in practice |
|---|---|---|---|
| `taxRateBuy` / `taxRateSell` | dropped when `Min > 0`; **kept** when `Min = 0` (treated as `0`) | **kept** (treated as `0`) | A "low tax" result silently includes unknown-tax tokens |
| `marketCap` · `holders` · `liquidity` · `volume` | dropped | **dropped** | Any filter on these loses brand-new tokens — a wide `Max` does not save them |
| `devPosition` | — | **kept** | `devPosition: 2` is not a "dev has exited" whitelist |

Measured 2026-10-23 (the feed moves constantly, so treat the proportions, not the exact counts, as the finding): on Base `rankType=10`, a `taxRateBuyMax: "1"` result was **roughly 80% `null`-tax rows**; a `marketCapMax` set high enough to exclude nothing still dropped **every** `null`-market-cap row; on BSC `rankType=30`, a `devPosition: 2` result was **about half `null`-`devPosition` rows**.

**So:** when the user's condition is about avoiding something (high tax, a dev who dumped), a `null`-keeping filter does not enforce it. Either drop the `null` rows locally and say how many you dropped, or tell the user the result includes tokens where that is unknown.

**Other filters:** `protocol` (int[]; see Protocol Reference below) · `exclusive` (`1`=Binance exclusive; unrelated to Agent ID exclusive launches, which use `tokenVersionFilter`) · `paidOnDexScreener` · `pumpfunLiving` · `cmcBoost` · `pairAnchorFilter` (quote-token filter, see below) · `tokenSocials.atLeastOne` (`1`=yes) · `tokenSocials.socials` (string[]: `website` / `twitter` / `telegram`) · `tokenVersionFilter` (see below) · `creatorType` (int[], **array only** — a bare integer returns `illegal parameter`; keep tokens whose `creatorType` is in the list; **only applies to Four.meme `protocol=2001`** — other protocols pass through untouched, so also pass `protocol:[2001]`) · `excludeCreatorType` (int[]; drop tokens whose `creatorType` is in the list; applies to all protocols). Known value: `-1` = unknown; other values are not documented yet.

**`pairAnchorFilter`** — filter by quote token (the token each meme is paired against). Map of chainId → filter:

```json
{"chainId":"56","rankType":10,"pairAnchorFilter":{"56":{"pairAnchorAddress":["0x55d398326f99059ff775485246999027b3197955"],"otherPairAnchor":1}}}
```

| Field | Type | Meaning |
|---|---|---|
| `pairAnchorAddress` | string[] | Quote-token addresses to include (case-sensitive) |
| `otherPairAnchor` | int | `1` = also include tokens whose quote token is **not** in the configured quote-token list ("Others") |
| `rwaPairAnchor` | int | `1` = also include every quote token with `category=STOCK` (tokenized stocks / RWA) |

| What you pass | Result |
|---|---|
| **Omit `pairAnchorFilter`** | **All quote tokens** (configured list + Others + RWA). Use this when you want everything |
| `{"56":{"pairAnchorAddress":["<USDT>"]}}` | Only USDT-paired tokens |
| `{"56":{"otherPairAnchor":1}}` | Only tokens paired with an unlisted quote token |
| `{"56":{"rwaPairAnchor":1}}` | Only tokens paired with a STOCK quote token |
| `{"56":{"pairAnchorAddress":["<USDT>"],"otherPairAnchor":1}}` | USDT + Others (flags and addresses add up) |
| `{"56":{}}`, `{"56":{"pairAnchorAddress":[]}}`, `{"56":{"otherPairAnchor":0}}` | **Empty list** |
| Key missing for the queried chain (e.g. `{"CT_501":{...}}` while `chainId:"56"`) | **Empty list** |

- Passing `pairAnchorFilter` replaces the default "all quote tokens" — only the addresses / groups you list are returned.
- Once `pairAnchorFilter` is passed, every queried chain must have a key, and each entry needs a non-empty `pairAnchorAddress` or `otherPairAnchor: 1` / `rwaPairAnchor: 1` — otherwise that chain returns nothing. `otherPairAnchor` and `rwaPairAnchor` are optional: pass `1` only to add that group.
- The configured quote-token list (address → `symbol`, `category` `GENERAL` / `STOCK`) comes from `GET https://web3.binance.com/bapi/defi/v1/public/wallet-direct/buw/wallet/market/token/pulse/config` → `data.pulseRankTokenConfig.<chainId>`. Native tokens have two entries each (e.g. BNB and WBNB, SOL and WSOL) — include both.

**`tokenVersionFilter`** — filter by sub-type within a protocol. Map of protocol code → list of `tokenVersion` values to keep. Mainly used for Open Four (`2004`):

```json
{"chainId":"56","rankType":10,"protocol":[2004],"tokenVersionFilter":{"2004":["openfour.meme.AgentIdExclusive"]}}
{"chainId":"56","rankType":10,"protocol":[2004],"tokenVersionFilter":{"2004":["openfour.meme.Tapeout"]}}
```

| `2004` (Open Four) `tokenVersion` value | Meaning |
|---|---|
| `openfour.meme.AgentIdExclusive` | Agent ID exclusive launches — any address can launch; during the bonding-curve stage only Agent ID holders can buy, and only Agent ID holders and the issuer can sell (trading flow: `binance-agentic-wallet` `references/agent-id-exclusive-token-launches.md`) |
| `openfour.meme.TaxToken` | Tax token |
| `openfour.meme.TaxStock` | Tax stock |
| `openfour.meme.Likwid` | Likwid |
| `openfour.meme.Tapeout` | Tapeout |
| `openfour.meme.CreatorRewards` | Creator rewards |
| `openfour.meme.V4Hook` | V4 hook |

Other protocols also return a `tokenVersion` and accept the same filter, but their values are bare version numbers without documented meaning: `2002` / `3011` (Flap) → `"6"`, `"7"`; `3012` (O1 Exchange V3) → `"2000"`.

- The filter only constrains tokens of the protocol used as the key; tokens from other protocols pass through untouched. To get *only* the selected sub-types, also pass `protocol: [2004]`.
- Tokens of that protocol whose `tokenVersion` is `null` are excluded once the filter is set.
- Values must match exactly. An unknown or misspelled value is not an error — it just returns an empty list. An empty list for a valid value can also simply mean no such token right now.

### Filters that look valid but are silently ignored

> ⚠️ **Unknown parameters are dropped without any error.** The API still returns a normal-looking, *unfiltered* list, so a broken filter cannot be noticed from the response shape. A misspelled name (e.g. `holderMin` instead of `holdersMin`) fails the same way. Use only the parameter names listed above.

**Price, price change, sniper count and dev sell % have no equivalent server-side filter.** To honor the user's exact condition, filter the returned rows locally on the return field (`price`, `priceChange`, `sniperCount`, `devSellPercent`). A single call returns at most 100 rows, so a locally filtered result is a sample, not an exhaustive list — say so, and state how rows with a `null` value were handled.

| Do NOT use | Why | Equivalent? | Closest server-side option |
|---|---|---|---|
| `priceMin` / `priceMax` | Ignored | **No** — filter `price` locally | `marketCapMin/Max` (a different condition: low-price, high-supply tokens can have a large market cap) |
| `priceChangeMin` / `priceChangeMax` | Ignored | **No** — filter `priceChange` locally | none |
| `sniperCountMin/Max` | Ignored, even though `sniperCount` is a return field | **No** — filter `sniperCount` locally | `holdersSniperPercentMin/Max` (share held, not head count: 100 snipers may hold 1%) |
| `devSellPercentMin/Max` | Ignored | **No** — filter `devSellPercent` locally | `devPosition: 2` (only "dev sold everything", **and it keeps `null` rows** — not a "dev has exited" whitelist) |
| `createTimeMin/Max` | Ignored — no timestamp field is filterable | **Only on New / Finalizing** (`rankType` 10 / 20), where `tokenAge` counts from `createTime`. **Not on Migrated** — there `tokenAge` counts from `migrateTime`; filter `createTime` locally | `tokenAgeMin/Max` (minutes) |
| `migrateTime*`, `firstTweetTime*` and other timestamps | Ignored | **No** — filter locally. Exception: `migrateTime` on Migrated (`rankType=30`) = `tokenAge` | none |
| `pairAnchorAddress` at top level | Ignored (deprecated form) | **Yes** | `pairAnchorFilter: {"<chainId>": {"pairAnchorAddress": [...]}}` |

**Never silently swap a condition.** If you fall back to a non-equivalent option (e.g. market cap instead of price), tell the user the condition changed and get confirmation first.

**Rule of thumb:** server-side filters exist for *counted quantities* (holder / trade counts, holding percentages, USD amounts). Price, price change and raw timestamps are not filterable. `tokenAge` replaces a time condition only when its time base matches (creation on New / Finalizing, migration on Migrated); otherwise filter locally and disclose that the result is a sample of at most 100 rows.

### Protocol Reference

`protocol` codes (used in the `protocol[]` filter and returned on each token). `1xxx` = Solana · `2xxx` = BSC · `3xxx` = Base.

| Code | Platform | Chain |   | Code | Platform | Chain |
|---|---|---|---|---|---|---|
| 1001 | Pump.fun | Solana |  | 2005 | Virtuals | BSC |
| 1004 | LaunchLab | Solana |  | 2006 | genius.fun | BSC |
| 1005 | Raydium AMM | Solana |  | 2007 | genius.fun V2 | BSC |
| 1006 | Raydium CPMM | Solana |  | 2008 | brew Standard | BSC |
| 1007 | Raydium CLMM | Solana |  | 2009 | brew Dividend | BSC |
| 1008 | Bonk | Solana |  | 2010 | brew Multipair | BSC |
| 1009 | Dynamic BC | Solana |  | 2012 | O1 Exchange Tax | BSC |
| 1010 | Moonshot | Solana |  | 3001 | Clanker | Base |
| 1011 | Jupiter Studio | Solana |  | 3002 | Bankr | Base |
| 1012 | Bags | Solana |  | 3003 | Zora Creator | Base |
| 1013 | Believer | Solana |  | 3004 | Zora Content | Base |
| 1014 | Meteora DAMM V2 | Solana |  | 3006 | Flaunch | Base |
| 1015 | Meteora AMM | Solana |  | 3008 | Virtuals | Base |
| 1016 | Orca | Solana |  | 3009 | Virtuals V5 | Base |
| 1017 | StonkFun | Solana |  | 3010 | O1 Exchange | Base |
| 2001 | Four.meme | BSC |  | 3011 | Flap | Base |
| 2002 | Flap | BSC |  | 3012 | O1 Exchange V3 | Base |
| 2004 | Open Four | BSC |  | 3013 | O1 Exchange Tax | Base |

- **Open Four sub-types share code `2004`** — new Open Four modes reuse `2004` instead of getting a new protocol code. Filter them with `tokenVersionFilter` (see Other filters).
- **An empty list is not an error.** Low-volume or inactive protocols may return no tokens at a given moment.
- **Migrated coverage is thin for many protocols.** Querying only `rankType=30` will miss them — query New / Finalizing too.

### Response envelope

```json
{ "code": "000000", "message": null, "messageDetail": null, "data": [ /* tokens */ ], "success": true }
```

### Return fields (under `.data[]`)

**Core:**

| Field | Type | Description |
|---|---|---|
| `chainId` / `contractAddress` / `symbol` / `name` / `decimals` | — | Identity. **Unique key is `(chainId, contractAddress)`** — the same address can be a different contract on BSC and Base; `contractAddress` alone is only unique within one chain. `symbol` is not unique |
| `symbolTranslate` / `nameTranslate` | object | Translations keyed by locale, e.g. `{"zh-CN": "..."}` |
| `icon` | string | Logo path (prefix `https://bin.bnbstatic.com`) |
| `price` / `priceChange` | string | Current price (USD), 24h change (%) |
| `marketCap` / `liquidity` / `volume` | string | USD, string-encoded |
| `netBuy` | string | Net buy amount (USD); populated on almost every token |
| `holders` | long | Holder count |
| `progress` | string | Bonding curve progress — pre-formatted, append `%` directly |
| `protocol` | integer | Launchpad protocol code |
| `exclusive` | integer | `1` = Binance exclusive token |

**Trade counts:** `count` / `countBuy` / `countSell` (long, 24h).

**Holder distribution (all string %, append `%` directly):** `holdersTop10Percent` · `holdersDevPercent` · `holdersSniperPercent` · `holdersInsiderPercent` · `bnHoldingPercent` · `kolHoldingPercent` · `proHoldingPercent` · `smartMoneyHoldingPercent` · `newWalletHoldingPercent` · `bundlerHoldingPercent`.

**Holder counts (long):** `bnHolders` · `kolHolders` · `proHolders` · `smartMoneyHolders` · `bundlerHolders` · `sniperCount` (display only — not filterable).

**Dev & migration:** `devAddress` · `devSellPercent` · `devMigrateCount` · `devPosition` (`2`=dev sold all) · `creatorType` (`-1`=unknown) · `migrateStatus` (`0`=bonding curve / `1`=migrated) · `migrateTime` (`0` before migration) · `createTime` · `createHeight` (BSC only) · `firstGasInfo` (`sourceAddress` / `sourceTime` / `sourceAmount` / `sourceType` / `sourceEntity` — where the creator's first gas came from; useful for tracing the dev's funding).

**Tags & flags:** `tagDevWashTrading` · `tagInsiderWashTrading` · `tagDevBurnedToken` · `tagPumpfunLiving` · `tagCmcBoost` · `paidOnDexScreener` · `cashback`.

**Tax & fees:** `taxRateBuy` / `taxRateSell` (string %, pre-formatted; there is **no** `taxRate` field; `null` = unknown — show "unknown", not `0%`) · `taxFeeDistribution` (tax split: burn / dividend / liquidity / vault / fund wallet; not on Solana) · `launchTaxEnable` (BSC only) · `globalFee` (all chains).

For Flap V6 tokens, `taxFeeDistribution.taxRateVaultAddress` can identify the creating **factory**, rather than the receiving/callable **vault**. Resolve the token with the official VaultPortal's `tryGetVault(token)` and use its separate `vault` and `vaultFactory` fields. Do not use the feed field alone as a transaction destination. See [Flap's indexing documentation](https://docs.flap.sh/flap/developers/wallet-and-terminal-and-bot-developers/indexing-vaults) and [current deployed contracts](https://docs.flap.sh/flap/developers/deployed-contract-addresses).

**Socials:** `socials.website` / `socials.twitter` / `socials.telegram` · `twitterHandle` · `twitterInfo` (`followersCnt` / `followingCnt` / `type`).

**AI narrative:** `narrativeText.en` / `narrativeText.cn`.

**Chain-specific:** `createHeight` and `launchTaxEnable` are BSC only; `pumpfunSubType` is Solana only; `taxFeeDistribution` and `tokenVersion` are never set on Solana.

### Data caveats

- **`null` risk tags mean "not evaluated", not "safe".** `tagDevWashTrading`, `tagInsiderWashTrading`, `tagDevBurnedToken`, `tagCmcBoost`, `tagPumpfunLiving` are `null` on the vast majority of tokens. Never treat "tag is not 1" as a safety pass. To exclude risky tokens, use the server-side filters `excludeDevWashTrading: 1` / `excludeInsiderWashTrading: 1` — but these only drop tokens **already tagged** as wash trading; untagged (`null`, not evaluated) tokens stay in the result. A list returned with both excludes on is **not** a safety whitelist — in practice nearly every row still has `null` tags.
- **Brand-new tokens have empty market fields.** Within ~30 s of creation `price`, `marketCap`, `holders`, `liquidity` are `null`. Any `Min` / `Max` on the filterable market fields (`marketCap`, `holders`, `liquidity`, `volume`) on `rankType=10` drops the newest batch entirely — **including a `Max` set wide enough to exclude nothing**, because `null` fails both bounds (see "How `null` behaves"). `price` is different: it is not a server-side filter at all (`priceMin/Max` are ignored), so it never drops `null`-price rows. For "latest launches" filter only on fields present at birth (`tokenAge`, `protocol`, `netBuy`).
- **Base data is sparse.** Many Base tokens lack `price` / trade counts; expect more `null`s there.
- **`symbol` is not unique.** Batch launches with identical symbols are common. Dedupe, cache, or match positions by `(chainId, contractAddress)` — never by `symbol`, and not by address alone when combining results across chains.

---

## `topic-rush` — AI-powered hot-topic discovery (GET)

> ⚠️ `rankType`: `10`=Latest (newest hot topics) · `20`=Rising (topics with ATH net-inflow between $1k and $20k).
> ⚠️ **`sort` default convention:** when the user does not specify a preference, use `sort=10` (create time). `sort=20` = net inflow.

```bash
node <skill-dir>/scripts/cli.mjs topic-rush '{"chainId":"CT_501","rankType":10,"sort":10,"asc":false}'
```

### Parameters

| Field | Type | Required | Description |
|---|---|---|---|
| `chainId` | string | **yes** | `"56"` or `"CT_501"` |
| `rankType` | integer | **yes** | `10`=Latest · `20`=Rising |
| `sort` | integer | **yes** | `10`=create time (default) · `20`=net inflow |
| `asc` | boolean | no | `true`=ascending, `false`=descending |
| `keywords` | string | no | Case-insensitive contains match |
| `topicType` | string | no | Comma-separated topic-type filter |
| `tokenSizeMin/Max` | integer | no | Associated-token count range |
| `netInflowMin/Max` | string | no | Topic net-inflow range (USD) |

### Return fields (under `.data[]`)

**Topic-level:**

| Field | Type | Description |
|---|---|---|
| `topicId` | string | Unique topic ID |
| `chainId` | string | Chain ID |
| `name.topicNameEn` / `name.topicNameCn` | string | Multi-language topic name |
| `type` | string | Topic category (e.g. `Culture`) |
| `close` | integer | `0`=active, `1`=closed |
| `topicLink` | string | Related tweet / post URL |
| `createTime` | long | Topic creation timestamp (ms) |
| `progress` | string | Topic progress — pre-formatted %, append `%` directly |
| `aiSummary.aiSummaryEn` / `aiSummary.aiSummaryCn` | string | AI-generated narrative |
| `topicNetInflow` / `topicNetInflow1h` / `topicNetInflowAth` | string | Net inflow: total / 1h / ATH (USD) |
| `tokenSize` | integer | Number of associated tokens |
| `deepAnalysisFlag` | integer | `1`=deep analysis available |
| `topicTags` | string[] | Topic tags (e.g. `Crypto Native`, `Celebrity`) |

**Associated tokens** (`tokenList[]` within each topic):

| Field | Type | Description |
|---|---|---|
| `chainId` / `contractAddress` / `symbol` / `decimals` | — | Identity |
| `icon` | string | Logo path (prefix `https://bin.bnbstatic.com`) |
| `createTime` | long | Token creation timestamp (ms) |
| `marketCap` / `liquidity` | string | USD |
| `priceChange24h` | string | 24h % (pre-formatted) |
| `netInflow` / `netInflow1h` | string | Net inflow since topic creation / last 1h (USD) |
| `volumeBuy` / `volumeSell` / `volume1hBuy` / `volume1hSell` | string | Volume breakdown (USD) |
| `uniqueTrader{5m,1h,4h,24h}` | long | Unique traders by window |
| `count{5m,1h,4h,24h}` | long | Trade count by window |
| `holders` / `kolHolders` / `smartMoneyHolders` | long | Holder stats |
| `protocol` | integer | Launchpad protocol code (`0` / null = DEX token) |
| `internal` | integer | `1`=on bonding curve |
| `migrateStatus` | integer | `1`=migrated |

**Nested shape:** each topic has `name: {topicNameEn, topicNameCn}` (and `aiSummary` similarly) plus `tokenList[]` with full per-token stats inline.

---

## Errors

Exit codes: `0` ok · `1` upstream/usage (stderr: reason; stdout: body with business `code`) · `3` network.
Business `code`: `000000` ok · `000002` illegal parameter (e.g. `creatorType` passed as an integer instead of an array) · `100004` rate-limited · `100002` bad param · `000400` token not found / unsupported chain.

---

## Notes

- Percentage fields (`progress`, holder %, `devSellPercent`, `taxRateBuy` / `taxRateSell`, `priceChange24h`) are pre-formatted — append `%` directly, do **not** multiply by 100.
- Tax visibility: for `protocol=2001` (Four.meme) `taxRateBuy` / `taxRateSell` are only populated on Migrated (`rankType=30`); for `protocol=2002` (Flap) on all lists.
