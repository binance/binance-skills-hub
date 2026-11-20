# market-news

A read-only skill that gives an agent analyzed news on crypto, the economy,
politics, and geopolitics from the FLASH MCP server: news on an asset or a
company, the top stories of a category, and the news behind a prediction market
question.

Every story arrives as structured JSON with fixed, named fields, analyzed once by
one standard: an importance tier (`impact`, 2 to 5), a finer importance score
(`impactScore`, 0 to 100), an event type, and the entities involved, each with
its own sentiment. An agent can filter and rank by these values in code without
reading the text.

## Sources

FLASH reads reporting from 50 sources and writes each story in its own words.
Every item names the source that reported it (`source.name`) and links its
original article (`sourceUrl`).

| Group | Sources |
|---|---|
| Crypto | Cointelegraph, CoinDesk, The Block, Decrypt, CryptoSlate, Bitcoin Magazine, Beincrypto, Daily Hodl, Protos, Odaily, CryptoRank, CoinGecko |
| Business and finance | Bloomberg, Financial Times, Wall Street Journal, CNBC, Economist, Forbes, Fortune, Benzinga, TechCrunch |
| Politics and policy | Politico, The Hill, Axios, Semafor, Foreign Policy |
| General news | Reuters, AP News, New York Times, Washington Post, Guardian, BBC, CNN, Fox News, CBS News, NBC News, ABC News, MS NOW, NPR, Al Jazeera, DW, France 24, SCMP |
| Official institutions | Federal Reserve, U.S. SEC, CFTC, FDIC, OFAC, IMF, White House |

A few items are FLASH's own posts (`source.name` "FLASH AI"). The current list,
with each source's number for the `excludeSources` argument, is at
https://docs.flash.im/docs/api-reference/news-item-fields.md ("Source numbers").

## News license

- **Original work.** `headline`, `summary`, `body`, `whyItMatters`, and the
  analysis values (`impact`, `eventType`, `entities`) are written by FLASH. They
  can be shown without a license from the sources.
- **Credit the source.** Wherever a story's summary or text is shown, the source
  name goes with it. A headline shown on its own may leave it out, and the link to
  the original is optional. `SKILL.md` tells the agent to do this.
- **Source fields.** `sourceHeadline` (and `sourceImageUrl`) belong to the
  source: use them only together with the link to the original article.
- **Not allowed.** Changing the analysis values while presenting them as FLASH's,
  or presenting content as if a source endorsed it.

Full terms: https://docs.flash.im/docs/resources/news-licensing.md

## Requirements

- An MCP client, or `curl` for plain HTTP calls. No other binaries.
- No API key, no account, no payment, no wallet access. The endpoint is free,
  with fair-use limits. `SKILL.md` gives polling intervals for scheduled use.
- No scripts are included. Every call is one HTTP POST, shown in `SKILL.md`.

## Quick test

Three calls you can run before installing the skill. No key or account is needed.
Each returns HTTP 200 and a JSON-RPC result whose `result.content[0].text` is a
JSON string holding the answer. With `jq` installed (optional), append
`| jq -r '.result.content[0].text' | jq .` to read it.

The samples below show the shape of each answer. Values in angle brackets vary.

### 1. News on an asset

Matching is by entity, so the name and the ticker resolve to the same subject.

```bash
curl -s https://api.flash.im/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"find_news","arguments":{"keyword":["Nvidia","NVDA"],"limit":2,"fields":["headline","impact","eventType","entities","publishedAt"]}}}'
```

```json
{
  "items": [
    {
      "id": "<story id>",
      "headline": "<headline>",
      "impact": 4,
      "eventType": "regulation-action",
      "entities": [
        {"name": "Nvidia", "aliases": [], "ticker": "NVDA", "entitySentiment": "<Positive, Neutral, Negative, or null>"},
        {"name": "<another entity>", "aliases": ["<alias>"], "ticker": null, "entitySentiment": "<...>"}
      ],
      "publishedAt": "<ISO 8601 UTC>"
    }
  ],
  "matchStatus": "matched"
}
```

### 2. A prediction market question

Send the question as written. When it is a question FLASH tracks, the answer
carries `topicId`, and each story carries `relation`: `direct` (about the
question), `adjacent` (bears on it indirectly), or `broad` (background).

```bash
curl -s https://api.flash.im/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"find_news","arguments":{"sentence":"Will the Fed cut rates in December 2026?","limit":3,"fields":["headline","impact","publishedAt"]}}}'
```

```json
{
  "items": [
    {"id": "<story id>", "headline": "<headline>", "impact": 4, "publishedAt": "<ISO 8601 UTC>", "relation": "direct"},
    {"id": "<story id>", "headline": "<headline>", "impact": 2, "publishedAt": "<ISO 8601 UTC>", "relation": "adjacent"}
  ],
  "matchStatus": "matched",
  "topicId": "<topic id>"
}
```

### 3. Top stories of a category

The ranked top 10 of the last 48 hours, recomputed hourly.

```bash
curl -s https://api.flash.im/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"get_top_news","arguments":{"category":"crypto","fields":["headline","impact"]}}}'
```

```json
{
  "category": "crypto",
  "items": [
    {"rank": 1, "id": "<story id>", "headline": "<headline>", "impact": 5},
    {"rank": 2, "id": "<story id>", "headline": "<headline>", "impact": 4}
  ],
  "generatedAt": "<ISO 8601 UTC>"
}
```

## Endpoint and versioning

- The default response is light: it leaves out `body`, the long key-point text
  (more than half of a full item). The skill asks for `body` only when the user
  reads a story in full, so agents spend fewer tokens.
- One endpoint: `https://api.flash.im/mcp`. The skill uses three read-only tools:
  `find_news`, `get_latest_news`, `get_top_news`. `tools/list` returns the live
  definitions of every tool the server offers.
- The server keeps no session. One request gets one JSON answer.
- The skill names every field it uses in `fields`, so a change to the server's
  default field set does not change what the skill receives.
- Tool names, argument names, and field names in this skill are kept as they are.
  New arguments and fields may be added. A change that would break this skill
  ships under a new tool or endpoint name, and this skill is updated by a pull
  request here before the old one is removed.
- If the service is unavailable or rate limited, the tool result says so in plain
  words (`isError: true`), and the skill tells the agent to say so rather than
  guess.

## Data handling

The server logs each tool call (tool name, arguments, response time) with the IP
address and user agent of the request. A question sent to `find_news` as a
sentence is logged as well. The skill never sends wallet addresses, keys, or
other secrets. Details: https://docs.flash.im/docs/for-ai-agents/mcp-server.md

## Skill license

MIT. This covers the skill files in this folder. The news content is covered by
"News license" above.
