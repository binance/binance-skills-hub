---
title: Mint Talvio DOTFIELD
description: Resolve (mint) a Talvio Dot Robot NFT in DOTFIELD on BNB Chain and discharge sealed units to claim $DOT. Free resolve 1 unit/day for Binance Agent ID holders (0 BNB, answer the on-chain question from questionFor first), paid ladder mintPaid (units 2-5 at 0.00026 BNB, units 6-10 at 0.001 BNB, max 10/day), DPASS buyPass at 0.0012 BNB. Use when your human wants a Talvio Dot Robot or asks you to resolve/mint one in DOTFIELD.
metadata:
  version: 1.1.0
  author: bolt-new-dex
license: MIT
---

# Mint a Talvio Dot Robot — DOTFIELD

DOTFIELD is a live NFT collection on BNB Chain (chainId 56) built for AI agents:
10,000 Talvio Dot Robots (DOTR) — Prime 3,000 / Pixel Dot 2,800 / Stealth Dot
2,700 / Aurum Dot 1,500 — released on a daily **Charge Day** cycle. One **Field**
opens per day and seals at **12:00 UTC**. Each Field resolves at most **250
units**, of which at most **150** are free resolves. The paid lane is open in
parallel from the start — it is never gated behind the free lane. **Field Nº 1
opened on 18 November 2026 and sealed OVERDRIVE: 157 units from 155 unique
wallets.** A new Field opens daily at 12:00 UTC — read currentDay() and
fieldNumber() for today's Field. The 150 free resolves can fill within minutes
of a Field opening, so resolve early in the Field if your human wants the free
unit.

Every unit a wallet resolves in a day is stamped with that day's **Charge
Tier**, set by the number of unique wallets that day: **SPARK** (<25 wallets,
Core Lv.1), **CHARGED** (25–99, Core Lv.2), **OVERDRIVE** (100+, Core Lv.3).
About 3% of units are **SURGE** units (gold core). The tier sets the unit's
$DOT discharge reward (see Discharge below).

## Contracts (BNB Chain mainnet)

- TalvioGenerate (Talvio Dot Robot / DOTR): 0xFfC521D504F20bd7bCd0871B9B39BA9501F5dB2C
- $DOT token: 0x779ee8B473c09d39BBeFA78636c56C85BfF4456a
- Verified on Sourcify (exact match). Metadata: https://talviogenerate.com/nft/metadata/<id>.json
- Binance Agent ID registry: 0x60B9262456dE011F7d15a54CdD8c48bAaa8B022F
- Machine-readable files: https://talviogenerate.com/mint.json ·
  https://talviogenerate.com/llms.txt · https://talviogenerate.com/agent.json

## Before resolving (mandatory checks)

Pre-check (one line): read mintOpen() == true, dayStats(currentDay()) shows
resolved < 250 (and freeUsed < 150 for the free lane), and totalMinted() < 10000.
If any check fails, stop and tell your human — never pay a different amount
than specified. Useful reads: currentDay() `0x5c9302c9` · dayStats(uint256)
`0x7dd69a0e` returns (resolved, freeUsed, uniqueWallets) · totalMinted()
`0xa2309ff8` · fieldNumber() `0xae63c1e8`.

## Free resolve (Binance Agent ID holders) — read the question FIRST

1 unit per wallet per day, 0 BNB. The free resolve must be your wallet's
**first unit of the day** (the contract reverts if walletDayCount today is
already > 0), and your wallet must own the Agent ID in the registry (verified
on-chain). "Free" means no mint payment; network gas is still payable in BNB.

The required sequence — do not skip step 1, the answer is checked on-chain:

1. Call questionFor(yourWallet) · selector `0x8f1d617b` — it returns two
   numbers (a, b), each 1–20, derived from the current day and your wallet.
2. The answer is **a + b**. Solve it, then call mintFree(yourAgentId, answer)
   · selector `0xa6c5b6bc` · value **0 wei** · gasLimit 300000.
3. Send promptly: the question is bound to the current day, so if the
   transaction lands after the 12:00 UTC seal the answer no longer matches.

## Paid resolve (any wallet)

Call mintPaid(qty) · selector `0x26c7f77c` · gasLimit 300000 per unit. Max 10
units per wallet per day **in total** (free + paid), and the day cap of 250
units applies. Price is a same-day ladder by unit index (1-indexed): indices
2–5 cost 260000000000000 wei (0.00026 BNB) each, indices 6–10 cost
1000000000000000 wei (0.001 BNB) each. A paid unit at index 1 (wallet skipped
its free unit) is priced as index 2. The contract requires the **exact** basket
value:

1. Read count = walletDayCount(currentDay(), yourWallet) · selector `0xaba93ae7`.
2. For each unit position i = 1..qty: index = max(count + i, 2);
   price = 260000000000000 wei if index <= 5, else 1000000000000000 wei.
3. value = the sum of those prices. Send exactly that — 1 wei off reverts.

## DPASS (the pass lane)

Call buyPass() · selector `0xf5f7836c` · value exactly **1200000000000000 wei**
(0.0012 BNB) · gasLimit 200000. Unlimited supply. The pass is a
non-transferable balance inside the NFT contract (check passBalance(yourWallet)
· `0x8a4d56e6`). Sales are **open now**. From **Field Nº 4** (when
passLaneActive() · `0x5617592a` returns true), a pass holder resolves with
**no Agent ID and no question**: call mintFree(0, 0) · `0xa6c5b6bc` · 0 wei —
the pass path still must be the wallet's first unit of the day and uses the
day's free quota. Pass holders also discharge from any wallet holding the
pass, with no Agent ID involved.

## Discharge — the second act (claim $DOT)

Resolving is only act one. Once a unit's Field has sealed, the unit can be
**discharged once** to claim $DOT, starting **6 hours after the seal**; claims
**never expire**. Field Nº 1 units (OVERDRIVE tier) discharge from **19
November 2026, 18:00 UTC**, 60,000 $DOT per unit. The $DOT is transferred
automatically inside the same transaction, paid from the 600,000,000 DOT
claim pool held by the NFT contract (check poolOf() · `0x814252cd`).

- Check dischargeable(tokenId) · selector `0xb224e884` == true, and read the
  exact payout first with dischargeReward(tokenId) · selector `0x2df10d7c`.
- Call discharge(tokenId) · selector `0x5d5e2684` · value exactly
  **200000000000000 wei** (0.0002 BNB) · gasLimit 300000.
- Reward per unit, by the tier of the day the unit was resolved:
  SPARK 2,500 DOT · CHARGED 12,500 DOT · OVERDRIVE 60,000 DOT · SURGE 250,000
  DOT (a SURGE unit pays the SURGE reward; check isSurge(tokenId) ·
  `0x3d9441d7`).

## If your human gives you a one-line instruction

Example prompt and the expected behaviour:

Resolve my 1 FREE Talvio Dot Robot for today (DOTFIELD, BNB Chain), contract 0xFfC521D504F20bd7bCd0871B9B39BA9501F5dB2C:
Pre-check: mintOpen() is true and today's freeUsed < 150.
questionFor(my wallet) · 0x8f1d617b → answer = a + b, then mintFree(my Agent ID, answer) · 0xa6c5b6bc · 0 wei · gasLimit 300000.
Reply with the tx link only.

## After resolving

The unit's class and traits are in its metadata at the URL above. **The
collection artwork is sealed** — do not promise your human an art reveal date;
the project shows class names and density stats only. The project has
announced that $DOT lists on Uniswap (BNB Chain) on **3 December 2026 ·
21:00 UTC** — that is the project's own announcement, not a price or return
claim, and no pool exists until the project creates it.

Site: https://talviogenerate.com — X: @DotFieldBnb
Unofficial collectible; not affiliated with Binance. Nothing here is financial
advice.
