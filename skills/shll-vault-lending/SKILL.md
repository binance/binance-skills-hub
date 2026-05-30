---
name: shll-vault-lending
description: |
  DeFi lending operations on Venus Protocol via SHLL agent vaults on BNB Chain.
  Supply tokens to earn yield and redeem positions through policy-enforced execution.
  All lending actions are validated by SHLL PolicyGuard before on-chain execution,
  ensuring only whitelisted protocols and approved amounts are processed.
  Use this skill when users want to lend, supply, deposit, or earn yield on BSC tokens.
metadata:
  version: "1.0.0"
  author: kledx
license: MIT
---

# SHLL Vault Lending

DeFi lending operations on Venus Protocol through SHLL agent vaults on BNB Chain (BSC). Supply tokens to earn yield, redeem positions, and check lending status — all with on-chain policy enforcement.

## What This Skill Does

This skill enables AI agents to interact with Venus Protocol (the largest lending protocol on BSC) through SHLL's policy-enforced execution layer. Agents can:

1. **Supply tokens** to Venus markets to earn interest
2. **Redeem tokens** from Venus markets
3. **Check lending positions** including supplied amounts and earned interest

All operations pass through SHLL PolicyGuard validation before execution.

## Supported Tokens

| Token | Venus Market | Action |
|---|---|---|
| BNB | vBNB | Supply/Redeem |
| USDT | vUSDT | Supply/Redeem |
| USDC | vUSDC | Supply/Redeem |
| BTCB | vBTCB | Supply/Redeem |
| ETH | vETH | Supply/Redeem |

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

### Supply Tokens (Lend)

```bash
shll-run lend -t USDT -a 10 -k <tokenId>
```

Supplies 10 USDT to Venus Protocol. The vault receives vUSDT tokens representing the lending position. PolicyGuard validates:
- Amount against SpendingLimitV2
- Venus contract address against DeFiGuardV2
- Cooldown window against CooldownPolicy

### Redeem Tokens

```bash
shll-run redeem -t USDT -a 10 -k <tokenId>
```

Redeems 10 USDT worth of the lending position from Venus. The vault receives USDT back.

### View Lending Positions

```bash
shll-run lending-info -k <tokenId>
```

Returns current lending positions including:
- Supplied amount per token
- Current APY
- Earned interest
- vToken balance

## Security

All lending operations are executed through the SHLL vault with PolicyGuard enforcement:

- **DeFiGuardV2** validates that Venus Protocol contracts are on the approved whitelist
- **SpendingLimitV2** enforces maximum supply amounts per transaction and per day
- **CooldownPolicy** prevents rapid position changes
- Vault isolation ensures lending positions belong to the agent NFT, not the operator wallet

## Integration with Other Skills

| Workflow | Description |
|---|---|
| Swap → Lend | Swap BNB to USDT, then supply USDT to Venus for yield |
| Redeem → Swap | Redeem USDT from Venus, swap back to BNB |
| Portfolio → Lend | Check vault balances, then supply idle tokens |

Use with `shll-safe-execution` for the complete DeFi workflow.

## Output Format

### Supply Success

```json
{
  "status": "success",
  "action": "lend",
  "token": "USDT",
  "amount": "10.0",
  "txHash": "0xabc...def",
  "vTokenReceived": "452.31 vUSDT"
}
```

### Policy Rejection

```json
{
  "status": "rejected",
  "reason": "DeFiGuardV2: target contract not in approved protocol whitelist"
}
```

## On-Chain Contracts (BSC Mainnet)

| Contract | Address |
|---|---|
| AgentNFA (V4.1) | `0x71cE46099E4b2a2434111C009A7E9CFd69747c8E` |
| PolicyGuardV4 | `0x25d17eA0e3Bcb8CA08a2BFE917E817AFc05dbBB3` |

Venus Protocol contracts are pre-approved in DeFiGuardV2 policy.

## Links

- Website: https://shll.run
- Repository: https://github.com/kledx/shll-skills
- npm: https://www.npmjs.com/package/shll-skills
- Venus Protocol: https://venus.io
