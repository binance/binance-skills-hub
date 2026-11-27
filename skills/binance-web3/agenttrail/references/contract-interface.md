# AgentTrail Contract Interface Reference

Network: BNB Chain (BSC), chainId 56.

## Addresses

| Contract | Address |
|---|---|
| AgentTrail | `0x6fd54150178C653E267f48f4059d0d95014BA28D` |
| Agent ID registry (SPACE ID Agent ID, ERC-721, non-transferable) | `0x60B9262456dE011F7d15a54CdD8c48bAaa8B022F` |

- Verification: Sourcify exact match; source also published at
  https://github.com/Scholarg19/agenttrail
- Token: name `AgentTrail`, symbol `TRAIL`. Token kinds: 0 = daily stamp,
  1–3 = milestone badge tiers. All tokens are soulbound (transfers and
  approvals revert) and render fully on-chain SVG art via `tokenURI`.

## Writes (value must be 0; preview + explicit user confirmation required)

| Function | Selector | Notes |
|---|---|---|
| `stamp()` | `0xc85e07b9` | Free (gas only). Reverts if the caller holds no Agent ID, already stamped this UTC day, or stamping is paused. Mints one soulbound stamp NFT. |
| `claimMilestone(uint8 tier)` | `0x644c92a4` | tier 0 = 3 cumulative stamps, 1 = 7, 2 = 14. One claim per tier per address. Reverts if the threshold is not reached or the tier was already claimed. |

## Reads (eth_call, permissionless)

| Function | Returns | Notes |
|---|---|---|
| `hasAgentId(address)` | bool | True when `registry.balanceOf(address) > 0` |
| `canStampToday(address)` | bool | False after today's stamp or while paused |
| `totalStampsOf(address)` | uint256 | Cumulative stamps; milestone thresholds read this |
| `currentStreak(address)` | uint256 | Consecutive UTC days; a missed day restarts it at 1 on the next stamp |
| `lastStampDay(address)` | uint256 | UTC day index of the most recent stamp |
| `milestoneClaimable(address, uint8 tier)` | bool | Threshold reached and tier not yet claimed |
| `milestoneClaimedMask(address)` | uint256 | bit0 = tier 0, bit1 = tier 1, bit2 = tier 2 |
| `milestoneThreshold(uint8 tier)` | uint256 | 3 / 7 / 14 for tiers 0 / 1 / 2 |
| `totalAgents()` | uint256 | Distinct addresses that have ever stamped |
| `totalStampsAll()` | uint256 | All stamps ever minted |
| `stampsOnDay(uint256 day)` | uint256 | Stamps minted on a given UTC day index |
| `todayIndex()` | uint256 | Current UTC day index |
| `nextTokenId()` | uint256 | Next token id to be minted |
| `tokenKind(uint256 tokenId)` | uint256 | 0 = stamp, 1–3 = badge tier + 1 |
| `ownerOf(uint256 tokenId)` | address | Standard ERC-721 read |
| `tokenURI(uint256 tokenId)` | string | data: URI with on-chain SVG image |

## Events

| Event | Meaning |
|---|---|
| `Stamp(agent, tokenId, day, streak)` | A daily stamp was minted |
| `Milestone(agent, tokenId, tier)` | A milestone badge was claimed |

## Semantics

- Eligibility is checked against the Agent ID registry on every `stamp()` call;
  there is no allowlist or registration step inside AgentTrail.
- Milestones are cumulative: breaks in the streak never reduce
  `totalStampsOf` and never block a badge.
- No make-up stamps exist and none can be added; the contract is immutable and
  the owner's only power is `setStampOpen(bool)`.
- The contract is non-payable and holds no funds at any time.
