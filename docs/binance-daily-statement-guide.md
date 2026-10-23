# คู่มือ Binance Daily Statement Update (1H Daily .data)

เอกสารนี้อธิบายระบบสร้างรายงานรายวันแบบ Read-Only (`binance-daily.data`) ซึ่งออกแบบตามโครงสร้างรายงานประจำวันของ Ondo Stocks (Verification Agent: Ankura Trust Company) ครอบคลุม Binance ID, HMAC verification, ยอดคงเหลือ (balances), และข้อมูลหนึ่ง/สองสำคัญของโทเคนหุ้ นแบบ Ondo

## ภาพรวมระบบ

ระบบประกอบด้วยสคริปต์ `scripts/fetch-daily-data.mjs` และ GitHub Actions workflow `.github/workflows/binance-daily-data.yml` ซึ่งรันอัตโนมัติ **วันละ 1 ครั้ง ณ เวลา 00:05 UTC** พร้อมรองรับการกดรันทันที (workflow_dispatch) ผลลัพธ์ถูก commit ลง `data/binance-daily.data` บน branch main โดยอัตโนมัติ

| ส่วนประกอบ | ตำแหน่ง | หน้าที่ |
| --- | --- | --- |
| สคริปต์หลัก | `scripts/fetch-daily-data.mjs` | ดึงข้อมูล read-only ทุกหมวดและเขียนเป็น JSON |
| Workflow | `.github/workflows/binance-daily-data.yml` | รันทุกวัน 00:05 UTC + manual trigger |
| ผลลัพธ์ | `data/binance-daily.data` | ไฟล์ JSON รายงานรายวัน (ยกเว้นจาก gitignore) |
| Secrets | GitHub repository secrets | `BINANCE_API_KEY`, `BINANCE_SECRET_KEY`, `BINANCE_UID` (optional) |

## โครงสร้างรายงานรายวัน

รายงานจำลองแบบรายงาน Ondo Stocks รายวัน โดยมีหัวข้อหลักดังนี้

```
statement_header        : วันที่รายงาน (UTC) + คำอธิบาย "as of end of day"
binance_identity        : Binance ID (uid), permissions, server time, HMAC proof
balances                : ยอดคงเหลือทุกโทเคนที่ไม่เป็นศูนย์ (free/locked) — เทียบเคียง "Total Assets"
ondo_statement          : ข้อมูลหุ้ น Ondo: ราคา, P/E, dividend yield, 52-week range,
                          market cap, holders, สถานะตลาด (openState/reasonCode)
market_24h              : สรุปตลาด 24 ชม. (จำนวนคู่ขึ้น/ลง, top gainers)
summary                 : สรุปรายงาน: read_only=true, hmac_verification=passed
```

ทุกไฟล์มีธง `read_only: true` และระบบไม่มีโค้ดสั่ งซื้อ/ขาย/ถอนเงินเลยแม้แต่จุดเดียว

## Binance ID + HMAC Verification

รายงานยืนยันตัวตนบัญชีผ่าน HMAC-SHA256:

1. สคริปต์เรียก `/api/v3/time` (public) เพื่อได้ server time ของ Binance
2. คำนวณ clock offset ระหว่าง runner กับ server แล้วใช้ timestamp ที่ปรับแล้วใน signed request ทุกครั้ง
3. เรียก `/api/v3/account` แบบ signed (timestamp + `recvWindow` + HMAC signature ของ secret) เพื่อได้ **Binance ID (uid)**
4. สร้าง `hmac_proof_sha256` = SHA-256(`uid:{uid}|time:{serverTime}|daily`) โดยใช้ secret จริง — มีเฉพาะผู้ถือ secret ของจริงเท่านั้นที่สร้างค่าได้
5. ถ้าตั้งค่า `BINANCE_UID` ไว้ใน GitHub Secrets workflow จะตรวจ `uid_matches_expected == true`; ถ้าไม่ตั้งค่า จะข้ามเฉพาะ expected-UID check แต่ยังต้องให้ `binance_id` และ `hmac_verified == true`

ค่า `BINANCE_UID` เป็น optional validation secret เท่านั้น และไม่ควร hardcode ลง source, workflow, log หรือ commit

## ข้อมูล Ondo Tokenized Stocks

ระบบใช้ BAPI (public, ไม่ต้อง key) สอง API:

- **Token Symbol List** (`/rwa/stock/detail/list/ai?type=1`) — รายชื่อ 1,300+ โทเคนหุ้ น
- **RWA Dynamic V2** (`/rwa/dynamic/ai?chainId=...&contractAddress=...`) — ราคา on-chain, holders, US stock fundamentals (P/E, dividend yield, 52-week range), market cap

หุ้ นที่ดึงโดยค่าเริ่มต้นคือ `GOOGL,AAPL,TSLA` — เปลี่ยนได้ผ่าน env `BINANCE_STOCKS` (หรือ secrets `BINANCE_STOCKS` บน GitHub)

> หมายเหตุ: แต่ละหุ้ น deploy 2 chain (Ethereum + BSC) — สคริปต์เลือกเพียง chain แรกต่อหุ้ นเพื่อไม่ให้ซ้ำ

## การรันทดสอบ (local)

```bash
cd /home/ubuntu/binance-skills-hub
source .env && export BINANCE_API_KEY BINANCE_SECRET_KEY BINANCE_UID BINANCE_RECV_WINDOW
BINANCE_STOCKS=GOOGL,AAPL,TSLA DATA_DIR=/tmp/daily-test \
  DATA_FILE=/tmp/daily-test/binance-daily.data node scripts/fetch-daily-data.mjs
```

หาก local env ไม่ได้กำหนด `BINANCE_UID` สคริปต์จะเขียน `uid_check_status: "not_configured"` และยังตรวจ HMAC/authentication ตามปกติ

## การตั้ง GitHub Secrets อย่างปลอดภัย

ไปที่ `Settings → Secrets and variables → Actions` แล้วสร้าง repository secrets ดังนี้:

- `BINANCE_API_KEY`
- `BINANCE_SECRET_KEY`
- `BINANCE_UID` (optional; ใช้เฉพาะตรวจว่าบัญชีที่ตอบจาก Binance ตรงกับบัญชีที่คาดไว้)

ข้อควรระวัง:

- ห้ามใส่ค่า API key, secret key หรือ UID จริงลงใน source code, workflow YAML, `.env.example`, PR description หรือ log
- workflow นี้ส่งค่าเข้า script ผ่าน environment variables จาก GitHub Secrets เท่านั้น
- log ของ workflow ควรแสดงเฉพาะสถานะ เช่น `hmac_verified` และ `uid_check_status` โดยไม่พิมพ์ค่า UID จริง

## ความปลอดภัย

- secrets จริงอยู่ใน GitHub Secrets เท่านั้น — `.env` ถูก gitignore, `write-env.sh` ไม่ commit
- signed request ของ daily workflow sync เวลากับ `/api/v3/time` ก่อน และใช้ `recvWindow` แบบตรวจสอบช่วงค่าแล้ว (ค่าเริ่มต้น 5000 ms)
- workflow รันบน default branch เท่านั้นเมื่อ PR merge เข้า main
- ห้ามเพิ่มโค้ด trade/withdraw เขา้ repo เด็ดขาด — guard check (`check-no-tracked-data.mjs`) จะบล็อกไฟล์ `.data` อื่นที่ไม่อยู่ใน allowed list

## อ้างอิง

- รายงานต้นแบบ: Ondo Stocks Daily Report (Ankura Trust Company) — `docs/` ของโปรเจกต์และ PDF `daily-YYYY-MM-DD.pdf`
- Binance Tokenized Securities Info Skill: [binance.com/en/skills/detail/binance-web3/binance-tokenized-securities-info](https://www.binance.com/en/skills/detail/binance-web3/binance-tokenized-securities-info)
