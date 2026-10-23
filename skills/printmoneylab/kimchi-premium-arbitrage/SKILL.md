---
name: kimchi-premium-arbitrage
description: |
  Real-time Kimchi Premium and Korea-vs-global price spread data for trading
  agents. Covers per-token premium (Upbit vs Binance global reference price,
  both official USD/KRW basis and USDT real-trade basis), a full cross-exchange
  scanner over every symbol shared by Upbit and Binance (fetched live — new
  listings appear automatically), reverse premiums (Korean discount), stablecoin
  premium as a capital-flow gauge, USD/KRW FX rate, Korean exchange prices, and
  real-time listing/warning alerts from Upbit and Bithumb.
  Trigger whenever the user or agent mentions: kimchi premium, Korean premium,
  Korea arbitrage, Upbit vs Binance spread, reverse premium, Korean exchange
  prices, stablecoin premium in Korea, KRW crypto, 김치프리미엄, 김프, 업비트,
  빗썸 — even if they don't say "premium" explicitly.
  Powered by KR Crypto Intelligence (api.printmoneylab.com) — Korean-language
  market data processed into English for global agents.
metadata:
  version: 1.0.0
  author: bakyang2
license: MIT
---

# Kimchi Premium & Korea Arbitrage — Korean Market Data Layer

Korean crypto markets trade at persistent, measurable spreads against global
venues. This skill gives an agent read-only access to that data in English.
It is **additive to Binance execution, not a competitor**: the premium itself
is computed **against Binance as the global reference price**, so this skill is
the Korea-side context layer an agent reads before routing execution through
Binance Skills Hub.

Read-only market data. This skill never places orders, never holds funds, and
never recommends buying or selling any specific asset.

## What is the Kimchi Premium (background)

The Kimchi Premium is the percentage difference between a token's price on
Korean exchanges (Upbit, Bithumb — quoted in KRW) and its price on global
venues, converted at the USD/KRW rate. It reflects Korean retail flow,
capital-control friction, and local demand cycles. Two bases matter:

- **Official-FX basis** — uses the official USD/KRW rate. This is the number
  usually quoted in media.
- **USDT real-trade basis** — uses the actual USDT/KRW rate on Korean
  exchanges. This is the spread that is actionable in practice, because USDT
  is the settlement leg most flows really use.

A related gauge is the **stablecoin premium**: when USDT/USDC trade above the
official FX rate on Korean exchanges, capital is flowing into the Korean
crypto market; below it, flowing out.

## Connection

MCP endpoint (streamable HTTP, stateless):

```
https://mcp.printmoneylab.com/mcp
```

Add the server to any MCP-compatible agent (Claude Code, OpenClaw, LangChain,
custom stacks). Connecting, listing tools, and discovering what each tool
returns is free. Each data tool responds with its own usage metadata on first
call, so the agent learns everything it needs at runtime — no keys to
configure in advance. For attribution, optionally send the header
`X-KRC-Source: binance-skills-hub` on calls.

## Tools

| Tool | What it returns |
|---|---|
| `get_available_symbols` | Live list of symbols on Upbit / Bithumb and the Upbit–Binance common set (free; fetched live from exchange listings, so new listings appear automatically) |
| `check_health` | Service liveness (free) |
| `get_kimchi_premium` | Per-token premium vs the Binance global price — both official-FX and USDT bases, with direction |
| `get_arbitrage_scanner` | Full scan across every Upbit–Binance shared symbol: per-token premiums, reverse premiums (Korean discount), Upbit–Bithumb gaps, market-share split. 60s cadence |
| `get_stablecoin_premium` | USDT / USDC premium on Korean exchanges vs official FX — capital-flow gauge |
| `get_fx_rate` | USD/KRW rate used as the premium denominator |
| `get_kr_prices` | Raw KRW quotes from Upbit and Bithumb |
| `get_exchange_alerts` | New listings, delistings, investment warnings, caution flags from Upbit/Bithumb. 60s cadence |
| `get_market_movers` | 1-minute price surges, volume spikes, top-volume tokens on Korean venues |

## When to call

- **Before routing a cross-venue trade** — read the per-token premium
  (`get_kimchi_premium`) or the full scanner to see where the Korea-global
  spread sits right now.
- **Capital-flow regime check** — `get_stablecoin_premium` as a fast gauge of
  money moving into or out of the Korean market.
- **Listing-event awareness** — `get_exchange_alerts` before acting on a token
  that may carry an Upbit/Bithumb investment warning.
- **Korea-side momentum** — `get_market_movers` for 1-minute surges that often
  lead Korean retail flow.

## Example

```
get_kimchi_premium(symbol="BTC")
```

Returns (abridged):

```json
{
  "symbol": "BTC",
  "upbit_krw": 91416000,
  "binance_usdt": 64980,
  "fx_rate": 1409.64,
  "usdt_krw_rate": 1408.0,
  "premium_percent": -0.2,
  "premium_pct_usdt": -0.08,
  "premium_direction": "negative"
}
```

Values are live market data, not signals. Interpretation and any trading
decision remain with the agent and its own policy.

## Notes

- Data sources: Upbit and Bithumb public APIs (real-time), Binance global
  price as the reference leg, official FX feed.
- All output is factual market data in English; no asset is presented as
  guaranteed, safe, or recommended.
- Micropayment-enabled tools state their own terms in-band (x402 over Base,
  Polygon, or Solana); the skill document itself carries no payment details.
  
