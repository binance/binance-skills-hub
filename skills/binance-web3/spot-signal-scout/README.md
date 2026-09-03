# Spot Signal Scout

Read-only AI research skill for cryptocurrency Spot-market setup analysis.

## What it does

Spot Signal Scout identifies market regime and common Spot setups, scores structure, volume, momentum, confirmation, risk/reward, and market quality, then separates score from confidence and decision state.

Possible states are `CONFIRMED SETUP`, `WAIT FOR CONFIRMATION`, `WATCH`, `NO TRADE`, and `AVOID`.

## What it does not do

- Place, modify, or cancel orders
- Execute trades
- Request withdrawal permissions
- Request seed phrases or private keys
- Guarantee profits or outcomes

## Data

The skill is an analytical layer. It requires current or sufficiently recent market data from the agent's available market-data capabilities. If reliable data is unavailable, it must not fabricate values and should return an insufficient-data result.

## Example requests

- Scan BTCUSDT, ETHUSDT and SOLUSDT on 4H for Spot setups.
- Analyze BTCUSDT for a breakout.
- Rank these Spot pairs and tell me which are only watchlist candidates.
