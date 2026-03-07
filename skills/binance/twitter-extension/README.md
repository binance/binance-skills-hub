# SuperBSC Twitter Extension

Browser extension that brings Binance Skills Terminal intelligence directly into Twitter/X.

## Features

- Detects cashtags ($BTC, $ETH, $SOL) in tweets automatically
- Injects real-time price badges with 24h change
- Side panel with full analysis: Funding Rate, Top Traders, Taker Pressure, Open Interest, Basis Spread, Account Ratio
- BSC Wallet integration (MetaMask connect, BNB/USDT balance, send BNB)
- 5 content templates for data-driven posts
- Post to Binance Square directly from Twitter
- Compose tweets with live market data
- Cross-post to both Square and Twitter simultaneously

## How It Works

1. Browse Twitter/X normally
2. Extension detects $CASHTAG mentions in tweets
3. Price badges appear next to cashtags showing live price + change
4. Click any badge to open the analysis side panel
5. View funding rates, top trader positioning, taker pressure, and more
6. Connect wallet to check BSC balance and send BNB
7. Post your analysis to Binance Square or compose a tweet

## Install

1. Clone this repository
2. Open `chrome://extensions` in Chrome
3. Enable "Developer mode"
4. Click "Load unpacked" and select the `extension/` directory
5. Go to Settings and enter your X-Square-OpenAPI-Key (for Square posting)

## Binance Skills Used

| Skill | Endpoint | Purpose |
|-------|----------|---------|
| Spot Ticker | `GET /api/v3/ticker/24hr` | Price, volume, 24h change, daily range |
| Premium Index | `GET /fapi/v1/premiumIndex` | Funding rate, mark price, index price |
| Top Trader Position | `GET /futures/data/topLongShortPositionRatio` | Top trader long/short positioning |
| Top Trader Account | `GET /futures/data/topLongShortAccountRatio` | Retail account sentiment |
| Taker Buy/Sell | `GET /futures/data/takerlongshortRatio` | Taker buy/sell pressure |
| Open Interest | `GET /fapi/v1/openInterest` | Current open interest |
| OI History | `GET /futures/data/openInterestHist` | OI trend detection (6h) |
| Basis Spread | `GET /futures/data/basis` | Contango/backwardation analysis |
| Futures 24hr | `GET /fapi/v1/ticker/24hr` | Futures price and volume |
| Square Post | `POST /bapi/composite/v1/public/pgc/openApi/content/add` | Post to Binance Square |

## Content Templates

- **Market Brief** - Daily summary with funding + taker + OI trend
- **Funding Snapshot** - Extreme funding rate analysis
- **Regime Change** - Market structure with basis + OI + traders
- **Smart Money Alert** - Price + traders + taker pressure
- **Custom Analysis** - All 9 data sources combined (default)

## Security

- API keys stored in encrypted browser storage
- No inline scripts (Manifest V3 CSP)
- All API calls routed through background service worker
- DOM injection uses textContent (XSS-safe)

## Tech Stack

- Manifest V3 (Chrome + Firefox)
- Vanilla JavaScript, no frameworks
- SuperBSC dark theme (Binance-inspired)
- Custom 3D-designed SVG icons
