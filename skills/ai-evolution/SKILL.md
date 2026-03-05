---
name: ai-evolution
description: |
  Trade $EVO tokens on the AI Evolution platform (BSC). AI Evolution is a survival experiment where
  AI agents autonomously trade tokens. When market cap hits $500K, the AI evolves and spawns a new
  generation with a new token. Supports agent verification, buying and selling via PancakeSwap V2,
  balance checks, and real-time market data queries.
  Use this skill when users want to trade AI Evolution tokens, check EVO price/market cap,
  or participate in AI agent evolution on BNB Smart Chain.
metadata:
  version: "1.0"
  author: AIEvolutionFun
license: MIT
---

# AI Evolution Trading Skill

Trade $EVO tokens on BNB Smart Chain through PancakeSwap V2. AI Evolution is a survival experiment — each generation of AI corresponds to a token. When market cap reaches $500K, the AI evolves into the next generation.

## Overview

| Feature | Detail |
|---------|--------|
| Chain | BNB Smart Chain (BSC), Chain ID: 56 |
| DEX | PancakeSwap V2 |
| Token | $EVO (Generation 1) |
| Buy/Sell Tax | 2% each (1% next-gen liquidity + 1% prev-gen buyback) |
| Evolution Trigger | $500K market cap |

## Network Configuration

| Parameter | Value |
|-----------|-------|
| RPC URL | `https://bsc-dataseed.binance.org` |
| Chain ID | 56 |
| Native Currency | BNB |
| Block Explorer | https://bscscan.com |

## Contract Addresses

| Contract | Address |
|----------|---------|
| $EVO Token (Gen 1) | `0x7cb4c94Fc789b9313e7D81B108ece5dcd7b4045F` |
| PancakeSwap V2 Router | `0x10ED43C718714eb63d5aA57B78B54704E256024E` |
| WBNB | `0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c` |
| AgentVerifier | `0xda9c0975fD57DC93faDcC1039014f0ABF48F5803` |

## Token Details

| Field | Value |
|-------|-------|
| Name | Evolution |
| Symbol | EVO |
| Decimals | 18 |
| Total Supply | 1,000,000,000 |
| Buy Tax | 2% |
| Sell Tax | 2% |

---

## How to Buy $EVO with BNB

Call PancakeSwap V2 Router's `swapExactETHForTokensSupportingFeeOnTransferTokens` function.

**IMPORTANT**: You MUST use the `...SupportingFeeOnTransferTokens` variant because $EVO has a 2% transfer tax. Using regular swap functions will fail.

### Method

```
Contract: 0x10ED43C718714eb63d5aA57B78B54704E256024E
Function: swapExactETHForTokensSupportingFeeOnTransferTokens(uint amountOutMin, address[] path, address to, uint deadline)
Value: <BNB amount in wei>
```

### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| amountOutMin | uint256 | Minimum tokens to receive (use 0 for no slippage protection) |
| path | address[] | `["0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c", "0x7cb4c94Fc789b9313e7D81B108ece5dcd7b4045F"]` |
| to | address | Your wallet address (recipient) |
| deadline | uint256 | Unix timestamp + 600 (10 min from now) |

### ABI

```json
[
  {
    "name": "swapExactETHForTokensSupportingFeeOnTransferTokens",
    "type": "function",
    "stateMutability": "payable",
    "inputs": [
      { "name": "amountOutMin", "type": "uint256" },
      { "name": "path", "type": "address[]" },
      { "name": "to", "type": "address" },
      { "name": "deadline", "type": "uint256" }
    ],
    "outputs": []
  }
]
```

### Example (ethers.js)

```javascript
const { ethers } = require("ethers");
const provider = new ethers.JsonRpcProvider("https://bsc-dataseed.binance.org");
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

const router = new ethers.Contract("0x10ED43C718714eb63d5aA57B78B54704E256024E", [
  "function swapExactETHForTokensSupportingFeeOnTransferTokens(uint amountOutMin, address[] path, address to, uint deadline) payable"
], wallet);

const tx = await router.swapExactETHForTokensSupportingFeeOnTransferTokens(
  0,
  ["0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c", "0x7cb4c94Fc789b9313e7D81B108ece5dcd7b4045F"],
  wallet.address,
  Math.floor(Date.now() / 1000) + 600,
  { value: ethers.parseEther("0.01"), gasLimit: 300000 }
);
await tx.wait();
```

---

## How to Sell $EVO for BNB

Selling requires two steps: approve the router, then swap.

### Step 1: Approve Router

```
Contract: 0x7cb4c94Fc789b9313e7D81B108ece5dcd7b4045F
Function: approve(address spender, uint256 amount)
Arguments:
  spender = "0x10ED43C718714eb63d5aA57B78B54704E256024E"
  amount = 115792089237316195423570985008687907853269984665640564039457584007913129639935 (max uint256)
```

### Step 2: Swap Tokens for BNB

```
Contract: 0x10ED43C718714eb63d5aA57B78B54704E256024E
Function: swapExactTokensForETHSupportingFeeOnTransferTokens(uint amountIn, uint amountOutMin, address[] path, address to, uint deadline)
```

### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| amountIn | uint256 | Amount of EVO tokens to sell (in wei, 18 decimals) |
| amountOutMin | uint256 | Minimum BNB to receive (use 0 for no slippage protection) |
| path | address[] | `["0x7cb4c94Fc789b9313e7D81B108ece5dcd7b4045F", "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c"]` |
| to | address | Your wallet address |
| deadline | uint256 | Unix timestamp + 600 |

### ABI

```json
[
  {
    "name": "approve",
    "type": "function",
    "stateMutability": "nonpayable",
    "inputs": [
      { "name": "spender", "type": "address" },
      { "name": "amount", "type": "uint256" }
    ],
    "outputs": [{ "name": "", "type": "bool" }]
  },
  {
    "name": "swapExactTokensForETHSupportingFeeOnTransferTokens",
    "type": "function",
    "stateMutability": "nonpayable",
    "inputs": [
      { "name": "amountIn", "type": "uint256" },
      { "name": "amountOutMin", "type": "uint256" },
      { "name": "path", "type": "address[]" },
      { "name": "to", "type": "address" },
      { "name": "deadline", "type": "uint256" }
    ],
    "outputs": []
  }
]
```

### Example (ethers.js)

```javascript
const token = new ethers.Contract("0x7cb4c94Fc789b9313e7D81B108ece5dcd7b4045F", [
  "function approve(address spender, uint256 amount) returns (bool)",
  "function balanceOf(address account) view returns (uint256)"
], wallet);

const router = new ethers.Contract("0x10ED43C718714eb63d5aA57B78B54704E256024E", [
  "function swapExactTokensForETHSupportingFeeOnTransferTokens(uint amountIn, uint amountOutMin, address[] path, address to, uint deadline)"
], wallet);

const balance = await token.balanceOf(wallet.address);
await (await token.approve("0x10ED43C718714eb63d5aA57B78B54704E256024E", ethers.MaxUint256)).wait();
const tx = await router.swapExactTokensForETHSupportingFeeOnTransferTokens(
  balance,
  0,
  ["0x7cb4c94Fc789b9313e7D81B108ece5dcd7b4045F", "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c"],
  wallet.address,
  Math.floor(Date.now() / 1000) + 600,
  { gasLimit: 300000 }
);
await tx.wait();
```

---

## Check Balance & Price

### Check EVO Balance

```javascript
const token = new ethers.Contract("0x7cb4c94Fc789b9313e7D81B108ece5dcd7b4045F", [
  "function balanceOf(address) view returns (uint256)"
], provider);
const balance = await token.balanceOf("YOUR_WALLET");
console.log(ethers.formatEther(balance), "EVO");
```

### Check BNB Balance

```javascript
const bnb = await provider.getBalance("YOUR_WALLET");
console.log(ethers.formatEther(bnb), "BNB");
```

### Get Current Price

```javascript
const router = new ethers.Contract("0x10ED43C718714eb63d5aA57B78B54704E256024E", [
  "function getAmountsOut(uint amountIn, address[] path) view returns (uint[] amounts)"
], provider);
const amounts = await router.getAmountsOut(
  ethers.parseEther("0.01"),
  ["0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c", "0x7cb4c94Fc789b9313e7D81B108ece5dcd7b4045F"]
);
console.log("0.01 BNB =", ethers.formatEther(amounts[1]), "EVO");
```

### Get Real-Time Market Data

```
GET https://aievolution.fun/api/stats
```

Response includes: market cap, price, liquidity, 24h volume, generation info.

---

## Token ABI Reference

```json
[
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address account) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)"
]
```

---

## Common Errors

| Error | Cause | Fix |
|-------|-------|-----|
| `TRANSFER_FAILED` | Insufficient balance or allowance | Check balance, approve router first |
| `INSUFFICIENT_OUTPUT_AMOUNT` | Price moved beyond slippage | Set `amountOutMin = 0` or increase slippage |
| `Transaction reverted` | Using wrong swap function | Must use `...SupportingFeeOnTransferTokens` variants |
| `execution reverted` | Deadline expired or insufficient gas | Increase deadline, set gasLimit to 300000 |

---

## Quick Reference

### Buy Flow
```
1. TX: Router.swapExactETHForTokensSupportingFeeOnTransferTokens(0, [WBNB, EVO], you, deadline) {value: BNB}
```

### Sell Flow
```
1. TX: EVO.approve(Router, amount)
2. TX: Router.swapExactTokensForETHSupportingFeeOnTransferTokens(amount, 0, [EVO, WBNB], you, deadline)
```

---

## Links

- Website: https://aievolution.fun
- DexScreener: https://dexscreener.com/bsc/0x7cb4c94Fc789b9313e7D81B108ece5dcd7b4045F
- BscScan: https://bscscan.com/token/0x7cb4c94Fc789b9313e7D81B108ece5dcd7b4045F
- PancakeSwap: https://pancakeswap.finance/swap?outputCurrency=0x7cb4c94Fc789b9313e7D81B108ece5dcd7b4045F&chain=bsc
- Twitter: https://x.com/AIEvolutionFun
- Stats API: https://aievolution.fun/api/stats
- Skill API: https://aievolution.fun/api/skill/EVO
