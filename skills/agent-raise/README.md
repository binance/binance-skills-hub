# agent-raise

Agent skill for AgentRaise raises on BNB Smart Chain (Flap Portal `newLauncher`).

## Install (after a hub merge)

```bash
npx skills add binance/binance-skills-hub/skills/agent-raise
```

Also install the official signing skill if it is not already present:

```bash
npx skills add binance/binance-skills-hub/skills/binance-web3/binance-agentic-wallet
```

This skill requires the `baw` CLI (`@binance/agentic-wallet`, required version 1.12.0), which the official wallet skill installs.

## What it covers

- Create a raise (`Portal.newLauncher`)
- Contribute, refund, claim, settle
- Restart stalled auto-distribution (`schedule` or zero-value `fund`)
- Read raise status with `eth_call` and parse receipts

It does not sign transactions, build its own calldata when the page already provided it, or implement token swaps.

## License

MIT
