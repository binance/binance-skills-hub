---
name: pancakeswap_trading_guard
description: Builds pre-trade checklist and execution guardrails for BSC PancakeSwap workflows.
---

# PancakeSwap Trading Guard

## Usage

- Category: Ecosystem
- Mode: guide
- Version: 0.1.0

## Input Example

```json
{
  "pair": "WBNB/USDT",
  "side": "buy",
  "slippageBps": 100
}
```

## Local Install (planned)

```bash
npx @skillshub/pancakeswap-trading-guard
```

## Notes

- Produces execution checklist and risk controls before swap operations.
- Includes allowance/liquidity/price-impact verification steps.
