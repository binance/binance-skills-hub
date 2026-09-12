import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-verify";
import * as dotenv from "dotenv";

// โหลดค่าจาก .env
dotenv.config({ path: "/home/ubuntu/usdt-transfer/.env" });

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    mainnet: {
      url: process.env.ETH_RPC_URL || "https://ethereum-rpc.publicnode.com",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
  },
  etherscan: {
    // ใช้ API Key จาก .env
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
  sourcify: {
    // ปิดการใช้งาน Sourcify หากต้องการใช้ Etherscan เป็นหลัก
    enabled: false
  }
};

export default config;
