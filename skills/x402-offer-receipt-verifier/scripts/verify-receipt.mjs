#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

import {
  extractJWSHeader,
  verifyReceiptSignatureEIP712,
  verifyReceiptSignatureJWS,
} from "@x402/extensions/offer-receipt";

const PAYLOAD_FIELDS = new Set([
  "version",
  "network",
  "resourceUrl",
  "payer",
  "issuedAt",
  "transaction",
]);
const CAIP2_PATTERN = /^[-a-z0-9]{3,8}:[-_a-zA-Z0-9]{1,32}$/;
const EIP155_PATTERN = /^eip155:[0-9]+$/;
const DID_URL_PATTERN =
  /^did:[a-z0-9]+:[^/?#\s]+(?:\/[^?#\s]*)?(?:\?[^#\s]*)?(?:#[^\s]*)?$/;
const PRIVATE_JWK_FIELDS = ["d", "p", "q", "dp", "dq", "qi", "oth", "k"];
const RECEIPT_FIELDS = {
  eip712: new Set(["format", "payload", "signature"]),
  jws: new Set(["format", "signature"]),
};

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function addError(errors, code, message) {
  if (!errors.some(error => error.code === code)) {
    errors.push({ code, message });
  }
}

function validateNonNegativeInteger(value, field, errors) {
  if (!Number.isSafeInteger(value) || value < 0) {
    addError(errors, "INVALID_POLICY", `${field} must be a non-negative integer`);
    return false;
  }
  return true;
}

function validatePayload(payload, format) {
  const errors = [];
  if (!isObject(payload)) {
    addError(errors, "MALFORMED_PAYLOAD", "Receipt payload must be an object");
    return errors;
  }

  const required = ["version", "network", "resourceUrl", "payer", "issuedAt"];
  if (format === "eip712") {
    required.push("transaction");
  }
  for (const field of required) {
    if (!Object.hasOwn(payload, field)) {
      addError(errors, "MISSING_FIELD", `Receipt payload is missing ${field}`);
    }
  }
  for (const field of Object.keys(payload)) {
    if (!PAYLOAD_FIELDS.has(field)) {
      addError(errors, "UNEXPECTED_FIELD", `Receipt payload has unexpected field ${field}`);
    }
  }

  if (Object.hasOwn(payload, "version") && payload.version !== 1) {
    addError(errors, "UNSUPPORTED_VERSION", "Only receipt payload version 1 is supported");
  }
  if (
    Object.hasOwn(payload, "network") &&
    (typeof payload.network !== "string" ||
      (format === "eip712"
        ? !EIP155_PATTERN.test(payload.network)
        : !CAIP2_PATTERN.test(payload.network)))
  ) {
    addError(
      errors,
      "INVALID_NETWORK",
      format === "eip712"
        ? "EIP-712 network must use eip155:<chainId>"
        : "network must be a CAIP-2 identifier",
    );
  }
  if (Object.hasOwn(payload, "resourceUrl")) {
    try {
      const resourceUrl = new URL(payload.resourceUrl);
      if (resourceUrl.protocol !== "https:") {
        throw new Error("HTTPS required");
      }
    } catch {
      addError(errors, "INVALID_FIELD", "resourceUrl must be an absolute HTTPS URL");
    }
  }
  if (
    Object.hasOwn(payload, "payer") &&
    (typeof payload.payer !== "string" || payload.payer.length === 0)
  ) {
    addError(errors, "INVALID_FIELD", "payer must be a non-empty string");
  }
  if (
    Object.hasOwn(payload, "issuedAt") &&
    (!Number.isSafeInteger(payload.issuedAt) || payload.issuedAt < 0)
  ) {
    addError(errors, "INVALID_FIELD", "issuedAt must be a non-negative integer");
  }
  if (
    Object.hasOwn(payload, "transaction") &&
    typeof payload.transaction !== "string"
  ) {
    addError(errors, "INVALID_FIELD", "transaction must be a string when present");
  }

  return errors;
}

function validateReceiptEnvelope(receipt, format) {
  const errors = [];
  if (!isObject(receipt) || !RECEIPT_FIELDS[format]) {
    return errors;
  }

  const allowedFields = RECEIPT_FIELDS[format];
  for (const field of Object.keys(receipt)) {
    if (!allowedFields.has(field)) {
      addError(
        errors,
        "UNEXPECTED_RECEIPT_FIELD",
        `${format} receipt has unexpected field ${field}`,
      );
    }
  }

  for (const field of allowedFields) {
    if (!Object.hasOwn(receipt, field)) {
      addError(
        errors,
        "MISSING_RECEIPT_FIELD",
        `${format} receipt is missing ${field}`,
      );
    }
  }

  return errors;
}

function validatePolicy(policy, errors) {
  if (!isObject(policy)) {
    addError(errors, "INVALID_POLICY", "policy must be an object");
    return null;
  }

  const now = policy.now ?? Math.floor(Date.now() / 1000);
  const maxAgeSeconds = policy.maxAgeSeconds ?? 3600;
  const maxFutureSkewSeconds = policy.maxFutureSkewSeconds ?? 60;
  validateNonNegativeInteger(now, "policy.now", errors);
  validateNonNegativeInteger(
    maxAgeSeconds,
    "policy.maxAgeSeconds",
    errors,
  );
  validateNonNegativeInteger(
    maxFutureSkewSeconds,
    "policy.maxFutureSkewSeconds",
    errors,
  );

  for (const field of [
    "expectedResourceUrl",
    "expectedNetwork",
    "expectedPayer",
  ]) {
    if (typeof policy[field] !== "string" || policy[field].length === 0) {
      addError(
        errors,
        "MISSING_EXPECTED_BINDING",
        `policy.${field} is required`,
      );
    }
  }
  if (
    Object.hasOwn(policy, "expectedTransaction") &&
    typeof policy.expectedTransaction !== "string"
  ) {
    addError(
      errors,
      "INVALID_POLICY",
      "policy.expectedTransaction must be a string",
    );
  }
  if (
    Object.hasOwn(policy, "requireTransaction") &&
    typeof policy.requireTransaction !== "boolean"
  ) {
    addError(
      errors,
      "INVALID_POLICY",
      "policy.requireTransaction must be a boolean",
    );
  }

  return { now, maxAgeSeconds, maxFutureSkewSeconds };
}

function checkFreshness(payload, policy, timing, errors) {
  if (!timing || !Number.isSafeInteger(payload?.issuedAt)) {
    return {
      valid: false,
      evaluatedAt: timing?.now ?? null,
      ageSeconds: null,
      maxAgeSeconds: timing?.maxAgeSeconds ?? null,
      maxFutureSkewSeconds: timing?.maxFutureSkewSeconds ?? null,
    };
  }

  const ageSeconds = timing.now - payload.issuedAt;
  if (ageSeconds > timing.maxAgeSeconds) {
    addError(errors, "STALE_RECEIPT", "Receipt is older than policy allows");
  }
  if (ageSeconds < -timing.maxFutureSkewSeconds) {
    addError(errors, "FUTURE_RECEIPT", "Receipt timestamp is too far in the future");
  }

  return {
    valid:
      ageSeconds <= timing.maxAgeSeconds &&
      ageSeconds >= -timing.maxFutureSkewSeconds,
    evaluatedAt: timing.now,
    ageSeconds,
    maxAgeSeconds: timing.maxAgeSeconds,
    maxFutureSkewSeconds: timing.maxFutureSkewSeconds,
  };
}

function checkBinding(payload, policy, errors) {
  const mismatches = [];
  const bindings = [
    ["resourceUrl", "expectedResourceUrl", "RESOURCE_URL_MISMATCH"],
    ["network", "expectedNetwork", "NETWORK_MISMATCH"],
    ["payer", "expectedPayer", "PAYER_MISMATCH"],
  ];

  for (const [payloadField, policyField, code] of bindings) {
    if (payload?.[payloadField] !== policy?.[policyField]) {
      mismatches.push(payloadField);
      addError(errors, code, `Receipt ${payloadField} does not match policy`);
    }
  }

  return { valid: mismatches.length === 0, mismatches };
}

function checkTransaction(payload, policy, errors) {
  const transaction = payload?.transaction;
  const present = typeof transaction === "string" && transaction.length > 0;

  if (policy?.requireTransaction === true && !present) {
    addError(
      errors,
      "TRANSACTION_REQUIRED",
      "Policy requires a transaction reference",
    );
  }
  if (
    Object.hasOwn(policy ?? {}, "expectedTransaction") &&
    transaction !== policy.expectedTransaction
  ) {
    addError(
      errors,
      "TRANSACTION_MISMATCH",
      "Receipt transaction does not match policy",
    );
  }

  const valid =
    !(policy?.requireTransaction === true && !present) &&
    !(
      Object.hasOwn(policy ?? {}, "expectedTransaction") &&
      transaction !== policy.expectedTransaction
    );
  let status = "not-required";
  if (Object.hasOwn(policy ?? {}, "expectedTransaction")) {
    status = valid ? "matched" : "mismatch";
  } else if (present) {
    status = "present-not-checked";
  } else if (policy?.requireTransaction === true) {
    status = "missing";
  }

  return {
    valid,
    status,
    present,
    note:
      status === "present-not-checked"
        ? "Reference is signed but no chain lookup was performed"
        : undefined,
  };
}

async function verifyEIP712(receipt, trust, errors) {
  const signature = { valid: false, signer: null };
  const authorization = {
    valid: false,
    method: "authorized-signers",
    subject: null,
  };

  if (!Array.isArray(trust?.authorizedSigners) || trust.authorizedSigners.length === 0) {
    addError(
      errors,
      "MISSING_AUTHORIZATION",
      "trust.authorizedSigners must contain at least one signer",
    );
    return { signature, authorization, payload: receipt?.payload ?? null };
  }
  if (
    trust.authorizedSigners.some(
      signer => typeof signer !== "string" || signer.length === 0,
    )
  ) {
    addError(
      errors,
      "INVALID_AUTHORIZATION",
      "Every authorized signer must be a non-empty string",
    );
    return { signature, authorization, payload: receipt?.payload ?? null };
  }

  try {
    const verified = await verifyReceiptSignatureEIP712(receipt);
    const signer = verified.signer.toLowerCase();
    signature.valid = true;
    signature.signer = signer;
    authorization.subject = signer;
    authorization.valid = trust.authorizedSigners.some(
      allowed => allowed.toLowerCase() === signer,
    );
    if (!authorization.valid) {
      addError(
        errors,
        "UNAUTHORIZED_SIGNER",
        "Recovered signer is not authorized by policy",
      );
    }
    return { signature, authorization, payload: verified.payload };
  } catch {
    addError(errors, "SIGNATURE_INVALID", "EIP-712 signature verification failed");
    return { signature, authorization, payload: receipt?.payload ?? null };
  }
}

async function verifyJWS(receipt, trust, errors) {
  const signature = { valid: false, algorithm: null, kid: null };
  const authorization = {
    valid: false,
    method: "trusted-jws-key",
    subject: null,
  };

  let header;
  try {
    header = extractJWSHeader(receipt.signature);
    signature.algorithm = header.alg ?? null;
    signature.kid = header.kid ?? null;
  } catch {
    addError(errors, "MALFORMED_JWS", "JWS compact serialization is malformed");
    return { signature, authorization, payload: null };
  }

  if (typeof header.kid !== "string" || header.kid.length === 0) {
    addError(errors, "MISSING_KID", "JWS protected header must contain kid");
    return { signature, authorization, payload: null };
  }
  if (!DID_URL_PATTERN.test(header.kid)) {
    addError(errors, "INVALID_KID", "JWS kid must be a DID URL");
    return { signature, authorization, payload: null };
  }
  if (!Array.isArray(trust?.jwsKeys) || trust.jwsKeys.length === 0) {
    addError(
      errors,
      "MISSING_AUTHORIZATION",
      "trust.jwsKeys must contain at least one trusted key policy",
    );
    return { signature, authorization, payload: null };
  }

  const matchingKeys = trust.jwsKeys.filter(
    entry => isObject(entry) && entry.kid === header.kid,
  );
  if (matchingKeys.length === 0) {
    addError(errors, "UNAUTHORIZED_KID", "JWS kid is not authorized by policy");
    return { signature, authorization, payload: null };
  }
  if (matchingKeys.length > 1) {
    addError(
      errors,
      "DUPLICATE_KID_POLICY",
      "JWS kid matches more than one trusted key policy",
    );
    return { signature, authorization, payload: null };
  }

  const trustedKey = matchingKeys[0];
  authorization.subject = header.kid;

  if (
    !Array.isArray(trustedKey.allowedAlgorithms) ||
    trustedKey.allowedAlgorithms.length === 0 ||
    trustedKey.allowedAlgorithms.some(algorithm => typeof algorithm !== "string")
  ) {
    addError(
      errors,
      "MISSING_ALGORITHM_POLICY",
      "Each trusted JWS key must declare allowedAlgorithms",
    );
    return { signature, authorization, payload: null };
  }
  if (!trustedKey.allowedAlgorithms.includes(header.alg)) {
    addError(
      errors,
      "ALGORITHM_NOT_ALLOWED",
      "JWS algorithm is not allowed by policy",
    );
    return { signature, authorization, payload: null };
  }
  if (!isObject(trustedKey.publicJwk)) {
    addError(
      errors,
      "MISSING_PUBLIC_JWK",
      "Each trusted JWS key must include publicJwk",
    );
    return { signature, authorization, payload: null };
  }
  if (
    PRIVATE_JWK_FIELDS.some(field =>
      Object.hasOwn(trustedKey.publicJwk, field),
    )
  ) {
    addError(
      errors,
      "PRIVATE_JWK_FORBIDDEN",
      "Only asymmetric public JWK material is accepted",
    );
    return { signature, authorization, payload: null };
  }
  if (
    Object.hasOwn(trustedKey.publicJwk, "kid") &&
    trustedKey.publicJwk.kid !== header.kid
  ) {
    addError(
      errors,
      "JWK_KID_MISMATCH",
      "Public JWK kid does not match the protected-header kid",
    );
    return { signature, authorization, payload: null };
  }
  if (
    Object.hasOwn(trustedKey.publicJwk, "alg") &&
    trustedKey.publicJwk.alg !== header.alg
  ) {
    addError(
      errors,
      "JWK_ALGORITHM_MISMATCH",
      "Public JWK algorithm does not match the protected-header algorithm",
    );
    return { signature, authorization, payload: null };
  }
  if (
    Object.hasOwn(trustedKey.publicJwk, "use") &&
    trustedKey.publicJwk.use !== "sig"
  ) {
    addError(
      errors,
      "JWK_USE_INVALID",
      "Public JWK use must be sig when present",
    );
    return { signature, authorization, payload: null };
  }
  if (
    Object.hasOwn(trustedKey.publicJwk, "key_ops") &&
    (!Array.isArray(trustedKey.publicJwk.key_ops) ||
      !trustedKey.publicJwk.key_ops.includes("verify"))
  ) {
    addError(
      errors,
      "JWK_KEY_OPS_INVALID",
      "Public JWK key_ops must include verify when present",
    );
    return { signature, authorization, payload: null };
  }

  let payload;
  try {
    payload = await verifyReceiptSignatureJWS(receipt, trustedKey.publicJwk);
    signature.valid = true;
    authorization.valid = true;
  } catch {
    addError(errors, "SIGNATURE_INVALID", "JWS signature verification failed");
    return { signature, authorization, payload: null };
  }

  return { signature, authorization, payload };
}

export async function verifyReceiptInput(input) {
  const errors = [];
  const receipt = input?.receipt;
  const trust = input?.trust;
  const policy = input?.policy;
  const format = receipt?.format ?? null;
  const checks = {
    schema: { valid: false },
    signature: { valid: false },
    authorization: { valid: false },
    freshness: { valid: false },
    binding: { valid: false, mismatches: [] },
    transaction: { valid: false, status: "not-checked", present: false },
  };

  if (!isObject(input)) {
    addError(errors, "INVALID_INPUT", "Input must be a JSON object");
  }
  if (!isObject(receipt)) {
    addError(errors, "MISSING_RECEIPT", "receipt must be an object");
  }
  if (format !== "eip712" && format !== "jws") {
    addError(errors, "UNSUPPORTED_FORMAT", "Receipt format must be eip712 or jws");
  }
  if (typeof receipt?.signature !== "string" || receipt.signature.length === 0) {
    addError(errors, "MISSING_SIGNATURE", "Receipt signature is required");
  }

  const envelopeErrors = validateReceiptEnvelope(receipt, format);
  envelopeErrors.forEach(error => addError(errors, error.code, error.message));

  const timing = validatePolicy(policy, errors);
  let payload = null;

  if (
    isObject(receipt) &&
    typeof receipt.signature === "string" &&
    receipt.signature.length > 0 &&
    format === "eip712" &&
    envelopeErrors.length === 0
  ) {
    const payloadErrors = validatePayload(receipt.payload, format);
    payloadErrors.forEach(error => addError(errors, error.code, error.message));
    checks.schema.valid = payloadErrors.length === 0;
    if (checks.schema.valid) {
      const verified = await verifyEIP712(receipt, trust, errors);
      checks.signature = verified.signature;
      checks.authorization = verified.authorization;
      payload = verified.payload;
    } else {
      payload = receipt.payload ?? null;
    }
  } else if (
    isObject(receipt) &&
    typeof receipt.signature === "string" &&
    receipt.signature.length > 0 &&
    format === "jws" &&
    envelopeErrors.length === 0
  ) {
    const verified = await verifyJWS(receipt, trust, errors);
    checks.signature = verified.signature;
    checks.authorization = verified.authorization;
    payload = verified.payload;
    if (payload !== null) {
      const payloadErrors = validatePayload(payload, format);
      payloadErrors.forEach(error => addError(errors, error.code, error.message));
      checks.schema.valid = payloadErrors.length === 0;
    }
  } else if (format === "eip712") {
    payload = receipt?.payload ?? null;
  }

  if (checks.schema.valid && payload !== null) {
    checks.freshness = checkFreshness(payload, policy, timing, errors);
    checks.binding = checkBinding(payload, policy, errors);
    checks.transaction = checkTransaction(payload, policy, errors);
  }

  const valid =
    errors.length === 0 &&
    Object.values(checks).every(check => check.valid === true);

  return {
    valid,
    format,
    payload,
    checks,
    errors,
    limitations: [
      "No remote DID resolution is performed",
      "No blockchain transaction lookup is performed",
      "A valid receipt is the server's signed statement and does not prove response quality",
    ],
  };
}

function parseInputPath(arguments_) {
  if (arguments_.length === 1 && arguments_[0] === "--help") {
    return { help: true, inputPath: null };
  }
  const inputIndex = arguments_.indexOf("--input");
  if (inputIndex === -1 || !arguments_[inputIndex + 1]) {
    throw new Error("Usage: node scripts/verify-receipt.mjs --input <file.json>");
  }
  return { help: false, inputPath: arguments_[inputIndex + 1] };
}

async function main() {
  try {
    const { help, inputPath } = parseInputPath(process.argv.slice(2));
    if (help) {
      process.stdout.write(
        "Usage: node scripts/verify-receipt.mjs --input <file.json>\n",
      );
      return;
    }
    const input = JSON.parse(await readFile(inputPath, "utf8"));
    const result = await verifyReceiptInput(input);
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    process.exitCode = result.valid ? 0 : 2;
  } catch {
    process.stdout.write(
      `${JSON.stringify(
        {
          valid: false,
          format: null,
          payload: null,
          checks: {},
          errors: [
            {
              code: "INPUT_ERROR",
              message: "Unable to read or parse verifier input",
            },
          ],
        },
        null,
        2,
      )}\n`,
    );
    process.exitCode = 1;
  }
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  await main();
}
