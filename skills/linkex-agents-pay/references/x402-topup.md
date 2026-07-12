# x402 Top-Up Flow

End-to-end flow for funding a Linkex account with stablecoins via the x402
protocol (v2, `exact` scheme). Five steps: create order → get challenge →
sign with a wallet → submit settlement → verify quota.

Confirm with the user before step 1 (amount, network, token) and let the
wallet's own confirmation gate handle the signing consent.

---

## Step 0 — Wallet readiness (do this BEFORE creating the order)

Orders and signatures have short expiry windows; never create an order
against a wallet that cannot pay it yet.

```bash
baw wallet status --json    # expect CONNECTED; otherwise run the sign-in flow first
baw wallet balance --json   # check the intended network's token balance
```

If the balance on the target network is below the intended amount:

```bash
baw wallet address --json   # list per-chain addresses
```

Show the user the address for the target chain and ask them to fund it
(payment amount plus a small buffer; on BNB Smart Chain the Permit2 approve
gas is sponsored, so no native token is needed). Wait for the funds to
arrive, re-check the balance, and only then proceed to Step 1.

---

## Step 1 — Create a top-up order

```bash
curl -s -X POST "$LINKEX_BASE_URL/api/user/topup/x402/orders" \
  -H "Authorization: Bearer $LINKEX_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{ "amount_usd": 10, "network": "eip155:56", "symbol": "USDT" }'
```

| Field        | Required | Description                                                        |
|--------------|----------|--------------------------------------------------------------------|
| `amount_usd` | Yes      | USD amount, within `min_topup_usd`..`max_topup_usd` from config.   |
| `network`    | No       | CAIP-2 network id from config `networks[]`. Empty = default.       |
| `symbol`     | No       | Token symbol from that network's `symbols`. Empty = default.       |

Response `data`:

```json
{
  "order_id": 10086,
  "status": "pending",
  "expires_at": 1783142400,
  "amount_usd": 10,
  "challenge": { "x402Version": 2, "accepts": [ { ... } ] }
}
```

`challenge` is the x402 v2 `PaymentRequired` payload. Each `accepts[]` entry
carries `scheme`, `network`, `amount` (base units), `payTo`, `asset`
(token contract), `maxTimeoutSeconds`, and method details in `extra`
(e.g. `assetTransferMethod: permit2-exact` on BNB Smart Chain, EIP-712
domain `name`/`version` for EIP-3009 on Base). Treat it as opaque: pass it
to the wallet as-is.

---

## Step 2 — Preview with the wallet

With the `binance-agentic-wallet` skill:

```bash
baw x402-payment preview --paymentRequirements '<challenge JSON from step 1>' --json
```

Show the returned options (network, token, amount, balance, status) as a
table. Only `READY_TO_SIGN` options can proceed.

---

## Step 3 — Sign (after user confirmation)

```bash
baw x402-payment sign --paymentId <paymentId> --selectedIndex <index> --json
```

Returns:

```json
{
  "paymentHeaderName": "PAYMENT-SIGNATURE",
  "paymentHeaderValue": "<base64>",
  "approveTxHash": null,
  "signatureExpiresAt": 1783142400
}
```

- If `approveTxHash` is non-null (Permit2 first use), wait for that
  transaction to confirm before step 4.
- The signature is single-use and expires at `signatureExpiresAt`; if it
  expires, restart from step 2 (resume the order first if it also expired —
  see Recovery below).

---

## Step 4 — Submit the settlement to Linkex

`paymentHeaderValue` is base64-encoded JSON — the x402 payment payload.
Decode it and POST it as the request body (public endpoint, no auth):

```bash
printf '%s' "$PAYMENT_HEADER_VALUE" | base64 -d > /tmp/x402-payload.json
curl -s -X POST "$LINKEX_BASE_URL/api/x402/pay/<order_id>" \
  -H "Content-Type: application/json" \
  --data @/tmp/x402-payload.json
```

Success response `data`:

```json
{ "order_id": 10086, "status": "settled", "balance_added": 5000000, "new_balance": 103308639 }
```

Failure is HTTP 200 with `success: false` and a code such as
`X402_PAYLOAD_MISMATCH`, `X402_MISSING_SIGNATURE`, or `ORDER_NOT_FOUND` —
report it verbatim. Delete the temp payload file afterwards.

---

## Step 5 — Verify

Re-check `GET /api/user/self/balance` and confirm to the user:
amount credited, new `quota_usd`, order id, and (if the wallet reported one)
the on-chain transaction hash.

---

## Recovery

| Situation                              | Action                                                                 |
|----------------------------------------|------------------------------------------------------------------------|
| Order expired before payment           | `POST /api/user/topup/x402/orders/{id}/resume` re-issues the challenge; then restart from step 2. |
| Signature expired                      | Restart from step 2 (the order may still be valid).                    |
| Lost track of an order                 | `GET /api/user/topup/x402/orders` lists pending orders with ids.       |
| Payment submitted but balance unchanged| Wait ~30s and re-check; Linkex reconciles settlements against the chain. If still unchanged, surface the order id to the user for support. |

Do not create a duplicate order while one for the same purpose is still
pending — list and resume instead.
