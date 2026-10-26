---
name: binance-agent-id-gating
description: |
  Verify Binance Agent ID ownership on BNB Smart Chain (BSC) and build agent-gated
  on-chain distributions. Covers: what Binance Agent ID is, the canonical Agent ID
  registry contract, how to check whether an address holds an Agent ID
  (raw eth_call, ethers, viem), how to gate token claims / airdrops / allowlists
  so that only AI agents can participate, and a live production reference deployment.

  Use this skill when users ask about:
  - Checking if an address owns a Binance Agent ID
  - Building "agents-only" mint / claim / airdrop mechanics on BSC
  - Reading the Agent ID registry contract from a contract or script
  - Distinguishing AI-agent wallets from regular wallets on BNB Chain
metadata:
  author: m284743
  version: "1.0"
---

# Binance Agent ID Gating

## Overview

Binance Agent ID is an on-chain identity for AI agents on BNB Smart Chain (chainId 56).
Each Agent ID is a non-fungible token minted to the wallet that operates the agent,
issued through Binance's Web3 agent infrastructure. Because ownership is recorded
on-chain, any smart contract or script can verify — without an API key, an off-chain
database, or a allowlist — whether a given address currently controls a registered
AI agent.

This enables an "agent-gated" design pattern: contract functions that can only be
executed by wallets holding an Agent ID. Typical uses:

- Agents-only token claims / mints / airdrops
- Agent-only order placement in on-chain markets
- Sybil-resistant community distributions targeting AI agents

## Canonical Registry

| Item      | Value                                          |
|-----------|------------------------------------------------|
| Chain     | BNB Smart Chain (chainId 56)                   |
| Contract  | `0x60B9262456dE011F7d15a54CdD8c48bAaa8B022F`   |
| Interface | ERC-721-compatible `balanceOf(address)`        |

Always source the registry address from Binance's official documentation before
relying on it; do not hard-code unverified addresses in production code.

## Checking Agent ID Ownership

An address is an agent wallet if and only if `balanceOf(address) > 0` on the
registry. Three equivalent ways to check:

### 1. Raw `eth_call` (no dependencies)

`balanceOf(address)` selector: `0x70a08231`

```text
to:   0x60B9262456dE011F7d15a54CdD8c48bAaa8B022F
data: 0x70a08231 + <address as 32-byte hex, left-padded with zeros>
```

A non-zero return value means the address holds at least one Agent ID.

### 2. ethers v6

```js
import { JsonRpcProvider, Contract } from "ethers";

const provider = new JsonRpcProvider("https://bsc-dataseed.binance.org");
const registry = new Contract(
  "0x60B9262456dE011F7d15a54CdD8c48bAaa8B022F",
  ["function balanceOf(address) view returns (uint256)"],
  provider
);

const isAgent = (await registry.balanceOf(walletAddress)) > 0n;
```

### 3. viem

```ts
import { createPublicClient, http, parseAbi } from "viem";
import { bsc } from "viem/chains";

const client = createPublicClient({ chain: bsc, transport: http() });
const balance = await client.readContract({
  address: "0x60B9262456dE011F7d15a54CdD8c48bAaa8B022F",
  abi: parseAbi(["function balanceOf(address) view returns (uint256)"]),
  functionName: "balanceOf",
  args: [walletAddress],
});
const isAgent = balance > 0n;
```

A dependency-free Node.js checker is included in `scripts/check_agent_id.mjs`.

## Building an Agent-Gated Claim

The canonical pattern, enforced on-chain so no off-chain component can be bypassed:

```solidity
interface IAgentID {
    function balanceOf(address owner) external view returns (uint256);
}

IAgentID constant AGENT_ID =
    IAgentID(0x60B9262456dE011F7d15a54CdD8c48bAaa8B022F);

mapping(address => bool) public hasClaimed;

function claim() external {
    require(AGENT_ID.balanceOf(msg.sender) > 0, "Agent ID required");
    require(!hasClaimed[msg.sender], "already claimed");
    hasClaimed[msg.sender] = true;
    // ... distribution logic
}
```

Design notes:

- **Check at execution time, not via a snapshot list.** Ownership can change; an
  on-chain `balanceOf` check at call time is always current and cannot be forged.
- **One action per wallet** (`hasClaimed` mapping) is the usual complement, since
  one wallet can hold one identity.
- **Deterministic on-chain randomness** (e.g. `keccak256(abi.encode(a, b, txHash))`)
  can derive verifiable, reproducible per-claim outcomes without a black box.
- **Renounce ownership** (`transferOwnership(address(0))`) after deployment if the
  distribution parameters should be immutable; anyone can then verify on a block
  explorer that no admin can mint, pause, or drain the pool.

## Live Reference Deployment (Case Study)

A production deployment of this pattern that can be inspected on BscScan:

| Component            | Address                                      |
|----------------------|----------------------------------------------|
| Agent-gated BEP-20   | `0x67B8c7abeB7A6b6ef29f15032423AfAB4006888f` |
| Agent order-book DEX | `0xCF19D05878Ab8bC53280299442De280afaaA16C8` |

The token contract gates its entire free distribution through `claim()` with an
on-chain Agent ID `balanceOf` check, prices its fixed claim fee in USD via the
Chainlink BNB/USD oracle, and has ownership renounced to the zero address (no
mint, pause, or withdraw functions exist). The companion market contract is an
escrow-less order book where agents list and fill orders directly.

*This deployment is cited strictly as an educational reference for the gating
pattern. Nothing here is a recommendation, endorsement, or guarantee of any asset.*

## Security Considerations

- Verify the registry address against official Binance sources before use.
- Never gate on off-chain signatures or API responses alone; they can be forged
  or censored. The on-chain `balanceOf` check is the trust anchor.
- `balanceOf > 0` proves the wallet holds an Agent ID at execution time; it does
  not prove anything about the operator behind the agent.
- When auditing a renounced contract, confirm `owner() == address(0)` **and**
  scan the bytecode/source for alternate admin paths (proxies, `onlyOwner`
  backdoors) before treating it as immutable.
