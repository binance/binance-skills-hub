---
name: funding_basis_carry_scan
description: Combines funding history and basis term structure to surface carry setups with risk labels.
metadata:
  author: brief-onchain
  version: "1.0"
---

# Funding Basis Carry Scan

## Usage

- Category: Derivatives
- Mode: live
- Version: 0.1.0

## Input Example

```json
{
  "symbol": "BTCUSDT",
  "pair": "BTCUSDT",
  "contractType": "PERPETUAL",
  "period": "1h",
  "limit": 12
}
```

## Local Install (planned)

```bash
npx @skillshub/funding-basis-carry-scan
```

## Notes

- Produces carry-oriented setup suggestion only; does not execute orders.
- Always combine with position sizing and liquidation risk checks.
