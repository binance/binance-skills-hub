# 👷 Skill: Hardhat - Ethereum Development Environment

Hardhat เป็นสภาพแวดล้อมการพัฒนาสำหรับมืออาชีพที่ช่วยในการคอมไพล์, Deploy, ทดสอบ และ Debug Smart Contract บน Ethereum และเครือข่ายที่รองรับ EVM

## 🚀 ความสามารถหลัก (Core Capabilities)

1.  **Contract Verification**: ตรวจสอบ Source Code บน Etherscan โดยอัตโนมัติผ่าน plugin `@nomicfoundation/hardhat-verify`
2.  **Flexible Deployment**: ใช้สคริปต์ JavaScript/TypeScript ในการ Deploy ที่ซับซ้อน
3.  **Hardhat Network**: มี Local Ethereum Network ในตัวสำหรับการทดสอบพร้อมฟีเจอร์ console.log ใน Solidity
4.  **Extensible**: รองรับ Plugins มากมายเพื่อเพิ่มความสามารถ

## 🛠️ วิธีใช้งาน (Usage)

### 1. ติดตั้ง Plugin สำหรับ Verify
```bash
bun add --save-dev @nomicfoundation/hardhat-verify
```

### 2. ตั้งค่าใน `hardhat.config.ts`
```typescript
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-verify";
import * as dotenv from "dotenv";

dotenv.config();

const config: HardhatUserConfig = {
  solidity: "0.8.20",
  networks: {
    mainnet: {
      url: process.env.ETH_RPC_URL || "",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
};

export default config;
```

### 3. คำสั่ง Verify Contract
```bash
npx hardhat verify --network mainnet <CONTRACT_ADDRESS> "ConstructorArg1" "ConstructorArg2"
```

## 📝 ข้อดีเมื่อเทียบกับ Forge
*   Hardhat เหมาะกับโปรเจกต์ที่มีสคริปต์การ Deploy ที่ซับซ้อนและต้องการการจัดการสถานะ (State) ที่ยืดหยุ่นกว่า
*   รองรับระบบ Plugin ที่หลากหลายกว่าใน Ecosystem ของ JavaScript/TypeScript

## ⚠️ ข้อควรระวัง
*   ตรวจสอบให้แน่ใจว่าได้นำเข้า `@nomicfoundation/hardhat-verify` ในไฟล์ config แล้ว
*   API Key ใน `.env` ต้องถูกต้องและมีสิทธิ์เข้าถึงเครือข่ายที่เลือก
