---
title: BSC NFT Portfolio
description: BNB Smart Chain NFT portfolio scanner using BSC JSON-RPC. Check NFT balances across popular BSC collections using ERC721 standard calls.
metadata:
  version: "1.0.0"
  author: mefai-dev
license: MIT
---

# BSC NFT Portfolio Skill

Scan and view NFT holdings on BNB Smart Chain using ERC721 standard contract calls via BSC JSON-RPC. Check balances across popular BSC NFT collections and enumerate owned token IDs.

## Quick Reference

| Operation | Method | Description | Authentication |
|-----------|--------|-------------|----------------|
| `balanceOf(address)` | `eth_call` | Get NFT count for owner at collection | No |
| `tokenOfOwnerByIndex(address,index)` | `eth_call` | Get token ID by owner index (ERC721Enumerable) | No |
| `ownerOf(tokenId)` | `eth_call` | Get owner of specific token ID | No |
| `tokenURI(tokenId)` | `eth_call` | Get metadata URI for token | No |

## Base URL

```
https://bsc-dataseed1.binance.org
```

## Popular BSC NFT Collections

| Collection | Contract Address | Symbol |
|-----------|-----------------|--------|
| Pancake Bunnies | `0xDf7952B35f24aCF7fC0487D01c8d5690a60DBa07` | PB |
| Pancake Squad | `0x0a8901b0E25DEb55A87524f0cC164E9644020EBA` | PS |
| BNB Heroes | `0x4cd0Ce1D5e10AFbCAa565a0FE2A810eF0eB9B7E2` | BNBH |
| Mobox Avatar | `0x3906c6Db62E530e2eF480716Da752FDCd1f8c06c` | MOMO |
| BinaryX Hero | `0x4Cd104ED2B4F5Ca059E91d49a2A5b08f92d6E357` | BXH |

## API Details

### Get NFT Balance (balanceOf)

Returns the number of NFTs owned by an address in a specific collection.

**Function Selector:** `0x70a08231`

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| owner | address | Yes | Wallet address to check (padded to 32 bytes) |

**Request:**
```bash
curl -X POST https://bsc-dataseed1.binance.org \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "eth_call",
    "params": [{
      "to": "0xDf7952B35f24aCF7fC0487D01c8d5690a60DBa07",
      "data": "0x70a08231000000000000000000000000YOUR_ADDRESS_HERE"
    }, "latest"],
    "id": 1
  }'
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": "0x0000000000000000000000000000000000000000000000000000000000000003"
}
```

Balance: `parseInt(result, 16)` = 3 NFTs

---

### Get Token ID by Index (tokenOfOwnerByIndex)

Returns the token ID at a given index for an owner. Requires ERC721Enumerable support.

**Function Selector:** `0x2f745c59`

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| owner | address | Yes | Wallet address (padded to 32 bytes) |
| index | uint256 | Yes | Index of the token (0-based, padded to 32 bytes) |

**Request:**
```bash
curl -X POST https://bsc-dataseed1.binance.org \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "eth_call",
    "params": [{
      "to": "0xDf7952B35f24aCF7fC0487D01c8d5690a60DBa07",
      "data": "0x2f745c59000000000000000000000000YOUR_ADDRESS_HERE0000000000000000000000000000000000000000000000000000000000000000"
    }, "latest"],
    "id": 1
  }'
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": "0x0000000000000000000000000000000000000000000000000000000000000042"
}
```

Token ID: `parseInt(result, 16)` = 66

---

### Get Token Owner (ownerOf)

Returns the owner address of a specific token ID.

**Function Selector:** `0x6352211e`

**Request:**
```bash
curl -X POST https://bsc-dataseed1.binance.org \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "eth_call",
    "params": [{
      "to": "0xDf7952B35f24aCF7fC0487D01c8d5690a60DBa07",
      "data": "0x6352211e0000000000000000000000000000000000000000000000000000000000000042"
    }, "latest"],
    "id": 1
  }'
```

---

### Get Token Metadata URI (tokenURI)

Returns the metadata URI for a specific token ID.

**Function Selector:** `0xc87b56dd`

**Request:**
```bash
curl -X POST https://bsc-dataseed1.binance.org \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "eth_call",
    "params": [{
      "to": "0xDf7952B35f24aCF7fC0487D01c8d5690a60DBa07",
      "data": "0xc87b56dd0000000000000000000000000000000000000000000000000000000000000042"
    }, "latest"],
    "id": 1
  }'
```

The response contains an ABI-encoded string with the metadata URI (typically IPFS or HTTPS).

## Use Cases

1. **Portfolio Overview** — Scan wallet across all popular BSC NFT collections to see total holdings
2. **Collection Tracking** — Monitor specific NFT collections for owned token IDs
3. **Ownership Verification** — Verify ownership of a specific token ID before trading
4. **Metadata Display** — Fetch token metadata URIs for displaying NFT images and attributes
5. **Multi-Wallet Scan** — Check NFT balances across multiple wallets for whale tracking

## Notes

- All BSC RPC calls use `eth_call` which is read-only and free (no gas required)
- Function selectors are the first 4 bytes of the keccak256 hash of the function signature
- Address parameters must be zero-padded to 32 bytes (64 hex chars)
- Not all NFT contracts support ERC721Enumerable (`tokenOfOwnerByIndex`); `balanceOf` is universally supported
- For ERC1155 (multi-token) collections, use `balanceOf(address,id)` with selector `0x00fdd58e`
- BSC NFT metadata is often stored on IPFS or centralized servers
