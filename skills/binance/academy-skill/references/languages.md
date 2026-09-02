# Supported Languages

The Academy skill's `lang` field accepts 35 language codes for the 5
academy-series endpoints (`searchGlossary`, `searchLearnEarn`,
`searchResource`, `resolveParentTrack`, `getTrackOutline`). The
backend matches them against the `language` column of Academy's
content tables.

The `searchArticles` endpoint accepts a **different (smaller) set of
41 language codes** — see "Articles-supported languages" at the
bottom of this file. Notably `zh`, `zt`, and `ja` are NOT supported
by the articles endpoint; the script auto-falls back to `en` for
those (see "Auto-fallback to `en`" below).

## Full Code List

| Code | Language | Notes |
|------|----------|-------|
| `ar` | Arabic | RTL |
| `az-AZ` | Azerbaijani | |
| `bg` | Bulgarian | |
| `bn` | Bengali | |
| `cs` | Czech | |
| `da` | Danish | |
| `de` | German | |
| `de-CH` | Swiss German | regional variant |
| `el` | Greek | |
| `en` | English | largest content corpus; preferred for technical terms |
| `es` | Spanish | |
| `et` | Estonian | |
| `fr` | French | |
| `hr-HR` | Croatian | |
| `hu` | Hungarian | |
| `id` | Indonesian | |
| `it` | Italian | |
| `ja` | Japanese | |
| `ka` | Georgian | |
| `kk-KZ` | Kazakh | |
| `ky-KG` | Kyrgyz | |
| `lt` | Lithuanian | |
| `lv` | Latvian | |
| `pl` | Polish | |
| `pt` | Portuguese | |
| `ro` | Romanian | |
| `ru` | Russian | |
| `sk` | Slovak | |
| `sv` | Swedish | |
| `tr` | Turkish | |
| `uk` | Ukrainian | |
| `ur` | Urdu | |
| `ur-PK` | Urdu (Pakistan) | regional variant |
| `vi` | Vietnamese | |
| `zh` | Chinese (Simplified) | default for Simplified Chinese user input |
| `zt` | Chinese (Traditional) | default for Traditional Chinese user input |

## Default Mapping (user input -> `lang`)

| User writes in | `lang` value |
|----------------|--------------|
| Simplified Chinese | `zh` |
| Traditional Chinese | `zt` |
| English | `en` |
| Japanese | `ja` |
| Korean (not in the supported list) | fall back to `en` |
| Russian | `ru` |
| Vietnamese | `vi` |
| Spanish / French / German / Italian / Portuguese | corresponding code |
| Mixed languages (e.g., "我想学 DeFi") | use the language of the prose (Chinese -> `zh`), but keep the technical term in English for the `query` |

## Backend Constraints

- **Field regex:** `^[A-Za-z0-9_-]{0,16}$` — case-sensitive. Use `zh`,
  not `ZH`; `de-CH`, not `de-ch`.
- **Max length:** 16 chars. All listed codes fit.
- **Empty string** (`lang=""`) is valid and means "all languages" —
  useful for `searchResource` when you want cross-lingual recall. This
  is different from `lang` omitted entirely (the backend applies its
  own default, usually `en`).
- **`getTrackOutline` requires `lang`.** If you omit it, the backend
  returns HTTP 400 with `code=000002 "illegal parameter"` (verified
  by direct test, 2026-08-04) — it does NOT silently return duplicated
  rows. Always pass `lang` for outline calls.
- **`searchResource` and `searchGlossary` accept `lang=""`** when you
  want broad recall; filter client-side by the `language` field on
  each returned item.

## Choosing `lang` vs `query` Language

The two are independent:
- `lang` controls which language version of Academy content is
  searched and returned.
- `query` is the search string itself — it can be in any language
  regardless of `lang`, but recall is highest when the query language
  matches the `lang` setting.

For technical concepts (DeFi, smart contract, gas fee, BEP-20),
prefer `query` in English even when `lang=zh`, because Academy's
English corpus is the largest and the term is usually left
untranslated in Chinese content too.

## Articles-supported languages (41 codes — `searchArticles` only)

The `searchArticles` endpoint accepts a **different (smaller) set of
language codes** than the 35-code academy-series list above. Notable
absences: **`zh`, `zt`, `ja`** (Chinese / Japanese are NOT supported
by the articles endpoint).

Full 41-code list (verified 2026-08-05):

```
ar  az-AZ  bg  bn  cs  da  de  de-CH  de-DE  dk  el  en  es  et  fi
fr  he  hr-HR  hu  id  it  ka  kk-KZ  ky-KG  lt  lv  nl  no  ph  pl
pt  ro  ru  sk  sv  th  tr  uk  ur  ur-PK  vi
```

| Articles-only code | Language | Not in academy 35-list? |
|--------------------|----------|--------------------------|
| `de-DE` | German (Germany) | yes (new) |
| `dk` | Danish (alt code) | yes (new) |
| `fi` | Finnish | yes (new) |
| `he` | Hebrew | yes (new) |
| `nl` | Dutch | yes (new) |
| `no` | Norwegian | yes (new) |
| `ph` | Filipino | yes (new) |
| `th` | Thai | yes (new) |

| In academy 35-list but NOT supported by articles | Reason |
|--------------------------------------------------|--------|
| `zh` | Chinese (Simplified) — articles endpoint has no Chinese corpus |
| `zt` | Chinese (Traditional) — same |
| `ja` | Japanese — articles endpoint has no Japanese corpus |

### Auto-fallback to `en`

The script (`academy-api.mjs`) silently normalizes the articles
`language` field via the exported `getArticlesLang(lang)` helper:

| Input `lang` | Articles `language` used | Why |
|--------------|-------------------------|-----|
| `"en"` | `"en"` | supported → returned unchanged |
| `"fr"`, `"de"`, `"de-CH"`, `"ph"`, … | same | supported → returned unchanged |
| `"zh"`, `"zt"`, `"ja"`, `"ko"`, … | `"en"` | unsupported → falls back to English |
| `""` (explicit) | `""` | "all languages" — bypasses fallback |
| `undefined` / `null` / omitted | `"en"` | no lang specified → default English |

`searchAll` exposes the actual language used in `articlesLangUsed`
and a boolean `articlesLangFallback` (true when the requested `lang`
was not supported and the script fell back to `en`). When
`articlesLangFallback == true` AND `best.source == "articles"`, the
LLM is responsible for translating the returned English article's
`title` / `brief` / `bodyTextOnly` (or `content` after `stripHtml`)
back to the user's input language when paraphrasing the card. The
`visitUrl` is shown as-is (don't rewrite URLs to a non-existent
locale).

Direct `searchArticles` callers get the same auto-fallback; pass
`language: ""` to bypass and request "all languages". The exported
`getArticlesLang(lang)` helper predicts the actual language the
script will use.

### Other `searchArticles` script defaults

In addition to the language fallback, the script applies the following
defaults to `searchArticles` calls (see `api-contract.md` § Endpoint 6
for full details):

| Field | Script default | Override |
|-------|----------------|----------|
| `source` | `"Binance Academy"` (when `undefined`/`null`) | Pass an explicit `source` or `source: ""` (all sources) |
| `docCount` | `1` (when `undefined`/`null`) | Pass an explicit `docCount` (e.g., 3, 5) |
| `queryType` | `"vector"` (when `undefined`/`null`/`""`) — semantic/cosine similarity, better for natural-language queries | Pass `queryType: "fts"` for exact keyword / ticker matching |
| `bodyTextOnly` / `content` (response) | Returned in full (NOT truncated) — the LLM distills the content into a concise query answer (see `SKILL.md` "Format the output" rule 4) | N/A — script does not modify; the LLM must summarize, not paste |
| `visitUrl` (response) | Replaced by a canonical Academy article URL resolved via the public v2 search API (`/bapi/composite/v2/public/pgc/content/academy/search`). Original kept as `originalVisitUrl`. See `api-contract.md` § "Article URL resolution (script-applied)". | N/A — script always resolves; falls back to `articlePath` then original `visitUrl` |

`searchAll` always uses `source: "Binance Academy"`,
`docCount: limit || 1`, and `queryType: "vector"` for articles, and
exposes all three in the response as `articlesSourceUsed` /
`articlesDocCountUsed` / `articlesQueryTypeUsed`.

## See Also

- `api-contract.md` — full schema for the `lang` field on every endpoint
- `query-extraction.md` — when to keep English terms vs localize
- `intent-routing.md` — detecting the user's language from input
