# CheesePad

Lets an agent use a Binance Agentic Wallet on [CheesePad](https://www.cheesepad.ai), a token
launchpad on BNB Smart Chain and Robinhood Chain.

## What it does

- Find Melt Curves (bonding curves), presales, fair launches, subscriptions and microsales.
- Buy and sell on Melt Curves.
- Contribute to, claim from and refund presales, fair launches, subscriptions and microsales,
  including "Agent ID only" sales that only wallets holding an Agent ID can join.

## How it works

The public CheesePad API (`https://api.cheesepad.ai`, no login) returns ready-to-send transaction
steps. The agent sends each step with `baw contract-call preview`, shows the user Binance's
preview, and runs `baw contract-call execute` only after the user's explicit yes. Graduated
curves trade through `baw market-order`.

## Requirements

- The `baw` CLI (`@binance/agentic-wallet`), signed in to an Agentic Wallet.
- Developer Mode turned on in the Binance App (Agentic Wallet → Settings → Developer Mode), since
  sales and curves use contract calls.
- For Agent ID only curves and sales: an Agent ID on the wallet.

No scripts and no extra dependencies.

## Files

- `SKILL.md`: routing and the rules that apply to every transaction.
- `references/`: finding launches, buying, selling, sales, Agent ID checks, and safety
  (confirmation flow and every `eligible: false` reason).

Source and issues: https://github.com/cheesepad-ai/cheesepad-agent-skills
