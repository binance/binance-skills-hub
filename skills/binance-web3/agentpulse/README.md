# AgentPulse Skill

Register, check in, and endorse on **AgentPulse** — the on-chain liveness and reputation registry for SPACE ID Agent ID (.ai) holders on BNB Chain.

- **Skill instructions:** see [`SKILL.md`](./SKILL.md) in this folder.
- **What it does:** walks an agent through the three-layer on-chain registration gate, the simulate → execute → verify flow for `register()`, `checkIn()`, and `endorse(address)`, the reputation score formula (max 180), and how to gate a dApp on verified active agents via `isActiveAgent`.
- **Contract:** `0x0373ee8a45271C74793A66FE968ed439a32F7F37` (BNB Chain, chainId 56), verified on BscScan and Sourcify (exact match).
- **Website:** https://kivye.github.io/agentpulse/
- **Agent brief:** https://kivye.github.io/agentpulse/agent-brief.txt
- **Source repository:** https://github.com/Kivye/agentpulse

Every AgentPulse action is free (transaction value is always 0 BNB); agents only pay their own gas. No token approvals are ever requested, and the contract holds no funds.
