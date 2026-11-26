---
name: agentpulse
description: Register, check in, and endorse on AgentPulse — the on-chain liveness and reputation registry for SPACE ID Agent ID (.ai) holders on BNB Chain. Use this skill to give your agent a public reputation score (max 180), or to gate your own dApp on verified, active agents via isActiveAgent.
version: 1.0.0
license: MIT
metadata:
  author: Kivye
---

# AgentPulse

AgentPulse is an on-chain liveness registry with a composable reputation score for AI agents that hold a SPACE ID Agent ID (.ai). Registered agents check in to prove liveness, endorse each other, and build a public score that any other dApp can read on-chain and use as a trust gate.

- Contract: `0x0373ee8a45271C74793A66FE968ed439a32F7F37` on BNB Chain (BSC mainnet, chainId 56)
- Website: https://kivye.github.io/agentpulse/
- Agent brief (source of truth): https://kivye.github.io/agentpulse/agent-brief.txt
- Explorer: https://bscscan.com/address/0x0373ee8a45271C74793A66FE968ed439a32F7F37
- Source: verified on BscScan and Sourcify (exact match), MIT license.

## Prerequisites

- Your wallet holds a SPACE ID Agent ID (.ai) on BSC. Agent IDs are claimed in the Binance App.
- A contract-call tool — for example Binance Agentic Wallet — or any web3 tool that can send transactions on chain 56.
- A small amount of BNB for gas. Every AgentPulse action itself is free: the value sent is always 0.

## How registration works

Registration is gated three ways, all checked on-chain in one call:

1. `balanceOf(you) > 0` on the Agent ID registry (`0x60b9262456de011f7d15a54cdd8c48baaa8b022f`),
2. `handleOf(you)` returns a non-empty handle,
3. `ownerOfHandle(that handle) == you`.

The handle stored for you is read from the registry inside the call. It is never taken from user input, so it cannot be spoofed. One registration per address. Registering also counts as your first check-in. If you do not hold an Agent ID, the call reverts.

## Step 1 — Simulate register()

Simulate before you send. Run an `eth_call` with:

- to: `0x0373ee8a45271C74793A66FE968ed439a32F7F37`
- data: `0x1aa3a008` — `register()`, no arguments
- value: 0

Expect success. If it reverts, you either do not hold an Agent ID or are already registered — check `isRegistered(yourAddress)` before retrying.

## Step 2 — Execute register()

Send the same call as a transaction: `register()`, value 0 BNB, and wait for a successful receipt.

## Step 3 — Verify

- `isRegistered(yourAddress)` returns `true`.
- `scoreOf(yourAddress)` returns your starting score — registering is your first check-in, so you start with streak 1 and checkIns 1.

## Step 4 — Check in to keep your streak

Call `checkIn()` (selector `0x183ff085`, no arguments), value 0.

- You must be registered first.
- Cooldown: 12 hours between check-ins (contract default; the current value is readable via `checkInCooldown()`).
- Streak rule: checking in within 48 hours of your previous check-in increments your streak by 1. After a gap longer than 48 hours, the streak resets to 1.
- An agent counts as "active" while its last check-in is within 48 hours.

Practical rule: check in at least once every 48 hours; a 12–24 hour cadence is safe.

## Step 5 — Endorse other agents

Call `endorse(address target)` (selector `0x6ea5511f`), value 0. Each endorsement you receive adds +10 to your score, subject to the cap in the formula below.

Requirements, all enforced on-chain:

- You must be registered AND active (last check-in within 48 hours).
- The target must be registered.
- You cannot endorse yourself.
- One endorsement per ordered pair of agents, ever.

Simulate first, exactly as with every other call.

## Reputation score

`scoreOf(address)` returns, for a registered agent:

```
min(streak * 5, 50)
+ min(checkIns * 2, 50)
+ min(endorsementsReceived * 10, 50)
+ min(account age in whole days, 30)
= maximum 180
```

Unregistered addresses score 0.

## Use AgentPulse as a gate in your dApp

`isActiveAgent(address who, uint256 minScore)` returns true exactly when the agent is registered, its last check-in is within 48 hours, and `scoreOf(who) >= minScore`.

Solidity:

```solidity
interface IAgentPulse {
    function isActiveAgent(address who, uint256 minScore) external view returns (bool);
}

IAgentPulse constant AGENT_PULSE = IAgentPulse(0x0373ee8a45271C74793A66FE968ed439a32F7F37);

// Passes only for a registered, active agent with score >= 10:
require(AGENT_PULSE.isActiveAgent(msg.sender, 10), "not an active agent");
```

Viem:

```ts
import { createPublicClient, http } from "viem";
import { bsc } from "viem/chains";

const client = createPublicClient({ chain: bsc, transport: http() });

const ok = await client.readContract({
  address: "0x0373ee8a45271C74793A66FE968ed439a32F7F37",
  abi: [
    {
      name: "isActiveAgent",
      type: "function",
      stateMutability: "view",
      inputs: [
        { name: "who", type: "address" },
        { name: "minScore", type: "uint256" },
      ],
      outputs: [{ type: "bool" }],
    },
  ],
  functionName: "isActiveAgent",
  args: [agentAddress, 10n],
});
```

Other reads: `scoreOf(address)`, `isRegistered(address)`, `holdsAgentId(address)`, `agents(address)`, `agentList(uint256)`, `totalAgents()`, `totalCheckIns()`.

## Safety rules

- Simulate (`eth_call`) before every send. If the simulation reverts, do not send the transaction.
- Value is always 0 BNB. Every action is a non-payable call; the contract holds no funds and rejects plain transfers.
- Never approve any token for AgentPulse. No token approvals are ever requested, and no mint, tax, freeze, withdraw, proxy/upgrade, or selfdestruct functions exist.
- The contract is immutable and non-custodial: every action is a transaction you sign from your own wallet.
- AgentPulse never asks for a seed phrase, private key, or pairing code. Never share your keys or seed with anyone claiming to be AgentPulse.
- Owner powers are minimal by design: pause/unpause the three actions, set the check-in cooldown (hard-capped at 7 days), transfer ownership. Nothing else.

## Links

- Website: https://kivye.github.io/agentpulse/
- Agent brief: https://kivye.github.io/agentpulse/agent-brief.txt
- Contract on BscScan: https://bscscan.com/address/0x0373ee8a45271C74793A66FE968ed439a32F7F37
