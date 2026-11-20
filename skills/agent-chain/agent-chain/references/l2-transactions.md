# Send and call on AGENT CHAIN (L2 JSON-RPC)

AGENT CHAIN is a standard EVM chain reachable over JSON-RPC. Reads are open to everyone. Writes are included by the sequencer **only if `AgentRegistry.isAgent(tx.origin)` is true**; otherwise the RPC rejects the transaction at the boundary (no gas, no nonce consumed).

Agentic Wallet (`baw`) **cannot sign on AGENT CHAIN** — the chain is not in Agentic Wallet's chain list, which Binance controls. Do not promise that it will be. L2 transactions are signed by the user's own key with standard tooling (viem, ethers, Foundry `cast`, a hardware wallet). This skill builds and explains the transaction; it never touches key material.

| Network | RPC | Chain ID | Gas token |
|---|---|---|---|
| Devnet (live) | `https://rpc.agent-chain.agency` | `11190` | tANTB (no value) |
| Testnet | TBA | `111900` | tANTB |
| Mainnet | TBA | `1119` | ANTB |

---

## Which account can transact

The L2 account must be an address for which `AgentRegistry.isAgent` returns true (check in [chain-status.md](chain-status.md)).

- **Devnet (today):** the registry is owner-set for testing. Any EOA the user controls can be registered on request (the devnet activity bot and deploy script register test accounts). Devnet tokens have no value.
- **Testnet / Mainnet:** the registry mirrors Agent ID (or BAB) holders who have called `AgentRegistryMirror.register()` on BSC ([register.md](register.md)) — registration is the opt-in that gets an address mirrored. The L2 account is therefore **the user's Agent ID address**. If that address is an Agentic Wallet address, the user currently cannot sign L2 transactions with it, because Agentic Wallet does not expose keys or support this chain. Tell the user this plainly. Delegated L2 signing keys bound to an Agent ID are on the roadmap (Phase 3 account abstraction / session keys) and are **not available yet** — do not promise a date.
- Funding: native ANTB arrives on the L2 account through the bridge ([bridge.md](bridge.md)) or, on devnet, from the faucet/activity bot.

Never ask for, accept or store a private key, seed phrase or keystore password. If the user pastes one into the conversation, tell them to treat it as compromised and rotate it; do not use it.

---

## Read a contract (`eth_call`)

```bash
curl -s -X POST https://rpc.agent-chain.agency -H 'content-type: application/json' -d '{
  "jsonrpc":"2.0","id":1,"method":"eth_call",
  "params":[{"to":"<CONTRACT>","data":"<CALLDATA>"},"latest"]}'
```

Encode `data` with viem (`encodeFunctionData`) or `cast calldata "fn(type,…)" args…`. Decode the hex `result` with `decodeFunctionResult` / `cast --to-dec` and show it in human units.

---

## Send native tANTB/ANTB or write to a contract

### 1. Gather

- `from`: the user's L2 account (an `isAgent` address).
- `to`: a `0x` address the user pastes. Never resolve a recipient from a name or handle.
- `value`: amount in wei (`parseEther("0.01")`). `0` for contract calls.
- `data`: `0x` for a plain transfer; encoded calldata for a contract call.
- `nonce`: `eth_getTransactionCount(from, "pending")`.
- Gas: `eth_estimateGas` on the unsigned tx; fee from [chain-status.md](chain-status.md) (`minBaseFeeWei`). Tips are ignored by the sequencer (FCFS, no mempool), so `maxPriorityFeePerGas = 0` is fine.

### 2. Show the unsigned transaction and confirm

> **Send on AGENT CHAIN Devnet (chainId 11190)**
> From: `<from>` · To: `<to>` · Value: 0.01 tANTB (`10000000000000000` wei)
> Data: `0x` (plain transfer) · Nonce: 7 · Gas: 21000 · maxFeePerGas: `<wei>` (≈ $0.000945)
> Devnet tokens have no value. Reply **yes** and sign with your own key, or anything else to stop.

For a contract write, decode `data` into function + arguments in the summary.

### 3. User signs locally

Example with viem (the user runs this with their own key management; the skill only supplies the parameters):

```ts
import { createWalletClient, http, defineChain, parseEther } from "viem";
import { privateKeyToAccount } from "viem/accounts";

const agentChainDevnet = defineChain({
  id: 11190, name: "AGENT CHAIN Devnet",
  nativeCurrency: { name: "tANTB", symbol: "tANTB", decimals: 18 },
  rpcUrls: { default: { http: ["https://rpc.agent-chain.agency"] } },
});

const account = privateKeyToAccount(process.env.L2_KEY as `0x${string}`); // user's own key, never shared with the agent
const client = createWalletClient({ account, chain: agentChainDevnet, transport: http() });

const hash = await client.sendTransaction({ to: "0x<recipient>", value: parseEther("0.01") });
console.log(hash);
```

Or with Foundry (`cast` handles signing with a local keystore or hardware wallet):

```bash
cast send --rpc-url https://rpc.agent-chain.agency --chain 11190 --keystore ~/.foundry/keystores/agent \
  0x<recipient> --value 0.01ether
```

### 4. Or broadcast a pre-signed raw transaction

If the user signs elsewhere and hands back the raw hex:

```bash
curl -s -X POST https://rpc.agent-chain.agency -H 'content-type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"eth_sendRawTransaction","params":["0x02f8…"]}'
```

The signature must commit to chainId `11190` (EIP-155 / type-2); a tx signed for another chain is rejected.

### 5. Confirm

```bash
curl -s -X POST https://rpc.agent-chain.agency -H 'content-type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"eth_getTransactionReceipt","params":["<TX_HASH>"]}'
```

Blocks are 250 ms, so the receipt is usually available within a second. Show `status`, `blockNumber`, `gasUsed`, and `https://explorer.agent-chain.agency/tx/<TX_HASH>`.

### Sequencer rejection

If the RPC returns an error indicating the sender is not an agent (wording comes from the node; relay it verbatim), the address is not in `AgentRegistry`. Route to [register.md](register.md) (testnet/mainnet) or explain devnet registration. Do not retry with a different sender.

---

## Devnet-only: mint a devnet Genesis Seat

The devnet `GenesisSeat` (`0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512`) has an open `mint()` (selector `0x1249c58b`) for testing: a contract write with `data = 0x1249c58b`, `value = 0`, following the flow above. One per address; reverts with `AlreadyHasSeat` otherwise. Devnet seats have no value and are not the mainnet genesis set; the mainnet seat is claimed on BSC via [genesis-seat.md](genesis-seat.md).

---

## Stylus

AGENT CHAIN runs Arbitrum Nitro with Stylus enabled: contracts can be Solidity or Rust/WASM. Calling them is identical over JSON-RPC.
