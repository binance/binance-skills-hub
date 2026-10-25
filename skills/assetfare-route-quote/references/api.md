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
- 65 offered directed conversion routes and 118 ordered provider steps
- direct-route-summary version `assetfare-direct-route-summary-v1`
- direct classification values `direct_protocol_only` and `external_intent`
- route aggregation flag scoped to the AssetFare engine only
- `external_intent` retained only as a compatibility enum; no current public route uses it
- server signing and submission both false
- fresh intended-amount comparison required
- documentation example USD 1,000, explicitly not a minimum or route-specific recommendation
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

Every current public route is `direct_protocol_only`, including Paxos Robinhood ingress. A response that marks a current route as `external_intent` fails closed.

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

The embedded 65-route/118-step contract is pinned to canonical SHA-256 `ee9237e324821bf625f22da048733d3708cac9e0047da4340e19cd6be597e063`. A bounded lossless JSON parser preserves integer lexemes above `Number.MAX_SAFE_INTEGER`, so ETH-denominated base units remain exact instead of being rounded during parsing.

## Failure contract

Public failures are reduced to fixed local error classes. Upstream response bodies, network details, and exception text are not exposed. A failed validation is not a partial quote and must never be used to build or execute a transaction.
