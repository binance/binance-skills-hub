---
title: Wallet Risk Score
description: Assess wallet/address security risk using GoPlus address security API with 20 risk flags including cybercrime, phishing, money laundering, and sanctions detection.
metadata:
  version: "1.0.0"
  author: mefai-dev
license: MIT
---

# Wallet Risk Score

Evaluate the security risk of any blockchain wallet address using the GoPlus address security API. Checks 20 risk indicators including cybercrime associations, phishing activity, money laundering, sanctions compliance, and honeypot connections.

## Quick Reference

| Endpoint | Description | Authentication |
|----------|-------------|----------------|
| `GET /api/v1/address_security/{address}` | Address risk assessment | No |

## API Details

### Address Security Check

Retrieve comprehensive risk assessment for a wallet address across multiple security dimensions.

**Method:** `GET`

**URL:** `https://api.gopluslabs.io/api/v1/address_security/{address}`

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| address | string | Yes | Wallet address (0x... for EVM chains) |

**Query Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| chain_id | string | No | 56 | Chain ID: 56=BSC, 1=ETH, 137=Polygon, 42161=Arbitrum, 8453=Base |

**Example Request:**

```bash
curl 'https://api.gopluslabs.io/api/v1/address_security/0x1234567890abcdef1234567890abcdef12345678?chain_id=56'
```

**Response Fields (Risk Flags):**

| Field | Type | Description | Risk Weight |
|-------|------|-------------|-------------|
| cybercrime | string | "1" if associated with cybercrime | Critical |
| money_laundering | string | "1" if linked to money laundering | Critical |
| sanctioned | string | "1" if on sanctions list | Critical |
| stealing_attack | string | "1" if involved in theft | High |
| blackmail_activities | string | "1" if blackmail activity detected | High |
| financial_crime | string | "1" if financial crime association | High |
| darkweb_transactions | string | "1" if darkweb transaction history | High |
| phishing_activities | string | "1" if phishing involvement | High |
| number_of_malicious_contracts_created | string | Count of malicious contracts | High |
| honeypot_related_address | string | "1" if honeypot association | High |
| fake_kyc | string | "1" if fake KYC detected | Medium |
| blacklist_doubt | string | "1" if suspected blacklisted | Medium |
| malicious_mining_activities | string | "1" if malicious mining | Medium |
| fake_token | string | "1" if creates fake tokens | Medium |
| mixer_usage | string | "1" if uses mixing services | Medium |
| fake_standard_interface | string | "1" if fake interfaces | Low |
| gas_abuse | string | "1" if gas abuse detected | Low |
| reinit | string | "1" if re-initialization risk | Low |
| contract_address | string | "1" if address is a contract | Info |
| data_source | string | Data source identifier | Info |

**Safety Score Calculation:**

```
Score = 100 - (sum of detected risk flag weights)
  >= 80: LOW RISK (green)
  50-79: MEDIUM RISK (yellow)
  < 50:  HIGH RISK (red)
```

## Use Cases

1. **Pre-Transaction Check** — Verify counterparty wallet risk before sending funds
2. **DeFi Due Diligence** — Check contract deployer addresses before interacting with protocols
3. **Compliance Screening** — Screen addresses against sanctions and financial crime databases
4. **Wallet Monitoring** — Periodic risk assessment of addresses in your watch list
5. **P2P Trade Safety** — Verify P2P counterparty wallet risk before completing trades

## Notes

- This is a **public endpoint** — no API key required for basic usage
- GoPlus aggregates data from multiple security databases and on-chain analysis
- Risk flags are binary ("0" = clean, "1" = flagged) except for `number_of_malicious_contracts_created`
- The `data_source` field indicates which security database provided the data
- Chain ID affects the analysis scope; some flags are chain-specific
- Response may vary by chain — not all flags available on all chains
- Rate limit: GoPlus standard public limits apply (~30 req/min)
- For Binance ecosystem integration, combine with on-chain position data from Binance Web3 API
