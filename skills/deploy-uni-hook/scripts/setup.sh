#!/usr/bin/env bash
# setup.sh - one-time setup for the deploy-uni-hook skill.
#
# Installs the Foundry toolchain (forge/cast/anvil) if it is missing, then builds a
# ready-to-deploy Uniswap v4 project at $HOOKBUILD_DIR (default $HOME/hookbuild):
# the v4 libraries + all skill templates + remappings, pre-built with `forge build`.
# After this runs, the skill only edits a template's logic region and calls
# `./hook-deploy.sh simulate|broadcast <kind>` - no install, no v4 clone at run time.
#
# Idempotent-ish: it rebuilds $HOOKBUILD_DIR from scratch each run. Best-effort:
# never hard-fails (exit 0), so the skill can degrade to DEPLOY_HOOK_NO_TOOLCHAIN.
#
# Requirements: git, curl, and Node.js are NOT required; Foundry pulls its own libs.
set -uo pipefail

SKILL_DIR="$(cd "$(dirname "$0")/.." && pwd)"
TPL="$SKILL_DIR/templates"
DIR="${HOOKBUILD_DIR:-$HOME/hookbuild}"

log() { echo "setup: $*"; }

# 1) Foundry -> ~/.foundry/bin, made resolvable for this shell (and later CI steps).
if ! command -v forge >/dev/null 2>&1; then
  log "installing Foundry..."
  curl -L https://foundry.paradigm.xyz | bash >/dev/null 2>&1 || true
  "$HOME/.foundry/bin/foundryup" >/dev/null 2>&1 || true
fi
if [ -x "$HOME/.foundry/bin/forge" ]; then
  export PATH="$HOME/.foundry/bin:$PATH"
  # persist to PATH in CI (GitHub Actions) if present; a no-op locally.
  [ -n "${GITHUB_PATH:-}" ] && echo "$HOME/.foundry/bin" >> "$GITHUB_PATH"
fi
if ! command -v forge >/dev/null 2>&1; then
  log "WARN forge unavailable after install - add ~/.foundry/bin to PATH or install Foundry manually (https://getfoundry.sh). The skill will degrade to NO_TOOLCHAIN."
  exit 0
fi
log "$(forge --version 2>/dev/null | head -1)"

# 2) Scratch project: v4 libs + templates + remappings, pre-built.
log "building v4 project at $DIR ..."
rm -rf "$DIR"; mkdir -p "$DIR"; cd "$DIR" || { log "WARN cannot enter $DIR"; exit 0; }
forge init --force . >/dev/null 2>&1 || true
rm -f src/Counter.sol script/Counter.s.sol test/Counter.t.sol
forge install uniswap/v4-core >/dev/null 2>&1 || log "WARN v4-core install failed"
forge install uniswap/v4-periphery >/dev/null 2>&1 || log "WARN v4-periphery install failed"

cat > remappings.txt <<'EOF'
@uniswap/v4-core/=lib/v4-core/
@uniswap/v4-periphery/=lib/v4-periphery/
v4-core/=lib/v4-core/
v4-periphery/=lib/v4-periphery/
forge-std/=lib/forge-std/src/
solmate/=lib/v4-core/lib/solmate/
openzeppelin-contracts/=lib/v4-core/lib/openzeppelin-contracts/
EOF
cp "$TPL/foundry.toml" foundry.toml
cp "$TPL/DynamicFeeHook.sol" "$TPL/NoOpHook.sol" "$TPL/HookFeeHook.sol" "$TPL/MockERC20.sol" src/
cp "$TPL/Hook.sol" src/                 # freeform scaffold (agent rewrites its body)
cp "$TPL/DeployHook.s.sol" script/
cp "$TPL/Hook.t.sol" test/              # freeform behavioral-test gate (agent writes HOOK:ASSERT)
cp "$TPL/hook.env.example" hook.env     # freeform manifest defaults (agent overwrites)
cp "$TPL/chains.tsv" chains.tsv         # v4 chain registry (name -> PoolManager + RPC)

if forge build >/dev/null 2>&1; then
  log "project built at $DIR"
else
  log "WARN initial forge build failed (the agent can retry after editing logic)"
fi

# 3) Make the key-safe runner executable; export the build dir for the current shell.
chmod +x "$SKILL_DIR/hook-deploy.sh" 2>/dev/null || true
[ -n "${GITHUB_ENV:-}" ] && echo "HOOKBUILD_DIR=$DIR" >> "$GITHUB_ENV"
log "done. export HOOKBUILD_DIR=$DIR   (then run ./hook-deploy.sh simulate <kind> <chain>)"
exit 0
