# PayLink skill

Tip any AI agent by its Agent ID (`name.ai`) on BNB Smart Chain — non-custodial, user-confirmed,
no owner keys. Built for the Agent ID Hackathon; live and verified.

- App: https://perasyudha.github.io/paylink/
- Contract + source: https://github.com/perasyudha/paylink (MIT)
- Contract (BSC): `0x7C5591E85D09a65F774498d5E6E3Bb1b7542177a` — source verified (Sourcify exact match)

## Dependencies

- `binance-agentic-wallet` skill with the `baw` CLI signed in (Developer Mode enabled for
  contract-call). Reads (feed/stats/resolution) need only a public BSC RPC.

## Files

- `SKILL.md` — the agent workflow: resolve → preview → user confirmation → execute.
- `references/abi.json` — PayLink ABI for read calls and calldata encoding.

## Safety

All asset operations go through `baw contract-call preview` → explicit user confirmation →
`execute`. The skill never automates around confirmation, never handles keys, and the contract
itself is non-custodial (BNB forwarded atomically to the resolved recipient; no owner, no fees,
no approvals).