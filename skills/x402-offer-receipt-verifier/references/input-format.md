# Verifier Input Format

The input is one JSON object containing a receipt plus caller-controlled trust and binding policy. All fields are public. Trust and policy must be assembled from an independent trusted source, not copied from an untrusted receipt bundle.

## EIP-712

```json
{
  "receipt": {
    "format": "eip712",
    "payload": {
      "version": 1,
      "network": "eip155:<chain-id>",
      "resourceUrl": "https://service.example/resource",
      "payer": "<expected-payer-identifier>",
      "issuedAt": 1893456000,
      "transaction": "<signed-transaction-reference>"
    },
    "signature": "<eip712-signature>"
  },
  "trust": {
    "authorizedSigners": ["<authorized-eip712-signer>"]
  },
  "policy": {
    "maxAgeSeconds": 300,
    "maxFutureSkewSeconds": 30,
    "expectedResourceUrl": "https://service.example/resource",
    "expectedNetwork": "eip155:<chain-id>",
    "expectedPayer": "<expected-payer-identifier>",
    "requireTransaction": true,
    "expectedTransaction": "<expected-transaction-reference>"
  }
}
```

EIP-712 signer comparison is case-insensitive. The official version 1 typed-data schema includes `transaction`; an empty value can still fail `requireTransaction` policy.

## JWS

```json
{
  "receipt": {
    "format": "jws",
    "signature": "<compact-jws>"
  },
  "trust": {
    "jwsKeys": [
      {
        "kid": "did:web:service.example#receipt-key",
        "publicJwk": {
          "kty": "OKP",
          "crv": "Ed25519",
          "x": "<public-key-material>",
          "kid": "did:web:service.example#receipt-key",
          "alg": "EdDSA",
          "use": "sig",
          "key_ops": ["verify"]
        },
        "allowedAlgorithms": ["EdDSA"]
      }
    ]
  },
  "policy": {
    "maxAgeSeconds": 300,
    "maxFutureSkewSeconds": 30,
    "expectedResourceUrl": "https://service.example/resource",
    "expectedNetwork": "eip155:<chain-id>",
    "expectedPayer": "<expected-payer-identifier>"
  }
}
```

The JWS protected header must contain a DID URL `kid`. The verifier selects exactly one `trust.jwsKeys` entry by that value, then uses only the public JWK and algorithms bound to that entry. When the JWK contains `kid`, `alg`, `use`, or `key_ops`, they must match the protected header and verification purpose. The verifier rejects private or symmetric key members and never resolves the DID URL remotely.

## Policy Details

- `expectedResourceUrl`, `expectedNetwork`, and `expectedPayer` are required and compared exactly.
- `maxAgeSeconds` defaults to `3600`.
- `maxFutureSkewSeconds` defaults to `60`.
- `now` is optional Unix time in seconds. Omit it for live verification; deterministic fixtures pin it.
- `requireTransaction` requires a non-empty signed reference.
- `expectedTransaction` performs exact string comparison only. It does not query a chain.

The output is JSON. Error objects have stable `code` and human-readable `message` fields. Treat the structured code as the automation contract.
