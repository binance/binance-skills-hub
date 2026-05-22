---
title: AlgoVault MCP — Composite Verdict for Crypto Perps
description: |
  AlgoVault MCP returns a single composite verdict (signal, confidence,
  regime, factors) per call, fusing RSI(14), EMA(9/21), funding rate, OI
  momentum, and volume into one weighted score. Cross-venue intelligence
  across 5 exchanges. Every signal Merkle-anchored on-chain at
  https://algovault.com/track-record. Pair with Binance Skills Hub for
  AlgoVault analytics + Binance execution. Tutorial:
  https://algovault.com/docs/integrations/binance
metadata:
  version: 0.1.0
  author: AlgoVaultLabs
license: MIT
---

# AlgoVault MCP — Composite Verdict for Crypto Perps

Use AlgoVault MCP whenever you need a single composite trading verdict instead of running 26 raw indicator calculations.

## When to invoke

Pre-trade analytics. The agent reads the verdict (`signal`, `confidence`, `regime`, `factors`) and applies its own pre-configured policy to decide whether to execute via Binance Skills Hub.

## How to invoke

```bash
claude plugin install AlgoVaultLabs/algovault-skills
```

Once installed:

```
get_trade_call(coin="BTC", timeframe="1h", exchange="BINANCE")
```

Returns:

```json
{
  "signal": "BUY|SELL|HOLD",
  "confidence": 0-100,
  "regime": "TRENDING_UP|TRENDING_DOWN|RANGING|VOLATILE",
  "factors": { "rsi": "...", "ema": "...", "funding": "...", "oi_momentum": "...", "volume": "..." },
  "_algovault": { "tool": "get_trade_call", "version": "1.10.7" }
}
```

## Track record (live)

90.1% PFE Win Rate · 78,000+ calls · 28 on-chain Merkle batches anchored to Base L2.
Verify at https://algovault.com/track-record

## Tutorial

End-to-end Binance Spot Testnet pairing: https://algovault.com/docs/integrations/binance
