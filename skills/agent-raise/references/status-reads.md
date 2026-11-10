# Status reads and receipts

Use `eth_call` on chain id 56. Do not send a transaction to read state. Selectors are in [abi.md](abi.md).

## Factory / Portal (from the page prompt)

| Call | Use |
|------|-----|
| `factory.raiseCount()` | Number of raises |
| `factory.vaultOf(raiseId)` | Launcher address for an id |
| `factory.raiseOfVault(launcher)` | Inverse lookup |
| `factory.portal()` | Must equal `<PORTAL>` |
| `factory.implementation()` | Compare only if the prompt gives an expected implementation |
| `factory.agentOf(account)` | Optional Agent ID view if present |
| `Portal.getLauncher(launcher)` | `{ launcherFactory }` must equal `<FACTORY>` |
| `Portal.launcherFactoryMultiplier(factory)` | Creation enablement |
| `Portal.SALT_LOCK_FEE()` | Required create `value` |
| `Portal.getSaltLock(salt)` | Salt availability |

## Launcher

| Call | Use |
|------|-----|
| `getRaise(raiseId)` | Creator, beneficiary, token, pool, deadline, `closed` / `settled` / `failed`, `hardCap`, `totalRaised`, `contributorCount`, `distCursor`, `distributed`, `beneficiaryOwed`, title, meta |
| `getConfig(raiseId)` | `sharePrice`, `maxShares`, `perWalletCap` |
| `status(raiseId)` | Enum: `0 LIVE`, `1 FILLED`, `2 SETTLEABLE`, `3 SETTLED`, `4 REFUNDING`, `5 EMERGENCY` |
| `sharesSold(raiseId)` / `sharesOf(raiseId, account)` | Progress and the user's shares |
| `contributionOf(raiseId, account)` | User principal (wei) |
| `tokensOwed(raiseId, account)` / `tokensSent(raiseId, account)` | Claimable sale tokens |
| `canSettle` / `settleableAt` / `graceEndsAt` / `refundOpen` / `meetsLaunchFloor` | Lifecycle gates |
| `settlementSplit(raiseId)` | `(fee, creatorCash, poolQuote)` |
| `launched` / `launchedToken` / `launchedPool` | Post-settle token and pool |
| `factory` / `vaultRaiseId` / `rescueStatus` / `FEE_BPS` / `SETTLE_GRACE` / `SETTLE_PUSH` | Provenance and constants (always read live) |

Progress can be reported as `totalRaised / hardCap` and `sharesSold / maxShares`. Do not invent USD values.

## Distributor (if `<DISTRIBUTOR>` is in the prompt)

| Call | Use |
|------|-----|
| `FACTORY()` | Must equal `<FACTORY>` |
| `pendingRequestOf(launcher)` | `(pending, requestId)` |
| `budgetOf(launcher)` | Remaining Trigger budget |
| `reserveFor(remaining)` | Estimated reserve for remaining contributors |
| `BATCH()` | Batch size |

## After a transaction

Parse logs by `address` (must be the Portal, factory, launcher, or distributor you already verified) and `topic0` from [abi.md](abi.md).

Minimum expected events:

- Create: `FlapNewLauncherCreated`, `VaultCreated`, `RaiseCreated`
- Contribute: `Contributed` (plus `Settled` if the cap was filled)
- Settle: `Settled` (distributor events may also appear)
- Refund: `Refunded`
- Claim tokens: `TokensSent`
- Restart: `Scheduled` and/or `Funded`

`BROADCASTED` with a `txHash` from `baw` means submitted, not necessarily confirmed. `PENDING_CONFIRMATION` means the user must confirm in the Binance App. Re-read state and, when possible, `baw wallet tx-history --tx <hash> --json`.
