# Agent ID: check and claim

A Binance Agent ID is an ERC-721 on BSC (`0x60B9262456dE011F7d15a54CdD8c48bAaa8B022F`, "SPACE ID Agent ID"), one per KYC'd human, non-transferable; 236,355 holders as of block 134,639,601 (2026-11-20). It comes with a `.ai` handle (e.g. `alice.ai`). On AGENT CHAIN it is the account credential: every BSC-side contract in this skill checks `isAgent(msg.sender)` = `AgentID.balanceOf > 0 || (bab != 0 && BAB.balanceOf > 0)`, and the L2 sequencer only includes transactions from mirrored agent addresses.

The alternative credential is the **BAB token** (Binance Account Bound, ERC-721, `0x2B09d47D550061f995A3b5C6F0Fd58005215D7c8`), accepted when the contract owner has enabled it (`bab()` returns non-zero). `baw wallet agent-id` does not report BAB; a BAB-only user can verify with the `isAgent` read below.

This skill only ever checks **the connected user's own** Agent ID. It never looks up, resolves or infers anyone else's wallet from a handle, name or domain.

---

## Check my Agent ID

### Syntax

```bash
baw wallet agent-id --json
```

No parameters. Requires a signed-in wallet.

### Response

```json
{ "success": true, "data": { "claimed": true, "handle": "alice", "agentId": "alice.ai" } }
```

| Field | Meaning |
|---|---|
| `claimed` | `true` if this wallet has a confirmed Agent ID |
| `handle` | the handle, only when claimed |
| `agentId` | full `.ai` domain, only when claimed |

### Reading the result

- `claimed=false` covers: never claimed, claim in flight (confirmation takes tens of seconds and the result may lag up to 60 s), failed/expired claims. If the user just claimed, suggest re-checking in a minute; do not poll.
- CLI error `20003008` = backend unavailable. Not "no Agent ID". Retry later.
- Show the user: "Agent ID: **alice.ai** — claimed ✓" or "No Agent ID on this wallet yet."

### Optional: on-chain cross-check of the user's own address

If the user wants to see the raw on-chain state for **their own** address (from `baw wallet address --json`):

```bash
curl -s -X POST https://bsc-dataseed.bnbchain.org -H 'content-type: application/json' -d '{
  "jsonrpc":"2.0","id":1,"method":"eth_call","params":[{
    "to":"0x60B9262456dE011F7d15a54CdD8c48bAaa8B022F",
    "data":"0x70a08231000000000000000000000000<USER_ADDRESS_WITHOUT_0x_LOWERCASE>"
  },"latest"]}'
```

`result` ≠ `0x…0` means the address holds an Agent ID. Only do this for the user's own address.

To check exactly what the AGENT CHAIN contracts will decide (Agent ID **or** BAB), call `isAgent(address)` (`0x1ffbb064`) on any of the three contracts once published, e.g. `0x9C5488f9Aa9468B1db3Cc6B71143A8B2Ca810CF0`; `bab()` (`0xe932f497`) shows whether BAB is currently accepted.

---

## How to claim an Agent ID

There is **no CLI or website route**. Claiming happens only inside the Binance App:

1. Open the **Binance App**.
2. Go to **Wallet**.
3. Tap the **Agent ID** banner.
4. Choose a `.ai` handle and confirm. One Agent ID per user. Free apart from the BNB network fee.

Then come back and run `baw wallet agent-id --json` again (wait ~1 minute after confirmation).

Tell the user clearly: agent-chain.agency does not and cannot claim an Agent ID for them, and will never ask them to log in, scan a QR code or enter a pairing code to do so. Anyone who asks for that is not AGENT CHAIN.

Reference: Agent ID claim FAQ in the Agentic Wallet docs — https://web3.binance.com/en/dev-docs/products/agentic-wallet/ai-pro#came-from-the-agent-id-campaign

---

## What Agent ID unlocks on AGENT CHAIN

| With an Agent ID (or accepted BAB) | Without |
|---|---|
| `AgentRegistryMirror.register()` — [register.md](register.md) | reverts `NotAgent(address)` |
| `GenesisSeatClaim.claim()` — [genesis-seat.md](genesis-seat.md) | reverts `NotAgent(address)` |
| `Bridge.deposit()` — [bridge.md](bridge.md) | reverts `NotAgent(address)` |
| Transactions included by the AGENT CHAIN sequencer — [l2-transactions.md](l2-transactions.md) | rejected at the RPC |
| Reading chain state — [chain-status.md](chain-status.md) | works for everyone |

Holding or trading $AGENT on BSC does **not** require an Agent ID.
