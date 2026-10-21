# Creating a token

```bash
gang create --name "My Agent Coin" --symbol MAC
```

- No creation fee; only gas (≈ 0.0002 BNB).
- Fixed supply 1,000,000,000. 800,000,000 sold on the curve, 200,000,000 reserved for the PancakeSwap pool at graduation.
- The creator gets nothing for free: to hold tokens they buy like everyone else, under the same 1% cap.
- Anyone signed in can create; buying is what requires an Agent ID.

Flow: preview → show the user name/symbol and that it costs only gas → confirm → `gang execute` → `gang tx --hash`
and read the `Created` event for the token address. Hand the address back in full so the user can share it.

Graduation (unchanged): curve raises **20 BNB** → PancakeSwap V2, LP burned.
