#!/usr/bin/env node
/**
 * usd_fee_quote.mjs — dependency-free USD→BNB fee quote using the Chainlink
 * BNB/USD feed on BSC (see SKILL.md).
 *
 * Usage:
 *   node usd_fee_quote.mjs <usdAmount> [rpcUrl]
 *
 * Example: node usd_fee_quote.mjs 0.20
 * Prints the BNB amount (and wei) that equals the given USD value right now.
 */

const FEED = "0x0567F2323251f0Aab15c8dFb1967E4e8A7D42aeE"; // Chainlink BNB/USD, BSC
const SEL_LATEST = "0xfeaf968c"; // latestRoundData()
const DEFAULT_RPC = "https://bsc-dataseed.binance.org";

const usdArg = process.argv[2];
const rpc = process.argv[3] || DEFAULT_RPC;

if (!usdArg || isNaN(Number(usdArg)) || Number(usdArg) <= 0) {
  console.error("Usage: node usd_fee_quote.mjs <usdAmount> [rpcUrl]");
  process.exitCode = 2;
} else {
  await run(Number(usdArg), rpc);
}

async function run(usd, rpc) {
  const res = await fetch(rpc, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "eth_call",
      params: [{ to: FEED, data: SEL_LATEST }, "latest"],
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

  const r = json.result;
  const word = (i) => "0x" + r.slice(2 + i * 64, 2 + (i + 1) * 64);
  const answer = BigInt(word(1));       // BNB/USD × 1e8
  const updatedAt = Number(BigInt(word(3)));
  const ageSec = Math.floor(Date.now() / 1000) - updatedAt;

  // usd8 = usd × 1e8, computed without floats: split on the decimal point
  const [intPart, fracPart = ""] = usdArg.split(".");
  const usd8 = BigInt(intPart) * 100_000_000n +
    BigInt((fracPart + "00000000").slice(0, 8));

  const feeWei = (usd8 * 10n ** 18n) / answer;

  console.log(JSON.stringify({
    usd,
    bnbUsdPrice: Number(answer) / 1e8,
    oracleAgeSeconds: ageSec,
    feeWei: feeWei.toString(),
    feeBnb: Number(feeWei) / 1e18,
  }));
}
