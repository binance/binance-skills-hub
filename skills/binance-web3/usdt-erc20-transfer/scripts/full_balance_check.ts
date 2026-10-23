import dotenv from "dotenv";
dotenv.config({ override: false });
import fs from "node:fs";
import path from "node:path";
import {
  createPublicClient,
  http,
  formatUnits,
  getAddress,
  type Address,
} from "viem";
import { mainnet } from "viem/chains";
import { maskString } from "./mask_key.js";

const USDT = (process.env.ETH_TOKENCONTRACT_USDT || "0xdAC17F958D2ee523a2206206994597C13D831ec7") as Address;
const SENDER = (process.env.ETH_ADDRESS_SENDER || "") as Address;
const RECEIPT = (process.env.ADDRESS_RECEIPT || "") as Address;
const RPC_URL = process.env.ETH_RPC_URL || "https://ethereum-rpc.publicnode.com";

// USDT ERC-20 ABI
const ERC20_ABI = [
  {
    inputs: [{ name: "who", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  { inputs: [], name: "decimals", outputs: [{ name: "", type: "uint8" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "symbol", outputs: [{ name: "", type: "string" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "name", outputs: [{ name: "", type: "string" }], stateMutability: "view", type: "function" },
] as const;

async function main() {
  console.log("════════════════════════════════════════════════════");
  console.log("  🔍 BALANCE CHECK — USDT + ETH (Gas) บน Ethereum Mainnet");
  console.log(`  เวลา: ${new Date().toLocaleString("th-TH", { timeZone: "Asia/Bangkok" })}`);
  console.log("════════════════════════════════════════════════════");

  const senderEip55 = getAddress(SENDER);
  const receiptEip55 = getAddress(RECEIPT);
  const publicClient = createPublicClient({ chain: mainnet, transport: http(RPC_URL) });

  // ดึงข้อมูลครั้งเดียว (parallel)
  const [block, usdtName, usdtSymbol, usdtDecimals, usdtBalRaw, ethBal, nonce, feeData] = await Promise.all([
    publicClient.getBlock({ blockTag: "latest" }),
    publicClient.readContract({ address: USDT, abi: ERC20_ABI, functionName: "name" }),
    publicClient.readContract({ address: USDT, abi: ERC20_ABI, functionName: "symbol" }),
    publicClient.readContract({ address: USDT, abi: ERC20_ABI, functionName: "decimals" }),
    publicClient.readContract({ address: USDT, abi: ERC20_ABI, functionName: "balanceOf", args: [senderEip55] }),
    publicClient.getBalance({ address: senderEip55 }),
    publicClient.getTransactionCount({ address: senderEip55 }),
    publicClient.estimateFeesPerGas(),
  ]);

  const usdtBalance = parseFloat(formatUnits(usdtBalRaw, 6));
  const ethBalance = parseFloat(formatUnits(ethBal, 18));
  const ethPriceApprox = await getEthPrice().catch(() => null);

  // ประมาณ gas fee สำหรับ transfer USDT (gas limit ~110,000)
  const gasLimit = 110000n;
  const estGasEth = formatUnits(feeData.maxFeePerGas * gasLimit, 18);
  const estGasUsd = ethPriceApprox ? parseFloat(estGasEth) * ethPriceApprox : null;

  // จำนวนทรานแซกชันที่ ETH จ่ายได้
  const txsAffordable = ethBalance / parseFloat(estGasEth);

  console.log("\n── 📡 เครือข่าย ──");
  console.log("Block Height :", block.number.toLocaleString(), "| Block Hash:", maskString(block.hash));
  console.log("RPC          :", RPC_URL);

  console.log("\n── 🪙 USDT (ERC-20) ──");
  console.log("Contract     :", USDT);
  console.log("Token        :", usdtName, `(${usdtSymbol}) — ${usdtDecimals} decimals`);
  console.log(`ยอดคงเหลือ     : ${usdtBalance.toLocaleString(undefined, { maximumFractionDigits: 6 })} USDT`);
  console.log("Sender       :", senderEip55);
  console.log("Etherscan    :", `https://etherscan.io/token/${USDT}?a=${senderEip55}`);

  console.log("\n── 💎 ETH (สำหรับ Gas) ──");
  console.log(`ยอดคงเหลือ     : ${ethBalance} ETH`);
  if (ethPriceApprox) console.log(`ราคาประมาณ      : ~$${ethPriceApprox.toLocaleString()} / ETH → ~$${(ethBalance * ethPriceApprox).toFixed(2)}`);
  console.log("Nonce        :", nonce);
  console.log("MaxFeePerGas :", formatUnits(feeData.maxFeePerGas!, 9), "gwei");
  console.log("MaxPrioFee   :", formatUnits(feeData.maxPriorityFeePerGas!, 9), "gwei");
  console.log(`Est. Gas/tx    : ~${parseFloat(estGasEth).toFixed(6)} ETH${estGasUsd ? ` (~$${estGasUsd.toFixed(2)})` : ""}`);
  console.log(`จ่ายได้ประมาณ : ${Math.floor(txsAffordable)} transactions (USDT transfer)`);

  // ตรวจ receipt address
  console.log("\n── 📥 Address Receipt ──");
  console.log("Receipt      :", receiptEip55);
  console.log("Checksum     : ✅ EIP-55 verified");

  // สรุปสถานะพร้อมใช้งาน
  console.log("\n── 📊 สรุปสถานะ ──");
  if (usdtBalance <= 0) {
    console.log("❌ USDT = 0 — ไม่มียอดโอนได้");
  } else {
    console.log(`✅ มียอด USDT: ${usdtBalance.toLocaleString(undefined, { maximumFractionDigits: 6 })}`);
  }
  if (txsAffordable >= 1) {
    console.log(`✅ ETH พอ pay gas (โอนได้ ~${Math.floor(txsAffordable)} ครั้ง)`);
  } else {
    console.log(`❌ ETH ไม่พอ pay gas — มี ${ethBalance} ETH แต่ต้องการ ~${parseFloat(estGasEth).toFixed(6)} ETH/tx`);
  }

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
  (dataObj.balance_check as Record<string, unknown>) = {
    network: "Ethereum Mainnet",
    chain_id: 1,
    block_height: Number(block.number),
    sender: senderEip55,
    receipt: receiptEip55,
    usdt_contract: USDT,
    usdt_balance: usdtBalance,
    eth_balance: ethBalance,
    nonce: nonce,
    max_fee_per_gas_gwei: parseFloat(formatUnits(feeData.maxFeePerGas!, 9)),
    estimated_gas_eth: parseFloat(estGasEth),
    transactions_affordable: Math.floor(txsAffordable),
    checked_at: new Date().toISOString(),
  };
  fs.writeFileSync(dataPath, JSON.stringify(dataObj, null, 2) + "\n", "utf-8");
  console.log("\n✅ บันทึกผลลง .data เรียบร้อย");
  console.log("════════════════════════════════════════════════════");
}

async function getEthPrice(): Promise<number> {
  const axios = await import("axios");
  const res = await axios.get("https://min-api.cryptocompare.com/data/price", {
    params: { fsym: "ETH", tsyms: "USD" },
    timeout: 5000,
  });
  return res.data.USD as number;
}

main().catch((err) => {
  console.error("❌ Error:", err.message || err);
  process.exit(1);
});
