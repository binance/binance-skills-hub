# คู่มือ Login binance-cli ด้วย API Key + Secret Key

เอกสารนี้อธิบายวิธีล็อกอิน `binance-cli` ด้วยคู่ API Key / Secret Key เพื่อให้ใช้งาน private endpoints (แบบ read-only) ได้

---

## 1. วิธี Login (สร้าง Profile)

`binance-cli` จัดการคุณสมบัติด้วยระบบ **Profile** — สร้างครั้งเดียว ใช้ได้ตลอด:

```bash
# แบบไม่ใช้ interactive (ใส่ค่าจาก .env)
binance-cli profile create \
  --name read-only-main \
  --env prod \
  --api-key "$BINANCE_API_KEY" \
  --api-secret "$BINANCE_SECRET_KEY" \
  --select --force
```

พารามิเตอร์:

| พารามิเตอร์ | ความหมาย |
| --- | --- |
| `--name` | ชื่อ profile (ใช้เรียกหลังๆ ด้วย `--profile <name>`) |
| `--env` | `prod` = Binance จริง, `testnet` = sandbox ทดสอบ |
| `--api-key` | API Key (จาก .env: `binance_api_key`) |
| `--api-secret` | Secret Key (จาก .env: `binane_secret_key`) |
| `--select` | เลือก profile นี้เป็นค่า default |
| `--force` | ทับ profile เดิมชื่อซ้ำ |

> ⚠️ คุณสมบัติถูกบันทึกใน `~/.config/@binance/binance-cli/profiles.json` — ไฟล์นี้เก็บ Secret Key แบบ plain text ไว้ในเครื่อง ท้องถิ่ น ห้าม push ขึ้น GitHub (repo นี้ gitignore `.*` ไว้แล้ว)

## 2. คำสั่งจัดการ Profile

```bash
binance-cli profile view                 # ดู profile ปัจจุบันที่ active
binance-cli profile list                 # รายชื่อ profile ทั้งหมด
binance-cli profile select read-only-main   # เปลี่ยน profile
binance-cli profile delete --name old    # ลบ profile เก่า
```

## 3. ทดสอบว่า Login สำเร็จ

หลัง login แล้ว ทดสอบด้วย endpoint แบบ private (ต้องลงนาม HMAC):

```bash
# ดูข้อมูลบัญชี: uid, permissions, balances (การทดสอบจริงวันที่ 2026-08-20 สำเร็จ ✅)
binance-cli spot get-account

# ราคาตลาด: BNBUSDT ~639 (+5.7% 24h)
binance-cli spot ticker --symbol BNBUSDT
```

ผลลัพธ์ที่ทดสอบจริง: `get-account` คืนข้อมูลบัญชีได้สมบูรณ์ (balances 828 โทเคน, ยอดคงเหลื่อรวมเป็นศูนย์ — บัญชียังไม่ได้เติมเงิน), ticker ทำงานปกติ

## 4. ความปลอดภัยของคีย์ที่ใช้

ผลการตรวจสอบ account แสดงว่า key นี้ยังมี:

| สิทธิ | สถานะ | ความหมาย |
| --- | --- | --- |
| `canTrade` | true | ยังสั่งซื้อ/ขายได้ (ควร revoke และสร้างคู่ใหม่ "Enable Reading only") |
| `canWithdraw` | true | ยังถอนเงินได้ (เสี่ยงสูงสุดหากคีย์รั่ว) |
| `permissions` | TRD_GRP_053, PRE_MARKET | กลุ่มคุณสมบัติเฉพาะ |

> คำแนะนำ: ในทางปฏิบัติระบบของเรา (สคริปต์ + workflow) ใช้เฉพาะ endpoint อ่านข้อมูลเท่านั้น แต่เพื่อความปลอดภัยชั้นแรก ควรไปที่ Binance → API Management → **Revoke** คู่เดิม → สร้างคู่ใหม่ติดกากบาทเฉพาะ "Enable Reading" และใส่ IP Allowlist

## 5. ใช้งานร่วมกับ .env

```bash
cd /home/ubuntu/binance-skills-hub
source .env
export BINANCE_API_KEY BINANCE_SECRET_KEY

# login
binance-cli profile create --name read-only-main --env prod \
  --api-key "$BINANCE_API_KEY" --api-secret "$BINANCE_SECRET_KEY" --select --force

# ใช้งาน
binance-cli spot get-account
```

หมายเหตุ: หากยังไม่ได้ login ผ่าน profile ให้ใช้ env vars โดยตรง (สคริปต์ `fetch-hourly-data.mjs` รองรับ `BINANCE_API_KEY` / `BINANCE_SECRET_KEY` อยู่แล้ว)
