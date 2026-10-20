## Market Data

| Endpoint | Key params | Description |
|---|---|---|
| get-dual-investment-product-list | `option-type` `exercised-coin` `invest-coin` [`page-size` `page-index`] | Get Dual Investment product list |


## Trade (auth required)

| Endpoint | Key params | Description |
|---|---|---|
| check-dual-investment-accounts | [] | Check Dual Investment accounts |
| get-dual-investment-positions | [`status` `page-size` `page-index`] | Get Dual Investment positions |
| subscribe-dual-investment-products | `id` `order-id` `deposit-amount` [] | Subscribe Dual Investment products |

### Enums

**option-type:** `CALL` `PUT`
**status:** `PENDING` `PURCHASE_SUCCESS` `SETTLED` `PURCHASE_FAIL` `REFUNDING` `REFUND_SUCCESS` `SETTLING`