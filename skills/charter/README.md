# charter

A Skill Hub skill for calling [CHARTER](https://github.com/angelraph/charter) — a mandate/policy layer that vets an agent's trade proposals against a human-defined covenant before they execute.

See [`skill.md`](./skill.md) for the full instructions an agent follows to use this skill, and [`references/`](./references) for the exact request/response JSON shapes.

## Local setup (to run CHARTER yourself)

```bash
git clone https://github.com/angelraph/charter
cd charter
npm install
cp .env.example .env   # fill in your Binance testnet (or mainnet MCP) credentials
npm run dev init        # activates the demo mandate
npx tsx src/index.ts serve   # starts the API this skill calls
```
