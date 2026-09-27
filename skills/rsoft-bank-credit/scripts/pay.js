"use strict";
// Send an EXACT USDC repayment from the CDP wallet to the bank treasury.
// CDP signs and broadcasts server-side; the key never leaves the enclave.
//
// Usage:  node pay.js <pay_to_address> <amount_usdc>
// Output: the transaction hash (use it in POST /loan/repay)
const { loadConfig, cdpClient } = require("./wallet-config");

const USDC = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"; // Circle USDC, Base mainnet

// Minimal ERC-20 transfer calldata: transfer(address,uint256) = 0xa9059cbb
function transferCalldata(to, amountUnits) {
  const addr = to.toLowerCase().replace(/^0x/, "").padStart(64, "0");
  const amt = BigInt(amountUnits).toString(16).padStart(64, "0");
  return "0xa9059cbb" + addr + amt;
}

(async () => {
  const payTo = process.argv[2];
  const amount = parseFloat(process.argv[3]);
  if (!/^0x[0-9a-fA-F]{40}$/.test(payTo || "")) throw new Error("Usage: node pay.js <pay_to 0x…> <amount_usdc>");
  if (!(amount > 0)) throw new Error("amount_usdc must be > 0");

  const cfg = loadConfig();
  const cdp = await cdpClient(cfg);

  const amountUnits = Math.round(amount * 1e6); // USDC has 6 decimals
  const data = transferCalldata(payTo, amountUnits);

  const { transactionHash } = await cdp.evm.sendTransaction({
    address: cfg.AGENT_WALLET,
    network: "base",
    transaction: { to: USDC, data, value: 0n },
  });

  console.log(transactionHash);
})().catch((e) => {
  console.error("ERROR:", e.message);
  process.exit(1);
});
