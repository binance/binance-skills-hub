const approvedValues = Object.freeze({
  schema_version: ["1"],
  profile: ["bnb-hub-readonly"],
  chain_id: ["56"],
  connection_state: ["offline"],
  realtime_stream: ["disabled", "false", "none"],
  network_request: ["disabled", "false", "none"],
  export_state: ["disabled", "false", "none"],
  transaction_capability: ["disabled", "false", "none"],
});

const requiredFields = new Set([
  ...Object.keys(approvedValues),
  "network",
  "account_data",
  "wallet_data",
  "allowed_record_fields",
]);

const prohibitedValuePattern = /(?:https?:\/\/|wss?:\/\/|0x[a-f0-9]{40,}|private[_-]?key|seed[_-]?phrase|api[_-]?key|secret[_-]?key|binance[_-]?id|wallet[_-]?address|recipient[_-]?address|transaction[_-]?payload|eth_send|sign(?:ed|ing)?|withdraw|\b(?:buy|sell|order)\b)/i;
const publicRecordField = /^(?!.*(?:account|wallet|address|recipient|amount|key|secret|order|trade|transaction|transfer|withdraw|approval|sign))(?:chain|network|block|token|timestamp|metadata|hash|source|record)(?:[_-]?[a-z0-9]+)*$/i;

function parseRecord(contents) {
  const record = new Map();

  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const separator = line.indexOf("=");
    if (separator <= 0) throw new Error("status record must use key=value fields");

    const key = line.slice(0, separator).trim();
    const value = line.slice(separator + 1).trim();
    if (!/^[a-z][a-z0-9_]*$/.test(key) || !value || record.has(key)) {
      throw new Error("status record has invalid fields");
    }
    record.set(key, value);
  }

  return record;
}

function hasSafeNetwork(value) {
  return /^(?:(?:bnb|bsc)(?:[-_ ]?(?:chain|smart[-_ ]?chain))?|binance[-_ ]?smart[-_ ]?chain)(?:[-_ ]?mainnet)?$/i.test(value);
}

function validateRecord(record) {
  for (const field of requiredFields) {
    if (!record.has(field)) return false;
  }
  for (const key of record.keys()) {
    if (!requiredFields.has(key)) return false;
  }
  for (const [key, values] of Object.entries(approvedValues)) {
    if (!values.includes(record.get(key))) return false;
  }
  if (!hasSafeNetwork(record.get("network"))) return false;
  if (prohibitedValuePattern.test(record.get("account_data")) || prohibitedValuePattern.test(record.get("wallet_data"))) {
    return false;
  }

  const fields = record
    .get("allowed_record_fields")
    .split(",")
    .map((field) => field.trim())
    .filter(Boolean);
  if (!fields.length || fields.some((field) => !publicRecordField.test(field))) return false;

  return ![...record.values()].some((value) => prohibitedValuePattern.test(value));
}

const safeFixture = `schema_version=1
profile=bnb-hub-readonly
network=bnb-chain-mainnet
chain_id=56
connection_state=offline
realtime_stream=disabled
network_request=disabled
export_state=disabled
account_data=not-recorded
wallet_data=not-recorded
transaction_capability=disabled
allowed_record_fields=chain_id,block_number,timestamp,block_hash_truncated,token_metadata_reference
`;

const unsafeFixture = safeFixture
  .replace("connection_state=offline", "connection_state=online")
  .replace("wallet_data=not-recorded", "wallet_data=0x1111111111111111111111111111111111111111");

if (!validateRecord(parseRecord(safeFixture))) {
  throw new Error("Expected the local-only read-only fixture to pass.");
}
if (validateRecord(parseRecord(unsafeFixture))) {
  throw new Error("Expected online and wallet-address fields to be rejected.");
}

console.log("bnb:status:test passed — local-only read-only schema accepted; unsafe status metadata rejected.");
