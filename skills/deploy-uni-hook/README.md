# deploy-uni-hook

Generate, simulate, audit, and deploy a **Uniswap v4 hook** + a demo pool from a one-line
brief - on any Uniswap v4 chain (every testnet and mainnet). Pick a pre-audited template or
build a from-scratch freeform hook whose flags are auto-derived from its callbacks. Every
deploy passes a static audit, a dangerous-pattern scan, a behavioral `forge` test, and a fork
simulation **before** any broadcast. Dry-run by default; an explicit `arm:` is required to
broadcast; mainnet sits behind a triple lock.

See `SKILL.md` for the full agent instructions. This README covers install, usage, and
dependencies.

## Dependencies

- **Foundry** (`forge`, `cast`, `anvil`) - installed by `scripts/setup.sh` if missing.
- **git + curl** - used by setup to fetch Foundry and the Uniswap v4 libraries.

No root access is required. Nothing else is installed globally beyond Foundry in
`~/.foundry/bin`.

## Setup (run once)

```bash
./scripts/setup.sh
```

This installs Foundry (if needed) and builds a ready-to-deploy v4 project at
`$HOOKBUILD_DIR` (default `$HOME/hookbuild`): the v4 core/periphery libraries, all templates,
remappings, and a pre-built `forge` project. It prints the `HOOKBUILD_DIR` to export.

```bash
export HOOKBUILD_DIR="$HOME/hookbuild"
```

## Usage

The runner `hook-deploy.sh` is the only sanctioned broadcast path - it reads the deployer key
from the environment inside the script, so the key never appears on a command line.

```bash
# list every supported Uniswap v4 chain
./hook-deploy.sh chains

# dry-run: audit + behavioral test + fork simulation, never broadcasts (default)
./hook-deploy.sh simulate dynamic base-sepolia

# broadcast to a testnet (needs HOOK_DEPLOYER_PRIVATE_KEY)
./hook-deploy.sh broadcast dynamic base-sepolia
```

`<kind>` is `dynamic` | `noop` | `skim` (pre-audited templates) or `freeform` (an
agent-generated hook). `<chain>` is any name in `templates/chains.tsv` (default
`base-sepolia`).

Driven by an agent, the input grammar is `[arm:][template:<name>] [chain:<name>] <brief>` -
for example `arm: chain:base dynamic fee that rises with volatility`. See `SKILL.md`.

## Environment variables

| Variable | Required? | Purpose |
|---|---|---|
| `HOOK_DEPLOYER_PRIVATE_KEY` | broadcast only | Burner deploy key (gas float only, never LP/treasury capital). Read inside the runner; never printed. |
| `HOOKBUILD_DIR` | recommended | Pre-built v4 project dir (default `$HOME/hookbuild`). Set from `setup.sh` output. |
| `HOOK_MAINNET_OK` | mainnet only | Must equal `1` to allow any mainnet broadcast (third lock beyond `arm:` + explicit `chain:`). |
| `ALCHEMY_API_KEY` | optional | Use an authenticated Alchemy RPC over the public one (a lying public RPC can fake a clean sim). |
| `ETHERSCAN_API_KEY` | optional | Auto-verify the deployed hook source on Etherscan-family explorers (best-effort). |
| `MAX_GAS_GWEI` | optional | Refuse to broadcast when the gas price is above this ceiling. |
| `HOOK_MAX_FLOAT_ETH` | optional | Warn if the deployer holds more than this (default `0.25`) - a deploy key should hold gas only. |
| `RPC_URL` | optional | Override the resolved RPC (testing / escape hatch). |

## Safety

- **Dry-run by default.** Broadcast only with an explicit `arm:` (agent input) or the
  `broadcast` subcommand.
- **Simulate before every broadcast.** A reverting simulation blocks the deploy.
- **Mainnet triple lock.** `arm:` + explicit `chain:<mainnet>` + `HOOK_MAINNET_OK=1`, plus a
  funding floor and an optional gas ceiling.
- **Freeform gates.** Static audit (name/callbacks/`onlyPoolManager`/dangerous-pattern scan) +
  a behavioral `forge test` on a fork, both before any simulation or broadcast.
- **Gas-only exposure.** The demo pool is seeded with self-minted `MockERC20` tokens, so a
  mainnet broadcast risks gas only - never real capital. The reusable hook contract is the
  deliverable.

## Files

```
deploy-uni-hook/
├── SKILL.md            # agent instructions (grammar, gates, steps, degrade rules)
├── README.md           # this file
├── hook-deploy.sh      # key-safe deploy runner (simulate | broadcast | chains)
├── scripts/
│   └── setup.sh        # one-time: install Foundry + build the v4 project
└── templates/
    ├── DynamicFeeHook.sol   NoOpHook.sol   HookFeeHook.sol   # pre-audited templates
    ├── Hook.sol   Hook.t.sol   hook.env.example              # freeform scaffold + test gate
    ├── DeployHook.s.sol   MockERC20.sol   foundry.toml
    └── chains.tsv                                            # v4 chain registry
```

## Credit

Ported from the [aeon](https://github.com/aeonfun/aeon) agent framework
(author: `aeonframework`). MIT licensed. The three templates are pre-validated - each compiles
and simulates a full deploy + swap on Base Sepolia.
