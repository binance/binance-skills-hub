# Multi-account operation

One CLI install can drive several Agentic Wallets at the same time — different Binance accounts, different addresses, different quotas. The trick is that `baw` keeps its session per `HOME`, so each wallet gets its own `HOME` directory instead of sharing `~/.baw`.

Use this when the user says things like "I have five wallets", "run this on account 2", "switch to the other wallet", or when a task has to be repeated per wallet (batch mint, batch send, quota checks across accounts).

---

## How the state is isolated

`baw` writes its session to `$HOME/.baw/` (for example `$HOME/.baw/session.json`). Pointing `HOME` at a different directory gives you a completely separate wallet: separate pairing, separate session, separate settings, no cross-talk.

```bash
mkdir -p ~/baw/w1 ~/baw/w2

HOME=~/baw/w1 baw auth signin --json   # account A
HOME=~/baw/w2 baw auth signin --json   # account B
```

`HOME` must be set on **every** invocation for that slot — there is no `--profile` flag. Every command in the references works unchanged, it just needs the prefix:

```bash
HOME=~/baw/w1 baw wallet status --json
HOME=~/baw/w1 baw market-order swap --fromToken BNB --toToken USDT --amount 0.01 --json
```

Keep the wallets on one host, not copied between hosts: a session is bound to the machine that created it, so copying `~/.baw` to another box produces a slot that reports `CONNECTED` but cannot sign.

---

## A slot wrapper

Typing `HOME=... baw` on every call is error-prone once there are more than two wallets. Wrap it once:

```bash
# ~/baw/walletctl — chmod +x, then use: walletctl w1 status --json
#!/usr/bin/env bash
set -euo pipefail
slot="$1"; shift
dir="$HOME/baw/$slot"
[ -d "$dir" ] || { echo "{\"success\":false,\"error\":\"no such slot: $slot\"}"; exit 2; }
HOME="$dir" exec baw "$@"
```

Then `walletctl w1 wallet status --json` is unambiguous, and the slot name is the only thing that can be wrong.

---

## Pairing several accounts in one sitting

Pairing is the slow part: each `auth signin` produces its own `urlForWeb`, `pairingCode` and `qrCodeId`, all valid for about five minutes, and each has to be confirmed in the Binance App **while that specific account is active in the App**.

The failure that wastes the most time here is mixing up which code belongs to which slot. Two habits prevent it:

1. Generate and label one code per slot before showing anything to the user:

   ```bash
   for s in w1 w2 w3; do
     echo "== $s"
     HOME=~/baw/$s baw auth signin --json
     echo
   done
   ```

2. Finish one account at a time: show the link, have the user confirm in the App, run `HOME=~/baw/wN baw auth verify --qrCodeId <thatId> --json`, confirm `wallet status` flips to `CONNECTED`, then move to the next account. Do not batch all the links to the user at once and verify afterwards — by the time the third one is confirmed the first is usually expired, and an expired code cannot be revived.

`auth verify` is the step that actually lands the session locally. A slot that the user "already confirmed in the App" will still report `UNCONNECTED` until `auth verify` has completed for that `qrCodeId` — see [authentication.md](authentication.md#sign-in-troubleshooting).

---

## Reading a slot's identity and health

Three calls cover almost everything a batch job needs:

```bash
HOME=~/baw/w1 baw wallet status --json     # {"data":{"status":"CONNECTED"}}
HOME=~/baw/w1 baw wallet address --json    # every chain address for this wallet
HOME=~/baw/w1 baw wallet settings --json   # devMode, session expiry, daily limits
```

`wallet status` says nothing about *which* account is behind the slot, so record the address when you create the slot and compare it on every run. A silently swapped session is otherwise invisible until a transaction goes out from the wrong wallet.

A batch sweep that prints one line per slot:

```bash
#!/usr/bin/env bash
for dir in "$HOME"/baw/w*; do
  slot="$(basename "$dir")"
  status=$(HOME="$dir" baw wallet status --json 2>/dev/null | python3 -c 'import sys,json;print(json.load(sys.stdin)["data"].get("status","?"))' 2>/dev/null || echo "ERR")
  addr=$(HOME="$dir" baw wallet address --json 2>/dev/null | python3 -c 'import sys,json;d=json.load(sys.stdin)["data"]["addresses"];print(next((a["address"] for a in d if a["binanceChainId"]=="56"),"-"))' 2>/dev/null || echo "-")
  dev=$(HOME="$dir" baw wallet settings --json 2>/dev/null | python3 -c 'import sys,json;print(json.load(sys.stdin)["data"]["devMode"]["enabled"])' 2>/dev/null || echo "?")
  printf '%-4s %-13s %-44s devMode=%s\n' "$slot" "$status" "$addr" "$dev"
done
```

Space the calls out when looping over many slots — a tight loop across ten sessions can hit rate limits and return errors that look like "wallet broken" when it is only throttling.

---

## Per-account settings that break batches

- **Developer mode is per account.** `devMode.enabled` gates `contract-call` and `sign-message`, and it is a property of the Binance account, not of the CLI install. A slot that was fine last week can come back with developer mode off (it expires, and it resets when the App account changes). Check it per slot before a batch that signs or calls contracts: [wallet-setting.md](wallet-setting.md).
- **Sessions expire on their own.** `wallet settings --json` returns `sessionExpireTime`, `signInMaxTime` and `inactiveSignOutTime` (48 hours by default on both counts). A slot left unused overnight can drop out. For a multi-hour job, re-check status before each phase instead of trusting the check from the start.
- **Daily limits and quotas are per account.** `dailyLimit`, `quotaLeft`, `defiQuotaLeft` and the prediction quota all live on the account, so an aggregate "how much can I move today" answer has to be summed across slots.
- **Gas is per address.** A slot with zero native balance fails at `execute` with a simulation error, not at `preview`. Check native balance across slots before a batch rather than discovering it one wallet at a time.

---

## Pre-batch checklist

For each slot that will be used:

| Check | Command | Expected |
|---|---|---|
| Session alive | `wallet status --json` | `CONNECTED` |
| Right account | `wallet address --json` | matches the address recorded for this slot |
| Developer mode (only if signing / calling) | `wallet settings --json` | `devMode.enabled = true`, `expiresAt` in the future |
| Quota | `wallet settings --json` | `quotaLeft` enough for the batch |
| Gas | `wallet balance --json` ([wallet-view.md](wallet-view.md)) | native balance covers the batch |

Report the failing slot *before* starting, then either re-pair it (fresh `auth signin`) or skip it. Do not start a batch hoping a disconnected slot will come back mid-run.

---

## Answering "which wallet is this?"

When the user refers to a wallet by nickname rather than address, keep a slot→label mapping next to the slots and show the address on every confirmation:

```text
w1  0xAbC…123  (nickname: main)   CONNECTED  devMode=on
w2  0xDeF…456  (nickname: farm)   UNCONNECTED
```

Signing prompts, transfers and trades should always name the slot, the nickname and the full address, so the user can see which wallet is about to act before confirming. The per-action confirmation rules in [../SKILL.md](../SKILL.md) apply per wallet — "the user already confirmed this trade" does not carry over to the next slot.
