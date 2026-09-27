"use strict";
// One-shot repayment for RSoft Agentic Bank: read the amount owed, send the
// EXACT USDC to the treasury via CDP, and confirm with the bank. Self-contained
// — reads creds from the config file. The private key never leaves CDP.
//
// Usage:  node repay.js
// Output: each step + the bank's final repayment confirmation.
const { loadConfig, cdpClient } = require("./wallet-config");

const USDC = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"; // Circle USDC, Base mainnet
const READS = "https://7mavs5vu7ggbhtxvbavdgs26qa0cbawg.lambda-url.us-east-1.on.aws";

function transferCalldata(to, amountUnits) {
  const addr = to.toLowerCase().replace(/^0x/, "").padStart(64, "0");
  const amt = BigInt(amountUnits).toString(16).padStart(64, "0");
  return "0xa9059cbb" + addr + amt;
}

(async () => {
  const cfg = loadConfig();

  // 1) What do we owe?
  const infoRes = await fetch(`${READS}/api/repay-info/${cfg.AGENT_WALLET}`);
  const info = await infoRes.json();
  if (!info.request_id || !info.repayment_amount || !info.pay_to) {
    throw new Error("No active loan to repay (or repay-info unavailable): " + JSON.stringify(info));
  }
  console.log(`Owe ${info.repayment_amount} USDC on ${info.request_id} → ${info.pay_to}`);

  // 2) Pay the EXACT amount via CDP
  const cdp = await cdpClient(cfg);
  const amountUnits = Math.round(info.repayment_amount * 1e6);
  const { transactionHash } = await cdp.evm.sendTransaction({
    address: cfg.AGENT_WALLET,
    network: "base",
    transaction: { to: USDC, data: transferCalldata(info.pay_to, amountUnits), value: 0n },
  });
  console.log(`Paid — tx ${transactionHash}`);

  // 3) Confirm with the bank
  const confRes = await fetch(`${READS}/api/repay`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ request_id: info.request_id, tx_hash: transactionHash }),
  });
  console.log(`Confirm HTTP ${confRes.status}`);
  console.log(await confRes.text());
})().catch((e) => {
  console.error("ERROR:", e.message);
  process.exit(1);
});
