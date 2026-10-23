import dotenv from "dotenv";
dotenv.config({ override: false });
import crypto from "node:crypto";
import https from "node:https";
import fs from "node:fs";
import path from "node:path";
import { maskString } from "./mask_key.js";

const API_KEY = process.env.BINANCE_API_KEY;
const SECRET_KEY = process.env.BINANCE_SECRET_KEY;

if (!API_KEY || !SECRET_KEY) {
  console.error("❌ Error: กรุณากำหนด BINANCE_API_KEY และ BINANCE_SECRET_KEY ในไฟล์ .env ก่อนใช้งาน");
  process.exit(1);
}

// ──────────────────────────────────────────────────────────
// Binance Official Signing Scheme (HMAC-SHA256)
// อ้างอิง: https://developers.binance.com/docs/binance-spot-api-docs
// "A signed endpoint requires an additional parameter, signature, to be sent."
// "signature = HMAC-SHA256(queryString, secretKey)"
// ──────────────────────────────────────────────────────────

function signBinance(params: string): string {
  const hmac = crypto.createHmac("sha256", SECRET_KEY);
  hmac.update(params);
  return hmac.digest("hex");
}

async function signedRequest(method: string, urlPath: string, params: string): Promise<object> {
  const signature = signBinance(params);
  const query = params ? `${params}&signature=${signature}` : `signature=${signature}`;
  const url = `https://api.binance.com${urlPath}?${query}`;

  return new Promise((resolve, reject) => {
    const req = https.get(
      url,
      {
        headers: { "X-MBX-APIKEY": API_KEY },
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            resolve(JSON.parse(data));
          } catch {
            resolve({ raw: data, status: res.statusCode });
          }
        });
      }
    );
    req.on("error", reject);
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error("Request timeout"));
    });
  });
}

async function runBinanceSecretSign() {
  const args = process.argv.slice(2);
  const command = args[0] || "account";

  console.log("============================================================");
  console.log("🔐 BINANCE SECRET KEY SIGNING — ลงนามคำขอ API (HMAC-SHA256)");
  console.log(`   เวลา: ${new Date().toLocaleString("th-TH", { timeZone: "Asia/Bangkok" })}`);
  console.log("============================================================");
  console.log("BINANCE_API_KEY    :", maskString(API_KEY));
  console.log("BINANCE_SECRET_KEY :", maskString(SECRET_KEY));
  console.log("Scheme             : Binance Signed Endpoint (HMAC-SHA256)");
  console.log("Signature公式       : HMAC-SHA256(queryString, SECRET_KEY)");
  console.log("============================================================");

  const timestamp = Date.now().toString();
  const recvWindow = "5000";

  if (command === "account") {
    // SIGNED: GET /api/v3/account — ดึง account + balances (ต้อง sign ด้วย secret key)
    console.log("\n📋 คำขอ SIGNED: GET /api/v3/account");
    const params = `timestamp=${timestamp}&recvWindow=${recvWindow}`;
    console.log("QueryString (ก่อน sign) :", params);
    console.log("Signature               :", maskString(signBinance(params)));
    const result = await signedRequest("GET", "/api/v3/account", params);
    console.log("\n--- 📊 Result ---");
    console.log(JSON.stringify(result, null, 2));

    // save account balances summary to .data
    if (result && Array.isArray((result as { balances?: unknown[] }).balances)) {
      const dataPath = path.resolve(process.cwd(), ".data");
      let dataObj: Record<string, unknown> = {};
      if (fs.existsSync(dataPath)) {
        try {
          dataObj = JSON.parse(fs.readFileSync(dataPath, "utf-8"));
        } catch {
          dataObj = {};
        }
      }
      const acct = result as { balances: { asset: string; free: string; locked: string }[] };
      dataObj.binance_signed_account = {
        algorithm: "HMAC-SHA256 (Binance Signed Endpoint)",
        secret_key_source: "BINANCE_SECRET_KEY (.env)",
        endpoint: "GET /api/v3/account",
        signed_at: new Date().toISOString(),
        balances: acct.balances.filter((b) => parseFloat(b.free) > 0 || parseFloat(b.locked) > 0),
      };
      fs.writeFileSync(dataPath, JSON.stringify(dataObj, null, 2) + "\n", "utf-8");
      console.log("\n✅ บันทึกผลลง .data เรียบร้อย");
    }
  } else if (command === "withdraw" || command === "demo") {
    // SIGNED: POST /sapi/v1/capital/withdraw/apply — ตัวอย่างคำขอถอน (demo mode ไม่รันจริง)
    console.log("\n💸 คำขอ SIGNED: POST /sapi/v1/capital/withdraw/apply (DEMO — แสดงเฉพาะ signature)");
    const withdrawParams = `coin=USDT&address=0x42e59df01494f78c4abe5a45bab650efed81f91b&amount=100&timestamp=${timestamp}`;
    const sig = signBinance(withdrawParams);
    console.log("QueryString :", withdrawParams);
    console.log("Signature   :", maskString(sig));
    console.log("⚠️  DEMO: ไม่ได้ส่งคำขอจริง (ถอนจริงต้องยืนยัน 2FA/whitelist ของ account)");

    const dataPath = path.resolve(process.cwd(), ".data");
    let dataObj: Record<string, unknown> = {};
    if (fs.existsSync(dataPath)) {
      try {
        dataObj = JSON.parse(fs.readFileSync(dataPath, "utf-8"));
      } catch {
        dataObj = {};
      }
    }
    dataObj.binance_withdraw_signature_demo = {
      algorithm: "HMAC-SHA256 (Binance Signed Endpoint)",
      secret_key_source: "BINANCE_SECRET_KEY (.env)",
      endpoint: "POST /sapi/v1/capital/withdraw/apply",
      coin: "USDT",
      amount: 100,
      signature_hex: maskString(sig),
      signed_at: new Date().toISOString(),
      note: "Demo — signature พร้อมใช้ แต่ไม่ broadcast จริง",
    };
    fs.writeFileSync(dataPath, JSON.stringify(dataObj, null, 2) + "\n", "utf-8");
    console.log("✅ บันทึก signature demo ลง .data เรียบร้อย");
  } else {
    console.error("Usage: bun run binance_secret_sign.ts [account|withdraw|demo]");
    process.exit(1);
  }

  console.log("============================================================");
}

runBinanceSecretSign();
