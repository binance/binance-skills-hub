---
title: Greenfield Explorer
description: BNB Greenfield decentralized storage explorer. Browse buckets, objects, and storage provider status on BNB Greenfield network.
metadata:
  version: "1.0.0"
  author: mefai-dev
license: MIT
---

# BNB Greenfield Explorer Skill

Explore and interact with BNB Greenfield decentralized storage network. Browse storage buckets, check Storage Provider status, and manage decentralized data. All read operations are public and require no authentication.

## Quick Reference

| Endpoint | Method | Description | Authentication |
|----------|--------|-------------|----------------|
| SP `/status` | GET | Storage Provider health and version | No |
| SP `/` | GET | List user buckets | No |
| SP `/{bucket}` | GET | List objects in a bucket | No |
| Greenfield RPC | POST | Query on-chain storage metadata | No |

## Base URLs

### Storage Providers (SP)
```
https://greenfield-sp.bnbchain.org
```

Alternative SPs:
- `https://gnfd-testnet-sp1.bnbchain.org` (Testnet)
- `https://gnfd-testnet-sp2.bnbchain.org` (Testnet)

### Greenfield Chain RPC
```
https://greenfield-chain.bnbchain.org
```

## API Details

### Get Storage Provider Status

Returns the health status and version of a Greenfield Storage Provider.

**Request:**
```bash
curl https://greenfield-sp.bnbchain.org/status
```

**Response Fields:**
| Field | Type | Description |
|-------|------|-------------|
| status | string | Provider operational status |
| version | string | Software version |
| endpoint | string | SP endpoint URL |

---

### List User Buckets

Returns all storage buckets owned by a Greenfield account address.

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| user-address | string | Yes | Greenfield account address (0x...) |

**Request:**
```bash
curl "https://greenfield-sp.bnbchain.org/?user-address=0xYOUR_ADDRESS"
```

**Response Fields:**
| Field | Type | Description |
|-------|------|-------------|
| buckets | array | List of bucket objects |
| bucket_info.bucket_name | string | Name of the bucket |
| bucket_info.owner | string | Owner address |
| bucket_info.create_at | string | Creation timestamp |
| bucket_info.payment_address | string | Payment address for storage fees |
| bucket_info.visibility | integer | 1=Public, 2=Private |

---

### List Objects in Bucket

Returns objects stored in a specific bucket.

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| bucket-name | string | Yes | Name of the bucket (in URL path) |
| max-keys | integer | No | Maximum number of objects to return (default 50) |
| prefix | string | No | Filter objects by prefix |

**Request:**
```bash
curl "https://greenfield-sp.bnbchain.org/bucket-name?max-keys=50"
```

**Response Fields:**
| Field | Type | Description |
|-------|------|-------------|
| objects | array | List of object metadata |
| object_info.object_name | string | Name of the object (file) |
| object_info.content_type | string | MIME type |
| object_info.payload_size | string | File size in bytes |
| object_info.create_at | string | Creation timestamp |
| object_info.checksums | array | Content integrity checksums |

---

### Download Object

Download a file from a public bucket.

**Request:**
```bash
curl "https://greenfield-sp.bnbchain.org/bucket-name/object-name" -o output-file
```

For private objects, an authorization signature is required in the `Authorization` header.

## Greenfield Architecture

### Core Components

| Component | Description |
|-----------|-------------|
| Storage Providers (SP) | Store and serve data, erasure-coded for redundancy |
| Greenfield Chain | Tendermint-based blockchain for metadata and permissions |
| BSC Bridge | Cross-chain bridge to BNB Smart Chain for DeFi integration |

### Key Features

- **Decentralized Storage**: Data is erasure-coded (Reed-Solomon) across multiple SPs
- **Cross-Chain Programmability**: Mirror storage objects to BSC smart contracts
- **Permission Management**: Fine-grained bucket/object access control with group-based sharing
- **Data Marketplace**: Monetize data by listing on-chain
- **BNB Payment**: Storage fees paid in BNB tokens

### Supported Operations

| Operation | Description | On-Chain |
|-----------|-------------|----------|
| CreateBucket | Create a new storage bucket | Yes |
| PutObject | Upload a file to a bucket | Yes |
| GetObject | Download a file | No (SP only) |
| DeleteObject | Remove a file | Yes |
| MirrorObject | Mirror to BSC smart contract | Yes |
| SetVisibility | Change public/private | Yes |
| GrantPermission | Share access with other users | Yes |

## Use Cases

1. **Storage Browser** — Browse public buckets and objects on Greenfield network
2. **Account Overview** — View all storage buckets owned by an address
3. **SP Monitoring** — Check Storage Provider health and availability
4. **Data Discovery** — Search and explore publicly available datasets
5. **DeFi Integration** — Discover objects mirrored to BSC for on-chain data operations

## Notes

- Greenfield is a separate blockchain from BSC, but uses the same address format (0x...)
- Storage fees are paid in BNB and depend on file size and storage duration
- Public buckets and objects can be accessed without authentication
- Private objects require ECDSA signature in the Authorization header
- Cross-chain operations (mirror, permission) require transactions on both Greenfield and BSC
- Greenfield mainnet launched in October 2023
