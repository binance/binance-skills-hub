# 🛠️ Skill: sol2uml - Solidity UML & Storage Visualizer

Skill นี้ช่วยในการทำ Visualization สำหรับ Smart Contract เพื่อวิเคราะห์โครงสร้าง Class, ความสัมพันธ์ระหว่าง Contract และการจัดวาง Storage slots โดยดึงข้อมูลจาก Etherscan หรือไฟล์ Local

## 🚀 ความสามารถหลัก (Core Capabilities)

1.  **Class Diagram (`class`)**: สร้าง UML Class diagram แสดงการสืบทอด (Inheritance), State variables และ Functions
2.  **Storage Layout (`storage`)**: แสดงการจัดวาง Storage slots (Slot #, Offset, Type, Size) ซึ่งสำคัญมากสำหรับการวิเคราะห์ Proxy Contracts
3.  **Flattening (`flatten`)**: รวมไฟล์ Solidity ที่ถูก Verify แล้วบน Etherscan ให้เป็นไฟล์เดียว
4.  **Diff (`diff`)**: เปรียบเทียบความแตกต่างระหว่าง Contract สองตัว หรือ Contract กับไฟล์ Local

## 🛠️ วิธีใช้งาน (Usage)

### 1. สร้าง Class Diagram จาก Etherscan
```bash
sol2uml class <CONTRACT_ADDRESS> --network mainnet --apiKey <ETHERSCAN_API_KEY> -f png -o class_diagram.png
```

### 2. ดู Storage Layout
```bash
sol2uml storage <CONTRACT_ADDRESS> --network mainnet --apiKey <ETHERSCAN_API_KEY> -f png -o storage_layout.png
```

### 3. Flatten Contract
```bash
sol2uml flatten <CONTRACT_ADDRESS> --network mainnet --apiKey <ETHERSCAN_API_KEY> -o FlattenedContract.sol
```

## 📝 ตัวอย่างการใช้งานกับ USDT (Ethereum Mainnet)
*   **Address**: `0xdAC17F958D2ee523a2206206994597C13D831ec7`
*   **คำสั่ง**: ดู Storage ของ USDT เพื่อตรวจสอบว่ามีตัวแปรอะไรบ้างและอยู่ที่ Slot ไหน

## ⚠️ ข้อควรระวัง
*   `sol2uml` ไม่ได้ใช้ Solidity Compiler โดยตรง ผลลัพธ์บางอย่างอาจคลาดเคลื่อนหากมีการใช้ Expression ซับซ้อนใน Array size
*   ต้องใช้ API Key ของ Etherscan เพื่อดึง Source code ที่ถูก Verify แล้ว
