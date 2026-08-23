#!/usr/bin/env node

import {
  createHash,
  createPrivateKey,
  createPublicKey,
  sign as signBytes,
} from "node:crypto";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import {
  createJWS,
  signReceiptEIP712,
} from "@x402/extensions/offer-receipt";
import { privateKeyToAccount } from "viem/accounts";

const here = dirname(fileURLToPath(import.meta.url));
const fixtureDirectory = join(here, "..", "fixtures");

const payload = {
  version: 1,
  network: "eip155:8453",
  resourceUrl: "https://receipts.example.test/premium-data",
  payer: "did:key:fixture-payer",
  issuedAt: 1893456000,
  transaction: "fixture-transaction-001",
};

function deterministicBytes(label) {
  return createHash("sha256").update(label, "utf8").digest();
}

function json(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function policyFor(receiptPayload) {
  return {
    now: 1893456030,
    maxAgeSeconds: 300,
    maxFutureSkewSeconds: 30,
    expectedResourceUrl: receiptPayload.resourceUrl,
    expectedNetwork: receiptPayload.network,
    expectedPayer: receiptPayload.payer,
    requireTransaction: true,
    expectedTransaction: receiptPayload.transaction,
  };
}

export async function buildEIP712Fixture(payloadOverrides = {}) {
  const receiptPayload = { ...payload, ...payloadOverrides };
  const privateKey = `0x${deterministicBytes(
    "x402-offer-receipt-verifier/eip712-fixture-only",
  ).toString("hex")}`;
  const account = privateKeyToAccount(privateKey);
  const signature = await signReceiptEIP712(receiptPayload, parameters =>
    account.signTypedData(parameters),
  );

  return {
    receipt: {
      format: "eip712",
      payload: receiptPayload,
      signature,
    },
    trust: {
      authorizedSigners: [account.address],
    },
    policy: policyFor(receiptPayload),
  };
}

function buildEd25519KeyPair() {
  const seed = deterministicBytes(
    "x402-offer-receipt-verifier/jws-fixture-only",
  );
  const pkcs8Prefix = Buffer.from("302e020100300506032b657004220420", "hex");
  const privateKey = createPrivateKey({
    key: Buffer.concat([pkcs8Prefix, seed]),
    format: "der",
    type: "pkcs8",
  });
  const publicJwk = createPublicKey(privateKey).export({ format: "jwk" });

  return {
    privateKey,
    publicJwk: {
      ...publicJwk,
      alg: "EdDSA",
      use: "sig",
    },
  };
}

export async function buildJWSFixture({ includeKid }) {
  const { privateKey, publicJwk } = buildEd25519KeyPair();
  const kid = "did:web:receipts.example.test#fixture-ed25519";
  const signature = await createJWS(payload, {
    format: "jws",
    algorithm: "EdDSA",
    kid: includeKid ? kid : undefined,
    async sign(input) {
      return signBytes(null, input, privateKey).toString("base64url");
    },
  });

  return {
    receipt: {
      format: "jws",
      signature,
    },
    trust: {
      jwsKeys: [
        {
          kid,
          publicJwk: {
            ...publicJwk,
            kid,
            key_ops: ["verify"],
          },
          allowedAlgorithms: ["EdDSA"],
        },
      ],
    },
    policy: policyFor(payload),
  };
}

async function main() {
  await mkdir(fixtureDirectory, { recursive: true });
  await Promise.all([
    writeFile(
      join(fixtureDirectory, "jws-valid.json"),
      json(await buildJWSFixture({ includeKid: true })),
    ),
    writeFile(
      join(fixtureDirectory, "jws-missing-kid.json"),
      json(await buildJWSFixture({ includeKid: false })),
    ),
  ]);

  const temporaryDirectory = await mkdtemp(
    join(tmpdir(), "x402-offer-receipt-verifier-eip712-"),
  );
  const temporaryEip712Path = join(temporaryDirectory, "eip712-valid.json");
  await writeFile(temporaryEip712Path, json(await buildEIP712Fixture()));
  process.stdout.write(
    `${JSON.stringify(
      {
        trackedJwsFixtures: fixtureDirectory,
        temporaryEip712Fixture: temporaryEip712Path,
      },
      null,
      2,
    )}\n`,
  );
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  await main();
}
