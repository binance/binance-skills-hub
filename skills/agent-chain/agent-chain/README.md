# agent-chain skill

Lets an agent interact with **AGENT CHAIN** — an agent-native Layer 2 on BNB Smart Chain where gas is ANTB and every account is a Binance Agent ID holder — through the user's own Binance Agentic Wallet (`baw` CLI) and AGENT CHAIN's public JSON-RPC.

| | |
|---|---|
| Website | <https://agent-chain.agency> |
| Source | <https://github.com/imadegoodstuff/agent-chain> (skill lives in `skills/agent-chain/`) |
| Explorer / RPC | <https://explorer.agent-chain.agency> · <https://rpc.agent-chain.agency> (chainId `11190`) |

## What it does

- **Check Agent ID** — `baw wallet agent-id --json`; explains the in-App claim flow if the user has none.
- **Register on AGENT CHAIN** — `AgentRegistryMirror.register()` on BSC.
- **Claim a Genesis Seat** — `GenesisSeatClaim.claim()` on BSC (soulbound ERC-721, numbered).
- **Bridge ANTB** — exact-amount `ANTB.approve` then `Bridge.deposit(amount, l2Recipient)`, two separate confirmations.
- **Read** — chain status, fee estimate in ANTB/USD, seat lookups, bridge caps.
- **L2 send / call** — builds the unsigned transaction; the user signs with their own L2 key.

All BSC writes go through `baw contract-call preview` → the user sees the decoded calldata, target and wallet risk output → explicit confirmation → `baw contract-call execute`. The skill never holds keys, never asks for credentials, never resolves another person's wallet from a name, and only ever approves exact amounts.

## Files

```
SKILL.md                      frontmatter, command routing, preflight, build rules, security policy
references/agent-id.md        Agent ID check and in-App claim flow
references/register.md        AgentRegistryMirror.register()
references/genesis-seat.md    GenesisSeatClaim.claim(), seat lookups
references/bridge.md          ANTB approve + Bridge.deposit, caps, Beta escrow disclosure
references/chain-status.md    explorer /api/head, FeeKeeper reads
references/l2-transactions.md unsigned tx construction for chainId 11190
references/contracts.md       addresses, ABIs, selectors, owner permissions
references/preflight.md       per-conversation checks
references/security.md        risk warnings, disclaimers, forbidden actions
```

No scripts. Only dependency: `@binance/agentic-wallet` (`baw`), installed via the `openclaw.install` block in the frontmatter.

## Contracts (BSC mainnet, chainId 56, BscScan-verified)

| Contract | Address |
|---|---|
| `AgentRegistryMirror` | [`0x9C5488f9Aa9468B1db3Cc6B71143A8B2Ca810CF0`](https://bscscan.com/address/0x9C5488f9Aa9468B1db3Cc6B71143A8B2Ca810CF0#code) |
| `GenesisSeatClaim` | [`0x3972579dd0128BF0b6778cB3B457ba1d14D1695b`](https://bscscan.com/address/0x3972579dd0128BF0b6778cB3B457ba1d14D1695b#code) |
| `Bridge` | [`0x9eF8CA94a74B7Fbc5ae0b1F7a2dCaFCa14eE2A92`](https://bscscan.com/address/0x9eF8CA94a74B7Fbc5ae0b1F7a2dCaFCa14eE2A92#code) |

## Disclaimers

AGENT CHAIN is independent and not affiliated with, endorsed by, or sponsored by Anthropic, PBC, Binance, or BNB Chain. ANTB is issued by BTech Holdings Ltd (bStocks) under ADGM rules; bStocks are not available to US persons and are restricted in other jurisdictions. Nothing here is investment advice. $AGENT confers no rights to revenue, equity, or returns; fee distributions are protocol parameters that governance can change. Devnet tokens have no value.
