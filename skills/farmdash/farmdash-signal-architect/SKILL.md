---
name: farmdash-signal-architect
description: 100% non-custodial agent-to-agent swap router API. Execute single-chain and cross-chain token swaps with zero custody via FarmDash.
metadata:
  version: "1.2.0"
  author: Parmasanandgarlic
  license: MIT
---

# FarmDash Signal Architect

**100% Zero-Custody • Never sees your private keys • Signing happens locally inside your wallet**

### Secure Signing Workflow (Read This First)
The agent builds the payload on your device. It signs using **OpenClaw’s built-in EVM wallet** (exactly like MetaMask). **You never paste, type, or send your private key anywhere.** Only the signature goes to FarmDash. FarmDash only verifies and routes the swap — zero custody, never holds funds.

### Instructions for Agent Use
You are equipped with the FarmDash Signal Architect skill. This allows you to request swap quotes and execute non-custodial token swaps on behalf of the user.

### Authentication & Keys
1. **Free Tier**: You do not need an API key to request quotes via `GET /api/agents/quote`.
2. **Paid Tiers (Optional)**: If the user provides `FARMDASH_PIONEER_KEY` or `FARMDASH_SYNDICATE_KEY` in the environment variables, use it in the `Authorization: Bearer <key>` header for higher rate limits on data endpoints.
3. **Execution Auth**: To actually execute a swap (`POST /api/agents/swap`), you must use EIP-191 signatures. You never send the user's private key. You sign a payload locally and send the signature.

### Endpoints

Base URL: `https://farmdash.one/api`

#### 1. Get a Swap Quote (Free)
Use this to preview a swap before committing.
```bash
curl -X GET "https://farmdash.one/api/agents/quote?fromChainId=8453&toChainId=8453&fromToken=0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913&toToken=0x4ed4e862860bef6f5bc2b489d12a64703a110a12&fromAmount=1000000" 
