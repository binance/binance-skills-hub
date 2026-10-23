# Trading on the curve

All amounts in output are human-readable (tokens with 18 decimals already applied, quote amounts in the token’s quote asset).

Create and bonding buys/sells are **BAW-only**: the wallet must hold a SPACE ID Agent ID (`.ai`). Listing may include older Soft / LaunchpadU / LaunchpadS inventory alongside LaunchpadV2; use the same preview → confirm → execute flow when the CLI supports that token.

## `gang list` / `gang token --token <addr>`

Read-only. `progressPct` reflects raised quote toward the token’s locked graduation target (**≈15 BNB of value** at create for LaunchpadV2 — not a universal 20 BNB Soft meter). `myBalance` / `myRoomTokens` appear when signed in; `myRoomTokens` is
how many more tokens this wallet may buy before the 1% cap (10,000,000). `graduated: true` means trade on PancakeSwap at
the reported `pair` (neutral link; no token promotion).

## `gang quote --token <addr> --bnb <n>`

Exact on-chain quote for *this* wallet against the token’s pool quote (any liquid BSC pool quote the pad resolved — not only a single native path): `tokensOut`, quote spent, `fee` (1% bonding fee), `refund`. A non-zero `refund` means the
1% wallet cap or the graduation reserve binds and that quote is returned in the same transaction.

## Buy

```bash
gang buy --token <addr> --bnb 0.05 [--slippage 1]
```

Checks Agent ID (bonding is BAW-only), graduation and wallet cap, quotes, builds `buy()` calldata with `minTokensOut` (default 1% slippage)
and previews through `baw contract-call preview`. Output:

```json
{
  "success": true, "step": "buy", "symbol": "CPROBE",
  "bnbSent": "0.05", "expectTokens": "7,750,000.00", "expectBnbSpent": "0.0495", "fee": "0.0005", "expectRefund": "0",
  "requestId": "<requestId>", "requireConfirmation": false, "risks": [],
  "simulatedChanges": [{ "token": "<token>", "type": "Erc20", "change": 7.75e24 }, { "token": "<native>", "type": "Native", "change": -5e16 }],
  "next": "gang execute --request-id <requestId>"
}
```

Show the user: tokens expected, quote spent, fee, refund, and any `risks`. Wait for their confirmation. Then:

```bash
gang execute --request-id <requestId>
```

→ `{ "status": "BROADCASTED", "txHash": "<txHash>" }`. Follow with `gang tx --hash <txHash>` and report the decoded `Buy`
event (`tokensOut`, quote in, `fee`). If the `Graduated` event also appears, tell the user the token just graduated and is
now live on PancakeSwap at the reported `pair`.

## Sell

```bash
gang sell --token <addr> --all
gang sell --token <addr> --amount 1000000
```

Two possible previews:

1. `step: "approve"` — the Launchpad has no allowance yet. Confirm, execute, wait for `gang tx`, then run the **same
   `gang sell` command again**.
2. `step: "sell"` — shows `expectBnb` and `fee`. Confirm, execute.

Execute may return:

```json
{ "status": "PENDING_CONFIRMATION", "pendingConfirmation": true, "txHash": null, "next": "..." }
```

Binance asks the user to approve sells of non-whitelisted tokens in the App. **The request expires within a few
minutes**, so tell the user immediately to open Binance App → Wallet → Agentic Wallet and approve. Poll
`baw wallet tx-lock --binanceChainId 56 --json`: `LOCKED` means still waiting, `UNLOCKED` means it was approved,
rejected or expired. Then read `baw wallet tx-history --binanceChainId 56 --type confirmed --json` (newest first,
`txType: contract_call`) for the hash and run `gang tx --hash <txHash>`. If no new hash appears after unlock, the order
expired: run the same `gang sell` again to create a fresh one. Do not call execute on the old requestId.

## `gang tx --hash <txHash>`

Waits for the receipt and decodes Gang events: `Created` (with the new `token` address), `Buy`, `Sell`, `Graduated`.
