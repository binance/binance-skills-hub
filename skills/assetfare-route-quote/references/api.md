# AssetFare quote-only API contract

## Fixed origin

The bundled client contacts only:

```text
https://api.assetfare.dev
```

It does not accept a custom origin and rejects redirects.

## Endpoints

| Method | Path | Purpose | Authentication |
|---|---|---|---|
| `GET` | `/v2/capabilities` | Current endpoints, amount guidance, fee policy, direct-route-summary contract, and no-sign/no-submit flags | None |
| `POST` | `/v2/quote` | Fresh quote for one exact route and USD amount | None |

No other AssetFare endpoint is in scope.

## Quote request

The request has exactly five fields:

| Field | Type | Meaning |
|---|---|---|
| `from_chain` | string | Source chain identifier from current capabilities |
| `from_token` | string | Source asset symbol for that chain |
| `to_chain` | string | Destination chain identifier from current capabilities |
| `to_token` | string | Destination asset symbol for that chain |
| `amount_usd` | number | Finite USD amount at or above 1 |

The client refuses unknown, missing, or repeated command-line fields before making a request. It never sends a wallet, recipient, credential, session, signature, or transaction.

## Required capability invariants

- API version `assetfare-multichain-api-v2`
- 76 directed conversion routes and 168 ordered provider steps
- direct-route-summary version `assetfare-direct-route-summary-v1`
- direct classification values `direct_protocol_only` and `external_intent`
- route aggregation flag scoped to the AssetFare engine only
- Across-only external-intent caveat for Robinhood ingress
- server signing and submission both false
- fresh intended-amount comparison required
- representative evaluation USD 1,000
- USD 1 reachability smoke classified as connectivity only
- current native-USDC evaluation guidance begins at USD 50, but is not a minimum or guarantee

## Quote projection

After validation, the client returns only:

- quote ID, timestamp, and TTL;
- requested route and amount;
- expected and minimum receive figures;
- token-path cost summary and unpriced-cost caveats;
- the strict ordered direct-route summary;
- an explicit quote-only execution boundary;
- neutral comparison guidance.

Raw route payloads and execution handoff fields are validated where needed but are not returned.

## Direct route summary semantics

`route_aggregator_used: false` describes AssetFare's route engine. It does not claim that every provider avoids internal liquidity aggregation.

`classification: direct_protocol_only` means every disclosed route step uses a direct protocol integration.

`classification: external_intent` identifies an Across Robinhood-ingress step. The response must also set `external_intent_protocol_used` and `provider_internal_dex_aggregation_possible` to true.

Every step binds:

- zero-based index;
- action (`swap` or `bridge`);
- provider;
- normalized `chain:asset` endpoints;
- expected and minimum base-unit input/output strings;
- AssetFare fee basis points;
- direct/external-intent classification;
- AssetFare aggregator-API use false.

Step amounts must be continuous. Exactly one step collects the one-basis-point AssetFare service fee. The duplicate raw route, risk block, and offer fee index must agree.

The embedded 76-route/168-step contract is pinned to canonical SHA-256 `3f6f64f66b6973f3da6ff53d1974c7b0cf725b0bc6bcc4554f0bfa5b55e7cff1`. A bounded lossless JSON parser preserves integer lexemes above `Number.MAX_SAFE_INTEGER`, so ETH-denominated base units remain exact instead of being rounded during parsing.

## Failure contract

Public failures are reduced to fixed local error classes. Upstream response bodies, network details, and exception text are not exposed. A failed validation is not a partial quote and must never be used to build or execute a transaction.
