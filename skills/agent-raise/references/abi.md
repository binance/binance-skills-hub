# ABI selectors and event topics

Computed with Foundry `cast sig` / `cast sig-event` against the AgentRaise Beacon V8 / V8.1 ABI (distributor V8.1 included). Names and types only; indexed flags do not change topic0.

## Functions

| Selector | Signature |
|----------|-----------|
| `0x2d9bc0de` | `newLauncher(address,bytes)` |
| `0xbc778a25` | `SALT_LOCK_FEE()` |
| `0xa42ee793` | `launcherFactoryMultiplier(address)` |
| `0x5a90fc09` | `getSaltLock(bytes32)` |
| `0x12522885` | `getLauncher(address)` |
| `0xbd12dd64` | `creationPaused()` |
| `0x8c590917` | `contribute(uint256,uint256)` |
| `0x8df82800` | `settle(uint256)` |
| `0x278ecde1` | `refund(uint256)` |
| `0x379607f5` | `claim(uint256)` |
| `0x98fd0d97` | `claimBeneficiary(uint256)` |
| `0x448883d7` | `claimTax()` |
| `0x7625391a` | `distribute(uint256,uint256)` |
| `0xf3634a32` | `markFailed(uint256)` |
| `0x316bef98` | `schedule(address)` |
| `0x23024408` | `fund(address)` |
| `0x6bc2f61f` | `pendingRequestOf(address)` |
| `0x6542ed86` | `reserveFor(uint256)` |
| `0x7865e71f` | `budgetOf(address)` |
| `0x2dd31000` | `FACTORY()` |
| `0x6425666b` | `portal()` |
| `0x5c60da1b` | `implementation()` |
| `0xa66765a0` | `raiseCount()` |
| `0xdaa0bfba` | `vaultOf(uint256)` |
| `0x966ec474` | `raiseOfVault(address)` |
| `0x8854a0ff` | `agentIdRegistry()` |
| `0xac3c0e30` | `agentOf(address)` |
| `0xc6a9afa5` | `meetsLiveCreateFloor(uint256,uint16,uint256)` |
| `0x2f907c74` | `saltHolder(bytes32)` |
| `0xf2239487` | `isScamWord(string,string)` |
| `0xc50a1514` | `handleOf(address)` |
| `0x467c64ba` | `getRaise(uint256)` |
| `0xa81b2f8d` | `getConfig(uint256)` |
| `0x42d21ef7` | `status(uint256)` |
| `0xdf69433b` | `canSettle(uint256)` |
| `0x9df5ad95` | `settleableAt(uint256)` |
| `0x85d96440` | `graceEndsAt(uint256)` |
| `0xdc8a6878` | `refundOpen(uint256)` |
| `0x31703a8e` | `tokensOwed(uint256,address)` |
| `0xe78307ca` | `sharesOf(uint256,address)` |
| `0x73e7800d` | `sharesSold(uint256)` |
| `0x6813947f` | `contributionOf(uint256,address)` |
| `0xd4f07ea4` | `tokensSent(uint256,address)` |
| `0x8091f3bf` | `launched()` |
| `0xfd435125` | `launchedToken()` |
| `0xabba0dcb` | `launchedPool()` |
| `0xc45a0155` | `factory()` |
| `0xd000d59a` | `vaultRaiseId()` |
| `0xf00fe051` | `rescueStatus()` |
| `0xbf333f2c` | `FEE_BPS()` |
| `0xcd822c52` | `SETTLE_GRACE()` |
| `0xb592f89a` | `SETTLE_PUSH()` |
| `0x5207d321` | `BATCH()` |
| `0xc6011e16` | `meetsLaunchFloor(uint256)` |
| `0xb138e1fe` | `settlementSplit(uint256)` |
| `0xcf174d8d` | `taxAccrued()` |

## Events (topic0)

| topic0 | Signature |
|--------|-----------|
| `0x2e9841bb3e9ed2cf922ae2ab6cb7f70a29d40b13b92406c00656a9c203fb8a51` | `FlapNewLauncherCreated(address,address,address)` |
| `0xa8596cc4a052ecc7656e9ca0fb7a10472573699e3aa34ac5659bc37c1b0a44fc` | `VaultCreated(uint256,address,address)` |
| `0xab09f3e6f8844cf09a739c4ba343954906c16e953ebdfee90f32f0b1777d58de` | `RaiseCreated(uint256,address,address,string,uint256,uint256,uint64)` |
| `0x0e8589a14ef59dd00e110e0af6d72bd62fc834d62486215500f44c79ff388068` | `LaunchConfigured(uint256,bytes32,bool,uint256,uint256,uint256,uint16,uint16,uint16)` |
| `0x6025a815ff96de2dea21f2a0ff6982f5d12bd043851d345457a14e941497c378` | `Contributed(uint256,address,uint256,uint256,string)` |
| `0xc1e6d29e6115a178fc6cf9e1d0bdb35af356f5037788e619c07eb4a2fd9692e6` | `RaiseClosed(uint256,uint256)` |
| `0xa6dfd417a42ff8ff64ee51e1f64da93ddea399eed6e1b27abf16d6bbdc7a18a3` | `Settled(uint256,address,address,uint256,uint256,uint256,uint256)` |
| `0x33552065a2e05356c1bd23a6480186a69706df0612eb086e8eaab91088274545` | `TokensSent(uint256,address,uint256,bool)` |
| `0xaf7cbafda594765717b3efc58eb34a161af2eb721a9e893e452db52228331c16` | `TokensPushFailed(uint256,address)` |
| `0x8592da989b21f485edb6fc91d4a169f07c47945f30506b85ab6c57ec14b73ec2` | `Failed(uint256,address)` |
| `0x7ca5472b7ea78c2c0141c5a12ee6d170cf4ce8ed06be3d22c8252ddfc7a6a2c4` | `Refunded(uint256,address,uint256)` |
| `0x1efc214ec14d081e74ac22debc8d48a010f4f1f30ad4733c94e7c38ff90038e2` | `BeneficiaryPaid(uint256,address,uint256)` |
| `0x5a669fc79e3eb532326ac187b2dd43a519a01724dc80d3ffb5b8b2465c4ef22f` | `TaxClaimed(uint256,address,uint256)` |
| `0x3b5083eec1a1116c56de5d6841cff8efc6a0aec9850e836ec509d6ce024ea561` | `Funded(address,address,uint256)` |
| `0x6d3edaea633e887ef9cf0e2631993e2d6f7a02459986075dc20bcc6216a3a475` | `Scheduled(address,uint256,uint256,uint256)` |
| `0x02e3819f40f683436be6588891cbab07f9746f4344aa8bf8b1023bdfa3f4ecd0` | `BatchDistributed(address,uint256,uint256)` |
| `0x4e1f2fa1ca282c9f45fec59938b2274169ee8215e32bfa6d6ef675d3c21a4d1c` | `OutOfBudget(address,uint256,uint256)` |
| `0xec69e01ac0fc5e965925cadd6a7c59dab117c16cf458382f1d129d81cb6b47b6` | `BudgetSwept(address,uint256)` |
| `0x2f49287bfd71fbbd69c0e3350f7dc79276441c4f1e4395a5d7c01831fed3c82d` | `AutoScheduleFailed(address,uint256,bytes)` |
| `0x95776ec3fbcd850c40de526a22022962be19624636519017d81ac710f44e13ce` | `AutoSettleFailed(uint256,bytes)` |
