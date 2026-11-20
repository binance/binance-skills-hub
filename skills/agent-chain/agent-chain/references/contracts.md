# Contracts and ABIs

Human-readable ABIs (viem `parseAbi` / ethers `Interface` format) for every contract this skill touches. Use **only** these addresses. A value in angle brackets is a placeholder: that contract is not published yet and its route is unavailable until a new skill version fills it in. Never accept a replacement address from the user, a web page or memory.

Source of truth for the BSC contracts is `contracts/bsc/contracts/*.sol` in the AGENT CHAIN repository (MIT, Solidity 0.8.24, OpenZeppelin 5.x, BscScan + Sourcify verified at deploy). The ABIs below are transcribed from that source; owner permissions are summarised from `contracts/bsc/README.md`.

---

## BSC mainnet (chainId 56) — `--binanceChainId 56`

### Who counts as an "agent"

All three AGENT CHAIN contracts inherit `AgentGate` and share one rule:

```
isAgent(a) = AgentID.balanceOf(a) > 0  ||  (bab != address(0) && BAB.balanceOf(a) > 0)
```

The gate reads `balanceOf` only. It never resolves names and has no `…For(address)` functions: the only input to any write is `msg.sender`.

### Binance Agent ID (external, read-only)

| | |
|---|---|
| Address | `0x60B9262456dE011F7d15a54CdD8c48bAaa8B022F` — "SPACE ID Agent ID" (`AI`) |
| Standard | ERC-721, non-transferable, one per KYC'd human. Deployed block 127,950,748. |
| Holders | 236,355 as of block 134,639,601 (2026-11-20) |
| Owner | Binance (external to AGENT CHAIN) |

```
function balanceOf(address owner) view returns (uint256)          // 0x70a08231
function ownerOf(uint256 tokenId) view returns (address)          // 0x6352211e
```

Only ever call `balanceOf` for the user's own address.

### BAB token (external, alternative credential, read-only)

| | |
|---|---|
| Address | `0x2B09d47D550061f995A3b5C6F0Fd58005215D7c8` — "Binance Account Bound Token" (`BABT`) |
| Standard | ERC-721, non-transferable, transparent proxy (upgradeable by Binance) |
| Role | Accepted by `isAgent` when `bab()` on our contracts is non-zero |

```
function balanceOf(address owner) view returns (uint256)          // 0x70a08231
```

### ANTB (external, BEP-20)

| | |
|---|---|
| Address | `0x38Dd26788Cf2d901E3aBf04efE3007d459d0Fc53` |
| Decimals | 18, non-rebasing |
| Issuer | BTech Holdings Ltd (bStocks), ADGM. Beacon-proxy upgradeable; issuer can pause and blocklist. Not available to US persons. |

```
function balanceOf(address account) view returns (uint256)                      // 0x70a08231
function allowance(address owner, address spender) view returns (uint256)       // 0xdd62ed3e
function approve(address spender, uint256 amount) returns (bool)                // 0x095ea7b3  (exact amount only)
event Approval(address indexed owner, address indexed spender, uint256 value)
event Transfer(address indexed from, address indexed to, uint256 value)
```

### `AgentGate` (abstract, inherited by the three contracts below)

```
function isAgent(address account) view returns (bool)      // 0x1ffbb064
function agentId() view returns (address)                  // 0xe84f43b7  — immutable
function bab() view returns (address)                      // 0xe932f497  — address(0) = BAB disabled
function owner() view returns (address)                    // 0x8da5cb5b
function setBab(address newBab)                            // 0x1412cee0  — onlyOwner
function transferOwnership(address newOwner)               // onlyOwner (OZ Ownable)
function renounceOwnership()                               // onlyOwner (OZ Ownable)
event BabUpdated(address indexed previousBab, address indexed newBab)
event OwnershipTransferred(address indexed previousOwner, address indexed newOwner)
error NotAgent(address account)
error ZeroAddress()
error OwnableUnauthorizedAccount(address account)
```

### AgentRegistryMirror (AGENT CHAIN, scored)

| | |
|---|---|
| Address | `0x9C5488f9Aa9468B1db3Cc6B71143A8B2Ca810CF0` |
| Purpose | Opt-in BSC-side registry of agents who joined AGENT CHAIN; read by the bridge relayer, the genesis snapshot and the L2 sequencer allow-list mirror |
| Stores | address, 1-based index, `block.timestamp`. Nothing else. |
| Owner permissions (disclosed) | `setBab(address)`, `transferOwnership` / `renounceOwnership` only. **No pause, no revoke, no edit**: registration is permanent and the owner cannot register, remove or alter anyone. |

```
function register() returns (uint256 index)                           // 0x1aa3a008  — msg.sender must pass isAgent; once per address
function count() view returns (uint256)                               // 0x06661abd
function isRegistered(address account) view returns (bool)            // 0xc3c5a547
function indexOf(address account) view returns (uint256)              // 0xfd6aad25  — 1-based, 0 = not registered
function registeredAt(address account) view returns (uint256)         // 0xaaea3d9c  — unix seconds, 0 = not registered
function agentAt(uint256 index) view returns (address)                // 0xedb1e63d  — 1-based; reverts IndexOutOfRange
event AgentRegistered(address indexed agent, uint256 index)
error AlreadyRegistered(address agent)
error IndexOutOfRange(uint256 index)
```

Plus everything in `AgentGate`.

### GenesisSeatClaim (AGENT CHAIN, scored) — ERC-721 "AGENT CHAIN Genesis Seat" (`SEAT`)

| | |
|---|---|
| Address | `0x3972579dd0128BF0b6778cB3B457ba1d14D1695b` |
| Purpose | Agent ID (or BAB) holders claim a numbered, non-transferable Genesis Seat; `seatId` sequential from 1 in claim order; fully on-chain metadata (JSON + SVG data URI). Mirrored into AGENT CHAIN genesis. |
| Requires registration? | **No.** `claim()` checks `isAgent(msg.sender)` only. Registering in `AgentRegistryMirror` is a separate, independent action. |
| Owner permissions (disclosed) | `pause()` / `unpause()` (stop/resume *new* claims), `setClaimDeadline(uint256)` (unix seconds; `0` = no deadline), `setBab`, `transferOwnership` / `renounceOwnership`. The owner **cannot** mint, burn, move or reassign seats. There is no burn function at all. |

```
function claim() returns (uint256 seatId)                             // 0x4e71d92d  — whenNotPaused, onlyAgent, once per address
function totalSeats() view returns (uint256)                          // 0x1ffc615e  — also the highest seatId
function seatOf(address holder) view returns (uint256)                // 0xb9cd92c3  — seatId, 0 = none
function claimOpen() view returns (bool)                              // 0x4b8bcb58  — !paused && (deadline == 0 || now <= deadline)
function claimDeadline() view returns (uint256)                       // 0x3ba86c44  — 0 = no deadline
function paused() view returns (bool)                                 // 0x5c975abb
function balanceOf(address owner) view returns (uint256)              // 0x70a08231  — 0 or 1
function ownerOf(uint256 seatId) view returns (address)               // 0x6352211e
function tokenURI(uint256 seatId) view returns (string)               // 0xc87b56dd  — data:application/json;base64,…
function name() view returns (string)                                 // "AGENT CHAIN Genesis Seat"
function symbol() view returns (string)                               // "SEAT"
function pause()                                                      // 0x8456cb59  — onlyOwner
function unpause()                                                    // 0x3f4ba83a  — onlyOwner
function setClaimDeadline(uint256 newDeadline)                        // 0x25aa22d8  — onlyOwner
event SeatClaimed(address indexed holder, uint256 indexed seatId)
event ClaimDeadlineUpdated(uint256 previousDeadline, uint256 newDeadline)
event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)   // mint only (from = 0)
event Paused(address account)
event Unpaused(address account)
error AlreadyClaimed(address holder)
error ClaimClosed(uint256 deadline)
error NonTransferable()
error EnforcedPause()
```

`transferFrom`, `safeTransferFrom`, `approve`, `setApprovalForAll` exist for ERC-721 compatibility and always revert `NonTransferable()`. There is no `totalSupply()` (plain OZ ERC721, not Enumerable) — use `totalSeats()`.

### Bridge (AGENT CHAIN, scored) — ANTB deposit side, Mainnet Beta escrow

| | |
|---|---|
| Address | `0x9eF8CA94a74B7Fbc5ae0b1F7a2dCaFCa14eE2A92` |
| Purpose | Agent ID (or BAB) holders deposit ANTB; the AGENT CHAIN relayer credits `l2Recipient` 1:1 in native ANTB from `Deposited` events |
| Beta escrow model | Until the Nitro Inbox for AGENT CHAIN is live on BSC, ANTB stays escrowed in this contract. **The owner can move escrowed ANTB with `withdrawTo`** (to the real Inbox once it exists, or back to depositors). This is a trusted step during Beta, bounded by the escrowed balance, and every call emits `EscrowWithdrawn`. Deposit only what you are prepared to have escrowed under those terms. |
| Beta caps | `perAddressCap = 0.1 ANTB`, `globalCap = 100 ANTB` (cumulative deposits; enforced on-chain; owner-settable via `setCaps`) |
| Requires registration? | **No.** `deposit()` checks `isAgent(msg.sender)` only. `l2Recipient` must be non-zero; it is **not** checked against any registry — a recipient that is not a mirrored agent on L2 will hold ANTB the sequencer will not let it spend. |
| Owner permissions (disclosed) | `pause()` / `unpause()`, `setCaps(uint256,uint256)`, `setInbox(address)` (informational in Beta), `withdrawTo(address,uint256)` (Beta escrow), `setBab`, `transferOwnership` / `renounceOwnership`. The owner **cannot** take ANTB from a user's wallet (only what was deposited). |

```
function deposit(uint256 amount, address l2Recipient) returns (uint256 nonce)   // 0x6e553f65  — whenNotPaused, nonReentrant, onlyAgent; needs prior approve(exact)
function antb() view returns (address)                                           // 0x8f066bf3
function perAddressCap() view returns (uint256)                                  // 0x47dd5172
function globalCap() view returns (uint256)                                      // 0x99a2af75
function totalDeposited() view returns (uint256)                                 // 0xff50abdc  — cumulative, not reduced by withdrawals
function totalWithdrawn() view returns (uint256)                                 // 0x4b319713
function depositedBy(address account) view returns (uint256)                     // 0x10ef7792  — cumulative per address
function depositCount() view returns (uint256)                                   // 0x2dfdf0b5
function inbox() view returns (address)                                          // 0xfb0e722b  — future Nitro Inbox, informational
function pendingDeposits() view returns (uint256)                                // 0x5c074f44  — ANTB currently escrowed
function remainingFor(address account) view returns (uint256)                    // 0x24c0c499  — headroom under per-address cap
function remainingGlobal() view returns (uint256)                                // 0x3c96e3ce  — headroom under global cap
function paused() view returns (bool)                                            // 0x5c975abb
function pause()                                                                 // 0x8456cb59  — onlyOwner
function unpause()                                                               // 0x3f4ba83a  — onlyOwner
function setCaps(uint256 newPerAddressCap, uint256 newGlobalCap)                 // 0x212bf316  — onlyOwner
function setInbox(address newInbox)                                              // 0x53b60c4a  — onlyOwner
function withdrawTo(address to, uint256 amount)                                  // 0x205c2878  — onlyOwner, nonReentrant (Beta escrow)
event Deposited(address indexed from, address indexed l2Recipient, uint256 amount, uint256 indexed nonce)
event EscrowWithdrawn(address indexed to, uint256 amount)
event CapsUpdated(uint256 perAddressCap, uint256 globalCap)
event InboxUpdated(address indexed previousInbox, address indexed newInbox)
event Paused(address account)
event Unpaused(address account)
error ZeroAmount()
error PerAddressCapExceeded(address account, uint256 attempted, uint256 cap)
error GlobalCapExceeded(uint256 attempted, uint256 cap)
error InsufficientEscrow(uint256 requested, uint256 available)
error EnforcedPause()
error ReentrancyGuardReentrantCall()
```

Plus everything in `AgentGate` (`NotAgent`, `ZeroAddress`, `isAgent`, `agentId`, `bab`, `setBab`, `owner`).

### $AGENT token (AGENT CHAIN, scored; launched on Flap)

| | |
|---|---|
| Address | `<AGENT_TOKEN>` |
| Standard | ERC-20 (BEP-20), 18 decimals, launched on Flap (flap.sh) with an ANTB pool, open launch — no Agent ID gate, no per-wallet cap, no team swap fee. Not part of the `contracts/bsc` package. |
| Owner permissions (disclosed) | Standard Flap launch token: no mint after launch, no pause, no blocklist, no tax. See `contracts/bsc/README.md` / Flap listing once live. |

```
function balanceOf(address account) view returns (uint256)                      // 0x70a08231
function allowance(address owner, address spender) view returns (uint256)       // 0xdd62ed3e
function approve(address spender, uint256 amount) returns (bool)                // 0x095ea7b3
function transfer(address to, uint256 amount) returns (bool)                    // 0xa9059cbb
function totalSupply() view returns (uint256)                                   // 0x18160ddd
function decimals() view returns (uint8)
event Transfer(address indexed from, address indexed to, uint256 value)
event Approval(address indexed owner, address indexed spender, uint256 value)
```

This skill does **not** buy, sell or swap $AGENT. If the user wants to trade it, hand off to the `binance-agentic-wallet` skill (`market-order` / `limit-order`) with the token address above, and remind them: $AGENT confers no rights to revenue, equity or returns; nothing here is investment advice.

### Owner at launch

Initial owner of `AgentRegistryMirror`, `GenesisSeatClaim` and `Bridge`: the AGENT CHAIN deployer EOA `0x0F03F1c68d4105dd97011c15cC61467164583A4C`, intended to move to a multisig before bridge caps are lifted (Phase 4). None of the three contracts is a proxy.

---

## AGENT CHAIN Devnet (chainId 11190) — `https://rpc.agent-chain.agency`

Deployed addresses from `apps/devnet/deployments/devnet.json`. Devnet tokens and seats have no value. Testnet/mainnet addresses TBA.

### AgentRegistry (L2)

| | |
|---|---|
| Address | `0x5FbDB2315678afecb367f032d93F642f64180aa3` |
| Purpose | L2 mirror of Agent ID state read by the sequencer (`isAgent(tx.origin)`) |
| Owner | devnet: deployer; testnet/mainnet: bridge message handler. Owner can `register`/`revoke` mirrors only. |

```
function isAgent(address account) view returns (bool)                                   // 0x1ffbb064
function agentOf(address account) view returns (bytes32 handleHash, bool active)        // 0xac3c0e30
function agentCount() view returns (uint256)                                            // 0xb7dc1284
function owner() view returns (address)
function register(address account, bytes32 handleHash)                                  // onlyOwner
function revoke(address account)                                                        // onlyOwner
event AgentRegistered(address indexed account, bytes32 indexed handleHash)
event AgentRevoked(address indexed account)
error NotOwner()
error ZeroAddress()
error NotRegistered()
```

### GenesisSeat (L2)

| | |
|---|---|
| Address | `0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512` |
| Purpose | Non-transferable seat token; on devnet `mint()` is open for testing; on mainnet seats are written into genesis from the BSC claim set |

```
function mint() returns (uint256 seatId)                             // 0x1249c58b  — devnet: open, one per address
function seatOf(address holder) view returns (uint256)               // 0xb9cd92c3  — 0 = none
function balanceOf(address holder) view returns (uint256)            // 0x70a08231
function ownerOf(uint256 seatId) view returns (address)              // 0x6352211e
function totalSeats() view returns (uint256)                         // 0x1ffc615e
function totalSupply() view returns (uint256)                        // 0x18160ddd
function name() view returns (string)                                // "AGENT CHAIN Genesis Seat"
function symbol() view returns (string)                              // "SEAT"
event SeatMinted(address indexed to, uint256 indexed seatId)
event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)
error AlreadyHasSeat(address holder)
error NonTransferable()
error InvalidSeat(uint256 seatId)
```

### FeeKeeper (L2)

| | |
|---|---|
| Address | `0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0` |
| Purpose | Stores USD-per-gas and ANTB/USD, derives the minimum base fee. Keeper writes every 5 min on ≥0.5% move, ≤5% per write, 1 write / 60 s. |
| Owner | keeper operations key (onlyOwner setters); migrates to governance |

```
function usdPerGas() view returns (uint256)          // 0xb0233b8e  — USD per gas, 1e18-scaled (45000000000 = $0.045 / 1M gas)
function antbUsd() view returns (uint256)            // 0x2950e068  — USD per ANTB, 1e8-scaled (9717000000 = $97.17)
function minBaseFeeWei() view returns (uint256)      // 0xa8fdb6c4  — usdPerGas × 1e8 / antbUsd
function lastUpdated() view returns (uint256)
function owner() view returns (address)
function setUsdPerGas(uint256 newUsdPerGas)          // onlyOwner
function setAntbUsd(uint256 newAntbUsd)              // onlyOwner
event UsdPerGasUpdated(uint256 usdPerGas)
event BaseFeeUpdated(uint256 antbUsd, uint256 minBaseFeeWei)
error NotOwner()
error ZeroValue()
```

### ArbSys precompile (L2, mainnet/testnet)

`0x0000000000000000000000000000000000000064` — standard Nitro precompile used to initiate ANTB withdrawals to BSC. Not driven by this skill yet.

---

## Selector cheat-sheet

Computed with `viem.toFunctionSelector` from the signatures in `contracts/bsc/contracts/*.sol`.

| Function | Selector | Contract(s) |
|---|---|---|
| `register()` | `0x1aa3a008` | AgentRegistryMirror |
| `claim()` | `0x4e71d92d` | GenesisSeatClaim |
| `deposit(uint256,address)` | `0x6e553f65` | Bridge |
| `approve(address,uint256)` | `0x095ea7b3` | ANTB |
| `allowance(address,address)` | `0xdd62ed3e` | ANTB |
| `balanceOf(address)` | `0x70a08231` | Agent ID, BAB, ANTB, GenesisSeatClaim |
| `isAgent(address)` | `0x1ffbb064` | all three (AgentGate) + L2 AgentRegistry |
| `agentId()` | `0xe84f43b7` | AgentGate |
| `bab()` | `0xe932f497` | AgentGate |
| `setBab(address)` | `0x1412cee0` | AgentGate (owner) |
| `owner()` | `0x8da5cb5b` | AgentGate |
| `count()` | `0x06661abd` | AgentRegistryMirror |
| `isRegistered(address)` | `0xc3c5a547` | AgentRegistryMirror |
| `indexOf(address)` | `0xfd6aad25` | AgentRegistryMirror |
| `registeredAt(address)` | `0xaaea3d9c` | AgentRegistryMirror |
| `agentAt(uint256)` | `0xedb1e63d` | AgentRegistryMirror |
| `seatOf(address)` | `0xb9cd92c3` | GenesisSeatClaim, L2 GenesisSeat |
| `totalSeats()` | `0x1ffc615e` | GenesisSeatClaim, L2 GenesisSeat |
| `claimOpen()` | `0x4b8bcb58` | GenesisSeatClaim |
| `claimDeadline()` | `0x3ba86c44` | GenesisSeatClaim |
| `tokenURI(uint256)` | `0xc87b56dd` | GenesisSeatClaim |
| `ownerOf(uint256)` | `0x6352211e` | GenesisSeatClaim, L2 GenesisSeat |
| `setClaimDeadline(uint256)` | `0x25aa22d8` | GenesisSeatClaim (owner) |
| `depositedBy(address)` | `0x10ef7792` | Bridge |
| `remainingFor(address)` | `0x24c0c499` | Bridge |
| `remainingGlobal()` | `0x3c96e3ce` | Bridge |
| `totalDeposited()` | `0xff50abdc` | Bridge |
| `totalWithdrawn()` | `0x4b319713` | Bridge |
| `pendingDeposits()` | `0x5c074f44` | Bridge |
| `perAddressCap()` | `0x47dd5172` | Bridge |
| `globalCap()` | `0x99a2af75` | Bridge |
| `depositCount()` | `0x2dfdf0b5` | Bridge |
| `inbox()` | `0xfb0e722b` | Bridge |
| `antb()` | `0x8f066bf3` | Bridge |
| `setCaps(uint256,uint256)` | `0x212bf316` | Bridge (owner) |
| `setInbox(address)` | `0x53b60c4a` | Bridge (owner) |
| `withdrawTo(address,uint256)` | `0x205c2878` | Bridge (owner) |
| `pause()` / `unpause()` / `paused()` | `0x8456cb59` / `0x3f4ba83a` / `0x5c975abb` | GenesisSeatClaim, Bridge |
| `mint()` | `0x1249c58b` | L2 GenesisSeat (devnet) |
| `agentCount()` | `0xb7dc1284` | L2 AgentRegistry |
| `minBaseFeeWei()` / `usdPerGas()` / `antbUsd()` | `0xa8fdb6c4` / `0xb0233b8e` / `0x2950e068` | L2 FeeKeeper |

Argument encoding: each argument is 32 bytes. Addresses → 24 zero bytes + 20-byte address (lowercase hex, no `0x`). `uint256` → 64 hex chars, left-padded with zeros.
