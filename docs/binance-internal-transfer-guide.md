# Binance Internal Transfer Guide / คู่มือ Binance Internal Transfer

## English

### What this feature is

`skills/binance/internal-transfer/scripts/internal-transfer.mjs` validates and previews a **crypto internal transfer flow**.  
It is **not** a fiat withdrawal, bank transfer, or autonomous scheduled-send feature.

The script follows the same private-request safety model as the daily Binance report:

- sync Binance server time first,
- validate `BINANCE_RECV_WINDOW`,
- sign requests with HMAC-SHA256,
- verify the source account UID when `BINANCE_UID` is configured,
- redact sensitive material in errors and logs.

### Important Binance API limitation

The documented Binance wallet endpoint for this area is:

- `POST /sapi/v1/asset/transfer`

That official endpoint uses account-type transfer parameters such as `type`, `asset`, and `amount`.  
It does **not** document a recipient UID parameter for arbitrary UID-to-UID transfers.

Because of that, this repository implements a **safe adapter boundary**:

- `BINANCE_TARGET_UID` is validated and shown in the explicit confirmation prompt,
- the signed request preview shows the documented endpoint shape,
- but live UID-routed mutation is refused instead of inventing unsupported behavior.

### Environment variables

Required:

- `BINANCE_API_KEY`
- `BINANCE_SECRET_KEY`
- `BINANCE_TRANSFER_AMOUNT`
- `BINANCE_TARGET_UID`
- `BINANCE_TRANSFER_FROM_ACCOUNT`
- `BINANCE_TRANSFER_TO_ACCOUNT`

Optional:

- `BINANCE_UID` — expected source UID check
- `BINANCE_TRANSFER_ASSET` — defaults to `USDT`
- `BINANCE_FIAT_CURRENCY` — defaults to `USD`
- `BINANCE_RECV_WINDOW` — defaults to `5000`, must stay within `1000-60000`
- `BINANCE_BASE_URL` / `PUBLIC_MIRROR_URL` — optional endpoint override

### Usage

Dry-run is the default:

```bash
node /home/runner/work/binance-skills-hub/binance-skills-hub/skills/binance/internal-transfer/scripts/internal-transfer.mjs
```

Explicit send mode:

```bash
node /home/runner/work/binance-skills-hub/binance-skills-hub/skills/binance/internal-transfer/scripts/internal-transfer.mjs --send
```

`--send` always requires interactive confirmation containing:

- target UID
- asset
- amount
- account types

If the confirmation is not accepted, the script exits without mutation.

### API permissions and operational risk

- Use Binance API credentials that are allowed to access signed wallet/account endpoints.
- Do not hardcode keys, secrets, or UIDs in tracked files.
- Do not write target UID, amount, signed payloads, or transaction IDs into tracked files.
- If you save local runtime output yourself, keep it in an ignored `.data` path and apply `chmod 600`.
- This repository still does **not** implement fiat withdrawal, bank transfer, or autonomous scheduled sending.

### USD valuation semantics

`BINANCE_FIAT_CURRENCY=USD` enables a **read-only estimate** using Binance public market-data quotes such as `/api/v3/ticker/price`.  
This is only a valuation/reporting aid at quote time; it does **not** mean the transfer itself is fiat.

If no suitable Binance public quote is available, valuation fails safe and the transfer preview still remains dry-run only.

## ภาษาไทย

### ฟีเจอร์นี้คืออะไร

สคริปต์ `skills/binance/internal-transfer/scripts/internal-transfer.mjs` ใช้สำหรับ **ตรวจสอบและพรีวิวการโอนคริปโตภายในระบบ Binance**  
ฟีเจอร์นี้ **ไม่ใช่** การถอนเงิน Fiat, การโอนเข้าธนาคาร หรือระบบส่งอัตโนมัติแบบตั้งเวลา

แนวทางความปลอดภัยอ้างอิงจาก daily report เดิม:

- sync เวลาเซิร์ฟเวอร์ Binance ก่อน
- ตรวจช่วงค่าของ `BINANCE_RECV_WINDOW`
- sign คำขอด้วย HMAC-SHA256
- ตรวจ `BINANCE_UID` ของบัญชีต้นทางเมื่อมีการตั้งค่า
- ซ่อนข้อมูลสำคัญใน error และ log

### ข้อจำกัดสำคัญของ Binance API

เอกสารทางการของ Binance สำหรับส่วนนี้ระบุ endpoint:

- `POST /sapi/v1/asset/transfer`

endpoint นี้รองรับพารามิเตอร์แบบ account-type transfer เช่น `type`, `asset`, `amount`  
แต่ **ไม่ได้** ระบุพารามิเตอร์ recipient UID สำหรับการโอน UID-to-UID แบบทั่วไป

ดังนั้น repo นี้จึงใช้ **safe adapter boundary**:

- รับ `BINANCE_TARGET_UID` เพื่อ validation และแสดงในขั้นตอนยืนยัน
- แสดง signed request preview ตามรูปแบบ endpoint ที่มีเอกสารรองรับ
- แต่ปฏิเสธ live mutation ที่อ้างว่าโอนไปยัง UID โดยตรง เพื่อไม่สร้างพฤติกรรมที่ Binance ยังไม่ได้ document

### ตัวแปรแวดล้อม

ต้องมี:

- `BINANCE_API_KEY`
- `BINANCE_SECRET_KEY`
- `BINANCE_TRANSFER_AMOUNT`
- `BINANCE_TARGET_UID`
- `BINANCE_TRANSFER_FROM_ACCOUNT`
- `BINANCE_TRANSFER_TO_ACCOUNT`

ไม่บังคับ:

- `BINANCE_UID` — ใช้ตรวจ UID ของบัญชีต้นทาง
- `BINANCE_TRANSFER_ASSET` — ค่าเริ่มต้น `USDT`
- `BINANCE_FIAT_CURRENCY` — ค่าเริ่มต้น `USD`
- `BINANCE_RECV_WINDOW` — ค่าเริ่มต้น `5000` และต้องอยู่ในช่วง `1000-60000`

### วิธีใช้งาน

ค่าเริ่มต้นคือ dry-run:

```bash
node /home/runner/work/binance-skills-hub/binance-skills-hub/skills/binance/internal-transfer/scripts/internal-transfer.mjs
```

หากต้องการ send mode แบบ explicit:

```bash
node /home/runner/work/binance-skills-hub/binance-skills-hub/skills/binance/internal-transfer/scripts/internal-transfer.mjs --send
```

`--send` จะมี interactive confirmation ทุกครั้ง โดยต้องแสดง:

- target UID
- asset
- amount
- account types

ถ้าไม่ยืนยัน สคริปต์จะหยุดทันทีโดยไม่ทำ mutation

### สิทธิ์ API และความเสี่ยง

- ใช้ API key/secret ที่ได้รับสิทธิ์สำหรับ signed wallet/account endpoints เท่านั้น
- ห้าม hardcode key, secret หรือ UID จริงลงไฟล์ที่ track ใน git
- ห้ามบันทึก target UID, amount, signed payload หรือ transaction ID ลง tracked files
- ถ้าจำเป็นต้องเก็บ output ไว้ local ให้เก็บใน path ที่ถูก ignore เช่น `.data` และตั้งสิทธิ์ `chmod 600`
- repo นี้ยัง **ไม่** เพิ่มการถอน Fiat, bank transfer หรือ scheduled send อัตโนมัติ

### ความหมายของ USD valuation

`BINANCE_FIAT_CURRENCY=USD` ใช้สำหรับ **ประเมินมูลค่าโดยประมาณ** จาก Binance public market-data endpoint เช่น `/api/v3/ticker/price` เท่านั้น  
ไม่ได้แปลว่าการโอนนั้นกลายเป็นการโอนเงิน Fiat

หากไม่พบราคา public ที่เหมาะสม ระบบจะ fail-safe และยังคงเป็นเพียง dry-run/preview
