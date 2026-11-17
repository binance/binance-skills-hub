---
name: binance-margin-risk-guard
description: Read-only skill that calculates margin level, distance to Binance's documented margin call and liquidation thresholds, and simple price-shock scenarios for Binance Cross and Isolated Margin accounts, using account data the user provides. Informational only. Never places orders and never gives trade advice.
version: 1.0.0
license: MIT
metadata:
  author: AlphaZolo
  tags:
    - binance
    - margin
    - risk-analysis
    - liquidation-distance
---

# Binance Margin Risk Guard

> Informational analysis only. Not financial advice. Margin trading carries a risk of rapid and total loss.

## Purpose

Help a user understand how close a Binance margin account is to the documented margin call and liquidation thresholds, and how a price drop would change that distance. The skill describes numbers. It does not tell the user what to do.

The skill is **read-only**. It must never place, modify, or cancel orders, and must never request API keys with trading or withdrawal permissions, private keys, or seed phrases.

## When to use

Use this skill when the user asks to:
- check their margin level or how close they are to a margin call or liquidation
- estimate a liquidation price for a margin position they describe
- model a price drop (for example, "what happens to my margin level if ETH falls 15%?")

## Inputs

Use only values the user supplies or that a connected, read-only data source returns:
- margin mode (Cross Margin Classic, Cross Margin Pro, or Isolated Margin) and leverage tier
- total asset value (A), in a single quote currency
- total liabilities plus outstanding interest (L)
- the value of non-stablecoin collateral (V), for scenarios

If a required value is missing, ask for it. Never invent balances, prices, or thresholds. If the account reports its own margin call or liquidation level, use that value instead of the table below.

## Margin level

Margin Level = A / L

where A is the total asset value and L is total liabilities plus outstanding interest (Binance's documented definition for Cross Margin).

## Documented thresholds

Thresholds depend on the margin mode. Use the row that matches the user's account. Last checked against Binance documentation on 2026-11-11. Binance may change these, so prefer account-reported values.

| Mode | Leverage | Margin call at or below | Liquidation at or below |
|---|---|---:|---:|
| Cross Margin Classic | 3x | 1.3 | 1.1 |
| Cross Margin Classic | 5x | 1.16 | 1.1 |
| Cross Margin Pro | 10x / 20x | 1.5 (default; user can set 1.3 to 2) | 1.0 |
| Isolated Margin | 3x | 1.22 | 1.18 |
| Isolated Margin | 5x | 1.19 | see Binance Isolated Margin FAQ |
| Isolated Margin | 10x | 1.1 | see Binance Isolated Margin FAQ |

If the mode or tier is not in the table, say the threshold is unknown and ask the user for the value shown in their account.

## Reporting status

Describe where the margin level sits relative to the thresholds for that mode:
- `ABOVE MARGIN CALL LEVEL`: margin level is higher than the margin call ratio
- `IN MARGIN CALL ZONE`: margin level is at or below the margin call ratio but above the liquidation level
- `AT OR BELOW LIQUIDATION LEVEL`: margin level is at or below the liquidation level

These are descriptions of the account state, not instructions.

## Distance and price-shock scenarios

Let T be a threshold from the table. If non-stable collateral worth V falls by a fraction d while liabilities stay constant:

- New asset value: A' = A - (V x d)
- New margin level: A' / L
- Fall in V needed to reach T: d = (A - T x L) / V

Report scenarios at -10% and -20% by default, plus any shock the user asks for. Label every scenario as hypothetical. State that interest accrual, collateral haircuts, slippage, and fast markets can change the result, and that a margin level can reach liquidation immediately after touching the margin call level.

## Output

1. Inputs used (mode, leverage tier, A, L, V)
2. Current margin level and status
3. Threshold table row used, with the source
4. Scenario table (shock, projected margin level, status)
5. Limitations that apply
6. Disclaimer

## Limitations

- Results are only as accurate as the data supplied. The skill does not fetch live balances unless a read-only data source is connected.
- Binance's own liquidation price and margin level in the account are authoritative.
- Collateral haircuts, interest, and open-order effects can change the real margin level.

## Sources

- How Are Liquidations Triggered on Binance Margin: https://www.binance.com/en/support/faq/how-are-liquidations-triggered-on-binance-margin-c08f0ef718214f40b651a2018ce1f71b
- Binance Margin Level and Risk Control: https://www.binance.com/en/support/faq/binance-margin-level-and-risk-control-360030493931
- Cross Margin Pro: https://www.binance.com/en/support/faq/12a78d8aa813470f96be283b45f75410
- Margin Level formula (Cross Margin): https://www.binance.com/support/faq/360041505471

Informational analysis only. Not financial advice. Digital assets are volatile and carry risk of loss.
