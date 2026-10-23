# Gang CLI (`gang`)

Operate [gang.fun](https://gang.fun) from a Binance **Agentic Wallet**. Curve buys/creates require a SPACE ID `.ai` Agent ID. This CLI builds calldata; `baw` signs — no keys in this package.

**Create path (0.2.1+):** LaunchpadV2 only (`0x1B8F3f69DFa0a7F63d308C7EB0Fd38D8b099966E`). Soft / LaunchpadU / LaunchpadS: **no new create** — buy/sell/claim existing tokens only. New tokens graduate at ≈ **15 BNB** (PoolCheck). Soft archive tokens still graduate at 20 BNB on-chain.

## Install

Node ≥ 18. Also install Binance Agentic Wallet CLI (`baw`):

```bash
npm i -g @binance/agentic-wallet
npm i -g @gangfun/cli@0.2.1 --registry=https://npm.pkg.github.com
```

Package: [GitHub Packages `@gangfun/cli`](https://github.com/gangfun/cli/pkgs/npm/cli). Auth:

```ini
@gangfun:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=YOUR_GITHUB_TOKEN
```

**Alternate** (public git tip):

```bash
npm i -g github:gangfun/cli
```

Skill:

```bash
npx skills add gangfun/gang-launchpad/skill
```

## Setup

1. Binance App → Wallet → Agentic Wallet → create; claim a `.ai` Agent ID.
2. Enable **Developer Mode** and **Trade all tokens**.
3. `baw auth signin` → confirm in the App.
4. `gang preflight` — `createPad` must be LaunchpadV2.

## Commands

```bash
gang preflight
gang list
gang token --token <addr>
gang quote --token <addr> --bnb <n>          # Soft archive: BNB; V2: quote ERC-20 (LaunchpadV2.sol math)
gang buy --token <addr> --bnb <n> [--slippage 1]
gang sell --token <addr> (--amount <tokens> | --all) [--slippage 1]
gang upload-logo --file ./avatar.png         # → https://gang.fun/api/logos/<id>.png
gang create --name <n> --symbol <s> [--logo-uri URL | --logo ./avatar.png] [--taxed] [--pair-or-quote 0x…]
gang execute --request-id <id>
gang tx --hash <0x..>
```

### Logo + create

Browser UI: https://gang.fun/dev/logo (pre-create tab).

```bash
# Option A — upload then create
gang upload-logo --file ./avatar.png
# → { "logoUrl": "https://gang.fun/api/logos/<id>.png", ... }
gang create --name "My Agent Coin" --symbol MAC --logo-uri https://gang.fun/api/logos/<id>.png
gang execute --request-id …

# Option B — create uploads for you
gang create --name "My Agent Coin" --symbol MAC --logo ./avatar.png
gang execute --request-id …
```

`--logo-uri ""` / omit logo → empty `logoURI` on-chain (allowed). `--taxed` requires `--pair-or-quote`. Untaxed default: `taxed=false`, `pairOrQuote=0x0` (WBNB).

Buy / sell / create: **preview → you confirm → execute**. `requestId` expires in ~5 minutes.

## Quote path

- **Soft archive tokens:** on-chain `quoteBuy` / `quoteSell`.
- **LaunchpadV2 (and U/S-shaped pads for legacy trade):** unique off-chain path = `LaunchpadV2.sol` `_prepBuy` / `_tokensOut` / `_quoteOut` (1% fee, wallet cap, graduation clamp). No Soft/U/S create/quote fallback. Output fields `quotePath` + `deterministic: true`.

## Rules (short)

- 1% per-wallet cap on the curve; excess input refunded in-tx.
- **New** creates → ≈15 BNB graduation (LaunchpadV2 / PoolCheck) → PancakeSwap V2, LP burned.
- Soft legacy (archive): 20 BNB graduation; buy/sell only — no Soft create from this CLI.
- Before graduation: no transfers, curve only.
- Graduated: trade on PancakeSwap (`pair` from `gang token`).

## Env

| Var | Meaning |
|---|---|
| `GANG_LAUNCHPAD` | Create target (default LaunchpadV2 `0x1B8F3f69…966E`) |
| `GANG_RPC_URL` | BSC HTTP RPC |
| `GANG_LOGO_API` | Logo upload endpoint (default `https://gang.fun/api/logos`) |

## Version

`0.2.1` · repo [gangfun/cli](https://github.com/gangfun/cli) · distribute via [GitHub Packages](https://github.com/gangfun/cli/pkgs/npm/cli) (not npmjs)
