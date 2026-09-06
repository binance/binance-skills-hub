---
name: deposit-preflight
description: |
  Use before any `defi deposit`. Resolves the contract a deposit would actually enter,
  verifies that contract against the chain directly, and reports a three-valued verdict
  so that an unverifiable product is never recorded as a verified one. Covers delisted
  products, protocol-identity mismatch, value leakage, exit-path presence, rate against
  the pool's own history, and pool capacity.
version: 0.1.0
license: MIT
---

# DeFi Deposit Pre-Check

[security.md](../binance-agentic-wallet/references/security.md) makes a security procedure
mandatory before a swap: audit the target token, present every risk item, obtain explicit
acknowledgement, and never skip silently.

No equivalent procedure exists before a **DeFi deposit**. This skill is that procedure.

---

## When to run

Before constructing any `baw defi deposit` command. Every step below runs against a
non-broadcasting simulation, so the sequence costs nothing and moves nothing.

---

## §1 Procedure

### Step 1 — Establish that the product still accepts deposits

```bash
baw defi investment-info --investmentId <id> --json
```

Read `investable`.

`investment-list` does not return this field, so a delisted product remains visible in the
listing — including at the top when the listing is sorted by APY. Attempting a deposit on one
returns `INVESTMENT_NOT_INVESTABLE`.

- `investable: false` → stop. Report the product as closed to new deposits.
- field absent → stop. Do not infer that a missing field means open.

Retain `assetTokenList[0].tokenAddress`; the listing does not carry it.

### Step 2 — Simulate without broadcasting

```bash
baw defi preview --action deposit --investmentId <id> \
  --tokenAddress <asset> --amount <amount> --json
```

Read `feeAndContract.interactWith.address`. **This is the contract the deposit would call, and it
appears nowhere in `investment-list`, where `poolAddress` is returned as `null`.**

If the preview fails with `INSUFFICIENT_BALANCE`, the check has not run. Report it as not tested
rather than as a failure of the product — see §2.

### Step 3 — Ask the chain what that contract is

Query the address directly through a public node for the chain in question, rather than through
the source that made the claim:

```bash
# symbol() = 0x95d89b41, name() = 0x06fdde03
curl -s -X POST <public-rpc> -H 'content-type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"eth_call",
       "params":[{"to":"<interactWith>","data":"0x06fdde03"},"latest"]}'
```

Also call `eth_getCode` — an address holding no bytecode is not a contract.

Compare the decoded `name()` / `symbol()` against `protocolName` and `investmentName` from Step 1.

- On-chain identity names a **different protocol** → stop, and report both names.
- Contract returns **no** `name()` or `symbol()` → the identity was not established. A vault is
  under no obligation to implement either, so this is **not** evidence of a mismatch. Report it as
  not tested.
- Names agree → record what the chain returned, verbatim.

One protocol commonly operates several pools for the same asset at materially different rates.
Establishing which contract is being entered is the point of this step.

### Step 4 — Check the simulated balance change

The preview response contains `balanceChange` with a `valueUsd` on each leg. Compare the value
leaving against the value of the position received. An unexplained shortfall beyond ordinary
slippage should stop the deposit.

### Step 5 — Confirm an exit path exists

```bash
baw defi preview --action redeem --investmentId <id> \
  --tokenAddress <asset> --ratio 1 --json
```

With no position open, a wired-up product returns `INVESTMENT_NO_POSITION` — the call reached the
position check, so the withdrawal path exists. Any other error means the exit could not be
confirmed.

This establishes structure only. It does not guarantee a future exit clears under stress.

### Step 6 — Compare the rate against the pool's own record

Where an independent record of the same pool exists, compare the advertised rate against that
pool's own history rather than against other pools. A rate far above a pool's own long-run
baseline warrants explicit mention to the user before any deposit.

Match on rate agreement. Do not match on TVL: independent sources define it differently, and
entries routinely agree on rate while differing substantially on TVL.

### Step 7 — Check capacity

Compare the deposit against independent pool size. A deposit large enough to become a significant
share of a pool changes the rate it was selected for.

---

## §2 Verdicts are three-valued

| Verdict | Meaning |
|---|---|
| Verified | every step completed and agreed |
| Failed | a step completed and disagreed |
| **Not tested** | a step could not run — no `name()`, asset not held, node unreachable |

The third state is required. Reporting an unverifiable product as failed misstates what was
observed; reporting it as verified defeats the procedure. Report it as not tested, and do not
proceed on it.

**Never silently skip a step.** If a step cannot run, say which one and why, and require explicit
acknowledgement before continuing — matching the handling that `security.md` already requires for
swaps.

---

## §3 What this does not establish

A contract that names itself consistently has not thereby been audited. This procedure checks
identity, listing status, value conservation, exit structure, rate context and capacity. It is not
a security audit, it does not assess a protocol's solvency or code, and it makes no statement about
whether any product is suitable for any user.

---

## Reference implementation

An implementation of this procedure for BNB Smart Chain, including the three-valued verdict and an
offline HTML report, is available at
[github.com/ranimth0707/nullius](https://github.com/ranimth0707/nullius) (MIT).
