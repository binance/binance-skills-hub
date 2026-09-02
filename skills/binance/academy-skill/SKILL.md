---
name: academy-skill
description: >
  Retrieve Binance Academy's official educational content (Glossary, Courses,
  Learn & Earn, Articles) for AI chat. Trigger when the user's message
  expresses one of these INTENTS (NOT keyword matches):
  (1) Knowledge Q&A — "What is Gas Fee?", "Why did I receive less crypto than I sent?", "How does staking work?"
  (2) Risk Education — high-risk trading/investment intent: leverage, borrowing to trade, all-in, scams, "20x long", "borrowing to amplify position"
  (3) Customized Learning Plan — "I want to learn DeFi", "Build me a 5-day Bitcoin plan", "DeFi learning path for beginners"
  (4) Learn & Earn — "Which Academy courses have rewards?", "一文读懂 X", "What is X (TICKER)?", "courses that pay crypto"
  This skill extracts clean query terms from natural language before calling
  the API. It NEVER gives investment advice — educational content only.
metadata:
  author: binance-academy
  version: "2.0.0"
allowed-tools: Bash Read
---

# Binance Academy AI Skill

Intent-driven educational content skill. Retrieve Glossary / Courses /
Learn & Earn / Articles from Binance Academy, present as concise paraphrased
answers with Academy links. **Never investment advice.**

## When to Use

| Intent | Trigger examples | Primary tool |
|---|---|---|
| **1. Knowledge Q&A** | "What is X?", "Why does X happen?", "How does X work?" | `searchAll` (parallel) |
| **2. Risk Education** | leverage / borrowing / all-in / scams / "20x long" / "borrowing to trade" | `searchAll` + risk-warning block |
| **3. Learning Plan** | "I want to learn X", "X learning path", "build me a plan for X" | `getLearningPlan` |
| **4. Learn & Earn** | "Which courses have rewards?", "一文读懂 X", "What is X (TICKER)?" | `searchLearnEarn` or `searchAll` |

**Do NOT trigger for:** account/login issues, trading execution ("buy 1 BTC
now"), price checks ("what's BTC price"), or small talk.

For ambiguous intent cases (e.g., "什么是 X" vs "20x 杠杆是什么" vs "20x
杠杆可以吗"), see `references/intent-routing.md`.

## How to Use

### 1. Detect user language → `lang` code

Default: `zh` for Simplified Chinese, `en` for English. Full 35-code list
in `references/languages.md`.

### 2. Pick intent + call the script

All examples use `prod` (the only supported env). `ACADEMY_SKILL_DIR` =
this skill's root directory (resolved by the runtime when the skill loads).

```bash
# Intent 1, 2 — Knowledge Q&A / Risk Education (parallel dispatch, recommended)
node "$ACADEMY_SKILL_DIR/scripts/academy-api.mjs" prod searchAll \
  '{"query":"gas fee","lang":"en","limit":3}'

# Intent 3 — Learning Plan (use a clean topic noun, NOT the full sentence)
node "$ACADEMY_SKILL_DIR/scripts/academy-api.mjs" prod getLearningPlan \
  '{"query":"DeFi","lang":"en","limit":3}'

# Intent 4 Pattern A — explicit reward question
node "$ACADEMY_SKILL_DIR/scripts/academy-api.mjs" prod searchLearnEarn \
  '{"query":"reward","lang":"en","limit":5}'

# Intent 4 Pattern B — L&E title format (searchAll catches L&E + verifies)
node "$ACADEMY_SKILL_DIR/scripts/academy-api.mjs" prod searchAll \
  '{"query":"What is Turtle (TURTLE)?","lang":"en","limit":3}'
```

**`searchAll` response** — use these fields, ignore the rest:
- `best.source` — which endpoint won (`glossary`/`learnEarn`/`resource`/`articles`/`null`)
- `best.items[0]` — the top hit to format (already reordered by match quality)
- `best.matchTier` (0–3) — match-quality band:
  - `>= 2` → good match, format the card. Tier 2 is reliable: structured
    sources (glossary/learnEarn/resource) whose title is a true superset of
    the query (adds a concept noun, e.g. `smart contract` → "Smart
    Contract Wallet") are demoted to tier 1 in code, so a tier-2 hit is
    either a clean multi-token title match or an articles long-form match.
  - `<= 1` → weak match, retry with a clean English keyword (same `lang`)
  - `-1` (`best.source == null`) → no hits, use No-Content template
- `glossary` / `learnEarn` / `resource` arrays — used to generate the "Next Step" suggestion; do NOT make extra API calls for it
- `articlesLangFallback` — `true` only when the user explicitly passed a
  non-empty `lang` that the articles endpoint does not support (so
  articles fell back to English); translate the distilled article back
  to the user's language. `false` when `lang` was omitted/empty (no user
  language to translate to).

**Query strategy — language-dependent default.**

- **English (and other Latin-script languages)**: *raw input first*.
  Send the user's raw input as `query` (the script pre-processes: trim,
  strip control chars, truncate to 200 chars). Only extract clean
  keywords when raw input returns `matchTier <= 0` or `best.source ==
  null`. Don't lowercase or translate upfront. Full fallback heuristics
  in `references/query-extraction.md`.

- **Chinese and other CJK**: *extract keyword first*. CJK raw sentences
  almost never hit — a 20-question zh sample showed **0/20 reached tier
  ≥ 2**. `plainto_tsquery('simple', ...)` does no CJK word segmentation
  and ANDs every token (including question words like "什么是"), so a CJK
  sentence rarely matches a short Academy title. **Default to extracting
  the topic noun + translating to its canonical English term BEFORE the
  first `searchAll` call** — do NOT first try the raw sentence and then
  fall back (that wastes a full `searchAll` round-trip on a
  near-guaranteed `tier <= 1`, and "default strategy never effective for
  CJK" is exactly the problem this fixes). See `references/query-
  extraction.md` §4 for the translation table.
  - **Exception — bare CJK concept noun with no question words** (钱包,
    智能合约, 工作量证明, 区块链): send it raw. Single-token CJK concept
    nouns DO hit (tier 3) when the Academy has the translated glossary
    entry, and skipping raw for them would lose the cleanest match. If
    the raw noun returns `tier <= 1` or off-topic, fall back to the
    English translation.
  - **How to tell a sentence from a bare noun**: if the input contains
    question/intent words (什么是 / 如何 / 为什么 / 可以吗 / 行吗 / 是不是 /
    "is it safe" / "should I"), it's a sentence → extract keyword first.
    If it's a noun or noun phrase with no question words, it's a bare
    concept → try raw.

- For **risk-education** Chinese queries, skip straight to the
  Risk-Education Term Map in `references/query-extraction.md` — the raw
  sentence almost never hits and the correct fallback term is rarely the
  literal translation (e.g. 杠杆 → `强制平仓` (zh) or `margin trading`
  (en), NOT `leverage`).

**Intent 3 needs a clean topic noun upfront.** `getLearningPlan` with full
sentences like "I want to learn DeFi" rarely matches Module titles — extract
`DeFi` first. Intent 4 Pattern B (L&E title format) is the opposite — raw
input usually matches the L&E course title directly.

### 3. Format the output

Output **direct markdown** — no PRD table, no `Response:` / `Button:` /
`Next Step:` labels. The LLM is a chat assistant; the user wants answers,
not a form.

**Every reply MUST:**
1. Answer in the user's language (Chinese question → Chinese prose). If
   `articlesLangFallback == true` and `best.source == "articles"`, translate
   the distilled English article back to the user's language.
2. Include at least one Academy URL from the API response
   (`pageUrl` / `courseUrl` / `moduleUrl` / `visitUrl`). **Never invent URLs.**
3. **Paraphrase, never paste.** Use `excerpt` / `title` / `subTitle` /
   `brief` / `bodyTextOnly` as source. For long `content` HTML, use the
   script's `stripHtml` helper:
   ```bash
   node -e "import('$ACADEMY_SKILL_DIR/scripts/academy-api.mjs').then(m=>console.log(m.stripHtml('<p>...</p>')))"
   ```
4. **Articles (when `best.source == "articles"`):** distill `bodyTextOnly`
   (often 5K–50K chars) into 2–4 sentences that answer the user's query.
   Never paste raw body. Never reproduce the article's section structure.
5. **Risk scenarios (Intent 2):** always include a ⚠️ disclaimer block
   (see template below).

**Missing-URL degradation (when `best.items[0]` has no usable URL).** A
top-1 article with no `visitUrl` (and no `articlePath` to fall back to)
happens ~27% of the time — some `searchArticles` hits are not in the
public v2 search index, so all 3 resolution levels return empty. Since
rule 2 requires at least one Academy URL and rule "Never invent URLs"
forbids fabrication, this is a no-URL deadlock for the top-1 item.
Resolve it with this degradation ladder — pick the first option that
yields a usable URL, and use that item's content for the card body:

1. **`best.items[1..]`** — the runner-up articles in the same `best.items`
   array. They are usually the same concept, one rank lower.
2. **Other sources' top items** — `glossary[0]`, `learnEarn[0]`,
   `resource[0]` (whichever has a non-empty `pageUrl`). These are
   definitional/structured content, often a good alternative answer.
3. **No-Content template** — if NO item across any source has a usable
   URL, use the No-Content template (see below). Do NOT present an
   article whose link is empty — the user cannot click through.

When you degrade to a runner-up / other source, paraphrase THAT item's
content (not the original top-1's) so the prose matches the link the
user will see. If the top-1 article had the best answer text but no link
and a runner-up has a link but weaker text, prefer the runner-up: a
clickable weaker answer beats a linkless strong answer (the URL is the
Academy attribution that makes the answer trustworthy).

**Empty short fields:** when `excerpt` / `subTitle` / `courseDescription`
are all `null`, the title link alone is sufficient — don't add placeholder
text like "Click to view details".

**No content (`best.source == null`):** use the No-Content template below.
Don't apologize; pivot to suggestions.

### 4. Output templates

Full before/after examples in `references/output-format.md`. Compact forms:

**Intent 1 — Knowledge Q&A:**
```markdown
**[<term>](<pageUrl>)**

<2-4 sentence paraphrased definition>

🔗 [<suggestion from searchAll's other sources>](<nextStepUrl>)  ← optional, omit if empty
```

**Intent 2 — Risk Education:**
```markdown
**⚠️ <risk pattern>**

<brief answer: what it is, how it works>

**Risk:** <quote from Academy content>

**Example:** <concrete numerical simulation, e.g., "20x leverage: a 5% adverse move can liquidate your position">

Safer next step: learn <topic> first → [<link text>](<pageUrl>)

> ⚠️ Educational content only, not investment advice. Crypto prices are volatile; you may lose your entire principal. Please understand the risks before deciding.
```

**Intent 3 — Learning Plan:**
```markdown
**<topic> · <Difficulty>**

<2-3 sentence overview>

**Day 1:** [Course title](courseUrl)
  - [Module title](moduleUrl)
  - [Module title](moduleUrl)
**Day 2:** [Course title](courseUrl)
  - [Module title](moduleUrl)

Full track: [View learning path](<track pageUrl>)
```

Day grouping: **quick** ("快速了解"/"brief") = 1 day, single Course + 3–5
Modules. **Default** (no signal) = 3 days, one Course/day, top 3–4 Modules
each. **Systematic** ("系统学习"/"systematically") = 5 days, one Course/day,
2–3 Modules each. **Certificate** ("证书"/"certificate") = 1 entry per
Course with `courseUrl`; mention LinkedIn eligibility if known.
(Matches the Day Grouping Guidance table in `references/output-format.md`.)

**Intent 4 — Learn & Earn:**

Pattern A (reward list — multiple courses):
```markdown
**Academy Learn & Earn — Currently claimable rewards**

- [<courseTitle>](<pageUrl>) · 🟢 Active
- [<courseTitle>](<pageUrl>) · 🟢 Active

[View all campaigns](https://www.binance.com/<lang>/academy/learn-and-earn)
```

Pattern B (single course):
```markdown
**[<courseTitle>](<pageUrl>)**

<paraphrased courseDescription>

📅 <activityStartDate> ~ <activityEndDate> (UTC+8) · <🟢 Active / 🔴 Fully distributed / ⚪ Ended>

[View all campaigns](https://www.binance.com/<lang>/academy/learn-and-earn)
```

Status logic: `hasReward=="1" && isRewardRunOut!="1" && now<activityEndDate`
→ 🟢 Active. `isRewardRunOut=="1"` → 🔴 Fully distributed. `now>activityEndDate`
→ ⚪ Ended. When no courses qualify: "No reward courses are currently
claimable. Academy frequently updates the Learn & Earn list — please check
back in a few days."

**No-Content template (`best.source == null`):**
```markdown
Academy doesn't have content for "<query>" yet.

**Suggestions:**
- Try a related term, e.g., "<related term>"
- Try the English equivalent (Academy's English corpus is the largest), e.g., "<English term>"
- Browse [Academy](https://www.binance.com/<lang>/academy) directly
```

## Safety Rules (MANDATORY)

1. **No investment advice.** Never say "you should buy/sell", "this is a good investment".
2. **No return promises.** Never project yields, ROI, or expected gains.
3. **Risk content must cite Academy.** Risk warnings must reference real
   `excerpt` / `title` from the API response. Don't invent risk statements.
4. **Mandatory disclaimer for risk scenarios.** Every Intent 2 reply ends
   with the ⚠️ disclaimer shown in the Intent 2 template.
5. **No fabricated URLs.** Only use API-returned URLs. If a URL field is
   null/empty, omit the link rather than guess.

## References (loaded on-demand)

| File | When to load |
|---|---|
| `references/intent-routing.md` | Ambiguous intent — need positive/negative examples and tie-breaker rules |
| `references/query-extraction.md` | `matchTier <= 0` after first call — need full fallback keyword heuristics |
| `references/output-format.md` | Need full card templates with before/after examples |
| `references/orchestration.md` | Intent 3 — need 3-step orchestration decision tree and edge cases |
| `references/api-contract.md` | Need full request/response schema for all 6 endpoints |
| `references/languages.md` | Need full 35-code lang list or 41 articles-supported codes |
