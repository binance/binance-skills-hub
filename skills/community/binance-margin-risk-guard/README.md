# Binance Margin Risk Guard

> Real-time liquidation distance, margin health scoring, and portfolio stress-testing for Binance Cross & Isolated Margin accounts.

`binance-margin-risk-guard` is an MCP-compatible skill designed for AI agents operating on the Binance Skills Hub. It enables conversational agents to evaluate account safety ratios, simulate market drawdowns, and model pre-trade margin impacts without making state-changing transactions.

## Features
- **Margin Health Scoring**: Categorizes account status into Safe (>2.0), Moderate (1.5–2.0), Critical (1.1–1.5), and Liquidation Risk (<1.1).
- **Downside Stress Testing**: Models -10% and -20% instant market crash scenarios across collateral assets.
- **Pre-Trade Impact Analysis**: Calculates how taking on additional leverage alters account health before executing trades.

## License
[MIT License](LICENSE)
