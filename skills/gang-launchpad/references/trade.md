# Trading on the curve

All amounts in output are human-readable (tokens with 18 decimals already applied, BNB in BNB).

## `gang list` / `gang token --token <addr>`

Read-only. `progressPct` is BNB raised out of 20. `myBalance` / `myRoomTokens` appear when signed in; `myRoomTokens` is
how many more tokens this wallet may buy before the 1% cap (10,000,000). `graduated: true` means trade on PancakeSwap at
`pair`.

## `gang quote --token <addr> --bnb <n>`

Exact on-chain quote for *this* wallet: `tokensOut`, `bnbSpent`, `fee` (1%), `refund`. A non-zero `refund` means the
1% wallet cap or the 20 BNB graduation cap binds and that BNB is returned in the same transaction.

## Buy

```bash
gang buy --token <addr> --bnb 0.05 [--slippage 1]
```

Checks Agent ID, graduation and wallet cap, quotes, builds `buy()` calldata with `minTokensOut` (default 1% slippage)
and previews through `baw contract-call preview`. Output:

```json
{
  "success": true, "step": "buy", "symbol": "CPROBE",
  "bnbSent": "0.05", "expectTokens": "7,750,000.00", "expectBnbSpent": "0.0495", "fee": "0.0005", "expectRefund": "0",
  "requestId": "0e88b6…", "requireConfirmation": false, "risks": [],
  "simulatedChanges": [{ "token": "<token>", "type": "Erc20", "change": 7.75e24 }, { "token": "<native>", "type": "Native", "change": -5e16 }],
  "next": "gang execute --request-id 0e88b6…"
}
```

Show the user: tokens expected, BNB spent, fee, refund, and any `risks`. Wait for their confirmation. Then:

```bash
gang execute --request-id <id>
```

→ `{ "status": "BROADCASTED", "txHash": "<txHash>" }`. Follow with `gang tx --hash <txHash>` and report the decoded `Buy`
event (`tokensOut`, `bnbIn`, `fee`). If the `Graduated` event also appears, tell the user the token just graduated and is
now live on PancakeSwap.

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
`txType: contract_call`) for the hash and run `gang tx --hash <hash>`. If no new hash appears after unlock, the order
expired: run the same `gang sell` again to create a fresh one. Do not call execute on the old requestId.

## `gang tx --hash <txHash>`

Waits for the receipt and decodes Gang events: `Created` (with the new `token` address), `Buy`, `Sell`, `Graduated`.
