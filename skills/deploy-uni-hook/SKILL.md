---
name: deploy-uni-hook
description: |
  Generate, simulate, audit, and deploy a Uniswap v4 hook + a test pool from a one-line brief,
  on any Uniswap v4 chain (every testnet and mainnet). Use a pre-audited template
  (dynamic-fee, no-op, or hook-fee) or build a from-scratch freeform hook whose flags are
  auto-derived from its callbacks. Every deploy is gated: static audit + dangerous-pattern
  scan + a behavioral forge test + a fork simulation, all BEFORE any broadcast. Dry-run by
  default; an explicit arm: is required to broadcast; testnet is the default and mainnet sits
  behind a triple lock. Use when the user asks to write, build, test, or deploy a Uniswap v4
  hook, or to spin up a v4 pool with custom swap/fee/liquidity logic.
metadata:
  author: aeonframework
  version: "1.0"
license: MIT
---

# Deploy Uni Hook Skill

Turn a one-line brief into a live Uniswap v4 hook. Built to be safe: it simulates every
deploy before it broadcasts, defaults to a dry-run on a testnet, and needs an explicit
`arm:` to move on-chain.

## Input grammar

The user's request is the brief. Grammar: `[arm:][template:<name>] [chain:<name>] <brief>`

- `` (empty) - print this help and exit `DEPLOY_HOOK_EMPTY`.
- `<brief>` - **dry-run**: generate, compile, mine the address, and simulate. Never broadcasts. *[default - no prefix]*
- `arm:<brief>` - **broadcast**: run the full dry-run first, then deploy for real only if the simulation passes.
- `template:<name>` - force a mode: `dynamic` | `noop` | `skim` (pre-audited templates) or `freeform` (build a whole hook from the prompt). Omit to auto-pick: a brief that matches a template uses it; anything else uses `freeform`.
- `chain:<name>` - any Uniswap v4 chain in `templates/chains.tsv` (run `./hook-deploy.sh chains` to list). Default `base-sepolia`. Testnets: `base-sepolia`, `unichain-sepolia`, `arbitrum-sepolia`. Mainnets (`testnet: false`) require BOTH `arm:` and an explicit `chain:` - the skill never targets mainnet by default. `base-mainnet` is an alias for `base`.

## Prerequisites

This skill needs the Foundry toolchain (`forge`/`cast`/`anvil`) and a pre-built Uniswap v4
project. Run the one-time setup, which installs Foundry (if missing) and builds the project
at `$HOOKBUILD_DIR` (default `$HOME/hookbuild`):

```bash
./scripts/setup.sh
```

Node/Foundry are the only external dependencies. If `forge` is unavailable after setup, the
skill degrades to `DEPLOY_HOOK_NO_TOOLCHAIN` (it emits the generated source + plan and never
tries to install in-run).

## Why this design

A hook binding is immutable and a bad hook can brick a pool or trap funds, so the gates sit
BEFORE the deploy: two of them (`dry-run` then `arm:`), a mandatory simulation, and idempotent
state. Everything after the broadcast is just recording what already happened. The Foundry
flow is the proven one - mine a CREATE2 salt so the address carries the right hook-flag bits,
deploy, initialize the pool, add liquidity, run one swap.

## Safety contract (do not skip)

1. **Mainnet needs a triple lock.** Never target a `testnet: false` chain unless the request
   has BOTH `arm:` AND an explicit `chain:<mainnet-name>` - AND the environment has
   `HOOK_MAINNET_OK=1` set (a third, operator-level lock enforced inside `hook-deploy.sh`,
   exit 7). Only run this skill where the caller is trusted - a mainnet deploy spends real
   gas, so an untrusted request must never be able to reach a broadcast. On a mainnet chain,
   read the deployer balance with `cast balance` and abort (`DEPLOY_HOOK_UNDERFUNDED`) if it
   cannot cover the simulation's `Estimated amount required`; `hook-deploy.sh` independently
   enforces a funding floor (exit 8), an optional `MAX_GAS_GWEI` gas-price ceiling (exit 9),
   and warns if the deployer holds more than `HOOK_MAX_FLOAT_ETH` (default 0.25) - a deploy
   key must hold gas float only, never LP or treasury capital.
2. **Simulate before every broadcast.** If the simulation reverts, do not broadcast. Report
   the revert and exit `DEPLOY_HOOK_SIM_FAILED`.
3. **Dry-run is the default.** Broadcast only when the request starts with `arm:`.
4. **Key hygiene.** The deployer key is a burner. Never print it. Never put it on a shell
   command line - always go through `./hook-deploy.sh`, which reads it from the env inside
   the script.
5. **Idempotency.** Before broadcasting, read `deploys/hook-deploys.json`. If an identical
   brief already deployed within the last hour, do not re-deploy. The deploy script is also
   idempotent at the address level: it deploys to the *canonical* address (the first
   flag-matching CREATE2 salt for this exact `(creationCode, flags, PoolManager)`). If that
   address already holds code, an identical hook is already live, so the script logs
   `ALREADY_DEPLOYED <addr>` and does nothing.

## Inputs and config

- **Templates:** `templates/` - `DynamicFeeHook.sol`, `NoOpHook.sol`, `HookFeeHook.sol`
  (pre-audited), `Hook.sol` + `Hook.t.sol` + `hook.env.example` (freeform scaffold,
  behavioral-test gate, manifest), plus `DeployHook.s.sol`, `MockERC20.sol`, `foundry.toml`,
  `chains.tsv`.
- **Chain config:** `templates/chains.tsv` is the single source of truth - TAB-separated
  `name  chainId  testnet  poolManager  stateView  rpc  explorer  alchemy`, one row per
  Uniswap v4 chain. To add a chain, append a row.
- **Authenticated RPC:** the `rpc` column is a public endpoint. When `ALCHEMY_API_KEY` is set
  and the row has an `alchemy` slug, `hook-deploy.sh` uses
  `https://<slug>.g.alchemy.com/v2/$ALCHEMY_API_KEY` instead - a trusted RPC matters for the
  mainnet sim + broadcast (a lying public RPC can fake a clean sim). Precedence: `RPC_URL`
  (override) > Alchemy key + slug > public `rpc`. The RPC path (where the key lives) is never
  printed - logs show host only.
- **Deploy helper:** `hook-deploy.sh` - the only sanctioned broadcast path (hides the key).
- **State:** `deploys/hook-deploys.json` - idempotency + the deploy ledger (local to the skill).

### Template picker (when `template:` is not given)

| Brief mentions | Mode |
|---|---|
| fee, volatility, dynamic, surge | `dynamic` |
| skim, hook fee, take a cut, revenue | `skim` |
| "minimal" / "starter" / "empty" | `noop` |
| anything else (novel logic the templates don't cover) | `freeform` |

## Steps

1. **Parse the request.** Extract the `arm:` flag, the optional `template:`, the optional
   `chain:`, and the free-text brief. Empty brief - exit `DEPLOY_HOOK_EMPTY` with the grammar.

2. **Resolve the chain.** The chain name resolves in `templates/chains.tsv` (default
   `base-sepolia`); `hook-deploy.sh` maps it to the official `PoolManager` + RPC, so you pass
   the NAME, not the address. Run `./hook-deploy.sh chains` to list. If the name is unknown,
   exit `DEPLOY_HOOK_BAD_CHAIN`. If the row's `testnet` column is `false` (mainnet), enforce
   the double opt-in - require BOTH `arm:` and an explicit `chain:`, else exit
   `DEPLOY_HOOK_BAD_CHAIN`.

3. **Confirm the toolchain + project.** `./scripts/setup.sh` stages everything: Foundry on
   `$PATH` and a pre-built v4 project at `$HOOKBUILD_DIR` (default `$HOME/hookbuild`) holding
   all three templates + `MockERC20.sol` + `DeployHook.s.sol` + the v4 libraries. Check
   `command -v forge` and that `$HOOKBUILD_DIR` exists; if either is missing, degrade to
   `DEPLOY_HOOK_NO_TOOLCHAIN` (emit the generated source + plan).

4. **Build the hook (brief-driven).**
   - **Template mode** (`dynamic` / `noop` / `skim`): in `$HOOKBUILD_DIR/src/<Hook>.sol`, edit
     ONLY the region between `// --- HOOK:LOGIC START ---` and `// --- HOOK:LOGIC END ---`.
     Keep the callback signatures and flag set unchanged. If the default already fits the
     brief, leave it.
   - **Freeform mode** (anything else): write the whole hook into `$HOOKBUILD_DIR/src/Hook.sol`
     - replace the `// --- HOOK:BODY ... ---` region. Rules: keep the contract name `Hook` and
     `constructor(IPoolManager)`; implement whichever v4 callbacks the prompt needs, each with
     the EXACT `IHooks` signature, `onlyPoolManager`, and the right selector return. Do NOT
     hand-set flags - they are auto-derived from which callbacks you implement. If a callback
     returns a non-zero delta, set `HOOK_RETURNS_DELTA` in `$HOOKBUILD_DIR/hook.env`; for a
     fee-override hook set `HOOK_POOL_FEE=dynamic` there.
     - **Also write the behavioral test.** In `$HOOKBUILD_DIR/test/Hook.t.sol`, replace the
     `// --- HOOK:ASSERT ... ---` region with `test_*` functions that assert the hook's
     SPECIFIC intended behavior - not just "does not revert". For every rule in the brief write
     at least one positive and one negative case: a swap the hook must REJECT as
     `_expectSwapRevert(zeroForOne, amount, Hook.SomeError.selector)` (this helper unwraps v4's
     `WrappedError` - do NOT use bare `vm.expectRevert`, it won't match the wrapper); a swap it
     must ALLOW as a plain `_swap(...)`; any getter/accounting as
     `assertEq(hook.someGetter(...), expected)`. Do NOT edit `setUp()` or the helpers - only the
     `HOOK:ASSERT` region.

5. **Simulate + audit (always).** Pass mode, kind, and chain (chain omitted = `base-sepolia`):
   ```bash
   ./hook-deploy.sh simulate <kind> <chain>
   ```
   For `freeform` this runs, in order, three gates before any deploy:
   1. **Static audit** - derives the flags from the callbacks; checks the contract is named
      `Hook`, has >=1 callback, every callback carries `onlyPoolManager`, `test/Hook.t.sol` has
      >=1 `test_` function, and scans for dangerous patterns (`selfdestruct`/`delegatecall` are
      hard fails; `tx.origin`/raw value-call/inline `assembly` print a warning to review). A
      failure exits `DEPLOY_HOOK_AUDIT_FAILED` (never deploy).
   2. **Behavioral test** - `forge test --fork-url <chain> --match-contract HookBehaviorTest`
      runs the agent-written assertions on a fork. A failing OR non-compiling test exits
      `DEPLOY_HOOK_TEST_FAILED` (never deploy).
   3. **Fork simulation** - `forge script` compiles, mines the salt, deploys in-memory,
      initializes the pool, adds liquidity, and runs one swap against a fork of the target chain.
   On a compile error, fix and retry (max 3). On a sim revert, exit `DEPLOY_HOOK_SIM_FAILED`.
   Capture the mined hook address, the derived flags, and the `Estimated amount required`. On
   mainnet, compare that estimate to the deployer balance (`cast balance <addr> --rpc-url
   <rpc>`) and exit `DEPLOY_HOOK_UNDERFUNDED` if it will not cover it. For a freeform hook, also
   **read the generated `Hook.sol` and reason about safety** before arming: does any callback
   let a caller drain funds, brick the pool (unconditional revert), or reenter? If unsure, stop
   at the dry-run and report the concern.

6. **Dry-run stop.** If the request did NOT start with `arm:`, STOP here. Report: template,
   mined address (with its flag bits), the pool key, and the simulation result. Exit
   `DEPLOY_HOOK_DRY_RUN`.

7. **Arm checks (only if `arm:`).**
   - Confirm `HOOK_DEPLOYER_PRIVATE_KEY` is set. If not, degrade to the dry-run report and exit
     `DEPLOY_HOOK_NO_KEY`.
   - Read `deploys/hook-deploys.json`. If the same `(chain, template, brief)` deployed in the
     last hour, exit `DEPLOY_HOOK_IDEMPOTENT` with the prior address.

8. **Broadcast.**
   ```bash
   ./hook-deploy.sh broadcast <kind> <chain>
   ```
   The runner prints a **deploy receipt** (hook address, decoded flag names, explorer
   deep-link, tx hashes) and, when `ETHERSCAN_API_KEY` is set on an Etherscan-family chain,
   **auto-verifies** the hook source on the explorer (best-effort - a failed verify never fails
   a completed deploy). If it printed `ALREADY_DEPLOYED`, treat the reported address as the
   result (no new deploy). Read the hook address and tx hashes from the receipt or
   `$HOOKBUILD_DIR/broadcast/DeployHook.s.sol/<chainId>/run-latest.json`.

9. **Verify.** With `cast`, read the pool back through `StateView.getSlot0(poolId)` on the RPC.
   Confirm the pool exists and the hook address low bits equal the template's flags. Confirm the
   swap emitted the hook event.

10. **Record the deploy.** Write the record locally (append-only history):
    - `deploys/hook-deploys.json` - append this deploy (chain, template, brief, hook address,
      flags, tx hashes, timestamp, poolId, poolKey).
    - `deploys/hooks/<hook-address>.sol` - copy the deployed source from
      `$HOOKBUILD_DIR/src/<Hook>.sol`.
    - For freeform, also `deploys/hooks/<hook-address>.t.sol` - copy
      `$HOOKBUILD_DIR/test/Hook.t.sol` (the behavioral test that gated the deploy).

11. **Report + exit.** Summarize (template, address, explorer link, dry-run vs live). Exit
    `DEPLOY_HOOK_OK` (or `DEPLOY_HOOK_DRY_RUN`).

## Degrade rules

- No key - dry-run report, `DEPLOY_HOOK_NO_KEY`. Never fail hard.
- Foundry or the staged project missing (`command -v forge` fails or `$HOOKBUILD_DIR` absent) -
  emit the generated source + plan, `DEPLOY_HOOK_NO_TOOLCHAIN`. Do not try to install in-run.
- Bad/missing chain, or mainnet without the double opt-in - `DEPLOY_HOOK_BAD_CHAIN`.
- Mainnet chain but `HOOK_MAINNET_OK=1` not set (`hook-deploy.sh` exit 7) -
  `DEPLOY_HOOK_MAINNET_NOT_AUTHORIZED` (never broadcast).
- Mainnet balance below the simulation estimate, or the deployer is unfunded (`hook-deploy.sh`
  exit 8) - `DEPLOY_HOOK_UNDERFUNDED` (never broadcast).
- Gas price above `MAX_GAS_GWEI` (`hook-deploy.sh` exit 9) - `DEPLOY_HOOK_GAS_TOO_HIGH` (never
  broadcast; retry when fees drop).
- Freeform static audit fails - `DEPLOY_HOOK_AUDIT_FAILED` (never deploy).
- Freeform behavioral test fails or does not compile - `DEPLOY_HOOK_TEST_FAILED` (never deploy).
- Simulation revert - `DEPLOY_HOOK_SIM_FAILED` (never broadcast after a failed sim).

## Notes

- The three templates are pre-validated: each compiles and simulates a full deploy + swap on
  Base Sepolia (`dynamic` = 0x10C0 flags, `noop` = 0x80, `skim` = 0x44).
- **Freeform** builds an arbitrary hook from the prompt into `src/Hook.sol` and its behavioral
  test into `test/Hook.t.sol`. Flags are auto-derived from the callbacks (never hand-set). Three
  gates run before any deploy: a static audit, the agent-written `forge test` behavioral
  assertions on a fork, then the fork simulation. Prefer a matching template when one fits.
- **Any Uniswap v4 chain works.** `chains.tsv` carries every official v4 deployment, each
  verified to hold the PoolManager. The same flow runs on all of them - only the
  `PoolManager`/RPC differ, resolved by name. The CREATE2 deployer (`0x4e59...4956C`) is
  required for the mined address; if a chain lacks it the fork simulation fails closed before
  any broadcast.
- **Mainnet is gas-only.** The deploy mints its own `MockERC20` tokens to itself (free) and
  seeds the demo pool with those mock tokens - a mainnet broadcast risks GAS ONLY, never real
  capital. The deployed pool is a MockA/MockB demo; the reusable hook contract is the real
  deliverable. The deployer key must be a funded burner holding gas float only; mainnet also
  needs the `HOOK_MAINNET_OK=1` lock.
- **Neutral by design.** This skill deploys infrastructure (a hook contract + a demo pool). It
  does not recommend, rate, or promote any token or asset, and it never uses or requires a real
  user wallet address - only a burner deploy key held in the environment.
