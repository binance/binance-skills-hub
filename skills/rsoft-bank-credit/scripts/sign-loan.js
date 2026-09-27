"use strict";
// Sign the EIP-712 LoanRequest for RSoft Agentic Bank with the CDP wallet.
// The private key never leaves Coinbase's enclave — CDP signs server-side.
//
// Usage:  node sign-loan.js <amount_usdc>
// Output: JSON { agent_wallet, loan_amount, nonce, deadline, signature }
//         (feed this straight into the POST /loan/request body)
const crypto = require("crypto");
const { loadConfig, cdpClient } = require("./wallet-config");

const CHAIN_ID = 8453; // Base mainnet
const VERIFYING_CONTRACT = "0x8004A169FB4a3325136EB29fA0ceB6D2e539a432"; // ERC-8004 domain

(async () => {
  const amount = parseFloat(process.argv[2]);
  if (!(amount > 0)) throw new Error("Usage: node sign-loan.js <amount_usdc> (>0)");

  const cfg = loadConfig();
  const cdp = await cdpClient(cfg);
  const account = await cdp.evm.getAccount({ address: cfg.AGENT_WALLET });

  const nonce = "cdp-" + crypto.randomBytes(8).toString("hex");
  const deadline = Math.floor(Date.now() / 1000) + 900; // 15 min

  const signature = await account.signTypedData({
    domain: {
      name: "RSoft Agentic Bank",
      version: "1",
      chainId: CHAIN_ID,
      verifyingContract: VERIFYING_CONTRACT,
    },
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

  console.log(
    JSON.stringify({
      agent_wallet: account.address,
      loan_amount: amount,
      nonce,
      deadline,
      signature,
    })
  );
})().catch((e) => {
  console.error("ERROR:", e.message);
  process.exit(1);
});
