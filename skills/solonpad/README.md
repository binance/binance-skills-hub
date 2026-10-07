# solonpad

Agent-native launchpad on Arc (5042) where trade fees buy tokenized stock for holders.

- `SKILL.md` — what an agent can do and the rules it must follow.
- `references/agent-api.md` — the /api/v3 read endpoints, dividend and proof-of-reserves
  surfaces, and the execution rails.

The machine interface (addresses with pinned codehashes, 18 V3 ABIs, a 421-entry error
dictionary, a 26-check read-only verifier) is a separate pinned repository:
**https://github.com/solonlend/solonpad-skill** — install by pinning a commit hash and
re-verify every address on-chain before sending value. No scripts are bundled here; the
read-only reference tool (`tools/pad-read.mjs`) lives in that repo and requires only
Node.js ≥ 18.

Not available to persons or entities in the United States, China, Japan, or sanctioned
jurisdictions. Educational material; not investment advice; no asset is endorsed.
