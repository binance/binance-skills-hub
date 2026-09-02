# Intent Routing Rules

This skill is **intent-driven, not keyword-driven**. The decision to
invoke must come from recognizing one of the four user intents below,
not from a keyword match.

## Core Principle

The same surface word can signal very different intents:

| User input | Intent | Why |
|-----------|--------|-----|
| "bitcoin" alone | No trigger | Could be price check, trading, news, etc. No question, no plan request. |
| "what is bitcoin" | Intent 1 (Knowledge Q&A) | User is asking a definitional question. |
| "buy 1 bitcoin" | No trigger | Trading execution; not educational. |
| "is bitcoin a good investment" | Intent 2 (Risk Education) | User is asking about a risky activity; do NOT answer the investment question directly — give risk education. |
| "我想学 bitcoin" | Intent 3 (Learning Plan) | Explicit learning request. |
| "哪些 Academy 课有 bitcoin 奖励" | Intent 4 (Learn & Earn) | Asking about reward courses. |

Rule of thumb: a word alone is never a trigger. A word **plus** an
intent-bearing verb/structure (asking, learning, risk-seeking) is.

## The Four Intents

### Intent 1 — Knowledge Q&A

User asks a definitional or explanatory question about a crypto
concept, term, or mechanism.

**Primary tool:** `searchGlossary` (supplement with `searchResource`
if the concept maps to a Course/Module).

**Positive examples:**
- "什么是 Gas Fee?" — direct definitional question (zh)
- "Gas Fee 是什么意思" — same intent, different phrasing (zh)
- "What is a wallet private key?" — direct definitional question (en)
- "How does leverage liquidation work?" — mechanism question (en)
- "为什么转账后收到的币变少了?" — symptom-led question; map to
  underlying concept (zh)
- "BEP-20 是什么?" — term definition (zh)
- "explain proof of stake vs proof of work" — comparison question (en)
- "智能合约是什么?" — term definition (zh)

**Negative examples (similar surface, different intent):**
- "buy 1 bitcoin" — trading execution; no trigger.
- "what's BTC price" — market data; no trigger.
- "is bitcoin a good investment" — Intent 2 (Risk Education), not a
  direct answer to investment merit.
- "I forgot my Binance password" — account/support; no trigger.
- "Academy 改密" — support; no trigger.

**Distinguishing signals:**
- Question words: "什么是", "是什么", "为什么", "如何", "what is",
  "how does", "why does", "explain".
- No action verb asking the user to do something risky.
- No request for a structured learning plan.

### Intent 2 — Risk Education

User expresses high-risk trading/investment intent or asks about a
risky activity. The skill must NOT answer the investment question
directly — instead, give risk education with the mandatory
risk-warning block.

**Primary tool:** `searchGlossary` for the underlying risk concept,
then format with the Intent 2 template (see `output-format.md`).

**Positive examples:**
- "借钱放大仓位，开 20 倍杠杆做多 BTC 可以吗?" — leverage + borrowing (zh)
- "Should I put all my savings into crypto?" — all-in (en)
- "全部身家投 crypto 行吗?" — all-in (zh)
- "金字塔加仓被套了怎么办?" — pyramiding (zh)
- "is bitcoin a good investment" — investment merit (en)
- "20x leverage long ETH, what could go wrong?" — leverage (en)
- "遇到了一个年化 200% 的项目，靠谱吗?" — likely scam; risk education
  on scams (zh)
- "做空 100x 可以吗" — high leverage (zh)

**Negative examples:**
- "How does leverage liquidation work?" — Intent 1 (Knowledge Q&A);
  user is asking about a mechanism, not seeking to perform a risky
  action.
- "什么是杠杆" — Intent 1; definitional question about a term that
  happens to be risk-related.
- "buy 1 BTC" — pure trading execution; no trigger.

**Distinguishing signals:**
- User is asking permission ("可以吗", "行不行", "should I",
  "is it safe") AND the activity is risky.
- User describes a position ("20 倍", "100x", "all in", "全部身家",
  "borrowing to trade", "借钱").
- User is asking about a high-yield opportunity ("年化 200%",
  "200% APY", "guaranteed return") — likely scam.

### Intent 3 — Customized Learning Plan

User asks for a structured learning path on a topic.

**Primary tool:** `getLearningPlan` (orchestrates `searchResource ->
resolveParentTrack -> getTrackOutline`; see `orchestration.md`).

**Positive examples:**
- "我想学 DeFi，但不知道从哪开始" — explicit learning request (zh)
- "Build me a 5-day Bitcoin learning plan" — explicit plan request (en)
- "DeFi 入门有什么学习路径?" — asks for a path (zh)
- "系统学习 blockchain" — systematic learning (zh)
- "give me a learning path for smart contracts" — explicit path (en)
- "我想学比特币入门" — beginner learning (zh)
- "推荐一个 Ethereum 学习路线" — requests a route/plan (zh)

**Negative examples:**
- "What is DeFi?" — Intent 1; definitional question, not a plan
  request.
- "DeFi 现在价格多少" — market data; no trigger.
- "buy ETH" — trading execution; no trigger.
- "我想学怎么炒币" — intent is "trade", not "learn a topic"; do NOT
  trigger Intent 3 (consider Intent 2 if "炒" implies risk-seeking;
  otherwise no trigger).

**Distinguishing signals:**
- "我想学 X", "build me a plan", "学习路径", "learning path",
  "入门", "systematic", "系统学习", "路线".
- User is asking for a structured multi-step plan, not a single
  answer.

### Intent 4 — Learn & Earn

User asks about Academy courses that pay crypto rewards, **OR** uses
the canonical L&E course title format. This intent has two trigger
patterns:

**Pattern A — explicit reward questions:**
- "哪些 Academy 课有奖励?" — reward courses (zh)
- "which courses give me crypto?" — reward courses (en)
- "Academy 课程 奖励" — reward courses (zh)
- "Learn & Earn" — by name (en)
- "Academy 有什么可以赚币的课?" — reward courses (zh)
- "how to earn crypto by learning on Binance?" — reward courses (en)

**Pattern B — L&E course title format (CRITICAL — easy to miss):**
The L&E team uses a consistent naming convention for courses:
- "一文读懂 X" (zh) — e.g., "一文读懂 Turtle", "一文读懂 Initia",
  "一文读懂 KernelDAO"
- "What is X (TICKER)?" (en) — e.g., "What is Turtle (TURTLE)?",
  "What is Solv Protocol (SOLV)?"
- "X (TICKER)" with parentheses — e.g., "Turtle (TURTLE)"

When the user's input matches this format, **route to Intent 4
FIRST**, not Intent 1, even if the user does not explicitly mention
"reward". The L&E course IS the canonical Academy content for that
project; there is usually no separate Glossary entry for it.
Verified examples (2026-08-04):
- "一文读懂 Turtle" → searchLearnEarn (raw input) →
  "一文读懂 Turtle (TURTLE)", courseId=BN1283974667172425729, hasReward=1
- "What is Turtle (TURTLE)?" → same course, English title

**Primary tool:** `searchLearnEarn`.

**Query strategy for Intent 4:**
- Send the **raw user input** as `query` first (the L&E backend
  matches raw input directly when the user's phrasing matches the
  course title — e.g., "一文读懂 Turtle" hits the course titled
  "一文读懂 Turtle (TURTLE)" because both `一文读懂` and `Turtle`
  are tokens in the title).
- If 0 hits, fall back to a clean keyword: drop "一文读懂" / "What
  is" / the ticker in parentheses, keep the project name (e.g.,
  `Turtle`, `Solv Protocol`). See `query-extraction.md`.
- Do NOT extract upfront — the raw input often works directly.

**Negative examples:**
- "Academy 改密" — support; no trigger.
- "how to use Academy" — support; no trigger.
- "Academy 有哪些课程?" — general course question; this could be
  Intent 3 if user wants a structured plan, or no trigger if user
  just wants to browse. Default to no trigger unless user explicitly
  mentions rewards.
- "Bitcoin price" — market data; no trigger.

**Distinguishing signals:**
- Pattern A: "奖励", "reward", "earn crypto", "Learn & Earn", "领币",
  "赚币".
- Pattern B: input starts with "一文读懂" or matches
  `What is X (TICKER)?` / `X (TICKER)` pattern (capitalized English
  word + all-caps ticker in parentheses). The ticker pattern is a
  strong signal because Glossary entries are NOT named this way —
  Glossary uses plain terms ("Gas Limit", "BEP-20"), while L&E
  courses use the "Project (TICKER)" format.
- The user is asking about rewards specifically, OR the user's input
  matches the L&E title format (in which case the reward question is
  implicit).

## Ambiguous Cases and Tie-Breakers

| User input | Default | Reason |
|-----------|---------|--------|
| "Tell me about DeFi" | Intent 1 (Knowledge Q&A) | Generic request; default to the simpler intent unless the user explicitly asks for a plan/path/learning. |
| "How do I trade with leverage?" | Intent 2 (Risk Education) | User is asking how to DO something risky; that is risk education, not a neutral "how does it work" knowledge question. The "how do I" + risky action is the trigger. |
| "Explain DeFi to me" | Intent 1 | Generic explanation request. |
| "Teach me DeFi" | Intent 3 | "Teach me" implies structured learning. |
| "我想了解一下 DeFi" | Intent 1 | "了解一下" is exploratory; default to Q&A. |
| "什么是 DeFi，怎么入门?" | Intent 3 (Learning Plan) | The "怎么入门" part signals a plan request; Q&A is not enough. |
| "20x 杠杆是什么" | Intent 1 (Knowledge Q&A) | Pure definitional question; no permission-seeking or position description. |
| "20x 杠杆可以吗" | Intent 2 (Risk Education) | Permission-seeking + risky activity. |
| "一文读懂 Turtle" | Intent 4 (Learn & Earn) | L&E title format — Pattern B. Route to Intent 4 and use raw input as `query` (the L&E backend matches "一文读懂 Turtle" directly against the course title). Do NOT route to Intent 1; Glossary has no entry for "Turtle". |
| "What is Turtle (TURTLE)?" | Intent 4 (Learn & Earn) | L&E title format with ticker — Pattern B. Try raw input first; if `lang` mismatches the title's language (e.g., zh query against en-only course), fall back to `Turtle`. |
| "What is Bitcoin?" | Intent 1 (Knowledge Q&A) | Plain "What is X" without ticker — Glossary has a "Bitcoin" entry. Default to Intent 1; if Glossary misses on raw input, retry with `Bitcoin` keyword, then apply cross-endpoint fallback. |
| "TURTLE 是什么?" | Intent 4 first, then Intent 1 | All-caps token ticker is a strong L&E signal; try searchLearnEarn first (raw input), fall back to searchGlossary. |

General tie-breaker rules (in priority order, top wins):
1. **L&E title format overrides Intent 1** when the input matches
   "一文读懂 X", "What is X (TICKER)?", or "X (TICKER)". Route to
   Intent 4 first. (Rationale: the L&E course IS the canonical Academy
   content for that project; Glossary almost never has an entry for
   token-specific projects like Turtle, Initia, KernelDAO.)
2. **Risk signals override knowledge signals** when the user is
   permission-seeking or describing a position. "可以吗", "行不行",
   "should I" + risk = Intent 2.
3. **Plan signals override knowledge signals** when the user
   explicitly asks for a path/plan/learning. "学习路径",
   "build me a plan", "怎么入门" = Intent 3.
4. **Reward signals override general course questions** when the user
   mentions rewards. "奖励", "earn crypto" = Intent 4.
5. **Definitional questions are always Intent 1** unless they
   explicitly ask for a plan or match the L&E title format.
   "什么是 X" = Intent 1 (but apply Intent 1 fallback rules if
   Glossary returns 0 hits — see `SKILL.md` "Fallback Rules").

## When NOT to Trigger

Do not use this skill for:

- **Account / login / support issues** — "I forgot my password",
  "Academy 改密", "how to use Academy", "Binance 登录不了". These
  belong to support tools.
- **Price / market data questions** — "what's BTC price", "ETH 多少
  钱", "BTC 行情". These belong to market-data tools.
- **Pure trading execution** — "buy 1 BTC now", "swap ETH for USDT",
  "卖 100 ETH". These belong to trading tools.
- **Off-topic small talk** — "你好", "how are you", "今天天气怎么样".
  No skill needed.
- **Market timing questions without risk-seeking language** — "is
  now a good time to buy" is market timing; treat as no trigger or
  as Intent 2 depending on whether the user describes a position.

## See Also

- `query-extraction.md` — how to clean user input into a `query`
- `output-format.md` — card templates per intent
- `api-contract.md` — endpoint schemas
