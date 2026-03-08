---
name: bap578_adapter_blueprint
description: Generates a simple adapter contract blueprint for token-bound agent accounts.
metadata:
  author: brief-onchain
  version: "1.0"
---

# BAP578 Adapter Blueprint

## Usage

- Category: BAP578 Dev
- Mode: guide
- Version: 0.1.0

## Input Example

```json
{
  "contractName": "MyBAP578Adapter",
  "nfaInterface": "INFAOwner"
}
```

## Output Example

```solidity
contract MyBAP578Adapter {
  modifier onlyOperator(uint256 tokenId) {
    require(INFAOwner(nfa).ownerOf(tokenId) == msg.sender, 'not operator');
    _;
  }
}
```

## Security Notes

- Keep `ownerOf(tokenId)` as the primary authorization guard.
- Isolate vault debit/credit permissions from business logic.

## Install

`npx @skillshub/bap578-adapter-blueprint`
