import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";

const root = resolve(import.meta.dirname, "..");
const checker = resolve(root, "scripts/check-qrcode-schema.mjs");

const validFixture = `schema_version=2
record_type=qr-scan-metadata
source_context=binance-alpha-screenshot
scanned_at=2026-08-19T15:14:15Z
rescanned_at=2026-08-19T15:28:38Z
rescan_method=zbarimg-offline
image_count=2
decoded_count=2
unique_payload_count=1
decoded_payload_consistency=all-identical
source_images=10001.jpg,10002.jpg
payload_storage=sha256-only
payload_sha256=d37d50d23337b11ccd57b221161a12f5d62f917e5608efab7be1c24f2af2169d
payload_scheme=https
payload_hostname=www.binance.com
payload_path=/download
payload_query_keys=utm_medium
payload_class=public-app-download-link
payload_opened=false
redirect_followed=false
host_verification=syntactic-only
phishing_verification=not-performed
contains_transaction_request=false
contains_recipient=false
contains_amount=false
contains_wallet_address=false
observed_tickers=META,NVDA
observed_ticker_by_image=10001:META,10002:NVDA
observed_screen=financials
observed_action_controls=buy,sell
action_controls_executed=false
financial_figures=not-recorded
action_context=ignored
network_request=disabled
transaction_capability=disabled
execution_capability=disabled
prohibited_fields=private_key,seed_phrase,api_key,binance_id,wallet_address,recipient_address,amount,order_id,side,quantity,price,transaction_payload
`;

function runFixture(name, contents) {
  const directory = mkdtempSync(join(tmpdir(), "qrcode-schema-"));
  const dataFile = join(directory, `${name}.data`);
  writeFileSync(dataFile, contents, "utf8");
  const result = spawnSync(process.execPath, [checker, "--data-file", dataFile], {
    encoding: "utf8",
  });
  rmSync(directory, { recursive: true, force: true });
  return result;
}

function expectPass(name, contents) {
  const result = runFixture(name, contents);
  if (result.status !== 0) throw new Error(`${name} should pass: ${result.stderr}`);
}

function expectFail(name, contents, expectedMessage) {
  const result = runFixture(name, contents);
  if (result.status === 0 || !result.stderr.includes(expectedMessage)) {
    throw new Error(`${name} should fail with ${expectedMessage}`);
  }
}

expectPass("valid", validFixture);
expectFail(
  "transaction",
  validFixture.replace("contains_transaction_request=false", "contains_transaction_request=true"),
  "contains_transaction_request must be false",
);
expectFail(
  "raw-payload",
  `${validFixture}raw_payload=https://example.invalid/download\n`,
  "unexpected field: raw_payload",
);
expectFail(
  "bad-hash",
  validFixture.replace(/payload_sha256=.*/, "payload_sha256=not-a-sha256"),
  "payload_sha256 must be a lowercase SHA-256 digest",
);

console.log("qrcode:test passed — valid, transaction, raw-payload, and digest cases verified offline.");
