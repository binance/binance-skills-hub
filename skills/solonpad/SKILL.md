---
name: solonpad
description: |
  Launchpad on Arc (chainId 5042, native-USDC gas) where every coin's 1% trade fee is split
  six ways by a hard-coded on-chain constant, and the holders' share buys real tokenized
  stock (NVDA by default) delivered to holders daily — no account, no API key: the agent
  brings its own wallet and calls the contracts.
  (1) discover: /api/v3/coins and per-coin round, reward and fee endpoints.
  (2) assess: on-chain proof of reserves on two chains, pinned codehashes, a 26-check
  read-only verifier, and a 421-entry custom-error dictionary for decoding any revert.
  (3) execute: launch, trade (exact fee itemization via an on-chain quoter), claim holder /
  creator / Desk / staking dividends, buy or redeem stock tokens — each with mandatory
  safety rails (minOut, fee disclosure, receipt reconciliation).
  Use for: "launch a coin on Arc", "coin that pays holders in stock", "trade a SolonPad
  coin with exact fees", "claim my stock dividends", "verify SolonPad reserves",
  "decode this revert", "agent-native launchpad".
version: "1.1.0"
license: MIT
metadata:
  author: solonlend
---

# SolonPad — the launchpad that pays its holders in stock

SolonPad is a launchpad on **Arc** (Circle's L1, chainId `5042`, where native USDC is the
gas token). Its current product, **V3**, splits every coin's 1% trade fee on-chain into six
fixed buckets; the holders' bucket buys real tokenized stock (NVDA by default, minted 1:1
on Arc against reserves held on the stock token's home chain) and delivers it to holders
daily. It is built agent-first: the machine interface is a pinned, source-verified
contract + ABI bundle, and the read API is a convenience view the skill teaches you to
spot-check against the chain. There is no custody, no account and no API key.

This document is neutral and educational. It does not recommend any asset, and nothing in
it is a statement that any token is safe or a good purchase.

## Trust model — pin, then verify

The full machine interface lives in a public repository:

- **Repo:** `https://github.com/solonlend/solonpad-skill` — install by **pinning a commit
  hash**, never by trusting a live endpoint.
- `addresses.json` — every deployed address with pinned runtime codehashes (52 Arc
  contracts, all Sourcify full matches).
- `tools/verify.mjs` — a read-only verifier (26 on-chain checks: codehashes, the fee-split
  constant replayed on a real fee event, governance timelock and thresholds, and
  proof-of-reserves on both chains). Run once per session **before the first value-moving
  transaction**.
- `errors.json` — 421 custom-error selectors (`selector → { sig, contracts, hint }`) so
  any revert can be decoded offline.
- `tools/pad-read.mjs` — read-only reference tool (no keys): lists coins, deep-reads one
  coin with an exact fee-itemized quote, and reads stock reserves on both chains.

## What an agent can do

| Capability | Mechanism |
|---|---|
| Launch a coin | One transaction, no launch fee: fixed 1B supply, all pool-locked; the creator receives a transferable NFT carrying the 10% creator fee stream |
| Trade with exact fees known | An on-chain quoter simulates the exact router path; the 1% fee and its six-way split are a contract constant with no setter |
| Earn as a holder | The 57.5% holders' share buys tokenized stock, pushed to wallets daily above a $2 threshold, claimable below it — no staking step, no maturity |
| Buy / sell / redeem stock tokens | One-call stock purchases from Arc USDC (25 bps fee), sells back, or redemption of the underlying to its home chain |
| Verify before trusting | Proof of reserves (token supply vs vault balance on two chains), pinned codehashes, timelocked governance — all checkable read-only |
| Decode any revert | 421-entry selector dictionary with battle-tested hints |

## Chain facts that will bite you

- On Arc, **native USDC is both gas and quote**. `msg.value` is 18-decimals; the ERC-20
  view of the *same balance* lives at a system address with **6 decimals**. Never add the
  two views; convert cross-boundary amounts explicitly.
- V3 pools are **full-fill only**: a swap that cannot fill entirely reverts; partial fills
  do not exist.
- The 1% dividend fee is charged by the registered hook on the registered pool only;
  anyone can open an unregistered pool for the same coin where trades pay no dividend.
- The public Arc RPC limits `eth_getLogs` windows and rate-limits bursts; page log scans.

## Read API (`/api/v3/*`)

Base: `https://solonpad.fun`. Indexer-backed convenience view; every response is wrapped
in an envelope with `asOfBlock` and staleness flags. Amounts are base-unit decimal
strings. Endpoints cover: coins, per-coin reward rounds, per-account holder credits and
push schedule, creator fees, payout reports (each stock-buying round with every
transaction step), revenue by bucket, proof-of-reserves (with the verification command for
each number), oracle and pool prices, stock buy/sell quotes, orders, staking stats, and
Desk cards. The skill's rule: a mismatch with the chain means trust the chain and stop
using the endpoint for value decisions. Full field tables live in the pinned repo
(`AGENT-GUIDE.md`).

## Execution rails — financial actions

Moving value requires the principal's explicit authorization; otherwise stay read-only.
Mandatory rails: quote first and itemize every fee line before signing; always set
`minOut`, `maxIn` and a deadline; approve exact amounts; reconcile the receipt against the
quote; on revert, decode the selector with `errors.json`. When US markets are closed,
stock orders still fill at the live venue pool price — the `minOut` you sign is the only
price floor, and the skill requires disclosing that to the principal.

## When NOT to use this skill

- Chains other than Arc (5042) — this skill launches and indexes on Arc only.
- Cross-chain meme analytics, smart-money tracking or holder chip analysis — other skills
  cover that; this skill does not improvise those fields.
- You expect custody, a hosted service or an API key — there is none; you run everything.

## Restrictions

Not available to persons or entities in the United States, China, Japan, or sanctioned
jurisdictions. Bypassing via VPN, proxy or direct contract call is a knowing violation.
Contracts are unaudited unless the pinned repo states otherwise; nothing here is
investment advice, and no asset is endorsed by being documented. The repo's state table
says plainly what is live, what is closed, and what was retired — the skill never
describes a surface it has not measured.
