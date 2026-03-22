---
name: web3-social-research
description: |
  Combined Web3 + social intelligence research. Queries Binance on-chain data (token info, signals, audits, rankings)
  and enriches with bycrawl social signals from X, Reddit, TikTok, and YouTube.
  Use when users ask to "research a token with social data", "check social sentiment for $TOKEN",
  "what's the social buzz on this token", "full research on $TOKEN", or any Web3 query where social context adds value.
metadata:
  author: binance-web3-team
  version: "1.0"
---

# Web3 Social Research Skill

## Overview

This skill orchestrates combined on-chain + social intelligence research by coordinating Binance Web3 API skills with bycrawl social data enrichment. It produces comprehensive research reports that pair hard on-chain data with real-time social signals.

## Orchestration Workflow

### Step 1: Identify the Research Type

Determine what the user wants from their query:

| User Intent | Primary Skill | Social Focus |
|-------------|--------------|--------------|
| Token research / price check | `query-token-info` | Sentiment, influencer coverage |
| Signal validation / smart money | `trading-signal` | Conviction scoring |
| Meme discovery / trending launches | `meme-rush` | Viral detection, post velocity |
| Security check / is it safe | `query-token-audit` | Scam reports, community warnings |
| Wallet lookup / who owns this | `query-address-info` | Wallet identity, social profiles |
| Rankings / what's hot | `crypto-market-rank` | Social volume overlay |

### Step 2: Call the Binance Web3 API First

Use the appropriate Binance Web3 skill to fetch on-chain data. This is always the foundation — social data enriches but never replaces on-chain facts.

### Step 3: Enrich with ByCrawl Social Data

Reference `references/bycrawl-social-enrichment.md` for the specific tool mappings per skill. Each section lists which bycrawl tools to call, what queries to use, and what to extract.

Key bycrawl tools used across workflows:
- `x_search_posts` — primary social signal source for crypto
- `reddit_search_posts` — community depth and detailed analysis
- `youtube_search_videos` — influencer coverage and retail awareness
- `tiktok_search_videos` — retail viral spread (meme tokens)
- `x_get_user` — profile lookup for wallet owners or KOLs
- `linkedin_search_users` — institutional wallet identification

### Step 4: Present Combined Report

Structure every report with:
1. **On-chain data first** — prices, volumes, holders, risk levels, rankings
2. **Social layer second** — sentiment, discussion volume, influencer mentions
3. **Divergence flags** — highlight where on-chain and social signals disagree

### Step 5: Flag Divergences

Divergences between on-chain and social data are the most actionable insights:

| Pattern | Meaning |
|---------|---------|
| High on-chain activity + low social | Whale/insider accumulation, not yet public |
| High social buzz + low on-chain volume | Early narrative forming, smart money hasn't entered |
| Positive audit + negative social reports | Community knows something the contract scan missed |
| Smart money buying + social scam warnings | Conflicting signals, proceed with extreme caution |

## Example Workflows

### "Research $PEPE"

1. Call `query-token-info` APIs — get token metadata, dynamic data (price, volume, holders, liquidity)
2. Call `x_search_posts` with `$PEPE` — measure social volume and sentiment
3. Call `reddit_search_posts` in r/cryptocurrency, r/CryptoMoonShots — community discussion
4. Call `youtube_search_videos` for `"PEPE" crypto` — influencer coverage
5. Present: on-chain fundamentals + social sentiment section + note any divergences

### "Is this token safe? 0x1234..."

1. Call `query-token-audit` API — get risk level, risk items, buy/sell taxes
2. Call `x_search_posts` with `$SYMBOL scam` and `$SYMBOL rug` — find community warnings
3. Call `reddit_search_posts` for scam reports in r/CryptoScams — detailed analysis
4. Present: audit results + community reports section + flag discrepancies between audit and social

### "What memes are trending?"

1. Call `meme-rush` API (rankType=10 for New, rankType=30 for Migrated) — get meme token lists
2. For top results, call `x_search_posts` with each `$SYMBOL` — measure post velocity
3. Call `tiktok_search_videos` for top tokens — check retail viral spread
4. Call `reddit_search_posts` in r/CryptoMoonShots, r/memecoin — community forming
5. Present: meme rush data + social signals per token + flag tokens with divergent signals

### "Who is this wallet? 0xABC..."

1. Call `query-address-info` API — get token holdings and positions
2. Call `x_search_posts` with the wallet address — find owner attribution
3. If owner found, call `x_get_user` — get their profile
4. For large/diversified wallets, call `linkedin_search_users` — institutional identification
5. Present: holdings + wallet identity + social overlay on trending holdings

### "What are the top tokens right now?"

1. Call `crypto-market-rank` APIs — trending tokens, social hype, smart money inflow
2. For top-ranked tokens, call `x_search_posts` with `$SYMBOL` — social volume check
3. Call `youtube_search_videos` for top tokens — influencer coverage
4. Present: ranking data + social layer + flag divergences between on-chain rank and social rank

## Notes

1. Always check if bycrawl MCP is available before attempting social enrichment calls
2. If bycrawl is unavailable, still present the on-chain data without the social layer
3. Social data is supplementary — never delay or block the response waiting for social calls
4. Reference `references/bycrawl-social-enrichment.md` for the Notable Web3 KOLs list when evaluating X search results
