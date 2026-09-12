# 🔨 Skill: Foundry (Forge & Cast) - Smart Contract Toolkit

Foundry เป็นชุดเครื่องมือที่เขียนด้วย Rust สำหรับการพัฒนา Ethereum ซึ่งรวดเร็วและมีประสิทธิภาพสูง ประกอบด้วย Forge (Deployment/Testing) และ Cast (RPC interaction)

## 🚀 ความสามารถหลัก (Core Capabilities)

1.  **Forge Create**: คอมไพล์และ Deploy Smart Contract ขึ้น Chain
2.  **Forge Verify**: ตรวจสอบ Source Code บน Etherscan (Verify Contract)
3.  **Forge Test**: รัน Unit Test ที่เขียนด้วย Solidity (เร็วมาก)
4.  **Cast**: อ่านข้อมูลจาก Chain, แปลงหน่วย (Wei/Eth), หรือเรียกฟังก์ชันโดยตรงผ่าน RPC

## 🛠️ วิธีใช้งาน (Usage)

### 1. Deploy Contract และ Verify ทันที
```bash
forge create --broadcast \
  --rpc-url <RPC_URL> \
  --private-key <PRIVATE_KEY> \
  src/ContractFile.sol:ContractName \
  --verify \
  --verifier etherscan \
  --etherscan-api-key <ETHERSCAN_API_KEY>
```

### 2. Verify Contract ที่ Deploy ไปแล้ว
```bash
forge verify-contract <CONTRACT_ADDRESS> \
  src/ContractFile.sol:ContractName \
  --chain mainnet \
  --verifier etherscan \
  --etherscan-api-key <ETHERSCAN_API_KEY>
```

### 3. ตรวจสอบยอด ETH ด้วย Cast
```bash
cast balance <ADDRESS> --rpc-url <RPC_URL>
```

## 📝 การตั้งค่าสภาพแวดล้อม
Foundry จะอ่านค่าจากไฟล์ `.env` หรือ Environment Variables โดยตรง:
*   `ETH_RPC_URL`: URL ของ RPC Node
*   `PRIVATE_KEY`: Private Key ของผู้ส่ง
*   `ETHERSCAN_API_KEY`: API Key สำหรับการ Verify

## ⚠️ ข้อควรระวัง
*   ควรใช้ `--broadcast` เมื่อต้องการส่งธุรกรรมจริงขึ้น Chain เท่านั้น
*   เก็บรักษา `PRIVATE_KEY` ในไฟล์ `.env` และตั้งค่าสิทธิ์การเข้าถึงให้รัดกุม (`chmod 600`)
