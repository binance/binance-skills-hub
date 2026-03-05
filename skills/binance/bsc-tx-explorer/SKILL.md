---
title: BSC TX Explorer
description: BNB Smart Chain transaction and block explorer using BSC JSON-RPC. Query blocks, transactions, receipts, balances, and gas prices directly from BSC nodes.
metadata:
  version: "1.0.0"
  author: mefai-dev
license: MIT
---

# BSC TX Explorer Skill

Explore BNB Smart Chain blocks, transactions, and account balances using the BSC JSON-RPC API. No authentication required — all endpoints are public.

## Quick Reference

| Endpoint | Method | Description | Authentication |
|----------|--------|-------------|----------------|
| BSC RPC `eth_blockNumber` | POST | Get latest block number | No |
| BSC RPC `eth_getBlockByNumber` | POST | Get block details by number | No |
| BSC RPC `eth_getTransactionByHash` | POST | Get transaction by hash | No |
| BSC RPC `eth_getTransactionReceipt` | POST | Get transaction receipt (status, gas, logs) | No |
| BSC RPC `eth_getBalance` | POST | Get BNB balance for address | No |
| BSC RPC `eth_gasPrice` | POST | Get current gas price | No |

## Base URL

```
https://bsc-dataseed1.binance.org
```

Alternative endpoints:
- `https://bsc-dataseed2.binance.org`
- `https://bsc-dataseed3.binance.org`
- `https://bsc-dataseed4.binance.org`

## API Details

### Get Latest Block Number

Returns the number of the most recent block.

**Request:**
```bash
curl -X POST https://bsc-dataseed1.binance.org \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": "0x50e41b9"
}
```

| Field | Type | Description |
|-------|------|-------------|
| result | string | Block number in hex format |

---

### Get Block By Number

Returns information about a block by block number.

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| blockNumber | string | Yes | Block number in hex (e.g., "0x50e41b9") or "latest" |
| fullTransactions | boolean | Yes | If true, returns full transaction objects; if false, only hashes |

**Request:**
```bash
curl -X POST https://bsc-dataseed1.binance.org \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_getBlockByNumber","params":["latest", false],"id":1}'
```

**Response Fields:**
| Field | Type | Description |
|-------|------|-------------|
| number | string | Block number (hex) |
| hash | string | Block hash |
| timestamp | string | Unix timestamp (hex) |
| transactions | array | Transaction hashes or objects |
| gasUsed | string | Total gas used (hex) |
| gasLimit | string | Gas limit (hex) |
| miner | string | Validator address |

---

### Get Transaction By Hash

Returns transaction details by transaction hash.

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| transactionHash | string | Yes | 66-character transaction hash (0x...) |

**Request:**
```bash
curl -X POST https://bsc-dataseed1.binance.org \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_getTransactionByHash","params":["0xabc123..."],"id":1}'
```

**Response Fields:**
| Field | Type | Description |
|-------|------|-------------|
| hash | string | Transaction hash |
| from | string | Sender address |
| to | string | Recipient address (null for contract creation) |
| value | string | BNB value transferred (hex, in wei) |
| gasPrice | string | Gas price (hex, in wei) |
| gas | string | Gas limit (hex) |
| input | string | Input data (hex) |
| blockNumber | string | Block number (hex), null if pending |
| nonce | string | Sender nonce (hex) |

---

### Get Transaction Receipt

Returns the receipt of a transaction including status, gas used, and logs.

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| transactionHash | string | Yes | 66-character transaction hash (0x...) |

**Request:**
```bash
curl -X POST https://bsc-dataseed1.binance.org \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_getTransactionReceipt","params":["0xabc123..."],"id":1}'
```

**Response Fields:**
| Field | Type | Description |
|-------|------|-------------|
| status | string | "0x1" for success, "0x0" for failure |
| gasUsed | string | Actual gas consumed (hex) |
| contractAddress | string | Created contract address (if contract creation) |
| logs | array | Event logs emitted by the transaction |
| blockNumber | string | Block number (hex) |

---

### Get BNB Balance

Returns the BNB balance of an address in wei.

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| address | string | Yes | 42-character BSC address (0x...) |
| blockTag | string | Yes | Block number (hex) or "latest" |

**Request:**
```bash
curl -X POST https://bsc-dataseed1.binance.org \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_getBalance","params":["0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c", "latest"],"id":1}'
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": "0x1604fc56233a6354a081a"
}
```

Convert wei to BNB: `parseInt(result, 16) / 1e18`

---

### Get Gas Price

Returns the current gas price in wei.

**Request:**
```bash
curl -X POST https://bsc-dataseed1.binance.org \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_gasPrice","params":[],"id":1}'
```

Convert to Gwei: `parseInt(result, 16) / 1e9`

## Use Cases

1. **Transaction Verification** — Look up any BSC transaction by hash to verify status, gas cost, and involved addresses
2. **Block Monitoring** — Track latest blocks, transaction counts, and gas utilization
3. **Balance Checking** — Query BNB balance for any BSC address
4. **Gas Estimation** — Monitor current gas prices for transaction planning
5. **Smart Contract Analysis** — Inspect contract creation transactions and event logs

## Notes

- All numeric values in BSC RPC responses are hex-encoded strings
- BSC block time is approximately 3 seconds
- No rate limiting on public BSC RPC endpoints (but consider using dedicated nodes for production)
- BSC uses 18 decimals for BNB (same as ETH)
- Transaction receipts are only available for confirmed transactions
