---
name: flash-sniper
title: Binance FlashSniper (Microstructure Liquidation Cascade Hunter)
description: Autonomous quantitative liquidation cascade sniper with real-time orderbook absorption verification and strict Agentic sub-account risk gates.
metadata:
  version: 1.0.0
  author: duclucky
  openclaw:
    requires:
      bins:
        - binance-cli
    install:
      - kind: shell
        label: Install binance-cli
        script: |
          curl --proto '=https' --tlsv1.2 -LsSf \
            https://github.com/binance/binance-cli/releases/latest/download/binance-cli-installer.sh \
            | sh
license: MIT
---

# Binance FlashSniper Skill

FlashSniper is an autonomous market-microstructure agent built on the **Binance Agent OS** framework. It snipes high-probability mean-reversion wicks caused by cascading liquidations without catching falling knives.

## When to Use

Use this skill when you want to:
- Monitor Binance USDⓈ-M Futures for anomalous liquidation cascades.
- Confirm orderbook absorption (Orderbook Imbalance $OIB > +0.25$ and liquidation deceleration).
- Execute safe, risk-capped Iceberg entry orders sized strictly within sub-account safety limits.
- Automatically attach a Hard Stop-Loss (-0.8% under the cascade wick) and Take-Profit (+2.4% mean reversion target).

## Security & Risk Constraints

- **Zero-Withdrawal Scope:** Operates strictly within an authorized **Agentic Sub-account**. Never requests or utilizes withdrawal permissions.
- **Fail-Closed Principle:** If market feeds disconnect or abnormal orderbook spread is detected, the agent fails closed and cancels any pending triggers.
- **Strict Sizing Caps:** Maximum 2% allocation per trade of total sub-account balance, capped at $1,000 max notional.
- **Mandatory Hard Stop-Loss:** Every trade must have an immutable stop-loss order placed atomically.

## Helper Commands

| Command | Description |
|---|---|
| `flash-sniper scan` | Starts listening to live liquidation streams (`!forceOrder@arr`) and L2 orderbooks |
| `flash-sniper demo` | Replays real recorded cascade data (`corpus/solusdt-cascade.jsonl`) deterministically |
| `flash-sniper status` | Inspects current agent state (`STANDBY`, `ALERT`, `ARMED`, `TRIGGERED`) and risk limits |
| `flash-sniper halt` | Emergency stop that cancels any pending iceberg orders and flattens exposure |

## Architecture Flow

```
Binance Streams (Public) ──► Liquidation Radar ($V_{liq} > \$500k$) ──► State: ALERT
                                     │
                             Absorption Filter ($OIB > +0.25$, Deceleration)
                                     │
                             Risk Gate (Cap 2% sub-account, Hard SL -0.8%)
                                     │
                             Agentic MCP Order: Iceberg Buy + Trailing TP/SL
```

## Example Usage

```bash
# Run in deterministic replay mode (Zero API credentials required for evaluation)
npm run demo

# Run live connected to Binance Agent OS MCP Server
BINANCE_MCP_ENV=prod npm start
```
