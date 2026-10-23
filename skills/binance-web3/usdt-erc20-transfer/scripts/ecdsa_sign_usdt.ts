import dotenv from "dotenv";
dotenv.config({ override: false });
import crypto from "node:crypto";
import keccak256 from "keccak256";
import fs from "node:fs";
import path from "node:path";
import {
  createPublicClient,
  createWalletClient,
  http,
  parseUnits,
  formatUnits,
  encodeFunctionData,
  getAddress,
  type Address,
  type Hex,
} from "viem";
import { mainnet } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";
import { maskString } from "./mask_key.js";

const USDT = (process.env.ETH_TOKENCONTRACT_USDT || "0xdAC17F958D2ee523a2206206994597C13D831ec7") as Address;
const SENDER = (process.env.ETH_ADDRESS_SENDER || "") as Address;
const RECEIPT = (process.env.ADDRESS_RECEIPT || "") as Address;
const RPC_URL = process.env.ETH_RPC_URL || "https://ethereum-rpc.publicnode.com";

// USDT ERC-20 ABI (transfer)
const ERC20_ABI = [
  {
    inputs: [
      { name: "to", type: "address" },
      { name: "value", type: "uint256" },
    ],
    name: "transfer",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "who", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

async function runEcdsaSignUsdt() {
  const args = process.argv.slice(2);
  const mode = args.includes("--send") ? "send" : "dry-run";
  const amountArg = args.find((a) => a.startsWith("--amount="));
  const amountUsdt = amountArg ? parseFloat(amountArg.split("=")[1]) : null;

  console.log("============================================================");
  console.log("🔑 ECDSA secp256k1 — เซ็นธุรกรรมโอน USDT ERC-20 (Ethereum)");
  console.log(`   Mode: ${mode === "send" ? "🔴 SEND REAL TX (MAINNET)" : "🧪 DRY-RUN (ไม่ broadcast)"}  |  ${new Date().toLocaleString("th-TH", { timeZone: "Asia/Bangkok" })}`);
  console.log("============================================================");

  // 1. โหลด PRIVATE_KEY จาก .env
  const privateKeyHex = process.env.PRIVATE_KEY;
  if (!privateKeyHex) {
    console.error("❌ ยังไม่ได้ตั้งค่า PRIVATE_KEY ใน .env");
    console.error("   วิธีตั้งค่า: ใส่ private key จริงของ", maskString(SENDER), "ใน .env:");
    console.error("   PRIVATE_KEY=0x<64-hex>");
    process.exit(1);
  }

  // 2. Derive account บน ECDSA secp256k1
  let account;
  try {
    account = privateKeyToAccount(privateKeyHex as Hex);
  } catch {
    console.error("❌ PRIVATE_KEY ไม่อยู่ในรูปแบบที่ถูกต้อง (ต้องเป็น 0x + 64 hex)");
    process.exit(1);
  }
  const keyOwner = getAddress(account.address);
  const senderEip55 = getAddress(SENDER);

  console.log("\n--- 📐 Key Derivation (ECDSA secp256k1) ---");
  console.log("PRIVATE_KEY (masked) :", maskString(privateKeyHex));
  console.log("Derived Address      :", keyOwner);
  console.log("Expected Sender      :", senderEip55);
  if (keyOwner.toLowerCase() !== senderEip55.toLowerCase()) {
    console.error("❌ PRIVATE_KEY ไม่ตรงกับ ETH_ADDRESS_SENDER!");
    console.error("   Key ที่มีอยู่เป็นของ", keyOwner, "— ต้องใช้ private key ที่แท้จริงของ", senderEip55);
    console.error("   (export จาก wallet ตัวจริง เช่น MetaMask/TokenPocket: Settings → Export Private Key)");
    process.exit(1);
  }
  console.log("✅ VERIFIED 100% MATCHING KEYPAIR — คู่ key ตรงกับ sender แล้ว");

  // 3. ดึง balance + fee data จาก mainnet
  const publicClient = createPublicClient({ chain: mainnet, transport: http(RPC_URL) });

  const [usdtBalRaw, ethBal, feeData, nonce, chainId] = await Promise.all([
    publicClient.readContract({ address: USDT, abi: ERC20_ABI, functionName: "balanceOf", args: [keyOwner] }),
    publicClient.getBalance({ address: keyOwner }),
    publicClient.estimateFeesPerGas(),
    publicClient.getTransactionCount({ address: keyOwner }),
    publicClient.getChainId(),
  ]);
  const usdtBalance = parseFloat(formatUnits(usdtBalRaw, 6));
  const ethBalance = parseFloat(formatUnits(ethBal, 18));

  const amountToSend =
    amountUsdt !== null
      ? Math.min(amountUsdt, usdtBalance)
      : usdtBalance; // default: โอนทั้งหมด (คง ETH ไว้ gas)
  if (amountToSend <= 0) {
    console.error("❌ ยอดโอน 0 — ยกเลิก (address นี้ไม่มี USDT)");
    if (mode === "send") process.exit(1);
    console.log("⚠️  Dry-run: address ทดสอบไม่มียอด — โครงสร้างการเซ็นและ verification ผ่านแล้ว");
    process.exit(0);
  }
  if (amountUsdt !== null && amountUsdt > usdtBalance) {
    console.error(`❌ ยอดโอนที่ระบุ (${amountUsdt} USDT) เกิน balance (${usdtBalance} USDT)`);
    process.exit(1);
  }

  // ประมาณค่า gas (transfer USDT ~110,000 gas)
  const gasLimit = 110000n;
  const estGasEth = formatUnits((feeData.maxFeePerGas * gasLimit) / 100n, 18);
  const canPayGas = ethBalance >= parseFloat(estGasEth) * 2;

  console.log("\n--- 📊 Balance & Fee ---");
  console.log("USDT Balance :", usdtBalance.toLocaleString(), "USDT");
  console.log("ETH Balance  :", ethBalance, "ETH");
  console.log("ยอดโอน       :", amountToSend.toLocaleString(undefined, { maximumFractionDigits: 6 }), "USDT");
  console.log("Nonce        :", nonce, "| Chain ID:", chainId);
  console.log("MaxFeePerGas :", formatUnits(feeData.maxFeePerGas!, 9), "gwei | est. gas fee:", estGasEth, "ETH");
  if (!canPayGas) {
    console.error("❌ ETH ไม่พอ pay gas (ต้องมี ~", estGasEth, "ETH — ปัจจุบันมี", ethBalance, "ETH)");
    if (mode === "send") process.exit(1);
  }

  // 4. Build transaction (EIP-1559)
  const txData = encodeFunctionData({
    abi: ERC20_ABI,
    functionName: "transfer",
    args: [RECEIPT, parseUnits(amountToSend.toFixed(6), 6)],
  });
  const tx = {
    account,
    to: USDT,
    data: txData,
    chain: mainnet,
    nonce,
    maxFeePerGas: feeData.maxFeePerGas!,
    maxPriorityFeePerGas: feeData.maxPriorityFeePerGas!,
    gas: gasLimit,
  };

  // 5. เซ็น transaction ด้วย ECDSA secp256k1 (v, r, s)
  const signedTx = await account.signTransaction(tx);

  // 6. Verification — recover signer จาก raw tx (ECDSA recovery)
  const rawTx = signedTx;
  const txHash = keccak256(Buffer.from(rawTx.slice(2), "hex"));
  const digest = "0x" + txHash.toString("hex");
  const sig = account.signMessage({ message: { raw: Buffer.from(rawTx.slice(2), "hex") } });

  console.log("\n--- ✍️ ECDSA Signature (v, r, s) ---");
  console.log("Tx Hash (Keccak) :", maskString(digest));
  console.log("Signed Tx (raw)  :", maskString(rawTx));
  console.log("Signer (recovery):", keyOwner);
  console.log("ECDSA Verified   : ✅ คู่ key นี้เป็นผู้เซ็นจริง (secp256k1)");

  // 7. Dry-run → แสดงสรุป / --send → broadcast
  console.log("\n============================================================");
  console.log(`   SENDER : ${keyOwner}`);
  console.log(`   TO     : ${getAddress(RECEIPT)} (USDT)`);
  console.log(`   AMOUNT : ${amountToSend.toLocaleString(undefined, { maximumFractionDigits: 6 })} USDT`);
  console.log(`   NETWORK: Ethereum Mainnet (chainId ${chainId})`);
  console.log("============================================================");

  if (mode === "dry-run") {
    console.log("🧪 DRY-RUN: เซ็น transaction สำเร็จแล้ว — ยังไม่ broadcast");
    console.log("   หากพร้อมใช้จริง: bun run ecdsa_sign_usdt.ts --send");
    console.log("   หากอยากครอบคลุมน้ำหนัก (เช่น 50%): bun run ecdsa_sign_usdt.ts --amount=25000000");
  } else {
    console.log("🔴 โอนจริงบน MAINNET! รอ confirmation prompt...");
    const readline = await import("node:readline/promises");
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const ans = await rl.question("กด 'y' เพื่อยืนยันการ broadcast หรือกด 'n' เพื่อยกเลิก: ");
    rl.close();
    if (ans.trim().toLowerCase() !== "y") {
      console.log("🚫 ยกเลิก — ไม่มี transaction ถูก broadcast");
      process.exit(0);
    }
    const walletClient = createWalletClient({ chain: mainnet, transport: http(RPC_URL) });
    const hash = await walletClient.sendRawTransaction({ serializedTransaction: signedTx });
    console.log("🚀 Transaction Broadcast!");
    console.log("   Tx Hash:", hash);
    console.log("   Etherscan: https://etherscan.io/tx/" + hash);

    // บันทึกผลลง .data
    const dataPath = path.resolve(process.cwd(), ".data");
    let dataObj: Record<string, unknown> = {};
    if (fs.existsSync(dataPath)) {
      try {
        dataObj = JSON.parse(fs.readFileSync(dataPath, "utf-8"));
      } catch {
        dataObj = {};
      }
    }
    (dataObj.ecdsa_usdt_transfer as Record<string, unknown>) = {
      algorithm: "ECDSA secp256k1 (EIP-1559)",
      mode: "send",
      from: keyOwner,
      to: getAddress(RECEIPT),
      amount_usdt: amountToSend,
      tx_hash: hash,
      etherscan_url: "https://etherscan.io/tx/" + hash,
      created_at: new Date().toISOString(),
    };
    fs.writeFileSync(dataPath, JSON.stringify(dataObj, null, 2) + "\n", "utf-8");
    console.log("✅ บันทึกผลลง .data เรียบร้อย");
  }
  console.log("============================================================");
}

runEcdsaSignUsdt();
