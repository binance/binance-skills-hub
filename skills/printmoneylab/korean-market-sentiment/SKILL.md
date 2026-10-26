---
name: korean-market-sentiment
description: |
  Korean crypto market sentiment and context in English, for agents that
  cannot read Korean-language sources. Fuses Korean crypto news (Coinness,
  6-hour window) with live Upbit/Bithumb exchange signals (deposit surges,
  volume spikes, investment warnings, premium extremes) into a structured
  sentiment read; adds per-token Korea-vs-global divergence interpretation,
  a full multi-source Korean market read, and a KRW macro stress score
  (US rates, VIX, foreign-investor flow proxy, KRW momentum, semiconductors).
  Trigger whenever the user or agent mentions: Korean market sentiment, Korea
  crypto mood, Korean retail, Korean crypto news, Korea vs global divergence,
  KRW macro, won stress, 한국 시장 심리, 한국 코인 뉴스, 원화 — even without
  the word "sentiment".
  Powered by KR Crypto Intelligence (api.printmoneylab.com) — Korean-language
  sources processed into English for global agents.
metadata:
  version: 1.0.0
  author: bakyang2
license: MIT
---

# Korean Market Sentiment — Korea Context Layer for Trading Agents

Korean retail flow is a distinct force in crypto: it concentrates on Korean
exchanges, reacts to Korean-language news, and frequently moves before or
against global venues. Most agents are blind to it because the sources are in
Korean. This skill is the **Korea-side context ("brain") layer**: an agent
reads the sentiment and divergence picture here, then executes wherever its
policy dictates — pairing naturally with Binance Skills Hub for the execution
leg, since divergence is measured against Binance-referenced global prices.

Read-only analysis of public market data and news. This skill never places
orders and never recommends buying or selling any specific asset.

## Why Korean sentiment matters (background)

- Korean exchanges quote in KRW with a persistent premium/discount vs global
  prices (the Kimchi Premium), so Korean sentiment shows up directly in
  price spreads, not only in social chatter.
- Exchange behavior — deposit surges, volume spikes, investment-warning
  flags — is itself a sentiment signal unique to the Korean market structure.
- Korean-language news (e.g., Coinness) moves this flow, and is largely
  invisible to non-Korean-speaking agents. This skill translates and
  structures that context into English.

## Connection

MCP endpoint (streamable HTTP, stateless):

```
https://mcp.printmoneylab.com/mcp
```

Works with any MCP-compatible agent (Claude Code, OpenClaw, LangChain, custom
stacks). Connecting and tool discovery are free; each tool responds with its
own usage metadata in-band, so no advance configuration is needed. For
attribution, optionally send the header `X-KRC-Source: binance-skills-hub`.

## Tools

| Tool | What it returns |
|---|---|
| `get_kr_sentiment` | Structured Korean market sentiment in English: label + score, key exchange signals (deposit/volume surges, warnings, premium extremes), and Korean news context from a 6-hour window |
| `get_global_vs_korea_divergence` | Per-token Korea-vs-global price divergence with a short interpretation (25 majors) |
| `get_global_vs_korea_divergence_deep` | Divergence plus 24h Korean news signals (keywords, sentiment score) and a structured analysis: Korean market drivers, global context, confidence |
| `get_market_read` | Full Korean market read merging 12+ sources: premium, stablecoin flow, volume leaders, funding, open interest, dominance, Fear & Greed, exchange intelligence — returned as signal, confidence, key factors, token alerts, risk warning |
| `get_krw_macro_stress` | KRW macro stress score (0–100): US 3Y rate stress, VIX, foreign-investor flow proxy, KRW momentum, Korean semiconductor equity — rolling-percentile model with per-component breakdown |
| `get_available_symbols` | Live symbol coverage (free) |
| `check_health` | Service liveness (free) |

## When to call

- **Before acting on a Korea-originated move** — `get_kr_sentiment` to see
  whether Korean retail is driving it and in which direction.
- **Per-token decision context** — `get_global_vs_korea_divergence` (or the
  deep variant when news context matters) for one symbol's Korea-vs-global
  picture.
- **Daily regime brief** — `get_market_read` as a single consolidated Korean
  market snapshot instead of polling many sources.
- **Macro filter** — `get_krw_macro_stress` when strategy should adjust to
  KRW-level stress rather than token-level noise.

## Example

```
get_kr_sentiment()
```

Returns (abridged):

```json
{
  "sentiment": "CAUTIOUS_FOMO",
  "score": 0.4,
  "report_en": "Korean retail showing mixed signals with reverse premiums on select tokens while deposit activity surges for mid-cap alts.",
  "exchange_signals": {
    "deposit_soaring": ["..."],
    "warnings": 2,
    "avg_premium_pct": 0.3
  },
  "news_context": {"total_analyzed": 20, "korean_count": 8}
}
```

Output is descriptive context, not advice. Any trading decision remains with
the agent and its own risk policy.

## Notes

- Sources: Coinness (Korean crypto news), Upbit and Bithumb public APIs,
  global reference feeds; AI synthesis produces factual English summaries
  with no recommendations.
- All content is neutral and educational; no asset is presented as
  guaranteed, safe, or recommended.
- Micropayment-enabled tools state their own terms in-band (x402 over Base,
  Polygon, or Solana); the skill document itself carries no payment details.
