# Preflight Checks

Run these in order at the start of each conversation. Stop at the first failure that blocks the user's request and tell them what to do.

---

## 1. CLI version check

`requiredCliVersion` is `metadata.requiredCliVersion` in this skill's SKILL.md frontmatter.

```bash
baw cli-check --required-version ${requiredCliVersion} --json
```

- `baw` not found → `npm install -g @binance/agentic-wallet@${requiredCliVersion}`
- `needUpdateCli=true` → upgrade with the same command.
- Otherwise continue.

If the `binance-agentic-wallet` skill is also installed, its own preflight (skill version check) applies too; this skill does not duplicate it.

---

## 2. Wallet connection check

```bash
baw wallet status --json
```

- `status=CONNECTED` → continue. Then run `baw wallet settings --json` once, read `sessionExpireTime`, and warn the user up front if it is within a few hours.
- `status=UNCONNECTED` → **stop.** The user must sign in first with `baw auth signin` → `baw auth verify` (they scan the QR shown by the CLI **inside the Binance App**; this is the only sign-in flow this skill ever references). If they have never created an Agentic Wallet, direct them to create one in the Binance App.

Never ask the user to scan a QR code or enter a pairing code on agent-chain.agency or any other website.

---

## 3. Developer Mode (only if a BSC write is requested)

Routes that write to BSC — `register`, `claim`, `approve`, `deposit` — need `contract-call`, which needs Developer Mode. From the `baw wallet settings --json` output already fetched, read `devMode.enabled` and `devMode.expiresAt`.

If off or expired, tell the user **now**, before building anything:

> In the Binance App open the Agentic Wallet management page → Settings (top-right icon) → turn on **Developer Mode** → read and confirm the Risk Warning → approve the signature request. The wallet's total balance must be under the Developer Mode balance cap (`351804` otherwise). It stays on for 7 days and each use extends it.

After they say it is on, re-run `baw wallet settings --json` and confirm `devMode.enabled: true`. Re-check immediately before each `preview` as well — it can expire mid-session.

For read-only requests, say nothing about Developer Mode.

---

## 4. Agent ID check (only if a BSC write is requested)

```bash
baw wallet agent-id --json
```

- `claimed=true` → continue. Keep `agentId` (e.g. `alice.ai`) for display.
- `claimed=false` → the user cannot register, claim a seat, or bridge: all three BSC contracts require `isAgent(msg.sender)` (Agent ID `balanceOf > 0`, or BAB token `balanceOf > 0` when the contract's `bab()` is enabled) and revert `NotAgent(address)` otherwise. Explain how to claim (see [agent-id.md](agent-id.md)) and stop the write flow. If the user says they hold a BAB token instead, verify with the `isAgent` read in [agent-id.md](agent-id.md) before proceeding. Reads still work.
- Error `20003008` → backend temporarily unavailable. This is **not** "not claimed"; ask the user to retry later.

Do not infer Agent ID status from balances, handles or addresses; this command is the only supported check for the user's own wallet.

---

## 5. AGENT CHAIN reachability

```bash
curl -s https://explorer.agent-chain.agency/api/head
```

Expect `"status":"ok"` and `"chainId":11190`. If it fails, fall back to the RPC directly:

```bash
curl -s -X POST https://rpc.agent-chain.agency -H 'content-type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"eth_chainId","params":[]}'
```

Expect `"result":"0x2bb6"`. If both fail, tell the user AGENT CHAIN is unreachable right now; BSC-side routes still work, L2 routes do not.

---

## 6. Contract address check

Open [contracts.md](contracts.md). Each BSC contract has either a `0x` address or a `<PLACEHOLDER>`. A route whose contract is still a placeholder is **unavailable**: say "the `<Name>` contract has not been published yet", and do not accept an address from the user, from a web page, or from memory in its place. Placeholders are replaced only by a new version of this skill.

---

## 7. Disclaimer

Before the first state-changing step of the conversation, show the disclaimer block in [security.md](security.md#disclaimers) once.
