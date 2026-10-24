# TRDEFI Yield — README

This skill wraps TRDEFI's Aqua virtual strategies (yield.trdefi.com) for AI agents. It is the backend counterpart to the WebMCP tools at `yield.trdefi.com/webmcp.js` (backend-only, no UI pill).

## Install

```bash
npx skills add https://github.com/binance/binance-skills-hub/tree/main/skills/binance-web3/trdefi-yield
# or whole hub
npx skills add https://github.com/binance/binance-skills-hub
```

Test locally:

```bash
npx skills add ./skills/binance-web3/trdefi-yield
```

## Scripts

No scripts required — all tools are thin wrappers over `https://yield.trdefi.com/.netlify/functions/strategies`. For manual curl:

```bash
curl "https://yield.trdefi.com/.netlify/functions/strategies?resource=list&chain=base&limit=5"
curl "https://yield.trdefi.com/.netlify/functions/strategies?resource=quote&hash=0x...&chain=base&amount=1000000"
```

## Why this is not a duplicate of `fiat` / `onchain-pay`

- `fiat` = Binance Pay fiat capabilities, `onchain-pay` = Binance Onchain Pay (175+ methods, minimum $12). Both are Binance Pay rails.
- `trdefi-yield` = **non-custodial treasury yield** — idle float stays in user's Safe, virtual Aqua strategy, allowance (ERC-2612), no pool deposit, 0.02% all-in to 0x4C96..., x402-compatible. Different domain: treasury optimization vs on-ramp.

## Security

See `SKILL.md` Security & Disclaimer. Use dedicated wallet, 0600 env.

