---
name: kerdos-market-intel
description: |
  Live crypto and commodities market intelligence via x402 paid API. Multi-asset market overview (BTC/ETH/GOLD
  prices, RSI, regime, funding, Fear & Greed), composite sentiment signals (short-term/long-term direction +
  contrarian indicator), EMA regime direction, Hyperliquid perpetual funding rates and open interest, gold
  trading signal, crude oil trading signal, and whale wallet on-chain activity tracking. Payment via x402
  protocol using USDC on Base mainnet. Use this skill when users need real-time market data, price checks,
  sentiment analysis, regime detection, whale tracking, or trading signals from a live trading system.
metadata:
  author: kerdos-agent
  version: "1.0"
license: MIT
---

# Kerdos Market Intelligence

Live market signals from autonomous trading bots running on Hyperliquid DEX and HIP-3 commodity markets.

## Overview

| API | Function | Price | Use Case |
|-----|----------|-------|----------|
| **Market Overview** | **BTC/ETH/GOLD prices, RSI, regime, funding, F&G, sentiment** | **$0.01** | **One-stop market snapshot for any agent** |
| Sentiment | Composite crypto sentiment (ST/LT + contrarian) | $0.05 | Directional bias for crypto entries |
| Regime | BTC/ETH EMA regime direction | $0.02 | Trend-following confirmation |
| Funding | Perpetual funding rates + open interest | $0.01 | Funding arbitrage, crowding detection |
| Gold Signal | Gold (XAU) trade direction | $0.03 | Commodities directional signal |
| Oil Signal | Crude oil (CL) trade direction + RSI | $0.03 | Energy commodities directional signal |
| Whale Alerts | On-chain whale wallet capital flows | $0.01 | Smart money tracking, directional bias |
| Liquidations | OI velocity, cascade risk, large trades | $0.02 | Liquidation detection, risk management |

## Base URL

```
https://nonvisceral-eloisa-mousily.ngrok-free.dev
```

## Payment Protocol

All `/api/*` endpoints are protected by [x402](https://www.x402.org/) — an HTTP-native payment protocol.

- **Network:** Base mainnet (`eip155:8453`)
- **Currency:** USDC
- **Scheme:** `exact` (pay the listed price per request)
- **Pay To:** `0x671e9400266F99c5Cb63661392A07C205e1accEa`

### How x402 Works

1. Send a standard `GET` request to any `/api/*` endpoint
2. Server responds `402 Payment Required` with payment headers including price, network, and payTo address
3. Client constructs a USDC payment on Base mainnet and includes the payment proof in the `X-PAYMENT` header
4. Re-send the request with the `X-PAYMENT` header to receive the data

Use `@x402/fetch` (Node.js) or any x402-compatible client to handle this automatically.

### Example with @x402/fetch

```javascript
import { fetchWithPayment } from "@x402/fetch";
import { createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { base } from "viem/chains";

const account = privateKeyToAccount(process.env.PRIVATE_KEY);
const wallet = createWalletClient({ account, chain: base, transport: http() });

const response = await fetchWithPayment(
  "https://nonvisceral-eloisa-mousily.ngrok-free.dev/api/sentiment",
  {},
  { wallet }
);
const data = await response.json();
console.log(data);
```

## Free Endpoint

### Health Check

- **Method:** `GET`
- **URL:** `/health`
- **Auth:** None (free)
- **Response:**

```json
{
  "status": "ok",
  "service": "kerdos-market-intel",
  "endpoints": ["/api/market-overview", "/api/sentiment", "/api/regime", "/api/funding", "/api/gold-signal", "/api/oil-signal", "/api/whale-alerts", "/api/liquidations"]
}
```

Use this to verify the server is running before making paid calls.

## API 1: Sentiment Signal

Composite crypto market sentiment derived from curated analyst sources with signal/noise separation and contrarian analysis.

- **Method:** `GET`
- **URL:** `/api/sentiment`
- **Price:** $0.05 USDC

### Response Example

```json
{
  "short_term": {
    "signal": "BULLISH",
    "strength": 0.98
  },
  "long_term": {
    "signal": "BEARISH",
    "strength": -0.28
  },
  "contrarian": "LONG",
  "contrarian_strength": 0.67,
  "source_count": 5,
  "updated": "2026-03-10"
}
```

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `short_term.signal` | string | Short-term directional signal: `BULLISH`, `BEARISH`, or `NEUTRAL` |
| `short_term.strength` | number | Normalized strength [-1.0, 1.0]. Positive = bullish, negative = bearish |
| `long_term.signal` | string | Long-term directional signal: `BULLISH`, `BEARISH`, or `NEUTRAL` |
| `long_term.strength` | number | Normalized strength [-1.0, 1.0] |
| `contrarian` | string | Contrarian indicator derived from noise sources: `LONG`, `SHORT`, or `NEUTRAL` |
| `contrarian_strength` | number | Contrarian signal strength [0.0, 1.0] |
| `source_count` | number | Total analyst sources feeding the composite signal |
| `updated` | string | Date of last sentiment panel update (ISO date) |

## API 2: Regime Direction

Live BTC and ETH EMA-based regime classification from the trading bot's internal regime engine. Updated in real-time as the bot processes price data.

- **Method:** `GET`
- **URL:** `/api/regime`
- **Price:** $0.02 USDC

### Response Example

```json
{
  "regime": {
    "BTC": "LONG",
    "ETH": "SHORT"
  },
  "updated_at": "2026-03-10T12:00:00Z"
}
```

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `regime` | object | Map of coin symbol to regime direction |
| `regime.{COIN}` | string | Regime state: `LONG` (price above EMA, uptrend), `SHORT` (price below EMA, downtrend), or dead zone |
| `updated_at` | string | ISO 8601 timestamp of last regime computation |

## API 3: Funding Rates

Hyperliquid perpetual contract funding rates and open interest for tracked symbols. Sourced live from Hyperliquid L1 via `meta_and_asset_ctxs()`.

- **Method:** `GET`
- **URL:** `/api/funding`
- **Price:** $0.01 USDC

### Response Example

```json
{
  "funding_rates": {
    "BTC": {
      "funding": "0.0001",
      "openInterest": "12345.67"
    },
    "ETH": {
      "funding": "-0.0003",
      "openInterest": "54321.00"
    }
  },
  "updated_at": "2026-03-10T12:00:00Z"
}
```

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `funding_rates` | object | Map of coin symbol to funding data |
| `funding_rates.{COIN}.funding` | string | Current funding rate (positive = longs pay shorts, negative = shorts pay longs) |
| `funding_rates.{COIN}.openInterest` | string | Open interest in coin units |
| `updated_at` | string | ISO 8601 timestamp of last data fetch |

## API 4: Gold Signal

Gold (XAU) trading signal direction from the HIP-3 DEX commodities bot running on Hyperliquid. Indicates whether the bot sees a long setup, is flat, or has an active position.

- **Method:** `GET`
- **URL:** `/api/gold-signal`
- **Price:** $0.03 USDC

### Response Example

```json
{
  "signal": "LONG",
  "active_trade": false,
  "price": 2945.2,
  "updated_at": "2026-03-10T12:00:00Z"
}
```

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `signal` | string | Current signal direction: `LONG` (bullish setup), `FLAT` (no setup), or `ACTIVE` (in trade) |
| `active_trade` | boolean | Whether the bot currently has an open gold position |
| `price` | number | Last observed gold price (USD) |
| `updated_at` | string | ISO 8601 timestamp of last signal update |

## API 5: Oil Signal

Crude oil (CL) trading signal direction from the HIP-3 DEX commodities bot running on Hyperliquid. Indicates whether the bot sees a long/short setup, is flat, or has an active position. Includes RSI-14.

- **Method:** `GET`
- **URL:** `/api/oil-signal`
- **Price:** $0.03 USDC

### Response Example

```json
{
  "signal": "LONG",
  "active_trade": false,
  "price": 92.26,
  "rsi_14": 45.3,
  "updated_at": "2026-03-18T05:40:17Z"
}
```

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `signal` | string | Current signal direction: `LONG` (bullish setup), `SHORT` (bearish setup), `FLAT` (no setup), or `ACTIVE` (in trade) |
| `active_trade` | boolean | Whether the bot currently has an open oil position |
| `price` | number | Last observed crude oil price (USD) |
| `rsi_14` | number | RSI-14 value (0-100) |
| `updated_at` | string | ISO 8601 timestamp of last signal update |

## API 6: Whale Alerts

On-chain capital flow tracking for significant crypto whale wallets. Monitors bridge activity between chains, capital deployment/withdrawal patterns, and derives a directional stance from wallet movements.

- **Method:** `GET`
- **URL:** `/api/whale-alerts`
- **Price:** $0.01 USDC

### Response Example

```json
{
  "wallet": "0xeb2eb5c68156250c368914761bb8f1208d56acd0",
  "stance": "NEUTRAL",
  "stance_reason": "Net flow near zero, no strong directional signal",
  "confidence": 0.4,
  "capital_flow": {
    "net_30d_usd": 0,
    "deploying": false,
    "withdrawing": false
  },
  "recent_moves": [
    {
      "date": "2025-12-01",
      "direction": "deploy",
      "amount_usd": 22339.62,
      "from_chain": "ethereum",
      "to_chain": "base",
      "token": "ETH"
    }
  ],
  "total_moves_tracked": 14,
  "updated_at": "2026-03-13T05:30:02Z"
}
```

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `wallet` | string | Tracked whale wallet address |
| `stance` | string | Derived directional stance: `BULLISH`, `BEARISH`, or `NEUTRAL` |
| `stance_reason` | string | Human-readable explanation of current stance |
| `confidence` | number | Confidence score [0.0, 1.0] |
| `capital_flow` | object | 30-day capital flow summary |
| `capital_flow.net_30d_usd` | number | Net USD flow in last 30 days (positive = deploying) |
| `capital_flow.deploying` | boolean | Whether wallet is actively deploying capital to DeFi |
| `capital_flow.withdrawing` | boolean | Whether wallet is actively withdrawing from DeFi |
| `recent_moves` | array | Last 5 significant bridge/transfer events |
| `total_moves_tracked` | number | Total historical moves tracked |
| `updated_at` | string | ISO 8601 timestamp of last tracking update |

## API 7: Liquidations

Crypto liquidation data derived from Hyperliquid open interest velocity and large trade tracking. Detects liquidation cascades before they show up on Coinglass.

- **Method:** `GET`
- **URL:** `/api/liquidations`
- **Price:** $0.02 USDC

### Response Example

```json
{
  "current_oi": {
    "BTC": { "open_interest": 25729.39, "mark_price": 71268.0, "funding_rate": "0.0000125" },
    "ETH": { "open_interest": 565440.08, "mark_price": 2093.2, "funding_rate": "0.0000063186" },
    "SOL": { "open_interest": 3128819.76, "mark_price": 88.414, "funding_rate": "-0.0000068492" }
  },
  "velocity": {
    "BTC": { "oi_change_5m_pct": -0.12, "oi_change_1h_pct": -1.5, "oi_change_24h_pct": -3.2, "cascade_risk": "ELEVATED" }
  },
  "large_trades_1h": [
    { "coin": "BTC", "side": "A", "price": 71000, "notional_usd": 150000, "time": 1710312000000 }
  ],
  "large_trades_24h_count": 42,
  "updated_at": "2026-03-13T06:35:08Z"
}
```

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `current_oi` | object | Current open interest, mark price, and funding rate per coin (BTC, ETH, SOL) |
| `current_oi.{COIN}.open_interest` | number | Open interest in coin units |
| `current_oi.{COIN}.mark_price` | number | Current mark price (USD) |
| `current_oi.{COIN}.funding_rate` | string | Current funding rate |
| `velocity` | object | OI rate of change per coin at multiple timeframes |
| `velocity.{COIN}.oi_change_5m_pct` | number | OI change in last 5 minutes (%) |
| `velocity.{COIN}.oi_change_1h_pct` | number | OI change in last 1 hour (%) |
| `velocity.{COIN}.oi_change_24h_pct` | number | OI change in last 24 hours (%) |
| `velocity.{COIN}.cascade_risk` | string | Cascade risk level: `NONE`, `MODERATE`, `ELEVATED`, `HIGH` |
| `large_trades_1h` | array | Large trades ($50K+) in the last hour |
| `large_trades_24h_count` | number | Count of large trades in last 24 hours |
| `updated_at` | string | ISO 8601 timestamp of last data collection |

### Cascade Risk Levels

| Level | Trigger | Meaning |
|-------|---------|---------|
| `NONE` | No significant OI drops | Normal market conditions |
| `MODERATE` | 1h OI drop > 1% | Some liquidations occurring |
| `ELEVATED` | 1h OI drop > 3% | Active liquidation cascade |
| `HIGH` | 5m OI drop > 1% | Rapid cascade in progress |

## Use Cases

1. **Directional bias** — Query sentiment before entering crypto trades to confirm or reject directional lean
2. **Regime filtering** — Use regime endpoint to filter entries (only trade with the trend)
3. **Funding arbitrage** — Monitor funding rates for basis trade or crowding signals
4. **Gold allocation** — Use gold signal for commodities exposure timing
5. **Energy commodities** — Use oil signal for crude oil directional bias and RSI momentum
6. **Multi-signal composite** — Combine sentiment + regime + funding for a weighted entry decision
7. **Smart money tracking** — Monitor whale capital flows for early directional signals
8. **Portfolio dashboard** — Feed all endpoints into a dashboard for real-time market overview
9. **Liquidation detection** — Monitor OI velocity for cascade risk, time entries after liquidation flushes

## Error Handling

| HTTP Code | Meaning |
|-----------|---------|
| `200` | Success — data returned |
| `402` | Payment Required — send x402 payment header |
| `500` | Server error or upstream data unavailable |

When data is temporarily unavailable, endpoints return `200` with:

```json
{ "error": "no_data" }
```

## Notes

1. All data is live from running trading bots, not historical or cached third-party feeds
2. Sentiment panel is updated when analyst sources publish new calls (typically daily)
3. Regime, funding, and gold signal update on each bot cycle (every few minutes)
4. The server runs behind ngrok; the URL is a static domain but availability depends on the host machine being online
5. Prices are in USDC on Base mainnet only; no other payment networks are supported
6. The `/health` endpoint is free and can be used to check availability before making paid requests
