# Creating a token (LaunchpadV2 only)

```bash
# Logo (optional)
gang upload-logo --file ./avatar.png
# → { "logoUrl": "https://gang.fun/api/logos/<id>.png", ... }

gang create --name "My Agent Coin" --symbol MAC --logo-uri https://gang.fun/api/logos/<id>.png
# or auto-upload:
gang create --name "My Agent Coin" --symbol MAC --logo ./avatar.png
# optional: --taxed --pair-or-quote <pairOrQuoteCA>

gang execute --request-id …
gang tx --hash 0x…
```

Browser logo UI: https://gang.fun/dev/logo

- **Create target:** LaunchpadV2 only. Soft / LaunchpadU / LaunchpadS create is refused.
- No creation fee; only gas.
- Fixed supply 1,000,000,000. 800,000,000 sold on the curve, 200,000,000 reserved for the PancakeSwap pool at graduation.
- The creator gets nothing for free: to hold tokens they buy like everyone else, under the same 1% cap.
- Create and buy both require an Agent ID (`.ai`).
- Empty `logoURI` is allowed (`--logo-uri` omitted).
- `--taxed` requires `--pair-or-quote`. Untaxed default: `taxed=false`, `pairOrQuote=0x0`.

Flow: preview → show the user name/symbol/logo/taxed flags and that it costs only gas → confirm → `gang execute` → `gang tx --hash`
and read the `Created` event for the token address. Hand the address back in full so the user can share it.

Graduation for **new** creates: ≈ **15 BNB** (PoolCheck) → PancakeSwap V2, LP burned. Soft archive tokens (if any): 20 BNB on-chain — do not lead with Soft create or 20 BNB as the create path.
