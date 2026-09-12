# binance-hmac-skill — Binance Secret Key HMAC Signing

Skill สำหรับลงนาม (sign) ข้อความและคำขอ API ของ Binance ด้วย **HMAC-SHA256** ตาม spec ทางการของ Binance Exchange API

## วัตถุประสงค์

- ลงนามข้อความ (message) ใด ๆ ด้วย `BINANCE_SECRET_KEY` ในรูปแบบ HMAC-SHA256 (hex + base64)
- เซ็นคำขอ Binance signed endpoint (timestamp + recvWindow + signature) ตาม official scheme
- บันทึกลายเซ็นลงไฟล์ `.data` (chmod 600) โดยไม่เก็บ key ใน output

## ข้อกำหนด (Requirements)

- Bun runtime (`bun --version`)
- ไฟล์ `.env` ต้องมีตัวแปร:
  - `BINANCE_API_KEY` — Binance API Key
  - `BINANCE_SECRET_KEY` — Binance Secret Key
  - `ETH_ADDRESS_SENDER` — (optional) address ที่ใช้เป็นข้อความต้นแบบ
- ไม่ commit ไฟล์ `.env` หรือ `.data` เข้า repo เด็ดขาด

## สคริปต์

| ไฟล์ | หน้าที่ |
|---|---|
| `scripts/hmac_sign.ts` | ลงนามข้อความ ETH_ADDRESS_SENDER ด้วย HMAC-SHA256 → .data |
| `scripts/binance_secret_sign.ts` | เซ็น Binance signed endpoint (account / withdraw demo) พร้อมทดสอบ API จริง |
| `scripts/mask_key.ts` | helper maskString() ปิดบังส่วนท้ายของข้อมูลความลับ |

## วิธีใช้

```bash
cd skills/binance-web3/binance-hmac-skill
bun install
bun run scripts/hmac_sign.ts              # sign message → .data
bun run scripts/binance_secret_sign.ts account   # เซ็น + ดึง account/balances จริง
bun run scripts/binance_secret_sign.ts withdraw  # เซ็นคำขอถอน (demo — เฉพาะ signature)
```

## Scheme ที่ใช้ (Binance Official)

```
queryString  = coin=USDT&address=<addr>&amount=100&timestamp=<ms>
signature    = HMAC-SHA256(queryString, SECRET_KEY)
request      = POST /sapi/v1/capital/withdraw/apply + header X-MBX-APIKEY
```

## ความปลอดภัย

- Signature เป็นแค่การยืนยันต้นทาง (authentication) สำหรับ Binance API
- **ไม่สามารถใช้โอน USDT ERC-20 บน Ethereum ได้** — Ethereum บังคับ ECDSA secp256k1 private key ของ address
- สคริปต์ mask ค่าทุกอย่างที่แสดงบนหน้าจอ (ส่วนท้าย 4 ตัวอักษร)
- `.data` อยู่ใน .gitignore / ห้าม commit

## Output

- JSON ที่บันทึกลง `.data`: `hmac_signature` (hex + base64, timestamp) และ `binance_signed_account` (balances จริงจาก API)
