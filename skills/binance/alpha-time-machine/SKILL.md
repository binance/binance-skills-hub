---
title: Alpha Time Machine
description: Statistical anomaly detection engine that identifies unusual trading activity before public announcements by comparing current patterns against 30-day baselines to capture information asymmetry.
metadata:
  version: 1.0.0
  author: mefai-dev
license: MIT
---

# Alpha Time Machine

Statistical anomaly detection engine for Binance markets. This skill identifies insider-like trading activity before public announcements by comparing real-time trading patterns against 30-day statistical baselines. It captures information asymmetry through multi-dimensional anomaly scoring across volume, price, order flow, and on-chain transfer patterns.

## Overview

Markets are not perfectly efficient. Information leaks. Before listings, partnerships, protocol upgrades, and regulatory actions, trading patterns deviate from statistical norms. Volume spikes without news. Price creeps upward on no public catalyst. Large transfers flow from connected wallets to exchange deposit addresses.

Alpha Time Machine continuously computes 30-day rolling baselines for every tradeable pair on Binance. It flags any metric that deviates by more than 3 standard deviations from its baseline. When flagged, it traces the initiating activity to identify source wallets and cross-references against a historical database of pre-announcement patterns. A transparent track record system logs every anomaly and its subsequent outcome, building verifiable performance statistics.

## Operational Modes

### Mode 1: Anomaly Scanner

Scans all tradeable Binance pairs for statistically abnormal volume, price, or order flow behavior versus 30-day rolling baselines.

**Request:**

```
POST /alpha-time-machine/anomaly-scanner
```

**Request Body:**

```json
{
  "market": "spot",
  "minSigma": 3.0,
  "anomalyTypes": ["volume", "price", "order_flow"],
  "quoteAsset": "USDT",
  "minDailyVolumeUsd": "100000",
  "limit": 50,
  "page": 1
}
```

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| market | string | No | Market type: `spot`, `futures`, `all` (default: `all`) |
| minSigma | float | No | Minimum standard deviation threshold (default: 3.0) |
| anomalyTypes | array | No | Filter by anomaly type: `volume`, `price`, `order_flow`, `transfer` (default: all types) |
| quoteAsset | string | No | Filter by quote asset: `USDT`, `BTC`, `BNB` (default: all) |
| minDailyVolumeUsd | string | No | Minimum 30-day average daily volume in USD to exclude illiquid pairs |
| limit | integer | No | Results per page (default 50, max 200) |
| page | integer | No | Page number starting from 1 |

**Response Fields:**

| Field | Type | Description |
|-------|------|-------------|
| scanTimestamp | long | Scan execution timestamp (ms) |
| pairsScanned | integer | Total pairs analyzed |
| anomaliesFound | integer | Anomalies meeting threshold |
| anomalies | array | List of detected anomalies |

**Anomaly Object:**

| Field | Type | Description |
|-------|------|-------------|
| symbol | string | Trading pair (e.g., `CAKEUSDT`) |
| market | string | `spot` or `futures` |
| anomalyType | string | `volume`, `price`, `order_flow`, `transfer` |
| currentValue | string | Current metric value |
| baselineMean | string | 30-day rolling mean |
| baselineStdDev | string | 30-day rolling standard deviation |
| sigmaDeviation | string | Number of standard deviations from mean |
| percentAboveBaseline | string | Percentage above/below baseline (%) |
| detectedAt | long | First detection timestamp (ms) |
| duration | long | Anomaly duration in milliseconds |
| publicNewsFound | boolean | Whether any public news was found for this token |
| newsSource | string | News source if found, null otherwise |
| compositeScore | float | Multi-factor anomaly score (0-100) |

**Anomaly Type Details:**

| Type | Metric Measured | Baseline Window | Detection Threshold |
|------|-----------------|-----------------|---------------------|
| `volume` | 1h rolling volume vs 30d hourly mean | 30 days, same hour of day | >3 sigma |
| `price` | 4h price change vs 30d 4h change distribution | 30 days | >3 sigma |
| `order_flow` | Buy/sell ratio vs 30d ratio distribution | 30 days | >3 sigma |
| `transfer` | Exchange inflow/outflow vs 30d baseline | 30 days | >3 sigma |

---

### Mode 2: Pre-Event Pattern Match

Compares current anomaly signatures against historical database of patterns observed before past Binance announcements (listings, delistings, partnerships, upgrades).

**Request:**

```
POST /alpha-time-machine/pattern-match
```

**Request Body:**

```json
{
  "symbol": "CAKEUSDT",
  "market": "spot",
  "patternTypes": ["listing", "partnership", "upgrade", "delisting"],
  "minSimilarity": 0.7,
  "lookbackHours": 72
}
```

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| symbol | string | Yes | Trading pair to analyze |
| market | string | No | Market type: `spot`, `futures` (default: `spot`) |
| patternTypes | array | No | Event types to match: `listing`, `delisting`, `partnership`, `upgrade`, `airdrop`, `burn` (default: all) |
| minSimilarity | float | No | Minimum pattern similarity threshold 0.0-1.0 (default: 0.7) |
| lookbackHours | integer | No | Hours of current data to compare (default: 72, max: 168) |

**Response Fields:**

| Field | Type | Description |
|-------|------|-------------|
| symbol | string | Analyzed trading pair |
| currentSignature | object | Current trading pattern signature |
| matches | array | Historical pattern matches |
| bestMatchScore | float | Highest similarity score found |

**Current Signature Object:**

| Field | Type | Description |
|-------|------|-------------|
| volumeProfile | array | Hourly volume pattern (normalized) |
| priceProfile | array | Hourly price change pattern |
| orderFlowProfile | array | Hourly buy/sell ratio pattern |
| transferProfile | array | Hourly exchange transfer pattern |

**Pattern Match Entry:**

| Field | Type | Description |
|-------|------|-------------|
| matchId | string | Historical event identifier |
| eventType | string | Event type that followed the pattern |
| eventDescription | string | Description of the historical event |
| eventDate | long | When the event was publicly announced (ms) |
| similarity | float | Pattern similarity score (0.0-1.0) |
| leadTime | long | Time between pattern start and announcement (ms) |
| priceChangePreEvent | string | Price change during pattern period before announcement (%) |
| priceChangePostEvent | string | Price change 24h after announcement (%) |
| volumeMultiplier | string | Volume increase multiple vs baseline |
| matchedDimensions | array | Which dimensions matched: `volume`, `price`, `order_flow`, `transfer` |

**Historical Event Categories:**

| Category | Database Size | Avg Lead Time | Avg Pattern Similarity |
|----------|--------------|---------------|----------------------|
| Binance Listing | 850+ events | 24-72 hours | 0.72 |
| Binance Delisting | 200+ events | 12-48 hours | 0.68 |
| Partnership Announcement | 500+ events | 12-36 hours | 0.65 |
| Protocol Upgrade | 400+ events | 24-96 hours | 0.71 |
| Token Burn | 300+ events | 6-24 hours | 0.74 |
| Airdrop Announcement | 250+ events | 12-48 hours | 0.69 |

---

### Mode 3: Source Tracer

When an anomaly is detected, traces the initiating wallets and exchange accounts to identify the origin of unusual activity.

**Request:**

```
POST /alpha-time-machine/source-tracer
```

**Request Body:**

```json
{
  "symbol": "CAKEUSDT",
  "anomalyTimestamp": 1710300000000,
  "chainId": "56",
  "traceDepth": 3,
  "lookbackHours": 24
}
```

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| symbol | string | Yes | Trading pair with detected anomaly |
| anomalyTimestamp | long | Yes | Anomaly detection timestamp (ms) |
| chainId | string | No | Chain to trace on-chain transfers: `56` for BSC (default: `56`) |
| traceDepth | integer | No | How many hops to trace from initiating addresses (default: 3, max: 5) |
| lookbackHours | integer | No | Hours before anomaly to analyze (default: 24, max: 72) |

**Response Fields:**

| Field | Type | Description |
|-------|------|-------------|
| symbol | string | Trading pair analyzed |
| anomalyTimestamp | long | Reference anomaly timestamp |
| initiatingTransfers | array | Large transfers that preceded the anomaly |
| sourceWallets | array | Identified source wallets |
| exchangeInflows | array | Exchange deposit events in the lookback window |
| connectionAnalysis | object | Analysis of source wallet connections |

**Initiating Transfer Entry:**

| Field | Type | Description |
|-------|------|-------------|
| txHash | string | Transaction hash |
| timestamp | long | Transfer timestamp (ms) |
| fromAddress | string | Sender address |
| toAddress | string | Recipient address |
| tokenSymbol | string | Transferred token symbol |
| amount | string | Transfer amount |
| valueUsd | string | Transfer value in USD |
| toAddressType | string | `exchange_deposit`, `dex`, `wallet`, `contract` |
| minutesBeforeAnomaly | integer | Minutes before the anomaly was detected |

**Source Wallet Entry:**

| Field | Type | Description |
|-------|------|-------------|
| address | string | Wallet address |
| walletAge | long | Wallet age in seconds |
| totalTransferValueUsd | string | Total value transferred to exchange in lookback (USD) |
| transferCount | integer | Number of transfers in lookback |
| labeledAs | string | Known label if any: `project_team`, `known_whale`, `market_maker`, `unlabeled` |
| priorAnomalyAssociation | integer | Number of past anomaly events this wallet was involved in |
| riskScore | integer | Source risk score (0-100) |

**Connection Analysis:**

| Field | Type | Description |
|-------|------|-------------|
| projectTeamConnection | boolean | Whether source wallets connect to known project team addresses |
| connectionHops | integer | Minimum hops to project team address (null if no connection) |
| exchangePattern | string | Exchange deposit pattern: `single_large`, `distributed_small`, `staged` |
| timingPattern | string | Transfer timing: `pre_announcement_typical`, `random`, `coordinated` |
| repeatOffender | boolean | Whether source wallets appeared in prior anomaly traces |
| repeatCount | integer | Number of prior appearances |

---

### Mode 4: Track Record

Transparent performance log of all detected anomalies and their outcomes. Builds verifiable statistics on detection accuracy, lead time, and false positive rate.

**Request:**

```
GET /alpha-time-machine/track-record
```

**Query Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| timeRange | string | No | Record window: `7d`, `30d`, `90d`, `365d` (default: `30d`) |
| anomalyType | string | No | Filter by type: `volume`, `price`, `order_flow`, `transfer` |
| outcomeType | string | No | Filter by outcome: `confirmed`, `false_positive`, `pending` |
| minSigma | float | No | Minimum sigma at detection (default: 3.0) |
| limit | integer | No | Results per page (default 50, max 200) |
| page | integer | No | Page number starting from 1 |

**Response Fields:**

| Field | Type | Description |
|-------|------|-------------|
| summary | object | Aggregate performance statistics |
| records | array | Individual anomaly outcome records |
| timeRange | string | Requested time range |

**Summary Object:**

| Field | Type | Description |
|-------|------|-------------|
| totalAnomalies | integer | Total anomalies detected in period |
| confirmedEvents | integer | Anomalies followed by public event within 7 days |
| falsePositives | integer | Anomalies with no subsequent event |
| pendingResolution | integer | Recent anomalies still within 7-day observation window |
| hitRate | string | Confirmed / (Confirmed + False Positive) as percentage |
| avgLeadTime | string | Average hours between detection and public announcement |
| medianLeadTime | string | Median hours between detection and public announcement |
| avgPriceChangeOnConfirm | string | Average price change when anomaly was confirmed by event (%) |
| bestDetection | object | Highest-sigma anomaly that was confirmed |
| worstFalsePositive | object | Highest-sigma anomaly that was a false positive |

**Track Record Entry:**

| Field | Type | Description |
|-------|------|-------------|
| recordId | string | Unique record identifier |
| symbol | string | Trading pair |
| anomalyType | string | Detection type |
| detectedAt | long | Detection timestamp (ms) |
| sigmaAtDetection | string | Sigma deviation when first flagged |
| compositeScore | float | Multi-factor score at detection |
| outcome | string | `confirmed`, `false_positive`, `pending` |
| eventType | string | Confirmed event type (null if false positive) |
| eventTimestamp | long | Public announcement timestamp (null if false positive) |
| leadTimeHours | string | Hours between detection and announcement |
| priceAtDetection | string | Price when anomaly was detected |
| priceAtEvent | string | Price when event was announced |
| priceChange | string | Price change from detection to event (%) |
| price24hAfter | string | Price 24 hours after event |
| priceChange24h | string | Price change 24h after event (%) |

**Performance by Anomaly Type:**

| Field | Type | Description |
|-------|------|-------------|
| anomalyType | string | Type of anomaly |
| count | integer | Total detections |
| hitRate | string | Confirmation rate (%) |
| avgLeadTime | string | Average lead time in hours |
| avgPriceImpact | string | Average price change on confirmation (%) |

---

## Data Sources

| Source | Endpoint / Method | Data Provided |
|--------|-------------------|---------------|
| Binance Spot API | `GET /api/v3/klines` | Historical OHLCV candle data for baseline computation |
| Binance Spot API | `GET /api/v3/ticker/24hr` | 24h volume, price change, trade count |
| Binance Spot API | `GET /api/v3/aggTrades` | Aggregated trade data for order flow analysis |
| Binance Spot API | `GET /api/v3/depth` | Order book for bid/ask imbalance detection |
| Binance Futures API | `GET /fapi/v1/klines` | Futures OHLCV candle data |
| Binance Futures API | `GET /fapi/v1/openInterest` | Open interest changes as anomaly signal |
| Binance Futures API | `GET /fapi/v1/fundingRate` | Funding rate deviations |
| Binance Announcements | `GET /bapi/composite/v1/public/cms/article/list/query` | Official announcements for outcome verification |
| BSC RPC | `eth_getLogs` with Transfer topic | Large token transfers to exchange addresses |
| BscScan API | `/api?module=account&action=tokentx` | Token transfer history for source tracing |

## Parameters

### Global Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| symbol | string | Binance trading pair (e.g., `CAKEUSDT`) |
| market | string | Market type: `spot`, `futures`, `all` |
| minSigma | float | Minimum standard deviation threshold for anomaly detection |
| timeRange | string | Analysis or record window |
| anomalyTypes | array | Types of anomalies to scan for |
| limit | integer | Results per page |
| page | integer | Pagination page number |

## Output Format

All responses follow this structure:

```json
{
  "code": "000000",
  "message": null,
  "data": {
    "mode": "anomaly-scanner",
    "timestamp": 1710000000000,
    "results": {}
  },
  "success": true
}
```

## Examples

### Example 1: Scan for Volume Anomalies

**Request:**
```bash
curl -X POST '/alpha-time-machine/anomaly-scanner' \
-H 'Content-Type: application/json' \
-H 'User-Agent: binance/1.0 (Skill)' \
-d '{
  "market": "spot",
  "minSigma": 3.0,
  "anomalyTypes": ["volume"],
  "quoteAsset": "USDT",
  "minDailyVolumeUsd": "500000",
  "limit": 10
}'
```

**Response:**
```json
{
  "code": "000000",
  "data": {
    "scanTimestamp": 1710345600000,
    "pairsScanned": 1842,
    "anomaliesFound": 7,
    "anomalies": [
      {
        "symbol": "CAKEUSDT",
        "market": "spot",
        "anomalyType": "volume",
        "currentValue": "48500000",
        "baselineMean": "5200000",
        "baselineStdDev": "1800000",
        "sigmaDeviation": "24.06",
        "percentAboveBaseline": "+832.7",
        "detectedAt": 1710340000000,
        "duration": 5600000,
        "publicNewsFound": false,
        "newsSource": null,
        "compositeScore": 91.3
      },
      {
        "symbol": "ALPHAUSDT",
        "market": "spot",
        "anomalyType": "volume",
        "currentValue": "12800000",
        "baselineMean": "2100000",
        "baselineStdDev": "900000",
        "sigmaDeviation": "11.89",
        "percentAboveBaseline": "+509.5",
        "detectedAt": 1710342000000,
        "duration": 3600000,
        "publicNewsFound": false,
        "newsSource": null,
        "compositeScore": 78.6
      }
    ]
  },
  "success": true
}
```

### Example 2: Match Current Pattern Against History

**Request:**
```bash
curl -X POST '/alpha-time-machine/pattern-match' \
-H 'Content-Type: application/json' \
-H 'User-Agent: binance/1.0 (Skill)' \
-d '{
  "symbol": "CAKEUSDT",
  "market": "spot",
  "patternTypes": ["listing", "partnership"],
  "minSimilarity": 0.7,
  "lookbackHours": 48
}'
```

**Response:**
```json
{
  "code": "000000",
  "data": {
    "symbol": "CAKEUSDT",
    "bestMatchScore": 0.84,
    "matches": [
      {
        "matchId": "evt_2024_0312_listing_xyz",
        "eventType": "partnership",
        "eventDescription": "Major DEX integration partnership announced",
        "eventDate": 1709856000000,
        "similarity": 0.84,
        "leadTime": 172800000,
        "priceChangePreEvent": "+12.3",
        "priceChangePostEvent": "+34.5",
        "volumeMultiplier": "8.2",
        "matchedDimensions": ["volume", "price", "order_flow"]
      },
      {
        "matchId": "evt_2023_1105_listing_abc",
        "eventType": "listing",
        "eventDescription": "New trading pair listed on Binance",
        "eventDate": 1699142400000,
        "similarity": 0.76,
        "leadTime": 129600000,
        "priceChangePreEvent": "+8.7",
        "priceChangePostEvent": "+45.2",
        "volumeMultiplier": "12.5",
        "matchedDimensions": ["volume", "price"]
      }
    ]
  },
  "success": true
}
```

### Example 3: Trace Anomaly Source

**Request:**
```bash
curl -X POST '/alpha-time-machine/source-tracer' \
-H 'Content-Type: application/json' \
-H 'User-Agent: binance/1.0 (Skill)' \
-d '{
  "symbol": "CAKEUSDT",
  "anomalyTimestamp": 1710340000000,
  "chainId": "56",
  "traceDepth": 3,
  "lookbackHours": 24
}'
```

**Response:**
```json
{
  "code": "000000",
  "data": {
    "symbol": "CAKEUSDT",
    "anomalyTimestamp": 1710340000000,
    "initiatingTransfers": [
      {
        "txHash": "0xabc123...",
        "timestamp": 1710320000000,
        "fromAddress": "0xsource1...",
        "toAddress": "0xbinance_deposit...",
        "tokenSymbol": "CAKE",
        "amount": "450000",
        "valueUsd": "1053000",
        "toAddressType": "exchange_deposit",
        "minutesBeforeAnomaly": 333
      }
    ],
    "sourceWallets": [
      {
        "address": "0xsource1...",
        "walletAge": 15552000,
        "totalTransferValueUsd": "1053000",
        "transferCount": 3,
        "labeledAs": "unlabeled",
        "priorAnomalyAssociation": 2,
        "riskScore": 72
      }
    ],
    "connectionAnalysis": {
      "projectTeamConnection": false,
      "connectionHops": null,
      "exchangePattern": "staged",
      "timingPattern": "pre_announcement_typical",
      "repeatOffender": true,
      "repeatCount": 2
    }
  },
  "success": true
}
```

### Example 4: View Track Record

**Request:**
```bash
curl -X GET '/alpha-time-machine/track-record?timeRange=30d&anomalyType=volume&limit=5' \
-H 'User-Agent: binance/1.0 (Skill)'
```

**Response:**
```json
{
  "code": "000000",
  "data": {
    "summary": {
      "totalAnomalies": 156,
      "confirmedEvents": 47,
      "falsePositives": 98,
      "pendingResolution": 11,
      "hitRate": "32.4",
      "avgLeadTime": "38.2",
      "medianLeadTime": "28.5",
      "avgPriceChangeOnConfirm": "+18.7",
      "bestDetection": {
        "symbol": "XYZUSDT",
        "sigmaAtDetection": "42.3",
        "leadTimeHours": "52",
        "priceChange24h": "+67.2"
      },
      "worstFalsePositive": {
        "symbol": "ABCUSDT",
        "sigmaAtDetection": "18.7",
        "priceChange24h": "-2.1"
      }
    },
    "records": [
      {
        "recordId": "rec_20260310_001",
        "symbol": "CAKEUSDT",
        "anomalyType": "volume",
        "detectedAt": 1710340000000,
        "sigmaAtDetection": "24.06",
        "compositeScore": 91.3,
        "outcome": "confirmed",
        "eventType": "partnership",
        "eventTimestamp": 1710500000000,
        "leadTimeHours": "44.4",
        "priceAtDetection": "2.34",
        "priceAtEvent": "2.78",
        "priceChange": "+18.8",
        "price24hAfter": "3.12",
        "priceChange24h": "+33.3"
      }
    ],
    "timeRange": "30d"
  },
  "success": true
}
```

## Architecture

### Baseline Computation Engine

1. **Rolling Statistics Calculator** -- Maintains 30-day rolling mean and standard deviation for every metric on every tradeable pair. Statistics are time-of-day adjusted (comparing current 2PM volume against historical 2PM volume, not 24h average) to account for intraday seasonality.
2. **Metric Collector** -- Pulls OHLCV data via `GET /api/v3/klines` (1h interval), aggregated trades via `GET /api/v3/aggTrades`, and order book snapshots via `GET /api/v3/depth` on configurable schedules.
3. **Baseline Storage** -- Stores precomputed baselines in time-series database with 1-hour granularity. Baselines update every hour with newest data point replacing oldest.

### Anomaly Detection Engine

1. **Z-Score Calculator** -- Computes z-score (standard deviations from mean) for each metric in real-time. Flags metrics exceeding configured threshold (default 3.0 sigma).
2. **Composite Scorer** -- Combines individual metric z-scores into a single composite anomaly score using weighted average: volume (35%), price (25%), order flow (25%), transfer (15%).
3. **News Cross-Reference** -- Queries Binance announcements API and major crypto news aggregators to check for public explanations of detected anomalies. Anomalies without public news are scored higher.
4. **Duration Tracker** -- Monitors how long each anomaly persists. Sustained anomalies (>2 hours) are scored higher than flash spikes.

### Pattern Matching Engine

1. **Signature Extractor** -- Converts raw time-series data into normalized pattern signatures using Dynamic Time Warping preprocessing.
2. **Historical Database** -- Contains 2500+ historical pre-event pattern signatures extracted from all Binance announcements since 2019.
3. **Similarity Computer** -- Uses cosine similarity on multi-dimensional signatures. Matches above configured threshold are returned with full historical context.

### Source Tracing Engine

1. **Transfer Monitor** -- Watches BSC for large token transfers to known exchange deposit addresses using `eth_getLogs` with Transfer event topic.
2. **Graph Traverser** -- From identified source wallets, traverses transaction graph up to configured depth to find connections to labeled addresses (project teams, known whales, market makers).
3. **History Lookup** -- Cross-references source wallets against database of wallets observed in previous anomaly traces to identify repeat participants.

### Track Record System

1. **Outcome Resolver** -- After anomaly detection, monitors Binance announcements for 7 days. If a relevant announcement appears, the anomaly is marked `confirmed` with the announcement details. Otherwise, it is marked `false_positive`.
2. **Statistics Aggregator** -- Computes rolling hit rate, average lead time, and price impact statistics across configurable windows.
3. **Integrity Guarantee** -- All records are append-only with timestamps. Historical records cannot be modified or deleted.

## Risk Disclaimers

1. **Not financial advice.** Anomaly detection identifies statistical deviations from historical patterns. It does not guarantee that a public event will follow, nor does it predict the direction or magnitude of price movements.
2. **Anomalies have multiple explanations.** Unusual volume or price activity may be caused by market makers rebalancing, liquidation cascades, whale portfolio adjustments, or algorithmic trading strategies. Not all anomalies indicate information asymmetry.
3. **Historical hit rate is not predictive.** A 32% confirmation rate means 68% of flagged anomalies are false positives. Past performance of the detection system does not guarantee future accuracy.
4. **Source tracing is indicative, not conclusive.** Identifying wallets that transferred tokens before an anomaly does not prove insider knowledge. Correlation between wallet activity and announcements may be coincidental.
5. **Regulatory compliance.** This tool is designed for market research and due diligence purposes. Users are responsible for complying with applicable laws regarding trading on material non-public information in their jurisdiction.
6. **Data availability.** On-chain source tracing depends on token transfers occurring on BSC. Activity on other chains, centralized exchange internal transfers, and OTC trades are not captured.
7. **Latency.** Statistical baselines are computed hourly. Anomalies occurring within the current hour are compared against the most recently completed baseline.

## User Agent Header

Include `User-Agent` header with the following string: `binance/1.0 (Skill)`

## Notes

1. All timestamps are in milliseconds (Unix epoch)
2. All USD values are strings to preserve decimal precision
3. Sigma values are strings with up to 2 decimal places
4. Percentage fields are pre-formatted numbers (append `%` for display)
5. The anomaly scanner processes all active Binance trading pairs; scans may take 3-5 seconds
6. Pattern matching uses a database of 2500+ historical events updated daily
7. Track record entries are immutable once the 7-day observation window closes
8. Source tracing currently supports BSC only; ETH and Solana tracing planned for future versions
9. Rate limit: 60 requests per minute for scanner, 30 requests per minute for source tracer
10. Baseline computation excludes obvious outlier days (exchange outages, circuit breakers) from the 30-day window
