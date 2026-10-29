---
title: binance-margin-risk-guard
description: Calculates real-time liquidation distance, margin health ratio, and maximum stress-tested drawdowns for Binance Cross & Isolated Margin accounts. Use when users ask about margin health, liquidation price risk, leverage safety, or position sizing.
metadata:
  version: 1.0.0
  author: AlphaZolo
  license: MIT
  tags:
    - binance
    - margin-trading
    - risk-management
    - liquidation-guard
---

# Binance Cross-Margin Risk & Liquidation Guard

## Purpose & Use Case
Automates position-level risk analysis before trade execution. Instead of manually calculating liquidation thresholds across collateral assets, this skill computes exact safety buffers and models price crash scenarios.

## When to Use
Trigger this skill when the user asks to:
- Check current Binance margin level or liquidation proximity.
- Calculate potential liquidation price for a prospective margin position.
- Model stress test scenarios (e.g., "What happens to my margin level if ETH drops 15%?").

## Workflow & Calculations
1. **Calculate Margin Level**:
   $$\text{Margin Level} = \frac{\text{Total Collateral Value}}{\text{Total Liability Value}}$$
2. **Status Classification**:
   - **Margin Level > 2.0**: Safe (Low Risk)
   - **1.5 - 2.0**: Moderate (Caution)
   - **1.1 - 1.5**: Critical (High Liquidation Risk)
   - **< 1.1**: Forced Liquidation Warning
3. **Stress Test**: Apply -10% and -20% market shocks to collateral assets to compute projected margin health.

## Security & Guardrails
- Read-only simulation mode; no trade execution or asset transfer capabilities.
- Emits critical warnings when Margin Level drops below 1.30.
