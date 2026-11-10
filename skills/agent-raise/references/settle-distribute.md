# Settle and distribution

## Settle

```
settle(uint256 raiseId)
```

Selector: `0x8df82800`. Target: `<LAUNCHER>`. Not Agent-ID gated. Value `0`. Omit gas.

Pre-checks: address verification, `rescueStatus()` not permanently halted, `canSettle(raiseId) == true`. Read `settleableAt` / `meetsLaunchFloor` if you need to explain why it is or is not settleable. If `canSettle` is false, do not send.

On a successful settle the launcher pays protocol fee (`FEE_BPS()`, read live), optional beneficiary cash, and seeds the pool. Sale tokens are later delivered to contributors.

Receipt: `Settled(raiseId, token, pool, fee, creatorCash, poolQuote, poolTokens)` from `<LAUNCHER>`.

## V8.1 auto-distribution

In protocol version 8.1, `settle` itself registers the first Flap Trigger request (the launcher funds the distributor during settle). There is **no** routine user "start distribution" transaction.

If Trigger registration fails, settle can still succeed. The distributor may emit `AutoScheduleFailed` or `OutOfBudget`. That is a distribution stall, not a failed settle.

`SETTLE_PUSH()` (read live on the launcher) is how many contributors are paid inside settle. The rest are pushed in batches of `BATCH()` (read live on `<DISTRIBUTOR>`).

## Restart only if stalled

A stall means: `getRaise` shows `settled == true`, `distCursor < contributorCount`, and `pendingRequestOf(<LAUNCHER>)` is `(false, 0)`. Unknown / failed reads are not a stall — do not restart.

Permissionless restart (value `0`, target `<DISTRIBUTOR>`):

```
schedule(address launcher)     // selector 0x316bef98
```

or

```
fund(address launcher) payable   // selector 0x23024408, msg.value may be 0
```

A zero-value `fund` credits nothing but will try to auto-schedule when the raise is settled, tokens remain, and nothing is pending. Use the page prompt's preferred method when one is given.

Receipts: `Funded` and/or `Scheduled`. `OutOfBudget` means the Trigger budget is insufficient; report it, do not loop.

## Manual fallback

```
distribute(uint256 raiseId, uint256 maxCount)
```

Selector: `0x7625391a`, target `<LAUNCHER>`. Permissionless push of up to `maxCount` remaining contributors. Use only as a fallback when the prompt asks for it or Trigger restart cannot proceed.

## Do not

- Do not add a "start auto-distribution" step to a normal successful settle.
- Do not re-encode calldata; do not set `--gasLimit` unless the user explicitly asks.
