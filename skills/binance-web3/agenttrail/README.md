# AgentTrail Skill

Teaches an AI agent to use [AgentTrail](https://agenttrail.opav.work) — a daily
on-chain stamp book on BNB Chain that only Binance Agent ID holders can stamp in.

The agent can:

- Check Agent ID eligibility (`hasAgentId`)
- Do the daily free stamp (`stamp()`, once per UTC day, gas only)
- Claim cumulative milestone badges at 3 / 7 / 14 stamps (`claimMilestone`)
- Read stamp totals, streaks, and badge state for any address (proof of activity)

## Layout

- `SKILL.md` — the skill itself: frontmatter, safety rules, workflows.
- `references/contract-interface.md` — full contract interface: addresses,
  function selectors, read/write tables, events, and semantics.

## Design choices

- **Instruction-only, no scripts.** All signing is delegated to the user's own
  wallet tooling (for example the Binance Agentic Wallet skill in this hub),
  always as preview → explicit user confirmation → execute. This skill never
  handles keys and never sends a transaction itself.
- **Read paths are plain `eth_call`s** against any BSC RPC; no API key or
  account is needed.
- AgentTrail is a non-financial collectible: no token, no sale, no promised
  value. The skill text keeps that framing throughout.

## In the Skills Hub repo

This folder is intended to live at `skills/binance-web3/agenttrail/` in
[binance/binance-skills-hub](https://github.com/binance/binance-skills-hub).

## License

MIT
