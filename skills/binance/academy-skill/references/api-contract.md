# Binance Academy Skill — API Contract

Verified by direct curl tests on 2026-08-04. The examples are real
responses captured from the live prod deployment.

## At a Glance — 6 endpoints + 3 calling patterns

**6 backend endpoints** (all `POST /v1/public/bigdata/academy-skill/<name>`):

| # | Endpoint | Purpose | Input | Output | Standalone? |
|---|----------|---------|-------|--------|:-----------:|
| 1 | `searchGlossary` | Glossary term full-text search | `query` + `lang` + `limit` | `items[].{glossaryId, title, excerpt, content, pageUrl, relevance}` | ✅ |
| 2 | `searchLearnEarn` | L&E course search | `query` + `lang` + `limit` | `items[].{courseId, courseTitle, courseDescription, hasReward, pageUrl, relevance}` | ✅ |
| 3 | `searchResource` | Track/Course/Module search | `query` + `lang` + `limit` + `resourceTypes` | `items[].{resourceId, resourceType, title, pageUrl, relevance}` | ✅ (outputs `resourceId` for #4) |
| 4 | `resolveParentTrack` | Reverse-lookup parent Track from a hit resource | `hitResourceId` + `lang` | `items[].{resourceId, trackTitle, pageUrl}` | ❌ Input comes from #3's `resourceId` |
| 5 | `getTrackOutline` | Expand Track → Course → Module tree | `trackId` + `lang` (**required**) | `{trackId, courses[].{courseTitle, modules[].{moduleTitle}}}` | ❌ Input comes from #4's `resourceId` or #3 when it directly hits a TRACK |
| 6 | `searchArticles` | Academy/Blog/Research/FAQ/Announcement article search | `query` + `language` + `docCount` + `queryType` + `source` + ... | `items[].{title, brief, content, bodyTextOnly, visitUrl, similarity}` | ✅ (**schema differs from 1-5**) |

### Calling relationship diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│  Pattern A: Single-query (Intent 1, 2, 4)                            │
│                                                                      │
│  searchGlossary(query, lang) ──────┐                                  │
│  searchLearnEarn(query, lang) ────┼─→ Use items[] directly as LLM    │
│  searchResource(query, lang) ────┤    context                        │
│  searchArticles(query, language) ─┘                                  │
│                                                                      │
│  Script wrapper: searchAll(query, lang, limit) ── calls all 4 in     │
│            parallel, picks best.source by matchTier + relevance      │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  Pattern B: Learning-plan orchestration (Intent 3)                   │
│                                                                      │
│  Step 1: searchResource(query, lang)                                 │
│              │                                                       │
│              ▼  items[0] (top hit, sorted by relevance desc)         │
│      ┌──────┴──────┐                                                 │
│      │             │                                                  │
│   ACADEMY_TRACK  COURSE/MODULE                                        │
│      │             │                                                  │
│      │             ▼                                                  │
│      │   Step 2: resolveParentTrack(hitResourceId=items[0].resourceId)│
│      │             │                                                  │
│      │             ▼  items[0].resourceId (Track id)                 │
│      └──────┬──────┘                                                  │
│             │                                                        │
│             ▼  trackId                                                │
│   Step 3: getTrackOutline(trackId, lang)                              │
│             │                                                        │
│             ▼  {trackId, courses[].modules[]}                         │
│      Assemble the learning-plan card                                  │
│                                                                      │
│  Script wrapper: getLearningPlan(query, lang, limit) ── runs 3 steps │
│                  sequentially                                         │
└─────────────────────────────────────────────────────────────────────┘
```

### Quick Start — 3 most common call patterns

#### Pattern 1: Knowledge Q&A — `searchAll` (parallel, recommended)

```bash
# searchAll calls 4 search endpoints in parallel, picks best by matchTier + relevance
curl -X POST 'https://www.binance.com/bapi/bigdata/v1/public/bigdata/academy-skill/searchGlossary' \
  -H 'Content-Type: application/json' \
  -d '{"query":"gas fee","lang":"en","limit":3}'
# → data.items[].{glossaryId, title, excerpt, pageUrl, relevance}

# Or use the script wrapper searchAll (parallel + ranking + article URL resolution)
node scripts/academy-api.mjs prod searchAll \
  '{"query":"gas fee","lang":"en","limit":3}'
# → {glossary, learnEarn, resource, articles, best:{source,items,matchTier}, ...}
```

#### Pattern 2: Learning Plan — `getLearningPlan` (3-step orchestration)

```bash
# Script wrapper: runs searchResource → resolveParentTrack → getTrackOutline automatically
node scripts/academy-api.mjs prod getLearningPlan \
  '{"query":"DeFi","lang":"en","limit":3}'
# → {topHit, parentTrack, outline:{trackId, courses[].modules[]}}

# Or split into the 3 manual steps:
# Step 1
curl -X POST 'https://www.binance.com/bapi/bigdata/v1/public/bigdata/academy-skill/searchResource' \
  -H 'Content-Type: application/json' \
  -d '{"query":"DeFi","lang":"en","limit":3}'
# → items[0].resourceId = "18" (Module)

# Step 2 (use Step 1's resourceId)
curl -X POST 'https://www.binance.com/bapi/bigdata/v1/public/bigdata/academy-skill/resolveParentTrack' \
  -H 'Content-Type: application/json' \
  -d '{"hitResourceId":"18","lang":"en"}'
# → items[0].resourceId = "3" (Track)

# Step 3 (use Step 2's resourceId as trackId)
curl -X POST 'https://www.binance.com/bapi/bigdata/v1/public/bigdata/academy-skill/getTrackOutline' \
  -H 'Content-Type: application/json' \
  -d '{"trackId":"3","lang":"en"}'
# → {trackId:"3", courses:[{courseTitle, modules:[{moduleTitle}]}]}
```

#### Pattern 3: Article Search — `searchArticles` (separate schema)

```bash
curl -X POST 'https://www.binance.com/bapi/bigdata/v1/public/bigdata/academy-skill/searchArticles' \
  -H 'Content-Type: application/json' \
  -d '{"query":"what is bitcoin","language":"en","docCount":3}'
# → data.items[].{title, brief, content, bodyTextOnly, visitUrl, similarity, source}
```

### Script wrapper vs raw API — defaults and post-processing differences

The following defaults and post-processing are applied by `scripts/academy-api.mjs` and **do NOT take effect when calling the raw API via curl directly**:

| Behavior | Direct curl on raw API | Script call (`node academy-api.mjs ...`) |
|----------|------------------------|------------------------------------------|
| `searchArticles.source` default | Backend default (all sources) | `"Binance Academy"` |
| `searchArticles.docCount` default | Backend default `10` | `1` (long-form articles, LLM distillation) |
| `searchArticles` `language` | No fallback, sent as-is | Auto-fallback to `"en"` when not in the 41-code list |
| `searchArticles` `visitUrl` | Backend raw value (may be empty) | Resolved via the v2 search API to `{publicDomain}/{lang}/academy/articles/{slug}`, falling back to `articlePath`, then to the original value |
| `searchAll` (parallel + ranking) | Does not exist | Script-only; runs 4 endpoints in parallel, picks best by matchTier + relevance |
| `getLearningPlan` (3-step orchestration) | Does not exist | Script-only; runs 3 steps sequentially and assembles the result |
| `query` preprocessing | Backend runs `plainto_tsquery` | Script additionally strips control chars, trims, truncates to 200 chars |

**Third parties calling the raw API directly via curl**: none of the
"script defaults" above apply — you must handle them yourself.
**Third parties building on top of the script**: the defaults above
are already in effect; you can use the script's exported functions
directly.

---

## Overview

| Item | Value |
|------|-------|
| HTTP method | `POST` (all endpoints) |
| Path prefix | `/v1/public/bigdata/academy-skill/<endpoint>` |
| Content-Type | `application/json` |
| Authentication | None — endpoints are public; the caller provides no credentials |
| Request body | JSON object, UTF-8 |
| Response body | JSON object wrapped in a standard envelope (see below) |

### Base URLs

| Env | Base URL |
|------|----------|
| `prod` | `https://www.binance.com/bapi/bigdata` |

### Response Envelope

```json
{
  "code": "000000",
  "message": null,
  "data": { },
  "success": true
}
```

| `code` | Meaning | HTTP | Action |
|--------|---------|------|--------|
| `000000` | success | 200 | read `data` |
| `000001` | backend error (transient — retry later) | 200 | tell user Academy is temporarily unavailable; suggest retry |
| `000002` | illegal parameter (e.g., missing required `lang` for `getTrackOutline`) | 400 | fix the request and retry |
| `000003` | Too many requests (rate limit exceeded) | 429 | back off and retry; surface friendly "Academy is busy" if persisting |

The HTTP layer returns **200 for well-formed requests** (success,
backend error, no-hit, all return 200 with different `code` values).
The only non-200 statuses are **400** (malformed request —
`code=000002`) and **429** (rate-limited — `code=000003`). Distinguish
well-formed outcomes by `code` and the shape of `data`, not by HTTP
status.

## Authentication & Rate Limiting

The Academy skill endpoints (`/v1/public/bigdata/academy-skill/*`)
are **public** — the caller provides no credentials. Rate limiting
is enforced at the platform level; when the rate limit is exceeded,
the API returns HTTP 429 with `code=000003` (see Response Envelope
above). Treat 429 as transient — back off and retry, or surface a
friendly "Academy is busy, try again in a moment" message.

### Error handling

When the API encounters a transient backend error, it returns
`code=000001` with `data: null` (NOT `data: { items: [] }`).
Distinguish:

- `data == null` (or `data.items == null`) → backend error. Surface
  a friendly "Academy content temporarily unavailable, please try
  again" message. Do NOT retry immediately — the same issue will
  likely persist for a few seconds.
- `data.items == []` (empty array, not null) → success with no hits.
  This is a valid "no Academy content matched" outcome — surface the
  No-Content Template (see `output-format.md`), not an error.

The skill should never raise an exception on `data: null`; the
script (`academy-api.mjs`) returns `[]` from the public functions in
this case (see `data?.items ?? []`), so the LLM-level retry logic
works the same way as for empty hits — but the LLM should distinguish
the two when formatting the card.

## Common Field Semantics (academy-series endpoints)

These constraints apply to `searchGlossary`, `searchLearnEarn`,
`searchResource`.

| Field | Type | Required | Constraints | Default |
|-------|------|----------|-------------|---------|
| `query` | string | yes | 1-200 chars. The server normalizes by stripping ISO control chars and zero-width chars, collapsing whitespace, and truncating to 200. **Does NOT lowercase** — `plainto_tsquery('simple', ...)` lowercases tokens anyway, but the raw query is also written to logs and to the cache key (lowercased for key stability). | — |
| `lang` | string | no | regex `^\s*[A-Za-z0-9_-]{0,16}\s*$` (allows surrounding whitespace; server trims). Max 16. **Case-sensitive** — use `zh`, not `ZH`; `de-CH`, not `de-ch`. Empty / omitted / whitespace-only → "all languages" (the field is NOT sent). | — |
| `limit` | int | no | 1-10 (out-of-range returns HTTP 400). Default 5. The server always queries at `limit=10` and truncates client-side, so `limit=3` and `limit=10` share the same cache entry — see "Cache" below. | 5 |

### `relevance`

| Field | Type | Notes |
|-------|------|-------|
| `relevance` | float | 0.0-1.0, computed from PostgreSQL `ts_rank` over the long HTML `content` column. Higher is better. Items are returned sorted by `relevance` desc. Long entries that mention a concept extensively can outrank the entry that IS the concept — see `SKILL.md` "Match tier" for how `searchAll` restores title-match priority. **Not present on resolveParentTrack responses** (it is an exact id lookup, not full-text search). |

## Endpoint 1 — `searchGlossary`

Glossary term full-text search. Used by Intent 1 (Knowledge Q&A) and
Intent 2 (Risk Education).

**Method + path:** `POST /v1/public/bigdata/academy-skill/searchGlossary`

### Request Body

| Field | Type | Required | Constraints | Default |
|-------|------|----------|-------------|---------|
| `query` | string | yes | max 200 chars | — |
| `lang` | string | no | `^[A-Za-z0-9_-]{0,16}$`, max 16 | backend default (`en`) |
| `limit` | int | no | 1-10 | 5 |

### Response `data`

```json
{
  "items": [ { "glossaryId": "171", "language": "en", "slug": "gas-limit",
    "title": "Gas Limit", "excerpt": "The maximum price...",
    "content": "<h2>...</h2>",
    "pageUrl": "https://www.binance.com/en/academy/glossary/gas-limit",
    "difficultyId": 2, "author": "Binance Academy", "relevance": 0.322 } ],
  "total": 2
}
```

| Field | Type | Notes |
|------|------|-------|
| `items[].glossaryId` | string | numeric string, e.g., `"171"` |
| `items[].language` | string | matches requested `lang` (or the term's authored language) |
| `items[].slug` | string | URL slug, used to build `pageUrl` |
| `items[].title` | string | display title |
| `items[].excerpt` | string | short summary; use this for prose, not `content` |
| `items[].content` | string | HTML; do not paste raw into chat — paraphrase |
| `items[].pageUrl` | string | canonical glossary URL; language-specific |
| `items[].difficultyId` | int | 1=Beginner, 2=Intermediate, 3=Advanced (typical mapping) |
| `items[].author` | string | usually `"Binance Academy"` |
| `items[].relevance` | float | higher is better |
| `total` | int | count of `items` after truncation (NOT the total before `limit` — see "Cache" below) |

### Verified Example

Request: `{"query":"gas fee","lang":"en","limit":2}`

Response top hits:
1. `glossaryId=171, title="Gas Limit", slug="gas-limit", pageUrl="https://www.binance.com/en/academy/glossary/gas-limit", relevance=0.322`
2. `glossaryId=289, title="BEP-20", slug="bep-20", pageUrl="https://www.binance.com/en/academy/glossary/bep-20", relevance=0.223`

## Endpoint 2 — `searchLearnEarn`

Learn & Earn course search. Used by Intent 4.

**Method + path:** `POST /v1/public/bigdata/academy-skill/searchLearnEarn`

### Request Body

Same shape as `searchGlossary`:

| Field | Type | Required | Constraints | Default |
|-------|------|----------|-------------|---------|
| `query` | string | yes | max 200 chars | — |
| `lang` | string | no | same regex | `en` |
| `limit` | int | no | 1-10 | 5 |

For "list all reward courses" use cases, pass a broad query like
`"reward"` or `"learn"` — the backend returns all matching Learn &
Earn rows; filter client-side.

### Response `data.items[]`

```json
{ "courseId": "BN967244191857246209", "lang": "en",
  "courseTitle": "Introduction to Bitcoin", "courseDescription": "...",
  "courseImage": "https://...", "hasReward": "0", "isRewardRunOut": "1",
  "activityStartDate": "2024-03-01 17:00:00",
  "activityEndDate": "2024-04-01 17:00:00",
  "pageUrl": "https://www.binance.com/en/academy/learn-and-earn/course/BN...",
  "relevance": 0.0 }
```

| Field | Type | Notes |
|------|------|-------|
| `courseId` | string | prefixed with `BN` |
| `lang` | string | the language the course is authored in |
| `courseTitle` | string | display title |
| `courseDescription` | string | HTML or plain; paraphrase, do not paste |
| `courseImage` | string | thumbnail URL |
| `hasReward` | **string** | `"1"` = has reward, `"0"` = no reward. NOT a boolean — never compare with `true`/`false`. |
| `isRewardRunOut` | **string** | `"1"` = reward pool exhausted, `"0"` = still available. NOT a boolean. |
| `activityStartDate` | string | `YYYY-MM-DD HH:mm:ss`, server timezone (UTC+8) |
| `activityEndDate` | string | same format; compare to current UTC+8 time to decide if the activity is still running |
| `pageUrl` | string | course detail URL |
| `relevance` | float | often `0.0` for Learn & Earn (no full-text weight) |

### "Has reward now" filter

A course is currently reward-eligible **iff**:
- `hasReward == "1"` AND
- `isRewardRunOut != "1"` AND
- `activityEndDate` is in the future (compare against current UTC+8 time).

Apply this filter client-side after the API call.

## Endpoint 3 — `searchResource`

Article/Track/Course/Module search. Step 1 of the learning-plan
orchestration (see `orchestration.md`).

**Method + path:** `POST /v1/public/bigdata/academy-skill/searchResource`

### Request Body

| Field | Type | Required | Constraints | Default |
|-------|------|----------|-------------|---------|
| `query` | string | yes | max 200 chars | — |
| `lang` | string | no | same regex as common fields | `en` |
| `limit` | int | no | 1-10 | 5 |
| `resourceTypes` | string[] | no | max 8 items. Each item: regex `^[A-Z][A-Z0-9_]{0,63}$` (uppercase letter followed by uppercase letters/digits/underscores, max 64 chars). | `["ACADEMY_COURSE","ACADEMY_MODULE","ACADEMY_TRACK"]` (alphabetical) |

#### `resourceTypes` sanitization

The API **sanitizes** the `resourceTypes` array before processing it.
The skill caller does not see this, but it matters for understanding
why some inputs behave the same:

1. **Normalize**: each entry is uppercased (using `Locale.ROOT` to
   avoid the Turkish-locale 'i' → 'İ' trap) and whitespace-stripped.
2. **Filter**: entries not matching `^[A-Z][A-Z0-9_]{0,63}$` are
   dropped silently. **No enum whitelist** — the regex check is
   intentional: the backend already has resource types like `ACADEMY_MODULE`,
   `ACADEMY_PACKAGE`, `ACADEMY_CATEGORY`, `ACADEMY_FAQ`, and more may
   be added. A hardcoded enum would silently filter out legitimate
   future types.
3. **Dedupe + sort alphabetically**: makes the cache key independent of
   the caller's input order. `["ACADEMY_TRACK","ACADEMY_COURSE"]` and
   `["ACADEMY_COURSE","ACADEMY_TRACK"]` produce the same cache entry.
4. **Fallback to default**: if ALL entries are invalid, the API
   logs a warning and uses `["ACADEMY_COURSE","ACADEMY_MODULE","ACADEMY_TRACK"]`.

Common `resourceTypes` values:
- `ACADEMY_TRACK` — top-level learning path
- `ACADEMY_COURSE` — a Course inside a Track
- `ACADEMY_MODULE` — a Module (article-like unit) inside a Course

The skill normally passes all three to maximize recall, but you can
restrict to e.g. `["ACADEMY_TRACK"]` if you only want top-level paths.

### Response `data.items[]`

```json
{ "resourceId": "18", "resourceType": "ACADEMY_MODULE",
  "resourceKey": "introduction-to-deFi", "language": "en",
  "difficultLevel": null, "isPaid": null, "parentResourceId": "17",
  "pageUrl": "https://www.binance.com/en/academy/courses/track/beginner-track/decentralization/introduction-to-deFi",
  "relevance": 0.0906, "title": "Introduction to DeFi", "subTitle": null,
  "imageUrl": "...", "videoUrl": null }
```

| Field | Type | Notes |
|------|------|-------|
| `resourceId` | string | numeric string; used as `hitResourceId` for `resolveParentTrack` |
| `resourceType` | string | `ACADEMY_MODULE` / `ACADEMY_COURSE` / `ACADEMY_TRACK`. The data also includes `ACADEMY_PACKAGE` / `ACADEMY_CATEGORY` / `ACADEMY_FAQ` etc.; the skill normally restricts `resourceTypes` to TRACK/COURSE/MODULE but the field is open-ended. |
| `resourceKey` | string | URL slug |
| `language` | string | content language |
| `difficultLevel` | int\|null | 1=Beginner, 2=Intermediate, 3=Advanced. Track has a value; Module often `null`. |
| `isPaid` | **string\|null** | stored as `'0'`/`'1'` string. **NOT a boolean** — never compare with `true`/`false`. Same convention as `hasReward` / `isRewardRunOut`. |
| `parentResourceId` | string\|null | `null` for Track; Course's parent is Track; Module's parent is Course |
| `pageUrl` | string | resource URL |
| `relevance` | float | higher is better |
| `title` | string\|null | display title — derived from the internal `descriptions` JSONB (see "descriptions JSONB" below). `null` when the JSONB itself is `null`. |
| `subTitle` | string\|null | derived from `descriptions.subTitle`; usually only populated for Track |
| `imageUrl` | string\|null | derived from `descriptions.imageUrl` |
| `videoUrl` | string\|null | derived from `descriptions.videoUrl`; only some Modules have it |

#### `descriptions` JSONB (internal — not exposed to callers)

The API returns a `descriptions` JSON object with up to 16 keys
(`title`, `subTitle`, `content`, `imageUrl`, `imageUrlV2`, `videoUrl`,
`logo`, `logoV2`, `logoRedirectLink`, `duration{seconds,nanos}`,
`isVisible`,
`quizList`, `endorsements`, `nft_eligibility`, `trackCategoryId`,
`courseLevel`). The server extracts only `title` / `subTitle` /
`imageUrl` / `videoUrl` as top-level fields and **drops the rest**:

- `descriptions.content` is **page layout JSON** (`{"layout":{"root":["ViewInstance0"],...}}`), not readable prose — exposing it would burn the LLM token budget and the cache byte budget.
- `logo*` / `imageUrlV2` / `isVisible` / `quizList` / `endorsements` / `nft_eligibility` / `trackCategoryId` are rendering/ops fields with no Q&A value.
- `duration` is observed to be `{seconds:0,nanos:0}` across the sample.

The skill MUST NOT expect an `excerpt`-like field on Resource items —
only `subTitle` (often `null` for Modules) and the title link. See
`SKILL.md` "Format the output" → "Empty short fields" rule, or
`references/output-format.md` "Common Rules" §7.

### Verified Example

Request: `{"query":"defi","lang":"en","limit":3}`

Top 3 hits:
1. `resourceId=18, resourceType=ACADEMY_MODULE, title="Introduction to DeFi", parentResourceId=17, pageUrl=".../courses/track/beginner-track/decentralization/introduction-to-deFi"`
2. `resourceId=19, resourceType=ACADEMY_MODULE, title="DeFi Use Cases", parentResourceId=17`
3. `resourceId=100, resourceType=ACADEMY_MODULE, title="1.3 Understanding Key DeFi Indicators", parentResourceId=62`

Note: the user's specific knowledge point usually lives at the Module
level. If you restrict `resourceTypes` to Track/Course only, the chain
breaks for specific questions — see `orchestration.md`.

## Endpoint 4 — `resolveParentTrack`

Reverse-lookup the parent Track from a hit resource id. Step 2 of the
orchestration, used only when step 1's top hit is a Course or Module.

**Method + path:** `POST /v1/public/bigdata/academy-skill/resolveParentTrack`

### Request Body

| Field | Type | Required | Constraints | Default |
|-------|------|----------|-------------|---------|
| `hitResourceId` | string | yes | regex `^\s*[A-Za-z0-9_.:-]{1,64}\s*$` (alphanumeric + `_` + `.` + `:` + `-`, max 64, allows surrounding whitespace; server trims). The `.` and `:` are allowed because resource ids sometimes carry namespace prefixes. Samples are pure numeric (`"470"`). | — |
| `lang` | string | no | regex `^\s*[A-Za-z0-9_-]{0,16}\s*$`, max 16. Empty / omitted → "all languages". | backend default (`en`) |

`hitResourceId` is the `resourceId` returned by `searchResource`. This
endpoint does an **exact id-based lookup** (no full-text search), so
the response has no `relevance` field — see the response table below.

### Response `data.items[]`

```json
{ "resourceId": "3", "resourceType": "ACADEMY_TRACK",
  "resourceKey": "beginner-track", "language": "en",
  "difficultLevel": 1, "pageUrl": "https://www.binance.com/en/academy/track/beginner-track",
  "trackTitle": "Beginner Track",
  "trackSubTitle": "The fundamentals of crypto & blockchain",
  "imageUrl": "..." }
```

| Field | Type | Notes |
|------|------|-------|
| `resourceId` | string | the Track's id; pass this as `trackId` to `getTrackOutline` |
| `resourceType` | always `"ACADEMY_TRACK"` | |
| `resourceKey` | string | URL slug |
| `language` | string | |
| `difficultLevel` | int | 1=Beginner, 2=Intermediate, 3=Advanced |
| `pageUrl` | string | Track landing page |
| `trackTitle` | string\|null | derived from the internal `descriptions` JSONB (see "descriptions JSONB" under Endpoint 3). `null` when JSONB is `null`. |
| `trackSubTitle` | string\|null | derived from `descriptions.subTitle` |
| `imageUrl` | string\|null | derived from `descriptions.imageUrl` |

**No `relevance` field.** This endpoint does an exact id-based lookup
(`WHERE resource_id = $hit_resource_id`), not a full-text search —
there is no `ts_rank` to surface. Items in `data.items[]` are
unordered; usually there is exactly one.

The full `descriptions` JSONB (`content`, `logo*`, `quizList`, etc.)
is dropped by the server for the same reasons as `searchResource` —
see "descriptions JSONB" under Endpoint 3.

### Verified Example

Request: `{"hitResourceId":"18","lang":"en"}`

Response: `resourceId=3, resourceType=ACADEMY_TRACK, trackTitle="Beginner Track", trackSubTitle="The fundamentals of crypto & blockchain", difficultLevel=1, pageUrl="https://www.binance.com/en/academy/track/beginner-track"`

If `data.items` is empty, the hit Course/Module has no parent Track in
Academy's tree — fall back to the original `pageUrl` from
`searchResource`. See `orchestration.md` for the edge-case policy.

## Endpoint 5 — `getTrackOutline`

Expand a Track into its Course[] -> Module[] tree. Step 3 of the
orchestration.

**Method + path:** `POST /v1/public/bigdata/academy-skill/getTrackOutline`

### Request Body

| Field | Type | Required | Constraints | Default |
|-------|------|----------|-------------|---------|
| `trackId` | string | yes | regex `^\s*[A-Za-z0-9_.:-]{1,64}\s*$` (alphanumeric + `_` + `.` + `:` + `-`, max 64, allows surrounding whitespace; server trims). Same pattern as `hitResourceId`. | — |
| `lang` | string | **yes** | regex `^\s*[A-Za-z0-9_-]{1,16}\s*$` (**note `{1,16}` — must be non-empty**, unlike the optional `lang` on other endpoints). Required, must not be blank. | — |

**`lang` is REQUIRED for this endpoint.** If omitted, the backend
returns HTTP 400 with `code=000002 "illegal parameter"` (verified by
direct test, 2026-08-04) — it does NOT silently return duplicated
rows. Always pass `lang` (e.g., `"en"` or `"zh"`) for outline calls.

Why this endpoint's `lang` is required when others' is optional: the
API returns one row per (Course × Module × Language) combination.
Without a `lang` filter the same Course appears multiple times —
once per translated version —
and the assembler silently produces a "complete-looking" outline with
duplicate courses. The required-`lang` check is a defense against
silent data corruption, not just parameter validation.

### Response `data`

```json
{
  "trackId": "3",
  "courses": [ {
    "courseId": "4", "courseKey": "blockchain-fundamentals",
    "courseTitle": "Blockchain Fundamentals", "courseSubTitle": null,
    "courseDifficulty": null, "courseUrl": "https://...",
    "courseSeq": 1, "language": "en",
    "modules": [ {
      "moduleId": "5", "moduleKey": "introduction-to-blockchain-technology",
      "moduleTitle": "Introduction to blockchain technology",
      "moduleDifficulty": null, "moduleUrl": "https://...",
      "moduleSeq": 1, "videoUrl": null } ]
  } ]
}
```

| Field | Type | Notes |
|------|------|-------|
| `trackId` | string | echoes the request |
| `courses[]` | array | ordered by `courseSeq` |
| `courses[].courseId` | string | |
| `courses[].courseKey` | string | URL slug |
| `courses[].courseTitle` | string | display title |
| `courses[].courseSubTitle` | string\|null | |
| `courses[].courseDifficulty` | int\|null | often `null` |
| `courses[].courseUrl` | string | course landing page |
| `courses[].courseSeq` | int | 1-based ordering within the Track |
| `courses[].language` | string | |
| `courses[].modules[]` | array | ordered by `moduleSeq` |
| `modules[].moduleId` | string | |
| `modules[].moduleKey` | string | URL slug |
| `modules[].moduleTitle` | string | display title |
| `modules[].moduleDifficulty` | int\|null | |
| `modules[].moduleUrl` | string | |
| `modules[].moduleSeq` | int | 1-based ordering within the Course |
| `modules[].videoUrl` | string\|null | video URL if the Module is video-based |

### Verified Example

Request: `{"trackId":"3","lang":"en"}`

Response: 6 courses, including:
- Course 1 — "Blockchain Fundamentals" (6 modules)
- Course 2 — "Crypto Fundamentals" (5 modules; modules include "What
  are cryptocurrencies?" and "An introduction to Bitcoin")
- Course 3 — "Decentralization" (4 modules; includes "Introduction to
  DeFi" and "DeFi Use Cases")

## Endpoint 6 — `searchArticles`

User Education Articles search across Academy/Blog/Research/FAQ/Announcement.
This endpoint uses a **completely different schema** from the 5
academy-series endpoints.

**Method + path:** `POST /v1/public/bigdata/academy-skill/searchArticles`

### Supported Languages (41 codes)

The `language` field accepts **41** language codes — a different
(and smaller) set than the academy-series `lang` field (which accepts
35 codes including `zh` / `zt` / `ja`). Notable absences from the
articles list: **`zh`, `zt`, `ja`** (Chinese / Japanese are NOT
supported by the articles endpoint).

| Code | Language | Notes |
|------|----------|-------|
| `ar` | Arabic | |
| `az-AZ` | Azerbaijani | |
| `bg` | Bulgarian | |
| `bn` | Bengali | |
| `cs` | Czech | |
| `da` | Danish | |
| `de` | German | |
| `de-CH` | Swiss German | regional variant |
| `de-DE` | German (Germany) | regional variant |
| `dk` | Danish (alt code) | |
| `el` | Greek | |
| `en` | English | largest content corpus; default fallback |
| `es` | Spanish | |
| `et` | Estonian | |
| `fi` | Finnish | |
| `fr` | French | |
| `he` | Hebrew | |
| `hr-HR` | Croatian | |
| `hu` | Hungarian | |
| `id` | Indonesian | |
| `it` | Italian | |
| `ka` | Georgian | |
| `kk-KZ` | Kazakh | |
| `ky-KG` | Kyrgyz | |
| `lt` | Lithuanian | |
| `lv` | Latvian | |
| `nl` | Dutch | |
| `no` | Norwegian | |
| `ph` | Filipino | |
| `pl` | Polish | |
| `pt` | Portuguese | |
| `ro` | Romanian | |
| `ru` | Russian | |
| `sk` | Slovak | |
| `sv` | Swedish | |
| `th` | Thai | |
| `tr` | Turkish | |
| `uk` | Ukrainian | |
| `ur` | Urdu | |
| `ur-PK` | Urdu (Pakistan) | regional variant |
| `vi` | Vietnamese | |

**Auto-fallback to `en`.** The script (`academy-api.mjs`) silently
normalizes the `language` field via the exported `getArticlesLang(lang)`
helper: if the requested lang is not in the list above, it falls back
to `"en"`. This applies to both `searchAll` (which uses `lang` and
maps it to `language`) and direct `searchArticles` calls (which use
`language` directly).

- `searchAll` exposes the actual language used in
  `articlesLangUsed` and a boolean `articlesLangFallback` (true when
  the requested `lang` was not supported and the script fell back to
  `en`). The LLM uses these to know whether to translate the returned
  English articles back to the user's language when formatting the
  card.
- Direct `searchArticles` callers can use the exported
  `getArticlesLang(lang)` helper to predict the actual language the
  script will use.
- Pass `language: ""` (empty string) to explicitly request "all
  languages" — this bypasses the auto-fallback.

### Request Body

Constraints below are enforced by the API.

**Script-applied defaults** (in addition to the API constraints
below) — the script modifies the body before sending it:

| Field | Script default | Override |
|-------|----------------|----------|
| `source` | `"Binance Academy"` when `undefined`/`null` (the Academy Skill is an educational content skill; Academy articles are the primary content). `searchAll` always uses `"Binance Academy"`. | Pass an explicit `source` (e.g., `"Binance Blog"`) or `source: ""` (all sources). |
| `docCount` | `1` when `undefined`/`null` (NOT the backend's 10 — article bodies are long-form and the LLM distills them). `searchAll` uses `limit \|\| 1` (scales with `limit`, defaults to 1). | Pass an explicit `docCount` (e.g., 3, 5, -1 for all). |
| `queryType` | `"vector"` when `undefined`/`null`/`""` (semantic/cosine similarity — better for natural-language queries; returns `chunk` field with the matched text fragment). `searchAll` always uses `"vector"`. | Pass `queryType: "fts"` for exact keyword / ticker matching (returns `highlighted` field with `<mark>` tags). Backend default is `fts` when the field is not sent at all. |
| `language` | Normalized via `getArticlesLang` — unsupported lang (e.g., `zh`) falls back to `en`. | Pass `language: ""` for "all languages" (bypasses fallback). |
| `bodyTextOnly` / `content` (response) | Returned in full (NOT truncated). The LLM must distill the content into a concise answer to the user's query (see `SKILL.md` "Format the output" rule 4, or `references/output-format.md` "Common Rules" §8). | N/A — script does not modify; the LLM must summarize, not paste. |
| `visitUrl` (response) | Replaced by a canonical Academy article URL resolved via the public v2 search API. Original kept as `originalVisitUrl`. See "Article URL resolution (script-applied)" below. | N/A — script always resolves; falls back to `articlePath` then original `visitUrl` on failure. |

| Field | Type | Required | Constraints | Default (server) |
|-------|------|----------|-------------|---------|
| `query` | string | yes | 1-200 chars. The server normalizes the same way as the academy-series `query`. | — |
| `queryType` | string | no | regex `^(vector|fts)$` (case-sensitive) | **Script default: `"vector"`** when undefined/null (semantic search — better for natural-language queries). Backend default when not sent is `fts`. |
| `source` | string | no | max 64 chars. One of: `Binance Academy` / `Binance Blog` / `Binance Research` / `Binance FAQ` / `Binance Announcement`. **Script default: `"Binance Academy"`** when undefined/null. | all sources (when not sent) |
| `language` | string | no | regex `^[A-Za-z0-9_-]{0,16}$` (note: NO surrounding whitespace tolerated here, unlike academy-series `lang`). Max 16. Must be one of the 41 codes above; otherwise the script falls back to `"en"`. Pass `""` for "all languages" (bypasses the fallback). | all languages |
| `docCount` | int | no | -1 to 50 (`-1` = unlimited). **Script default: `1`** when undefined/null (NOT the backend's 10). `searchAll` uses `limit \|\| 1`. | 10 (server) / 1 (script) |
| `threshold` | double | no | 0.0-1.0 | fts: 0.01, vector: 0.7 |
| `offset` | int | no | 0-10000. **If `offset` is used, `orders` MUST also be set** — the backend validates this pair; the API does not enforce it. | — |
| `orders` | string[] | no | max 5 items | — |
| `articleId` | string | no | max 64 | — |
| `catalogId` | string | no | max 64 | — |
| `articleCode` | string | no | max 64 | — |
| `normalizedTitle` | string | no | max 256 — case-insensitive exact match against the normalized title column | — |
| `parentCatalogName` | string | no | max 128 | — |
| `secondCatalogName` | string | no | max 128 | — |
| `includeNormalizedTitle` | bool | no | when `true`, the `title` field in the response returns `COALESCE(normalized_title, title)` instead of raw `title` | false |

**Empty/null fields are not sent** — the API omits them from the
request, so the backend applies its own defaults for each missing
field. This is different from the academy-series endpoints, where
`lang` is conditionally omitted.

### Response handling — body text and visit URL (script-applied)

The script applies two transformations to each returned article item
before handing them back to the caller:

**1. Body text is NOT truncated.** `bodyTextOnly` and `content` are
returned in full (often 5K–50K chars). The LLM is responsible for
distilling the content into a concise answer to the user's query —
see `SKILL.md` "Format the output" rule 4. The script does
NOT pre-truncate the body because the LLM needs the full text to
extract the key points relevant to the specific query (which the
script cannot predict). The LLM must summarize, NOT paste.

**2. `visitUrl` is replaced by a canonical Academy article URL**
resolved via the public Academy search v2 API. The original `visitUrl`
returned by the API is often empty or wrong; the script post-processes
each item to fetch a canonical URL. See "Article URL resolution
(script-applied)" below for the full flow.

The other fields (`title`, `brief`, `chunk`, `highlighted`,
`similarity`, `articlePath`, etc.) are NOT modified.

### Article URL resolution (script-applied)

For each article item returned by `searchArticles`, the script
resolves a canonical Academy article URL by calling the public
Academy search v2 API. The resolution is best-effort: on any failure,
the item keeps its original `visitUrl`.

**Resolution flow per item:**

1. **Build the v2 search URL:**
   ```
   GET {searchApiBaseUrl}/v2/public/pgc/content/academy/search
       ?lang={articlesLangUsed}
       &term={item.title}
       &maxRead=1000
       &minRead=0
       &with=articles
       &page=0
       &size=1
   ```
    where `{searchApiBaseUrl}` is `https://www.binance.com/bapi/composite`
    on prod.

    The `lang` parameter is the post-fallback `language` sent to
    `searchArticles` (echoed in `articlesLangUsed`).

2. **Take the slug from the v2 search response:**
   `data.pages.data[0].slug`. The v2 search is the public canonical
   Academy search — its slug is the authoritative URL slug.

3. **Build the canonical URL:**
   `{publicDomain}/{lang}/academy/articles/{slug}`
   - `publicDomain` is `https://www.binance.com` on prod
   - `{lang}` is the same `articlesLangUsed` value (e.g., `en`, `fr`,
     `de-CH`)

4. **Fallback chain when the v2 search fails** (network error, HTTP
   non-200, 0 hits, or missing slug):
   - Try the item's `articlePath` field (the slug returned by
     `searchArticles` — usually correct). Build the same URL pattern
     with it.
   - If `articlePath` is also empty/missing, keep the original
     `visitUrl` (it may be empty — the LLM should omit the link in
     that case).

5. **Preserve the original for traceability:** the original
   `visitUrl` returned by `searchArticles` is kept as
   `item.originalVisitUrl` after a successful resolution. The LLM
   does not need this; it's for debugging.

**Fault tolerance:** the v2 search call uses a best-effort HTTP
helper (`callGetApiBestEffort`) that returns `null` on any error
(network, HTTP non-200, malformed JSON, backend `code !== "000000"`)
instead of throwing. URL resolution never breaks the main
`searchArticles` flow — at worst, the item keeps its original
`visitUrl`.

**Parallel calls:** the per-item v2 search calls run in parallel
(`Promise.allSettled`), so the latency is `max(per-item) ≈ 200ms`,
not `sum(per-item) ≈ N×200ms`.

### Schema differences from academy-series endpoints

> ⚠️ `searchArticles` does **not** share the academy-series request
> schema. Key differences:
>
> - `language` (not `lang`)
> - `docCount` (not `limit`)
> - `queryType` supports `vector` (semantic/cosine) and `fts` (full-text/bm25)
> - No `bu` parameter (not business-unit scoped)
> - `source` filter (Academy/Blog/Research/FAQ/Announcement)
> - `threshold` for similarity score control

**`lang` vs `language` — the script rejects the `lang` mistake.**
Because the 3 academy-series endpoints use `lang` and `searchArticles`
uses `language`, passing `lang` to `searchArticles` was previously
silently ignored (the field was dropped and the backend returned content
in its default language, while the script hard-coded the URL path to
`en` — yielding misleading results like Dutch articles shown under
`/en/academy/articles/...`). The script now **throws** when a direct
`searchArticles` call passes `lang` without `language`, with a clear
message telling the caller to use `language`. `searchAll` is unaffected
(it constructs the articles body internally with `language`).

```
# WRONG — throws:
node scripts/academy-api.mjs prod searchArticles '{"query":"what is bitcoin","lang":"en","docCount":3}'

# CORRECT:
node scripts/academy-api.mjs prod searchArticles '{"query":"what is bitcoin","language":"en","docCount":3}'
```

### Response `data.items[]`

The article item has 30+ fields (the server passes them through
verbatim — no `descriptions` JSONB extraction here, unlike Resource
items). Field list (grouped by purpose):

**Identification:**

| Field | Type | Notes |
|------|------|-------|
| `uniqueId` | string | item unique id; the server uses this as the primary key for pseudo-row filtering (rows with null/empty `uniqueId` are dropped — see "Pseudo-row filtering" in Server-Side Implementation Behaviors) |
| `articleId` | string | article id (source-system internal id) |
| `articleCode` | string | article code (internal cross-reference) |
| `catalogId` | string | catalog id |

**Display:**

| Field | Type | Notes |
|------|------|-------|
| `title` | string | display title. When the request passes `includeNormalizedTitle: true`, this field returns `COALESCE(normalized_title, title)` instead of raw `title`. |
| `seoTitle` | string | SEO title |
| `brief` | string | short summary — prefer this for chat cards (plain text, token-cheap) |
| `chunk` | string | matched text fragment — **vector mode only** |
| `highlighted` | string | matched fragment with `<mark>` highlights — **fts mode only** |
| `content` | string | article body HTML. Do not paste raw — paraphrase, or use `bodyTextOnly`. |
| `bodyTextOnly` | string | article body plain text (HTML stripped). Prefer this for LLM context over `content`. |

**Source / language / status:**

| Field | Type | Notes |
|------|------|-------|
| `source` | string | one of `Binance Academy` / `Binance Blog` / `Binance Research` / `Binance FAQ` / `Binance Announcement` |
| `sourceTable` | string | underlying source table |
| `language` | string | content language |
| `status` | string | article status |
| `visitUrl` | string | article URL — the canonical link to put in the card |
| `articlePath` | string | URL slug. **NOTE:** this field is currently 0/44 populated in prod, so the script's `ARTICLE_ITEM_WHITELIST` no longer keeps it — `shapeArticleItem` strips it from the returned item to save a token slot. The `resolveArticleUrls` fallback still reads the raw `item.articlePath` (before shaping) as a defensive safety net if the backend ever starts populating it. |

**Catalogs:**

| Field | Type | Notes |
|------|------|-------|
| `parentCatalogName` | string | parent catalog name |
| `secondCatalogName` | string | second-level catalog name |

**SEO / banner:**

| Field | Type | Notes |
|------|------|-------|
| `banner` | string | cover image URL |
| `seoBanner` | string | SEO cover image URL |
| `seoDescription` | string | SEO description |
| `seoKeywords` | string | SEO keywords |
| `extraJson` | string | extra metadata JSON |

**Engagement:**

| Field | Type | Notes |
|------|------|-------|
| `likeCount` | int | like count |
| `viewCount` | int | view count |
| `similarity` | float | 0-1; `vector` = cosine similarity, `fts` = bm25 score. **Replaces `relevance` from academy-series endpoints** — `bubbleTopByMatchTier` in `academy-api.mjs` reads both fields transparently. |

**UTC timestamps (string, `YYYY-MM-DD HH:mm:ss` or ISO 8601):**

| Field | Notes |
|------|-------|
| `createdAtUtc` | creation time |
| `updatedAtUtc` | last update time |
| `publishTimeUtc` | publish time |
| `releaseTimeUtc` | release time (go-live) |

### Note

The `searchAll` function in `academy-api.mjs` maps the shared
`{query, lang, limit}` to the articles-specific
`{query, language: getArticlesLang(lang), source: "Binance Academy", docCount: limit || 1, queryType: "vector"}`
automatically. The LLM does NOT need to construct the articles-specific
body — `searchAll` handles the schema translation, source default,
doc count default, URL resolution, and language fallback.

`searchAll` also normalizes the articles `language` via
`getArticlesLang(lang)`: if the requested `lang` is not in the
41-code articles list, the script uses `language: "en"` and sets
`articlesLangFallback: true` in the response. The LLM is responsible
for translating the returned English articles back to the user's
language when paraphrasing the card. The other 3 endpoints
(glossary / learnEarn / resource) keep the strict
no-cross-language-fallback behavior.

The `searchAll` response exposes four articles-specific fields so the
LLM knows what was actually searched:

| Field | Type | Meaning |
|-------|------|---------|
| `articlesLangUsed` | string | The `language` sent to `searchArticles` (after fallback) |
| `articlesLangFallback` | boolean | `true` ONLY when the caller explicitly passed a non-empty `lang` that the articles endpoint does not support (so `articlesLangUsed` fell back to `"en"`). `false` when `lang` was omitted/empty (no user language to translate back to). The prior definition `articlesLangUsed !== lang` mis-reported `true` when `lang` was undefined. |
| `articlesSourceUsed` | string | The `source` sent to `searchArticles` (`searchAll` always uses `"Binance Academy"`) |
| `articlesDocCountUsed` | number | The `docCount` sent to `searchArticles` (`limit \|\| 1`) |
| `articlesQueryTypeUsed` | string | The `queryType` sent to `searchArticles` (`searchAll` always uses `"vector"`) |

Each returned article item's `bodyTextOnly` and `content` are
returned in full (NOT truncated) — the LLM must distill the content
into a concise answer to the user's query (see "Article content
distillation" in `SKILL.md`). Each item's `visitUrl` is replaced by
a canonical Academy article URL resolved via the public v2 search
API (see "Article URL resolution (script-applied)" above); the
original is kept as `originalVisitUrl`.

## API Behaviors

These behaviors are inherent to the API and cannot be changed by the
caller, but understanding them avoids surprising results (especially
around caching, limit truncation, and outline size caps).

### Response envelope shapes

All 5 search endpoints (`searchGlossary` / `searchLearnEarn` /
`searchResource` / `resolveParentTrack` / `searchArticles`) wrap
their `data` in the same shape:

```json
{
  "code": "000000",
  "message": null,
  "data": {
    "items": [ /* item objects */ ],
    "total": 2
  },
  "success": true
}
```

| Field | Type | Notes |
|-------|------|-------|
| `data.items` | array | always a list (never `null`); empty list when no hits |
| `data.total` | int | count of `items` after truncation (NOT the total before `limit` — see "Cache" below) |

`getTrackOutline` uses a **different** response shape — its `data` is
the outline object directly (no `items` / `total` wrapper):

```json
{
  "code": "000000",
  "data": {
    "trackId": "3",
    "courses": [ /* course objects */ ]
  },
  "success": true
}
```

### Cache (10-minute TTL, shared across `limit` values)

The API caches responses for 10 minutes — same query returns the same
items within a 10-minute window. Cache is enabled by default;
failures are NOT cached (only successful responses are written).

**Cache key composition** (per endpoint):

| Endpoint | Cache key inputs |
|----------|-------------------|
| `searchGlossary` | `action + lang + query(lowercased)` |
| `searchLearnEarn` | `action + lang + query(lowercased)` |
| `searchResource` | `action + lang + query(lowercased) + sortedResourceTypes` |
| `resolveParentTrack` | `action + lang + hitResourceId` |
| `getTrackOutline` | `action + lang + trackId` |
| `searchArticles` | `action + query + language + source + queryType + docCount + threshold + articleId + catalogId + articleCode + normalizedTitle + parentCatalogName + secondCatalogName + includeNormalizedTitle + offset + orders` |

**Critical: `limit` is NOT in the cache key.** The API always queries
at `limit=10` (the max), caches that response, and truncates
client-side based on the caller's `limit`. So `limit=3` returns the
first 3 items of the same cached `limit=10` response — making a
`limit=3` request and a `limit=10` request for the same query share
one cache entry. The skill can freely vary `limit` without worrying
about cache fragmentation.

**Implications for the skill:**

1. **Within a 10-minute window, retrying the same query returns the same items** — retrying with a different `limit` is fine (truncation
   is in-memory), but retrying with the same query and hoping for new
   results is wasted. The skill must change the `query` itself for a
   fallback retry.
2. **Failures are NOT cached.** Only successful responses are written
   to the cache. A transient failure is not "sticky" — the next call
   retries.
3. **`query` case is folded for the cache key** (lowercased) — `Solana`
   and `solana` share one cache entry because `plainto_tsquery('simple', ...)`
   lowercases tokens anyway. The actual query string preserves the
   caller's case.
4. **`bu` is NOT in the cache key** — it is auto-injected and not
   caller-controllable (see "`bu` field" below).

### Outline size caps

`getTrackOutline` returns the full Track → Course → Module tree (no
`limit` parameter). Two safety caps apply:

| Cap | Default | Range | Meaning |
|-----|---------|-------|---------|
| Max Courses per Track | 200 | 1 – 2000 | Over-cap Courses are silently truncated (logged + monitored, NOT surfaced to the caller). |
| Max Modules per Course | 100 | 1 – 1000 | Over-cap Modules are silently truncated per Course. |

The skill should NOT rely on these caps for correctness — they are
emergency stops. Real Academy Tracks have ≤20 Courses and ≤10
Modules per Course, far below the caps.

There is also a row-level cap (default 20000, range 1 – 100000) — if
the API returns more rows than this (e.g., a runaway track), the
excess is dropped. The 200×100 config gives ~20000 rows of headroom;
the row cap is a defense against a bug returning millions of rows.

For the 5 search endpoints, the row cap is 50 (range 1 – 1000) —
well above the `limit` cap of 10, so it should never trigger in normal
use.

### `bu` (business unit) — auto-injected, NOT a caller field

The 5 academy-series endpoints require a `bu` parameter internally,
but it is **auto-injected** (the skill caller does NOT pass `bu` and
cannot override it). The articles endpoint has no `bu` parameter at
all.

### Rate limiting (HTTP 429)

When a request exceeds the rate limit, the API returns HTTP 429 with
`code=000003 "Too many requests..."`. The skill should treat 429 as
transient — back off and retry, or skip the Academy content and
surface a friendly "Academy is busy, try again in a moment" message.

## Common Behaviors and Pitfalls

- **HTTP is 200 for well-formed requests.** Never use HTTP status
  alone to distinguish success from failure for well-formed requests;
  check `code` and the shape of `data`. Malformed requests (e.g.,
  missing required `lang` for `getTrackOutline`) return HTTP 400 with
  `code=000002`.
- **HTTP 429 is rate-limit** — `code=000003`. Treat as transient:
  back off and retry, or surface a friendly "Academy is busy" message.
- **`data.items == []` vs `data == null`:** the former is "no hits",
  the latter is a backend error. The skill should handle both
  gracefully and never crash on `null`.
- **`resourceTypes` default** is alphabetical:
  `["ACADEMY_COURSE","ACADEMY_MODULE","ACADEMY_TRACK"]`. The API
  sorts/dedupes the array before applying it (see "resourceTypes
  sanitization" under Endpoint 3).
- **Full-text recall:** the backend uses
  `plainto_tsquery('simple', ...)`. This is case-insensitive and
  word-level — long sentences hurt recall badly. The skill MUST
  extract clean 1-4 word queries (see `query-extraction.md`).
- **`hasReward` / `isRewardRunOut` / `isPaid` are strings** (`"0"` /
  `"1"`), not booleans. Comparing with `true`/`false` silently fails.
- **`getTrackOutline` requires `lang`.** Verified by direct test
  (2026-08-04): omitting `lang` returns HTTP 400 with
  `code=000002, message="illegal parameter"` — the API rejects the
  request rather than silently returning duplicated rows. The skill
  must always pass `lang` for this endpoint.
- **`lang=""` (empty) means "all languages"** for the academy-series
  5 endpoints: the API does NOT send the `lang` field when it is
  empty/whitespace, and the backend applies its own "all languages"
  semantics. This is different from `lang` omitted (both are accepted
  identically). For the articles endpoint, `language: ""` is also
  "all languages" and bypasses the script's auto-fallback to `en`.
- **`searchArticles` uses `similarity` (not `relevance`)** for ranking
  (vector=cosine, fts=bm25). The `searchAll` function in
  `academy-api.mjs` handles this transparently — callers using the
  shared `{query, lang, limit}` schema never see the difference.
- **`searchArticles` language auto-fallback.** The articles endpoint
  accepts 41 language codes (NOT including `zh`, `zt`, `ja`). When the
  user's input lang is not in that list, the script silently uses
  `language: "en"` for the articles call only. `searchAll` surfaces
  `articlesLangUsed` + `articlesLangFallback` so the LLM knows to
  translate the English articles back to the user's language. The
  other 3 endpoints (glossary / learnEarn / resource) keep the strict
  no-cross-language-fallback behavior. Direct `searchArticles`
  callers can pass `language: ""` to bypass and request "all
  languages", or use the exported `getArticlesLang(lang)` helper to
  predict the actual language the script will use.
- **Resource / Track items have no `excerpt` field.** Only `subTitle`
  (often `null` for Modules) and `title`. When ALL short fields are
  empty, the title link alone is sufficient — see "Handling empty
  short fields" in `SKILL.md`.
- **`relevance` is missing on `resolveParentTrack` response.** Exact
  id lookup, not full-text search.
- **Outline Courses / Modules may be silently truncated** if a Track
  exceeds the size caps (default 200 Courses / 100 Modules per
  Course). Real Academy Tracks are far below these caps; truncation
  only fires on runaway data. See "Outline size caps" in Server-Side
  Implementation Behaviors.
- **Cache TTL is 10 minutes.** Retrying the same `query` within 10
  minutes returns the same cached items — change the query (or wait
  out the TTL) to get different results. `limit` does NOT affect
  cache hits (see "Cache" in Server-Side Implementation Behaviors).
- **`searchArticles` defaults: `source="Binance Academy"`, `docCount=1`.**
  The script applies these defaults when the caller does not specify
  them. `searchAll` always uses `"Binance Academy"` and `limit || 1`
  for articles. Callers who need Blog/Research/FAQ/Announcement
  content or multiple articles must call `searchArticles` directly
  with an explicit `source` / `docCount`. The response exposes
  `articlesSourceUsed` / `articlesDocCountUsed` / `articlesQueryTypeUsed` for transparency.
- **`searchArticles` body text is NOT truncated.** Each returned
  item's `bodyTextOnly` and `content` are returned in full (often
  5K–50K chars). The LLM must distill the content into a concise
  answer to the user's query — see `SKILL.md` "Format the output"
  rule 4. The script does NOT pre-truncate because the LLM
  needs the full text to extract the relevant key points (which the
  script cannot predict).
- **`searchArticles` `visitUrl` is resolved to a canonical URL.**
  The script post-processes each item's `visitUrl` via the public
  Academy search v2 API (`/bapi/composite/v2/public/pgc/content/academy/search`),
  building `{publicDomain}/{lang}/academy/articles/{slug}`. Falls
  back to `articlePath`, then to the original `visitUrl`. Original
  kept as `originalVisitUrl`. See "Article URL resolution
  (script-applied)" under Endpoint 6.
- **Empty `visitUrl` after resolution.** Both the v2 search and the
  `articlePath` fallback failed — the article has no canonical URL.
  The LLM should omit the link in the card (show the title as plain
  text, no markdown link) or use the No-Content Template if no other
  source has content.

## See Also

- `orchestration.md` — the 3-step learning-plan chain
- `query-extraction.md` — how to clean user input before calling these endpoints
- `languages.md` — the 35-code academy-series `lang` list + the 41-code `searchArticles` `language` list (with auto-fallback rules)
- `output-format.md` — how to format the response for chat
