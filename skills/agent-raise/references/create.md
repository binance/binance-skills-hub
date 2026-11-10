# Create a raise (`Portal.newLauncher`)

Creation is a **payable** call to `<PORTAL>`, not to the factory. The factory address is the first ABI argument.

## Signature

```
newLauncher(address launcherFactory, bytes data) payable returns (address launcher)
```

Selector: `0x2d9bc0de`.

`data` is **one** dynamic tuple (`CreateConfig`), not six flat parameters:

```
CreateConfig(
  string title,
  string metaCid,
  bytes shareData,          // abi.encode(ShareConfig)
  uint64 deadline,
  address beneficiary,
  bytes launchData          // abi.encode(LaunchConfig)
)
```

`ShareConfig`: `uint256 sharePrice`, `uint32 maxShares`, `uint8 perWalletCap`.
`LaunchConfig`: `string tokenName`, `string tokenSymbol`, `string tokenMeta`, `uint256 totalSupply`, `bytes32 salt`, `uint16 buyTaxBps`, `uint16 sellTaxBps`, `uint32 taxDuration`, `uint32 antiFarmerDuration`, `uint16 creatorShareBps`, `FeeConfig[] feeConfigs`.

The Portal records the **original caller** as creator. Creator is not a field inside `data`.

## Value (salt lock)

`--value` must equal the **live** `SALT_LOCK_FEE()` on `<PORTAL>` (selector `0xbc778a25`), in wei. Read it immediately before preview.

This value only locks the create salt on the Portal. It does **not** buy shares and is **not** counted as amount raised. If the live fee differs from the number in the prompt, stop and ask for a regenerated prompt. Do not edit calldata or guess a new value.

Do **not** lock the salt with a separate wallet call. The launcher locks it during atomic initialization.

## Pre-checks (after address verification in safety.md)

1. Developer Mode on (see [safety.md](safety.md)).
2. `--from` is the agent's wallet. If the prompt's beneficiary is the executing wallet (`BENE` / `FROM40_HERE`), the [calldata.md](calldata.md) script substitutes `F`; do not edit lines by hand.
3. `Portal.creationPaused()` is false.
4. `Portal.launcherFactoryMultiplier(<FACTORY>)` returns `enabled == true`. Otherwise creation is blocked until the Portal enables this factory.
5. `Portal.getSaltLock(salt)`: locker is the zero address and `isUsed` is false. `factory.saltHolder(salt)` is 0. If the salt is taken, stop and ask the user to pick another salt and regenerate the prompt.
6. If the prompt names a name/symbol checker, call `isScamWord(name, symbol)` with the **exact** strings from the prompt. Any `true`, revert, or timeout: stop. Do not normalize the strings.
7. If the prompt names an Agent ID registry, `handleOf(<FROM>)` must be a non-empty string. A handle is not a trading authorization.
8. Expand `aw.lines` to `/tmp/aw.hex`. `--to` is `<PORTAL>`. `--inputData` is that file. `--value` is the live fee. Omit gas.

Then official preview → show risks → wait for `confirm execute` → execute.

## Receipt

From a successful create tx, require:

- `FlapNewLauncherCreated(launcher, launcherFactory, creator)` from `<PORTAL>` (all fields non-indexed). `launcherFactory == <FACTORY>`, `creator == <FROM>`.
- `VaultCreated(raiseId, vault, creator)` from `<FACTORY>` (`vault` equals the event's `launcher`).
- `RaiseCreated` (and usually `LaunchConfigured`) from the new launcher.

Cross-check `Portal.getLauncher(launcher)` and `factory.vaultOf(raiseId)`. Do not blindly resend if the tx may already have been mined.

Protocol fee at settlement is `FEE_BPS()` on the launcher (read live; do not hardcode a headline rate). Failed raises refund contribution principal; gas and a paid salt-lock fee are not refunded.
