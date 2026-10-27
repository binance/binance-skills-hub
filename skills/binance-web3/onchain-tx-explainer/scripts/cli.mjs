#!/usr/bin/env node
/**
 * onchain-tx-explainer CLI
 *
 * Decodes an on-chain transaction into what it actually did: the called
 * method, native value, gas paid, token/NFT transfers and approvals, and a
 * plain-language summary. Read-only: it needs no key, no account and never
 * signs anything.
 *
 * Usage:
 *   node cli.mjs tx '{"chain":"bsc","hash":"0x..."}'
 *   node cli.mjs calldata '{"chain":"bsc","to":"0x...","data":"0x..."}'
 */
import process from "node:process";

const RPCS = {
  56: ["https://bsc-dataseed.bnbchain.org", "https://bsc-rpc.publicnode.com", "https://1rpc.io/bnb"],
  1: ["https://ethereum-rpc.publicnode.com", "https://rpc.ankr.com/eth", "https://eth.llamarpc.com"],
  8453: ["https://base-rpc.publicnode.com", "https://mainnet.base.org"],
  42161: ["https://arbitrum-one-rpc.publicnode.com", "https://arb1.arbitrum.io/rpc"],
  137: ["https://polygon-bor-rpc.publicnode.com", "https://polygon-rpc.com"],
  4663: ["https://rpc.mainnet.chain.robinhood.com"],
};

const CHAIN_ALIASES = {
  bsc: 56, bnb: 56, bnbchain: 56, "bnb-smart-chain": 56, "56": 56,
  ethereum: 1, eth: 1, mainnet: 1, "1": 1,
  base: 8453, "8453": 8453,
  arbitrum: 42161, arb: 42161, "42161": 42161,
  polygon: 137, matic: 137, "137": 137,
  robinhood: 4663, "4663": 4663,
};

const CHAIN_NAMES = { 56: "BSC", 1: "Ethereum", 8453: "Base", 42161: "Arbitrum", 137: "Polygon", 4663: "Robinhood Chain" };

const NATIVE = { 56: "BNB", 1: "ETH", 8453: "ETH", 42161: "ETH", 137: "POL", 4663: "ETH" };

const KNOWN_METHODS = {
  "0xa9059cbb": { name: "transfer", args: ["address", "uint256"], kind: "token-transfer" },
  "0x095ea7b3": { name: "approve", args: ["address", "uint256"], kind: "approval" },
  "0x23b872dd": { name: "transferFrom", args: ["address", "address", "uint256"], kind: "token-transfer" },
  "0x42842e0e": { name: "safeTransferFrom", args: ["address", "address", "uint256"], kind: "nft-transfer" },
  "0xb88d4fde": { name: "safeTransferFrom", args: ["address", "address", "uint256", "bytes"], kind: "nft-transfer" },
  "0xa22cb465": { name: "setApprovalForAll", args: ["address", "bool"], kind: "approval" },
  "0xd0e30db0": { name: "deposit", args: [], kind: "wrap" },
  "0x2e1a7d4d": { name: "withdraw", args: ["uint256"], kind: "unwrap" },
  "0x1249c58b": { name: "mint", args: [], kind: "mint" },
  "0x40c10f19": { name: "mint", args: ["address", "uint256"], kind: "mint" },
  "0xa0712d68": { name: "mint", args: ["uint256"], kind: "mint" },
};

const TRANSFER_TOPIC = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
const APPROVAL_TOPIC = "0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925";
const ZERO_TOPIC = "0x0000000000000000000000000000000000000000000000000000000000000000";
const MAX_UINT256 = (1n << 256n) - 1n;

function parseArgs(raw) {
  try {
    return JSON.parse(raw ?? "{}");
  } catch {
    throw new Error("arguments must be a JSON object string");
  }
}

function chainIdOf(value) {
  const key = String(value ?? "").toLowerCase();
  const id = CHAIN_ALIASES[key] ?? Number(key);
  if (!CHAIN_NAMES[id]) throw new Error(`unsupported chain: ${value} (use bsc, ethereum, base, arbitrum, polygon)`);
  return id;
}

async function rpc(chainId, method, params) {
  const endpoints = RPCS[chainId];
  let lastError;
  for (const url of endpoints) {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json", "user-agent": "Mozilla/5.0 (compatible; onchain-tx-explainer)" },
        body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
        signal: AbortSignal.timeout(15000),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status} from ${url}`);
      const body = await response.json();
      if (body.error) throw new Error(`${body.error.message ?? "rpc error"} (${url})`);
      return body.result;
    } catch (error) {
      lastError = error;
    }
  }
  throw new Error(`all RPC endpoints failed for chain ${chainId}: ${lastError?.message ?? "unknown"}`);
}

function hexToBigInt(hex) {
  if (!hex || hex === "0x") return 0n;
  return BigInt(hex);
}

function formatUnits(value, decimals) {
  const negative = value < 0n;
  const absolute = negative ? -value : value;
  const base = 10n ** BigInt(decimals);
  const whole = absolute / base;
  const fraction = absolute % base;
  const fractionText = fraction === 0n ? "" : `.${fraction.toString().padStart(decimals, "0").replace(/0+$/, "")}`;
  return `${negative ? "-" : ""}${whole}${fractionText || (fraction === 0n && decimals > 0 ? "" : "")}`;
}

function topicToAddress(topic) {
  return `0x${String(topic).slice(-40)}`;
}

function readWords(data) {
  const body = String(data ?? "0x").slice(2);
  const words = [];
  for (let index = 0; index + 64 <= body.length; index += 64) words.push(`0x${body.slice(index, index + 64)}`);
  return words;
}

function decodeKnownCall(data, to) {
  const hex = String(data ?? "0x");
  if (hex === "0x" || hex.length < 10) {
    return { selector: null, name: null, args: [], kind: "native-transfer", note: "no calldata (plain native transfer)" };
  }
  const selector = hex.slice(0, 10).toLowerCase();
  const known = KNOWN_METHODS[selector];
  const words = readWords(`0x${hex.slice(10)}`);
  if (!known) {
    return { selector, name: null, args: [], kind: "contract-call", note: `unknown selector ${selector} on ${to ?? "contract"}` };
  }
  const args = [];
  for (let index = 0; index < known.args.length; index += 1) {
    const word = words[index];
    if (!word) break;
    const type = known.args[index];
    if (type === "address") args.push(topicToAddress(word));
    else if (type === "bool") args.push(BigInt(word) !== 0n);
    else if (type === "bytes") args.push("0x…");
    else args.push(hexToBigInt(word));
  }
  return { selector, name: known.name, args, kind: known.kind, note: null };
}

const metadataCache = new Map();

async function tokenMetadata(chainId, address) {
  const key = `${chainId}:${address.toLowerCase()}`;
  if (metadataCache.has(key)) return metadataCache.get(key);
  const result = { address, symbol: null, decimals: null, kind: null };
  try {
    const symbol = await rpc(chainId, "eth_call", [{ to: address, data: "0x95d89b41" }, "latest"]);
    if (symbol && symbol !== "0x") {
      const hex = symbol.slice(2);
      const length = Number.parseInt(hex.slice(64, 128), 16);
      const bytes = Buffer.from(hex.slice(128, 128 + length * 2), "hex");
      result.symbol = bytes.toString("utf8").replace(/\0/g, "");
    }
  } catch {
    /* symbol is optional */
  }
  try {
    const decimals = await rpc(chainId, "eth_call", [{ to: address, data: "0x313ce567" }, "latest"]);
    if (decimals && decimals !== "0x") result.decimals = Number(hexToBigInt(decimals));
  } catch {
    /* decimals is optional */
  }
  try {
    const supports721 = await rpc(chainId, "eth_call", [{ to: address, data: "0x01ffc9a780ac58cd" }, "latest"]);
    result.kind = supports721 && hexToBigInt(supports721) === 1n ? "erc721" : "erc20";
  } catch {
    result.kind = result.decimals === 0 ? "erc721" : "erc20";
  }
  metadataCache.set(key, result);
  return result;
}

async function decodeLogs(chainId, logs) {
  const transfers = [];
  const approvals = [];
  for (const log of logs ?? []) {
    const topics = log.topics ?? [];
    if (topics[0] === TRANSFER_TOPIC) {
      const token = log.address;
      const meta = await tokenMetadata(chainId, token);
      const isNft = topics.length === 4;
      const from = topics.length === 4 ? topicToAddress(topics[1]) : topicToAddress(topics[1]);
      const to = topics.length === 4 ? topicToAddress(topics[2]) : topicToAddress(topics[2]);
      const rawValue = topics.length === 4 ? hexToBigInt(topics[3]) : hexToBigInt(readWords(log.data)[0] ?? "0x0");
      const decimals = isNft ? 0 : (meta.decimals ?? 18);
      transfers.push({
        token,
        symbol: meta.symbol,
        standard: isNft ? "erc721" : "erc20",
        from,
        to,
        raw: rawValue.toString(),
        amount: isNft ? rawValue.toString() : formatUnits(rawValue, decimals).toString(),
        mint: from === topicToAddress(ZERO_TOPIC),
        burn: to === topicToAddress(ZERO_TOPIC),
      });
      continue;
    }
    if (topics[0] === APPROVAL_TOPIC && topics.length === 3) {
      const meta = await tokenMetadata(chainId, log.address);
      const rawValue = hexToBigInt(readWords(log.data)[0] ?? "0x0");
      approvals.push({
        token: log.address,
        symbol: meta.symbol,
        owner: topicToAddress(topics[1]),
        spender: topicToAddress(topics[2]),
        raw: rawValue.toString(),
        amount: formatUnits(rawValue, meta.decimals ?? 18).toString(),
        unlimited: rawValue === MAX_UINT256,
      });
    }
  }
  const unique = (rows) => {
    const seen = new Set();
    return rows.filter((row) => {
      const key = JSON.stringify(row);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };
  return { transfers: unique(transfers), approvals: unique(approvals) };
}

function short(address) {
  if (!address) return "—";
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

async function explainTransaction(args) {
  const chainId = chainIdOf(args.chain ?? "bsc");
  const hash = args.hash;
  if (!/^0x[0-9a-fA-F]{64}$/.test(String(hash ?? ""))) throw new Error("hash must be a 32-byte 0x-prefixed transaction hash");
  const [tx, receipt] = await Promise.all([
    rpc(chainId, "eth_getTransactionByHash", [hash]),
    rpc(chainId, "eth_getTransactionReceipt", [hash]),
  ]);
  if (!tx) throw new Error(`transaction not found on ${CHAIN_NAMES[chainId]}`);
  if (!receipt) throw new Error("transaction is pending: no receipt yet, nothing to decode");

  const call = decodeKnownCall(tx.input, tx.to);
  const { transfers, approvals } = await decodeLogs(chainId, receipt.logs);
  const gasUsed = hexToBigInt(receipt.gasUsed);
  const gasPrice = hexToBigInt(receipt.effectiveGasPrice ?? tx.gasPrice);
  const gasFee = gasUsed * gasPrice;
  const native = NATIVE[chainId];

  const summary = [];
  summary.push(`${CHAIN_NAMES[chainId]} tx ${short(hash)} · block ${Number.parseInt(receipt.blockNumber, 16)} · ${receipt.status === "0x1" ? "success" : "FAILED"}`);
  summary.push(`from ${tx.from} → ${tx.to ?? "(contract creation)"}`);
  if (hexToBigInt(tx.value) > 0n) summary.push(`sent ${formatUnits(hexToBigInt(tx.value), 18)} ${native}`);
  if (call.name) summary.push(`called ${call.name}(${call.args.map((value) => (value === MAX_UINT256 ? "unlimited" : typeof value === "bigint" ? value.toString() : String(value))).join(", ")})`);
  else if (call.selector) summary.push(`called unknown selector ${call.selector} (${(tx.input.length - 2) / 2} bytes of calldata)`);
  else summary.push(call.note);
  summary.push(`paid ${formatUnits(gasFee, 18)} ${native} gas (${gasUsed} gas @ ${formatUnits(gasPrice, 9)} gwei)`);
  for (const transfer of transfers) {
    if (transfer.standard === "erc721") {
      summary.push(`${transfer.symbol ?? "NFT"} token #${transfer.raw}: ${short(transfer.from)} → ${short(transfer.to)}${transfer.mint ? " (minted)" : ""}`);
    } else {
      const label = transfer.symbol ?? short(transfer.token);
      summary.push(`${label}: ${transfer.amount} ${short(transfer.from)} → ${short(transfer.to)}${transfer.mint ? " (mint)" : ""}${transfer.burn ? " (burn)" : ""}`);
    }
  }
  for (const approval of approvals) {
    const label = approval.symbol ?? short(approval.token);
    summary.push(approval.unlimited
      ? `UNLIMITED approval: ${short(approval.owner)} allowed ${short(approval.spender)} to spend all ${label}`
      : `approval: ${short(approval.owner)} allowed ${short(approval.spender)} to spend ${approval.amount} ${label}`);
  }

  return {
    chainId,
    chain: CHAIN_NAMES[chainId],
    hash,
    status: receipt.status === "0x1" ? "success" : "failed",
    blockNumber: Number.parseInt(receipt.blockNumber, 16),
    from: tx.from,
    to: tx.to,
    call,
    nativeValue: { raw: hexToBigInt(tx.value).toString(), formatted: formatUnits(hexToBigInt(tx.value), 18), symbol: native },
    gas: {
      used: gasUsed.toString(),
      priceGwei: formatUnits(gasPrice, 9),
      fee: formatUnits(gasFee, 18),
      feeSymbol: native,
    },
    transfers,
    approvals,
    warnings: approvals.some((approval) => approval.unlimited)
      ? ["This transaction granted an unlimited token approval. Treat the spender as able to move that balance until it is revoked."]
      : [],
    summary,
  };
}

async function decodeCalldata(args) {
  const chainId = chainIdOf(args.chain ?? "bsc");
  const data = String(args.data ?? "");
  if (!/^0x[0-9a-fA-F]*$/.test(data)) throw new Error("data must be 0x-prefixed hex");
  const call = decodeKnownCall(data, args.to ?? null);
  const result = {
    chainId,
    chain: CHAIN_NAMES[chainId],
    to: args.to ?? null,
    selector: call.selector,
    method: call.name,
    kind: call.kind,
    args: call.args.map((value) => (typeof value === "bigint" ? value.toString() : value)),
    byteLength: (data.length - 2) / 2,
    summary: [],
  };
  result.summary.push(call.name
    ? `${call.name}(${result.args.map((value) => (value === MAX_UINT256.toString() ? "unlimited" : value)).join(", ")})${args.to ? ` on ${args.to}` : ""}`
    : call.selector
      ? `unknown selector ${call.selector} (${result.byteLength} bytes)`
      : "empty calldata (plain native transfer)");
  return result;
}

const COMMANDS = {
  tx: explainTransaction,
  calldata: decodeCalldata,
};

async function main() {
  const [command, raw] = process.argv.slice(2);
  const handler = COMMANDS[command];
  if (!handler) {
    console.error(JSON.stringify({
      success: false,
      error: { name: "UNKNOWN_COMMAND", message: `use one of: ${Object.keys(COMMANDS).join(", ")}` },
    }));
    process.exit(2);
  }
  try {
    const result = await handler(parseArgs(raw));
    console.log(JSON.stringify({ success: true, data: result }, (key, value) => (typeof value === "bigint" ? value.toString() : value), 2));
  } catch (error) {
    console.error(JSON.stringify({ success: false, error: { name: "DECODE_FAILED", message: error.message } }));
    process.exit(1);
  }
}

main();
