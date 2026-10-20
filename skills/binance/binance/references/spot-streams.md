## Default

| Endpoint | Key params | Description |
|---|---|---|
| agg-trade | `symbol` [`id`] | Aggregate Trade Streams |
| all-market-rolling-window-ticker | `window-size` [`id`] | All Market Rolling Window Statistics Streams |
| all-mini-ticker | [`id`] | All Market Mini Tickers Stream |
| avg-price | `symbol` [`id`] | Average Price |
| block-trade | `symbol` [`id`] | Block Trade Streams |
| book-ticker | `symbol` [`id`] | Individual Symbol Book Ticker Streams |
| diff-book-depth | `symbol` [`id` `update-speed`] | Diff. Depth Stream |
| kline | `symbol` `interval` [`id`] | Kline/Candlestick Streams for UTC |
| kline-offset | `symbol` `interval` [`id`] | Kline/Candlestick Streams with timezone offset |
| mini-ticker | `symbol` [`id`] | Individual Symbol Mini Ticker Stream |
| partial-book-depth | `symbol` `levels` [`id` `update-speed`] | Partial Book Depth Streams |
| reference-price | `symbol` [`id`] | Reference Price Streams |
| rolling-window-ticker | `symbol` `window-size` [`id`] | Individual Symbol Rolling Window Statistics Streams |
| ticker | `symbol` [`id`] | Individual Symbol Ticker Streams |
| trade | `symbol` [`id`] | Trade Streams |

## Other streams

| Endpoint | Key params | Description |
|---|---|---|
| user-data | listen-key [id] | Subscribes to the user data WebSocket stream using the provided listen key. |
### Enums

**interval:** `1s` `1m` `3m` `5m` `15m` `30m` `1h` `2h` `4h` `6h` `8h` `12h` `1d` `3d` `1w` `1M`
**levels:** `5` `10` `20`
**update-speed:** `100ms`
**window-size:** `1h` `4h` `1d`