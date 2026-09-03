"use strict";
// One-shot loan origination for RSoft Agentic Bank: sign the EIP-712 LoanRequest
// with the CDP wallet and POST it to the bank. Self-contained — reads creds AND
// the bank API key from the config file, so it doesn't depend on shell env
// inheritance. The private key never leaves Coinbase's enclave.
//
// Usage:  node request-loan.js <amount_usdc>
// Config file (WALLET_CONFIG_PATH) must also contain BANK_API_KEY.
// Output: the bank's JSON response ({ request_id, status, ... }).
const crypto = require("crypto");
const { loadConfig, cdpClient } = require("./wallet-config");

const CHAIN_ID = 8453;
const VERIFYING_CONTRACT = "0x8004A169FB4a3325136EB29fA0ceB6D2e539a432";
const BANK = "https://rsoft-agentic-bank.com/api/v1";

(async () => {
  const amount = parseFloat(process.argv[2]);
  if (!(amount > 0)) throw new Error("Usage: node request-loan.js <amount_usdc> (>0)");

  const cfg = loadConfig();
  if (!cfg.BANK_API_KEY) throw new Error("Config file is missing BANK_API_KEY");

  const cdp = await cdpClient(cfg);
  const account = await cdp.evm.getAccount({ address: cfg.AGENT_WALLET });

  const nonce = "cdp-" + crypto.randomBytes(8).toString("hex");
  const deadline = Math.floor(Date.now() / 1000) + 900;

  const signature = await account.signTypedData({
    domain: { name: "RSoft Agentic Bank", version: "1", chainId: CHAIN_ID, verifyingContract: VERIFYING_CONTRACT },
    types: {
      LoanRequest: [
        { name: "agentWallet", type: "address" },
        { name: "loanAmountUsdc6", type: "uint256" },
        { name: "nonce", type: "string" },
        { name: "deadline", type: "uint256" },
      ],
    },
    primaryType: "LoanRequest",
    message: {
      agentWallet: account.address,
      loanAmountUsdc6: BigInt(Math.round(amount * 1e6)),
      nonce,
      deadline: BigInt(deadline),
    },
  });

  const res = await fetch(`${BANK}/loan/request`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-API-Key": cfg.BANK_API_KEY },
    body: JSON.stringify({
      agent_wallet: account.address,
      loan_amount: amount,
      nonce,
      deadline,
      signature,
    }),
  });
  const text = await res.text();
  console.log(`HTTP ${res.status}`);
  console.log(text);
  if (!res.ok) process.exit(1);
})().catch((e) => {
  console.error("ERROR:", e.message);
  process.exit(1);
});
