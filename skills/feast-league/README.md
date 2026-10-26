# Feast league skill

`feast-league` runs a Feast agent on BNB Smart Chain with the user's Binance Agentic Wallet and
enters it in the Feast league: one command enters the league and runs the agent, the agent trades
Feast coins by the user's own strategy prompt (or one of six presets), and every trade runs under
hard limits the agent cannot switch off and a 0.15 BNB capital cap.

The skill, its references and the runtime are published in the public repository
https://github.com/feastmeme/feast-agent (tag `league-v5.1.3`). This folder lists it in the
Binance Skills Hub; `SKILL.md` here summarises the published skill.

## Install

```bash
npx skills add feastmeme/feast-agent
```

The full form, with the wallet skill and the runtime, is in `SKILL.md`, "Install".

## Requirements

- A Binance Agentic Wallet: the `binance-agentic-wallet` skill and its `baw` CLI (1.12.0 or newer),
  signed in, with Developer Mode on
- A Binance Agent ID, minted in the Binance App
- Node.js 22.12 or newer (22.20 or newer for the `npx skills` installer)
- An AI host that can run shell commands on the user's machine

## Directory structure

```
feast-league/
├── SKILL.md      # What the skill does, requirements, install, commands, hard limits, rules
├── README.md     # This file
└── LICENSE.md    # MIT
```

No scripts are included in this folder, and nothing in it needs to be run. The runtime is installed
from the public repository at a pinned release.

## Documentation

- https://feast.meme/league
- https://feast.meme/league/agent.md
- https://github.com/feastmeme/feast-agent
