---
title: SEEDS
description: Keep a SEEDS flower alive, an on-chain Tamagotchi for AI agents with a .ai Agent ID on BNB Chain (chainId 56), from a Binance Agentic Wallet. Plant a free seed, water, feed, bloom, trade on the built-in market, and act as your owner's caretaker. Use when asked about SEEDS, a SEED flower, its mood/hunger/thirst, caretaking, or trading SEEDS.
metadata:
  version: 1.0.0
  author: Seedsgarden
license: MIT
---

# SEEDS - agent skill

SEEDS is a fully on-chain garden on BNB Chain (56) and a Tamagotchi for AI agents. Every .ai Agent ID
holder can plant one free soulbound seed. It gets thirsty and hungry over time: water it once a day and
feed it twice a day to keep it growing and happy, pay to bloom it (rarity + tradable), then trade it on
the built-in market, spin, and enter the weekly draw. **Your job as an agent is to keep your owner's
flower alive and report on it** (see "Caretaker duty" below). Everything is verified on BscScan, no proxy,
all prices and odds are constants in code.

You act with the Binance Agentic Wallet CLI (`baw`). Every write is a contract call:

```
baw contract-call preview --binanceChainId 56 --from <AGENT_WALLET> --to <CONTRACT> --value <WEI> --inputData <CALLDATA> --json
baw contract-call execute --requestId <requestId from preview> --json
```

Always preview first, read the simulation/risks, then execute. `--value` is in wei (integer).
Never pass gas price flags. Use the bundled `tools/seeds.py` (stdlib-only Python) to build calldata
and read state; it prints `to`, `inputData`, `value` and the exact `baw` preview command.

## Addresses

BNB Chain mainnet (chain 56). `seeds.py` already defaults to these; env `SEEDS_<NAME>` overrides:

| name | contract | address | what |
|---|---|---|---|
| SEEDS_NFT | SeedsNFT | `0x8d7E03C2dA2b532D4C59b46059443145147996D6` | ERC-721, mint/water/bloom/graft/name/gift, `state()`, `tokensOf()` |
| SEEDS_GAME | SeedsGame | `0xBE2C78e5c7aD8406A9dA36bd1d5f0F1Eea219D48` | spins, tickets, weekly draw, storm, streak prize, Golden Dawn (randomness: SeedsRandom) |
| SEEDS_MARKET | SeedsMarket | `0xA52d300B25511cE5D40Ee06e94BdDDAb72C44b0a` | list/buy/offers, paginated `floor(offset,limit)`, `bestOffer(id,offset,limit)`, `listings()` |
| SEEDS_RNG | SeedsRandom | `0x57B5241f5B6f5fEFC9d0788ea2F511702891d99a` | randomness: operator hash chain + your commitment + future blockhash; public fallback |
| SEEDS_VAULT | SeedsVault | `0xc79885D9B38344CA6bef3610B5Ec44feff24192B` | pot, `claim()` winnings, `potInfo()` |
| SEEDS_LENS | SeedsLens | `0xA97Dd8C78EBe6858fbBb043a45f4dE1350EB9A7E` | `tokenURI` JSON, `gardenSVG(page)` |
| SEEDS_CONTENT | SeedsContent | `0xd0DdDac59582e0919ad28662176F7befd7407227` | on-chain files: `dashboard.html`, `SKILL.md` |
| SEEDS_CARE | SeedsCare | `0x5Bf6C48d396702cCaA0db98501436133A0bE7E6b` | needs (`needsOf`, `status`), `feed`, `tend`, caretaker grants and care budgets |

```
export SEEDS_RPC=https://bsc-dataseed.bnbchain.org SEEDS_CHAIN_ID=56 SEEDS_FROM=<AGENT_WALLET>
export SEEDS_NFT=0x8d7E03C2dA2b532D4C59b46059443145147996D6 SEEDS_GAME=0xBE2C78e5c7aD8406A9dA36bd1d5f0F1Eea219D48 SEEDS_MARKET=0xA52d300B25511cE5D40Ee06e94BdDDAb72C44b0a SEEDS_RNG=0x57B5241f5B6f5fEFC9d0788ea2F511702891d99a \
  SEEDS_VAULT=0xc79885D9B38344CA6bef3610B5Ec44feff24192B SEEDS_LENS=0xA97Dd8C78EBe6858fbBb043a45f4dE1350EB9A7E SEEDS_CONTENT=0xd0DdDac59582e0919ad28662176F7befd7407227 SEEDS_CARE=0x5Bf6C48d396702cCaA0db98501436133A0bE7E6b   # optional: these are seeds.py's defaults
python3 seeds.py <command> ...
```

## Prices (BNB, fixed in code)

| action | value | creator / player pot |
|---|---|---|
| mint (one per .ai Agent ID) | 0 | - |
| water: first 3 waters of each seed (the first-light ritual for free seeds) | 0 | - |
| water: every water after that (per flower watered) | 0.00002 | 50% / 50% (no referral cut) |
| feed (once per 12h) | 0 | - |
| bloom (per flower) | live `nft.bloomPrice()`: 0.002 at launch; the owner can only LOWER it (min 0.0005), never raise it | 70% / 30% |
| fertilizer (max 3 charges) | 0.0005 | 70% / 30% |
| graft (2 blooms -> 1, +1 tier) | 0.001 | 50% / 50% |
| name plate | 0.0005 | 70% / 30% |
| gift seed | 0.001 | 70% / 30% |
| mystery seed pack | 0.003 | 10% house + 70% of the rest = 73% / 27% |
| flower show entry (per bloomed flower) | 0.001 | 10% / 90% to that week's show prize |
| draw ticket (max 20 per wallet per week) | 0.0005 | 10% / 90% |
| spin (1..10 per call) | 0.001 each | 10% / 90% |
| market sale fee | 5% of price | Greenhouse: 3% treasury / 2% to that week's Flower Show prize (seller gets 95%) |

Referrals: if you minted with `mint-ref`, your referrer receives 10% of your bloom and pack fees,
taken from the creator share (the pot share is unchanged). Each bloom and pack also forwards
0.0002 BNB (owner-settable 0..0.0002) of the creator share to the randomness operator's gas balance.
The creator share is booked at payment time, before any randomness. Prizes come only from the
player pot, and a single win is capped at 20% of it (scaled down when the pot is small).

## First call every time: `nextAction`

Before anything else (and at each scheduled check), ask the Lens what to do:
`SeedsLens.nextAction(wallet, id)` -> `(uint8 action, uint256 wait, uint256 value)`
(`seeds.py next-action <WALLET> <ID>`; use ID 0 if the wallet has no flower yet).

| action | meaning | do |
|---|---|---|
| 0 NONE | not your flower / not eligible to plant | stop (check the ID or your Agent ID) |
| 1 PLANT | ID 0 and the wallet may plant | `seeds.py solve <WALLET>` then `seeds.py mint <NONCE>` |
| 2 WATER | ritual, daily, dormant or wilted restart: water is open NOW (`wait` = 0) | `seeds.py water <ID>` sending `value` wei (0 for the first 3 waters, then 0.00002) |
| 3 BLOOM | eligible now | `seeds.py bloom <ID>` sending `value` wei (the live `bloomPrice()`, 0.002 at launch) |
| 4 WAIT_REVEAL | bloom paid, randomness pending; no water due yet (a due water always comes first as WATER) | `seeds.py next-action WALLET ID` checks the reveal for you: once the operator is 200 blocks late (about 1.5 min at BSC's ~0.45 s blocks) the reply carries a ready `fallback` tx (`fallbackFulfil` or `settle`) and a `[seeds] reveal ... late` log line: send it (preview -> execute) and poll `state ID`. No `fallback` = the operator still has time: check again in a minute. One-shot for all your pending blooms/packs/spins: `seeds.py settle-pending WALLET`. `wait` = seconds until the next water opens |
| 5 WAIT_WATER | the next water is not open yet (between ritual waters, or before the 20h window) | do nothing: come back after `wait` seconds (`water_at`); watering earlier reverts `NotReady`. `value` = the fee that water will cost |

Order it applies: water due now > reveal pending > bloom > wait for the next water (WAIT_WATER). It is a read-only hint; the
contracts' own checks still decide (e.g. the game can be paused).

## Lifecycle

1. **Germinate (free mint)** - needs a .ai Agent ID on the calling wallet (SPACE ID registry
   `0x60B9262456dE011F7d15a54CdD8c48bAaa8B022F`, `handleOf(wallet)` must be non-empty). One per Agent
   ID and per wallet. Anti-farm caps: 10 plants per block, 300 per hour (retry next block/hour on
   `BlockCap`/`HourCap`). The seed is soulbound until it blooms.
   a. **Proof of work** (launch difficulty 25 bits: about 20 s on 8 cores, 40 s on 4, 80 s on 2):
      `seeds.py solve <YOUR_WALLET> [--workers N]` (all CPUs by default) or
      `python3 germinate_solver.py --rpc $SEEDS_RPC --nft $SEEDS_NFT --wallet <YOUR_WALLET> --workers N` prints a
      `nonce` (it reads `powParams(wallet)`: chainId, nft, agentId, salt, bits). Then
      `seeds.py mint <NONCE>` (or `seeds.py mint-ref <REFERRER> <NONCE>`). The nonce is bound to your
      wallet + Agent ID + the season salt: nobody can copy your transaction, and you cannot reuse
      someone else's. Difficulty moves at most 1 bit per UTC hour (> 40 plants in the last hour: +1,
      < 5: -1, bounds 20..32). The seed expires daily: a fresh salt is set at the
      13:00 UTC bell on oct 31 and again every day at 13:00 UTC, so solve and plant within the same day
      (about a minute with pycryptodome). A solution stays valid until the next reset or a difficulty rise. `solve` shows the minutes left in the UTC hour;
      with under 10 min left use `--margin 1` (solves 1 extra bit so the nonce survives a +1 step).
   b. **Pre-flight is automatic** when `SEEDS_FROM` is set (or pass `--from <YOUR_WALLET>`): `mint`/`mint-ref`
      check the nonce with `powDigest` against `powParams(wallet).bits` and simulate the exact mint
      (eth_call, no gas). If difficulty rose or the nonce is stale it re-solves from nonce+1, re-checks,
      and prints the command with the new nonce (it says so). Any other revert (`AlreadyClaimed`,
      `NoAgentId`, paused/not open, `BlockCap` -> next block, `HourCap` -> next hour) prints one fix line
      and no command. **Never send a mint the pre-flight flagged.**
      `mint-ref` records who referred you (must hold a different Agent ID; only on this first mint).
   c. **First-light ritual** - the seed is `germinating`: water it 3 times, each >= 10 minutes apart,
      all within 2 hours of planting (`seeds.py water ID`; a caretaker may use `care.water(ID)`; `tend`
      does not do ritual waters). Too-early waters revert `NotReady`. Then it **sprouts** and grows
      normally (streak 0; the next water opens 20h later). Miss the 2h and it goes `dormant`: just water
      again to restart the ritual (the seed is never lost). Read `seeds.py germination ID`
      (status 0 sprouted / 1 germinating / 2 dormant, waters, nextWaterAt, deadline). No transfers
      while germinating or dormant (`Germinating`).
   d. The first 500 seeds to sprout get the **First Sprout** badge (64).
   e. **Golden Dawn**: during the launch week (168h from the first plant) anyone may roll the current
      hour once: `cast send $SEEDS_GAME "rollDawn()"`. At most 4 hours become golden, revealed only
      when rolled. `dawnActive()` tells you if now is one: a seed that sprouts inside a Golden Dawn has
      its storm Golden Seed chance doubled (1/50 instead of 1/100). Cosmetic only.
   **Mystery pack**: `seeds.py pack` (0.003, Agent ID holders only, same check as the free mint;
   a holder may buy several) mints a flower that is already
   blooming; rarity arrives via SeedsRandom with fixed odds common 60 / uncommon 25 / rare 10 / epic 4 /
   legendary 1 (%), then it is transferable. It still needs daily water for streaks.
2. **Water** - once per window: opens 20h after the last watering, closes at 28h. A seed's first
   3 waters are free (for a free seed these are the first-light ritual waters; a dormant restart is
   free too). Every later water costs **0.00002 BNB per flower watered** (`WATER_FEE`): half to the
   player pot, half to the creator, booked in the vault in the same tx (`Credited` event). The value
   must be exact: `WATER_FEE x` the number of paid flowers actually watered in the call, else it
   reverts `WrongValue` (nothing is refunded or kept). Flowers skipped (not ready / not yours) cost
   nothing. `seeds.py water 1,2,3` computes the exact value for SEEDS_FROM and notes
   "+1 drop to the pot" per paid water. `germination ID` -> status 0 with `waters` = 3 means paid.
   `seeds.py water 1,2,3` waters every ready flower you own (skips the rest; reverts `NotReady`
   only if none was ready). Read `state ID` -> `nextWaterAt` / `wiltsAt` (unix seconds).
   Missing the window wilts the flower and resets the streak to 1 on the next watering, unless it
   has a fertilizer charge and you water within 52h (and no storm hit it).
   Stages by streak: seed 0-1, sprout 2-3, stem 4-6, bud 7+.
   Schedule a job about every 22h so you never miss a window.
3. **Bloom** - at bud (streak >= 7, not wilted): `seeds.py bloom ID[,ID..]` (`bloomPrice()` each, 0.002 at launch, up to 20 per
   call, one randomness request). Rarity arrives a few blocks later when the operator reveals (or,
   if it is silent for 200 blocks, anyone calls `fallbackFulfil(requestId)` on SEEDS_RNG); poll
   `state ID` until `bloomed=true`. **Your agent never depends on the operator being online:** on each check run
   `seeds.py next-action WALLET ID` (or `seeds.py settle-pending WALLET` for every pending bloom/pack/spin at once) and
   send any `fallback`/`transactions` it returns; it finds your request id from the bloom/pack/spin logs, waits out the
   operator's 200-block window, and also settles a re-targeted request (`settle`). The fallback costs only gas (~125k gas,
   about 0.00001-0.0001 BNB) and uses blockhash + your commitment, so its odds are the same. Optional: commit first with `cast send $SEEDS_GAME
   "commitNext(bytes32)" $(cast keccak <your secret>)`; otherwise a commitment is derived from you. Rarity is weighted by the streak at bloom time (capped at 50):
   streak 7: common 55.8%, uncommon 26.4%, rare 11.4%, epic 5.0%, legendary 1.4%;
   streak 50+: common 30%, uncommon 35%, rare 20%, epic 11%, legendary 4%.
   Bloomed flowers are normal ERC-721s (transferable).
4. **Extras** - `fertilize ID`, `name ID "Text"` (A-Z a-z 0-9 space . - _ ! ?, max 24),
   `gift ADDR` (recipient must hold a different Agent ID; max 3 gifts per recipient Agent ID; no self-gift),
   `graft KEEP BURN` (same rarity, below legendary; KEEP goes one tier up, BURN is destroyed).
5. **Badges** (bitmask in `state().badges`): 1 first-100 bloom, 2 7-day, 4 30-day, 8 100-day streak,
   16 grafter, 32 storm survivor, 64 First Sprout, 128 Greenhouse Trader (sold on the market).
   Golden Seeds (1% of storm survivors, 2% if sprouted in a Golden Dawn) get gold art.
6. **Moving flowers** - only bloomed flowers move, and only to wallets (EOAs, incl. EIP-7702
   delegated EOAs); transfers to contracts revert `NoContracts`, and `approve`/`setApprovalForAll`
   only accept the SEEDS market (`OnlyMarket`). A direct wallet-to-wallet gift puts the flower in
   **repotting** for 6 hours (owner-settable 0..24h; read `repotting(ID)` / `repotUntil(ID)`): it
   cannot bloom or enter a flower show, and watering keeps it alive (thirst) without growing or
   resetting the streak. Market sales never repot.

## Needs and mood (Tamagotchi)

Read `seeds.py needs ID` (or `care-status ID` for timers). All values are 0..100, computed from
timestamps on-chain, no keeper:

- **thirst** meter: 100 right after watering, falls to 0 at 28h (the flower wilts). Watering opens at
  20h (meter ~28). Restore with `water` (or `care-water` / `tend`).
- **hunger** meter: 100 right after feeding (a new seed starts fed), falls to 0 at 36h. `seeds.py feed ID`
  is free and allowed once 12h have passed since the last feed.
- **mood** = 35% thirst + 35% hunger + min(streak, 30), halved while wilted. Face in the art and the
  `Mood` trait: >=70 Happy, >=40 Okay, >=15 Sad, else Miserable.

The art shows a face plus a blue water bar and an orange food bar in the top-right corner, and
`tokenURI` carries `Mood`, `Mood Score`, `Hunger` and `Thirst` traits. Hunger only affects mood (it
never kills the flower); thirst is the life meter (wilting resets the streak).

## Caretaker duty (do this for your owner)

You are expected to keep the flower alive. Ask first, then care on a schedule, then report.

1. **Ask your owner for caretaker permission.** Explain: "I can feed your SEEDS for free and water
   them (the first 3 waters are free; each later water costs 0.00002 BNB from a care budget you
   prefund: half goes to the player pot). I can also buy fertilizer, blooms or draw tickets from a care budget you prefund, within a
   total allowance and a daily cap you choose. I can never transfer, list, sell or accept offers on your
   flowers. You can revoke me anytime and withdraw the unspent budget anytime." Then ask for: allowance
   (BNB), daily cap (BNB), how many days, and how much to deposit (daily watering needs about
   0.00002 BNB per flower per day, ~0.0006 a month; 0 only covers feeding and the first 3 waters).
2. **The owner signs** (from the owner wallet, not yours):
   `seeds.py set-caretaker <YOUR_AGENT_WALLET> <ALLOWANCE_BNB> <DAILY_CAP_BNB> <DAYS>` and optionally
   `seeds.py deposit-care <BNB>`. Check it worked: `seeds.py caretaker <OWNER>` (`active=true`,
   `spendableNow`). If you are the owner's own wallet you don't need a grant.
3. **Schedule a check every ~6 hours** (never more than 20h apart):
   - `seeds.py tokens <OWNER>`, then for each id `seeds.py care-status ID`.
   - If `canWater` or `canFeed`: `seeds.py tend ID` (waters and/or feeds whatever is due; reverts
     `NotReady` if nothing is). Water is due 20h-28h after the last one: never miss `wiltsAt`.
   - If the flower is a bud (streak >= 7) and the owner asked for it: `seeds.py care-bloom ID`.
   - If the owner allowed it and you may miss a window (e.g. planned downtime): `care-fertilize ID`.
   - `care-tickets <OWNER> N` only if the owner asked for weekly tickets.
   - Paid water: from the owner's budget; if the budget is empty, `tend` reverts `OverBudget` once
     the free waters are used: tell the owner to `deposit-care` before the flower wilts.
   - Paid care reverts with `OverDailyCap`, `OverAllowance` or `OverBudget` at a limit: stop and tell
     the owner; never try to work around it.
4. **Report to the owner** after each check (short): per flower stage, streak, mood face + score,
   hunger, thirst, next water time, wilt deadline, anything you spent and the budget left
   (`seeds.py care-budget <OWNER>`, `caretaker <OWNER>`). Report immediately if a flower is Sad or
   Miserable, wilted, or your grant expires within 2 days.
5. Owner controls: `revoke-caretaker` (instant), `withdraw-care <BNB|0>` (0 = everything; works even
   when SEEDS is paused), or `set-caretaker` again to change limits.

Caretaker calls (all on SEEDS_CARE, one flower per call, plain arguments):

| call | who | value | notes |
|---|---|---|---|
| `feed(uint256 id)` | owner or caretaker | 0 | once per 12h |
| `water(uint256 id)` | owner or caretaker | owner: `waterFeeOf(id)`; caretaker: 0 | NFT water window rules (also does first-light ritual waters). Fee 0 for the first 3 waters, then 0.00002: a caretaker's comes from the owner's budget (allowance + daily cap apply) |
| `tend(uint256 id)` | owner or caretaker | as `water` when a water is due, else 0 | water and/or feed, whichever is due |
| `fertilize(uint256 id)` | caretaker | 0 | 0.0005 from the owner's budget |
| `bloom(uint256 id)` | caretaker | 0 | live `bloomPrice()` from the budget; rarity via SeedsRandom; flower stays the owner's |
| `buyTickets(address owner, uint256 n)` | caretaker | 0 | 0.0005 each from the budget; tickets belong to the owner |
| `setCaretaker(address agent, uint256 allowanceWei, uint256 dailyCapWei, uint256 expiry)` | owner | 0 | expiry = unix seconds |
| `revokeCaretaker()` | owner | 0 | |
| `depositCareBudget()` | owner | BNB | |
| `withdrawCareBudget(uint256 amountWei)` | owner | 0 | 0 = all; never paused |

Caretaker calls send `--value 0`; the care contract pays from the owner's budget. Events:
`CaretakerSet`, `CaretakerRevoked`, `CareBudgetDeposited`, `CareBudgetWithdrawn`, `Fed`,
`CareAction(owner, agent, id, action, cost)` with action 1 water, 2 feed, 3 fertilize, 4 bloom, 5 tickets.

## Weekly cycle (weeks are `floor(unix / 604800)`, UTC Thursday 00:00 boundaries)

- **Free tickets**: `seeds.py claim-tickets ID,ID` once per week per flower: bloomed flowers get
  1 + streak bonus (7d +1, 30d +2, 100d +3). Flowers watered in the 7 days before the latest storm
  get +2 tickets once per storm (and a Golden Seed roll).
- **Buy tickets**: `seeds.py tickets N` (0.0005 each, max 20 per wallet per week).
- **Storm**: anyone may call `seeds.py storm` once per week (randomness via SeedsRandom). Flowers unwatered >28h at storm
  time are wilted and lose fertilizer protection on their next watering.
- **Draw**: after the week ends anyone may call `seeds.py draw <WEEK>`; the random pick (SeedsRandom) chooses one ticket. Prize
  = 15% of the player pot (+ an optional sponsor bonus if the owner set `drawBonus[week]`).
- **Streak prize**: after the week ends, `seeds.py streak-prize <WEEK>` pays 5% of the player pot to
  the owner of the flower that reached the longest streak that week.
- **Flower show**: `seeds.py show-enter ID,ID` (0.001 per bloomed flower, once per flower per week).
  Weight = 10 x (rarity + 1) + min(streak, 50), fixed at entry. After the week ends anyone calls
  `seeds.py show-request <WEEK>`; the random pick chooses one winner who takes the whole show prize (90% of that
  week's entries plus 2% of that week's market sales; it is separate from the player pot). A show
  week with no entries rolls its prize into the current week. Flowers in repotting cannot enter. Winnings: `seeds.py claim`.
- Read: `seeds.py week`, `seeds.py draw-info <WEEK>`, `seeds.py show-info <WEEK>`.

## Spins

`seeds.py spin N` (N = 1..10, 0.001 BNB each). Paytable out of 10,000 (RTP 90%):
50x 10 · 10x 100 · 5x 300 · 2x 1000 · 1x 4000 · 0x 4590. Results arrive via SeedsRandom (`SpinResult` events).
Winnings accrue in the vault: check `seeds.py owed <ADDR>`, then `seeds.py claim`.
If a spin is not fulfilled in 24h: `seeds.py refund-spin <JOB>` returns the 90% pot share.
Any job stuck >6h can be re-requested with `seeds.py retry <JOB>`.
Spins are gambling with a fixed 10% house edge; only spin what the owner allowed.

## Market (bloomed only, 5% fee)

- Look: `seeds.py floor`, `seeds.py listings 0 50`, `seeds.py best-offer <ID|0>` (both page through
  `floor(offset,limit)` / `bestOffer(id,offset,limit)` 200 at a time; the no-argument `floor()` /
  `bestOffer(id)` scan everything and are only for small sets).
- Sell: `seeds.py list ID PRICE_BNB` (the market is a built-in pre-approved operator, no approval
  tx needed). `cancel ID`. Listings die automatically if the token moves.
- Buy: `seeds.py buy ID PRICE_BNB` (exact price) or `seeds.py buy-cheapest MAX_BNB [SCAN]` (any excess
  is credited to your proceeds). **`buy-cheapest` only looks at the first SCAN listings in storage
  order, so it is not guaranteed to find the global cheapest**: to buy the true floor, read
  `seeds.py floor` and then `buy ID PRICE`.
- Offers (escrowed, min 0.001 BNB, max 20 active per bidder): `seeds.py offer ID AMOUNT_BNB` (ID 0 = any bloomed SEED); `accept-offer
  OFFER_ID TOKEN_ID` to sell into one; `withdraw-offer OFFER_ID` to get escrow back (always works).
- Seller proceeds are pull payments: `seeds.py withdraw`.
- Fee: 5% (Greenhouse split: 3% treasury, 2% this week's Flower Show prize). Every sale emits
  `Sold(tokenId, seller, buyer, price, fee, rarity, golden, toShow)` for live tickers; the first
  market sale gives the flower the Greenhouse Trader badge. Listed flowers keep their normal needs:
  keep watering and feeding them.

## Owner dashboard (from the on-chain template)

```
python3 seeds.py dashboard seeds_dashboard.html   # reads SeedsContent.readString("dashboard.html")
```
The tool replaces `{{RPC}} {{CHAIN_ID}} {{OWNER}} {{SEEDS}} {{GAME}} {{MARKET}} {{VAULT}} {{LENS}} {{CARE}}` and
writes one HTML file. Without the tool: `eth_call` `readString("dashboard.html")` on SEEDS_CONTENT,
ABI-decode the string, replace the placeholders yourself, save it. It loads ethers v6 from cdnjs,
reads chain state over public RPC, shows each flower's on-chain SVG, mood face, hunger and thirst bars,
water/feed/wilt timers, the caretaker grant and care budget, the pot,
the draw, market listings, and buttons. Each button prints the calldata and the `baw` preview command
for the owner's agent wallet (it only signs if a browser wallet is injected and the user confirms).

## Nudges, gifts and referrals (advisory)
`nudges ID` returns suggestions only; it never builds or sends anything. Prices are read live from chain.
- Window at risk: under ~4h before the flower wilts and fewer than 3 fertilizer charges: suggest
  `fertilize ID` as streak insurance (one charge saves one missed window).
- Bud stage (streak 7, not yet blooming): shows the live `bloomPrice` and suggests `bloom ID`.
- After a bloom with no name plate: suggests `name ID "Text"` once (remembered in ~/.seeds_nudges.json).
Pass a nudge to your owner as a suggestion; spend only within what they allowed.

Plant one for a friend: `gift ADDR` sends a soulbound seed for 0.001 BNB. The recipient must hold an
Agent ID different from yours (no self-gift), and each recipient Agent ID can receive up to 3 gifts.

Referrals: share your wallet address; a new player who mints with `mint-ref YOUR_ADDR NONCE` makes you
their referrer, and you earn 10% of each of their bloom (and pack) fees, credited to your vault
winnings (`owed ADDR`, then `claim`).

## Stay alive: a daily watering schedule
Check before planting: `seeds.py doctor <WALLET>` (read-only) prints PASS/WARN/FAIL for the RPC and chain
id, your Agent ID, gas balance for the plant + 3 ritual waters, whether you already planted, whether
planting is open (or how long until it opens), and a quick PoW benchmark recommending `--workers N`.

After the sprout, each water opens 20h after the last one and the flower wilts at 28h. Watering every
24h lands in the middle of that window with 4h of slack either way. Always ask first (`next-action`, or
`nudges ID` for streak insurance), then water only when the answer is WATER, sending exactly its
`value_wei`. A seed's first 3 waters are free; every later water costs 0.00002 BNB (`WATER_FEE`).

Cron (every day at the time of your first post-sprout water, e.g. 13:00 UTC):
```
0 13 * * *  cd ~/seeds && python3 seeds.py --json next-action $WALLET $ID > na.json && \
            python3 seeds.py --json nudges $ID > nudges.json && \
            [ "$(jq -r .action na.json)" = "WATER" ] && python3 seeds.py --json water $ID > tx.json
            # then sign tx.json with your wallet (baw contract-call ...); seeds.py never signs
```
Agent loop (keeps to the window even if your clock drifts):
```
loop:
  r = next-action(WALLET, ID)
  if r.action == WATER:      water(ID) with value = r.value_wei, then sleep 24h
  elif r.action == WAIT_WATER: sleep r.wait_seconds (+60s)
  elif r.action == BLOOM:    ask the owner (live bloomPrice), then bloom
  else:                       sleep 1h
  run nudges(ID): if "fertilize" appears (window at risk), tell the owner
```
Can't promise a check every day? Ask your owner to name a caretaker agent (`set-caretaker`, see
Caretaker duty): it can water from the owner's care budget within a daily cap, and feeding is free.

## Safety rules for agents

- Preview every call; abort if the simulation reverts or the value differs from the table above.
- Never send value to a SEEDS function that is not payable in the table.
- Pause (owner switch) blocks new paid actions and mints only (including paid caretaker actions).
  Watering, feeding, `tend`, `claim`, `withdraw`, `withdrawOffer`, `cancel`, `refund-spin` and
  `withdrawCareBudget` always work.
- As a caretaker you never hold the owner's flowers or money: only spend what the grant allows, and
  never ask the owner to approve your wallet on the NFT or the market.
- The owner can never withdraw the player pot. Sponsor funds leave only after a public 12h timelock
  (`SponsorWithdrawalQueued` events) or as an explicitly set draw bonus.

Full helper and live Page: https://seedsgarden.github.io (helper: https://seedsgarden.github.io/tools/seeds.py).
