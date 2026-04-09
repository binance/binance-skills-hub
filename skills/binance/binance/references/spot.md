## Spot — `binance-cli spot <endpoint>`

### Market Data

| Endpoint | Key params | Description |
|---|---|---|
| `ping` | — | Connectivity test |
| `time` | — | Server time |
| `exchange-info` | `symbol` | Exchange rules & symbol info |
| `depth` | `symbol` [`limit`] | Order book |
| `ticker-price` | [`symbol`] | Latest price |
| `ticker-book-ticker` | [`symbol`] | Best bid/ask |
| `ticker24hr` | [`symbol`] [`type`] | 24 hr price change stats |
| `ticker` | [`symbol`] [`windowSize`] | Rolling window stats |
| `klines` | `symbol` `interval` [`startTime` `endTime` `limit`] | Candlestick data |
| `avg-price` | `symbol` | Current average price |
| `get-trades` | `symbol` [`limit`] | Recent trades |
| `agg-trades` | `symbol` [`fromId` `startTime` `endTime` `limit`] | Aggregated trades |

### Account (auth required)

| Endpoint | Key params | Description |
|---|---|---|
| `get-account` | [`omitZeroBalances`] | Balances & account info |
| `account-commission` | `symbol` | Commission rates |
| `my-trades` | `symbol` [`orderId` `startTime` `endTime` `fromId` `limit`] | Trade history |
| `rate-limit-order` | — | Unfilled order count |

### Orders (auth required)

| Endpoint | Key params | Description |
|---|---|---|
| `new-order` | `symbol` `side` `type` + type-specific params | Place order |
| `order-test` | same as `new-order` | Test order (no execution) |
| `get-order` | `symbol` [`orderId` or `origClientOrderId`] | Query order |
| `delete-order` | `symbol` [`orderId` or `origClientOrderId`] | Cancel order |
| `delete-open-orders` | `symbol` | Cancel all open orders |
| `get-open-orders` | [`symbol`] | List open orders |
| `all-orders` | `symbol` [`orderId` `startTime` `endTime` `limit`] | All orders history |
| `order-cancel-replace` | `symbol` `side` `type` `cancelReplaceMode` + params | Cancel + replace |
| `order-amend-keep-priority` | `symbol` `newQty` [`orderId`] | Amend order qty |

**Order types:** `MARKET` `LIMIT` `STOP_LOSS` `STOP_LOSS_LIMIT` `TAKE_PROFIT` `TAKE_PROFIT_LIMIT` `LIMIT_MAKER`
**Side:** `BUY` `SELL` | **TIF:** `GTC` `IOC` `FOK`