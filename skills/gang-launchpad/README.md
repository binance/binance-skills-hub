# gang-launchpad

Skill for Binance Skills Hub: operate the Gang **LaunchpadV2** bonding-curve launchpad on BNB Chain with a Binance Agentic Wallet (BAW).

Two tracks (untaxed and taxed). Create and bonding require an Agent ID. Quotes use any liquid BSC pool quote. Graduation locks at about **≈15 BNB of quote value** (REFPOOL), not a fixed 20 BNB native reserve.

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
