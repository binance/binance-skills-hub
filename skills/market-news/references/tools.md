# Tool reference

Endpoint: `https://api.flash.im/mcp` (MCP, Streamable HTTP). No key, no sign-in.
Without an MCP client, send one JSON-RPC POST per call, with
`Content-Type: application/json` and
`Accept: application/json, text/event-stream`:

```json
{"jsonrpc": "2.0", "id": 1, "method": "tools/call", "params": {"name": "<tool>", "arguments": { }}}
```

This file covers the three news tools the skill uses. `tools/list` on the same
endpoint returns the live definitions of every tool the server offers.

## find_news

News about one subject. Send exactly one of `keyword` or `sentence`, in English.

| Argument | Type | Notes |
|---|---|---|
| `keyword` | array of strings | Names or tickers, up to 30, matched as a union. Tickers in upper case: a lower case ticker reads as an ordinary word. Generic words ("price", "market crash") are not entities and do not match. |
| `sentence` | string | A prediction market question or a page title, as written. Entities are extracted from it. Not together with `keyword`. |
| `subEntities` | array of strings | With `sentence` only: outcome or candidate names when the sentence names no specific entity, up to 50. |
| `category` | array | `crypto`, `economy`, `politics`, `geopolitics`. Omit for all. Giving one is what allows `fallback.items`. |
| `impact` | array of integers | Tiers 2 to 5. `[4, 5]` returns only the important news. |
| `subCategory` | array of strings | Sections, up to 10. See the list below. |
| `excludeSources` | array of integers | Source numbers to leave out, for example `[17, 18]`. The table of sources and their numbers is at https://docs.flash.im/docs/api-reference/news-item-fields.md ("Source numbers"). |
| `lang` | string | One of the 16 language codes below. Default `en`. |
| `limit` | integer | 1 to 100. Default 10. |
| `before` | string | ISO 8601 UTC ending in `Z`. Items published before this time. For a prediction market, its close time. |
| `after` | string | Same format. Items published after this time. |
| `fields` | array | See the field list below. |

Result: `matchStatus` (`matched`, `topic_broad`, `no_match`) and `items`. When the
sentence is a prediction market question FLASH tracks, the result also carries
`topicId`, and each item carries `relation` (`direct`, `adjacent`, `broad`).
`fallback` appears only when few stories match: `strategy` `category_latest` (the
category's latest news, not about the subject) or `sentence_match` (entity matches
for the sentence, not checked against the question).

## get_latest_news

The newest news, newest first. Every argument is optional: `category`, `impact`,
`subCategory`, `excludeSources`, `lang`, `limit`, `before`, `after`, `fields`, with
the same meaning as in `find_news`. With no arguments, the 10 newest items across
all categories.

## get_top_news

The ranked top news of one category over the last 48 hours, recomputed every hour.
Up to 10 items, each with `rank` (1 is the most important). The response carries
`generatedAt`.

| Argument | Type | Notes |
|---|---|---|
| `category` | string, required | `crypto`, `economy`, `politics`, or `geopolitics` |
| `lang` | string | Default `en` |
| `fields` | array | Same field list. `id` and `rank` always come back. |

## Fields

`id` always comes back. Default set: `headline`, `summary`, `whyItMatters`,
`impact`, `eventType`, `source`, `sourceUrl`, `publishedAt`. Send `fields` to choose.

| Field | Meaning |
|---|---|
| `headline` | FLASH headline |
| `sourceHeadline` | The original outlet's own headline |
| `summary` | Short summary |
| `body` | Key-point article body. Never in the default response, and the longest field (more than half of a full item): request it only for stories you will read in full. |
| `whyItMatters` | What the event changes, two or three sentences. Impact 4 and 5 only, otherwise null. |
| `impact` | 2 to 5, 5 is the most important |
| `impactScore` | 0 to 100, orders items within one impact tier |
| `eventType` | One of 18 event types |
| `categories`, `subCategories` | Category and sections of the story |
| `entities` | `name`, `aliases`, `ticker`, `entitySentiment` (`Positive`, `Neutral`, `Negative`, or null: how the event bears on that entity, not a price prediction) |
| `source`, `sourceUrl` | Original outlet (`name`, `logoUrl`) and the link to the original article |
| `publishedAt` | ISO 8601 UTC |
| `clusterId`, `relatedCount` | The same event across outlets, and how many reports FLASH has published on it |
| `lang` | Language of the text |

Image fields (`covers`, `sourceImageUrl`) exist as well. This skill does not use
them; their license terms are in the FLASH docs.

`["all"]` on its own returns every field, `body` included; combined with other
names it is an error. About 250 tokens per item with the
default fields, about 40 with `headline`, `impact`, `publishedAt`.

## Sections (subCategory)

- crypto: crypto-markets, crypto-etf, crypto-regulation, crypto-security,
  stablecoins, defi, tokenization, crypto-institutions, crypto-networks, mining,
  memecoins-nft, crypto-exchanges
- economy: central-banks, economic-data, bonds-credit, stocks, earnings, deals, fx,
  commodities, energy, trade-tariffs, fiscal, etf-funds, ai, semiconductors, tech,
  media-telecom, banks-finance, healthcare, retail-consumer, autos-ev, industrials,
  real-estate, prediction-markets
- politics: us-executive, us-congress, courts, us-elections, world-elections,
  immigration, us-states, tech-policy, public-health, social-policy, world-politics
- geopolitics: middle-east, europe, asia-pacific, americas, africa, ukraine-war,
  iran-war, gaza-war, sanctions, defense, diplomacy, security-threats,
  climate-disasters

A slug outside this list returns no items.

## Sources

The current list of sources, with the number each one takes in
`excludeSources` and the host of its `sourceUrl`:
https://docs.flash.im/docs/api-reference/news-item-fields.md ("Source numbers").
As of November 2026 there are 50 sources plus "FLASH AI", FLASH's own posts.

## Languages

en, zh-CN, zh-TW, ko, ja, ru, tr, de, es, fr, vi, th, id, hi, it, pt
