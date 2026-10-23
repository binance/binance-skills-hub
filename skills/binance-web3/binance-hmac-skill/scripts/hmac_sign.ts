import dotenv from "dotenv";
dotenv.config({ override: false });
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { maskString } from "./mask_key.js";

function runHmacSign() {
  // 1. Load Binance secret key and sender address from .env
  const secretKey = process.env.BINANCE_SECRET_KEY;
  const senderAddress = process.env.ETH_ADDRESS_SENDER;

  if (!secretKey) {
    console.error("❌ Error: กรุณากำหนดค่า BINANCE_SECRET_KEY ในไฟล์ .env ก่อนใช้งาน");
    process.exit(1);
  }
  if (!senderAddress) {
    console.error("❌ Error: กรุณากำหนดค่า ETH_ADDRESS_SENDER ในไฟล์ .env ก่อนใช้งาน");
    process.exit(1);
  }

  // 2. Message to sign (raw string of sender address)
  const message = senderAddress;
  const messageBuffer = Buffer.from(message, "utf-8");

  // 3. HMAC-SHA256 signature with Binance secret key (Binance API signature scheme)
  const hmac = crypto.createHmac("sha256", secretKey);
  hmac.update(messageBuffer);
  const signatureHex = hmac.digest("hex");
  const signatureB64 = hmac ? crypto.createHmac("sha256", secretKey).update(messageBuffer).digest("base64") : "";

  console.log("============================================================");
  console.log("🔐 BINANCE HMAC-SHA256 SIGNATURE (Secret Key → Message)");
  console.log("============================================================");
  console.log("BINANCE_SECRET_KEY  :", maskString(secretKey));
  console.log("Message (ETH sender):", maskString(message));
  console.log("Message Length      :", messageBuffer.length, "Bytes |", messageBuffer.length * 8, "Bits");
  console.log("Signature (Hex)     :", maskString(signatureHex));
  console.log("Signature (Base64)  :", maskString(signatureB64));
  console.log("Algorithm           : HMAC-SHA256");
  console.log("Scheme              : Binance API signature (createHmac + update + digest)");
  console.log("============================================================");

  // 4. Append results to .data file (update existing .data JSON)
  const dataPath = path.resolve(process.cwd(), ".data");
  let dataObj: Record<string, unknown> = {};
  if (fs.existsSync(dataPath)) {
    try {
      dataObj = JSON.parse(fs.readFileSync(dataPath, "utf-8"));
    } catch {
      dataObj = {};
    }
  }
  dataObj.hmac_signature = {
    algorithm: "HMAC-SHA256",
    key_source: "BINANCE_SECRET_KEY (.env)",
    message: message,
    signature_hex: signatureHex,
    signature_base64: crypto.createHmac("sha256", secretKey).update(messageBuffer).digest("base64"),
    created_at: new Date().toISOString(),
    purpose: "HMAC signature over ETH_ADDRESS_SENDER for Binance auth / USDT ERC-20 transfer record",
  };
  fs.writeFileSync(dataPath, JSON.stringify(dataObj, null, 2) + "\n", "utf-8");
  console.log("✅ บันทึก HMAC signature ลงไฟล์ .data เรียบร้อย");
  console.log("============================================================");
}

runHmacSign();
