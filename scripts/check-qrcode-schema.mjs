import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

function fail(message) {
  console.error(`qrcode:check failed — ${message}`);
  process.exitCode = 1;
}

function getDataPath() {
  const args = process.argv.slice(2);
  if (args.length === 2 && args[0] === "--data-file" && args[1]) {
    return resolve(args[1]);
  }
  fail("usage: bun run qrcode:check -- --data-file <path>");
  return "";
}

function parseData(path) {
  const data = new Map();
  const lines = readFileSync(path, "utf8").split(/\r?\n/);

  for (const [index, rawLine] of lines.entries()) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const separator = line.indexOf("=");
    if (separator <= 0) {
      fail(`line ${index + 1} must use key=value format`);
      continue;
    }
    const key = line.slice(0, separator);
    const value = line.slice(separator + 1);
    if (data.has(key)) {
      fail(`duplicate field: ${key}`);
      continue;
    }
    data.set(key, value);
  }

  return data;
}

function list(value) {
  return value ? value.split(",").filter(Boolean) : [];
}

function sameMembers(left, right) {
  return left.length === right.length && left.every((item, index) => item === right[index]);
}

const dataPath = getDataPath();
if (dataPath && !existsSync(dataPath)) {
  fail("test QR metadata file is missing");
} else if (dataPath && !process.exitCode) {
  const data = parseData(dataPath);
  const required = {
    schema_version: "2",
    record_type: "qr-scan-metadata",
    source_context: "binance-alpha-screenshot",
    rescan_method: "zbarimg-offline",
    payload_storage: "sha256-only",
    payload_scheme: "https",
    payload_hostname: "www.binance.com",
    payload_path: "/download",
    payload_class: "public-app-download-link",
    payload_opened: "false",
    redirect_followed: "false",
    host_verification: "syntactic-only",
    phishing_verification: "not-performed",
    contains_transaction_request: "false",
    contains_recipient: "false",
    contains_amount: "false",
    contains_wallet_address: "false",
    observed_screen: "financials",
    observed_action_controls: "buy,sell",
    action_controls_executed: "false",
    financial_figures: "not-recorded",
    action_context: "ignored",
    network_request: "disabled",
    transaction_capability: "disabled",
    execution_capability: "disabled",
    prohibited_fields:
      "private_key,seed_phrase,api_key,binance_id,wallet_address,recipient_address,amount,order_id,side,quantity,price,transaction_payload",
  };
  const optional = new Set(["scanned_at", "rescanned_at"]);
  const allowed = new Set([
    ...Object.keys(required),
    ...optional,
    "image_count",
    "decoded_count",
    "unique_payload_count",
    "decoded_payload_consistency",
    "source_images",
    "payload_sha256",
    "payload_query_keys",
    "observed_tickers",
    "observed_ticker_by_image",
  ]);

  for (const key of data.keys()) {
    if (!/^[a-z][a-z0-9_]*$/.test(key)) fail(`invalid field name: ${key}`);
    if (!allowed.has(key)) fail(`unexpected field: ${key}`);
  }
  for (const [key, expected] of Object.entries(required)) {
    if (data.get(key) !== expected) fail(`${key} must be ${expected}`);
  }
  for (const key of optional) {
    const value = data.get(key);
    if (value !== undefined && !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(value)) {
      fail(`${key} must be an ISO-8601 UTC timestamp`);
    }
  }

  const imageCount = Number(data.get("image_count"));
  const decodedCount = Number(data.get("decoded_count"));
  const uniquePayloadCount = Number(data.get("unique_payload_count"));
  if (!Number.isInteger(imageCount) || imageCount < 1) fail("image_count must be a positive integer");
  if (decodedCount !== imageCount) fail("decoded_count must match image_count");
  if (uniquePayloadCount !== 1) fail("unique_payload_count must be 1 for the reviewed QR set");
  if (data.get("decoded_payload_consistency") !== "all-identical") {
    fail("decoded_payload_consistency must be all-identical");
  }

  const imageIds = list(data.get("source_images"));
  if (imageIds.length !== imageCount || new Set(imageIds).size !== imageIds.length) {
    fail("source_images must contain each source image exactly once");
  }
  for (const image of imageIds) {
    if (!/^\d+\.jpg$/.test(image)) fail("source_images must use numeric .jpg filenames only");
  }

  if (!/^[a-f0-9]{64}$/.test(data.get("payload_sha256") ?? "")) {
    fail("payload_sha256 must be a lowercase SHA-256 digest");
  }
  if (!/^[a-z0-9_]+(?:,[a-z0-9_]+)*$/.test(data.get("payload_query_keys") ?? "")) {
    fail("payload_query_keys must list normalized key names only");
  }

  const tickerPairs = list(data.get("observed_ticker_by_image"));
  const observedTickers = list(data.get("observed_tickers"));
  if (tickerPairs.length !== imageCount) {
    fail("observed_ticker_by_image must match image_count");
  } else {
    const tickerIds = [];
    const tickers = [];
    for (const pair of tickerPairs) {
      const match = pair.match(/^(\d+):([A-Z.]{1,10})$/);
      if (!match) {
        fail("observed_ticker_by_image contains an invalid mapping");
        continue;
      }
      tickerIds.push(`${match[1]}.jpg`);
      tickers.push(match[2]);
    }
    if (!sameMembers(tickerIds, imageIds)) fail("ticker mapping must cover source_images in order");
    if (!sameMembers(tickers, observedTickers)) fail("observed_tickers must match ticker mapping in order");
  }

  const sensitiveValue = /(?:https?:\/\/|0x[0-9a-f]{40}|private[_-]?key|seed[_-]?phrase|api[_-]?key|binance[_-]?id|wallet[_-]?address|recipient[_-]?address|transaction[_-]?payload)/i;
  for (const [key, value] of data.entries()) {
    if (key !== "prohibited_fields" && sensitiveValue.test(value)) {
      fail(`sensitive or executable value detected in ${key}`);
    }
  }

  if (!process.exitCode) {
    console.log("qrcode:check passed — offline QR schema fixture validated with redacted payload metadata.");
  }
}
