import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { spawnSync } from "node:child_process";
import test, { before } from "node:test";
import { fileURLToPath } from "node:url";

import { buildEIP712Fixture } from "../scripts/generate-fixtures.mjs";

const skillDirectory = join(dirname(fileURLToPath(import.meta.url)), "..");
const cli = join(skillDirectory, "scripts", "verify-receipt.mjs");
let eip712Fixture;

before(async () => {
  eip712Fixture = await buildEIP712Fixture();
});

function fixture(name) {
  if (name === "eip712-valid.json") {
    return structuredClone(eip712Fixture);
  }
  return JSON.parse(
    readFileSync(join(skillDirectory, "fixtures", name), "utf8"),
  );
}

function runVerifier(input) {
  const temporaryDirectory = mkdtempSync(
    join(tmpdir(), "x402-receipt-verifier-test-"),
  );
  const inputPath = join(temporaryDirectory, "input.json");
  writeFileSync(inputPath, JSON.stringify(input));

  try {
    const result = spawnSync(process.execPath, [cli, "--input", inputPath], {
      cwd: skillDirectory,
      encoding: "utf8",
    });
    let output = null;
    try {
      output = JSON.parse(result.stdout);
    } catch {
      // Keep raw output available in the assertion diagnostic.
    }
    return {
      status: result.status,
      output,
      stdout: result.stdout,
      stderr: result.stderr,
    };
  } finally {
    rmSync(temporaryDirectory, { recursive: true, force: true });
  }
}

function hasError(result, code) {
  return result.output?.errors?.some(error => error.code === code) ?? false;
}

test("accepts a fresh authorized EIP-712 receipt", () => {
  const result = runVerifier(fixture("eip712-valid.json"));

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.equal(result.output.valid, true);
  assert.equal(result.output.format, "eip712");
  assert.equal(result.output.checks.signature.valid, true);
  assert.equal(result.output.checks.authorization.valid, true);
  assert.equal(result.output.checks.freshness.valid, true);
  assert.equal(result.output.checks.binding.valid, true);
  assert.equal(result.output.checks.transaction.valid, true);
});

test("accepts a fresh authorized JWS receipt with an explicit public JWK", () => {
  const result = runVerifier(fixture("jws-valid.json"));

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.equal(result.output.valid, true);
  assert.equal(result.output.format, "jws");
  assert.equal(result.output.checks.signature.valid, true);
  assert.equal(result.output.checks.authorization.valid, true);
});

test("rejects an EIP-712 payload changed after signing", () => {
  const input = fixture("eip712-valid.json");
  input.receipt.payload.resourceUrl =
    "https://receipts.example.test/tampered-data";

  const result = runVerifier(input);

  assert.equal(result.status, 2, result.stderr || result.stdout);
  assert.equal(result.output.valid, false);
  assert.equal(hasError(result, "UNAUTHORIZED_SIGNER"), true);
});

test("rejects a JWS payload changed after signing", () => {
  const input = fixture("jws-valid.json");
  const parts = input.receipt.signature.split(".");
  const last = parts[1].at(-1);
  parts[1] = `${parts[1].slice(0, -1)}${last === "A" ? "B" : "A"}`;
  input.receipt.signature = parts.join(".");

  const result = runVerifier(input);

  assert.equal(result.status, 2, result.stderr || result.stdout);
  assert.equal(result.output.valid, false);
  assert.equal(result.output.checks.authorization.valid, false);
  assert.equal(hasError(result, "SIGNATURE_INVALID"), true);
});

test("keeps signature validity separate from EIP-712 signer authorization", () => {
  const input = fixture("eip712-valid.json");
  const signer = input.trust.authorizedSigners[0];
  const replacement = signer.at(-1).toLowerCase() === "a" ? "b" : "a";
  input.trust.authorizedSigners = [`${signer.slice(0, -1)}${replacement}`];

  const result = runVerifier(input);

  assert.equal(result.status, 2, result.stderr || result.stdout);
  assert.equal(result.output.checks.signature.valid, true);
  assert.equal(result.output.checks.authorization.valid, false);
  assert.equal(hasError(result, "UNAUTHORIZED_SIGNER"), true);
});

test("rejects a valid JWS whose kid is not authorized", () => {
  const input = fixture("jws-valid.json");
  input.trust.jwsKeys[0].kid = "did:web:receipts.example.test#different-key";

  const result = runVerifier(input);

  assert.equal(result.status, 2, result.stderr || result.stdout);
  assert.equal(result.output.checks.signature.valid, false);
  assert.equal(result.output.checks.authorization.valid, false);
  assert.equal(hasError(result, "UNAUTHORIZED_KID"), true);
});

test("rejects stale and future receipts with distinct errors", () => {
  const stale = fixture("jws-valid.json");
  stale.policy.now = stale.policy.now + stale.policy.maxAgeSeconds + 1;
  const staleResult = runVerifier(stale);

  assert.equal(staleResult.status, 2, staleResult.stderr || staleResult.stdout);
  assert.equal(hasError(staleResult, "STALE_RECEIPT"), true);

  const future = fixture("eip712-valid.json");
  future.policy.now =
    future.receipt.payload.issuedAt - future.policy.maxFutureSkewSeconds - 1;
  const futureResult = runVerifier(future);

  assert.equal(futureResult.status, 2, futureResult.stderr || futureResult.stdout);
  assert.equal(hasError(futureResult, "FUTURE_RECEIPT"), true);
});

test("rejects unsupported versions and missing EIP-712 transaction fields", () => {
  const unsupported = fixture("eip712-valid.json");
  unsupported.receipt.payload.version = 2;
  const versionResult = runVerifier(unsupported);

  assert.equal(versionResult.status, 2, versionResult.stderr || versionResult.stdout);
  assert.equal(hasError(versionResult, "UNSUPPORTED_VERSION"), true);

  const missingTransaction = fixture("eip712-valid.json");
  delete missingTransaction.receipt.payload.transaction;
  const transactionResult = runVerifier(missingTransaction);

  assert.equal(
    transactionResult.status,
    2,
    transactionResult.stderr || transactionResult.stdout,
  );
  assert.equal(hasError(transactionResult, "MISSING_FIELD"), true);

  const wrongNetwork = fixture("eip712-valid.json");
  wrongNetwork.receipt.payload.network = "solana:mainnet";
  wrongNetwork.policy.expectedNetwork = "solana:mainnet";
  const networkResult = runVerifier(wrongNetwork);

  assert.equal(networkResult.status, 2, networkResult.stderr || networkResult.stdout);
  assert.equal(hasError(networkResult, "INVALID_NETWORK"), true);
});

test("rejects missing or non-DID JWS kids and private JWK input", () => {
  const noKidResult = runVerifier(fixture("jws-missing-kid.json"));

  assert.equal(noKidResult.status, 2, noKidResult.stderr || noKidResult.stdout);
  assert.equal(hasError(noKidResult, "MISSING_KID"), true);

  const nonDidKid = fixture("jws-valid.json");
  const parts = nonDidKid.receipt.signature.split(".");
  const header = JSON.parse(Buffer.from(parts[0], "base64url").toString("utf8"));
  header.kid = "https://receipts.example.test/fixture-ed25519";
  parts[0] = Buffer.from(JSON.stringify(header)).toString("base64url");
  nonDidKid.receipt.signature = parts.join(".");
  const nonDidKidResult = runVerifier(nonDidKid);

  assert.equal(
    nonDidKidResult.status,
    2,
    nonDidKidResult.stderr || nonDidKidResult.stdout,
  );
  assert.equal(hasError(nonDidKidResult, "INVALID_KID"), true);

  const privateJwk = fixture("jws-valid.json");
  privateJwk.trust.jwsKeys[0].publicJwk.d =
    "private-material-is-not-accepted";
  const privateJwkResult = runVerifier(privateJwk);

  assert.equal(
    privateJwkResult.status,
    2,
    privateJwkResult.stderr || privateJwkResult.stdout,
  );
  assert.equal(hasError(privateJwkResult, "PRIVATE_JWK_FORBIDDEN"), true);

  const symmetricJwk = fixture("jws-valid.json");
  symmetricJwk.trust.jwsKeys[0].publicJwk = {
    kty: "oct",
    k: "symmetric-secret-is-not-accepted",
  };
  const symmetricJwkResult = runVerifier(symmetricJwk);

  assert.equal(
    symmetricJwkResult.status,
    2,
    symmetricJwkResult.stderr || symmetricJwkResult.stdout,
  );
  assert.equal(hasError(symmetricJwkResult, "PRIVATE_JWK_FORBIDDEN"), true);
});

test("binds each authorized JWS kid to exact public-key policy", () => {
  const cases = [
    {
      code: "JWK_KID_MISMATCH",
      mutate(input) {
        input.trust.jwsKeys[0].publicJwk.kid =
          "did:web:receipts.example.test#attacker-key";
      },
    },
    {
      code: "JWK_ALGORITHM_MISMATCH",
      mutate(input) {
        input.trust.jwsKeys[0].publicJwk.alg = "ES256";
      },
    },
    {
      code: "JWK_USE_INVALID",
      mutate(input) {
        input.trust.jwsKeys[0].publicJwk.use = "enc";
      },
    },
    {
      code: "JWK_KEY_OPS_INVALID",
      mutate(input) {
        input.trust.jwsKeys[0].publicJwk.key_ops = ["sign"];
      },
    },
  ];

  for (const testCase of cases) {
    const input = fixture("jws-valid.json");
    testCase.mutate(input);
    const result = runVerifier(input);

    assert.equal(result.status, 2, result.stderr || result.stdout);
    assert.equal(hasError(result, testCase.code), true);
  }
});

test("rejects unsigned duplicate fields on the JWS receipt envelope", () => {
  const input = fixture("jws-valid.json");
  input.receipt.payload = { attackerControlled: true };

  const result = runVerifier(input);

  assert.equal(result.status, 2, result.stderr || result.stdout);
  assert.equal(hasError(result, "UNEXPECTED_RECEIPT_FIELD"), true);
});

test("enforces resource and transaction binding policy", () => {
  const wrongResource = fixture("jws-valid.json");
  wrongResource.policy.expectedResourceUrl =
    "https://receipts.example.test/other-resource";
  const resourceResult = runVerifier(wrongResource);

  assert.equal(resourceResult.status, 2, resourceResult.stderr || resourceResult.stdout);
  assert.equal(hasError(resourceResult, "RESOURCE_URL_MISMATCH"), true);

  const wrongTransaction = fixture("eip712-valid.json");
  wrongTransaction.policy.expectedTransaction = "fixture-transaction-999";
  const transactionResult = runVerifier(wrongTransaction);

  assert.equal(
    transactionResult.status,
    2,
    transactionResult.stderr || transactionResult.stdout,
  );
  assert.equal(hasError(transactionResult, "TRANSACTION_MISMATCH"), true);
});
