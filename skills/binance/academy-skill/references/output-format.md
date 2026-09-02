# Output Format — Direct Markdown Templates

All 4 intents output **direct markdown** — no PRD table, no
`Response:` / `Button:` / `Next Step:` labels. The LLM is a chat
assistant; the user wants answers, not a form.

## Common Rules (Apply to All Intents)

1. **Direct markdown only.** No `| Speaker | Chat Card |` table wrapper.
   No echoing of the user's input. The reply flows as natural chat prose.
2. **Always include at least one Academy URL** from the API response
   (`pageUrl` / `courseUrl` / `moduleUrl` / `visitUrl`). Inline as
   markdown links — no separate "Button" block.
3. **Never invent URLs.** If a URL field is `null` or empty, omit the
   link rather than guess.
4. **Paraphrase, never paste** raw `content` / `courseDescription` HTML.
   Use `excerpt` / `title` / `subTitle` / `brief` / `bodyTextOnly` as
   source. For long `content`, use the script's `stripHtml` helper.
5. **Match the user's language** for the prose. If
   `articlesLangFallback == true` and `best.source == "articles"`,
   translate the distilled English article back to the user's language.
   Keep Academy URLs as-is.
6. **One card per turn.** Don't chain multiple replies unless the user
   explicitly asks for multiple topics.
7. **Empty short fields** (`excerpt` / `subTitle` / `courseDescription`
   all `null`): the title link alone is sufficient. Don't add placeholder
   text like "Click to view details" or "This Module has no introduction".
8. **Articles (when `best.source == "articles"`):** distill `bodyTextOnly`
   (often 5K–50K chars) into 2–4 sentences that answer the user's query.
   Never paste raw body. Never reproduce the article's section structure.

All examples below use verified API responses captured 2026-08-04.

## Intent 1 — Knowledge Q&A

### Template

```markdown
**[<term>](<pageUrl>)**

<2-4 sentence paraphrased definition>

🔗 [<suggestion>](<nextStepUrl>)  ← optional, omit if no other source has hits
```

The title IS the clickable link. The excerpt flows as natural prose below.
No separate "Details" line, no `Academy Resources:` block.

> **Article items use `visitUrl`, not `pageUrl`.** When
> `best.source == "articles"`, the template's `<pageUrl>` slot is filled
> by `best.items[0].visitUrl` (article items have no `pageUrl` field — see
> the Field Mapping below). If `visitUrl` is empty/null, follow the
> Missing-URL degradation ladder in `SKILL.md` (runner-up → other source →
> No-Content) before rendering.

### Generating the Next Step suggestion

The next step is generated from the **other sources** that `searchAll`
already returned alongside `best.source`. Do NOT make extra API calls;
use the existing `glossary` / `learnEarn` / `resource` arrays.

**Decision table:**

| `best.source` | Other sources with hits | Suggestion copy | `nextStepUrl` |
|---|---|---|---|
| `glossary` | `learnEarn` has hits | "Learn and earn with related L&E courses" | `learnEarn[0].pageUrl` |
| `glossary` | `resource` has hits | "Learn systematically with related course modules" | `resource[0].pageUrl` |
| `glossary` | both empty | "Browse all Academy Glossary entries" | `https://www.binance.com/<lang>/academy/glossary` |
| `learnEarn` | `glossary` has hits | "Understand the concept in the Academy glossary" | `glossary[0].pageUrl` |
| `learnEarn` | `resource` has hits | "Learn systematically with related courses" | `resource[0].pageUrl` |
| `learnEarn` | both empty | omit the next step | — |
| `resource` | `glossary` has hits | "Quick concept overview in the Academy glossary" | `glossary[0].pageUrl` |
| `resource` | `learnEarn` has hits | "Learn and earn with L&E courses" | `learnEarn[0].pageUrl` |
| `resource` | both empty | omit the next step | — |
| `articles` | `glossary` has hits | "Quick concept definition in the Academy glossary" | `glossary[0].pageUrl` |
| `articles` | `learnEarn` has hits | "Learn and earn with related L&E courses" | `learnEarn[0].pageUrl` |
| `articles` | `resource` has hits | "Learn the concept systematically with related courses" | `resource[0].pageUrl` |
| `articles` | all empty | omit the next step | — |
| `null` | — | use No-Content template (see below) | — |

`articles` is the **highest-frequency winner** in practice (6/20 in the
zh sample, plus most gas-fee / how-to queries), so its rows are not
optional — without them the most common path has no Next Step rule.
When `best.source == "articles"` AND another source has hits, prefer
the next step that gives the *definitional* counterpart (`glossary`
first — it is the canonical one-line definition; then `learnEarn`, then
`resource`). The article already gave the long-form explanation, so the
next step should be the short-form reference, not another long article.

**Tailor the suggestion to the user's question.** If the user's input
signals a specific sub-intent (e.g., "为什么转账后收到变少" suggests
they want to know about fees), phrase the next step as a follow-up
question rather than a generic link.

**Omit when no other sources have hits** — don't pad with generic
"explore Academy" links. Honesty over filler.

### Field Mapping

| Template variable | API field |
|---|---|
| `<term>` | `best.items[0].title` (or `courseTitle` for L&E, `title` for Resource, `title` for Articles) |
| `<pageUrl>` | `best.items[0].pageUrl` for glossary / L&E / resource; **`best.items[0].visitUrl` for articles** (article items have no `pageUrl` field) |
| `<paraphrased definition>` | paraphrase of `best.items[0].excerpt` (Glossary) / `courseDescription` (L&E) / `subTitle` (Resource) / `bodyTextOnly` (Articles) |
| `<suggestion>` / `<nextStepUrl>` | per the decision table above |

### Before / After — Example 1 (single source, no next step)

**User:** "What is Gas Fee?"

API response: `best.source = glossary`, `best.items[0].title = "Gas Limit"`,
other sources empty.

**Reply:**

```markdown
**[Gas Limit](https://www.binance.com/en/academy/glossary/gas-limit)**

The maximum price a user is willing to pay per unit of gas for a
transaction on the Ethereum network. Gas Limit caps how much
computational work the transaction can consume.
```

### Before / After — Example 2 (with next step)

**User:** "What is DeFi?"

API response: `best.source = glossary`, `best.items[0].title = "Decentralized Finance (DeFi)"`,
`learnEarn` has hits.

**Reply:**

```markdown
**[Decentralized Finance (DeFi)](https://www.binance.com/en/academy/glossary/defi)**

DeFi refers to financial services built on public blockchains that
operate without central intermediaries, using smart contracts to
enable trading, lending, and other financial activities.

🔗 [Learn and earn with related L&E courses](https://www.binance.com/en/academy/learn-and-earn/course/...)
```

## Intent 2 — Risk Education

### Template

```markdown
**⚠️ <risk pattern>**

<brief answer: what it is, how it works>

**Risk:** <quote from Academy content>

**Example:** <concrete numerical simulation, e.g., "20x leverage: a 5% adverse move can liquidate your position">

Safer next step: learn <topic> first → [<link text>](<pageUrl>)

> ⚠️ Educational content only, not investment advice. Crypto prices are volatile; you may lose your entire principal. Please understand the risks before deciding.
```

The disclaimer block (last line) is **non-negotiable** for risk scenarios.

The "Example" must be a **concrete numerical** simulation, not a vague
warning. Numbers make the risk tangible.

Do NOT say "you should not do this" — frame it as a positive "Safer
next step", not a prohibition. Education, not advice.

### Before / After

**User:** "Should I open a 20x leveraged long on BTC?"

**Reply:**

```markdown
**⚠️ Borrowing + 20x leverage + directional long — a triple risk stack**

Leveraged trading uses borrowed funds to amplify your position. 20x
leverage means a 1% price move = 20% account equity swing. Leverage
amplifies gains, but equally amplifies losses.

**Risk:** Academy's risk education content notes: leveraged trading
magnifies losses — when the market moves against you, you may lose your
entire principal; borrowing to trade also incurs interest costs that
further compound losses.

**Example:** Suppose you use 100 USDT principal + borrow 1,900 USDT to
open a 20x BTC long (notional 2,000 USDT). BTC drops 5% → position loss
= 100 USDT = 100% of principal → forced liquidation, principal wiped
out; borrowing interest is additional.

Safer next step: learn leverage, margin, liquidation, and risk management
systematically → [View Academy risk education content](https://www.binance.com/en/academy/glossary/leverage)

> ⚠️ Educational content only, not investment advice. Crypto prices are volatile; you may lose your entire principal. Please understand the risks before deciding.
```

## Intent 3 — Customized Learning Plan

### Template

```markdown
**<topic> · <Difficulty>**

<2-3 sentence overview of the learning path>

**Day 1:** [Course title](courseUrl)
  - [Module title](moduleUrl)
  - [Module title](moduleUrl)
**Day 2:** [Course title](courseUrl)
  - [Module title](moduleUrl)

Full track: [View learning path](<track pageUrl>)
```

### Day Grouping Guidance

| User signal | Day count | Plan shape |
|---|---|---|
| "快速了解" / "brief" / "quick" | 1 day | single Course, 3-5 Modules |
| (default) | 3 days | one Course per day, top 3-4 Modules each |
| "系统学习" / "systematically" | 5 days | one Course per day, top 2-3 Modules each |
| "证书" / "certificate" | 1 entry per Course | mention `courseUrl` + LinkedIn eligibility if known |

### Format Notes

- Course title is a clickable link (`[Course title](courseUrl)`)
- Each Module is a bullet list item (`  - [moduleTitle](moduleUrl)`) below its Day
- Do NOT use inline `→` separators or nested tables — they break in chat rendering

### Before / After

**User:** "I want to learn DeFi, where do I start?"

**Reply:**

```markdown
**DeFi · Beginner**

DeFi (decentralized finance) is one of the most important application
directions on blockchain. This Beginner Track consists of 6 Courses;
we recommend finishing the core content in 3 days, or extend to 5
days for systematic learning.

**Day 1:** [Blockchain Fundamentals](https://www.binance.com/en/academy/courses/track/beginner-track/blockchain-fundamentals)
  - [What is blockchain?](https://www.binance.com/en/academy/courses/track/beginner-track/blockchain-fundamentals/what-is-blockchain)
  - [How does blockchain work?](https://www.binance.com/en/academy/courses/track/beginner-track/blockchain-fundamentals/how-does-blockchain-work)
**Day 2:** [Crypto Fundamentals](https://www.binance.com/en/academy/courses/track/beginner-track/crypto-fundamentals)
  - [What are cryptocurrencies?](https://www.binance.com/en/academy/courses/track/beginner-track/crypto-fundamentals/what-are-cryptocurrencies)
  - [An introduction to Bitcoin](https://www.binance.com/en/academy/courses/track/beginner-track/crypto-fundamentals/an-introduction-to-bitcoin)
**Day 3:** [Decentralization](https://www.binance.com/en/academy/courses/track/beginner-track/decentralization)
  - [Introduction to DeFi](https://www.binance.com/en/academy/courses/track/beginner-track/decentralization/introduction-to-deFi)
  - [DeFi Use Cases](https://www.binance.com/en/academy/courses/track/beginner-track/decentralization/defi-use-cases)

Full track: [View learning path](https://www.binance.com/en/academy/track/beginner-track)
```

## Intent 4 — Learn & Earn

Intent 4 has two trigger patterns (see `references/intent-routing.md`):
- **Pattern A** — explicit reward questions ("哪些 Academy 课有奖励?")
- **Pattern B** — L&E course title format ("一文读懂 X", "What is X (TICKER)?")

### Template A — Reward course list (multiple courses)

```markdown
**Academy Learn & Earn — Currently claimable rewards**

- [<courseTitle>](<pageUrl>) · 🟢 Active
- [<courseTitle>](<pageUrl>) · 🟢 Active

[View all campaigns](https://www.binance.com/<lang>/academy/learn-and-earn)
```

Client-side filter: `hasReward == "1"` AND `isRewardRunOut != "1"` AND
`activityEndDate` is in the future. When no courses qualify:

```markdown
No reward courses are currently claimable. Academy frequently updates
the Learn & Earn list — please check back in a few days:
[Academy Learn & Earn](https://www.binance.com/<lang>/academy/learn-and-earn)
```

### Template B — Single course (user asks about a specific project)

```markdown
**[<courseTitle>](<pageUrl>)**

<paraphrased courseDescription>

📅 <activityStartDate> ~ <activityEndDate> (UTC+8) · <🟢 Active / 🔴 Fully distributed / ⚪ Ended>

[View all campaigns](https://www.binance.com/<lang>/academy/learn-and-earn)
```

Status logic:
- `hasReward == "1"` AND `isRewardRunOut != "1"` AND `now < activityEndDate` → 🟢 Active
- `hasReward == "1"` AND `isRewardRunOut == "1"` → 🔴 Fully distributed
- `now > activityEndDate` → ⚪ Ended

For Template B, always show the course even if the reward is exhausted —
the user asked about this specific course. Whether it still has rewards
is useful information, not a filter criterion.

**Why no table for the single course** (Template B): the user asked
about ONE specific course — a table with rows for "Course ID" / "Course
title" / "Course link" is overkill for a single item. The `courseId`
is an internal identifier (e.g., `BN1283974667172425729`); exposing it
adds noise with zero value.

### Before / After — Template B

**User:** "What is Turtle (TURTLE)?"

**Reply:**

```markdown
**[What is Turtle (TURTLE)?](https://www.binance.com/en/academy/learn-and-earn/course/BN1283974667172425729)**

Turtle is a Web3 distribution protocol that optimizes liquidity and
reward allocation by tracking wallet activity, supporting liquidity
providers, protocols, and partners in the DeFi space.

📅 2026-07-23 09:00 ~ 2026-08-13 09:00 (UTC+8) · 🟢 Active

[View all campaigns](https://www.binance.com/en/academy/learn-and-earn)
```

## No-Content Template (when `best.source == null`)

When all 4 endpoints return 0 hits for the requested `lang`, the skill
MUST NOT invent content, fabricate Academy URLs, or auto-retry in
another language. Use the No-Content template:

```markdown
Academy doesn't have content for "<query>" yet.

**Suggestions:**
- Try a related term, e.g., "<related term>"
- Try the English equivalent (Academy's English corpus is the largest), e.g., "<English term>"
- Browse [Academy](https://www.binance.com/<lang>/academy) directly
```

**Generating the suggestions:**
- `<query>`: what was sent to the API (after extraction).
- `<related term>`: if you can think of related terms, list 1-2. If not, omit the bullet.
- `<English term>`: if the original query was Chinese and you suspect
  translation was the issue, suggest the English equivalent (e.g., for
  "钱包" suggest "wallet").

**Tone**: honest and helpful, not apologetic. Don't say "Sorry" or
"Apologies"; say "Academy doesn't have..." and pivot to suggestions.

## See Also

- `intent-routing.md` — when to use which template
- `query-extraction.md` — what to send to the API before formatting
- `api-contract.md` — the response fields referenced here
- `orchestration.md` — the 3-step flow behind Intent 3
