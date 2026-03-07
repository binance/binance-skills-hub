# SuperBSC — Crypto Intelligence Terminal

**The first open-source project to use all 7 Binance Skills Hub APIs in a unified terminal interface.**

## Overview

SuperBSC is a Bloomberg Terminal-inspired, keyboard-driven crypto intelligence terminal. It connects all 7 Binance Skills Hub skills into a single coherent workflow — from token discovery to security audit to trade execution.

**Live Demo:** [mefai.io/superbsc](https://mefai.io/superbsc/)
**Source Code:** [github.com/mefai-dev/superbsc-](https://github.com/mefai-dev/superbsc-)
**License:** MIT

## Skills Hub Integration

| Panel | Skill | Endpoint |
|-------|-------|----------|
| Market Overview | Skill 1: Spot CEX | `GET /api/v3/ticker/24hr` |
| Order Book | Skill 1: Spot CEX | `GET /api/v3/depth` |
| Price Chart | Skill 1: Spot CEX | `GET /api/v3/klines` |
| Spot Trading | Skill 1: Spot CEX | `POST /api/v3/order` |
| Meme Rush | Skill 2: Meme Rush | `POST pulse/rank/list` |
| Topic Rush | Skill 2: Topic Rush | `GET social-rush/rank/list` |
| Wallet Tracker | Skill 3: Address Info | `GET active-position-list` |
| Smart Signals | Skill 4: Trading Signal | `POST signal/smart-money` |
| Social Hype | Skill 5.1 | `GET social/hype/rank/leaderboard` |
| Trending Tokens | Skill 5.2 | `POST unified/rank/list` |
| Smart Inflow | Skill 5.3 | `POST inflow/rank/query` |
| Meme Rank | Skill 5.4 | `GET exclusive/rank/list` |
| Top Traders | Skill 5.5 | `GET leaderboard/query` |
| Token Audit | Skill 6 | `POST security/token/audit` |
| Token Search | Skill 7.1 | `GET token/search` |
| Token Profile | Skill 7.2+3 | `GET token/meta/info` + `dynamic/info` |
| DEX Chart | Skill 7.4 | `GET k-line/candles` |
| **Auto-Scanner** | **All 7** | **Automated multi-API pipeline** |

## Unique Feature: Auto-Scanner

The Auto-Scanner is a background engine that:
1. Pulls new tokens from Meme Rush (Skill 2)
2. Cross-references with trading signals (Skill 4)
3. Checks trending status (Skill 5)
4. Computes a composite opportunity score

No other tool automates intelligence across all 7 Skills Hub APIs.

## Architecture

- **Frontend:** Vanilla JS + Web Components (zero framework, no build step)
- **Backend:** Python FastAPI proxy with aggressive caching
- **Charts:** TradingView lightweight-charts (MIT)
- **Deploy:** `docker compose up` (one command)

## Quick Start

```bash
git clone https://github.com/mefai-dev/superbsc-.git
cd superbsc-
docker compose up
# Open http://localhost:8000
```

## Contributing

SuperBSC has a plugin architecture. Add a panel by creating one file — see [CONTRIBUTING.md](https://github.com/mefai-dev/superbsc-/blob/main/CONTRIBUTING.md).
