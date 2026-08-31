---
name: bap578_test_template
description: Generates Hardhat test skeleton for adapter + vault flows.
metadata:
  author: brief-onchain
  version: "1.0"
---

# BAP578 Test Template

## Usage

- Category: BAP578 Dev
- Mode: guide
- Version: 0.1.0

## Input Example

```json
{
  "tokenId": 1,
  "includeFeeOnTransferCase": true
}
```

## Output Example

```text
describe('BAP578 adapter/vault', () => {
  it('allows operator withdraw');
  it('rejects non-operator withdraw');
  it('keeps balance invariants');
});
```

## Security Notes

- Include both positive and negative authorization tests.
- Add balance-consistency assertions for native and ERC20 flows.

## Install

`npx @skillshub/bap578-test-template`
