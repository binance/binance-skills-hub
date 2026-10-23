# gang-launchpad

Skill for Binance Skills Hub: operate the Gang bonding-curve launchpad on BNB Chain with a Binance Agentic Wallet.

**Create:** LaunchpadV2 only (~15 BNB graduation). Soft/U/S: existing buy/sell/claim only. Logo: `gang upload-logo` or https://gang.fun/dev/logo.

## Install (after merge)

```bash
npx skills add https://github.com/binance/binance-skills-hub --skill gang-launchpad
```

Until merged, use the upstream product skill:

```bash
npx skills add gangfun/gang-launchpad/skill
npm i -g @binance/agentic-wallet
npm i -g @gangfun/cli@0.2.0 --registry=https://npm.pkg.github.com
# or: npm i -g github:gangfun/cli
```

## Layout

- `SKILL.md` — agent instructions + Hub frontmatter
- `references/` — preflight, trade, create

## License

MIT (Hub contribution requirement). Product ops docs elsewhere may use a different framing; this folder is for Hub review only.
