# x402 Offer Receipt Verifier

A fixture-only reference skill and offline CLI for verifying receipts from the official x402 `offer-receipt` extension. It supports EIP-712 and compact JWS receipts while keeping cryptographic validity distinct from trust authorization.

The CLI does not connect a wallet, resolve a DID, query a blockchain, submit a payment, or make a network request. Dependency installation can require package-registry access.

## Requirements

- Node.js 20 or newer
- npm

Install the pinned dependencies without lifecycle scripts:

```bash
npm ci --ignore-scripts
```

Runtime verification uses `@x402/extensions` 2.23.0, the official Apache-2.0 x402 extension package. The direct `viem` development dependency is used by the EIP-712 fixture generator.

## Verify a Receipt

Create a JSON input using [references/input-format.md](references/input-format.md), then run:

```bash
node scripts/verify-receipt.mjs --input path/to/input.json
```

Run commands from this skill directory. For a copy-paste JWS smoke test:

```bash
npm run verify:jws
```

Exit codes:

| Code | Meaning |
| --- | --- |
| `0` | Every configured check passed |
| `1` | The input file could not be read or parsed |
| `2` | Verification completed and at least one check failed |

The result reports these checks independently:

| Check | What it establishes |
| --- | --- |
| `schema` | The signed payload uses version 1 and the supported strict fields |
| `signature` | The signature is cryptographically valid |
| `authorization` | The recovered signer or JWS `kid` matches explicit trust policy |
| `freshness` | `issuedAt` is within the configured age and clock-skew window |
| `binding` | Resource URL, network, and payer exactly match caller expectations |
| `transaction` | A signed transaction reference is present or equals an expected value |

Trust anchors and expected bindings must come from a source independent of the receipt. An attacker-controlled input file can replace its own `trust` or `policy` section, so do not treat an arbitrary bundled file as self-authenticating.

## Fixtures and Tests

Regenerate the deterministic fixtures and run the tests:

```bash
npm run fixtures
npm test
```

The generator rewrites the two tracked JWS fixtures and writes its EIP-712 fixture only to a newly created system temporary directory, whose path it prints. The tests also keep EIP-712 material in memory or temporary files and remove verifier inputs after each case. No wallet address is stored in a tracked fixture or test literal.

All fixtures use reserved `.test` names and reproducible test-only signing material. They are not production identities and must never receive funds or be used as trust anchors.

## Limitations

- No remote DID resolution
- No chain lookup or settlement proof
- No proof of the response body's contents or quality
- No proof of amount, asset, or destination beyond fields present in the signed extension payload

Protocol references:

- [x402 offer and receipt documentation](https://docs.x402.org/extensions/offer-receipt)
- [x402 offer and receipt specification used for this prototype](https://github.com/x402-foundation/x402/blob/230e6a9a7eebce22c911a0687d6f4e6d1ac019f7/specs/extensions/extension-offer-and-receipt.md)
