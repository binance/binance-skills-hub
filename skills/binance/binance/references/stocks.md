## Account (auth required)

| Endpoint | Key params | Description |
|---|---|---|
| sign-us-equity-disclaimer | [] | Sign US Equity Disclaimer |


## Market Data

| Endpoint | Key params | Description |
|---|---|---|
| exchange-info | [`symbol`] | Exchange Info |
| latest-quote | `symbol` [] | Latest Quote |
| tokenized-assets | [] | Tokenized Assets |


## Tokenized (auth required)

| Endpoint | Key params | Description |
|---|---|---|
| tokenized-convert-history | [`start-time` `end-time` `last-id` `size`] | Tokenized Convert History |
| tokenized-convert-status | `issuer-request-id` `convert-type` [] | Tokenized Convert Status |
| tokenized-mint | `underlying-asset` `underlying-asset-amount` [`client-order-id`] | Tokenized Mint |
| tokenized-redeem | `tokenized-asset` `tokenized-asset-amount` [`client-order-id`] | Tokenized Redeem |


## Trade (auth required)

| Endpoint | Key params | Description |
|---|---|---|
| cancel-all-equity-orders | [] | Cancel All Equity Orders |
| cancel-equity-order | `order-id` [] | Cancel Equity Order |
| current-open-orders | [] | Current Open Orders |
| equity-order-detail | [`order-id` `client-order-id`] | Equity Order Detail |
| equity-order-history | `start-time` `end-time` [`symbol` `order-type` `side` `order-status` `current` `size`] | Equity Order History |
| equity-trade-history | `start-time` `end-time` [`symbol` `side` `order-id` `current` `size`] | Equity Trade History |
| place-equity-order | `symbol` `side` `order-type` [`quote-asset` `price` `quantity` `notional` `time-in-force` `trading-session` `wallet-type` `client-order-id` `tokenize`] | Place Equity Order |


## User Data Streams

| Endpoint | Key params | Description |
|---|---|---|
| create-renew-listen-key | [] | Create / Renew Listen Key |

### Enums

**convert-type:** `MINT` `REDEEM`
**order-type:** `MARKET` `LIMIT`
**side:** `BUY` `SELL`
**time-in-force:** `DAY` `GTC`
**trading-session:** `RTH` `EXTENDED` `24H`
**wallet-type:** `CARD` `MAIN`