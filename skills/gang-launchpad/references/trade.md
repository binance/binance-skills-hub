# Trading on the curve

All amounts in output are human-readable (tokens with 18 decimals already applied, amounts in eth-units of the quote).

## `gang list` / `gang token --token <addr>`

Read-only. CLI auto-resolves Soft / LaunchpadV2 / U / S. `progressPct` is raised / graduation target. **New (V2) tokens ≈15 BNB**; Soft archive tokens 20 BNB. `myBalance` / `myRoomTokens` appear when signed in; `myRoomTokens` is how many more tokens this wallet may buy before the 1% cap (10,000,000). `graduated: true` means trade on PancakeSwap at `pair`. Soft/U/S: buy/sell/claim existing only — no new create.

## `gang quote --token <addr> --bnb <n>`

Soft: on-chain BNB quote. V2/U/S: `--bnb` is the **quote ERC-20** amount (same flag name); quote may be marked `approx: true` when computed off-chain. Fields: tokens out, spent, fee, refund. Non-zero `refund` means the 1% wallet cap or graduation reserve would bind.

## `gang buy --token <addr> --bnb <n> [--slippage 1]`

Preview only. Soft: payable BNB buy. V2/U/S: may first return `step: approve-quote` (approve quote ERC-20 to the pad); after that confirms, re-run the same buy to preview. Then `gang execute`. Show expected tokens, fee, refund, min out.

## `gang sell --token <addr> (--amount <tokens> | --all) [--slippage 1]`

Preview only. May first return `step: approve` for the token. Soft pays out BNB; V2/U/S pay out quote ERC-20. Then execute. Sells may need Binance App confirmation (`pendingConfirmation`).

## `gang execute --request-id <id>` / `gang tx --hash <0x..>`

Broadcast a preview; decode `Created` / `Buy` / `Sell` / `Graduated` after the tx lands.
