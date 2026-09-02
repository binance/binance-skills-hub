# Query Strategy — Raw Input First, `searchAll` for Concurrent Dispatch

## Default Strategy: `searchAll` with Raw Input

**Do NOT extract keywords upfront.** Send the user's raw input as
`query` (after minimal pre-processing) to `searchAll`, which runs
`searchGlossary`, `searchLearnEarn`, `searchResource`, and `searchArticles`
in parallel and picks the best result set by a **match tier + relevance**
score (see "searchAll ranking rule" below). Only fall back to a clean
keyword when `searchAll` returns `best.source: null` OR `best.matchTier <= 0`
(the top hit's title/slug doesn't overlap the query — usually means the
backend matched only the long HTML `content`
field, which is often off-topic).

This is simpler and more robust than hard-coded extraction rules —
many queries hit directly when the user's phrasing matches Academy's
content titles. Running the 3 endpoints concurrently costs ≈ 1s
(max of slowest endpoint) vs. ≈ 2.2s sequentially.

### Language scope — default strategy depends on the writing system

The default query strategy depends on the user's language:

- **English and other Latin-script languages**: *raw input first*. The
  user's phrasing often matches an Academy **title** so `getMatchTier`
  reaches tier ≥ 2 (the "format the card" threshold). Academy's English
  corpus is the largest and English titles use the same whitespace
  tokenization as the user's query. Only extract clean keywords when raw
  input returns `matchTier <= 0` or `best.source == null`.

- **Chinese and other CJK**: *extract keyword first*. CJK raw sentences
  almost never reach tier ≥ 2 — a 20-question zh sample showed **0/20
  reached tier ≥ 2**. Two compounding reasons:

  1. The backend uses PostgreSQL `plainto_tsquery('simple', ...)`, which
     has **no CJK word segmentation** — it splits on whitespace only.
     A Chinese sentence like "什么是爆仓" is ONE token, so it matches
     almost no title (titles are short noun phrases, not full questions).
  2. Even when the user inserts spaces, `plainto_tsquery` **ANDs every
     token** with no stopword removal — so "什么是 爆仓" becomes a 2-token
     AND query where "什么是" matches no title. Question words, intent
     phrasing, and quantity details all become AND tokens that suppress
     recall.

  **Default strategy for CJK queries — extract keyword BEFORE the first
  `searchAll` call, do NOT first try the raw sentence.** The raw
  sentence will return `tier <= 1` (near-guaranteed), so trying it first
  wastes a full `searchAll` round-trip and the LLM ends up extracting +
  retrying anyway. Going straight to the keyword saves a cycle and makes
  the default strategy actually effective for CJK (the prior
  raw-input-first default "never worked" for CJK sentences — every
  query fell to the fallback branch).

  Sub-rules:

  - **CJK sentence (contains question/intent words — 什么是 / 如何 /
    为什么 / 可以吗 / 行吗 / 是不是 / "is it safe" / "should I")**:
    extract the topic noun and translate to its canonical English term
    BEFORE the first `searchAll` call. Do NOT try the raw sentence.
  - **CJK bare concept noun (no question words — 钱包, 智能合约, 工作量证明,
    区块链)**: send it raw. Single-token CJK concept nouns DO hit (tier
    3) when the Academy has the translated glossary entry, and skipping
    raw for them would lose the cleanest match. If the raw noun returns
    `tier <= 1` or off-topic, fall back to the English translation.
  - **Risk-education CJK queries**: skip straight to the
    Risk-Education Term Map below — the correct fallback term is rarely
    obvious and rarely the literal translation.

### Minimal Pre-Processing (done by the script's `preprocessBody`)

The script applies these transformations to `query` before sending:
- Strip ISO control characters (would break `plainto_tsquery` and
  pollute logs) and zero-width chars (NBSP 0x00A0, BOM 0xFEFF)
- Trim leading/trailing whitespace (incl. CJK ideographic space)
- Truncate to 200 chars (backend hard limit; longer returns HTTP 400)

**Not done** (intentionally): lowercasing, stripping question words,
translating. The raw user input is sent verbatim — `plainto_tsquery`
handles case-insensitivity; question words become AND tokens but
`searchAll`'s matchTier ranking checks title/slug overlap, not just
full-text `ts_rank`.

### When to Fall Back to a Clean Keyword

Fall back when **either** of these is true:

1. `searchAll` returns `best.source: null` (`best.matchTier == -1`) —
   all 3 endpoints returned 0 hits for the requested `lang`. The skill
   MUST NOT auto-retry in another language — the caller decides whether
   to retry with an explicitly different `lang` or surface a no-content
   card.
2. `searchAll` returns `best.matchTier <= 0` — the top hit's title and
   slug don't contain any query token (length ≥ 3). The hit exists
   only because the backend's `ts_rank` matched the long HTML
   `content` field, which often produces tangentially related entries
   (e.g., query "blockchain technology" → glossary "Actively
   Validated Services (AVS)" with `matchTier=0` but `relevance=0.34`).
   The fix is to retry with a clean English keyword — typically a
   tier-3 hit exists for the canonical term (e.g., "Introduction to
   blockchain technology" Module with slug `introduction-to-blockchain-technology`).

In these cases, retry `searchAll` with a clean 1–4 word English keyword
distilled from the user's input (see Fallback Extraction Heuristics
below), keeping the **same `lang`** as the original request. If
`best.matchTier` is still ≤ 0 after the retry, use the No-Content
Template (see `output-format.md`).

### When to Skip `searchAll` and Use a Direct Endpoint

| Intent | Use `searchAll`? | Reason |
|--------|------------------|--------|
| 1 (Knowledge Q&A) | ✓ Yes — default | User might be asking about a Glossary term, L&E course, or Course/Module; `searchAll` covers all 3 |
| 2 (Risk Education) | ✓ Yes — default | Same as Intent 1; risk-warning block added at format time |
| 3 (Learning Plan) | ✗ No — use `getLearningPlan` directly with a clean topic noun | `searchResource` rarely matches full sentences like "我想学 DeFi"; Module titles don't paraphrase the user's request. Extract the topic noun upfront and call `getLearningPlan`. |
| 4 Pattern A (reward list) | ✗ No — use `searchLearnEarn` directly | User explicitly asks about rewards; Glossary/Resource calls would be wasted |
| 4 Pattern B (L&E title format) | ✓ Yes — default | Catches the L&E hit AND verifies whether Glossary/Resource have a stronger canonical entry (rare for project-specific queries, but worth checking) |

### `searchAll` Ranking Rule (simplified — match tier, then relevance)

`searchAll` collects each endpoint's items, computes a **match tier
(0–3)** for every item based on how strongly the item's `title` or
URL `slug` matches the `query`, bubbles the highest-tier (then
highest-relevance) item to the front of each endpoint's list, then
picks the endpoint whose top item has the highest tier. Within the
same tier, prefer Glossary > L&E > Resource (definitional sources
first); within the same tier + source, higher `relevance` wins.

| Step | What happens | Result |
|------|--------------|--------|
| 1 | Each endpoint's items are scanned; each item gets a `matchTier` 0–3 | Tiered items |
| 2 | Within each endpoint, the highest-tier (then highest-relevance) item is bubbled to index 0 | 1 candidate per non-empty endpoint |
| 3 | Cross-endpoint: candidates sorted by tier DESC, source priority, relevance DESC | Highest first |
| 4 | The top candidate wins | `best.source`, `best.items`, `best.reason`, `best.matchTier` |
| 5 | If all 3 endpoints return 0 hits for the requested `lang` | `best.source = null`, `best.matchTier = -1` |

Why match-tier beats raw relevance across endpoints:
- Academy's `ts_rank` is computed from the long `content` HTML body.
  Long entries that mention a concept extensively (e.g., "Nakamoto
  Consensus" for query "proof of work") score higher than the entry
  that IS the concept (e.g., "Proof of Work (PoW)" with shorter
  content). Using title/slug match as the primary signal restores the
  "the entry titled with the term IS the canonical answer" intuition.
- The `relevance` score is still a useful tiebreaker within the same
  tier — all 3 endpoints use the same `plainto_tsquery('simple', ...)`
  ranking, so relevance is comparable across endpoints.

**No cross-language fallback.** `searchAll` runs strictly in the
requested `lang`. If `lang=zh` returns 0 hits, `best.source == null`.
The caller decides the next step (retry with explicit `lang=en` if
the user accepts it, or surface a no-content card). The skill MUST
NOT silently swap languages — that would mismatch the user's intent
and present content in a language they didn't ask for.

Verified examples (re-verified 2026-09-01 after the matchTier coverage
guard — see `getMatchTier` in `academy-api.mjs`):

| Query | lang | best.source | best.matchTier | best.lang | top title | relevance |
|-------|------|-------------|---------------|-----------|-----------|-----------|
| `DeFi` | en | glossary | 3 | en | Decentralized Finance (DeFi) | 0.0985 |
| `Gas Fee` | en | articles | 2 | en | How Do Gas Fees Work on Ethereum? | 0.7697 |
| `Turtle` | zh | learnEarn | 3 | zh | 一文读懂 Turtle (TURTLE) | 0.0827 |
| `wallet` | en | glossary | 1 | en | BTC Wallet Address | 0.0977 |
| `bitcoin` | en | learnEarn | 3 | en | Bitcoin Basics | 0.0865 |
| `proof of work` | en | glossary | 3 | en | Proof of Work (PoW) | 0.8669 (with limit=5) |
| `blockchain technology` | zh | resource | 3 | zh | 区块链技术简介 (slug=introduction-to-blockchain-technology) | 0.1572 |
| `工作量证明` | zh | glossary | 3 | zh | 工作量证明 | 0.0760 |
| `区块难度` | zh | glossary | 0 | zh | 中本聪共识 (off-topic — only 1 hit returned; LLM should retry with "mining difficulty") | 0.0608 |
| `zzznonexistent` | zh | null | -1 | zh | — | — |

**Tier values are computed by `getMatchTier`, not hand-filled.** The
previous revision of this table had two stale rows that the coverage
guard fix exposed: `Gas Fee` was listed as
`glossary / tier 3 / Gas Limit` but the canonical hit was always
`articles / "How Do Gas Fees Work on Ethereum?"` (now tier 2 after the
guard, since the title adds the non-generic tokens "work"/"ethereum"
beyond the query); `wallet` and `bitcoin` were listed as `glossary /
tier 3` but those were exactly the substring false positives the guard
now demotes (BTC Wallet Address → tier 1; Bitcoin Maximalists → tier 1,
so the on-topic `learnEarn "Bitcoin Basics"` wins instead). Re-verify
any row before relying on it — relevance values drift as Academy
content changes.

The `reason` field in the `best` object shows all candidates and their
(tier, relevance) for traceability.

## Fallback Extraction Heuristics

When `searchAll` returns `best.source: null` or off-topic hits,
distill the user's input to a 1–4 word keyword. There is no rigid
rule — apply judgment using these heuristics:

1. **Drop question words** — "what is", "什么是", "为什么",
   "how does", "如何", "是什么", "explain".
2. **Drop intent phrasing** — "我想学", "build me a plan",
   "学习路径", "可以吗", "行不行", "should I", "is it safe".
3. **Drop position / quantity details** — "20 倍", "100x", "1 BTC",
   "100 USDT", "all in", "全部身家", "借钱".
4. **Keep the topic noun — and try the zh noun before translating to
   English.** Academy's `plainto_tsquery('simple', ...)` does NOT
   cross-language match, so a zh term only hits zh content and an en
   term only hits en content. The zh corpus is smaller but it DOES
   contain the literal Chinese translations of common concepts — so
   the right order is: (a) try the zh topic noun first (it may hit a
   clean zh glossary entry), (b) only if the zh noun misses or returns
   an off-topic hit, translate to the canonical English term and retry.
   The English corpus is larger and covers many concepts the zh corpus
   does not, so the English fallback is still the most common path for
   less-common or newer concepts.

   Verified examples (2026-09-01, after the `getMatchTier` coverage
   guard. Note: prior revisions of this table claimed "钱包 / 智能合约 /
   比特币 have 0 hits in zh"; that premise was wrong. The zh terms DO
   hit, and after the coverage guard, the en short-query matches that
   used to be false-positive tier 3 (BTC Wallet Address, Bitcoin
   Maximalists) are now tier 1, so for several concepts the zh noun is
   now the BETTER
   query):

   | User input (zh) | Try first | If it misses / off-topic, retry with | Why this order |
   |-----------------|-----------|---------------------------------------|---------------|
   | "什么是钱包" | `钱包` (zh) | `wallet` (en) | zh `钱包` → glossary "钱包" tier 3 (clean hit); en `wallet` now only tier 1 ("BTC Wallet Address" is about wallet *address*, demoted by the coverage guard). zh wins. |
    | "智能合约是什么" | `智能合约` (zh) | `smart contract` (en) | zh `智能合约` → glossary "智能合约" tier 3 (clean hit); en `smart contract` → glossary "Smart Contract Wallet" tier 1 (demoted by the superset guard — "Wallet" is a concept noun). zh wins. |
   | "什么是比特币" | `比特币` (zh) → likely off-topic, so go straight to en | `Bitcoin` (en) | zh `比特币` → resource "3.2 比特币 UTXO 模型" tier 1 (off-topic); en `Bitcoin` → learnEarn "Bitcoin Basics" tier 3 (on-topic). en wins. |
   | "什么是 Gas Fee" | (keep as `Gas Fee`) | — | Already English; don't translate to Chinese. |
   | "以太坊 gas 太贵怎么办" | `以太坊 gas` (zh) → likely misses, retry en | `Ethereum gas fee` (en) | Translate 以太坊 → Ethereum; zh corpus has little on gas. |
   | "DeFi 流动性池是什么" | `DeFi 流动性池` (zh) → likely misses, retry en | `DeFi liquidity pool` (en) | Translate 流动性池 → liquidity pool; DeFi content is mostly en. |

   **Why this matters**: Academy's `plainto_tsquery('simple', ...)`
   does not cross-language match. A query "钱包" with `lang=en` returns
   0 hits because English content does not contain the token "钱包".
   `searchAll` does NOT auto-fallback to another language — if the zh
   query misses, the caller decides whether to retry with `lang=en`
   (explicitly) and a translated `query`, or surface a no-content card.
   The LLM MUST translate the query at extraction time if the user
   accepts a retry in another language.

   **Exception**: L&E course titles like "一文读懂 Turtle" contain
   the English project name directly — do NOT translate "Turtle"
   to its literal Chinese meaning. L&E project names are always
   in English.

 5. **Use the user's language only when they clearly want localized
   content** — e.g., a Chinese Academy-specific term that has no
   English equivalent (rare; default to English).
 6. **Keep it short** — 1-4 words. Recall drops sharply beyond ~6
   words because the backend ANDs every token.
 7. **For L&E title format** ("一文读懂 X", "What is X (TICKER)?",
   "X (TICKER)") — try the raw input first via `searchAll` (often
   hits directly); if it misses, drop the title template and the
   ticker, keep the project name (e.g., `Solv Protocol` not
   `Solv Protocol (SOLV)`).
 8. **Risk-education queries: use the Risk-Education Term Map below.**
   Risk concepts rarely match a zh raw sentence (a 5-query zh
   risk-education sample returned `best.source = null` for 5/5), and
   the correct English fallback term is rarely the literal translation
   (e.g. 杠杆 → `forced liquidation`, NOT `leverage`; 爆仓 → `forced
   liquidation`, NOT `liquidation`). Don't make the LLM guess — use the
   table.

## Risk-Education Term Map (Intent 2 — CN → EN fallback)

For Intent 2 (Risk Education) queries in Chinese, the raw sentence almost
never hits (`plainto_tsquery('simple', ...)` ANDs every token including
question words, and the zh corpus is small). The correct fallback term is
also rarely the literal translation — Academy's risk content is titled
with the *consequence* or the *product* (Forced Liquidation / 强制平仓,
Margin Trading), not the user's framing (杠杆, 爆仓). Use this map instead
of asking the LLM to invent the term.

**Retry keeps `lang` = the user's language (`zh`); only the `query` term
changes language.** This matters because:

- A **zh** retry term (e.g. `强制平仓`) hits the **zh** glossary/resource
  endpoints directly — the LLM gets zh content, no translation needed.
- An **en** retry term (e.g. `margin trading`) with `lang=zh` only hits
  the **articles** endpoint (the 3 academy-series endpoints find nothing
  in zh for an English term); articles falls back to en content and the
  LLM must translate the distilled article back to zh (see
  `articlesLangFallback`).

So when both a zh and an en candidate exist, prefer the one that reaches
tier ≥ 2 — usually the zh term if the zh glossary has it, else the en
term that hits articles. Try candidates left-to-right; stop at the first
`best.matchTier >= 2`. Verified 2026-09-01 with `lang=zh`.

| User phrasing (zh) | Concept | Retry `query` candidates (best first) | Verified hit (`lang=zh`) |
|--------------------|---------|----------------------------------------|--------------------------|
| 20倍杠杆 / 开 N 倍杠杆 / 杠杆可以吗 | leverage / amplified position | `强制平仓` (zh) → `forced liquidation` (en) → `margin trading` (en) | `强制平仓` → glossary **tier 3** "强制平仓". (`杠杆` zh → glossary tier 0 "中心化交易平台" — the literal zh term misses; the consequence term is the rescue. `leverage` en with lang=zh → 0 hits.) |
| 借钱放大仓位 / 借币交易 / 保证金 | borrowing to trade / margin | `margin trading` (en) → `保证金交易` (zh) → `margin` (en) | `margin trading` → articles **tier 3** "What Is Margin Trading?" (en, translate back to zh). (`保证金交易` zh → 0 hits; `margin` alone too short.) |
| 全部身家 / all in / 梭哈 | all-in / over-concentration | `risk management` (en) → `风险管理` (zh) → `investment risk` (en) | `risk management` → articles **tier 2** "A Beginner's Guide to Risk Management" (en, translate back to zh). (`风险管理` zh → resource tier 1 "投资组合和风险管理"; the en term ranks higher via articles.) |
| 爆仓 / 强制平仓 / 爆仓了怎么办 | liquidation / forced liquidation | `强制平仓` (zh) → `forced liquidation` (en) → `liquidation` (en) | `强制平仓` → glossary **tier 3** "强制平仓" (zh, no translation). (`forced liquidation` en with lang=zh → articles tier 1 only; `liquidation` alone → articles tier 1.) |
| 加密骗局 / 识别骗局 / 防骗 | crypto scam / fraud | `crypto scam` (en) → `加密骗局` (zh) → `scam` (en) | `crypto scam` → articles **tier 2** "5 Common Cryptocurrency Scams..." (en, translate back to zh). (`加密骗局` zh → 0 hits; `scam` alone too broad.) |
| 合约爆仓 / 高杠杆亏光 | futures liquidation | `强制平仓` (zh) → `forced liquidation` (en) → `futures` (en) | Same forced-liquidation core. |
| 拉砸 / 操纵市场 / 庄家 | market manipulation | `market manipulation` (en) → `pump and dump` (en) | Academy has explicit pump-and-dump / manipulation content. |
| 年化 N% 靠谱吗 / 高收益项目 | unrealistic yield / scam | `crypto scam` (en) → `investment risk` (en) → `ponzi` (en) | Treat unsustainable yield as a scam signal; lead with the scam term. |
| 私钥泄露 / 助记词被骗 | key / seed compromise | `crypto scam` (en) → `phishing` (en) → `wallet security` (en) | `crypto scam` covers the broader category; narrow to `phishing` if the user describes a phishing shape. |

**Result: 5/5 of the original risk-education sample queries are now
rescuable** (verified 2026-09-01): `20倍杠杆可以吗` → `强制平仓`
(glossary tier 3); `借钱放大仓位行吗` → `margin trading` (articles
tier 3); `全部身家投 crypto 行吗` → `risk management` (articles tier
2, translate back to zh); `什么是爆仓` → `强制平仓` (glossary tier 3);
`如何识别加密骗局` → `crypto scam` (articles tier 2). The previous
"三级回退" table marked `20倍杠杆可以吗` as unrescuable because it only
tried `杠杆` (zh, tier 0) and `leverage` (en with lang=zh, 0 hits) —
both literal translations; the consequence-term `强制平仓` is the actual
rescue.

**Why a dedicated map and not the general translation table**: the
general §4 table maps a *concept noun* to its English equivalent. Risk
queries usually describe a *behavior* (借钱, 全部身家, 20倍) whose
canonical Academy title is the *consequence* (强制平仓, Margin Trading,
Risk Management) — a mapping the LLM cannot derive consistently from the
literal words. Without this map, the LLM tends to retry with the literal
translation (`leverage`, `liquidation`), which misses or returns weak
tier-1 hits (see the `leverage` → tier 0 example above).


## Worked Examples (Fallback Path)

These are examples of the **fallback** keyword, used only after
`searchAll` with raw input returns 0 hits or wrong hits.

| Raw user input | Fallback `query` | Reasoning |
|---------------|--------------------|-----------|
| "什么是 Gas Fee?" | `Gas Fee` | Drop "什么是"; keep the term. |
| "我想学 DeFi，但不知道从哪开始" | `DeFi` | Drop intent phrasing; keep topic noun. (Note: Intent 3 should use this keyword directly with `getLearningPlan`, not `searchAll`.) |
| "借钱放大仓位，开 20 倍杠杆做多 BTC 可以吗?" | `强制平仓` (zh, then `margin trading` en, then `forced liquidation` en) | Drop position details; keep the risk concept. See the Risk-Education Term Map — `强制平仓` → glossary tier 3; `margin trading` → articles tier 3; `forced liquidation` only reaches articles tier 1 (weaker). |
| "What is a wallet private key?" | `wallet private key` | Drop "What is a"; keep the noun phrase. |
| "为什么转账后收到的币变少了?" | `gas fee` (try first), `withdrawal fee`, `slippage` | Symptom → multiple candidates; try most likely first. |
| "Build me a 5-day Bitcoin learning plan" | `Bitcoin` | Keep topic noun for `getLearningPlan` (Intent 3, not `searchAll`). |
| "DeFi 入门有什么学习路径?" | `DeFi` | Keep topic noun; drop "入门" and "学习路径". (Intent 3.) |
| "哪些 Academy 课有奖励?" | `reward` (broad) | Let `searchLearnEarn` return all; filter client-side. (Intent 4 Pattern A, not `searchAll`.) |
| "What is BEP-20?" | `BEP-20` | Keep the term verbatim. |
| "我想学比特币入门" | `Bitcoin` (NOT `比特币`) | English corpus is larger; `lang` can still be `zh`. (Intent 3.) |
| "智能合约是什么?" | `智能合约` (zh, try first) → `smart contract` (en, fallback) | zh `智能合约` → glossary tier 3 (clean hit). Only translate to en if the zh noun misses. See §4. |
| "全部身家投 crypto 行吗?" | `risk management` (then `investment risk`) | Symptom → concept; user is asking about a risky activity. See the Risk-Education Term Map. |
| "以太坊 gas 太贵怎么办?" | `gas fee` | Topic is gas; drop "太贵怎么办". |
| "DeFi 流动性池是什么" | `liquidity pool` | Map to the canonical English term. |
| "explain proof of stake vs proof of work" | `proof of stake` (first) | Two related concepts; pick the first and broaden if needed. |
| "遇到年化 200% 的项目靠谱吗?" | `crypto scam` (then `investment risk`) | Symptom → concept; likely scam. See the Risk-Education Term Map. |
| "什么是爆仓?" | `强制平仓` (zh, then `forced liquidation` en) | See the Risk-Education Term Map — `强制平仓` → glossary tier 3; `forced liquidation` only reaches articles tier 1. |
| "一文读懂 Solv Protocol (SOLV)" (raw missed) | `Solv Protocol` | Drop "一文读懂" and the ticker. |
| "What is Turtle (TURTLE)?" (raw missed, zh) | `Turtle` | Drop "What is" and the ticker. |

## Ambiguous-Symptom Strategy

Some user inputs describe a symptom, not a concept. For example,
"收到的币变少" could be:
- **gas fee** — the user paid gas and saw less than expected.
- **withdrawal fee** — the exchange took a withdrawal cut.
- **slippage** — the swap price moved during the trade.
- **network fee** — a third-party fee.

Strategy:
1. Run `searchAll` with the raw symptom phrase first (e.g.,
   "收到的币变少"). If the L&E or Resource endpoint hits on a
   course that explains the symptom, `searchAll` will surface it.
2. If `searchAll` returns 0 hits or off-topic hits, pick the **most
   likely** term (e.g., `gas fee` for "收到的币变少" — it is the most
   common cause) and retry `searchAll` with that keyword.
3. Read the top hit's `excerpt`. If it clearly describes the user's
   situation, use it.
4. If the excerpt does not match, retry `searchAll` with the next
   candidate (e.g., `withdrawal fee`).
5. If no candidate matches after 2-3 tries, say so honestly rather
   than present an off-topic answer.

## Backend Behavior Reference

The backend uses PostgreSQL `plainto_tsquery('simple', ...)`:
- **Case-insensitive** — `DeFi` and `defi` match the same rows.
- **Word-level** — splits input into tokens AND ANDs them together.
  A 10-word sentence becomes a 10-token AND query, which matches
  almost nothing.
- **No stemming** — `leverage` and `leveraging` are different tokens.
- **No stopword removal** — "what", "is", "the" are NOT removed
  by the `'simple'` config; they become search tokens, lowering
  recall. This is why Chinese raw sentences often miss — the
  question words become AND tokens that no title contains.

`searchAll`'s matchTier ranking tolerates this: Tier 1 checks for query token overlap in title/slug, rescuing lower-relevance hits that actually match the concept by title.

## Per-Intent Defaults

| Intent | Default query strategy |
|--------|------------------------|
| 1 (Knowledge Q&A) | **English**: raw input first → keyword fallback. **CJK**: extract keyword first (topic noun + English translation) — do NOT try the raw sentence first (see "Language scope" above). Exception: bare CJK concept nouns (钱包, 智能合约) can go raw. |
| 2 (Risk Education) | **English**: raw input first. **CJK**: go straight to the Risk-Education Term Map below (the raw sentence almost never hits and the correct fallback term is rarely obvious). Risk-warning block always. |
| 3 (Learning Plan) | **Prefer keyword from the start** (searchResource rarely matches full sentences like "我想学 DeFi"); extract the topic noun upfront. Applies to all languages. |
| 4 (Learn & Earn) | Raw input first (often hits directly because L&E titles match user phrasing) → keyword fallback (drop "一文读懂" and ticker) → no cross-endpoint fallback (different intent). Works for both English and CJK because L&E titles usually contain the project name verbatim. |

## See Also

- `SKILL.md` — overall flow (intent detection → query strategy → fallback)
- `api-contract.md` — backend's `plainto_tsquery` behavior and field constraints
- `intent-routing.md` — extraction happens after intent detection
- `output-format.md` — what to do with the API response
