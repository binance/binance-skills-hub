#!/usr/bin/env bash
# hook-deploy.sh — run the Foundry deploy from the pre-staged project without
# putting the private key on the analyzed command line. The
# key is read INSIDE this script from $HOOK_DEPLOYER_PRIVATE_KEY, so the caller's
# command line never contains a $SECRET token.
#
# Usage:
#   ./hook-deploy.sh simulate  <dynamic|noop|skim|freeform> [chain]   # dry-run gate
#   ./hook-deploy.sh broadcast <dynamic|noop|skim|freeform> [chain]   # armed
#   ./hook-deploy.sh chains                                           # list chains
#
# chain: any name in chains.tsv (default base-sepolia). Every Uniswap v4 chain is
#   supported (testnets + mainnets); the name resolves to its official PoolManager
#   + RPC from chains.tsv.
#
# RPC: uses the public rpc from chains.tsv by default; if ALCHEMY_API_KEY is set and
#   the row has an alchemy slug, uses the authenticated Alchemy endpoint instead.
#   Set RPC_URL to override both (testing/escape hatch).
#
# Mainnet locks (all three needed to broadcast to a testnet:false chain): arm: +
#   explicit chain: (enforced by the skill) AND HOOK_MAINNET_OK=1 (enforced here).
#   The deployer must be funded; MAX_GAS_GWEI caps the gas price; HOOK_MAX_FLOAT_ETH
#   warns if the deployer holds more than gas float (it must not hold LP capital).
#
# freeform: the agent writes $HOOKBUILD_DIR/src/Hook.sol + hook.env. This script
# auto-derives the hook flags from which callbacks Hook.sol implements (plus any
# HOOK_RETURNS_DELTA declared in hook.env), runs a small STATIC AUDIT, then runs
# the same deploy. Flags are never hand-specified, so they can't drift from code.
#
# Env: HOOK_DEPLOYER_PRIVATE_KEY (broadcast only), HOOKBUILD_DIR, POOL_MANAGER, RPC_URL,
#      ALCHEMY_API_KEY?, ETHERSCAN_API_KEY? (auto-verify), HOOK_MAINNET_OK?, MAX_GAS_GWEI?
set -euo pipefail

MODE="${1:?usage: hook-deploy.sh <simulate|broadcast|chains> <kind> [chain]}"
KIND="${2:-dynamic}"
CHAIN="${3:-base-sepolia}"
DIR="${HOOKBUILD_DIR:-$HOME/hookbuild}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Locate the chain registry (single source of truth). Staged next to this script
# (repo root) and inside $HOOKBUILD_DIR; also found when run from the repo.
CHAINS="${CHAINS_FILE:-}"
for cand in "$CHAINS" "$SCRIPT_DIR/chains.tsv" "$DIR/chains.tsv" \
            "$SCRIPT_DIR/templates/chains.tsv"; do
  [ -n "$cand" ] && [ -f "$cand" ] && { CHAINS="$cand"; break; }
done
[ -f "$CHAINS" ] || { echo "chains.tsv not found (looked near $SCRIPT_DIR and $DIR)" >&2; exit 3; }

list_chains() { awk -F'\t' '!/^#/ && NF>=3 {printf "  %-18s %s\n", $1, ($3=="true"?"testnet":"mainnet")}' "$CHAINS"; }
if [ "$MODE" = "chains" ]; then echo "known Uniswap v4 chains:"; list_chains; exit 0; fi

# friendly / legacy aliases -> canonical registry names
case "$CHAIN" in
  base-mainnet) CHAIN=base ;;
  eth|mainnet)  CHAIN=ethereum ;;
  op)           CHAIN=optimism ;;
  arb)          CHAIN=arbitrum ;;
  avax)         CHAIN=avalanche ;;
  bsc)          CHAIN=bnb ;;
  matic|poly)   CHAIN=polygon ;;
esac

row="$(awk -F'\t' -v c="$CHAIN" '!/^#/ && $1==c {print; exit}' "$CHAINS")"
if [ -z "$row" ]; then
  { echo "unknown chain: $CHAIN. known chains:"; list_chains; } >&2
  exit 4
fi
IFS=$'\t' read -r _CN CHAIN_ID TESTNET PM SV RPC EXPLORER ALCHEMY <<<"$row"
POOL_MANAGER="${POOL_MANAGER:-$PM}"
STATE_VIEW="${STATE_VIEW:-$SV}"

# --- RPC resolution: authenticated endpoint beats the public one -----------------
resolve_rpc() {
  # precedence: explicit RPC_URL (testing/escape hatch) > Alchemy key+slug > public rpc
  [ -n "${RPC_URL:-}" ] && { echo "$RPC_URL"; return; }
  if [ -n "${ALCHEMY_API_KEY:-}" ] && [ -n "${ALCHEMY:-}" ]; then
    echo "https://${ALCHEMY}.g.alchemy.com/v2/${ALCHEMY_API_KEY}"; return
  fi
  echo "$RPC"  # public fallback
}
RPC_URL="$(resolve_rpc)"
# host-only label for logs — never print the path (Alchemy/Infura keys live there)
RPC_LABEL="$(printf '%s' "$RPC_URL" | sed -E 's#(https?://[^/]+).*#\1#')"

# defense-in-depth: the skill also double-gates mainnet, but make it loud here too.
if [ "$MODE" = "broadcast" ] && [ "$TESTNET" != "true" ]; then
  echo "!! MAINNET broadcast: chain=$CHAIN (chainId=$CHAIN_ID) — real gas. Explorer: $EXPLORER" >&2
fi

[ -d "$DIR" ] || { echo "staged project not found at $DIR — was stage-deploy-uni-hook.sh run?" >&2; exit 3; }
cd "$DIR"

# --- freeform: derive flags from the generated Hook.sol + audit ------------------
derive_flags() {
  local src="src/Hook.sol" f=0
  grep -qE 'function[[:space:]]+beforeInitialize[[:space:]]*\('    "$src" && f=$((f | (1<<13)))
  grep -qE 'function[[:space:]]+afterInitialize[[:space:]]*\('     "$src" && f=$((f | (1<<12)))
  grep -qE 'function[[:space:]]+beforeAddLiquidity[[:space:]]*\('  "$src" && f=$((f | (1<<11)))
  grep -qE 'function[[:space:]]+afterAddLiquidity[[:space:]]*\('   "$src" && f=$((f | (1<<10)))
  grep -qE 'function[[:space:]]+beforeRemoveLiquidity[[:space:]]*\(' "$src" && f=$((f | (1<<9)))
  grep -qE 'function[[:space:]]+afterRemoveLiquidity[[:space:]]*\('  "$src" && f=$((f | (1<<8)))
  grep -qE 'function[[:space:]]+beforeSwap[[:space:]]*\('  "$src" && f=$((f | (1<<7)))
  grep -qE 'function[[:space:]]+afterSwap[[:space:]]*\('   "$src" && f=$((f | (1<<6)))
  grep -qE 'function[[:space:]]+beforeDonate[[:space:]]*\(' "$src" && f=$((f | (1<<5)))
  grep -qE 'function[[:space:]]+afterDonate[[:space:]]*\('  "$src" && f=$((f | (1<<4)))
  case ",${HOOK_RETURNS_DELTA:-}," in *,beforeSwap,*)           f=$((f | (1<<3)));; esac
  case ",${HOOK_RETURNS_DELTA:-}," in *,afterSwap,*)            f=$((f | (1<<2)));; esac
  case ",${HOOK_RETURNS_DELTA:-}," in *,afterAddLiquidity,*)    f=$((f | (1<<1)));; esac
  case ",${HOOK_RETURNS_DELTA:-}," in *,afterRemoveLiquidity,*) f=$((f | (1<<0)));; esac
  printf '0x%x' "$f"
}

# human-readable flag names from a numeric flag value (the address' low 14 bits)
decode_flags() {
  local v=$1 out=""
  (( v & (1<<13) )) && out="$out beforeInitialize"
  (( v & (1<<12) )) && out="$out afterInitialize"
  (( v & (1<<11) )) && out="$out beforeAddLiquidity"
  (( v & (1<<10) )) && out="$out afterAddLiquidity"
  (( v & (1<<9)  )) && out="$out beforeRemoveLiquidity"
  (( v & (1<<8)  )) && out="$out afterRemoveLiquidity"
  (( v & (1<<7)  )) && out="$out beforeSwap"
  (( v & (1<<6)  )) && out="$out afterSwap"
  (( v & (1<<5)  )) && out="$out beforeDonate"
  (( v & (1<<4)  )) && out="$out afterDonate"
  (( v & (1<<3)  )) && out="$out beforeSwapReturnsDelta"
  (( v & (1<<2)  )) && out="$out afterSwapReturnsDelta"
  (( v & (1<<1)  )) && out="$out afterAddLiquidityReturnsDelta"
  (( v & (1<<0)  )) && out="$out afterRemoveLiquidityReturnsDelta"
  echo "${out# }"
}

# static scan for patterns a v4 hook almost never needs and that can steal/brick.
# selfdestruct / delegatecall are hard fails; the rest print a warning to review.
scan_dangerous() {
  local src="$1" bad=0
  grep -qE '\bselfdestruct\b'  "$src" && { echo "  FAIL: selfdestruct present (can brick the hook)"; bad=1; }
  grep -qE '\bdelegatecall\b'  "$src" && { echo "  FAIL: delegatecall present (code-injection risk)"; bad=1; }
  grep -qE '\btx\.origin\b'    "$src" && echo "  WARN: tx.origin used (auth smell — review)"
  grep -qE '\.call\{[[:space:]]*value' "$src" && echo "  WARN: raw value-bearing call (review)"
  grep -qE '\bassembly\b'      "$src" && echo "  WARN: inline assembly (review)"
  return $bad
}

audit_freeform() {
  local src="src/Hook.sol" fail=0
  echo "── audit: freeform Hook.sol ──"
  grep -qE 'contract[[:space:]]+Hook[[:space:]]' "$src" || { echo "  FAIL: contract must be named Hook"; fail=1; }
  # count implemented callbacks
  local cb
  cb=$(grep -cE 'function[[:space:]]+(before|after)(Initialize|AddLiquidity|RemoveLiquidity|Swap|Donate)[[:space:]]*\(' "$src" || true)
  echo "  callbacks implemented: $cb"
  [ "$cb" -ge 1 ] || { echo "  FAIL: no hook callbacks found"; fail=1; }
  # every callback must be guarded by onlyPoolManager. Count real guard sites: strip
  # // comments (whole-line + trailing), drop the modifier DEFINITION line, then count
  # the remaining `onlyPoolManager` tokens (one per guarded function). Robust to
  # multi-line function signatures (external and onlyPoolManager on separate lines).
  local guards
  guards=$(sed -E 's://.*$::' "$src" \
    | grep -vE 'modifier[[:space:]]+onlyPoolManager' \
    | grep -oE '\bonlyPoolManager\b' | wc -l | tr -d ' ')
  echo "  onlyPoolManager guards: $guards"
  [ "$guards" -ge "$cb" ] || { echo "  FAIL: a callback is missing onlyPoolManager"; fail=1; }
  scan_dangerous "$src" || fail=1
  # a behavioral test must exist and actually assert something (>=1 test_ function)
  local tests
  tests=$(grep -cE 'function[[:space:]]+test' test/Hook.t.sol 2>/dev/null || true)
  echo "  behavioral test_ functions: $tests"
  [ "$tests" -ge 1 ] || { echo "  FAIL: test/Hook.t.sol has no test_ functions"; fail=1; }
  echo "  derived flags: $(derive_flags)"
  [ "$fail" -eq 0 ] && echo "  AUDIT PASS" || { echo "  AUDIT FAIL"; return 1; }
}

if [ "$KIND" = "freeform" ]; then
  [ -f hook.env ] && . ./hook.env
  audit_freeform || { echo "freeform audit failed — refusing to $MODE" >&2; exit 5; }
  export HOOK_FLAGS="$(derive_flags)"
  export HOOK_POOL_FEE="${HOOK_POOL_FEE:-3000}"
  # behavioral-test gate: the agent's test/Hook.t.sol must pass on a fork of the
  # target chain before we simulate or broadcast. Proves the hook does what the
  # prompt asked. A failing OR non-compiling test blocks the deploy (exit 6).
  echo "── behavioral test: forge test (fork $CHAIN) ──"
  POOL_MANAGER="$POOL_MANAGER" HOOK_FLAGS="$HOOK_FLAGS" HOOK_POOL_FEE="$HOOK_POOL_FEE" \
    forge test --fork-url "$RPC_URL" --match-contract HookBehaviorTest -vv \
    || { echo "freeform behavioral test failed — refusing to $MODE" >&2; exit 6; }
fi

# a burner key is still needed for simulation (sets msg.sender); fall back to a
# throwaway anvil key when none is set, so simulate never needs a secret.
KEY="${HOOK_DEPLOYER_PRIVATE_KEY:-0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80}"

# --- broadcast preflight: mainnet lock + funding/gas guards ----------------------
if [ "$MODE" = "broadcast" ]; then
  : "${HOOK_DEPLOYER_PRIVATE_KEY:?set HOOK_DEPLOYER_PRIVATE_KEY to broadcast}"

  # third mainnet lock (beyond the skill's arm: + explicit chain:). An instance
  # must opt into mainnet by setting HOOK_MAINNET_OK=1 — a stray armed message
  # can't reach mainnet on an instance that never authorized it.
  if [ "$TESTNET" != "true" ] && [ "${HOOK_MAINNET_OK:-}" != "1" ]; then
    echo "mainnet broadcast blocked: set HOOK_MAINNET_OK=1 to authorize mainnet on this instance" >&2
    exit 7
  fi

  if command -v cast >/dev/null 2>&1; then
    DEPLOYER="$(cast wallet address --private-key "$KEY" 2>/dev/null || true)"
    BAL="$(cast balance "${DEPLOYER:-0x0000000000000000000000000000000000000000}" --rpc-url "$RPC_URL" --ether 2>/dev/null || echo 0)"
    echo "deployer $DEPLOYER  balance ${BAL} (native, $CHAIN)"
    # funding floor — never broadcast from an empty deployer
    awk -v b="$BAL" 'BEGIN{exit !(b+0>0)}' || {
      echo "deployer unfunded on $CHAIN — fund $DEPLOYER before arming" >&2; exit 8; }
    # optional gas-price ceiling — refuse to deploy into a fee spike
    if [ -n "${MAX_GAS_GWEI:-}" ]; then
      GP="$(cast gas-price --rpc-url "$RPC_URL" 2>/dev/null || echo 0)"
      if awk -v g="$GP" -v c="$MAX_GAS_GWEI" 'BEGIN{exit !(g/1e9 > c+0)}'; then
        echo "gas price $(awk -v g="$GP" 'BEGIN{printf "%.2f", g/1e9}') gwei > cap ${MAX_GAS_GWEI} gwei — refusing to broadcast" >&2
        exit 9
      fi
    fi
    # float ceiling — the deployer must hold GAS ONLY, never LP/treasury capital
    if [ "$TESTNET" != "true" ]; then
      CEIL="${HOOK_MAX_FLOAT_ETH:-0.25}"
      awk -v b="$BAL" -v c="$CEIL" 'BEGIN{exit !(b+0>c+0)}' \
        && echo "!! WARN deployer holds ${BAL} > float ceiling ${CEIL} — a deploy key must hold gas only, not capital" >&2
    fi
  fi
fi

ARGS=(script script/DeployHook.s.sol:DeployHook --rpc-url "$RPC_URL" --private-key "$KEY")
[ "$MODE" = "broadcast" ] && ARGS+=(--broadcast --slow)

echo "hook-deploy: $MODE kind=$KIND chain=$CHAIN chainId=$CHAIN_ID rpc=$RPC_LABEL poolManager=$POOL_MANAGER stateView=$STATE_VIEW${HOOK_FLAGS:+ flags=$HOOK_FLAGS}"

# run forge, capturing output so we can print a receipt + auto-verify afterwards
LOG="$(mktemp)"
set +e
POOL_MANAGER="$POOL_MANAGER" HOOK_KIND="$KIND" forge "${ARGS[@]}" 2>&1 | tee "$LOG"
rc=${PIPESTATUS[0]}
set -e
[ "$rc" -ne 0 ] && { rm -f "$LOG"; exit "$rc"; }

# idempotency: the deploy script logs ALREADY_DEPLOYED <addr> and does nothing when
# the mined hook address already holds code. Surface it cleanly (not an error).
if grep -q "ALREADY_DEPLOYED" "$LOG"; then
  ADDR="$(grep -oE '0x[a-fA-F0-9]{40}' <(grep ALREADY_DEPLOYED "$LOG") | head -1)"
  echo "── already deployed ──"
  echo "  this exact hook (same code+flags+PoolManager) is already live at $ADDR"
  echo "  explorer  $EXPLORER/address/$ADDR"
  rm -f "$LOG"; exit 0
fi

# --- receipt (both modes): mined hook address + decoded flags + explorer link -----
HOOK_ADDR="$(grep -oE '0x[a-fA-F0-9]{40}' <(grep -E '^[[:space:]]*hook[[:space:]]' "$LOG") | head -1)"
if [ -n "$HOOK_ADDR" ]; then
  FLAGBITS=$(( 0x${HOOK_ADDR: -4} & 0x3fff ))
  echo "──────── deploy receipt ($MODE) ────────"
  echo "  chain     $CHAIN ($CHAIN_ID)"
  echo "  hook      $HOOK_ADDR"
  printf '  flags     0x%x  %s\n' "$FLAGBITS" "$(decode_flags "$FLAGBITS")"
  echo "  explorer  $EXPLORER/address/$HOOK_ADDR"
  if [ "$MODE" = "broadcast" ]; then
    RUNJSON="broadcast/DeployHook.s.sol/$CHAIN_ID/run-latest.json"
    if command -v jq >/dev/null 2>&1 && [ -f "$RUNJSON" ]; then
      echo "  txs:"
      jq -r '.transactions[]? | "    " + (.hash // .transactionHash // "?") + "  " + (.contractName // .transactionType // "")' "$RUNJSON" 2>/dev/null | head -12 || true
    fi
  fi
fi

# --- auto-verify on the block explorer (best-effort; never fails a done deploy) ---
# The hook is deployed through the CREATE2 factory (0x4e59…), so IMMEDIATELY after a
# broadcast Etherscan hasn't indexed the factory's internal creation tx yet and the
# first submit fails with "Compiled contract deployment bytecode does NOT match the
# transaction deployment bytecode". This is a TIMING issue, not a real mismatch:
# once indexing catches up (usually a minute or two) the same submit passes. So we
# RE-SUBMIT with backoff (proven live on 0xAF6f… base mainnet) — `--watch` alone only
# polls the queue for a submission that already failed, it never re-submits.
if [ "$MODE" = "broadcast" ] && [ -n "$HOOK_ADDR" ] && [ -n "${ETHERSCAN_API_KEY:-}" ]; then
  case "$KIND" in
    dynamic) CNAME="src/DynamicFeeHook.sol:DynamicFeeHook" ;;
    noop)    CNAME="src/NoOpHook.sol:NoOpHook" ;;
    skim)    CNAME="src/HookFeeHook.sol:HookFeeHook" ;;
    *)       CNAME="src/Hook.sol:Hook" ;;
  esac
  echo "── verify: $CNAME on chain $CHAIN_ID (best-effort, retries for CREATE2 indexing) ──"
  CARGS="$(cast abi-encode 'constructor(address)' "$POOL_MANAGER" 2>/dev/null || true)"
  VTRIES="${HOOK_VERIFY_RETRIES:-6}"; VBACKOFF="${HOOK_VERIFY_BACKOFF:-30}"; vok=0
  for ((vi=1; vi<=VTRIES; vi++)); do
    vout="$(forge verify-contract "$HOOK_ADDR" "$CNAME" \
              --chain-id "$CHAIN_ID" --etherscan-api-key "$ETHERSCAN_API_KEY" \
              --constructor-args "$CARGS" --watch 2>&1)"
    if printf '%s' "$vout" | grep -qiE 'Pass - Verified|successfully verified|already verified'; then
      echo "  verify: OK on attempt $vi ($EXPLORER/address/$HOOK_ADDR#code)"; vok=1; break
    fi
    echo "  verify: attempt $vi/$VTRIES not confirmed (explorer still indexing the CREATE2 tx)"
    [ "$vi" -lt "$VTRIES" ] && sleep "$VBACKOFF"
  done
  [ "$vok" -eq 1 ] || echo "  WARN verify not confirmed after $VTRIES attempts — deploy is unaffected; source in output/hooks/, re-run 'forge verify-contract' later (or explorer is non-Etherscan)" >&2
fi

rm -f "$LOG"
exit 0
