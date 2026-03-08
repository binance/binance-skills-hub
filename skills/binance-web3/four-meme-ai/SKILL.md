---
name: four_meme_ai
description: Installs and exposes the official four-meme-ai CLI skill so Hub agents can run create/buy/sell/send flows on Four.Meme directly from chats.
metadata:
  author: brief-onchain
  version: "1.0"
---

# Four.Meme Agent Skill Bridge

## Usage

- Category: Ecosystem Intake
- Mode: integration
- Version: 0.1.0

## Skill Summary

Use this package when you want a SkillHub agent to call the native `fourmeme` CLI commands instead of coding a custom meme-launch workflow. It handles CLI install, skill enablement, private RPC/key configuration, and agent-side invocation hints so any Hub-integrated agent can trigger `create`, `buy`, `sell`, `send`, or `8004-register` without extra glue code.

## Install Steps

1. Install the upstream CLI globally (requires pnpm):
   ```bash
   pnpm add -g @four-meme/four-meme-ai@latest
   ```
2. Install the skill package inside your agent runtime (works anywhere `npx` is available):
   ```bash
   npx skills add four-meme-community/four-meme-ai
   ```

## Configure RPC + Signing Keys

- Create or update `.env` (or the `fourmeme config` file) with:
  ```ini
  BSC_RPC_URL=https://bsc-dataseed.binance.org
  PRIVATE_KEY=0x...
  ```
- The CLI auto-loads these values. If you run inside OpenClaw or other managed sandboxes, add the same variables to the host skill configuration or provide the `four-meme-ai` API key slot there.
- Store hot keys only in short-lived agent sandboxes; keep cold keys offline.

## Enable in Agent Platforms

- **OpenClaw:** Open the Skills menu, find `four-meme-ai`, enable it, and map the above environment variables. The CLI will expose `fourmeme <command>` in chats.
- **Cursor / Claude Code / other Skill editors:** Clone the repo or install via npm, add `four-meme-integration` skill, then wire `fourmeme` commands through the integration shell so editors can call it from the terminal panel.
- **Kimi / OpenAI Bash agents:** After enabling the CLIs inside Bash, run commands via `fourmeme <command>`; private keys must be injected through their secure secret stores.

## Example Dialogue Prompts

Once the skill is installed, speak natural language instructions and let the agent translate them into CLI calls, e.g.

- “创建一个 Four.meme 币，限额 0.01 BNB 初始注入。” → `fourmeme create --budget 0.01`
- “帮我 0.5 BNB 买入当前会话里的 MemeToken。” → `fourmeme buy --amount 0.5 --symbol MemeToken`
- “卖掉 20% 持仓并把收益转进资金池。” → `fourmeme sell --percent 20`
- “把 300000 枚代币发送到 0xabc...123。” → `fourmeme send --to 0xabc...123 --amount 300000`

## Agent Identity (8004 Register)

Before running community programs that require on-chain identity, mint the agent NFT:

```bash
fourmeme 8004-register
```

The Hub can call this once per agent wallet. After that, every CLI flow signs transactions using the registered identity so downstream platforms can whitelist your agent automatically.
