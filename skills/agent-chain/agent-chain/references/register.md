# Register on AGENT CHAIN (`AgentRegistryMirror.register()`)

Registers the user's own address in the BSC-side `AgentRegistryMirror`, the opt-in registry read by AGENT CHAIN infrastructure (bridge relayer, genesis snapshot, sequencer allow-list mirror). It stores only the address, a 1-based index and the block timestamp.

- Contract: `AgentRegistryMirror` on BSC — address in [contracts.md](contracts.md) (`0x9C5488f9Aa9468B1db3Cc6B71143A8B2Ca810CF0` until published).
- Requirement: `msg.sender` passes `isAgent` (holds a Binance Agent ID, or a BAB token when `bab()` is enabled). Otherwise reverts `NotAgent(address)`.
- Independent: `GenesisSeatClaim.claim()` and `Bridge.deposit()` do **not** require registration. Registration is what gets the address mirrored into the L2 `AgentRegistry` so the sequencer will include its transactions.
- Cost: BSC gas only. No value, no token transfer, no approval.
- Permanent: no owner can revoke or edit an entry. Calling again reverts `AlreadyRegistered(address)` — check first.
- There is no `registerFor(address)`: nobody can register someone else.

---

## Am I registered? (read, no signing)

```bash
# isRegistered(address) selector 0xc3c5a547
curl -s -X POST https://bsc-dataseed.bnbchain.org -H 'content-type: application/json' -d '{
  "jsonrpc":"2.0","id":1,"method":"eth_call","params":[{
    "to":"0x9C5488f9Aa9468B1db3Cc6B71143A8B2Ca810CF0",
    "data":"0xc3c5a547000000000000000000000000<USER_ADDRESS_WITHOUT_0x_LOWERCASE>"
  },"latest"]}'

# indexOf(address) 0xfd6aad25 → 1-based registry index (0 = not registered)
# registeredAt(address) 0xaaea3d9c → unix seconds (0 = not registered)
# count() 0x06661abd → total registered agents
```

`result` ending in `…01` → registered; `…00` → not registered. Display index and date if registered. Only query the user's own address (from `baw wallet address --json`). Do not use `agentAt(index)` to enumerate or look up other people.

---

## Register (write)

### Preconditions (from [preflight.md](preflight.md))

1. Wallet `CONNECTED`; Developer Mode on; `baw wallet agent-id --json` → `claimed=true` (or the user holds a BAB token and `bab()` on the contract is non-zero).
2. `0x9C5488f9Aa9468B1db3Cc6B71143A8B2Ca810CF0` is a real address in [contracts.md](contracts.md).
3. `isRegistered(user)` is `false`.

### Calldata

`register()` has no arguments. Calldata is the 4-byte selector:

```
0x1aa3a008
```

### Step 1 — Preview

```bash
baw contract-call preview --binanceChainId 56 --from <USER_ADDRESS> --to 0x9C5488f9Aa9468B1db3Cc6B71143A8B2Ca810CF0 --value 0 --inputData 0x1aa3a008 --json
```

### Step 2 — Show and confirm

Show the user, in this form:

> **Register on AGENT CHAIN**
> Contract: `AgentRegistryMirror` `0x9C5488f9Aa9468B1db3Cc6B71143A8B2Ca810CF0` (BSC)
> Function: `register()` — records your address `<USER_ADDRESS>` (Agent ID `alice.ai`) in the AGENT CHAIN registry and returns your registry index
> Value: 0 BNB · Token transfers: none · Approvals: none
> Simulation: `<simulationResult.simulationCode>` · Risks: `<each risks.riskDetails title — description, or "none reported">`
> Gas: estimated by the wallet
>
> This records a permanent, public link between your address and AGENT CHAIN. It cannot be undone by you or by the contract owner. DYOR.
>
> Reply **yes** to sign, or anything else to stop.

Include `authorityChanges` if non-empty (it should be empty for this call — if it is not, stop and do not execute).

### Step 3 — Execute (only after an explicit "yes")

```bash
baw contract-call execute --requestId <requestId> --json
```

- `status=BROADCASTED` → show `txHash` and `https://bscscan.com/tx/<txHash>`. The `AgentRegistered(agent, index)` event carries the index; the L2 `AgentRegistry` mirror updates within a few minutes (devnet: owner-set; testnet/mainnet: relayer).
- `status=PENDING_CONFIRMATION` → tell the user to approve in the Binance App. Stop; do not re-run execute.
- Any error → relay verbatim. Do not retry automatically.

### Reverts (as returned by preview)

| Revert | Meaning |
|---|---|
| `NotAgent(address)` | the `--from` address holds neither an Agent ID nor an accepted BAB token; see [agent-id.md](agent-id.md) |
| `AlreadyRegistered(address)` | nothing to do; show the read result instead |

The registry has no pause and no owner revoke; those reverts do not exist here.

---

## After registering

Offer, as separate steps each needing its own confirmation:

1. [Claim your Genesis Seat](genesis-seat.md) (independent of registration)
2. [Bridge ANTB](bridge.md) (Mainnet Beta caps apply; independent of registration)
3. [Check your L2 agent status](chain-status.md) once the mirror has synced
