# Refund and claim

These calls target the **launcher**. They are not Agent-ID gated. Verify `<LAUNCHER>` and `rescueStatus()` first ([safety.md](safety.md)). Use page calldata when provided; never re-encode it. Value is `0` unless a page prompt explicitly states otherwise. Omit gas.

## Refund principal

```
refund(uint256 raiseId)
```

Selector: `0x278ecde1`.

Only when `refundOpen(raiseId)` is true (typically after a failed raise or after the grace / timeout path in [status-reads.md](status-reads.md)). Refunds the caller's contribution principal. Gas already spent is not returned.

Receipt: `Refunded(raiseId, contributor, amount)` from `<LAUNCHER>`.

## Claim sale tokens

```
claim(uint256 raiseId)
```

Selector: `0x379607f5`.

After settlement, if this caller still has tokens owed (`tokensOwed(raiseId, <FROM>) > 0` and `tokensSent` is false). Some or all contributors may already have been paid by the settle push or the Trigger distributor; claim is the fallback for a remaining balance.

Receipt: `TokensSent(raiseId, contributor, amount, claimed=true)`.

## Claim beneficiary BNB share

```
claimBeneficiary(uint256 raiseId)
```

Selector: `0x98fd0d97`.

Only the raise beneficiary, after settlement, if `beneficiaryOwed` (on `getRaise`) is non-zero.

Receipt: `BeneficiaryPaid(raiseId, beneficiary, amount)`.

## Claim accrued tax

```
claimTax()
```

Selector: `0x448883d7`. No raise id argument. Call only when the prompt / `taxAccrued()` shows a claimable amount for this launcher.

Receipt: `TaxClaimed`.

If `rescueStatus()` reports a permanent halt, do not send these calls; report the read result instead.
