# OursMeme × Binance Agentic Wallet — 50-Tool Reference

Base MCP endpoint (Streamable HTTP): `https://devapi.ours.meme/api/baw/mcp`  
Direct HTTP tool endpoint: `POST https://devapi.ours.meme/api/baw/tools/<tool_name>`  
Full JSON schema discovery: `GET https://devapi.ours.meme/api/baw/tools`  
Live official contract allowlist: `GET https://devapi.ours.meme/api/baw/whitelist`

## 1. Binance Agentic Wallet Exclusive Tools (2)

| Tool | Kind | Purpose |
| :--- | :--- | :--- |
| `baw_get_setup` | Read-only | Inspects BNB gas, USDT, USDC (auto 6/18 decimals), exact Router allowance, `SubaccountRouter` status, and official contract allowlist. |
| `baw_build_approve` | Calldata builder | Generates exact-budget USDC `approve` calldata + `bawCli` commands (pass `usdcAmount: 0` to revoke; never uses `maxUint256`). |

## 2. Public & Market Data Tools (19 — Read-Only)

| Tool | Purpose |
| :--- | :--- |
| `get_rules` | Protocol fee, funding, LP, revenue routing, and settlement rules. |
| `get_overview` | Cross-underlying summary (BTC, ETH, XAU): mid-price, pool TVL, 24h volume, long/short ratio. |
| `get_stats` | Historical daily series for an underlying (`24h`, `7d`, `30d`). |
| `list_markets` | Filterable, sortable list of perpetual markets (TVL, 24h volume, OI, funding, LP APR, max leverage). |
| `get_market` | Detailed metrics for a single market by slug, symbol, or underlying. |
| `get_price` | Live bid/ask/mid quotes from Pyth / Hyperliquid oracle feeds. |
| `get_market_trades` | Recent perpetual executions in a market. |
| `get_candles` | OHLCV candlestick series for market token price. |
| `get_lp_history` | Historical LP deposits, withdrawals, and APR snapshots. |
| `list_creators` | Market creators directory with aggregate pool and volume stats. |
| `get_creator` | Detailed metrics for a specific creator. |
| `get_feed` | Recent protocol activity feed. |
| `get_liquidations` | Recent liquidation events across markets. |
| `get_leaderboard` | Trader PnL / volume leaderboard. |
| `get_market_positions` | Open interest and whale position distribution for a market. |
| `get_market_series` | Time-series volume, OI, and pool metrics for a market. |
| `get_token_holders` | Top holder distribution for a market's associated token. |
| `get_token_trades` | Recent spot token trades. |
| `get_trending` | Currently active/trending markets by volume and activity. |

## 3. Account, Economics & Quoting Tools (11 — Read-Only)

| Tool | Purpose |
| :--- | :--- |
| `get_account` | Wallet open positions, pending orders, LP shares, and balances. |
| `get_account_stats` | Historical trading performance and PnL summary for a wallet. |
| `get_account_trades` | Trade history for a wallet. |
| `get_account_rewards` | Claimable LP, dividend, mining, and referral rewards. |
| `get_account_referrals` | Referral statistics for a wallet. |
| `get_creator_economics` | Revenue distribution breakdown for a creator. |
| `get_market_economics` | Market fee routing and tokenomics breakdown. |
| `get_order` | Status lookup for a specific pending/executed order. |
| `get_agent_access` | Active status, remaining budget, and action cap for a `SubaccountRouter` subaccount. |
| `quote_token` | Spot token buy/sell quote estimation. |
| `get_launch_params` | Valid parameter bounds for launching or attaching a market. |

## 4. Unsigned Calldata Builders (18 — `baw contract-call preview -> execute`)

Every builder returns unsigned transaction calldata and `bawCli` commands. Agents must verify `--to` against `/api/baw/whitelist`, run `preview`, and obtain explicit user approval before calling `execute`.

- **Perpetual Trading (6):** `build_open_position`, `build_add_margin`, `build_remove_margin`, `build_close_position`, `build_set_tp_sl`, `build_cancel_orders`
- **Bounded Subaccount Automation (2):** `build_agent_authorize`, `build_agent_revoke`
- **Liquidity Provision (2):** `build_deposit_lp`, `build_withdraw_lp`
- **Token & Market Operations (8):** `build_buy_token`, `build_sell_token`, `build_claim`, `build_trigger_settlement`, `build_launch_market`, `build_attach_market`, `build_site_setup`, `build_testnet_faucet` (Testnet only)

## Rate Limits & Optional Wallet API Key

- Default public limits: `90` total RPM (`60` light RPM / `20` heavy RPM per IP).
- Optional wallet-scoped API key (`60` RPM / `2,000` calls per UTC day): `GET /api/v1/agent/keys/challenge?wallet=<WALLET_ADDRESS>` -> sign challenge -> `POST /api/v1/agent/keys`. Pass via `X-API-Key` header.
