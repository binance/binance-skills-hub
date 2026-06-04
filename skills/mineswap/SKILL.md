---
name: mineswap-dex-aggregator
description: |
  Swap any token on Base Network through MineSwap DEX aggregator. Routes trades across
  Uniswap V2/V3/V4, Aerodrome, SushiSwap, PancakeSwap, Alienbase, SwapBased, and DackieSwap
  for best price execution. Sub-cent gas fees, sub-second confirmation. All contracts verified
  on BaseScan with OpenZeppelin audited standard library. Use this skill when agents need to
  swap tokens, provide liquidity, or interact with DeFi protocols on Base Network.
metadata:
  author: skylerthegoldgod
  version: "1.0.0"
license: MIT
---

# MineSwap DEX Aggregator

Multi-DEX aggregator for Base Network (L2 Ethereum). Routes trades across 8 decentralized exchanges for optimal price execution with sub-cent gas fees.

## Overview

| Feature | Details |
|---------|---------|
| Network | Base (L2 Ethereum, Chain ID 8453) |
| Gas Cost | < $0.01 per transaction |
| Confirmation | ~1 second |
| DEX Sources | Uniswap V2/V3/V4, Aerodrome, SushiSwap, PancakeSwap, Alienbase, SwapBased, DackieSwap |
| Protocol Fee | 0.15% per swap |
| Security | All contracts verified on BaseScan, OpenZeppelin audited |

## Use Cases

1. **Token Swaps**: Swap any ERC-20 token pair on Base with best-price routing across 8 DEXs
2. **Liquidity Provision**: Create and manage V2/V4 liquidity pools
3. **Price Queries**: Get real-time quotes with route breakdown and price impact
4. **Portfolio Rebalancing**: Execute multi-token swaps with optimal routing

## Verified Smart Contracts

All contracts are verified on BaseScan with public source code. No admin keys, no backdoors, trustless execution.

| Contract | Address | Purpose |
|----------|---------|---------|
| MineSwapRouter | `0xE7E6300e1f6e44C0fa615A4Df9F24148dbE26804` | Trade routing and execution |
| MineSwapFactory | `0xB0C2D8A877A5B48607d9C89B6Ad761F36Bc79C88` | Pool deployment (V2 + V4) |
| MineSwapAggregator | `0xF08E62907c9fD9411296479693facE5E7229805A` | Multi-DEX price aggregation |
| MineSwapBurner | `0x47eeF9fD8437C6Ce74be124B7587a504b4b852C6` | Protocol fee processor |
| MineSwapTracker | `0x8e378C06B08D302a6ec0dd087d3c26A5B91D0a0a` | Trade analytics |
| BaseGold (BG) | `0x36b712A629095234F2196BbB000D1b96C12Ce78e` | Protocol token (ERC-20, 10,000 supply) |

Verify any contract: `https://basescan.org/address/<CONTRACT_ADDRESS>`

## Security

- **Contracts**: Built on OpenZeppelin audited standard library
- **Verification**: All contracts verified on BaseScan with public source code
- **Trustless**: No admin override on user funds — fully deterministic execution
- **Keys**: This skill never holds private keys — signing is handled by the agent's wallet
- **Monitoring**: Hexagate real-time security monitoring on all MineSwap contracts
- **Transparent**: Every transaction, fee, and route recorded on-chain

## API Reference

### Swap Tokens

Execute a token swap with optimal routing across all supported DEXs.

**Endpoint**: MineSwapRouter contract
**Function**: `swapExactTokensForTokens` / `swapExactETHForTokens` / `swapTokensForExactETH`

```javascript
// Example: Swap ETH for USDC with best routing
const tx = await mineswapRouter.swapExactETHForTokens(
  minAmountOut,        // minimum USDC to receive (slippage protection)
  [WETH_ADDRESS, USDC_ADDRESS],  // token path
  recipientAddress,    // where to send output tokens
  deadline,            // transaction deadline (unix timestamp)
  { value: ethAmount } // ETH to swap
);
```

### Get Quote

Query the aggregator for best price across all DEXs before executing.

```javascript
// Get best route and estimated output
const quote = await mineswapAggregator.getAmountsOut(
  amountIn,            // input amount
  [tokenIn, tokenOut]  // token path
);
// Returns: estimated output amount, route used, price impact
```

### Check Token Balance

```javascript
// Standard ERC-20 balance check
const balance = await tokenContract.balanceOf(walletAddress);
```

### Create Liquidity Pool

Deploy a new trading pair on MineSwap.

```javascript
// Create a new V2 pool
const pair = await mineswapFactory.createPair(tokenA, tokenB);
```

## Supported Token Pairs

MineSwap supports any ERC-20 token pair on Base Network. Active pools include:

| Pair | Liquidity | DEX Type |
|------|-----------|----------|
| BG/WETH | ~$2,000 | V2 + V4 Hook |
| BG/USDC | ~$489 | V2 |
| WETH/USDC | Available | V2 |
| VIRTUAL/WETH | Available | V4 Hook |
| cbBTC/WETH | Available | V2 |

Community pools: 27+ additional pairs available.

## Network Configuration

```json
{
  "network": "Base",
  "chainId": 8453,
  "rpcUrl": "https://mainnet.base.org",
  "blockExplorer": "https://basescan.org"
}
```

## Fee Structure

- **Protocol Fee**: 0.15% per swap — split between liquidity providers and protocol operations
- **Gas**: < $0.01 per transaction on Base L2
- **No hidden fees**: All fees are deterministic and verifiable on-chain

## Uniswap V4 Hook Pools

MineSwap supports Uniswap V4 pools with custom hooks. V4 hook pools enable advanced on-chain logic executed atomically with every swap — including automated protocol fee processing.

Create a V4 hook pool for any token pair:

```javascript
// V4 pools with MineSwap hook support automated fee processing
const pool = await createV4Pool(tokenA, tokenB, hookAddress);
```

## Links

- **MineSwap DEX**: [mineswap.org](https://mineswap.org)
- **MineSwap App**: [mineswap.app](https://mineswap.app)
- **BaseGold Protocol**: [basegold.io](https://basegold.io)
- **DexScreener Chart**: [dexscreener.com/base/0x36b712a629095234f2196bbb000d1b96c12ce78e](https://dexscreener.com/base/0x36b712a629095234f2196bbb000d1b96c12ce78e)
- **Contract Verification**: [BaseScan](https://basescan.org/address/0xE7E6300e1f6e44C0fa615A4Df9F24148dbE26804)
