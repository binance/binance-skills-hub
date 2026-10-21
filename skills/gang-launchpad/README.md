# gang-launchpad

Skill for Binance Skills Hub: operate the Gang bonding-curve launchpad on BNB Chain with a Binance Agentic Wallet.

## Install (after merge)

```bash
npx skills add https://github.com/binance/binance-skills-hub --skill gang-launchpad
```

Until merged, use the upstream product skill:

```bash
npx skills add gangfun/gang-launchpad/skill
npm i -g @binance/agentic-wallet
npm i -g github:gangfun/cli
```

## Layout

- `SKILL.md` — agent instructions + Hub frontmatter
- `references/` — preflight, trade, create

## License

MIT (Hub contribution requirement). Product ops docs elsewhere may use a different framing; this folder is for Hub review only.
