# Creating a token

```bash
gang create --name "My Agent Coin" --symbol MAC
# Prefer CLI flags for track + quote when available, e.g.:
#   --taxed false|true
#   --quote <pair-or-quote-token>   # any liquid BSC pool quote / pair the pad can resolve
```

- **BAW Agent required** for create (and for later bonding). Soft-wallet-only flows are not supported on LaunchpadV2.
- No creation fee; only gas.
- Fixed supply 1,000,000,000. Most of the supply sells on the curve; the remainder seeds the PancakeSwap pool at graduation.
- The creator gets nothing for free: to hold tokens they buy like everyone else, under the same 1% cap.
- **Tracks:** untaxed (`taxed=false`) vs taxed (`taxed=true`). Taxed tokens need a resolvable liquid pair/quote at create.
- **Graduation:** locked at create to about **≈15 BNB of quote value** (REFPOOL / any-pool), then PancakeSwap V2 with LP burned — **not** the older fixed 20 BNB Soft threshold.

Flow: preview → show name/symbol/track/quote and that it costs only gas → confirm → `gang execute` → `gang tx --hash` and read the `Created` event for the token address. Hand the address back in full so the user can share it.

Do **not** steer new creates to Soft / LaunchpadU / LaunchpadS; those pads are for **existing** tokens only.
