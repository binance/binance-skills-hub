---
title: Token Launch Scanner
description: |
  New token safety scanner combining DexScreener boosted tokens with GoPlus security analysis.
  Identifies top boosted tokens and runs automated security checks to flag risks.
  Use this skill when users ask about new token safety, launch analysis, rug pull detection,
  boosted token security, or whether a new token is safe to trade.
metadata:
  version: "1.0"
  author: mefai-dev
license: MIT
---

# Token Launch Safety Scanner Skill

## Overview

Combines DexScreener's top boosted token list with GoPlus security scanning to
create a safety-scored view of newly launched tokens.

## Data Sources

| Source | Endpoint | TTL | Purpose |
|--------|----------|-----|---------|
| DexScreener | `https://api.dexscreener.com/token-boosts/top/v1` | 30s | Top boosted tokens |
| GoPlus | GoPlus Token Security API | 120s | Per-token security audit |

## Safety Scoring

Each token starts at 100 and loses points for risk flags:

| Risk Flag | Penalty | Description |
|-----------|---------|-------------|
| is_honeypot | -30 | Cannot sell token |
| hidden_owner | -20 | Owner address is hidden |
| selfdestruct | -20 | Contract can self-destruct |
| is_mintable | -15 | Token supply can increase |
| can_take_back_ownership | -15 | Ownership can be reclaimed |
| is_proxy | -10 | Upgradeable proxy contract |
| is_blacklisted | -10 | Address blacklisting enabled |
| external_call | -10 | External contract calls |
| transfer_pausable | -10 | Transfers can be paused |
| buy_tax > 10% | -10 | High buy tax |
| sell_tax > 10% | -10 | High sell tax |

### Score Classification
- **70-100**: Safe (green)
- **40-69**: Caution (yellow)
- **0-39**: Danger (red)

## Fields

| Field | Description |
|-------|-------------|
| name | Token name from GoPlus or DexScreener |
| chain | Blockchain (BSC, ETH, etc.) |
| amount | DexScreener boost amount |
| safetyScore | Computed safety score (0-100) |
| risks | List of detected risk flags |
| riskLevel | low / medium / high classification |

## Usage Examples

- "Show me the safest boosted tokens"
- "Are any new launches risky?"
- "Scan top DexScreener tokens for safety"
