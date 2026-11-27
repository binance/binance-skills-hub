---
name: agenttrail
description: |
  AgentTrail is a daily on-chain stamp book on BNB Chain (BSC, chainId 56) that only
  Binance Agent ID holders can use. The calling wallet stamps once per UTC day for free
  (network gas only) and mints a soulbound ERC-721 stamp with on-chain SVG art; cumulative
  stamp totals of 3 / 7 / 14 unlock milestone badges.
  Use when the user wants to: stamp / check in on AgentTrail today, do their daily AgentTrail
  stamp, check whether they already stamped today, view their AgentTrail stamp count or
  current streak, claim an AgentTrail milestone badge (3, 7, or 14 stamps), check total
  AgentTrail participation (totalAgents / totalStampsAll), or read another address's
  AgentTrail activity as proof of activity (totalStampsOf / currentStreak /
  milestoneClaimedMask / hasAgentId).
  Do not use for trading, swaps, transfers, or any paid action — AgentTrail is a
  non-financial collectible: there is no token, nothing is sold, and no value or
  return is promised.
version: 1.0.0
license: MIT
metadata:
  author: Scholarg19
  version: 1.0.0
---

# AgentTrail Skill

AgentTrail · 智能体足迹 is a daily stamp book exclusively for AI agents whose wallet
holds a Binance Agent ID. One free stamp per address per UTC day, recorded on-chain
as a soulbound ERC-721 token. Cumulative stamps unlock milestone badges at 3, 7,
and 14 stamps.

- Website: https://agenttrail.opav.work
- Full machine-readable docs: https://agenttrail.opav.work/llms.txt
- Contract source (open source, Sourcify-verified): https://github.com/Scholarg19/agenttrail
- Live at launch week: 186 Agent ID addresses and 287 stamps as of 2026-11-27.
  Always read `totalAgents()` / `totalStampsAll()` for current numbers.

## Contracts (BNB Chain, chainId 56)

| Contract | Address |
|---|---|
| AgentTrail | `0x6fd54150178C653E267f48f4059d0d95014BA28D` |
| Agent ID registry (SPACE ID, official) | `0x60B9262456dE011F7d15a54CdD8c48bAaa8B022F` |

The AgentTrail contract is non-payable and holds no funds. Its owner can only
pause/unpause stamping (`setStampOpen`); there is no mint-on-behalf, withdrawal,
or metadata-change function.

## Eligibility

The calling address must hold an Agent ID:

- Read check on AgentTrail: `hasAgentId(address) -> bool`
- Underlying rule: `registry.balanceOf(address) > 0` on the Agent ID registry.
  The Agent ID is a non-transferable ERC-721 issued by SPACE ID.
- Agent IDs can only be claimed inside the Binance App. If the wallet has no
  Agent ID, explain this and stop — do not try any workaround.

## Safety Rules (mandatory)

- **Never ask for, receive, or handle seed phrases or private keys.** All signing
  happens inside the user's own wallet tooling.
- **Every write is two-step**: build/preview the call with the user's wallet
  tooling first, show the user the target contract, function, value (must be 0),
  and the gas-only cost, and execute only after the user explicitly confirms.
- **Value must always be 0.** The contract is non-payable; if a preview shows any
  BNB value, abort.
- **Verify after execution**: check the transaction receipt status and re-read the
  relevant counter (`totalStampsOf`, `milestoneClaimedMask`) before reporting
  success. Never report success from a submitted hash alone.
- **No financial framing**: stamps and badges are collectibles. There is no
  AgentTrail token and no reward, yield, or value of any kind is promised. Never
  describe stamps as an investment or a way to earn.

## Read-Only Calls

All reads are plain `eth_call`s to the AgentTrail contract on any BSC RPC — no
permission, API key, or wallet needed. ABI-encode arguments with standard tooling;
do not hand-assemble calldata byte by byte.

| Function | Returns | Use |
|---|---|---|
| `hasAgentId(address)` | bool | Eligibility check |
| `canStampToday(address)` | bool | Whether this address can still stamp in the current UTC day |
| `totalStampsOf(address)` | uint256 | Cumulative stamps (drives badges) |
| `currentStreak(address)` | uint256 | Consecutive-UTC-day streak; resets to 1 after a missed day |
| `milestoneClaimable(address, tier)` | bool | tier 0 = 3 stamps, 1 = 7, 2 = 14 |
| `milestoneClaimedMask(address)` | uint256 | bit0/1/2 = tier 0/1/2 badge already claimed |
| `totalAgents()` | uint256 | Distinct addresses that have ever stamped |
| `totalStampsAll()` | uint256 | All stamps ever minted |

## Workflow: Daily Stamp

1. Get the user's wallet address from their own wallet tooling.
2. Read `hasAgentId(address)`. If false, tell the user an Agent ID (claimed in the
   Binance App) is required, and stop.
3. Read `canStampToday(address)`. If false, the wallet already stamped today
   (UTC) — report its `totalStampsOf` and `currentStreak` and stop.
4. Preview `stamp()` (selector `0xc85e07b9`, value 0) with the user's wallet
   tooling. Show the preview and wait for explicit user confirmation.
5. Execute, then verify: receipt status is success and `totalStampsOf` increased
   by exactly 1. Report the new total and streak, with the transaction hash.
6. Continue to the badge check below — a stamp often crosses a milestone.

## Workflow: Claim a Milestone Badge

Badges are based on the **cumulative** total, not the streak:
tier 0 at 3 stamps, tier 1 at 7, tier 2 at 14 — one claim per tier.

1. For each tier 0, 1, 2: read `milestoneClaimable(address, tier)` and check the
   matching bit of `milestoneClaimedMask(address)`. A tier is claimable when the
   threshold is reached and the bit is not yet set.
2. For each claimable tier, preview `claimMilestone(tier)` (selector `0x644c92a4`,
   value 0), get explicit user confirmation, then execute.
3. Verify the receipt and that the tier's bit is now set in
   `milestoneClaimedMask`. Report the badge tier and transaction hash.

## Rules Worth Knowing

- One stamp per address per UTC day, enforced by the contract.
- A missed day only resets `currentStreak`; it never reduces the cumulative total
  and never blocks a badge — it only delays it.
- There are **no make-up or backfill stamps**, by design and by contract
  immutability. A 14-stamp badge always means the agent showed up on at least 14
  distinct UTC days.
- Stamps and badges are soulbound: transfers and approvals always revert.

## For Builders: Proof of Activity

Any contract or app can read AgentTrail state on-chain, free and permissionless,
as proof that an agent address has been genuinely active over time (at most one
stamp per day, so it cannot be farmed quickly):

```solidity
require(agentTrail.totalStampsOf(agent) >= 7, "not active enough");
```

Useful reads: `totalStampsOf`, `currentStreak`, `milestoneClaimedMask`,
`hasAgentId`. See https://agenttrail.opav.work/llms.txt for the full integration
notes, or [`references/contract-interface.md`](references/contract-interface.md)
for the complete interface table.
