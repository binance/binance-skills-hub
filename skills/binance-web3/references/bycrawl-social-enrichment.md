# ByCrawl Social Enrichment Reference

This document provides optional social enrichment mappings for Binance Web3 skills when the bycrawl MCP is available. Each section is organized by skill so you can read only the relevant portion. Social data should always supplement — never replace — on-chain data from Binance APIs.

---

## query-token-info

### Tools

| Tool | Query | Purpose |
|------|-------|---------|
| `x_search_posts` | `$SYMBOL` or token name | Gauge sentiment volume, bullish/bearish tone, notable accounts |
| `reddit_search_posts` | Token name in r/cryptocurrency, r/CryptoMoonShots, r/defi | Community discussion depth, upvote ratios, top concerns |
| `youtube_search_videos` | `"token name" crypto` | Influencer coverage, recent video count, view counts |

### How to Present

1. Lead with on-chain facts (price, volume, holders, liquidity) from Binance APIs
2. Add a **"Social Sentiment"** section with bycrawl findings
3. Note social discussion volume relative to market cap (high social / low mcap = early attention)

---

## trading-signal

### Tools

| Tool | Query | Purpose |
|------|-------|---------|
| `x_search_posts` | `$SYMBOL` or contract address | Check if token has growing social attention around signal time |
| `reddit_search_posts` | Token name in crypto subreddits | Community sentiment on the signaled token |
| `tiktok_search_videos` | Token name or symbol | Retail attention indicator (especially for meme-adjacent tokens) |

### How to Present

1. Show smart money signal data (direction, price, gain, exit rate)
2. Add a **"Social Cross-Reference"** section:
   - X buzz level: low / medium / high (based on post count)
   - Reddit sentiment: bullish / bearish / mixed
   - Retail attention: early / trending / saturated
3. Provide a conviction assessment: signal + social alignment = higher conviction

---

## meme-rush

### Tools

| Tool | Query | Purpose |
|------|-------|---------|
| `x_search_posts` | `$SYMBOL` or meme token name | Post velocity for new tokens (50+ posts in first hour = strong launch) |
| `tiktok_search_videos` | Token name | Retail viral spread — TikTok presence on a New-stage token = early retail attention |
| `reddit_search_posts` | Token name in r/CryptoMoonShots, r/memecoin, r/SolanaMemeCoins | Community forming, coordinated posting, DD posts |

### Topic Rush Validation

For Topic Rush results, validate AI-generated hot topics against real social data:
- Use `x_search_posts` with the topic name to confirm the narrative is actually trending on social media, not just on-chain
- Compare `topicNetInflow` with social post volume:
  - High inflow + low social = whale play
  - High social + low inflow = early narrative

### How to Present

1. Show Meme Rush or Topic Rush on-chain data first
2. Add a **"Social Signals"** section per token:
   - X velocity: posts/hour and key influencer mentions
   - TikTok: video count and top view counts
   - Reddit: thread count and community sentiment
3. Flag tokens where social signals diverge from on-chain data (potential alpha)

---

## query-token-audit

### Tools

| Tool | Query | Purpose |
|------|-------|---------|
| `x_search_posts` | `$SYMBOL scam`, `$SYMBOL rug`, `$SYMBOL honeypot` | Community scam warnings, screenshots of failed sells |
| `reddit_search_posts` | Token name + "scam" or "rug pull" in r/CryptoScams, r/cryptocurrency | Detailed technical scam analysis, mod warnings |

### How to Present

1. Show Binance on-chain audit results first (risk level, risk items, taxes)
2. Add a **"Community Reports"** section:
   - X warnings: count of scam-related posts, notable reporters
   - Reddit threads: detailed analysis or confirmed rug reports
3. If on-chain audit = LOW but community reports are negative, **flag the discrepancy clearly**
4. Always maintain the standard disclaimer

---

## query-address-info

### Tools

| Tool | Query | Purpose |
|------|-------|---------|
| `x_search_posts` | Wallet address (full or abbreviated) | Find people posting or attributing the address to a known entity |
| `x_get_user` | Username if owner found | Pull profile for follower count and bio |
| `linkedin_search_users` | Wallet label or address label | For institutional wallets — find fund managers, project teams, VCs |

### Cross-Reference Holdings with Social

After getting wallet token holdings, check which tokens are trending socially:
- Use `x_search_posts` for each top holding's `$SYMBOL` to see if any are currently buzzing
- A wallet holding tokens with rising social attention may indicate informed positioning

### How to Present

1. Show wallet holdings (tokens, prices, quantities) from Binance API
2. Add a **"Wallet Identity"** section if any social matches were found
3. Add a **"Social Overlay"** for top holdings — flag which tokens are currently trending on social

---

## crypto-market-rank

### Tools

| Tool | Query | Purpose |
|------|-------|---------|
| `x_search_posts` | `$SYMBOL` for top-ranked tokens | Social volume, post count in last 24h, key influencer mentions |
| `youtube_search_videos` | Token name | Influencer coverage driving retail interest |
| `reddit_search_posts` | Token name in crypto subreddits | Community discussion depth and sentiment |

### Smart Money Inflow Analysis

For tokens in the Smart Money Inflow Rank, determine whether social is lagging or leading:
- **Social leading**: High X buzz + low smart money inflow = smart money hasn't entered yet (potential early signal)
- **Smart money leading**: High inflow + low social = informed accumulation before the crowd

### PnL Leaderboard Enrichment

For top traders on the Address PnL Rank:
- `x_search_posts` — search for the wallet address to find their X handle
- `x_get_user` — pull their profile if found (followers, bio, posting style)
- Traders with large followings may be KOLs whose trades move markets

### How to Present

1. Show ranking data from Binance APIs first
2. Add a **"Social Layer"** section for top tokens:
   - Social volume rank alongside on-chain rank
   - Flag divergences (on-chain hot but socially quiet, or vice versa)
3. For PnL leaderboard, add known social identities where found

---

## Notable Web3 KOLs to Monitor

When searching X for crypto social signals, these accounts are high-signal sources worth checking:

| Handle | Followers | Focus |
|--------|-----------|-------|
| @zachxbt | 984K | Scam investigations, on-chain forensics |
| @MustStopMurad | 733K | Memecoin thesis, market cycles |
| @CryptoWizardd | 815K | Altcoin calls, trading signals |
| @lookonchain | 687K | Smart money on-chain tracking |
| @DefiIgnas | 159K | DeFi strategies |
| @0xSisyphus | 153K | DeFi commentary |
| @EmberCN | 143K | Chinese-language whale tracker |
