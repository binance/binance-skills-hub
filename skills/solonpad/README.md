# solonpad

Agent-native launchpad + cross-pad aggregator on Arc (5042) and Robinhood Chain (4663).

- `SKILL.md` — what an agent can do and the rules it must follow.
- `references/agent-api.md` — read-API endpoints, tri-state field semantics, the
  rule-based verdict table, execution rails.

The machine interface (addresses, ABIs, error dictionary, verification checklist,
runnable read-only tools) is a separate pinned repository:
**https://github.com/solonlend/solonpad-skill** — install by pinning a commit hash and
re-verify every address on-chain before sending value. No scripts are bundled here; the
read-only reference tool (`tools/pad-read.mjs`) lives in that repo and requires only
Node.js ≥ 18.

Not available to persons or entities in the United States, China, Japan, or sanctioned
jurisdictions. Educational material; not investment advice; no asset is endorsed.
