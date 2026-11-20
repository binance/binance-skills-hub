# Bridge ANTB to AGENT CHAIN (`ANTB.approve` → `Bridge.deposit`)

Deposits BEP-20 ANTB into the AGENT CHAIN Beta bridge escrow on BSC; the AGENT CHAIN relayer credits the same amount of native ANTB to `l2Recipient` from the `Deposited` event. Two transactions, two previews, two confirmations.

- Contracts (BSC): `ANTB` `0x38Dd26788Cf2d901E3aBf04efE3007d459d0Fc53` (18 decimals); `Bridge` — address in [contracts.md](contracts.md) (`0x9eF8CA94a74B7Fbc5ae0b1F7a2dCaFCa14eE2A92` until published).
- Requirement: `msg.sender` passes `isAgent` (Agent ID, or BAB token when enabled). **Registration in `AgentRegistryMirror` is not required.** `l2Recipient` must be non-zero; the contract does not check it against any registry.
- **Mainnet Beta caps: 1 ANTB per address, 500 ANTB total** (cumulative deposits; owner-settable via `setCaps`). Check `remainingFor` / `remainingGlobal` before previewing.
- **Beta escrow model:** until the Nitro Inbox for AGENT CHAIN is live on BSC, deposited ANTB stays in this contract and **the owner can move it with `withdrawTo`** (to the real Inbox, or back to depositors). Every such move emits `EscrowWithdrawn`. This is a disclosed, trusted step bounded by the escrowed balance — tell the user plainly.
- Withdrawals (L2 → BSC) go through the ArbSys precompile on AGENT CHAIN once the Inbox is live; they are not part of this skill yet.

---

## Risk warning (show before the first preview, every time)

> **Bridging risk.** Bridging locks your ANTB in a smart-contract escrow on BSC and credits native ANTB on AGENT CHAIN, which is in **Mainnet Beta**: new, unaudited code, a single sequencer, and bridge caps. During Beta the escrow contract's owner can move escrowed ANTB (`withdrawTo`, logged on-chain) to the live bridge Inbox or back to depositors — deposit only what you are prepared to have escrowed under those terms. ANTB is a bStocks tokenized security issued by BTech Holdings Ltd (ADGM); its issuer can pause transfers or blocklist addresses, which could freeze the escrow. ANTB is not available to US persons and is restricted in other jurisdictions — confirm you are eligible to hold it. Funds on AGENT CHAIN pay for gas and can be lost through bugs, key loss or a halted bridge. Nothing here is investment advice. Only bridge what you can afford to lose. DYOR.

---

## How much have I bridged / remaining cap (read)

```bash
BSC=https://bsc-dataseed.bnbchain.org
# depositedBy(address) 0x10ef7792 → cumulative wei deposited by this address
curl -s -X POST $BSC -H 'content-type: application/json' -d '{
  "jsonrpc":"2.0","id":1,"method":"eth_call","params":[{
    "to":"0x9eF8CA94a74B7Fbc5ae0b1F7a2dCaFCa14eE2A92","data":"0x10ef7792000000000000000000000000<USER_ADDRESS_WITHOUT_0x_LOWERCASE>"},"latest"]}'

# remainingFor(address) 0x24c0c499 → headroom under the per-address cap
curl -s -X POST $BSC -H 'content-type: application/json' -d '{
  "jsonrpc":"2.0","id":2,"method":"eth_call","params":[{
    "to":"0x9eF8CA94a74B7Fbc5ae0b1F7a2dCaFCa14eE2A92","data":"0x24c0c499000000000000000000000000<USER_ADDRESS_WITHOUT_0x_LOWERCASE>"},"latest"]}'

# remainingGlobal() 0x3c96e3ce · totalDeposited() 0xff50abdc · perAddressCap() 0x47dd5172 · globalCap() 0x99a2af75
# pendingDeposits() 0x5c074f44 (ANTB currently escrowed) · paused() 0x5c975abb
for sel in 0x3c96e3ce 0xff50abdc 0x47dd5172 0x99a2af75 0x5c074f44 0x5c975abb; do
  curl -s -X POST $BSC -H 'content-type: application/json' \
    -d "{\"jsonrpc\":\"2.0\",\"id\":3,\"method\":\"eth_call\",\"params\":[{\"to\":\"0x9eF8CA94a74B7Fbc5ae0b1F7a2dCaFCa14eE2A92\",\"data\":\"$sel\"},\"latest\"]}"; echo
done

# ANTB balance: balanceOf(address) 0x70a08231 on the ANTB contract
curl -s -X POST $BSC -H 'content-type: application/json' -d '{
  "jsonrpc":"2.0","id":4,"method":"eth_call","params":[{
    "to":"0x38Dd26788Cf2d901E3aBf04efE3007d459d0Fc53","data":"0x70a08231000000000000000000000000<USER_ADDRESS_WITHOUT_0x_LOWERCASE>"},"latest"]}'

# existing allowance: allowance(owner,spender) 0xdd62ed3e
curl -s -X POST $BSC -H 'content-type: application/json' -d '{
  "jsonrpc":"2.0","id":5,"method":"eth_call","params":[{
    "to":"0x38Dd26788Cf2d901E3aBf04efE3007d459d0Fc53",
    "data":"0xdd62ed3e000000000000000000000000<USER_ADDRESS_WITHOUT_0x_LOWERCASE>000000000000000000000000<BRIDGE_WITHOUT_0x_LOWERCASE>"},"latest"]}'
```

Show as a table: ANTB balance · bridged so far (`depositedBy`) · remaining per-address (`remainingFor`) · remaining global (`remainingGlobal`) · deposits paused? If `paused()` is true, stop: deposits are not possible right now.

---

## Deposit (write)

### Preconditions (from [preflight.md](preflight.md))

1. Wallet `CONNECTED`; Developer Mode on; `baw wallet agent-id --json` → `claimed=true` (or BAB holder with `bab()` enabled).
2. `0x9eF8CA94a74B7Fbc5ae0b1F7a2dCaFCa14eE2A92` is a real address; `paused()` is false.
3. Amount: user-specified, in ANTB. Convert to wei (`× 1e18`). Must be `> 0`, `≤ ANTB balance`, `≤ remainingFor(user)`, `≤ remainingGlobal()`. If any check fails, show the numbers and stop.
4. `l2Recipient`: default to the user's own address. If the user names another recipient, it must be a `0x` address they paste explicitly; never resolve one from a name/handle. Warn that the contract does not validate the recipient beyond non-zero: ANTB credited to an address that is not a mirrored agent on AGENT CHAIN cannot be spent there (the sequencer will not include its transactions).
5. Risk warning shown.

### Calldata

Pad every argument to 32 bytes (64 hex chars). `amountWei` is hex, no `0x`, left-padded with zeros; addresses are lowercase, no `0x`, left-padded with 24 zeros.

```
approve(address spender, uint256 amount)      selector 0x095ea7b3
  0x095ea7b3
  000000000000000000000000<BRIDGE_WITHOUT_0x>
  <amountWei as 64-hex>

deposit(uint256 amount, address l2Recipient)  selector 0x6e553f65
  0x6e553f65
  <amountWei as 64-hex>
  000000000000000000000000<L2_RECIPIENT_WITHOUT_0x>
```

Encoding helper (Node + viem, no keys involved):

```bash
node -e "
const { encodeFunctionData, parseAbi, parseEther } = require('viem');
const amt = parseEther(process.argv[1]); const bridge = process.argv[2]; const to = process.argv[3];
console.log('approve :', encodeFunctionData({ abi: parseAbi(['function approve(address,uint256)']), functionName: 'approve', args: [bridge, amt] }));
console.log('deposit :', encodeFunctionData({ abi: parseAbi(['function deposit(uint256,address)']), functionName: 'deposit', args: [amt, to] }));
" 0.5 0x9eF8CA94a74B7Fbc5ae0b1F7a2dCaFCa14eE2A92 <L2_RECIPIENT>
```

Example for exactly 1 ANTB (`1000000000000000000` wei = `0de0b6b3a7640000`):

```
approve : 0x095ea7b30000000000000000000000000x9eF8CA94a74B7Fbc5ae0b1F7a2dCaFCa14eE2A920000000000000000000000000000000000000000000000000de0b6b3a7640000
deposit : 0x6e553f650000000000000000000000000000000000000000000000000de0b6b3a7640000000000000000000000000000<L2_RECIPIENT>
```

### Step 1 — `approve` (skip if existing allowance ≥ amount; say so)

Preview:

```bash
baw contract-call preview --binanceChainId 56 --from <USER_ADDRESS> --to 0x38Dd26788Cf2d901E3aBf04efE3007d459d0Fc53 --value 0 --inputData <APPROVE_CALLDATA> --json
```

Show and confirm:

> **Step 1 of 2 — Approve ANTB**
> Contract: `ANTB` `0x38Dd26788Cf2d901E3aBf04efE3007d459d0Fc53` (BSC)
> Function: `approve(spender = Bridge 0x9eF8CA94a74B7Fbc5ae0b1F7a2dCaFCa14eE2A92, amount = 0.5 ANTB)` — **exact amount, not unlimited**
> Value: 0 BNB · `allowanceChanges`: `<from preview>` · Risks: `<riskDetails or none>`
>
> Reply **yes** to sign the approval, or anything else to stop.

Check `simulationResult.allowanceChanges`: the new allowance must equal the amount and the spender must be `0x9eF8CA94a74B7Fbc5ae0b1F7a2dCaFCa14eE2A92`. If the preview shows anything else (different spender, max/unlimited amount, extra `authorityChanges`), **stop and do not execute**.

Execute only after "yes":

```bash
baw contract-call execute --requestId <requestId> --json
```

Wait for `BROADCASTED` and for the tx to be mined (poll `eth_getTransactionReceipt` on BSC, or re-read `allowance`). If `PENDING_CONFIRMATION`, the user approves in the Binance App; stop and resume when they say it is done.

### Step 2 — `deposit` (new preview, new confirmation)

```bash
baw contract-call preview --binanceChainId 56 --from <USER_ADDRESS> --to 0x9eF8CA94a74B7Fbc5ae0b1F7a2dCaFCa14eE2A92 --value 0 --inputData <DEPOSIT_CALLDATA> --json
```

Show and confirm:

> **Step 2 of 2 — Deposit ANTB into the AGENT CHAIN bridge**
> Contract: `Bridge` `0x9eF8CA94a74B7Fbc5ae0b1F7a2dCaFCa14eE2A92` (BSC)
> Function: `deposit(amount = 0.5 ANTB, l2Recipient = <L2_RECIPIENT>)` — returns a deposit nonce
> Value: 0 BNB · `balanceChanges`: −0.5 ANTB from you → bridge escrow · Risks: `<riskDetails or none>`
> After this: the relayer credits 0.5 native ANTB on AGENT CHAIN to `<L2_RECIPIENT>` (chainId 1119 mainnet / 111900 testnet), usable for gas. Beta caps: 1 ANTB/address, 500 total. Escrowed ANTB can be moved by the bridge owner during Beta (logged as `EscrowWithdrawn`).
>
> *(Bridging risk warning above applies.)* Reply **yes** to sign, or anything else to stop.

Execute only after "yes":

```bash
baw contract-call execute --requestId <requestId> --json
```

- `BROADCASTED` → show `txHash`, BscScan link, and the `nonce` from the `Deposited(from, l2Recipient, amount, nonce)` event. Tell the user the L2 balance appears after the relayer processes the event (minutes). Offer [chain-status.md](chain-status.md) to check the L2 balance via `eth_getBalance`.
- `PENDING_CONFIRMATION` → approve in the Binance App; stop.
- Error → relay verbatim.

### Reverts

| Revert | Meaning |
|---|---|
| `NotAgent(address)` | no Agent ID / accepted BAB on this address → [agent-id.md](agent-id.md) |
| `ZeroAmount()` | amount was 0 |
| `ZeroAddress()` | `l2Recipient` was the zero address |
| `PerAddressCapExceeded(address account, uint256 attempted, uint256 cap)` | `attempted` = your cumulative total after this deposit; reduce amount to `remainingFor(you)` |
| `GlobalCapExceeded(uint256 attempted, uint256 cap)` | Beta global cap reached; show `remainingGlobal()` and stop |
| `EnforcedPause()` | deposits paused by the owner; tell the user and stop |
| ERC-20 `insufficient allowance` / `SafeERC20FailedOperation` | approval not mined yet or for a lower amount; re-read `allowance`, do not re-approve blindly |

---

## Never

- Never approve `type(uint256).max` or any amount above the deposit.
- Never combine approve + deposit into one confirmation.
- Never choose the `l2Recipient` for the user or resolve it from a name.
- Never present bridging as a way to earn anything.
- Never omit the Beta escrow (`withdrawTo`) disclosure from the risk warning.
