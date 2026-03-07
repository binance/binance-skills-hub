---
title: Trade Journal
description: Automated trade journaling from Binance trade history with win rate, holding period analysis, PnL breakdown, and performance metrics using myTrades API.
metadata:
  version: "1.0.0"
  author: mefai-dev
license: MIT
---

# Trade Journal

Automatically build a trading journal from Binance trade history. Analyze win rate, average holding time, top performing pairs, and PnL breakdown to improve trading performance over time.

## Quick Reference

| Endpoint | Description | Authentication |
|----------|-------------|----------------|
| `GET /api/v3/myTrades` | Account trade list | Yes (HMAC) |
| `GET /api/v3/allOrders` | All historical orders | Yes (HMAC) |
| `GET /api/v3/account` | Account balances | Yes (HMAC) |

## API Details

### Trade List

Retrieve trade history for journal entries and PnL analysis.

**Method:** `GET`

**URL:** `https://api.binance.com/api/v3/myTrades`

**Authentication:** HMAC-SHA256 signed

**Query Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| symbol | string | Yes | — | Trading pair |
| orderId | integer | No | — | Filter by order ID |
| startTime | integer | No | — | Start timestamp (ms) |
| endTime | integer | No | — | End timestamp (ms) |
| fromId | integer | No | — | Trade ID to start from |
| limit | integer | No | 500 | Max trades (max 1000) |
| timestamp | integer | Yes | — | Current timestamp |
| signature | string | Yes | — | HMAC-SHA256 signature |

**Example Request:**

```bash
TIMESTAMP=$(date +%s000)
QUERY="symbol=BTCUSDT&limit=1000&timestamp=$TIMESTAMP"
SIGNATURE=$(echo -n "$QUERY" | openssl dgst -sha256 -hmac "$API_SECRET" | cut -d' ' -f2)

curl "https://api.binance.com/api/v3/myTrades?${QUERY}&signature=${SIGNATURE}" \
  -H "X-MBX-APIKEY: $API_KEY"
```

**Response Fields:**

| Field | Type | Description |
|-------|------|-------------|
| id | integer | Trade ID |
| orderId | integer | Associated order ID |
| symbol | string | Trading pair |
| price | string | Execution price |
| qty | string | Trade quantity |
| quoteQty | string | Quote amount |
| commission | string | Fee amount |
| commissionAsset | string | Fee currency |
| time | integer | Execution timestamp (ms) |
| isBuyer | boolean | Buy side trade |
| isMaker | boolean | Maker trade |

### Performance Metrics

**Win Rate Calculation:**
```
Group trades into round-trips (buy+sell pairs)
Win = sell price > average buy price (after fees)
WinRate = wins / total_round_trips * 100
```

**Average Holding Time:**
```
For each round-trip: holdTime = sellTime - firstBuyTime
AvgHoldTime = sum(holdTimes) / round_trips
```

**PnL Per Trade:**
```
PnL = (sellQty * sellPrice) - (buyQty * buyPrice) - totalCommissions
PnL% = PnL / (buyQty * buyPrice) * 100
```

**Top Pair Analysis:**
```
Group PnL by symbol
Sort by total PnL descending
TopPair = symbol with highest cumulative PnL
```

### All Orders History

Retrieve complete order history including cancelled and filled orders.

**Method:** `GET`

**URL:** `https://api.binance.com/api/v3/allOrders`

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| symbol | string | Yes | Trading pair |
| orderId | integer | No | Start from order ID |
| startTime | integer | No | Start timestamp |
| endTime | integer | No | End timestamp |
| limit | integer | No | Max orders (max 1000) |

## Use Cases

1. **Performance Tracking** — Calculate win rate and average PnL over time
2. **Pair Analysis** — Identify most and least profitable trading pairs
3. **Time Analysis** — Understand optimal holding periods for your strategy
4. **Fee Impact** — Track how commissions affect net profitability
5. **Pattern Recognition** — Identify recurring profitable and losing trade patterns

## Notes

- All endpoints require **HMAC-SHA256 signed authentication**
- API key needs "Read" permissions for Spot trading
- Use `fromId` pagination to fetch complete trade history beyond 1000 trades
- Round-trip matching logic: match buys with subsequent sells by FIFO
- Commission in BNB may need conversion to quote currency for accurate PnL
- For futures journal, use `GET /fapi/v1/userTrades`
- Consider timezone when displaying trade timestamps
- Store journal data locally for faster re-analysis
