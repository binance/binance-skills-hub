---
name: paylink
description: |
  Use when the user wants to tip or pay an AI agent / Agent ID holder by their name.ai handle
  on BNB Smart Chain, register their own PayLink profile bio, or read the PayLink on-chain tip
  feed and per-holder stats. Requires the binance-agentic-wallet skill (baw CLI) signed in.
version: 0.1.0
license: MIT
---

# PayLink — tip any name.ai on BNB Smart Chain

PayLink is a non-custodial payment primitive for the Agentic Wallet ecosystem: every Agent ID
(`name.ai`) becomes a payment address. `tip(handle, message)` resolves the holder through the
official SPACE ID Agent ID registry and forwards BNB **directly to the recipient in the same
transaction** — the contract never holds funds. Profiles, tip messages and per-holder stats are
on-chain and public.

- Live app: https://perasyudha.github.io/paylink/
- Source (MIT, verified): https://github.com/perasyudha/paylink
- PayLink contract (BSC, chainId 56): `0x7C5591E85D09a65F774498d5E6E3Bb1b7542177a`
- Agent ID registry (official, read-only): `0x60B9262456dE011F7d15a54CdD8c48bAaa8B022F`

Security model: no owner, no admin, no fees, no upgrades, no token approvals (native BNB only);
self-tips and unknown handles revert. Every asset operation MUST be shown to and confirmed by the
user — never bypass, batch, or automate confirmation.

## Tip a name.ai handle

1. Normalize the handle: lowercase, strip `.ai` (`Yudha.ai` → `yudha`).
2. Resolve read-only before anything else: `eth_call` to the registry's `ownerOfHandle(string)`
   (selector `0x1da94fb4`) via public RPC `https://bsc-dataseed.binance.org`, or
   `baw wallet resolve-domain --name <handle>.ai --binanceChainId 56 --json`.
   Zero address or error → STOP, tell the user the name is not registered. Show the resolved
   address in full.
3. Encode `tip(string handle, string message)` (selector `0x222c675d`); message ≤140 bytes,
   optional. Value = tip amount in wei (0.001 BNB = `1000000000000000`).
4. `baw contract-call preview --binanceChainId 56 --from <user AW address> --to 0x7C5591E85D09a65F774498d5E6E3Bb1b7542177a --value <wei> --inputData <hex> --json`
5. Show the user: recipient name + full resolved address, human-readable amount, message, gas,
   and any `risks` from the preview. Ask for explicit confirmation.
6. Only on a clear "yes": `baw contract-call execute --requestId <id> --json`. Report the txHash.
   Relay CLI errors exactly; never retry a failed preview with mutated parameters.

## Register / update your own profile bio

`register(string bio)` (selector `0xf2c298be`, ≤160 bytes), value 0. Caller must hold an Agent ID
(registry `balanceOf > 0`). Same preview → confirm → execute flow. The bio is public on-chain.

## Read feed / stats (no wallet needed)

Read-only `eth_call` with the ABI in `references/abi.json`:
- `profiles(address)` → (received wei, tips count, bio)
- `getFeed()` → (Tip[24] ring buffer, feedCount); newest at `(feedCount-1) % 24`
- `feedCount()` → total tips ever

## Rules

- Never send funds without the user's explicit per-transaction confirmation.
- Never fabricate addresses; only registry resolution or the user's own input.
- PayLink is payment software, not an investment product; never promise returns.
- Do not use this skill to enumerate or expose other people's wallet addresses as a lookup
  service; resolution exists to make payments, and the UI shows addresses only in the payment
  confirmation flow.