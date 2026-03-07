---
title: BSC DEX Volume Analytics
description: |
  Real-time BNB Chain DEX trading volume analytics across 129+ decentralized exchanges.
  Tracks per-protocol 24h/7d/30d volumes, market share breakdown, daily volume timeseries,
  and trend analysis with change percentages.
  Use this skill when users ask about BSC DEX volume, PancakeSwap volume, DEX market share,
  trading activity on BNB Chain, which DEX has the most volume, or DEX volume trends.
metadata:
  version: "1.0"
  author: mefai-dev
license: MIT
---

# BSC DEX Volume Analytics Skill

## Overview

Provides comprehensive DEX trading volume analytics for BNB Chain, covering 129+ decentralized exchanges with real-time volume data, market share breakdown, and historical trends.

| Feature | Details |
|---------|---------|
| Data Source | DefiLlama Dimensions API |
| Chain | BNB Chain (BSC) |
| Protocols Covered | 129+ DEXes (PancakeSwap, BiSwap, DODO, Uniswap, etc.) |
| Update Frequency | Hourly |
| Historical Data | Daily volume since October 2020 |

## Use Cases

1. Compare trading volumes across BSC DEXes to find the most active exchanges
2. Track DEX volume trends (24h, 7d, 30d) to identify growth or decline
3. Analyze market share distribution — which DEXes dominate BSC trading
4. Monitor daily volume timeseries for seasonal patterns or event-driven spikes
5. Detect emerging DEXes with rapid volume growth
6. Calculate per-protocol volume breakdown to understand liquidity concentration
7. Compare BSC DEX volume changes across different timeframes

## API 1: BSC DEX Volume Overview

### Method: GET

**URL:**
```
https://api.llama.fi/overview/dexs/BSC
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
curl -s "https://api.llama.fi/overview/dexs/BSC"
```

**Response Example:**
```json
{
  "totalDataChart": [
    [1604102400, 5283924],
    [1604188800, 11503782],
    [1772582400, 1081602105]
  ],
  "totalDataChartBreakdown": [
    [1772582400, {
      "PancakeSwap AMM": 520849412,
      "Biswap V2": 161768,
      "DODO": 7521933,
      "Uniswap V3": 89437221,
      "SushiSwap": 12244,
      "ApeSwap AMM": 77170,
      "BabySwap": 67940,
      "Thena V1": 23901
    }]
  ],
  "breakdown24h": null,
  "chain": "BSC",
  "allChains": ["BSC"],
  "total24h": 1021599745,
  "total48hto24h": 1244473160,
  "total7d": 7364220603,
  "total14dto7d": 9412730521,
  "total60dto30d": 12847392410,
  "total30d": 32415829054,
  "total1y": 458293102847,
  "change_1d": -17.91,
  "change_7d": -20.25,
  "change_1m": -28.46,
  "change_7dover7d": -21.77,
  "change_30dover30d": 15.23,
  "total7DaysAgo": 1281203948,
  "total30DaysAgo": 1419632847,
  "totalAllTime": 2847293102458,
  "protocols": [
    {
      "defillamaId": "194",
      "name": "PancakeSwap AMM",
      "displayName": "PancakeSwap AMM",
      "module": "pancakeswap-v2",
      "category": "Dexs",
      "logo": "https://icons.llamao.fi/icons/protocols/pancakeswap-amm.jpg",
      "chains": ["BSC", "Ethereum", "Arbitrum", "Base"],
      "protocolType": "protocol",
      "total24h": 520849412,
      "total48hto24h": 634291053,
      "total7d": 3842910534,
      "total30d": 16847291053,
      "total1y": 234829310245,
      "totalAllTime": 1513510016000,
      "change_1d": -17.88,
      "change_7d": -22.14,
      "change_1m": -31.02,
      "change_7dover7d": -18.92,
      "change_30dover30d": 12.47,
      "average1y": 643368521,
      "monthlyAverage1y": 19573904187
    }
  ]
}
```

**Response Fields — Summary Level:**

| Field | Type | Description |
|-------|------|-------------|
| chain | string | Chain identifier: `"BSC"` |
| total24h | number | Total DEX volume in last 24 hours (USD) |
| total48hto24h | number | Total volume in the 24h period before last 24h (USD) |
| total7d | number | Total volume in last 7 days (USD) |
| total14dto7d | number | Volume in 7-14 days ago period (USD) |
| total30d | number | Total volume in last 30 days (USD) |
| total60dto30d | number | Volume in 30-60 days ago period (USD) |
| total1y | number | Total volume in last 365 days (USD) |
| totalAllTime | number | All-time cumulative DEX volume (USD) |
| change_1d | number | 24h volume change percentage vs previous 24h |
| change_7d | number | 7d volume change percentage vs previous 7d |
| change_1m | number | 30d volume change percentage vs previous 30d |
| change_7dover7d | number | This week vs week before change percentage |
| change_30dover30d | number | This month vs month before change percentage |
| total7DaysAgo | number | Volume exactly 7 days ago (USD) |
| total30DaysAgo | number | Volume exactly 30 days ago (USD) |

**Response Fields — totalDataChart:**

| Field | Type | Description |
|-------|------|-------------|
| totalDataChart | array | Daily volume timeseries since chain genesis |
| totalDataChart[n][0] | integer | Unix timestamp (start of day, UTC) |
| totalDataChart[n][1] | number | Total DEX volume on that day (USD) |

**Response Fields — totalDataChartBreakdown:**

| Field | Type | Description |
|-------|------|-------------|
| totalDataChartBreakdown | array | Daily volume breakdown by protocol |
| totalDataChartBreakdown[n][0] | integer | Unix timestamp (start of day, UTC) |
| totalDataChartBreakdown[n][1] | object | Map of protocol name → daily volume (USD) |

**Response Fields — Per Protocol:**

| Field | Type | Description |
|-------|------|-------------|
| defillamaId | string | Unique protocol identifier on DefiLlama |
| name | string | Internal protocol name |
| displayName | string | Human-readable protocol name |
| module | string | Adapter module name |
| category | string | Protocol category (always `"Dexs"` for this endpoint) |
| logo | string | Protocol icon URL (full HTTPS URL) |
| chains | array | All chains this protocol operates on |
| protocolType | string | Protocol type: `"protocol"` or `"chain"` |
| total24h | number | Protocol 24h volume on BSC (USD) |
| total48hto24h | number | Protocol volume in previous 24h period (USD) |
| total7d | number | Protocol 7d volume on BSC (USD) |
| total30d | number | Protocol 30d volume on BSC (USD) |
| total1y | number | Protocol 365d volume on BSC (USD) |
| totalAllTime | number | Protocol all-time volume on BSC (USD) |
| change_1d | number | 24h volume change percentage |
| change_7d | number | 7d volume change percentage |
| change_1m | number | 30d volume change percentage |
| change_7dover7d | number | Week-over-week change percentage |
| change_30dover30d | number | Month-over-month change percentage |
| average1y | number | Average daily volume over past year (USD) |
| monthlyAverage1y | number | Average monthly volume over past year (USD) |

## Notes

1. All volume values are in USD
2. Timestamps are Unix epoch in seconds (not milliseconds)
3. The `totalDataChart` array contains daily entries since the chain's first recorded DEX activity (October 2020 for BSC), typically 1,900+ data points
4. The `totalDataChartBreakdown` array has the same timestamps but includes per-protocol volume breakdown as key-value pairs
5. `change_*` fields can be negative (volume decline) or positive (volume growth)
6. Protocol `logo` URLs are complete HTTPS URLs from `icons.llamao.fi` — no prefix needed
7. Not all protocols will have all time-period fields; newer protocols may have `null` for `totalAllTime` or `total1y`
8. The `protocols` array is not sorted — sort by `total24h` descending for volume ranking
9. A protocol's BSC volume is its volume specifically on the BSC chain, even if it operates on multiple chains
10. Rate limiting: DefiLlama free tier allows approximately 500 requests per 5 minutes
