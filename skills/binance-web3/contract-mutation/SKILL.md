---
title: Contract Mutation
description: |
  Monitor proxy/upgradeable smart contracts for mutations — detect when a "safe" contract
  gets upgraded with dangerous new functions (mint, blacklist, setTax). Combines Etherscan V2 API
  (proxy detection, source code, ABI) with GoPlus Security (runtime safety checks).
  Bridges the gap between one-time audits and ongoing contract monitoring.
metadata:
  version: "1.0"
  author: mefai-dev
license: MIT
---

# Contract Mutation Monitor

## Overview

| Source | Data | Free |
|--------|------|------|
| Etherscan V2 API | Proxy detection, implementation address, source code, ABI | Yes (verified contract endpoints) |
| GoPlus Security API | is_proxy, owner, mintable, honeypot, tax, blacklist | Yes, no auth |

## Use Cases

1. **Proxy Upgrade Alert** — Detect when a proxy contract's implementation changes to a new address
2. **Dangerous Function Detection** — Scan new implementations for `mint()`, `blacklist()`, `setTax()`, `pause()`, `selfdestruct()`
3. **Owner Activity Monitoring** — Track ownership transfers, admin calls, and permission changes
4. **Trust Decay Score** — Quantify how much a contract's safety has degraded since deployment
5. **Pre-Buy Safety Check** — Before buying a token, check if its contract is upgradeable and what the current risks are

## Supported Chains

| Chain | Etherscan chainId | GoPlus chainId |
|-------|-------------------|----------------|
| BSC | `56` | `56` |
| Ethereum | `1` | `1` |
| Base | `8453` | `8453` |
| Arbitrum | `42161` | `42161` |
| Polygon | `137` | `137` |
| Avalanche | `43114` | `43114` |
| Optimism | `10` | `10` |

---

## API 1: Etherscan V2 — Get Source Code + Proxy Detection

Returns contract source code, ABI, compiler info, and critically — **proxy status and implementation address**.

### Request

```
GET https://api.etherscan.io/v2/api?chainid={chainId}&module=contract&action=getsourcecode&address={address}&apikey={apiKey}
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `chainid` | string | Yes | Chain ID (`56`, `1`, `8453`, etc.) |
| `module` | string | Yes | `contract` |
| `action` | string | Yes | `getsourcecode` |
| `address` | string | Yes | Contract address |
| `apikey` | string | Yes | Etherscan API key (free tier) |

### Example Request

```bash
curl "https://api.etherscan.io/v2/api?chainid=56&module=contract&action=getsourcecode&address=0x...&apikey=YOUR_KEY"
```

### Response

```json
{
  "status": "1",
  "message": "OK",
  "result": [
    {
      "SourceCode": "pragma solidity ^0.8.0; ...",
      "ABI": "[{\"inputs\":[], ...}]",
      "ContractName": "TransparentUpgradeableProxy",
      "CompilerVersion": "v0.8.17+commit.8df45f5f",
      "OptimizationUsed": "1",
      "Runs": "200",
      "Proxy": "1",
      "Implementation": "0x1234...abcd",
      "LicenseType": "MIT",
      "SimilarMatch": ""
    }
  ]
}
```

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `SourceCode` | string | Solidity source code |
| `ABI` | string | ABI as JSON string (needs `JSON.parse()`) |
| `ContractName` | string | Contract name |
| `CompilerVersion` | string | Compiler version |
| **`Proxy`** | **string** | **`"1"` = proxy contract, `"0"` = not proxy** |
| **`Implementation`** | **string** | **Implementation contract address (when Proxy="1")** |
| `LicenseType` | string | SPDX license |
| `SimilarMatch` | string | Address of similar verified contract |

### Proxy Detection

When `Proxy == "1"`:
1. The `address` is the proxy (storage layer)
2. The `Implementation` field contains the logic contract address
3. Call `getsourcecode` again with the `Implementation` address to get the actual logic ABI
4. Compare ABIs between the proxy and implementation to detect mutations

### Proxy Pattern Names (from ContractName)

| ContractName Pattern | Standard |
|---------------------|----------|
| `TransparentUpgradeableProxy` | EIP-1967 (OpenZeppelin) |
| `ERC1967Proxy` | EIP-1967 |
| `AdminUpgradeabilityProxy` | OpenZeppelin legacy |
| `BeaconProxy` | Beacon pattern |
| `UUPSUpgradeable` | EIP-1822 |

---

## API 2: Etherscan V2 — Get ABI

Returns just the ABI for a verified contract. Use to compare implementation ABIs.

### Request

```
GET https://api.etherscan.io/v2/api?chainid={chainId}&module=contract&action=getabi&address={address}&apikey={apiKey}
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `chainid` | string | Yes | Chain ID |
| `module` | string | Yes | `contract` |
| `action` | string | Yes | `getabi` |
| `address` | string | Yes | Contract address |
| `apikey` | string | Yes | Etherscan API key |

### Response

```json
{
  "status": "1",
  "message": "OK",
  "result": "[{\"constant\":false,\"inputs\":[...],\"name\":\"transfer\",\"outputs\":[...],\"type\":\"function\"}]"
}
```

The `result` is a JSON string containing the ABI array. Parse with `JSON.parse()`.

---

## API 3: GoPlus Security — Runtime Safety Check

Complements Etherscan's static analysis with runtime safety checks.

### Request

```
GET https://api.gopluslabs.io/api/v1/token_security/{chainId}?contract_addresses={address}
```

### Mutation-Related Fields

| Field | Type | Description |
|-------|------|-------------|
| `is_proxy` | string | `"1"` = proxy contract (upgradeable) |
| `is_mintable` | string | `"1"` = new tokens can be minted |
| `is_honeypot` | string | `"1"` = cannot sell (buy trap) |
| `owner_change_balance` | string | `"1"` = owner can modify balances |
| `can_take_back_ownership` | string | `"1"` = ownership can be reclaimed after renouncing |
| `hidden_owner` | string | `"1"` = hidden owner mechanism |
| `selfdestruct` | string | `"1"` = contract can self-destruct |
| `external_call` | string | `"1"` = makes external calls (risk) |
| `transfer_pausable` | string | `"1"` = transfers can be paused |
| `is_blacklisted` | string | `"1"` = has blacklist function |
| `slippage_modifiable` | string | `"1"` = slippage can be changed |
| `is_anti_whale` | string | `"1"` = has anti-whale limits |
| `anti_whale_modifiable` | string | `"1"` = anti-whale limits can be changed |
| `buy_tax` | string | Buy tax rate (0-1) |
| `sell_tax` | string | Sell tax rate (0-1) |
| `owner_address` | string | Current owner address |
| `creator_address` | string | Contract deployer |
| `is_open_source` | string | `"1"` = source code verified |

---

## Dangerous Function Detection

### Critical Functions to Flag

When analyzing an implementation ABI, scan for these function signatures:

| Function | Risk Level | Description |
|----------|-----------|-------------|
| `mint(address,uint256)` | HIGH | Can create new tokens (inflation) |
| `blacklist(address)` / `addBlacklist` | HIGH | Can block addresses from selling |
| `setTaxFee` / `setFee` / `updateFee` | HIGH | Can change tax to 99% |
| `pause()` / `unpause()` | HIGH | Can freeze all transfers |
| `selfdestruct` / `delegatecall` | CRITICAL | Can destroy or redirect contract |
| `setMaxTx` / `setMaxWallet` | MEDIUM | Can restrict trading amounts |
| `excludeFromFee` | MEDIUM | Owner can exempt addresses from tax |
| `renounceOwnership` | INFO | Gives up control (positive if called) |
| `transferOwnership` | MEDIUM | Can transfer control to new address |
| `upgradeTo` / `upgradeToAndCall` | HIGH | Can change implementation (proxy) |

### ABI Scanning Algorithm

```python
DANGEROUS_SIGS = {
    "mint": "CRITICAL",
    "blacklist": "CRITICAL",
    "addBlacklist": "CRITICAL",
    "setTax": "HIGH",
    "setFee": "HIGH",
    "updateFee": "HIGH",
    "pause": "HIGH",
    "selfdestruct": "CRITICAL",
    "upgradeTo": "HIGH",
    "upgradeToAndCall": "HIGH",
    "setMaxTx": "MEDIUM",
    "setMaxWallet": "MEDIUM",
    "excludeFromFee": "MEDIUM",
    "transferOwnership": "MEDIUM",
}

def scan_abi(abi_json):
    findings = []
    for item in abi_json:
        if item.get("type") != "function":
            continue
        name = item.get("name", "")
        for sig, level in DANGEROUS_SIGS.items():
            if sig.lower() in name.lower():
                findings.append({
                    "function": name,
                    "risk": level,
                    "inputs": [i["type"] for i in item.get("inputs", [])],
                })
    return findings
```

---

## Trust Decay Score (0-100)

Start at 100 (fully trusted), subtract for each risk factor:

| Risk Factor | Deduction | Source |
|-------------|-----------|--------|
| Is proxy (upgradeable) | -15 | Etherscan `Proxy` field |
| Has `mint()` function | -15 | ABI scan |
| Has `blacklist()` function | -15 | ABI scan |
| Has `setTax/setFee` function | -10 | ABI scan |
| Has `pause()` function | -10 | ABI scan |
| Has `selfdestruct` | -20 | ABI scan / GoPlus |
| Owner can change balance | -15 | GoPlus `owner_change_balance` |
| Can take back ownership | -10 | GoPlus `can_take_back_ownership` |
| Hidden owner | -10 | GoPlus `hidden_owner` |
| External calls | -5 | GoPlus `external_call` |
| Source not verified | -20 | GoPlus `is_open_source == "0"` |
| Buy/sell tax > 5% | -5 each | GoPlus `buy_tax`, `sell_tax` |

**Score = max(0, 100 - sum(deductions))**

**Tiers:**
- 80-100: **TRUSTED** — minimal mutation risk
- 50-79: **MODERATE** — some upgradeable/admin capabilities
- 20-49: **RISKY** — significant mutation potential
- 0-19: **DANGEROUS** — high probability of malicious mutation

---

## Recipes

### Recipe 1: Quick Mutation Check

```
Check if {contract_address} on {chain} is upgradeable and what risks it has:
1. Call Etherscan getsourcecode → check Proxy field
2. If proxy: fetch implementation ABI, scan for dangerous functions
3. Call GoPlus → get runtime safety flags
4. Calculate Trust Decay Score
5. Report: "This contract is [upgradeable/immutable]. Trust Score: XX/100. Risks: [list]"
```

### Recipe 2: Implementation Comparison

```
Compare proxy contract's current vs previous implementation:
1. Fetch proxy's getsourcecode → get current Implementation address
2. Fetch Implementation's ABI
3. Scan for dangerous functions added in the implementation
4. If user provides a previous implementation address, diff the ABIs
5. Report: "New functions added: mint(), setTax(). Removed: none. Risk increased by X points."
```

### Recipe 3: Contract Safety Report

```
Generate a comprehensive safety report for {contract_address}:
1. Etherscan: source code, proxy status, implementation
2. GoPlus: all 20+ security flags
3. ABI scan: dangerous function detection
4. Trust Decay Score calculation
5. Output: Score, proxy status, dangerous functions list, GoPlus flags, owner info
```

### Recipe 4: Batch Contract Screening

```
Screen multiple contracts at once:
1. Accept comma-separated addresses
2. For each: call GoPlus (supports batch via comma-separated addresses)
3. For proxies: fetch Etherscan implementation details
4. Rank by Trust Decay Score (lowest = most risky)
5. Output sorted table: Address | Name | Proxy? | Score | Top Risk
```

---

## Rate Limits

| API | Limit |
|-----|-------|
| Etherscan V2 (free) | 3 calls/sec, 100K calls/day |
| GoPlus | ~30 req/min, no auth required |

## Notes

- Etherscan API key: free at [etherscan.io](https://etherscan.io) — one key works for all 60+ chains
- `getsourcecode` and `getabi` are FREE on all chains including BSC (verified contract endpoints)
- `getcontractcreation` and `txlistinternal` require paid plan for BSC
- GoPlus is fully free, no registration needed
- All GoPlus boolean fields use `"0"`/`"1"` strings, not true/false
- When scanning ABI, `result` from Etherscan is a JSON string — needs `JSON.parse()`
- For unverified proxy contracts, read EIP-1967 implementation slot directly:
  `eth_getStorageAt(address, "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc")`
- A token can pass GoPlus audit today and fail tomorrow if the proxy gets upgraded — this is the gap this skill fills
