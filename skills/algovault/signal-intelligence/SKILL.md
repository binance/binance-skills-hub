---
name: signal-intelligence
description: |
  AlgoVault MCP returns one composite trade verdict per call — call
  (BUY/SELL/HOLD), confidence, market regime, and the cross-venue funding /
  open-interest / trend factors behind it — so an agent reads one JSON verdict
  instead of computing raw indicators itself. Cross-venue intelligence across
  the major crypto perpetual-futures venues; every signal Merkle-anchored on
  Base L2 (verify at https://algovault.com/track-record). Use it as the
  analytics brain layer for a trading agent, then pair with Binance
  Skills Hub for execution. Read-only — never places an order. Tutorial:
  https://algovault.com/docs/integrations/binance
metadata:
  version: 1.1.0
  author: AlgoVaultFi
---

# AlgoVault Signal Intelligence — Composite Verdict for Crypto Perps

> The Brain Layer for AI Trading Agents. AlgoVault returns the analytics verdict; your agent and its risk policy decide execution. It is **additive to Binance execution, not a competitor** — read-only, never submits an order.

Call this whenever an agent needs a single, backtested trading verdict for a crypto perpetual-futures asset instead of computing dozens of raw indicators itself. One MCP call returns direction, confidence, market regime, and the cross-venue factors behind it.

## Pairing with Binance Agent OS

Binance Agent OS gives an agent execution on Binance: OAuth at connect time, no API keys on the
machine, and trading confined to an isolated Agentic sub-account. It has no withdrawal scope.

What it does not have is a second venue. A cross-venue funding spread needs two, and a composite
verdict needs more. That is the layer this skill supplies — the decision layer for an agent that
is already executing through Binance Agent OS.

Add both servers to one MCP client:

```bash
claude mcp add binance-mcp-server --transport http https://agent.binance.com/mcp/agentic

claude mcp add --transport http --scope project algovault \
  https://api.algovault.com/mcp?src=binance_agent_os
```

Then name the tool you want. With two servers connected an exchange-shaped prompt is ambiguous,
and this skill exposes no exchange-operation tools, so nothing about that phrasing points at the
verdict:

> "Use AlgoVault's `get_trade_call` for BTC 15m on Binance. Show me signal, confidence and
> regime. If signal is BUY and confidence is above 70, place a $100 market buy on Binance spot —
> confirm with me before sending."

Full walkthrough: https://algovault.com/integrations/binance-agent-os

## When to call

- **Pre-trade analytics gate** — read the verdict, apply your own policy, then (optionally) execute via Binance Skills Hub.
- **Regime check** before switching strategy (trend vs range vs volatile).
- **Cross-venue funding-spread awareness** before routing a carry / arb leg.

AlgoVault is read-only signal *interpretation* — it never submits orders and never recommends buying or selling any specific asset.

## Tools

Live at MCP endpoint `https://api.algovault.com/mcp` (streamable HTTP, stateless). Add the server to your agent, then call the tools below. Send header `X-AlgoVault-Skill-Slug: signal-intelligence` on each call for attribution.

### `get_trade_call` — composite verdict for one perp

Params: `coin` (required, e.g. `BTC`), `timeframe` (`1m`…`1d`, default `15m`), `exchange` (`BINANCE` default, plus `BYBIT` `OKX` `BITGET` `HL` and more), `includeReasoning` (default `true`).

```
get_trade_call(coin="BTC", timeframe="1h", exchange="BINANCE")
```

Returns (abridged — real fields):

```json
{
  "call": "BUY",
  "confidence": 72,
  "regime": "TRENDING_UP",
  "price": 64250.5,
  "indicators": {
    "funding_rate": 0.0001,
    "funding_state": "neutral",
    "oi_change_pct": 2.4,
    "trend_persistence": "strong",
    "volume_24h": 1200000000
  },
  "reasoning": "trend + funding aligned long",
  "_receipts": {
    "verdict": "BUY",
    "conviction_pct": 72,
    "track_record": { "pfe_win_rate": 0.91, "n": 12000, "as_of": "..." },
    "verification_uri": "https://algovault.com/track-record",
    "disclaimer": "Informational only; not investment advice."
  }
}
```

`call` is the verdict (`BUY`/`SELL`/`HOLD`); `_receipts` carries the live, on-chain-verified PFE win rate and a verification link with every response.

### `get_market_regime` — regime classifier for one perp

Params: `coin` (required), `timeframe` (`1h`|`4h`|`1d`, default `4h`), `exchange` (default `HL`). Returns the regime (`TRENDING_UP`/`TRENDING_DOWN`/`RANGING`/`VOLATILE`) + confidence + a strategy hint, blending trend/range strength with cross-venue funding sentiment.

### `scan_funding_arb` — ranked cross-venue funding spreads

Params: `minSpreadBps` (default `5`), `limit` (default `10`). Returns a ranked list of funding-rate arbitrage opportunities across major perp venues (long one venue / short another) as a `BUY`/`SELL`/`HOLD` verdict per pair — the cross-venue view no single-exchange API exposes.

Also available: `scan_trade_calls` (whole-market top-by-open-interest scan) and `search_knowledge` / `chat_knowledge` (look up integration patterns before wiring in).

## Testnet-safe example (Binance Spot Testnet — zero real-money risk)

Confidence-filtered swing entry. Analytics come from AlgoVault; execution is left to the agent's policy and runs against **testnet only**, hard-guarded so it can never reach mainnet (full source: https://github.com/AlgoVaultLabs/algovault-skills/blob/main/examples/binance/demo.mjs):

```javascript
// BINANCE_TESTNET=true node demo.mjs
const MAINNET_BLOCKED = true;
const TESTNET = 'https://testnet.binance.vision/api';
if (process.env.BINANCE_TESTNET !== 'true') {
  throw new Error('BINANCE_TESTNET=true required — refuses to run against mainnet.');
}
// 1. AlgoVault verdict (read-only analytics via MCP get_trade_call)
const v = await getTradeCall({ coin: 'ETH', timeframe: '1h' });
// 2. Agent policy lives in YOUR code
const fires = v.call === 'BUY' && v.confidence > 70;
// 3. If policy fires + testnet keys set, VALIDATE (never submit) a small order
if (fires && process.env.BINANCE_TESTNET_API_KEY) {
  // HMAC-signed POST /api/v3/order/test — validates only, returns {} on success
  // order size capped at 0.001 ETH
}
console.log('=== NO REAL ORDERS PLACED ===');
```

The script aborts unless `BINANCE_TESTNET=true`; `/api/v3/order/test` validates without submitting; the requested size is capped.

## Track record & links (live)

91.7% PFE Win Rate across 512,000+ calls, each Merkle-anchored on Base L2 (100 batches). PFE Win Rate = peak-favorable-excursion directional accuracy, evaluated against public exchange prices. Current figures and the free tier are live at:

- Track record: https://algovault.com/track-record
- Docs: https://algovault.com/docs.html
- Pricing / free tier: https://algovault.com/#pricing

## Disclaimer

Informational only. AlgoVault outputs are read-only signal interpretation — not investment, financial, or trading advice, and not a recommendation to buy, sell, or hold any asset. No outcome is guaranteed; past performance does not predict future results. You are solely responsible for your own trading decisions. This is consistent with the Binance Skills Hub disclaimer.

Built by AlgoVault Labs — https://algovault.com · MIT licensed.
