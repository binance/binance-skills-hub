#!/usr/bin/env bash
# balance-guard.sh — optional Stop-hook script for the linkex-agents-pay skill.
#
# What it does: after a conversation turn ends, check the Linkex API key's
# remaining quota and print a one-line warning when it falls below
# LINKEX_LOW_BALANCE_USD (default 5 USD). The agent can then offer the x402
# top-up flow. It never blocks, never spends, and never writes anything
# except a small debounce timestamp under the user's cache directory.
#
# Install (only with the user's explicit consent — see SKILL.md):
#   Claude Code: register as a "Stop" hook in ~/.claude/settings.json:
#     { "hooks": { "Stop": [ { "matcher": "", "hooks": [ { "type": "command",
#       "command": "bash <skill-path>/scripts/balance-guard.sh" } ] } ] } }
#
# Dependencies: bash, curl, python3 (all standard on macOS/Linux).
# Environment: LINKEX_API_KEY (required), LINKEX_BASE_URL (optional),
#              LINKEX_LOW_BALANCE_USD (optional, default 5).
set -u

KEY="${LINKEX_API_KEY:-}"
[ -z "$KEY" ] && exit 0
BASE="${LINKEX_BASE_URL:-https://linkex.ai}"
THRESHOLD="${LINKEX_LOW_BALANCE_USD:-5}"

# Debounce: at most one API check per 10 minutes.
CACHE_DIR="${XDG_CACHE_HOME:-$HOME/.cache}/linkex"
mkdir -p "$CACHE_DIR" 2>/dev/null || exit 0
CACHE="$CACHE_DIR/balance-guard.ts"
now=$(date +%s)
if [ -f "$CACHE" ]; then
  last=$(cat "$CACHE" 2>/dev/null || echo 0)
  [ $((now - last)) -lt 600 ] && exit 0
fi
echo "$now" > "$CACHE"

# Key-level quota via the OpenAI-compatible billing endpoints
# (see references/api.md: usage is in cents; 1e8 limit = unlimited key).
sub=$(curl -sf -m 8 "$BASE/v1/dashboard/billing/subscription" -H "Authorization: Bearer $KEY" 2>/dev/null) || exit 0
usage=$(curl -sf -m 8 "$BASE/v1/dashboard/billing/usage" -H "Authorization: Bearer $KEY" 2>/dev/null) || exit 0

remaining=$(python3 - "$sub" "$usage" <<'PY' 2>/dev/null
import sys, json
try:
    sub, usage = json.loads(sys.argv[1]), json.loads(sys.argv[2])
    limit = float(sub["hard_limit_usd"])
    if limit >= 1e8:
        print(""); sys.exit(0)
    print(round(limit - float(usage["total_usage"]) / 100, 2))
except Exception:
    print("")
PY
) || exit 0
[ -z "$remaining" ] && exit 0

is_low=$(python3 -c "print(1 if $remaining < $THRESHOLD else 0)" 2>/dev/null) || exit 0
if [ "$is_low" = "1" ]; then
  # Claude Code hook protocol: plain stdout from a Stop hook is not shown in
  # the chat UI; a JSON object with "systemMessage" is rendered to the user.
  # Other harnesses can still read the message field as plain text.
  printf '{"systemMessage":"Low Linkex balance: this API key has $%s left (threshold $%s). Ask me to top up via x402."}\n' "$remaining" "$THRESHOLD"
fi
exit 0
