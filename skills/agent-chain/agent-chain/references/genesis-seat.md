# Genesis Seat: claim and view (`GenesisSeatClaim`)

A **Genesis Seat** is a numbered, non-transferable ERC-721 ("AGENT CHAIN Genesis Seat", `SEAT`) for Agent ID holders who join AGENT CHAIN before mainnet. It records membership and priority (seat numbers are sequential by claim order), has fully on-chain metadata (JSON + SVG), and is mirrored into the AGENT CHAIN genesis block.

Describe it exactly like that: **identity and priority**. The contract's own metadata says it "confers no rights to revenue or returns"; the whitepaper's sequencer-revenue allocation to seat holders is a **protocol parameter that governance can change**, not a promise. Do not use the words earn, yield, income, dividend, APY or returns when describing a seat.

- Contract: `GenesisSeatClaim` on BSC — address in [contracts.md](contracts.md) (`0x3972579dd0128BF0b6778cB3B457ba1d14D1695b` until published).
- Requirement: `msg.sender` passes `isAgent` (Agent ID, or BAB token when enabled). **Registration in `AgentRegistryMirror` is not required.** One seat per address.
- Claim window: owner can `pause()` or set `claimDeadline`; `claimOpen()` tells you whether `claim()` would currently succeed.
- Cost: BSC gas only. No value, no token transfer, no approval.
- Non-transferable: `transferFrom`, `safeTransferFrom`, `approve`, `setApprovalForAll` revert `NonTransferable()`. There is no burn.

---

## My seat (read, no signing)

Against the user's own address (`baw wallet address --json`):

```bash
# seatOf(address) selector 0xb9cd92c3 → seatId (0 = none)
curl -s -X POST https://bsc-dataseed.bnbchain.org -H 'content-type: application/json' -d '{
  "jsonrpc":"2.0","id":1,"method":"eth_call","params":[{
    "to":"0x3972579dd0128BF0b6778cB3B457ba1d14D1695b",
    "data":"0xb9cd92c3000000000000000000000000<USER_ADDRESS_WITHOUT_0x_LOWERCASE>"
  },"latest"]}'
```

Optional: `tokenURI(uint256)` (`0xc87b56dd` + seatId padded) returns a `data:application/json;base64,…` URI with the seat image; decode and show the name if the user asks.

Display:

| | |
|---|---|
| Address | `<USER_ADDRESS>` (`alice.ai`) |
| Genesis Seat | **#42** (or "none yet") |
| Transferable | No |

Only query the user's own address. Refuse "what seat does bob.ai have" and do not use `ownerOf(seatId)` to map seats to people.

## Genesis stats / is claiming open (read)

```bash
# totalSeats() 0x1ffc615e · claimOpen() 0x4b8bcb58 · claimDeadline() 0x3ba86c44 · paused() 0x5c975abb
for sel in 0x1ffc615e 0x4b8bcb58 0x3ba86c44; do
  curl -s -X POST https://bsc-dataseed.bnbchain.org -H 'content-type: application/json' \
    -d "{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"eth_call\",\"params\":[{\"to\":\"0x3972579dd0128BF0b6778cB3B457ba1d14D1695b\",\"data\":\"$sel\"},\"latest\"]}"; echo
done
```

Context for the user: there were 236,355 Agent ID holders on BSC as of block 134,639,601 (2026-11-20); every one of them is eligible to claim.

For the L2 devnet mirror, `GET https://explorer.agent-chain.agency/api/head` → `stats.totalSeats`. See [chain-status.md](chain-status.md).

---

## Claim my Genesis Seat (write)

### Preconditions (from [preflight.md](preflight.md))

1. Wallet `CONNECTED`; Developer Mode on; `baw wallet agent-id --json` → `claimed=true` (or BAB holder with `bab()` enabled).
2. `0x3972579dd0128BF0b6778cB3B457ba1d14D1695b` is a real address.
3. `seatOf(user) == 0` (no seat yet) and `claimOpen() == true`. If `claimOpen()` is false, read `paused()` / `claimDeadline()` and tell the user why; stop.

### Calldata

`claim()` has no arguments:

```
0x4e71d92d
```

### Step 1 — Preview

```bash
baw contract-call preview --binanceChainId 56 --from <USER_ADDRESS> --to 0x3972579dd0128BF0b6778cB3B457ba1d14D1695b --value 0 --inputData 0x4e71d92d --json
```

### Step 2 — Show and confirm

> **Claim Genesis Seat**
> Contract: `GenesisSeatClaim` `0x3972579dd0128BF0b6778cB3B457ba1d14D1695b` (BSC)
> Function: `claim()` — mints the next sequential Genesis Seat (currently `totalSeats + 1`) to `<USER_ADDRESS>` (Agent ID `alice.ai`)
> Value: 0 BNB · Token transfers: none · Approvals: none
> Simulation: `<simulationCode>` · Risks: `<riskDetails or "none reported">`
>
> A Genesis Seat is a non-transferable membership and priority token. It is not an investment, does not promise any payment, and cannot be sold or moved. Seat numbering is by claim order. DYOR.
>
> Reply **yes** to sign, or anything else to stop.

### Step 3 — Execute (only after an explicit "yes")

```bash
baw contract-call execute --requestId <requestId> --json
```

- `BROADCASTED` → show `txHash`, BscScan link, then re-run `seatOf` and show the seat number (also in the `SeatClaimed(holder, seatId)` event).
- `PENDING_CONFIRMATION` → user approves in the Binance App. Stop.
- Error → relay verbatim.

### Reverts

| Revert | Meaning |
|---|---|
| `NotAgent(address)` | no Agent ID / accepted BAB on this address → [agent-id.md](agent-id.md) |
| `AlreadyClaimed(address)` | show the existing seat instead |
| `ClaimClosed(uint256 deadline)` | the claim deadline has passed; tell the user the deadline and stop |
| `EnforcedPause()` | claims paused by the owner; tell the user and stop |

---

## Devnet note

On the live Devnet (chainId 11190), the L2 `GenesisSeat` contract has an open `mint()` for testing — see [l2-transactions.md](l2-transactions.md). Devnet seats and tokens have no value and are not the mainnet genesis set.
