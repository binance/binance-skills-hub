import dotenv from "dotenv";
dotenv.config({ override: false });
import {
  createPublicClient,
  http,
  formatUnits,
  parseUnits,
} from "viem";
import { mainnet } from "viem/chains";

const RPC_URL = process.env.ETH_RPC_URL || "https://ethereum-rpc.publicnode.com";
const GAS_LIMIT_USDT = 110000n;

async function getGasSummary(publicClient: ReturnType<typeof createPublicClient>) {
  const [feeData, block, latestBlock] = await Promise.all([
    publicClient.estimateFeesPerGas(),
    publicClient.getBlock({ blockTag: "latest" }),
    publicClient.getBlockNumber(),
  ]);

  const maxFee = feeData.maxFeePerGas!;
  const maxPrio = feeData.maxPriorityFeePerGas!;
  const baseFee = feeData.gasPrice
    ? maxFee - maxPrio // ประมาณ baseFee = maxFee - maxPrio (EIP-1559)
    : maxFee - maxPrio;

  // gas cost ใน ETH + USD (ประมาณ)
  const gasCostEth = formatUnits(maxFee * GAS_LIMIT_USDT, 18);
  let ethPrice: number | null = null;
  try {
    const axios = await import("axios");
    const res = await axios.get("https://min-api.cryptocompare.com/data/price", {
      params: { fsym: "ETH", tsyms: "USD" },
      timeout: 5000,
    });
    ethPrice = res.data.USD as number;
  } catch {
    // ignore
  }
  const gasCostUsd = ethPrice ? parseFloat(gasCostEth) * ethPrice : null;

  return {
    maxFeeGwei: parseFloat(formatUnits(maxFee, 9)),
    maxPrioGwei: parseFloat(formatUnits(maxPrio, 9)),
    baseFeeGwei: parseFloat(formatUnits(baseFee, 9)),
    gasCostEth: parseFloat(gasCostEth),
    gasCostUsd,
    blockNumber: Number(latestBlock),
    timestamp: new Date().toISOString(),
  };
}

function rateLevel(gwei: number): { label: string; emoji: string } {
  if (gwei <= 10) return { label: "🟢 ถูกมาก", emoji: "🟢" };
  if (gwei <= 30) return { label: "🟢 ถูก", emoji: "🟢" };
  if (gwei <= 60) return { label: "🟡 ปานกลาง", emoji: "🟡" };
  if (gwei <= 100) return { label: "🟠 ค่อนข้างแพง", emoji: "🟠" };
  return { label: "🔴 แพง", emoji: "🔴" };
}

async function main() {
  const args = process.argv.slice(2);
  const watchMode = args.includes("--watch");
  const intervalSec = 10;

  const publicClient = createPublicClient({ chain: mainnet, transport: http(RPC_URL) });

  console.log("════════════════════════════════════════════════════");
  console.log("  ⛽ REAL-TIME GAS PRICE MONITOR — Ethereum Mainnet");
  console.log(`  RPC: ${RPC_URL}`);
  if (watchMode) console.log(`  Mode: WATCH — อัพเดททุก ${intervalSec} วินาที (Ctrl+C เพื่อยุติ)`);
  console.log("════════════════════════════════════════════════════");

  let bestSample = Infinity;

  const runCheck = async () => {
    try {
      const g = await getGasSummary(publicClient);
      const level = rateLevel(g.maxFeeGwei);
      const marker = g.maxFeeGwei <= bestSample ? "⬇️ NEW BEST" : "";
      if (g.maxFeeGwei < bestSample) bestSample = g.maxFeeGwei;

      console.log(`\n[${new Date().toLocaleTimeString("th-TH")}] Block #${g.blockNumber.toLocaleString()}`);
      console.log(`  MaxFeePerGas : ${g.maxFeeGwei.toFixed(4)} gwei  ${level.label}`);
      console.log(`  BaseFee      : ${g.baseFeeGwei.toFixed(4)} gwei`);
      console.log(`  MaxPrioFee   : ${g.maxPrioGwei.toFixed(4)} gwei`);
      console.log(`  Gas cost/tx  : ${g.gasCostEth.toFixed(6)} ETH${g.gasCostUsd ? ` (~$${g.gasCostUsd.toFixed(2)})` : ""}`);
      console.log(`  Best so far  : ${bestSample.toFixed(4)} gwei  ${marker}`);

      if (g.maxFeeGwei <= 30) {
        console.log("  ✅ ช่วงนี้ gas ถูก — เหมาะสำหรับโอน USDT");
      } else {
        console.log("  ⏳ ยังไม่เหมาะ — แนะนำรอให้ < 30 gwei");
      }
    } catch (err: unknown) {
      console.error("  ⚠️ ดึงข้อมูลล้มเหลว:", (err as Error).message);
    }
  };

  await runCheck();
  if (watchMode) {
    setInterval(runCheck, intervalSec * 1000);
  } else {
    console.log("\n════════════════════════════════════════════════════");
    console.log("  แนะนำ: รัน '--watch' เพื่อเฝ้าดู gas แบบ real-time");
    console.log("════════════════════════════════════════════════════");
  }
}

main().catch((err) => {
  console.error("❌ Error:", (err as Error).message);
  process.exit(1);
});
