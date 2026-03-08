---
name: bitagent_bonding_playbook
description: Provides guarded execution playbook for launch/buy/sell flows on BSC bonding-curve products.
---

# BitAgent Bonding Playbook

## Usage

- Category: Ecosystem
- Mode: guide
- Version: 0.1.0

## Input Example

```json
{
  "action": "launch",
  "network": "bsc",
  "symbol": "AGENT"
}
```

## Local Install (planned)

```bash
npx @skillshub/bitagent-bonding-playbook
```

## Notes

- High-risk operation playbook only, not direct autonomous execution.
- Requires explicit user confirmation for launch and trade actions.
