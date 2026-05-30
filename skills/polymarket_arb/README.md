# Polymarket Arbitrage Skill

Internal arbitrage bot for Polymarket prediction markets.

## Installation

```bash
cd scripts
pip install -r requirements.txt
```

## Usage

### 1. Find Active Markets

```bash
python find_active.py
```

### 2. Monitor Prices

```bash
python monitor.py
```

### 3. Multi-Market Monitor

```bash
python multi_monitor.py
```

## How It Works

In binary prediction markets (Yes/No), efficient prices should satisfy:
```
Yes_price + No_price = 1.0
```

When this equality breaks:
- If sum < 1: Buy both outcomes → Guaranteed profit
- If sum > 1: Sell both (if you hold them) → Guaranteed profit

## Example

```
Yes: 0.48 | No: 0.49
Sum: 0.97
Spread: 3%
→ Buy $100 of Yes + $100 of No = $200 cost
→ Receive $100 regardless of outcome
→ Profit: $100 * 0.03 = $3
```

## Configuration

Edit the CONFIG dict in scripts:

```python
CONFIG = {
    "min_spread": 0.02,    # Minimum 2% spread
    "trade_size": 10,      # $10 per trade
    "dry_run": True,       # Simulation mode
}
```

## License

MIT
