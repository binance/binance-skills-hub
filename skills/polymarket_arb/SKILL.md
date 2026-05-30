# Polymarket Arbitrage Bot

Monitor Polymarket prediction markets for internal arbitrage opportunities.

## Description

Automatically monitors binary prediction markets (Yes/No) on Polymarket and executes arbitrage when price inefficiencies occur. In efficient markets, Yes + No prices should equal 1.0 - any deviation creates a risk-free profit opportunity.

## Use When

- User asks about prediction market arbitrage
- User wants to monitor Polymarket for price inefficiencies
- User mentions "Polymarket套利" or "prediction market arbitrage"
- User wants automated trading on Polymarket

## Do NOT Use When

- User asks about cross-platform arbitrage (different exchanges)
- User wants general crypto trading (use binance/spot instead)
- User mentions sports betting arbitrage
- Simple price checking without arbitrage intent

## How It Works

1. **Price Monitoring**: Continuously fetches orderbook data from Polymarket CLOB API
2. **Arbitrage Detection**: Calculates spread = 1 - (Yes_ask + No_ask)
3. **Execution**: When spread exceeds threshold, simultaneously buys both outcomes
4. **Settlement**: Guaranteed $1 payout regardless of outcome

## Example

```
User: 帮我监控Polymarket的BTC市场套利机会
Bot: [Starts monitoring, shows real-time prices and alerts on opportunities]
```

## Prerequisites

- Python 3.8+
- aiohttp
- Polymarket account with USDC on Polygon (for live trading)

## Files

- `scripts/polymarket_arb.py` - Main monitoring script
- `scripts/monitor.py` - Simplified price monitor
- `scripts/find_active.py` - Find active markets with liquidity

## Configuration

```python
CONFIG = {
    "min_spread": 0.02,    # Minimum spread to trigger (2%)
    "trade_size": 10,      # USDC per trade
    "check_interval": 5,   # Seconds between checks
    "dry_run": True,       # Set False for live trading
}
```

## API Reference

- Polymarket CLOB API: `https://clob.polymarket.com`
- Gamma API: `https://gamma-api.polymarket.com`
- Endpoint: `/markets` - List markets
- Endpoint: `/book?token_id=X` - Get orderbook

## Risk Warning

⚠️ **Important**:
- Markets may have low liquidity
- Prices can change during execution
- Requires USDC on Polygon network
- Test with dry_run=True first

## Related Skills

- `binance/spot` - For crypto exchange trading
- `binance-web3` - For Web3 wallet interactions
