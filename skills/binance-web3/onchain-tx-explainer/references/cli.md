# CLI reference — onchain-tx-explainer

One entry point, two commands, JSON in and JSON out.

```bash
node scripts/cli.mjs <command> '<json arguments>'
```

- Arguments are always a single JSON object passed as one shell-quoted string.
- Success: JSON on **stdout**, exit code `0`, shape `{"success":true,"data":…}`.
- Failure: JSON on **stderr**, exit code `1` (or `2` for an unknown command), shape
  `{"success":false,"error":{"name":…,"message":…}}`.
- No environment variables, no credential, no wallet.

---

## `tx`

Explain a mined transaction: method, native value, gas actually paid, token/NFT movements and
approvals, plus human-readable `summary` lines.

### Parameters

| Parameter | Required | Type | Description |
|-----------|----------|------|-------------|
| `chain` | yes | string | `bsc`, `ethereum`, `base`, `arbitrum`, `polygon`, `robinhood`, or the chainId as a string/number |
| `hash` | yes | string | 32-byte, `0x`-prefixed transaction hash |

### Example

```bash
node scripts/cli.mjs tx '{"chain":"bsc","hash":"0x<64 hex characters>"}'
```

### Return fields

| Field | Type | Meaning |
|-------|------|---------|
| `chainId`, `chain` | number, string | Resolved chain |
| `hash` | string | Transaction hash as submitted |
| `status` | `"success"` \| `"failed"` | Receipt status, not an estimate |
| `blockNumber` | number | Block that included the transaction |
| `from`, `to` | string, string\|null | Sender; `null` for contract creation |
| `call.selector` | string\|null | 4-byte selector, `null` when the transaction carries no calldata |
| `call.name` | string\|null | Decoded method name when the selector is in the local table, otherwise `null` |
| `call.args` | array | Decoded arguments in order (`address` strings, `uint256` as decimal strings) |
| `call.kind` | string | `native-transfer`, `contract-call`, `token-transfer`, `nft-transfer`, `approval`, `mint`, `wrap`, `unwrap` |
| `call.note` | string\|null | Set when there is no calldata or the selector is unknown |
| `nativeValue.raw`, `.formatted`, `.symbol` | strings | Native value moved with the call |
| `gas.used`, `.priceGwei`, `.fee`, `.feeSymbol` | strings | Actual receipt gas: used × effective price |
| `transfers[]` | array | See below |
| `approvals[]` | array | See below |
| `warnings[]` | array | Currently: unlimited approval present |
| `summary[]` | array | Plain-language lines, safe to relay in order |

`transfers[]` item: `token`, `symbol`, `standard` (`erc20`|`erc721`), `from`, `to`, `raw`,
`amount` (decimal-adjusted, `raw` for NFTs), `mint`, `burn` (both booleans, zero-address sides).

`approvals[]` item: `token`, `symbol`, `owner`, `spender`, `raw`, `amount`, `unlimited`
(`raw` equals the maximum uint256).

### Sample response

Addresses and the hash are shortened here; the CLI returns them in full.

```json
{
  "success": true,
  "data": {
    "chainId": 56,
    "chain": "BSC",
    "hash": "0x<hash>",
    "status": "success",
    "blockNumber": 130042072,
    "from": "0x1111…aaaa",
    "to": "0x2222…bbbb",
    "call": {
      "selector": "0x095ea7b3",
      "name": "approve",
      "args": ["0x3333…cccc", "1071000000000000000000"],
      "kind": "approval",
      "note": null
    },
    "nativeValue": { "raw": "0", "formatted": "0", "symbol": "BNB" },
    "gas": { "used": "46040", "priceGwei": "0.051", "fee": "0.00000234804", "feeSymbol": "BNB" },
    "transfers": [],
    "approvals": [
      {
        "token": "0x2222…bbbb",
        "symbol": "Q",
        "owner": "0x1111…aaaa",
        "spender": "0x3333…cccc",
        "raw": "1071000000000000000000",
        "amount": "1071",
        "unlimited": false
      }
    ],
    "warnings": [],
    "summary": [
      "BSC tx 0x<hash> · block 130042072 · success",
      "from 0x1111…aaaa → 0x2222…bbbb",
      "called approve(0x3333…cccc, 1071000000000000000000)",
      "paid 0.00000234804 BNB gas (46040 gas @ 0.051 gwei)",
      "approval: 0x1111…aaaa allowed 0x3333…cccc to spend 1071 Q"
    ]
  }
}
```

A transaction that also moved tokens adds one `summary` line per movement, for example:

```text
USDT: 168.072549759839756267 0x4444…dddd → 0x1111…aaaa
NFT SYMBOL token #42: 0x1111…aaaa → 0x5555…eeee (minted)
```

An unlimited approval adds both `"unlimited": true` and a `warnings` entry:

```json
"warnings": ["This transaction granted an unlimited token approval. Treat the spender as able to move that balance until it is revoked."]
```

### Errors

| Message | Cause |
|---------|-------|
| `hash must be a 32-byte 0x-prefixed transaction hash` | Malformed hash |
| `transaction not found on <chain>` | Hash not known to that chain's RPC |
| `transaction is pending: no receipt yet, nothing to decode` | Mined but no receipt yet |
| `unsupported chain: …` | `chain` outside the supported set |
| `all RPC endpoints failed for chain <id>` | Every fallback endpoint failed |

---

## `calldata`

Decode a call before it is broadcast — useful when a dApp shows a request and the user wants the
arguments in readable form.

### Parameters

| Parameter | Required | Type | Description |
|-----------|----------|------|-------------|
| `chain` | yes | string | Same values as `tx` |
| `data` | yes | string | `0x`-prefixed calldata |
| `to` | no | string | Contract address, echoed back and shown in the summary |

### Example

```bash
node scripts/cli.mjs calldata '{"chain":"bsc","to":"0x2222…","data":"0x095ea7b3<32-byte spender><32-byte amount>"}'
```

### Return fields

| Field | Type | Meaning |
|-------|------|---------|
| `selector` | string\|null | 4-byte selector, `null` for empty calldata |
| `method` | string\|null | Decoded name, `null` when unknown |
| `kind` | string | Same values as `tx` |
| `args` | array | Decoded arguments as strings (`address`, decimal `uint256`, `boolean`, `"0x…"` for dynamic bytes) |
| `byteLength` | number | Calldata length in bytes |
| `summary` | array | One readable line; unlimited allowances render as `unlimited` |

### Sample response

```json
{
  "success": true,
  "data": {
    "chainId": 56,
    "chain": "BSC",
    "to": null,
    "selector": "0x095ea7b3",
    "method": "approve",
    "kind": "approval",
    "args": ["0x3333…cccc", "115792089237316195423570985008687907853269984665640564039457584007913129639935"],
    "byteLength": 68,
    "summary": ["approve(0x3333…cccc, unlimited)"]
  }
}
```

`args` keeps the exact decoded integer; the summary renders the maximum uint256 as `unlimited`.

---

## Recognised selectors

| Selector | Method | Kind |
|----------|--------|------|
| `0xa9059cbb` | `transfer(address,uint256)` | token-transfer |
| `0x095ea7b3` | `approve(address,uint256)` | approval |
| `0x23b872dd` | `transferFrom(address,address,uint256)` | token-transfer |
| `0x42842e0e` | `safeTransferFrom(address,address,uint256)` | nft-transfer |
| `0xb88d4fde` | `safeTransferFrom(address,address,uint256,bytes)` | nft-transfer |
| `0xa22cb465` | `setApprovalForAll(address,bool)` | approval |
| `0xd0e30db0` | `deposit()` | wrap |
| `0x2e1a7d4d` | `withdraw(uint256)` | unwrap |
| `0x1249c58b` | `mint()` | mint |
| `0x40c10f19` | `mint(address,uint256)` | mint |
| `0xa0712d68` | `mint(uint256)` | mint |

Anything else is reported as `kind: "contract-call"` with the raw selector and calldata length. The
table is deliberately small: naming an unverified selector would turn a guess into a claim.

---

## Log topics used

| Topic | Event | Used for |
|-------|-------|----------|
| `0xddf252ad…23b3ef` | `Transfer(address,address,uint256)` | `transfers[]`; four topics means ERC-721 |
| `0x8c5be1e5…c3b925` | `Approval(address,address,uint256)` | `approvals[]` |

Token `symbol()` and `decimals()` are read per contract and cached for the run; ERC-721 detection
uses ERC-165 `supportsInterface(0x80ac58cd)` with a `decimals === 0` fallback when the token does not
answer.
