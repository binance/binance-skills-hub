# AGENT CHAIN status, fee estimate, agent check (read-only)

Everything here is a read. No wallet, no Developer Mode, no confirmation needed. Works for anyone.

| Network | RPC | Chain ID | Explorer |
|---|---|---|---|
| Devnet (live) | `https://rpc.agent-chain.agency` | `11190` (`0x2BB6`) | `https://explorer.agent-chain.agency` |
| Testnet (Phase 1) | TBA | `111900` | TBA |
| Mainnet (Phase 2) | TBA | `1119` | TBA |

Devnet contracts (from `apps/devnet/deployments/devnet.json`):

| Contract | Address |
|---|---|
| `AgentRegistry` | `0x5FbDB2315678afecb367f032d93F642f64180aa3` |
| `GenesisSeat` | `0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512` |
| `FeeKeeper` | `0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0` |

If the AGENT CHAIN MCP server (`apps/mcp`) is available to the agent, prefer its tools (`agentchain_head`, `agentchain_fee_estimate`, `agentchain_is_agent`, `agentchain_genesis_stats`) — they return the same data pre-decoded.

---

## Status / is it up / latest block

```bash
curl -s https://explorer.agent-chain.agency/api/head
```

Response (abridged):

```json
{
  "status": "ok", "chainId": 11190,
  "stats": { "latestBlock": "6006", "avgBlockMs": 252, "txsLast100": 11, "gasPriceWei": "1000000007", "totalSeats": "60" },
  "blocks": [ { "number": "6006", "hash": "0x…", "timestamp": 1795156504, "txCount": 0, "gasUsed": "0", "gasLimit": "60000000" } ],
  "txs":    [ { "hash": "0x…", "blockNumber": "5999", "from": "0x…", "to": "0x…", "value": "226000000000000000", "method": "Transfer" } ]
}
```

Display:

| | |
|---|---|
| Network | AGENT CHAIN Devnet (chainId 11190) |
| Status | live |
| Latest block | 6006 |
| Avg block time | 252 ms |
| Txs in last 100 blocks | 11 |
| Genesis Seats (devnet) | 60 |

Fallback if the explorer is down:

```bash
curl -s -X POST https://rpc.agent-chain.agency -H 'content-type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"eth_blockNumber","params":[]}'
```

---

## Fee estimate (ANTB and USD)

Three reads on `FeeKeeper`:

```bash
RPC=https://rpc.agent-chain.agency; FK=0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0
# minBaseFeeWei() 0xa8fdb6c4   usdPerGas() 0xb0233b8e   antbUsd() 0x2950e068
for sel in 0xa8fdb6c4 0xb0233b8e 0x2950e068; do
  curl -s -X POST $RPC -H 'content-type: application/json' \
    -d "{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"eth_call\",\"params\":[{\"to\":\"$FK\",\"data\":\"$sel\"},\"latest\"]}"; echo
done
```

Scales:

| Value | Scale | Meaning |
|---|---|---|
| `usdPerGas` | 1e18 | USD per 1 gas (`45000000000` = $0.045 per 1,000,000 gas) |
| `antbUsd` | 1e8 | USD per 1 ANTB (`9717000000` = $97.17) |
| `minBaseFeeWei` | wei | `usdPerGas × 1e8 / antbUsd` |

Compute for a gas amount `G`:

```
cost_wei  = G × minBaseFeeWei
cost_ANTB = cost_wei / 1e18
cost_USD  = G × usdPerGas / 1e18
```

Typical `G`: transfer 21,000 · agent call ≈ 45,000 · contract deploy ≈ 180,000.

Display (example at ANTB = $97.17):

| Operation | Gas | ANTB | USD |
|---|---|---|---|
| Transfer | 21,000 | 0.0000097 | $0.000945 |
| Agent call | 45,000 | 0.0000208 | $0.00202 |
| Deploy | 180,000 | 0.0000834 | $0.0081 |

Say: "Fees are quoted in USD and settled in ANTB; the keeper re-prices every 5 minutes. Figures are illustrative and the rate is a protocol parameter." On devnet, the RPC's `eth_gasPrice` is a placeholder (Hardhat default) and does not reflect the keeper — use the FeeKeeper numbers.

---

## Am I an agent on AGENT CHAIN (L2 mirror)

For the user's own address only:

```bash
# isAgent(address) 0x1ffbb064 on AgentRegistry
curl -s -X POST https://rpc.agent-chain.agency -H 'content-type: application/json' -d '{
  "jsonrpc":"2.0","id":1,"method":"eth_call","params":[{
    "to":"0x5FbDB2315678afecb367f032d93F642f64180aa3",
    "data":"0x1ffbb064000000000000000000000000<USER_ADDRESS_WITHOUT_0x_LOWERCASE>"},"latest"]}'

# agentCount() 0xb7dc1284
curl -s -X POST https://rpc.agent-chain.agency -H 'content-type: application/json' \
  -d '{"jsonrpc":"2.0","id":2,"method":"eth_call","params":[{"to":"0x5FbDB2315678afecb367f032d93F642f64180aa3","data":"0xb7dc1284"},"latest"]}'

# seatOf(address) 0xb9cd92c3 on devnet GenesisSeat → seatId (0 = none)
curl -s -X POST https://rpc.agent-chain.agency -H 'content-type: application/json' -d '{
  "jsonrpc":"2.0","id":3,"method":"eth_call","params":[{
    "to":"0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
    "data":"0xb9cd92c3000000000000000000000000<USER_ADDRESS_WITHOUT_0x_LOWERCASE>"},"latest"]}'
```

`isAgent` `…01` → the sequencer will include this address's transactions; `…00` → it will not (on testnet/mainnet, register on BSC first — [register.md](register.md) — and wait for the mirror).

## Native balance on AGENT CHAIN

```bash
curl -s -X POST https://rpc.agent-chain.agency -H 'content-type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"eth_getBalance","params":["<USER_ADDRESS>","latest"]}'
```

Result is hex wei; show as `tANTB` on devnet (no value) or `ANTB` on mainnet.

---

## Disclaimer to attach to status output

Devnet tokens have no value. AGENT CHAIN is independent and not affiliated with, endorsed by, or sponsored by Anthropic, PBC, Binance, or BNB Chain.
