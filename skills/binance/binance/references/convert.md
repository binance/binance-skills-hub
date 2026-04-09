## Convert — `binance-cli convert <endpoint>`

| Endpoint | Key params | Auth | Description |
|---|---|---|---|
| `list-all-convert-pairs` | [`fromAsset` `toAsset`] | No | Available pairs |
| `send-quote-request` | `fromAsset` `toAsset` [`fromAmount` or `toAmount`] | Yes | Request quote |
| `accept-quote` | `quoteId` | Yes | Accept quote |
| `order-status` | [`orderId` or `quoteId`] | Yes | Query order |
| `get-convert-trade-history` | `startTime` `endTime` [`limit`] | Yes | Trade history |
| `place-limit-order` | `baseAsset` `quoteAsset` `limitPrice` `side` `expiredType` + amount | Yes | Place limit order |
| `cancel-limit-order` | `orderId` | Yes | Cancel limit order |
| `query-limit-open-orders` | — | Yes | Open limit orders |