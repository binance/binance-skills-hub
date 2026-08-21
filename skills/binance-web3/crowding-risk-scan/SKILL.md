---
name: crowding_risk_scan
description: Tracks long/short crowding from account ratios, taker flow, and OI change for squeeze warnings.
metadata:
  author: brief-onchain
  version: "1.0"
---

# Crowding Risk Scan

## Usage

- Category: Derivatives
- Mode: live
- Version: 0.1.0

## Input Example

```json
{
  "symbol": "BTCUSDT",
  "period": "1h",
  "limit": 12
}
```

## Local Install (planned)

```bash
npx @skillshub/crowding-risk-scan
```

## Notes

- Flags crowding/squeeze risk from multiple futures sentiment datasets.
- Intended for pre-trade risk filtering, not automated trade execution.
