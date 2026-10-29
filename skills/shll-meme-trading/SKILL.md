---
name: shll-meme-trading
description: |
  Execute meme token trades on Four.meme launchpad via SHLL agent vaults on BNB Chain.
  Smart routing automatically detects bonding curve vs DEX phase and routes to the correct
  execution path. All trades are validated by SHLL PolicyGuard before on-chain execution.
  Use this skill when users want to buy or sell meme tokens on Four.meme, or trade tokens
  that may be on bonding curve or already migrated to DEX.
metadata:
  version: "1.0.0"
  author: kledx
license: MIT
---

# SHLL Meme Trading

Execute meme token trades on Four.meme launchpad through SHLL agent vaults on BNB Chain (BSC). Features smart routing that automatically detects whether a token is on bonding curve or DEX, and routes to the correct execution path.

## What This Skill Does

This skill enables AI agents to trade meme tokens launched via Four.meme with:

1. **Smart routing**: Automatically detects trading phase (bonding curve vs DEX) and uses the correct execution method
2. **Token info lookup**: Query Four.meme token status, bonding curve progress, and migration state
3. **Buy/Sell execution**: Trade meme tokens with on-chain PolicyGuard validation
4. **Safety enforcement**: All trades pass through SHLL's 4-policy stack before execution

## Smart Routing Logic

When given a token address:

```
1. Query four-info → get tradingPhase
2. If tradingPhase = "bonding_curve" → use four-buy / four-sell
3. If tradingPhase = "dex" or migrated → use swap (PancakeSwap)
```

The AI agent does not need to know the routing logic. The skill handles it automatically.

## Prerequisites

```bash
npm install -g shll-skills --registry https://registry.npmjs.org
export RUNNER_PRIVATE_KEY="0x..."
```

Or via MCP Server:

```json
{
  "mcpServers": {
    "shll": {
      "command": "npx",
      "args": ["-y", "shll-skills@latest", "mcp"],
      "env": {
        "RUNNER_PRIVATE_KEY": "0x..."
      }
    }
  }
}
```

## Commands

### Query Token Info

```bash
shll-run four-info --token <contractAddress>
```

Returns:
- Token name, symbol, creator
- Current trading phase (bonding curve / DEX)
- Bonding curve progress percentage
- Migration status and timestamp
- Current price and liquidity

### Buy Meme Token

```bash
shll-run four-buy --token <contractAddress> -a 0.01 -k <tokenId>
```

**Important**: The amount unit is **BNB**, not USD or token quantity. If the user specifies a USD amount, convert to BNB first and confirm the final BNB amount before execution.

PolicyGuard validates:
- BNB amount against SpendingLimitV2
- Four.meme contract against DeFiGuardV2
- Trade interval against CooldownPolicy

### Sell Meme Token

```bash
shll-run four-sell --token <contractAddress> -a 1000 -k <tokenId>
```

The amount is in **token units** (not BNB). Sells the specified quantity of meme tokens.

## Integration with Meme Rush Skill

This skill complements the `meme-rush` skill (data/discovery) by adding execution capabilities:

| Skill | Function |
|---|---|
| **meme-rush** | Discover new meme tokens, monitor bonding curve progress, track migrations |
| **shll-meme-trading** | Execute buy/sell trades on discovered tokens with safety enforcement |

**Workflow**: Use `meme-rush` to find promising tokens → use `shll-meme-trading` to execute trades.

## Output Format

### Buy Success

```json
{
  "status": "success",
  "action": "four-buy",
  "token": "0xabc...def",
  "amountIn": "0.01 BNB",
  "tokensReceived": "15234.5",
  "txHash": "0x123...789"
}
```

### Sell Success

```json
{
  "status": "success",
  "action": "four-sell",
  "token": "0xabc...def",
  "amountSold": "15234.5",
  "bnbReceived": "0.012",
  "txHash": "0x456...012"
}
```

### Policy Rejection

```json
{
  "status": "rejected",
  "reason": "SpendingLimitV2: amount 0.5 BNB exceeds per-transaction limit of 0.1 BNB"
}
```

## Safety Notes

1. Meme tokens are **high risk**. PolicyGuard spending limits help prevent excessive exposure
2. Bonding curve tokens have limited liquidity — slippage may be higher than DEX trades
3. Always check `four-info` before trading to understand the token's current phase
4. The CooldownPolicy prevents rapid-fire trading that could result in front-running losses

## On-Chain Contracts (BSC Mainnet)

| Contract | Address |
|---|---|
| AgentNFA (V4.1) | `0x71cE46099E4b2a2434111C009A7E9CFd69747c8E` |
| PolicyGuardV4 | `0x25d17eA0e3Bcb8CA08a2BFE917E817AFc05dbBB3` |

Four.meme contracts are pre-approved in DeFiGuardV2 policy.

## Links

- Website: https://shll.run
- Repository: https://github.com/kledx/shll-skills
- npm: https://www.npmjs.com/package/shll-skills
- Four.meme: https://four.meme
