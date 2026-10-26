#!/usr/bin/env node
/**
 * check_agent_id.mjs — dependency-free Binance Agent ID ownership checker.
 *
 * Usage:
 *   node check_agent_id.mjs <walletAddress> [rpcUrl]
 *
 * Defaults to the public BSC RPC. Exit code 0 if the address holds an
 * Agent ID, 1 if not, 2 on error. Prints JSON to stdout.
 */

const REGISTRY = "0x60B9262456dE011F7d15a54CdD8c48bAaa8B022F";
const BALANCE_OF_SELECTOR = "0x70a08231"; // balanceOf(address)
const DEFAULT_RPC = "https://bsc-dataseed.binance.org";

const address = process.argv[2];
const rpc = process.argv[3] || DEFAULT_RPC;

if (!address || !/^0x[0-9a-fA-F]{40}$/.test(address)) {
  console.error("Usage: node check_agent_id.mjs <walletAddress> [rpcUrl]");
  process.exitCode = 2;
} else {
  run(address, rpc);
}

async function run(address, rpc) {
  const data =
    BALANCE_OF_SELECTOR + address.toLowerCase().replace("0x", "").padStart(64, "0");

  const res = await fetch(rpc, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "eth_call",
      params: [{ to: REGISTRY, data }, "latest"],
    }),
  });

  if (!res.ok) {
    console.error(`RPC HTTP error: ${res.status}`);
    process.exitCode = 2;
    return;
  }

  const json = await res.json();
  if (json.error) {
    console.error(`RPC error: ${JSON.stringify(json.error)}`);
    process.exitCode = 2;
    return;
  }

  const balance = BigInt(json.result);
  const isAgent = balance > 0n;
  console.log(JSON.stringify({ address, agentIdBalance: balance.toString(), isAgent }));
  process.exitCode = isAgent ? 0 : 1;
}
