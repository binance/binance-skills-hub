#!/usr/bin/env bash
# x402-topup.sh — consolidate the top-up flow into two calls so the agent
# spends 2 turns instead of ~10 (each agent turn costs the user real tokens).
#
#   prepare <amount_usd> [network] [symbol]
#       create order -> extract challenge -> baw preview
#       prints compact JSON: order id + signable options.
#   execute <order_id> <payment_id> <selected_index>
#       baw sign -> submit to Linkex -> poll settle result.
#       Run ONLY after the user has explicitly confirmed the payment.
#
# Env: LINKEX_API_KEY (required), LINKEX_BASE_URL (optional).
# Deps: bash, curl, python3, baw (Binance Agentic Wallet CLI) on PATH.
set -u

KEY="${LINKEX_API_KEY:-}"
[ -z "$KEY" ] && { echo '{"ok":false,"error":"LINKEX_API_KEY not set"}'; exit 1; }
BASE="${LINKEX_BASE_URL:-https://linkex.ai}"
CMD="${1:-}"

api() { curl -sf -m 20 "$@"; }

case "$CMD" in
  prepare)
    AMOUNT="${2:?usage: prepare <amount_usd> [network] [symbol]}"
    NETWORK="${3:-}"; SYMBOL="${4:-}"
    ORDER=$(api -X POST "$BASE/api/user/topup/x402/orders" \
      -H "Authorization: Bearer $KEY" -H "Content-Type: application/json" \
      -d "{\"amount_usd\":$AMOUNT,\"network\":\"$NETWORK\",\"symbol\":\"$SYMBOL\"}") \
      || { echo '{"ok":false,"error":"order creation failed"}'; exit 1; }
    CHALLENGE=$(printf '%s' "$ORDER" | python3 -c "
import sys, json
d = json.load(sys.stdin)
if not d.get('success'): print(''); sys.exit(0)
print(json.dumps(d['data']['challenge']))")
    [ -z "$CHALLENGE" ] && { printf '%s' "$ORDER" | python3 -c "
import sys, json
d = json.load(sys.stdin)
print(json.dumps({'ok': False, 'error': d.get('message','order failed')}))"; exit 1; }
    PREVIEW=$(baw x402-payment preview --paymentRequirements "$CHALLENGE" --json 2>/dev/null) \
      || { echo '{"ok":false,"error":"baw preview failed (wallet signed in?)"}'; exit 1; }
    ORDER_JSON="$ORDER" PREVIEW_JSON="$PREVIEW" python3 - <<'PY'
import os, json
order = json.loads(os.environ['ORDER_JSON'])['data']
prev = json.loads(os.environ['PREVIEW_JSON'])
if not prev.get('success'):
    print(json.dumps({'ok': False, 'error': 'preview failed', 'detail': prev})); raise SystemExit
data = prev['data']
opts = [{
    'index': o['index'], 'status': o['status'], 'reasons': o.get('reasons', []),
    'token': o.get('tokenSymbol'), 'chain': o.get('binanceChainId'),
    'amount': o.get('amount'), 'amountUsd': o.get('amountUsd'),
    'balance': o.get('currentBalance'), 'needApproveFirst': o.get('needApproveFirst'),
} for o in data['options']]
print(json.dumps({'ok': True, 'order_id': order['order_id'],
                  'expires_at': order['expires_at'],
                  'payment_id': data['paymentId'], 'options': opts}, ensure_ascii=False))
PY
    ;;

  execute)
    ORDER_ID="${2:?usage: execute <order_id> <payment_id> <index>}"
    PAYMENT_ID="${3:?payment_id required}"; INDEX="${4:?index required}"
    SIGN=$(baw x402-payment sign --paymentId "$PAYMENT_ID" --selectedIndex "$INDEX" --json 2>/dev/null) \
      || { echo '{"ok":false,"error":"baw sign failed"}'; exit 1; }
    PAYLOAD=$(printf '%s' "$SIGN" | python3 -c "
import sys, json, base64
d = json.load(sys.stdin)
if not d.get('success'): print(''); sys.exit(0)
print(base64.b64decode(d['data']['paymentHeaderValue']).decode())")
    [ -z "$PAYLOAD" ] && { echo '{"ok":false,"error":"sign returned no payload"}'; exit 1; }
    APPROVE=$(printf '%s' "$SIGN" | python3 -c "
import sys, json
print(json.load(sys.stdin)['data'].get('approveTxHash') or '')")
    # First-use Permit2 approve is dispatched alongside sign; give it a moment.
    [ -n "$APPROVE" ] && sleep 8
    # Submit; on the transient X402_SETTLE_PENDING, poll a few times.
    for i in 1 2 3 4 5 6; do
      RESULT=$(curl -s -m 30 -X POST "$BASE/api/x402/pay/$ORDER_ID" \
        -H "Content-Type: application/json" -d "$PAYLOAD")
      CODE=$(printf '%s' "$RESULT" | python3 -c "
import sys, json
try: d = json.load(sys.stdin)
except Exception: print('PARSE_ERROR'); sys.exit(0)
print('OK' if d.get('success') else d.get('message','UNKNOWN'))")
      case "$CODE" in
        OK) printf '%s' "$RESULT" | python3 -c "
import sys, json
d = json.load(sys.stdin)['data']
print(json.dumps({'ok': True, **d}, ensure_ascii=False))"; exit 0 ;;
        X402_SETTLE_PENDING) sleep 10 ;;  # transient; retry
        ORDER_NOT_PENDING)   # someone (or the reaper) already settled it
          printf '{"ok":true,"note":"order already settled or in progress","order_id":%s}\n' "$ORDER_ID"; exit 0 ;;
        *) printf '%s' "$RESULT" | python3 -c "
import sys, json
d = json.load(sys.stdin)
print(json.dumps({'ok': False, 'error': d.get('message','submit failed')}))"; exit 1 ;;
      esac
    done
    echo '{"ok":false,"error":"X402_SETTLE_PENDING after retries; funds are safe — the settle reaper reconciles on-chain state, check the order later"}'
    exit 1
    ;;

  *)
    echo 'usage: x402-topup.sh prepare <amount_usd> [network] [symbol] | execute <order_id> <payment_id> <index>'
    exit 1
    ;;
esac
