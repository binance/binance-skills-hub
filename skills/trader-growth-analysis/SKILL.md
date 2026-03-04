---
title: Binance Trader Growth Analyzer
description: Analyze Binance trading history, identify trader risk personality, and provide personalized growth advice through a four-stage coaching pipeline.
metadata:
  version: 1.0.0
  author: wxie0815-arch
license: MIT
---

# Binance Trader Growth Analyzer

## Overview
A four-stage AI coaching pipeline that turns raw Binance trading data into actionable personal growth insights. Designed for both spot and futures traders.

## When to Use
Trigger when users ask:
- "What kind of trader am I?"
- "Why do I keep losing money?"
- "How can I improve my trading?"
- "Analyze my Binance trading history"
- "Give me a growth report"

## Pipeline

### Stage 1 — 🪞 Risk Mirror (风险镜子)
**Goal:** Identify trader personality from trading history.

Data inputs:
- Spot trades: `GET /api/v3/myTrades` (last 90 days)
- Futures trades: `GET /fapi/v1/userTrades` (last 90 days)
- Income history: `GET /fapi/v1/income`

Analysis dimensions:
- Win rate, avg profit/loss ratio, max drawdown
- Trade frequency (scalper / swing / position)
- Risk exposure per trade (% of portfolio)
- Emotional trading signals (rapid reversals after losses)

Personality types:
| Type | Traits | Core weakness |
|------|--------|---------------|
| 🎰 Gambler | High frequency, high leverage, poor stops | No risk management |
| 😰 Panic Seller | Cuts winners early, holds losers too long | Loss aversion bias |
| 🤩 FOMO Chaser | Buys tops, chases pumps | Emotional entry |
| 🧊 Ice Hand | Over-cautious, misses entries, holds cash | Action paralysis |
| ⚖️ Balanced Trader | Consistent sizing, respects stops | Scale-up blindspot |

Output: Personality card with top 3 behavioral patterns and risk score (0–100).

---

### Stage 2 — 🗺️ Yield Map (收益地图)
**Goal:** Show where the same capital generates best risk-adjusted returns on Binance.

Compare across:
- Spot holding (current portfolio)
- Binance Earn (Flexible / Locked APY)
- Launchpool staking yields
- Simple Earn Vault rates
- Current futures PnL annualized

Output: Side-by-side yield comparison table + recommended reallocation suggestion based on risk personality from Stage 1.

---

### Stage 3 — 📊 Trade Coach (合约复盘教练)
**Goal:** Dissect losing trades to find recurring error patterns.

Process:
1. Isolate all losing trades from history
2. Cluster by error type (entry timing / stop placement / position sizing / exit too early / held too long)
3. Calculate: which error type cost the most PnL
4. Generate weekly health report with top 3 mistakes

Output format:
```
📊 Weekly Trade Health Report
────────────────────────────
Top mistake #1: [Error type] — cost you X USDT this week
Top mistake #2: ...
Top mistake #3: ...

Your PnL recovery potential if mistake #1 is fixed: +X%
```

---

### Stage 4 — 🎓 Socratic Trainer (苏格拉底训练)
**Goal:** Fix behavioral weaknesses through scenario-based questioning.

Method:
- Generate 3 trade scenarios targeting the user's specific weakness (from Stage 1)
- Ask questions instead of giving answers (Socratic method)
- After user responds, provide analysis and correct thinking framework
- Track improvement over sessions

Example (for FOMO Chaser type):
> "BTC just pumped 8% in 2 hours. You're watching it. What's your move, and why?"
> [Wait for response]
> "Interesting. Let's look at what the order book and volume say about whether this move has continuation..."

---

## Growth Loop
```
Stage 1 (Mirror) → identify weakness
     ↓
Stage 2 (Map) → optimize capital allocation
     ↓
Stage 3 (Coach) → fix recurring trade errors
     ↓
Stage 4 (Trainer) → rewire decision patterns
     ↓
Back to Stage 1 → measure improvement
```

## Daily Report Output
Delivered every day at 22:00 (Asia/Shanghai):

```
⚡ 你的每日成长报告 [日期]

🪞 今日镜子：[一句话当日表现评价]
📊 今日复盘：[最值得注意的一笔交易]
🎓 今日训练题：[一道情景题]
🗺️ 收益提示：[当前最优Earn机会]

明日目标：[一个具体可执行的改进点]
```

## Notes
- Requires Binance API key with **Read-only** permission (no trading permission needed)
- Supports both mainnet and testnet (`testnet.binance.vision`) for demo purposes
- All analysis is informational only, not financial advice
