---
title: Tax Report Assistant
description: Generate tax reports from Binance trade history using account snapshots and trade list SAPI endpoints with FIFO/LIFO/average cost basis methods.
metadata:
  version: "1.0.0"
  author: mefai-dev
license: MIT
---

# Tax Report Assistant

Generate comprehensive tax reports from Binance trading history. Aggregate trade data, calculate realized gains/losses using multiple cost basis methods (FIFO, LIFO, Average), and export reports for tax filing.

## Quick Reference

| Endpoint | Description | Authentication |
|----------|-------------|----------------|
| `GET /sapi/v1/accountSnapshot` | Daily account snapshots | Yes (HMAC) |
| `GET /api/v3/myTrades` | Account trade list | Yes (HMAC) |
| `GET /api/v3/allOrders` | All historical orders | Yes (HMAC) |

## API Details

### Account Snapshot

Retrieve daily portfolio snapshots for historical balance tracking.

**Method:** `GET`

**URL:** `https://api.binance.com/sapi/v1/accountSnapshot`

**Authentication:** HMAC-SHA256 signed

**Query Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| type | string | Yes | — | Account type: SPOT, MARGIN, FUTURES |
| startTime | integer | No | — | Start timestamp (ms) |
| endTime | integer | No | — | End timestamp (ms) |
| limit | integer | No | 5 | Number of snapshots (max 30) |
| timestamp | integer | Yes | — | Current timestamp (ms) |
| signature | string | Yes | — | HMAC-SHA256 signature |

**Example Request:**

```bash
TIMESTAMP=$(date +%s000)
QUERY="type=SPOT&limit=30&timestamp=$TIMESTAMP"
SIGNATURE=$(echo -n "$QUERY" | openssl dgst -sha256 -hmac "$API_SECRET" | cut -d' ' -f2)

curl "https://api.binance.com/sapi/v1/accountSnapshot?${QUERY}&signature=${SIGNATURE}" \
  -H "X-MBX-APIKEY: $API_KEY"
```

**Response Fields:**

| Field | Type | Description |
|-------|------|-------------|
| snapshotVos | array | List of snapshots |
| snapshotVos[].updateTime | integer | Snapshot timestamp (ms) |
| snapshotVos[].data.totalAssetOfBtc | string | Total portfolio value in BTC |
| snapshotVos[].data.balances | array | Asset balances |
| snapshotVos[].data.balances[].asset | string | Asset code |
| snapshotVos[].data.balances[].free | string | Available balance |
| snapshotVos[].data.balances[].locked | string | Locked balance |

### Trade History

Retrieve complete trade history for P&L calculation.

**Method:** `GET`

**URL:** `https://api.binance.com/api/v3/myTrades`

**Authentication:** HMAC-SHA256 signed

**Query Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| symbol | string | Yes | — | Trading pair (e.g., BTCUSDT) |
| startTime | integer | No | — | Start timestamp (ms) |
| endTime | integer | No | — | End timestamp (ms) |
| fromId | integer | No | — | Trade ID to fetch from |
| limit | integer | No | 500 | Number of trades (max 1000) |
| timestamp | integer | Yes | — | Current timestamp |
| signature | string | Yes | — | HMAC-SHA256 signature |

**Response Fields:**

| Field | Type | Description |
|-------|------|-------------|
| symbol | string | Trading pair |
| id | integer | Trade ID |
| orderId | integer | Order ID |
| price | string | Trade price |
| qty | string | Trade quantity |
| quoteQty | string | Quote quantity (price * qty) |
| commission | string | Trading fee amount |
| commissionAsset | string | Fee asset code |
| time | integer | Trade timestamp (ms) |
| isBuyer | boolean | True if buyer side |
| isMaker | boolean | True if maker side |

### Cost Basis Methods

**FIFO (First In, First Out):**
```
Sell oldest purchased units first.
Gain = Sell Price - Purchase Price of oldest lot
```

**LIFO (Last In, First Out):**
```
Sell most recently purchased units first.
Gain = Sell Price - Purchase Price of newest lot
```

**Average Cost:**
```
Average Price = Total Cost of Holdings / Total Quantity
Gain = Sell Price - Average Price
```

## Use Cases

1. **Annual Tax Report** — Generate yearly realized P&L summary per asset
2. **Cost Basis Tracking** — Track purchase costs across multiple buy transactions
3. **Trade Export** — Export trade history in CSV/JSON for tax software
4. **Commission Summary** — Aggregate trading fees for tax deduction
5. **Portfolio History** — Review daily portfolio snapshots over time

## Notes

- All endpoints require **HMAC-SHA256 signed authentication**
- API key needs "Read" permissions for Spot trading data
- `myTrades` returns max 1000 trades per request — use `fromId` for pagination
- Account snapshots are generated daily; `limit` max is 30 (one month)
- Trade timestamps are in milliseconds
- Commission amounts should be tracked separately for fee deductions
- Consider all trading pairs — loop through active symbols
- For futures trades, use `GET /fapi/v1/userTrades` with the same auth pattern
- Export formats should include: Date, Pair, Side, Price, Quantity, Fee, Total
