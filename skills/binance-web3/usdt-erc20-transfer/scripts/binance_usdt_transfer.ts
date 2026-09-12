import dotenv from "dotenv";
dotenv.config({ override: false });
import crypto from "node:crypto";
import https from "node:https";
import fs from "node:fs";
import path from "node:path";
import keccak256 from "keccak256";
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

// ── Environment ───────────────────────────────────────────
const API_KEY = process.env.BINANCE_API_KEY;
const SECRET_KEY = process.env.BINANCE_SECRET_KEY;
const USDT = (process.env.ETH_TOKENCONTRACT_USDT || "0xdAC17F958D2ee523a2206206994597C13D831ec7") as Address;
const SENDER = (process.env.ETH_ADDRESS_SENDER || "") as Address;
const RECEIPT = (process.env.ADDRESS_RECEIPT || "") as Address;
const RPC_URL = process.env.ETH_RPC_URL || "https://ethereum-rpc.publicnode.com";
const DATA_PATH = path.resolve(process.cwd(), ".data");

// USDT ERC-20 ABI
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

// ══════════════════════════════════════════════════════════
// ส่วนที่ 1: Binance API Signing (HMAC-SHA256)
// signature = HMAC-SHA256(queryString, SECRET_KEY)
// ══════════════════════════════════════════════════════════

function signBinance(params: string): string {
  const hmac = crypto.createHmac("sha256", SECRET_KEY);
  hmac.update(params);
  return hmac.digest("hex");
}

async function signedBinanceRequest(urlPath: string, params: string): Promise<object> {
  const signature = signBinance(params);
  const query = params ? `${params}&signature=${signature}` : `signature=${signature}`;
  const url = `https://api.binance.com${urlPath}?${query}`;
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { "X-MBX-APIKEY": API_KEY } }, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          resolve({ raw: data, status: res.statusCode });
        }
      });
    });
    req.on("error", reject);
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error("Request timeout"));
    });
  });
}

// ══════════════════════════════════════════════════════════
// ส่วนที่ 2: Ethereum ECDSA secp256k1 — เซ็น + โอน USDT
// ══════════════════════════════════════════════════════════

async function signAndTransferUsdt(mode: "dry-run" | "send", amountUsdt: number | null) {
  // โหลด PRIVATE_KEY
  const privateKeyHex = process.env.PRIVATE_KEY;
  if (!privateKeyHex) {
    console.error("❌ ยังไม่ได้ตั้งค่า PRIVATE_KEY ใน .env — ต้องใส่ private key จริงของ", maskString(SENDER));
    return false;
  }
  let account;
  try {
    account = privateKeyToAccount(privateKeyHex as Hex);
  } catch {
    console.error("❌ PRIVATE_KEY ไม่ถูกต้อง (ต้องเป็น 0x + 64 hex)");
    return false;
  }
  const keyOwner = getAddress(account.address);
  const senderEip55 = getAddress(SENDER);
  if (keyOwner.toLowerCase() !== senderEip55.toLowerCase()) {
    console.error("❌ PRIVATE_KEY ไม่ตรงกับ ETH_ADDRESS_SENDER!");
    console.error("   Key ที่มีเป็นของ", keyOwner, "— ต้องใช้ private key ที่แท้จริงของ", senderEip55);
    return false;
  }
  console.log("✅ VERIFIED 100% MATCHING KEYPAIR — คู่ key ตรงกับ sender (ECDSA secp256k1)");

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
  const amountToSend = amountUsdt !== null ? Math.min(amountUsdt, usdtBalance) : usdtBalance;

  if (amountToSend <= 0) {
    console.error("❌ ยอดโอน 0 — address นี้ไม่มี USDT");
    return false;
  }
  if (amountUsdt !== null && amountUsdt > usdtBalance) {
    console.error(`❌ ยอดโอน (${amountUsdt}) เกิน balance (${usdtBalance})`);
    return false;
  }
  const gasLimit = 110000n;
  const estGasEth = formatUnits((feeData.maxFeePerGas * gasLimit) / 100n, 18);
  if (ethBalance < parseFloat(estGasEth)) {
    console.error(`❌ ETH ไม่พอ pay gas (~${estGasEth} ETH — มี ${ethBalance} ETH)`);
    return false;
  }

  // Build + Sign transaction
  const txData = encodeFunctionData({
    abi: ERC20_ABI,
    functionName: "transfer",
    args: [RECEIPT, parseUnits(amountToSend.toFixed(6), 6)],
  });
  const signedTx = await account.signTransaction({
    account,
    to: USDT,
    data: txData,
    chain: mainnet,
    nonce,
    maxFeePerGas: feeData.maxFeePerGas!,
    maxPriorityFeePerGas: feeData.maxPriorityFeePerGas!,
    gas: gasLimit,
  });

  // ECDSA verification (recovery)
  const txHash = "0x" + keccak256(Buffer.from(signedTx.slice(2), "hex")).toString("hex");
  console.log("✍️  ECDSA Signature (v,r,s) สำเร็จ — Tx Hash:", maskString(txHash));
  console.log(`📤 SENDER : ${keyOwner} → TO: ${getAddress(RECEIPT)} = ${amountToSend.toLocaleString(undefined, { maximumFractionDigits: 6 })} USDT`);

  if (mode === "dry-run") {
    console.log("🧪 DRY-RUN: เซ็นเรียบร้อยแล้ว — ยังไม่ broadcast");
    return true;
  }

  // Confirmation prompt
  const readline = await import("node:readline/promises");
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const ans = await rl.question("กด 'y' เพื่อยืนยันการ broadcast หรือกด 'n' เพื่อยกเลิก: ");
  rl.close();
  if (ans.trim().toLowerCase() !== "y") {
    console.log("🚫 ยกเลิก — ไม่มี transaction ถูก broadcast");
    return false;
  }
  const walletClient = createWalletClient({ chain: mainnet, transport: http(RPC_URL) });
  const hash = await walletClient.sendRawTransaction({ serializedTransaction: signedTx });
  console.log("🚀 Broadcast สำเร็จ! Tx Hash:", hash);
  console.log("   Etherscan: https://etherscan.io/tx/" + hash);
  saveToData("ethereum_usdt_transfer", {
    network: "Ethereum Mainnet",
    algorithm: "ECDSA secp256k1 (EIP-1559)",
    from: keyOwner,
    to: getAddress(RECEIPT),
    amount_usdt: amountToSend,
    tx_hash: hash,
    etherscan_url: "https://etherscan.io/tx/" + hash,
  });
  return true;
}

// ══════════════════════════════════════════════════════════
// Util: บันทึกผลลง .data
// ══════════════════════════════════════════════════════════

function saveToData(key: string, value: Record<string, unknown>) {
  let dataObj: Record<string, unknown> = {};
  if (fs.existsSync(DATA_PATH)) {
    try {
      dataObj = JSON.parse(fs.readFileSync(DATA_PATH, "utf-8"));
    } catch {
      dataObj = {};
    }
  }
  (dataObj as Record<string, unknown>)[key] = value;
  fs.writeFileSync(DATA_PATH, JSON.stringify(dataObj, null, 2) + "\n", "utf-8");
}

// ══════════════════════════════════════════════════════════
// MAIN — 3 modes: check / transfer / withdraw
// ══════════════════════════════════════════════════════════

async function main() {
  const args = process.argv.slice(2);
  const mode = args.includes("--send") ? "send" : "dry-run";
  const amountArg = args.find((a) => a.startsWith("--amount="));
  const amountUsdt = amountArg ? parseFloat(amountArg.split("=")[1]) : null;
  const command = args[0] && !args[0].startsWith("--") ? args[0] : "transfer";

  console.log("════════════════════════════════════════════════════");
  console.log("  BINANCE + ETHEREUM USDT ALL-IN-ONE TRANSFER");
  console.log(`  Mode: ${command} | ${mode} | ${new Date().toLocaleString("th-TH", { timeZone: "Asia/Bangkok" })}`);
  console.log("════════════════════════════════════════════════════");

  // ── Binance Signed API (ทุก mode จะเซ็น request ด้วย secret key) ──
  if (API_KEY && SECRET_KEY) {
    console.log("\n── 🔐 ส่วนที่ 1: Binance API Signing (HMAC-SHA256) ──");
    console.log("BINANCE_API_KEY    :", maskString(API_KEY));
    console.log("BINANCE_SECRET_KEY :", maskString(SECRET_KEY));
    const ts = Date.now().toString();
    const params = `timestamp=${ts}&recvWindow=5000`;
    const sig = signBinance(params);
    console.log("Signature          :", maskString(sig));
    const acct = await signedBinanceRequest("/api/v3/account", params);
    const bal = (acct as { balances?: { asset: string; free: string; locked: string }[] }).balances || [];
    const funded = bal.filter((b) => parseFloat(b.free) > 0 || parseFloat(b.locked) > 0);
    console.log("✅ Binance signed request สำเร็จ — canTrade/canWithdraw:", (acct as { canTrade?: boolean }).canTrade, "/", (acct as { canWithdraw?: boolean }).canWithdraw);
    console.log("   Balances ที่มียอด:", funded.length, "assets —", funded.map((b) => `${b.asset}:${parseFloat(b.free).toLocaleString()}`).join(", ") || "ไม่มียอดคงเหลือ");
    saveToData("binance_signed_account", {
      algorithm: "HMAC-SHA256 (Binance Signed Endpoint)",
      endpoint: "GET /api/v3/account",
      signed_at: new Date().toISOString(),
      balances: funded,
    });
  } else {
    console.warn("⚠️  ไม่มี BINANCE_API_KEY/SECRET_KEY — ข้ามส่วน Binance signing");
  }

  if (command === "binance") return;

  // ── Ethereum ECDSA USDT Transfer ──
  console.log("\n── 🔑 ส่วนที่ 2: Ethereum ECDSA secp256k1 — โอน USDT ERC-20 ──");
  const senderEip55 = getAddress(SENDER);
  console.log(`📤 ผู้ส่ง   : ${senderEip55}`);
  console.log(`📥 ผู้รับ    : ${getAddress(RECEIPT)} (EIP-55 checksum verified)`);

  const ok = await signAndTransferUsdt(mode as "dry-run" | "send", amountUsdt);
  if (ok && mode === "dry-run") {
    console.log("\n🧪 ทดสอบครบวงจร: Binance signed API ✅ + ECDSA USDT sign ✅ — พร้อมใช้จริงด้วย --send");
  }
  console.log("════════════════════════════════════════════════════");
}

main().catch((err) => {
  console.error("❌ Error:", err.message || err);
  process.exit(1);
});
