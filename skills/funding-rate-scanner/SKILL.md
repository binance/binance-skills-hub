# Funding Rate Scanner

Scan crypto funding rates and find arbitrage opportunities. No API key needed.

## Description

Automatically scan funding rates across all Binance perpetual contracts and identify negative funding rate opportunities where holding long positions earns funding fees.

## How It Works

1. Fetch all perpetual contract symbols from Binance Futures API
2. Get current funding rates for each symbol
3. Filter for negative rates (< -0.01%)
4. Calculate potential daily earnings
5. Alert on profitable opportunities

## Usage

When a user asks to scan funding rates, check Binance opportunities, or find negative funding:

```bash
node scan.js
```

Or programmatically:

```javascript
const scanner = require('./scan.js');
const opportunities = await scanner.scanFundingRates();
console.log(opportunities);
```

## API Endpoints

- `GET /fapi/v1/exchangeInfo` - Get all symbols
- `GET /fapi/v1/fundingRate` - Get funding rate history
- `GET /fapi/v1/premiumIndex` - Get current funding rate

## Output Format

```
🔥 Negative Funding Rate Opportunities

Symbol: BTCUSDT
Funding Rate: -0.05%
Next Funding: 2h 30m
Daily Earnings: 0.15% (3 payments)
Recommendation: Open long position

Symbol: ETHUSDT
Funding Rate: -0.03%
Next Funding: 2h 30m
Daily Earnings: 0.09% (3 payments)
Recommendation: Open long position
```

## Installation

No dependencies required. Uses native Node.js `https` module.

## Triggers

Use this skill when:
- User asks to "scan funding rates"
- User asks to "check Binance funding"
- User asks to "find negative funding opportunities"
- User asks about "funding rate arbitrage"

## Safety

- Read-only API calls (no trading)
- No API key required
- Rate limit: 1200 requests/minute (Binance public API)

## Metadata

- **Version**: 1.0.0
- **Author**: first-butler
- **License**: MIT
- **Tags**: binance, funding-rate, arbitrage, crypto
