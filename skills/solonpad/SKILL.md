---
name: solonpad
description: |
  Launchpad + cross-pad aggregator on Arc (chainId 5042, native-USDC gas) and Robinhood Chain
  (chainId 4663) that an AI agent can run end-to-end with its own wallet — no account, no API key.
  (1) discover: incremental new-launch feed (/api/changes) and full index of every pad's pools on
  both chains (own launches plus Pons, pools.trade, Minara, Azex, …).
  (2) assess: one-call token factsheet with tri-state fields (/api/factsheet) and a calibrated,
  rule-based scoring table with evidence-chain output.
  (3) execute: direct contract calls for launching, curve trades and v4 swaps through one fee
  router, with mandatory safety rails (minOut, fee disclosure, receipt reconciliation) and a
  custom-error decoder for every revert.
  Use for: "new launches on Arc", "what pads exist on Robinhood Chain", "factsheet / score this
  Arc token", "launch a token on Arc", "trade a pool another launchpad created", "decode this
  revert", "agent-native launchpad".
version: "0.7.0"
license: MIT
metadata:
  author: solonlend
---

# SolonPad — an agent-native launchpad and pad aggregator

SolonPad is a token launchpad and **cross-pad aggregator** on **Arc** (chainId `5042`,
where native USDC is the gas token) and **Robinhood Chain** (chainId `4663`). It is built
agent-first: the machine interface is a pinned, source-verified contract + ABI bundle, and
the read API exists only as a convenience view that the skill teaches you to spot-check
against the chain. An agent brings its own wallet and calls the contracts; there is no
custody, no account and no API key.

This document is neutral and educational. It does not recommend any asset, and nothing in
it is a statement that any token is safe or a good purchase.

## Trust model — pin, then verify

The full machine interface (addresses, ABIs, error dictionary, runnable read-only tools,
verification checklist) lives in a public repository:

- **Repo:** `https://github.com/solonlend/solonpad-skill` — install by **pinning a commit
  hash**, never by trusting a live endpoint.
- `addresses.json` — every deployed address, per chain, with provenance notes.
- `VERIFY.md` — on-chain checks (factory wiring, locker immutability, fee caps, source
  provenance) to run once per session **before the first value-moving transaction**.
- `errors.json` — every custom-error selector across the deployed stack
  (`selector → { sig, contracts, hint }`) so any revert can be decoded offline.
- `tools/pad-read.mjs` — read-only reference tool (no keys): lists launches, deep-reads one
  token, computes a buy quote with the exact contract math, pins every figure to a block.

Core engine provenance: the curve engine is a port of a Sourcify `exact_match` verified
launchpad factory on chain 4663 (13/14 sources whitespace-identical; diff documented in the
repo). Instant launches use official Uniswap Liquidity Launcher instances with a 2-line,
documented fee diff.

## What an agent can do

| Capability | Mechanism |
|---|---|
| Launch a token | One transaction: instant Uniswap v4 launch (fixed 1B supply, pool-locked LP) or bonding-curve launch that auto-graduates into v4 |
| Discover the whole pad market | Indexer covers own launches **and** every other pad's pools on both chains; incremental cursor feed |
| Assess a token before touching it | One-call factsheet, tri-state fields, calibrated deduction table (see `references/agent-api.md`) |
| Trade any indexed pool | One fee-router contract wraps curve buys/sells and v4 swaps; only fork-probed open hooks are tradeable, closed hooks are display-only |
| Decode any revert | `errors.json` selector dictionary with battle-tested hints |
| Claim creator fees | Pull-payment escrow; only your own credited balance |

## Chain facts that will bite you

- On Arc, **native USDC is both gas and quote**. `msg.value` is 18-decimals; the ERC-20
  view of the *same balance* lives at a system address with **6 decimals**. Curve buys are
  `payable` — never approve/transfer the ERC-20 view for a curve buy. Cross-boundary
  amounts must be explicitly converted; sub-1e12 dust must neither be lost nor wedge a tx.
- Arc blocks land every ~510 ms; one confirmation is enough for curve state reads.
- On Robinhood Chain the quote asset varies per pool (native, tokenized-equity or meme
  quotes exist); read the pool's quote from the index, never assume.

## Agent loop (discover → factsheet → verdict → execute)

Read API base: `https://solonpad.fun`. Full endpoint and field reference, the scoring
table and the execution rails are in [`references/agent-api.md`](references/agent-api.md).

1. **Discover** — `GET /api/changes?chain=arc|rh&since=<cursor>`; poll every 15–60 s,
   cursor is opaque, HTTP 410 means re-init. Full list: `GET /api/launches?chain=`.
2. **Factsheet** — `GET /api/factsheet/{token}?chain=` → identity, age, market, fees,
   tradeable, structure, flags. **Tri-state semantics**: a field listed under
   `unavailable` is *unknown, never zero*; `notApplicable` means the token cannot have it.
3. **Verdict** — deduction table over returned fields only; report coverage (rows
   executed ÷ 8) next to the score; output every deduction as
   `field → measured value → points`; close with "rule-based read of indexed data, not
   advice".
4. **Execute** — `[FINANCIAL EXECUTION]`: requires the principal's explicit
   authorization. Mandatory rails: refuse while `tradeable.value != true`; itemize every
   fee before trading; **never send `minOut = 0`**; approve exact amounts; reconcile the
   receipt against the estimate (v4 swaps can partial-fill and refund — check amounts
   received, not tx success).

## Fees an agent should price in

All fees are disclosed in-band (factsheet `fees` group) and in the pinned repo:
launch fee (flat, owner-adjustable — re-read on chain), curve fee 1%, optional
creator tax, a snipe tax in the first window after a curve launch, a 0.5% router
interface fee on aggregated trades, LP fees on v4 pools, and network gas.

## Premium data plane (optional, pay-per-call)

Deeper data is sold over **x402** (HTTP 402 → sign one EIP-3009 USDC authorization →
data): verdict bundles, 50-token batch factsheets, deep OHLCV, 1000-event change pages,
and a prepaid multi-chain RPC credit pack. No account — the agent's wallet is the
account. Prices are pinned client-side in the repo; an agent should never sign an amount
it did not pin, and never re-sign after an uncertain outcome.

## When NOT to use this skill

- Chains other than Arc (5042) and Robinhood Chain (4663) for **data** — this index does
  not cover them.
- Cross-chain meme analytics, smart-money tracking or holder chip analysis — other
  skills cover that; this skill does not improvise those fields.
- You expect custody, a hosted service or an API key — there is none; you run everything.

## Restrictions

Not available to persons or entities in the United States, China, Japan, or sanctioned
jurisdictions. Bypassing via VPN, proxy or direct contract call is a knowing violation.
Contracts are unaudited unless the pinned repo states otherwise; nothing here is
investment advice, and no asset indexed by the aggregator is endorsed by being indexed.
