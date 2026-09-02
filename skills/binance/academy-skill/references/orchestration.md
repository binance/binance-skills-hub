# Learning-Plan Orchestration

The 3-step chain that powers Intent 3 (Customized Learning Plan).

## `searchAll` vs `getLearningPlan` — when to use which

| Function | Use case | Latency |
|----------|----------|---------|
| `searchAll` | Intent 1 / 2 / 4 — pick the best single content piece across Glossary / L&E / Resource | ≈ 1s (parallel) |
| `getLearningPlan` | Intent 3 — build a structured Track → Course → Module learning plan | ≈ 2s (3 sequential calls) |

`searchAll` is the right choice for question-answering intents (1, 2,
4) where the user wants a single best answer. `getLearningPlan` is
the right choice for Intent 3 because it walks the Track → Course →
Module hierarchy to build a multi-day plan — that requires the
sequential orchestration described below.

Do NOT use `searchAll` for Intent 3 — it would only return the top
Module/Course hit, not the full hierarchy. And do NOT use
`getLearningPlan` for Intent 1 — it would waste 3 sequential API
calls just to return a single Module hit that `searchAll` could have
returned in parallel.

## Why Orchestration Is Needed for Intent 3

Academy content is organized as a three-level hierarchy:

```
Track  ->  Course  ->  Module
```

- A **Track** is a top-level learning path (e.g., "Beginner Track").
- A **Course** is a chapter inside a Track (e.g., "Decentralization").
- A **Module** is an article-like unit inside a Course (e.g.,
  "Introduction to DeFi").

When a user says "我想学 DeFi", the query "DeFi" rarely hits a Track
directly — it usually hits a Module like "Introduction to DeFi" or a
Course like "Decentralization". To build a structured learning plan,
the skill must:

1. Find the hit resource (Module or Course, usually).
2. Walk up to its parent Track.
3. Expand the Track into the full Course -> Module tree.

That is what the 3-step orchestration does. The script's
`getLearningPlan` function performs all three steps internally; the
skill caller only invokes it once with `{query, lang, limit}` and
gets back the full tree.

## The Flow

```
                  User: "我想学 DeFi"
                         |
                         v
   +----------------------------------------+
   | Step 1: searchResource                |
   |   body: {query, lang, limit,           |
   |          resourceTypes: [TRACK, COURSE,|
   |          MODULE]}                      |
   +----------------------------------------+
                         |
                         v
              data.items[] sorted by
              relevance desc
                         |
                         v
              take the top hit
                         |
            +------------+------------+
            |                         |
   resourceType ==               resourceType ==
   "ACADEMY_TRACK"                "ACADEMY_COURSE" or
            |                     "ACADEMY_MODULE"
            |                         |
            v                         v
   trackId = hit.resourceId   +--------------------------+
   (skip step 2)              | Step 2: resolveParentTrack|
                              |   body: {hitResourceId,  |
                              |          lang}           |
                              +--------------------------+
                                         |
                                         v
                              data.items[] (parent Track)
                                         |
                                         v
                              trackId =
                              parentTrack.resourceId
            |                         |
            +------------+------------+
                         |
                         v
   +----------------------------------------+
   | Step 3: getTrackOutline               |
   |   body: {trackId, lang}               |
   |   (lang REQUIRED!)                    |
   +----------------------------------------+
                         |
                         v
              data: {trackId, courses: [
                {courseId, courseTitle, modules: [...]}
              ]}
                         |
                         v
              Format as a learning plan
              (see output-format.md, Intent 3)
```

## Step 1 — `searchResource`

Pass `resourceTypes: ["ACADEMY_COURSE","ACADEMY_MODULE","ACADEMY_TRACK"]`
(or omit the field; the backend applies the same default — see
`api-contract.md`).

Why include `ACADEMY_MODULE`: the user's specific knowledge point
usually lives at the Module level (e.g., "Introduction to DeFi"). If
you only search Track and Course, the chain breaks for specific
questions — the user says "DeFi", no Track titled "DeFi" exists, but
there is a Module named "Introduction to DeFi". Skipping Module means
missing the entry point entirely.

The backend returns items sorted by `relevance` desc. Take the top
hit as the entry point for step 2 or 3.

## Step 2 — `resolveParentTrack` (conditional)

Only call this if step 1's top hit is **NOT** a Track. If it is a
Track, skip step 2 and use `hit.resourceId` directly as `trackId`.

Pass `hitResourceId = hit.resourceId` and `lang`. The response
`data.items[]` contains the parent Track(s). Normally there is
exactly one. Use `items[0].resourceId` as `trackId` for step 3.

## Step 3 — `getTrackOutline`

Pass `trackId` and `lang` (REQUIRED — see `api-contract.md`).
Returns `{trackId, courses: [...]}` with each Course containing its
Modules. This is the raw material for the learning-plan card
template (see `output-format.md`, Intent 3).

### Server-side outline caps

The server applies two safety caps on the outline (clamped to safe
ranges):

| Cap | Default | Range | What it does |
|-----|---------|-------|--------------|
| Max Courses per Track | 200 | 1 – 2000 | Max Courses per Track. Over-cap Courses are silently truncated (logged + monitored). |
| Max Modules per Course | 100 | 1 – 1000 | Max Modules per Course. Over-cap Modules are silently truncated per Course. |

Real Academy Tracks have ≤20 Courses and ≤10 Modules per Course, so
these caps should never fire in practice. They exist as emergency
stops against runaway data — a Track with 500 Courses would silently
truncate to the first 200. The skill should NOT rely on these caps
for correctness.

There is also a row-level cap (default 20000, range 1 – 100000) — if
the API returns more rows than this, the excess is dropped. The
200×100 config gives ~20000 rows of headroom; the row cap is a defense
against a bug returning millions of rows.

### Assembled (not nested) by the API

`getTrackOutline` returns **flat rows** (Course × Module × Language
cartesian product), NOT a nested tree. The API groups the rows by
Course `resource_id` and assembles the two-level tree you see in the
response (the skill caller sees only the assembled result).
Assembly rules:

1. Group by Course `resource_id` (the SQL group-by key).
2. Sort Courses by `courseSeq` asc, Modules by `moduleSeq` asc
   (`nullsLast` — null seqs go to the end, no NPE).
3. Rows with `module_id == null` are "Course has no Module" (LEFT
   JOIN semantics) — the Course is kept with `modules: []`, not
   dropped and not treated as an anonymous Module.
4. Dedupe by `module_id` (the API may emit duplicate rows for
   multi-language or data duplication reasons).
5. Title/subTitle for Course and Module are extracted from their
   respective `descriptions` / `module_descriptions` JSON objects —
   they are NOT top-level fields. The full object (including page
   layout `content`, logos, quizList, etc.) is dropped to keep the
   response LLM-friendly.

## Edge Cases

| Situation | Action |
|-----------|--------|
| `searchResource` returns 0 hits | Fall back to `searchAll` with the same query (`searchAll` checks all 3 endpoints in parallel); explain to the user that no structured Track exists yet, but here is the best matching content across Glossary / L&E / Resource. |
| Top hit is `ACADEMY_TRACK` | Skip step 2; use `hit.resourceId` as `trackId` directly. |
| `resolveParentTrack` returns 0 hits | The hit Course/Module has no parent Track in Academy's tree. Use the original `searchResource` hit's `pageUrl` directly; explain honestly that no structured Track exists for this topic. |
| `getTrackOutline` returns `courses: []` | The Track exists but has no Courses. Explain honestly; do not invent Modules. Suggest the glossary entry instead. |
| `searchResource` returns multiple Tracks with similar `relevance` | Pick the one with the highest `relevance`. If two Tracks are within ~0.05 relevance of each other, prefer the one whose `difficultLevel` matches the user's stated preference (Beginner if user says "入门", Advanced if "进阶"). If no preference is stated, prefer the lower `difficultLevel` (more general audience). |
| `searchResource`'s top hit is a Module with `parentResourceId: null` | Treat as "no parent Track"; use the Module's `pageUrl` directly. |
| `getTrackOutline` returns `null` `data` | Backend error — surface a friendly "Academy content temporarily unavailable" message. |
| Same `query` retried within 10 minutes | Returns cached items (no API call). Change the `query` itself for a different result set — `limit` and `lang` are part of the cache key, but retrying with the same `query` + `lang` is a cache hit. See "Cache" in `api-contract.md`. |
| Outline silently truncated (Courses > 200 or Modules/Course > 100) | Real Academy Tracks never hit these caps. If you suspect truncation (e.g., the user knows a Track has 250 Courses), it is a size cap the skill cannot change. Surface what was returned honestly. |

## Worked Example

User: "我想学 DeFi, 从哪开始?" -> `query="DeFi"`, `lang="en"`
(technical term; English corpus is largest).

**Step 1** — `searchResource({"query":"DeFi","lang":"en","limit":3})`

Returns (verified, 2026-08-04):
- Top:    `resourceId=18, resourceType=ACADEMY_MODULE, title="Introduction to DeFi", parentResourceId=17`
- 2nd:    `resourceId=19, resourceType=ACADEMY_MODULE, title="DeFi Use Cases", parentResourceId=17`
- 3rd:    `resourceId=100, resourceType=ACADEMY_MODULE, title="1.3 Understanding Key DeFi Indicators", parentResourceId=62`

Top hit is a Module -> step 2 required.

**Step 2** — `resolveParentTrack({"hitResourceId":"18","lang":"en"})`

Returns: `resourceId=3, resourceType=ACADEMY_TRACK, trackTitle="Beginner Track", trackSubTitle="The fundamentals of crypto & blockchain", difficultLevel=1, pageUrl="https://www.binance.com/en/academy/track/beginner-track"`

`trackId = "3"`.

**Step 3** — `getTrackOutline({"trackId":"3","lang":"en"})`

Returns 6 courses, including:
- Course 1 — "Blockchain Fundamentals" (6 modules)
- Course 2 — "Crypto Fundamentals" (5 modules; includes "What are
  cryptocurrencies?" and "An introduction to Bitcoin")
- Course 3 — "Decentralization" (4 modules; includes "Introduction
  to DeFi" and "DeFi Use Cases")

The skill formats this into a 3-day plan card (see `output-format.md`,
Intent 3).

## Why `resourceTypes` Must Include `ACADEMY_MODULE`

The user's specific knowledge point usually lives at the Module
level. "Introduction to DeFi" is a Module; "Decentralization" is the
Course that contains it; "Beginner Track" is the Track that contains
the Course.

If you call `searchResource` with only `["ACADEMY_TRACK","ACADEMY_COURSE"]`:
- For "DeFi" you might still hit the "Decentralization" Course, which
  is okay — step 2 still works.
- But for "BEP-20" or "impermanent loss" or "AMM" — the term exists
  only at the Module level. No Track or Course is named "AMM"; there
  is just a Module "What is an AMM?" inside some Course.
- Without Module in `resourceTypes`, the search returns 0 hits and
  the chain breaks immediately, even though Academy has the content.

Default: include all three types.

## See Also

- `api-contract.md` — full schema for `searchResource`,
  `resolveParentTrack`, `getTrackOutline`
- `output-format.md` — Intent 3 card template
- `query-extraction.md` — how to clean the user's topic into a
  1-4 word `query`
