# linkex-agents-pay

Let your AI agent fund its own AI usage. This skill connects an agent to
[Linkex](https://linkex.ai) — a unified gateway for 40+ AI models — and lets
it top up its API quota with stablecoins via the
[x402 protocol](https://www.x402.org) (BNB Smart Chain, Base; more networks as
they roll out). No credit card, no human checkout.

## Install

```bash
npx skills add binance/binance-skills-hub/skills/linkex-agents-pay
```

Works with Claude Code, OpenClaw, and other skills-compatible agents.

## Setup

1. Register at [linkex.ai](https://linkex.ai) and create an API key in the
   console.
2. Export it:

```bash
export LINKEX_API_KEY="sk-..."
# optional, defaults to https://linkex.ai
export LINKEX_BASE_URL="https://linkex.ai"
```

3. For on-chain payment signing, install an x402-capable wallet skill —
   recommended: [binance-agentic-wallet](https://github.com/binance/binance-skills-hub/tree/main/skills/binance-web3/binance-agentic-wallet).

> **First-time note**: binding the Binance wallet is a one-time QR scan in
> the Binance App (the code expires in ~5 minutes, so have your phone ready).
> After that the session persists — day-to-day payments only need a chat
> confirmation, no scanning.

## What it does

| Ask your agent...                          | It runs...                                  |
|--------------------------------------------|---------------------------------------------|
| "How much Linkex quota do I have left?"    | `scripts/status.sh` — key quota + wallet + top-up config in one call |
| "Top up $10 with USDT on BSC"              | `scripts/x402-topup.sh` prepare → your confirmation → execute |
| "Which networks can I pay on?"             | Part of the same status call                |
| "Call gpt-4o through Linkex"               | OpenAI-compatible chat completion           |

**Script-first design**: the bundled scripts condense the multi-step
API/wallet flows into single calls, so a full top-up takes 3 agent turns —
agent turns cost you tokens, and a chatty flow can cost more than a small
top-up itself.

### Scripts

| Script | What it does | Writes anything? |
|--------|--------------|------------------|
| `scripts/status.sh` | Key quota + x402 config + wallet state, one JSON | No (read-only) |
| `scripts/x402-topup.sh prepare` | Create order + preview payment options | Creates one pending order (no funds move) |
| `scripts/x402-topup.sh execute` | Sign + submit + poll settlement | Yes — one payment, only after your confirmation |
| `scripts/balance-guard.sh` | Optional post-turn low-balance warning (hook) | No (a debounce timestamp aside) |

Dependencies: `bash`, `curl`, `python3` (standard on macOS/Linux); `baw`
CLI from the binance-agentic-wallet skill for payment steps.

The skill never holds private keys. Payment signing happens in the user's own
x402 wallet (e.g. Binance Agentic Wallet with MPC + per-day limits), and the
agent confirms with the user before creating orders or signing anything.

## Optional: automatic low-balance guard

`scripts/balance-guard.sh` can run as a post-turn hook (e.g. Claude Code
`Stop` hook) to warn whenever the key drops below `LINKEX_LOW_BALANCE_USD`
(default $5) — even in conversations that never mention Linkex. The agent
offers to set it up and installs it only with your consent; it checks at
most once per 10 minutes, prints a single warning line, and never spends.

## Security

- The skill ships **no credentials**; you supply your own API key via
  environment variables.
- Recipient and token addresses are always taken from live API responses,
  never hardcoded.
- All state-changing steps require explicit user confirmation.

## License

MIT
