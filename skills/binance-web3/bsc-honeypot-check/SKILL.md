---
name: bsc_honeypot_check
description: Checks sell restrictions, tax anomalies, and multi-DEX liquidity signals before buy-in.
---

# BSC Honeypot Check

## Usage

- Category: Security
- Mode: live
- Version: 0.1.0

## Input Example

```json
{
  "tokenAddress": "0x...",
  "maxPairs": 5
}
```

## Local Install (planned)

```bash
npx @skillshub/bsc-honeypot-check
```

## Notes

- Combines free API signals from DexScreener and Honeypot simulation.
- Produces pre-trade risk assessment only; no automatic trade execution.
- Liquidity lock state from free endpoints can be partial; treat as advisory.
