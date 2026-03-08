---
name: liquidation_heatmap
description: Aggregates recent force orders to estimate long-vs-short liquidation pressure.
metadata:
  author: brief-onchain
  version: "1.0"
---

# Liquidation Heatmap

## Usage

- Category: Derivatives
- Mode: live
- Version: 0.1.0

## Input Example

```json
{
  "symbol": "BTCUSDT",
  "windowMinutes": 60,
  "limit": 50
}
```

## Local Install (planned)

```bash
npx @skillshub/liquidation-heatmap
```

## Notes

- Uses recent force-order data to approximate liquidation imbalance.
- Best used with trend and funding context to avoid one-signal bias.
