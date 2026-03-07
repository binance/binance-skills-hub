---
title: trader-growth-analysis
description: |
  Analyze a Binance user's spot and futures trading history to generate a trader personality report,
  identify risk preference type (conservative/steady/balanced/aggressive/radical),
  provide personalized strategy recommendations, and track daily execution via testnet or live API.
  Use when users ask: analyze my trades, trading personality, risk profile, my binance life, growth report.
metadata:
  version: "1.0"
  author: wxie0815-arch (Power + XieXiu for 无邪@wuxie149)
license: MIT
---

# Trader Growth Analysis Skill

## Overview

Analyzes Binance spot + futures trading records to generate a comprehensive **Trader Personality Report**, then provides personalized improvement strategies.

Part of the **「我的币安人生」(My Binance Life)** AI Agent system built with OpenClaw.

🔗 Full project: https://github.com/wxie0815-arch/binance-growth-agent

## 5 Core Functions

| Function | Description |
|----------|-------------|
| 🪞 Risk Mirror | Analyze trade history → identify trader type + fatal weaknesses |
| 🗺️ Earn Map | Compare Earn/Vault/Launchpool → optimal asset allocation |
| 📊 Contract Coach | Break down each loss → identify error patterns |
| 🎓 Socrates Training | Scenario questions → change trading mindset |
| 📅 7-Day Challenge | Daily Binance Square posts showing growth journey |

## Trader Types

| Type | Leverage | Win Rate | Characteristics |
|------|----------|----------|-----------------|
| 🛡️ Conservative | <3x | >60% | Low frequency, stable |
| ⚖️ Steady | 3-5x | >55% | Disciplined stop-loss |
| 🎯 Balanced | 5-10x | ~50% | Mixed spot+futures |
| 🚀 Aggressive | 10-15x | ~45% | High frequency, emotional |
| ⚡ Radical | >15x | <45% | High leverage, impulsive |

## Data Modes

```bash
# Demo mode (no API key needed)
python3 main/orchestrator.py --mode demo

# Live mode (read-only API key)
python3 main/orchestrator.py --mode live --api-key YOUR_KEY --api-secret YOUR_SECRET

# Testnet mode
python3 main/orchestrator.py --mode testnet
```

## API Endpoints Used

| Endpoint | Auth | Purpose |
|----------|------|---------|
| `GET /api/v3/myTrades` | Yes (read-only) | Spot trade history |
| `GET /fapi/v1/userTrades` | Yes (read-only) | Futures trade history |
| `GET /api/v3/klines` | No | Price data |
| `GET /api/v3/ticker/24hr` | No | Market data |
| Binance Earn APIs | No | APY rates |

## Quick Start

```python
from agents.risk_mirror import generate_report
from agents.earn_map import generate_earn_map

# Generate trader personality report (demo)
report = generate_report(mode="demo")
print(report)

# Get optimal earn allocation
earn = generate_earn_map(trader_type="aggressive", total_idle_usdt=1000)
print(earn)
```

## Example Output

```
🪞 Trader Personality Report
========================================
🧬 Your Type: 🚀 Aggressive Trader
Seeks high returns, frequent trading, uses leverage to amplify gains

📊 Spot Analysis
• Total trades: 8 | Win rate: 50.0%
• Style: Diversified, short-term bias

📈 Futures Analysis  
• Avg leverage: 12x | Max: 20x ⚠️ HIGH RISK
• P&L: +40 USDT | Loss rate: 40%

⚠️ Fatal Weaknesses
• Emotional trading
• Poor stop-loss discipline
• Chasing pumps and dumps
```

## Related Skills
- `binance/spot` — Execute spot trades
- `binance-web3/trading-signal` — Smart money signals
- `binance-web3/crypto-market-rank` — Market rankings
