#!/usr/bin/env bash
# status.sh — one call that gathers everything the agent needs before any
# Linkex action: the API key's remaining quota, the x402 top-up config, the
# wallet connection state, and the wallet's token balances.
#
# Usage:   scripts/status.sh
# Output:  one compact JSON object (see README.md for the shape).
#
# Read-only: performs GET requests and `baw` queries only; never creates
# orders, never signs, never spends.
#
# Env:  LINKEX_API_KEY (required), LINKEX_BASE_URL (optional,
#       default https://linkex.ai), LINKEX_LOW_BALANCE_USD (optional,
#       default 5 — only echoed into the output for the agent to use).
# Deps: bash, curl, python3. `baw` (Binance Agentic Wallet CLI) is optional:
#       wallet fields are null when it is not installed or not signed in.
set -u

KEY="${LINKEX_API_KEY:-}"
[ -z "$KEY" ] && { echo '{"ok":false,"error":"LINKEX_API_KEY not set"}'; exit 1; }
BASE="${LINKEX_BASE_URL:-https://linkex.ai}"
THRESHOLD="${LINKEX_LOW_BALANCE_USD:-5}"

# --- Linkex side (key quota + x402 config), all read-only GETs ---
SUB=$(curl -sf -m 10 "$BASE/v1/dashboard/billing/subscription" -H "Authorization: Bearer $KEY" 2>/dev/null || echo '')
USAGE=$(curl -sf -m 10 "$BASE/v1/dashboard/billing/usage" -H "Authorization: Bearer $KEY" 2>/dev/null || echo '')
ACCOUNT=$(curl -sf -m 10 "$BASE/api/user/self/balance" -H "Authorization: Bearer $KEY" 2>/dev/null || echo '')
CONFIG=$(curl -sf -m 10 "$BASE/api/user/topup/x402/config" -H "Authorization: Bearer $KEY" 2>/dev/null || echo '')

# --- Wallet side (optional) ---
WALLET_STATUS=''
WALLET_BALANCE=''
if command -v baw >/dev/null 2>&1; then
  WALLET_STATUS=$(baw wallet status --json 2>/dev/null || echo '')
  WALLET_BALANCE=$(baw wallet balance --json 2>/dev/null || echo '')
fi

SUB_J="$SUB" USAGE_J="$USAGE" ACCOUNT_J="$ACCOUNT" CONFIG_J="$CONFIG" \
WS_J="$WALLET_STATUS" WB_J="$WALLET_BALANCE" THRESHOLD_V="$THRESHOLD" \
python3 - <<'PY'
import os, json

def load(name):
    raw = os.environ.get(name, '')
    if not raw:
        return None
    try:
        return json.loads(raw)
    except Exception:
        return None

sub, usage = load('SUB_J'), load('USAGE_J')
account, config = load('ACCOUNT_J'), load('CONFIG_J')
ws, wb = load('WS_J'), load('WB_J')

out = {'ok': True}

# Key-level remaining quota (see references/api.md): usage is in cents;
# hard_limit_usd >= 1e8 is the "unlimited key" sentinel -> account balance.
key = {'remaining_usd': None, 'limit_usd': None, 'unlimited': False}
if sub and usage and 'hard_limit_usd' in sub and 'total_usage' in usage:
    limit = float(sub['hard_limit_usd'])
    if limit >= 1e8:
        key['unlimited'] = True
        if account and account.get('success'):
            key['remaining_usd'] = round(account['data'].get('quota_usd', 0), 2)
    else:
        key['limit_usd'] = round(limit, 2)
        key['remaining_usd'] = round(limit - float(usage['total_usage']) / 100, 2)
out['key'] = key

thr = float(os.environ.get('THRESHOLD_V', '5'))
out['low_balance'] = (key['remaining_usd'] is not None
                      and key['remaining_usd'] < thr)
out['low_balance_threshold_usd'] = thr

# x402 top-up availability
topup = {'enabled': False, 'networks': []}
if config and config.get('success'):
    d = config['data']
    topup = {
        'enabled': d.get('enabled', False),
        'min_usd': d.get('min_topup_usd'),
        'max_usd': d.get('max_topup_usd'),
        'networks': [
            {'network': n.get('network'), 'symbols': n.get('symbols', [])}
            for n in d.get('networks', [])
        ],
    }
out['topup'] = topup

# Wallet (null when baw is missing or signed out)
wallet = {'connected': False, 'balances': None}
if ws and ws.get('success'):
    wallet['connected'] = ws.get('data', {}).get('status') == 'CONNECTED'
if wallet['connected'] and wb and wb.get('success'):
    wallet['balances'] = [
        {'symbol': b.get('symbol'), 'chain': b.get('binanceChainId'),
         'balance': b.get('balance'), 'value_usd': b.get('value')}
        for b in (wb.get('data') or [])
    ]
out['wallet'] = wallet

print(json.dumps(out, ensure_ascii=False))
PY
