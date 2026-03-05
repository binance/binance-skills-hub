---
title: Bitcoin On-Chain Stats
description: "Network hashrate, difficulty, mining pools, block time, and transaction metrics"
metadata:
  version: "1.0.0"
  author: mefai-dev
license: MIT
---

# Bitcoin On-Chain Stats

## Overview

Real-time Bitcoin network fundamentals: hashrate, difficulty, mining pool distribution, block times, transaction counts, and supply metrics. Essential for understanding network health and miner behavior.

## API Reference

### Network Stats

```
GET https://api.blockchain.info/stats
```

**Response:**
```json
{
  "market_price_usd": 72810.25,
  "hash_rate": 1141315272294.81,
  "difficulty": 113757508158578,
  "n_tx": 468381,
  "n_blocks_mined": 159,
  "minutes_between_blocks": 8.55,
  "totalbc": 1999820312500000,
  "n_blocks_total": 939425,
  "nextretarget": 939456
}
```

### Chart Data

```
GET https://api.blockchain.info/charts/{name}?timespan={period}&format=json
```

Charts: `hash-rate`, `difficulty`, `n-transactions`, `miners-revenue`, `transaction-fees`

Timespans: `30days`, `60days`, `180days`, `1year`

**Response:**
```json
{
  "values": [{"x": 1672531200, "y": 275000000000}]
}
```

### Mining Pools

```
GET https://api.blockchain.info/pools?timespan=4days
```

**Response:**
```json
{
  "Foundry USA": 152,
  "AntPool": 98,
  "ViaBTC": 67,
  "F2Pool": 54
}
```

## Key Metrics

| Metric | Description |
|--------|-------------|
| `hash_rate` | Network hashrate in GH/s |
| `difficulty` | Current mining difficulty |
| `minutes_between_blocks` | Average block interval |
| `n_tx` | Transaction count (24h) |
| `n_blocks_mined` | Blocks mined today |
| `totalbc` | Total BTC mined (satoshis) |
| `nextretarget` | Block height of next difficulty adjustment |

## Use Cases

- **Hashrate Monitoring**: Track mining security and miner confidence
- **Difficulty Analysis**: Predict difficulty adjustments, estimate miner profitability
- **Pool Distribution**: Monitor mining centralization risks
- **Supply Tracking**: Monitor BTC issuance approaching 21M cap

## Notes

- All endpoints are public and free
- Stats endpoint updates every ~10 minutes
- Hashrate is reported in GH/s (divide by 1e9 for EH/s)
- Total BTC supply is in satoshis (divide by 1e8 for BTC)
