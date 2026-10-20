---
name: binance
description: Use binance-cli for Binance Spot, Futures (USD-S), and Convert. Requires auth.
metadata:
  version: 2.0.0
  author: Binance
  openclaw:
    requires:
      bins:
        - binance-cli
    install:
      - kind: shell
        label: Install binance-cli
        script: |
          if npm list -g @binance/binance-cli --depth=0 >/dev/null 2>&1; then
            VERSION="$(binance-cli --version 2>/dev/null | grep -Eo '[0-9]+\.[0-9]+\.[0-9]+' | head -n1 || true)"
            MAJOR="$(echo "$VERSION" | cut -d. -f1)"

            if [ "$MAJOR" = "1" ]; then
              npm uninstall -g @binance/binance-cli
            fi
          fi

          curl --proto '=https' --tlsv1.2 -LsSf \
            https://github.com/binance/binance-cli/releases/latest/download/binance-cli-installer.sh \
            | sh
license: MIT
---

# Binance

## binance-cli setup

Before using `binance-cli`:

1. If global npm package `@binance/binance-cli` exists and `binance-cli --version` is `< 2.0.0`, uninstall it:

```sh
npm uninstall -g @binance/binance-cli
```

2. Install the latest release:

```sh
curl --proto '=https' --tlsv1.2 -LsSf \
  https://github.com/binance/binance-cli/releases/latest/download/binance-cli-installer.sh \
  | sh
```

3. Verify:

```sh
binance-cli --version
```


> **PREREQUISITE:** Read [`auth.md`](./references/auth.md) for auth, global flags, and security rules.

## Helper Commands

| Command | Description |
|---------|-------------|
| [`algo`](./references/algo.md) | Algo Trading |
| [`alpha`](./references/alpha.md) | Alpha |
| [`c2c`](./references/c2c.md) | C2C |
| [`convert`](./references/convert.md) | Convert |
| [`copy-trading`](./references/copy-trading.md) | Copy Trading |
| [`crypto-loan`](./references/crypto-loan.md) | Crypto Loan |
| [`derivatives-options`](./references/derivatives-options.md) | Derivatives Trading (Options) |
| [`derivatives-portfolio-margin`](./references/derivatives-portfolio-margin.md) | Derivatives Trading (Portfolio Margin) |
| [`derivatives-portfolio-margin-streams`](./references/derivatives-portfolio-margin-streams.md) | Derivatives Trading Streams (Portfolio Margin) |
| [`derivatives-portfolio-margin-pro`](./references/derivatives-portfolio-margin-pro.md) | Derivatives Trading (Portfolio Margin Pro) |
| [`derivatives-portfolio-margin-pro-streams`](./references/derivatives-portfolio-margin-pro-streams.md) | Derivatives Trading Streams (Portfolio Margin Pro) |
| [`dual-investment`](./references/dual-investment.md) | Dual Investment |
| [`fiat`](./references/fiat.md) | Fiat |
| [`futures-coin`](./references/futures-coin.md) | Derivatives Trading (COIN-M Futures) |
| [`futures-coin-streams`](./references/futures-coin-streams.md) | Derivatives Trading Streams (COIN-M Futures) |
| [`futures-usds`](./references/futures-usds.md) | Derivatives Trading (USDS-M Futures) |
| [`futures-usds-streams`](./references/futures-usds-streams.md) | Derivatives Trading Streams (USDS-M Futures) |
| [`gift-card`](./references/gift-card.md) | Gift Card |
| [`margin-trading`](./references/margin-trading.md) | Margin Trading |
| [`margin-trading-streams`](./references/margin-trading-streams.md) | Margin Trading Streams |
| [`mining`](./references/mining.md) | Mining |
| [`pay`](./references/pay.md) | Pay |
| [`rebate`](./references/rebate.md) | Rebate |
| [`simple-earn`](./references/simple-earn.md) | Simple Earn |
| [`spot`](./references/spot.md) | Spot Trading |
| [`spot-streams`](./references/spot-streams.md) | Spot Trading Streams |
| [`staking`](./references/staking.md) | Staking |
| [`sub-account`](./references/sub-account.md) | Sub Account |
| [`vip-loan`](./references/vip-loan.md) | VIP Loan |
| [`wallet`](./references/wallet.md) | Wallet |

## Notes

- ⚠️ **Prod transactions** — always ask user to type `CONFIRM` before executing.
- Use `--help` to get the list of commands and parameters.
- Use the output from both stdout and stderr.
- Append `--profile <name>` to any command to use a non-active profile.
- All authenticated endpoints accept optional `--recvWindow <ms>` (max 60 000).
- Timestamps (`startTime`, `endTime`) are Unix ms.
- For endpoints not listed in the skill, use `binance-cli request (GET|POST|PUT...) <url> [--signed]`. Any Parameters can be added to the request (e.g: `--param1 value --param2 value`).