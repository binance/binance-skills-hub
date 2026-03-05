---
title: BSC Protocol Revenue Intelligence
description: |
  Real-time BNB Chain DeFi protocol fee and revenue analytics across 237+ protocols.
  Tracks protocol fees, revenue, methodology breakdown, and trend analysis.
  Shows which protocols generate the most revenue, fee structures, and revenue sustainability.
  Use this skill when users ask about BSC protocol revenue, DeFi fees, which protocols make money,
  fee comparison, protocol sustainability, or revenue trends on BNB Chain.
metadata:
  version: "1.0"
  author: mefai-dev
license: MIT
---

# BSC Protocol Revenue Intelligence Skill

## Overview

Provides comprehensive fee and revenue analytics for 237+ protocols on BNB Chain. Tracks how much each protocol earns from users, where that revenue goes (protocol treasury vs LPs vs token holders), and how revenue trends over time.

| Feature | Details |
|---------|---------|
| Data Source | DefiLlama Fees/Revenue API |
| Chain | BNB Chain (BSC) |
| Protocols Covered | 237+ (DEXes, lending, yield, bridges, etc.) |
| Update Frequency | Hourly |
| Historical Data | Daily fees since protocol inception |
| Methodology | Open-source adapters with transparent fee calculations |

## Use Cases

1. Rank BSC protocols by revenue to identify the most financially sustainable DeFi projects
2. Compare fee structures across competing DEXes (PancakeSwap vs BiSwap vs DODO)
3. Track revenue trends to detect protocols gaining or losing traction
4. Analyze fee methodology — what percentage goes to LPs vs protocol treasury vs token holders
5. Identify high-revenue protocols as potential investment targets (revenue = real value)
6. Monitor daily revenue timeseries for anomalies or trend changes
7. Calculate revenue multiples (market cap / annualized revenue) for valuation
8. Detect emerging protocols with rapid revenue growth before they become mainstream

## API 1: BSC Protocol Fees & Revenue Overview

### Method: GET

**URL:**
```
https://api.llama.fi/overview/fees/BSC
```

**Headers:**
```
Accept: application/json
```

**Request Parameters:**

No parameters required. The chain is specified in the URL path.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| (none) | — | — | Chain is specified as path segment `/BSC` |

**Example Request:**
```bash
curl -s "https://api.llama.fi/overview/fees/BSC"
```

**Response Example:**
```json
{
  "totalDataChart": [
    [1604102400, 42839],
    [1772582400, 1148747]
  ],
  "totalDataChartBreakdown": [
    [1772582400, {
      "PancakeSwap AMM": 89917,
      "Venus": 156432,
      "Alpaca Finance": 12847,
      "DODO": 8293,
      "Thena V1": 4521,
      "Biswap V2": 3892,
      "Radiant": 15284
    }]
  ],
  "chain": "BSC",
  "allChains": ["BSC"],
  "total24h": 1148747,
  "total48hto24h": 1284932,
  "total7d": 8432910,
  "total14dto7d": 10284732,
  "total30d": 34829104,
  "total60dto30d": 42847291,
  "total1y": 487293102,
  "totalAllTime": 2847291034,
  "change_1d": -10.59,
  "change_7d": -18.01,
  "change_1m": -18.72,
  "change_7dover7d": -14.23,
  "change_30dover30d": 8.47,
  "total7DaysAgo": 1401203,
  "total30DaysAgo": 1413284,
  "protocols": [
    {
      "defillamaId": "194",
      "name": "PancakeSwap AMM",
      "displayName": "PancakeSwap AMM",
      "module": "pancakeswap-v2",
      "category": "Dexs",
      "logo": "https://icons.llamao.fi/icons/protocols/pancakeswap-amm.jpg",
      "chains": ["BSC", "Ethereum", "Arbitrum", "Base", "opBNB", "Aptos"],
      "protocolType": "protocol",
      "methodology": {
        "UserFees": "User pays 0.25% fees on each swap.",
        "Fees": "All fees comes from the user.",
        "Revenue": "All revenue generated comes from user fees.",
        "ProtocolRevenue": "Treasury receives 0.0225% of each swap.",
        "HoldersRevenue": "Stakers receive 0.0575% of each swap in CAKE.",
        "SupplySideRevenue": "Liquidity providers receive 0.17% of each swap."
      },
      "methodologyURL": "https://github.com/DefiLlama/dimension-adapters/blob/master/dexs/pancakeswap-v2.ts",
      "total24h": 89917,
      "total48hto24h": 91370,
      "total7d": 501132,
      "total30d": 2440045,
      "total1y": 57578370,
      "totalAllTime": 1513510016,
      "change_1d": -1.59,
      "change_7d": 29.8,
      "change_1m": 83.59,
      "change_7dover7d": -34.06,
      "change_30dover30d": 25.53,
      "average1y": 157748.96,
      "monthlyAverage1y": 4801878.31
    }
  ]
}
```

**Response Fields — Summary Level:**

| Field | Type | Description |
|-------|------|-------------|
| chain | string | Chain identifier: `"BSC"` |
| total24h | number | Total fees generated across all BSC protocols in last 24h (USD) |
| total48hto24h | number | Total fees in the previous 24h period (USD) |
| total7d | number | Total fees in last 7 days (USD) |
| total14dto7d | number | Fees in 7-14 days ago period (USD) |
| total30d | number | Total fees in last 30 days (USD) |
| total60dto30d | number | Fees in 30-60 days ago period (USD) |
| total1y | number | Total fees in last 365 days (USD) |
| totalAllTime | number | All-time cumulative fees (USD) |
| change_1d | number | 24h fee change percentage vs previous 24h |
| change_7d | number | 7d fee change percentage |
| change_1m | number | 30d fee change percentage |
| change_7dover7d | number | Week-over-week change percentage |
| change_30dover30d | number | Month-over-month change percentage |

**Response Fields — totalDataChart:**

| Field | Type | Description |
|-------|------|-------------|
| totalDataChart | array | Daily total fees timeseries |
| totalDataChart[n][0] | integer | Unix timestamp (start of day, UTC) |
| totalDataChart[n][1] | number | Total fees on that day across all protocols (USD) |

**Response Fields — totalDataChartBreakdown:**

| Field | Type | Description |
|-------|------|-------------|
| totalDataChartBreakdown | array | Daily fee breakdown by protocol |
| totalDataChartBreakdown[n][0] | integer | Unix timestamp |
| totalDataChartBreakdown[n][1] | object | Map of protocol display name → daily fees (USD) |

**Response Fields — Per Protocol:**

| Field | Type | Description |
|-------|------|-------------|
| defillamaId | string | Unique protocol identifier |
| name | string | Internal protocol name |
| displayName | string | Human-readable name |
| module | string | DefiLlama adapter module name |
| category | string | Protocol category: `"Dexs"`, `"Lending"`, `"Yield"`, `"Bridge"`, etc. |
| logo | string | Protocol icon URL (full HTTPS URL) |
| chains | array | All chains this protocol operates on |
| protocolType | string | `"protocol"` or `"chain"` |
| total24h | number | Protocol 24h fees on BSC (USD) |
| total48hto24h | number | Previous 24h fees (USD) |
| total7d | number | 7d fees on BSC (USD) |
| total30d | number | 30d fees on BSC (USD) |
| total1y | number | 365d fees on BSC (USD) |
| totalAllTime | number | All-time cumulative fees (USD) |
| change_1d | number | 24h fee change percentage |
| change_7d | number | 7d fee change percentage |
| change_1m | number | 30d fee change percentage |
| change_7dover7d | number | Week-over-week change percentage |
| change_30dover30d | number | Month-over-month change percentage |
| average1y | number | Average daily fees over past year (USD) |
| monthlyAverage1y | number | Average monthly fees over past year (USD) |

**Response Fields — Fee Methodology (unique to this endpoint):**

| Field | Type | Description |
|-------|------|-------------|
| methodology | object | Breakdown of fee distribution |
| methodology.UserFees | string | What users pay (e.g., "0.25% per swap") |
| methodology.Fees | string | Source of all fees |
| methodology.Revenue | string | How revenue is generated |
| methodology.ProtocolRevenue | string | What portion goes to protocol treasury |
| methodology.HoldersRevenue | string | What portion goes to token stakers/holders |
| methodology.SupplySideRevenue | string | What portion goes to liquidity providers |
| methodologyURL | string | Link to open-source fee calculation adapter |

## Notes

1. All fee/revenue values are in USD
2. Timestamps are Unix epoch in seconds (not milliseconds)
3. The `methodology` field is uniquely valuable — it provides a transparent breakdown of exactly how fees are distributed between users, LPs, protocol treasury, and token holders. Not all protocols include this field.
4. The `methodologyURL` links to the open-source DefiLlama adapter that calculates fees, providing full transparency and auditability
5. Protocol categories include: `Dexs`, `Lending`, `Yield`, `Bridge`, `Liquid Staking`, `CDP`, `Derivatives`, `NFT Marketplace`, `Options`, and more
6. To calculate annualized revenue: `total24h * 365` or use `average1y * 365` for a smoothed estimate
7. Revenue vs Fees distinction: "Fees" = total value extracted from users; "Revenue" = portion kept by the protocol (not paid to LPs)
8. The `protocols` array includes 237+ protocols but is not sorted — sort by `total24h` descending for revenue ranking
9. Some protocols may have `null` values for certain time periods if they are too new or have incomplete data
10. Rate limiting: DefiLlama free tier allows approximately 500 requests per 5 minutes
