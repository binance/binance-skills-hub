# Spot Signal Scout

Read-only AI research skill that describes and compares observed technical market conditions for cryptocurrency Spot pairs.

> Informational technical analysis only. Not financial advice, not a trade recommendation, and not a prediction of future price movement.

## What it does

Spot Signal Scout identifies the market regime and common technical patterns on Spot pairs. It scores the quality of the technical evidence across structure, volume, momentum, confirmation and volatility, and liquidity and market quality, then keeps score, confidence, and analytical state separate. It also reports nearest observed support and resistance areas as descriptive reference levels.

Possible analytical states are `CRITERIA MET`, `CRITERIA PARTIALLY MET`, `WATCH`, `CRITERIA NOT MET`, and `INSUFFICIENT DATA`.

These states describe the technical evidence in the supplied data. They are not instructions to act.

## What it does not do

- Place, modify, or cancel orders
- Execute trades
- Give entry, exit, stop-loss, target, or position-size instructions
- Recommend trades or predict future price movement
- Request withdrawal permissions
- Request seed phrases or private keys
- Guarantee profits or outcomes

## Data

The skill is an analytical layer. It requires current or sufficiently recent market data from the agent's available market-data capabilities. If reliable data is unavailable, it must not fabricate values and should return an insufficient-data result.

## Example requests

- Describe the technical conditions on BTCUSDT, ETHUSDT and SOLUSDT on the 4H timeframe.
- Analyze BTCUSDT for breakout conditions.
- Compare these Spot pairs by quality of technical evidence.
