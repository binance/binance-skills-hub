---
name: open_interest_scan
description: Tracks futures open interest and taker flow changes for a symbol.
metadata:
  author: brief-onchain
  version: "1.0"
---

# Open Interest Scan

## Usage

- Category: Derivatives
- Mode: live
- Version: 0.1.0

## Input Example

```json
{
  "symbol": "ETHUSDT",
  "period": "5m",
  "limit": 2
}
```

## Local Install (planned)

```bash
npx @skillshub/open-interest-scan
```
