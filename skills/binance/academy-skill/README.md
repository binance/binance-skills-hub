# Binance Academy AI Skill

A Claude Code skill that wraps Binance Academy's backend APIs to
provide educational content (Glossary, Courses, Learn & Earn) for AI
chat. Driven by user **intent**, not keyword match.

## File Structure

```
academy-skill/
├── SKILL.md                       # Main skill instructions (loaded by Claude)
├── README.md                      # This file
├── references/
│   ├── api-contract.md            # Full request/response schema for all 5 endpoints
│   ├── orchestration.md           # 3-step learning-plan chain (searchResource -> resolveParentTrack -> getTrackOutline)
│   ├── intent-routing.md          # Intent-detection rules with positive/negative examples
│   ├── query-extraction.md        # Natural-language -> clean query (worked examples)
│   ├── output-format.md           # Card templates for all 4 intents (5 templates including Intent 4 Pattern A + B)
│   └── languages.md               # 35 supported language codes
├── env/
│   └── prod.env                   # Production environment base URL
└── scripts/
    └── academy-api.mjs            # Node.js API client + orchestrator
```

## How the Skill Is Invoked

1. Claude Code loads `SKILL.md` when the skill is selected.
2. `SKILL.md` references files under `references/` for deeper detail.
3. Those reference files are loaded **on demand** — Claude reads them
   only when the user's question requires the detail they contain.
4. The skill calls `scripts/academy-api.mjs` to hit the backend APIs.

## The 4 User Intents

| # | Intent | Backend API | Notes |
|---|--------|-------------|-------|
| 1 | Knowledge Q&A | `searchAll` (parallel Glossary + L&E + Resource) | Best result chosen by ranking rules; fallback to keyword |
| 2 | Risk Education | `searchAll` + risk-warning template | Same as Intent 1; risk block added at format time |
| 3 | Customized Learning Plan | `getLearningPlan` (orchestrates `searchResource` → `resolveParentTrack` → `getTrackOutline`) | 3-step sequential chain |
| 4 Pattern A | Learn & Earn reward list | `searchLearnEarn` directly | Skip `searchAll` — user wants rewards only |
| 4 Pattern B | Learn & Earn project query (e.g., "一文读懂 X") | `searchAll` (catches L&E + verifies Glossary/Resource) | Concurrent dispatch picks best source |

## `searchAll` — Concurrent Dispatch (Recommended for Intents 1, 2, 4B)

`searchAll(query, lang, limit)` runs `searchGlossary`,
`searchLearnEarn`, and `searchResource` in parallel with the same
query (no two-round merge, no cross-language fallback), then picks
the **single highest-relevance hit** across all 3 endpoints:

| Step | What happens |
|------|--------------|
| 1 | Each endpoint's response is scanned for the max-`relevance` item |
| 2 | Candidates sorted by `matchTier` DESC (0-3), then source priority (Glossary > L&E > Resource), then `relevance` DESC |
| 3 | The top candidate wins → `best.source`, `best.items` (top bubbled to index 0) |
| 4 | If all 3 endpoints return 0 hits for the requested `lang` → `best.source = null` (caller decides; no auto cross-language fallback) |

Total latency ≈ 1s (single parallel round). The `best` field has
`{ source, items, reason, lang, matchTier }` — use `best.items[0]`
for formatting, `best.reason` for logging, and `best.matchTier` to
understand the match-quality band.

## The 3-Step Learning-Plan Orchestration

```
searchResource(query, [TRACK, COURSE, MODULE])
   -> take the top hit
        |
   IF top hit == ACADEMY_TRACK:
        trackId = hit.resourceId          # skip step 2
   ELSE (COURSE or MODULE):
        resolveParentTrack(hitResourceId = hit.resourceId)
        -> trackId = parentTrack.resourceId
        |
   getTrackOutline(trackId, lang)
   -> Track -> Course[] -> Module[] tree
```

The script's `getLearningPlan` function performs steps 1->2->3
internally. See `references/orchestration.md` for the full decision
tree and edge cases.

## Environments

| Env | Base URL |
|------|----------|
| `prod` | `https://www.binance.com/bapi/bigdata` |

Default to `prod`. Configuration is in `env/prod.env`.

## Quick Start — Testing the Script

```bash
# Intent 1 — Knowledge Q&A (RECOMMENDED: searchAll runs 3 endpoints in parallel)
node scripts/academy-api.mjs prod searchAll \
  '{"query":"gas fee","lang":"en","limit":3}'
# → returns { glossary, learnEarn, resource, best: { source, items, reason, lang, matchTier }, errors }

# Intent 1 — Direct endpoint access (when you don't want searchAll's ranking)
node scripts/academy-api.mjs prod searchGlossary \
  '{"query":"gas fee","lang":"en","limit":3}'

# Intent 3 — Customized Learning Plan (skip searchAll; use a clean topic noun)
node scripts/academy-api.mjs prod getLearningPlan \
  '{"query":"DeFi","lang":"en","limit":3}'

# Intent 4 Pattern A — explicit reward question (skip searchAll)
node scripts/academy-api.mjs prod searchLearnEarn \
  '{"query":"reward","lang":"en","limit":5}'

# Intent 4 Pattern B — L&E project query (RECOMMENDED: searchAll)
node scripts/academy-api.mjs prod searchAll \
  '{"query":"一文读懂 Turtle","lang":"zh","limit":3}'
```

First argument is the env (`prod`), second is the endpoint
name, third is the JSON body. Endpoints: `searchGlossary`,
`searchLearnEarn`, `searchResource`, `resolveParentTrack`,
`getTrackOutline`, `getLearningPlan`, `searchAll`.

## Where to Find Documentation

| Topic | File |
|-------|------|
| API request/response schema | `references/api-contract.md` |
| 3-step orchestration chain | `references/orchestration.md` |
| Intent detection rules | `references/intent-routing.md` |
| Query extraction examples | `references/query-extraction.md` |
| Output card templates | `references/output-format.md` |
| Supported language codes | `references/languages.md` |

## Maintenance Notes

### Adding a New Language

1. Verify the language is in Academy's supported list (check with
   the Academy team or by querying a known glossary term with the new
   `lang`).
2. Add a row to the table in `references/languages.md`.
3. If the language has special handling (RTL, regional variant), note
   it in the "Notes" column.
4. The backend regex `^[A-Za-z0-9_-]{0,16}$` already accepts new
   codes — no backend change needed unless the code is longer than
   16 chars (none currently are).

### Updating Environment Configuration

- Edit `env/prod.env`.
- The script reads `ACADEMY_BASE_URL` and
  `ACADEMY_TIMEOUT_MS` from these files.

### Verifying the API Still Works

The endpoints are versioned under
`/v1/public/bigdata/academy-skill/`. If a request starts returning
unexpected shapes, run a curl test:

```bash
# Prod — getTrackOutline
curl -X POST 'https://www.binance.com/bapi/bigdata/v1/public/bigdata/academy-skill/getTrackOutline' \
  -H 'Content-Type: application/json' \
  -d '{"trackId":"3","lang":"en"}'
```

Expected: HTTP 200 with `code == "000000"` and a non-null `data`. If
`code == "000001"`, the backend is in a transient error state —
escalate to the Academy service owner.

### Updating Verified Examples

The verified examples in `references/*.md` were captured on
2026-08-04. If the backend's content changes (e.g., new glossary
terms, renumbered resource ids), the examples may go stale. To
refresh:
1. Re-run the curl commands above.
2. Update the "Verified Example" sections in
   `references/api-contract.md` and the worked examples in
   `references/orchestration.md` and `references/output-format.md`.
3. Bump the version in `SKILL.md` frontmatter.
