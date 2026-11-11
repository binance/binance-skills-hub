# Binance Margin Risk Guard

Read-only AI research skill that calculates margin level, distance to Binance's documented margin call and liquidation thresholds, and simple price-shock scenarios for Binance Cross and Isolated Margin accounts.

> Informational analysis only. Not financial advice.

## What it does

- Calculates Margin Level from the values you provide
- Compares it with the documented thresholds for your margin mode and leverage tier
- Models hypothetical price drops (default -10% and -20%)

## What it does not do

- Place, modify, or cancel orders
- Request API keys with trading or withdrawal permissions, private keys, or seed phrases
- Give trade recommendations or guarantee outcomes

## Example requests

- My Cross Margin Classic 3x account has 12,000 USDT in assets and 8,000 USDT in liabilities. How close am I to a margin call?
- What happens to my margin level if my ETH collateral drops 15%?

## License

MIT. See [LICENSE](LICENSE).
