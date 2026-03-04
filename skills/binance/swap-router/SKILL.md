---
name: swap-router
description: Binance Web3 Wallet multi-chain DEX swap aggregation supporting BNB Chain, Ethereum, Solana, Arbitrum, Base, and Polygon with best-price routing.
metadata:
  version: 1.0.0
  author: Community
license: MIT
---

# Swap Router

Multi-chain DEX swap aggregation through the Binance Web3 Wallet. Routes swaps across major DEX aggregators on BNB Chain, Ethereum, Solana, Arbitrum, Base, and Polygon to find the best execution price with MEV protection.

## Quick Reference

| Endpoint | Description | Authentication |
|----------|-------------|----------------|
| `POST /bapi/defi/v1/dex/router/swap` | Execute swap | Web3 Wallet |
| `GET /bapi/defi/v1/dex/router/quote` | Get swap quote | Web3 Wallet |
| `GET /bapi/defi/v1/dex/router/tokens` | Supported tokens | Web3 Wallet |

## Supported Chains & DEXes

| Chain | Chain ID | Primary DEX | Aggregators |
|-------|----------|-------------|-------------|
| BNB Chain | 56 | PancakeSwap | 1inch, ParaSwap |
| Ethereum | 1 | Uniswap | 1inch, 0x, CowSwap |
| Solana | — | Jupiter | Raydium, Orca |
| Arbitrum | 42161 | Camelot | SushiSwap, 1inch |
| Base | 8453 | Aerodrome | Uniswap V3 |
| Polygon | 137 | QuickSwap | 1inch, ParaSwap |

## Swap Flow

### 1. Get Quote

Retrieve a swap quote with price impact and gas estimation.

**Conceptual Request:**
```json
{
  "chainId": "56",
  "fromToken": "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c",
  "toToken": "0x55d398326f99059fF775485246999027B3197955",
  "amount": "1000000000000000000",
  "slippage": 0.5
}
```

**Quote Response Fields:**

| Field | Type | Description |
|-------|------|-------------|
| fromToken | object | Source token details |
| toToken | object | Destination token details |
| fromAmount | string | Input amount (wei) |
| toAmount | string | Expected output (wei) |
| priceImpact | string | Price impact percentage |
| route | array | Swap path through DEXes |
| estimatedGas | string | Gas cost estimate |

### 2. Token Approval

For ERC-20 tokens, approve the router contract before swapping.

```
Token.approve(routerAddress, amount)
```

### 3. Execute Swap

Submit the swap transaction with the signed route data.

### Capabilities

| Feature | Description |
|---------|-------------|
| Best Price Routing | Splits orders across multiple DEXes for optimal price |
| Cross-Chain Bridge | Bridge tokens between supported chains |
| Gas Optimization | Estimates and optimizes gas costs |
| Slippage Protection | Configurable slippage tolerance (0.1% - 50%) |
| MEV Guard | Protection against front-running and sandwich attacks |
| Token Approval Mgmt | Handles ERC-20 approval flow |
| Price Impact Warning | Alerts on high price impact trades |

### Price Impact Levels

| Impact | Level | Color |
|--------|-------|-------|
| < 1% | Low | Green |
| 1-3% | Medium | Yellow |
| > 3% | High | Red |
| > 10% | Very High | Red + Warning |

## Use Cases

1. **Best Price Execution** — Route swaps through multiple DEXes for optimal price
2. **Cross-Chain Swaps** — Bridge and swap tokens across supported chains
3. **Large Order Splitting** — Split large orders to minimize price impact
4. **Gas Optimization** — Find the most gas-efficient swap path
5. **MEV Protection** — Protect against front-running attacks during swaps

## Notes

- Swap functionality requires **Binance Web3 Wallet** connection (app or browser extension)
- The Web3 Wallet swap API is not publicly accessible via REST — requires wallet authentication
- Use `data-api.binance.vision` for spot price comparison alongside DEX quotes
- Slippage should be adjusted based on token liquidity and trade size
- Cross-chain swaps involve bridge fees in addition to swap fees
- Always verify token contract addresses before swapping to avoid fake tokens
- Gas estimates are approximate — actual gas may vary by network congestion
- For programmatic access, consider using on-chain DEX router contracts directly
- Binance Web3 Wallet supports hardware wallet integration for added security
