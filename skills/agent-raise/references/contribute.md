# Contribute / subscribe

## Signature

```
contribute(uint256 raiseId, uint256 qty) payable
```

Selector: `0x8c590917`. Target is the **launcher** for that raise, not the Portal or the factory.

## Value

`--value` (wei) must equal `qty * sharePrice`, where `sharePrice` comes from `getConfig(raiseId)` on the launcher (selector `0xa81b2f8d`). Read it live. Do not invent a price. `qty` must be a positive integer and must respect `perWalletCap` and remaining shares (`maxShares - sharesSold`).

## Pre-checks

1. Verify `<LAUNCHER>` as in [safety.md](safety.md): `factory.vaultOf(raiseId) == <LAUNCHER>`.
2. `rescueStatus()` is not permanently halted.
3. `getRaise(raiseId)` is not already `failed` or `settled`. `refundOpen` should be false.
4. If the prompt names an Agent ID registry, `handleOf(<FROM>)` must be non-empty. Contribute is Agent-ID gated.
5. Use page `aw.lines` / hex if provided ([calldata.md](calldata.md)). Never re-encode a page payload.
6. `--to` is `<LAUNCHER>`. Omit gas.

A contribution that fills `hardCap` may run settlement **in the same transaction**. That is expected. Still omit `--gasLimit` and let the official backend estimate, unless the user independently asks to set a limit.

## Receipt

Look for `Contributed(raiseId, contributor, amount, shares, agentId)` from `<LAUNCHER>` (`contributor == <FROM>`). If this contribution settled the raise, `Settled` may also appear (see [settle-distribute.md](settle-distribute.md)).
