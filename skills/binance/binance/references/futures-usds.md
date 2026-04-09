## Futures USD-S — `binance-cli futures-usds <endpoint>`

### Market Data

| Endpoint | Key params | Description |
|---|---|---|
| `test-connectivity` | — | Ping |
| `check-server-time` | — | Server time |
| `exchange-information` | — | Exchange rules |
| `order-book` | `symbol` [`limit`] | Order book |
| `recent-trades-list` | `symbol` [`limit`] | Recent trades |
| `kline-candlestick-data` | `symbol` `interval` [`startTime` `endTime` `limit`] | Klines |
| `mark-price` | [`symbol`] | Mark price & funding rate |
| `get-funding-rate-history` | [`symbol` `startTime` `endTime` `limit`] | Funding rate history |
| `ticker-24hr-price-change-statistics` | [`symbol`] | 24 hr stats |
| `symbol-price-ticker-v-2` | [`symbol`] | Latest price |
| `symbol-order-book-ticker` | [`symbol`] | Best bid/ask |
| `open-interest` | `symbol` | Open interest |
| `long-short-ratio` | `symbol` `period` [`limit` `startTime` `endTime`] | L/S ratio |
| `taker-buy-sell-volume` | `symbol` `period` [`limit` `startTime` `endTime`] | Taker volume |

**Intervals:** `1m` `3m` `5m` `15m` `30m` `1h` `2h` `4h` `6h` `8h` `12h` `1d` `3d` `1w` `1M`
**Periods:** `5m` `15m` `30m` `1h` `2h` `4h` `6h` `12h` `1d`

### Account (auth required)

| Endpoint | Key params | Description |
|---|---|---|
| `account-information-v-3` | — | Account overview |
| `futures-account-balance-v-3` | — | Asset balances |
| `position-information-v-3` | [`symbol`] | Open positions |
| `get-income-history` | [`symbol` `incomeType` `startTime` `endTime` `limit`] | PnL / income |
| `user-commission-rate` | `symbol` | Commission rates |
| `notional-and-leverage-brackets` | [`symbol`] | Leverage brackets |
| `get-current-position-mode` | — | Hedge vs one-way mode |
| `change-position-mode` | `dualSidePosition` | Toggle position mode |
| `get-current-multi-assets-mode` | — | Multi-asset margin status |

### Orders (auth required)

| Endpoint | Key params | Description |
|---|---|---|
| `new-order` | `symbol` `side` `type` + type-specific params | Place order |
| `test-order` | same as `new-order` | Test order |
| `query-order` | `symbol` [`orderId` or `origClientOrderId`] | Query order |
| `cancel-order` | `symbol` [`orderId` or `origClientOrderId`] | Cancel order |
| `cancel-all-open-orders` | `symbol` | Cancel all |
| `current-all-open-orders` | [`symbol`] | List open orders |
| `all-orders` | `symbol` [`orderId` `startTime` `endTime` `limit`] | Order history |
| `modify-order` | `symbol` `side` `quantity` `price` [`orderId`] | Modify order |
| `account-trade-list` | `symbol` [`startTime` `endTime` `limit`] | Trade history |
| `change-initial-leverage` | `symbol` `leverage` | Set leverage |
| `change-margin-type` | `symbol` `marginType` | `ISOLATED`\|`CROSSED` |
| `modify-isolated-position-margin` | `symbol` `amount` `type` | Adjust margin |

**Order types:** `MARKET` `LIMIT` `STOP` `STOP_MARKET` `TAKE_PROFIT` `TAKE_PROFIT_MARKET` `TRAILING_STOP_MARKET`
**Side:** `BUY` `SELL` | **positionSide:** `BOTH` `LONG` `SHORT` | **TIF:** `GTC` `IOC` `FOK` `GTX` `GTD`