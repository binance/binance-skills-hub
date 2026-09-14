---
name: x402-offer-receipt-verifier
description: Verify x402 offer-receipt artifacts offline when a user supplies an EIP-712 or JWS receipt plus independently trusted public verification policy. Use for signature, signer or kid authorization, freshness, resource binding, and transaction-reference checks. Do not use to make payments or claim settlement or response quality.
version: 0.1.0
license: MIT
metadata:
  author: JasonColapietro
  version: 0.1.0
---

# x402 Offer Receipt Verifier

Verify an x402 `offer-receipt` artifact without connecting a wallet, resolving a DID, or querying a blockchain.

Run commands from the directory containing this `SKILL.md`. The scripts require Node.js 20 or newer and npm. A first-time dependency install can access the npm registry; receipt verification itself makes no network request.

## Workflow

1. Identify whether the receipt uses `eip712` or `jws`.
2. Obtain trust anchors and expected bindings from a source independent of the receipt. Never treat trust data bundled by an untrusted sender as authoritative.
3. Build the public-only input described in [references/input-format.md](references/input-format.md). Omit `policy.now` for a live check so the verifier uses current Unix time.
4. Install the pinned dependencies once with `npm ci --ignore-scripts` if they are not already present.
5. Run `node scripts/verify-receipt.mjs --input <file.json>`.
6. Report signature validity and authorization separately. Also report freshness, resource binding, and transaction-reference status.
7. Treat exit `0` as all configured checks passing, exit `2` as a completed verification with one or more failed checks, and exit `1` as unreadable or malformed input.

## Required Safety Boundaries

- Accept only public verification material. Never request a private key, seed phrase, wallet connection, API credential, or symmetric JWK.
- Require explicit authorized signers for EIP-712. For JWS, select one exact trusted key entry by DID URL `kid`, then enforce that entry's public JWK and allowed algorithms.
- Use exact expected `resourceUrl`, `network`, and `payer` bindings. Do not infer them from the signed receipt.
- Enforce both maximum age and future-clock-skew limits.
- Do not fetch remote DID documents or keys automatically.
- Do not claim a transaction was settled. A transaction value is checked only for presence or exact string equality.
- Do not claim the response body was correct, complete, valuable, or delivered. A valid receipt is only the server's signed statement.

## Development Checks

Run `npm run verify:jws` for a copy-paste smoke test. Run `npm run fixtures` to regenerate deterministic tracked JWS fixtures and create the EIP-712 fixture only in a printed system temporary path. Run `npm test` for all negative and positive verification cases. Fixture signing material is public test material derived inside the generator and must never be used for funds or production trust.
