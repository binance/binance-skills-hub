## Future Algo (auth required)

| Endpoint | Key params | Description |
|---|---|---|
| cancel-algo-order-future-algo | [`algo-id` `client-algo-id`] | Cancel Futures Algo Order |
| query-current-algo-open-orders-future-algo | [] | Query Current Futures Algo Open Orders |
| query-historical-algo-orders-future-algo | [`symbol` `side` `start-time` `end-time` `page` `page-size`] | Query Historical Futures Algo Orders |
| query-sub-orders-future-algo | `algo-id` [`page` `page-size`] | Query Futures Sub Orders |
| time-weighted-average-price-future-algo | `symbol` `side` `quantity` `duration` [`position-side` `client-algo-id` `reduce-only` `limit-price`] | Time-Weighted Futures Average Price (Twap) New Order |
| volume-participation-future-algo | `symbol` `side` `quantity` `urgency` [`position-side` `client-algo-id` `reduce-only` `limit-price`] | Volume Participation New Order |


## Spot Algo (auth required)

| Endpoint | Key params | Description |
|---|---|---|
| cancel-algo-order-spot-algo | [`algo-id` `client-algo-id`] | Cancel Spot Algo Order |
| query-current-algo-open-orders-spot-algo | [] | Query Current Spot Algo Open Orders |
| query-historical-algo-orders-spot-algo | [`symbol` `side` `start-time` `end-time` `page` `page-size`] | Query Historical Spot Algo Orders |
| query-sub-orders-spot-algo | `algo-id` [`page` `page-size`] | Query Spot Sub Orders |
| time-weighted-average-price-spot-algo | `symbol` `side` `quantity` `duration` [`client-algo-id` `limit-price`] | Time-Weighted Spot Average Price(Twap) New Order |
| volume-participation | `symbol` `side` `quantity` `urgency` [`client-algo-id` `vp-time-limit`] | Volume Participation New Order |

### Enums

**position-side:** `BOTH` `LONG` `SHORT`
**side:** `BUY` `SELL`
**urgency:** `LOW` `MEDIUM` `HIGH`