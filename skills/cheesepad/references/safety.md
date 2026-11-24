# Safety and sending steps

## Before any contract call

[SKILL.md rules](../SKILL.md#rules-that-always-apply) 0-2 and 4, before the first steps call (a swap needs only 1 and 4): wallet connected, Developer Mode on (`devMode.enabled` true, `devMode.expiresAt` ms still ahead of `date +%s` × 1000), wallet address. Developer Mode off → tell the user: Binance App → Agentic Wallet management page → Settings → **Developer Mode** → confirm the Risk Warning → approve the signature request. Continue after they say it is on and you re-checked.

## Send a step

Every item in `steps` has `kind`, `to`, `value` (wei), `data`.

1. Preview:
   `baw contract-call preview --binanceChainId <binanceChainId> --from <walletAddress> --to <step.to> --value <step.value> --inputData <step.data> --json`
2. Preview fails or is intercepted (no `requestId`) → show the error as returned and stop.
3. Check the preview; any failure → stop and tell the user:
   - `to` is the CheesePad contract for the chain ([SKILL.md](../SKILL.md#chains)). Exception: an `approve` goes to the token being approved, its spender (the first argument after `0x095ea7b3` in `data`) must be the CheesePad contract, `parsedTx.isMax` must be false, and `parsedTx.amount` must equal the amount spent (`amountIn` for a buy, `tokenAmount` for a sell, `amount` for a contribute).
   - Units: `parsedTx.amount` is in smallest units. The units of `simulationResult.balanceChanges` are undocumented: read each amount both ways (as is, and ÷ 10^decimals) and take the reading nearer the API's own figure (`expectedOut`, `refundAmount`, or the contribution). Decimals come from the listing or the quote table in [buy.md](buy.md#2-get-the-steps); `tokenInfos` (keyed by lowercase address, `0xeeee…eeee` = native coin) is only a cross-check when it lists the token.
   - Every non-approve step: the first argument in `data` (the 64 hex characters after `0x` and the 8-character selector) ends with the `fundManager` you asked about, compared in lowercase.
   - Compare big amounts as decimal text or against the calldata, never through floating point (`parsedTx.amount` can exceed 2^53; `jq` rounds).
   - Buy: the bought token's change is at least `minOut`. Sell: the amount received is at least `minOut`. Slightly above `expectedOut` is fine (rounding); below `minOut` → stop.
   - Contribute: the spend equals the requested amount.
   - Claim: a positive change in the sale's token, and nothing but gas leaving the wallet.
   - Refund: a positive change in the sale's currency matching `refundAmount`, and nothing but gas leaving the wallet.
4. Show the user: `parsedTx`, `balanceChanges`, each `risks.riskDetails` item (`title`, `description`), risky `risks.addresses`, `authorityChanges` if any.
5. Ask for an explicit yes, with a few words reminding them to do their own research. Anything else is a no.
6. Before execute, compare the preview's `expiresAt` (ms) with `date +%s` × 1000. Passed → preview again and ask again. Then `baw contract-call execute --requestId <requestId> --json`.
   - `requireConfirmation: true` in the preview → tell the user they will approve in the Binance App.
   - `BROADCASTED` → note `txHash`. `PENDING_CONFIRMATION` → user approves in the App, then continue when they say so.
   - Any other status or an error → show it as returned and stop.
7. Confirm: `baw wallet tx-history --tx <txHash> --binanceChainId <binanceChainId> --json`, waiting 5 s (`sleep 5`) between polls, up to 3 minutes, until `status` is `confirmed`. Not confirmed by then → say it hasn't confirmed yet and stop. Failed → show the error and stop. Never retry without the user.

Two steps (an approve, then the action) = two full rounds. Approvals are for the exact amount only. Fetch the steps again if more than a couple of minutes pass before the last one.

## Never

- Skip the preview or the user's yes, even when the user said "just do it".
- Send a step from a response with `eligible: false`.
- Use an address you did not get from the API or the user.
- Pass gas options.
- Promise a price or profit, or say a token is good or bad.

## Swap

Used when a curve has graduated, or to get a curve's quote token. A swap has no contract-call preview: the user's yes to the stated quote is its confirmation.

1. Quote: `baw market-order quote --fromTokenQty <human amount> --fromToken <from> --toToken <to> --binanceChainId <id> [--slippage <percent>] --json`. The native coin is `0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE` in `--fromToken` and `--toToken`, never the zero address.
2. Pre-check the target (`--toToken`) before asking, per Binance's Agentic Wallet skill: SKILL.md "Common Token Addresses" and `references/security.md` §1.
   - On the table, no audit: BSC BNB `0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE`, USDT `0x55d398326f99059fF775485246999027B3197955`, USDC `0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d`, U `0xcE24439F2D9C6a2289F741120FE202248B666666`, USD1 `0x8d0D000Ee44948FC98c9B98A4FA4921476f08B0d`. Robinhood: ETH native, USDG `0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168`, USDE `0x5d3a1Ff2b6BAb83b63cd9AD0787074081a52ef34`.
   - Otherwise audit it with Binance's `query-token-audit` skill and show the hit risk items.
   - Audit unavailable, unsupported (`hasResult` or `isSupported` false) or skill not installed → say so and go on only on the user's explicit yes to that.
3. Ask once: the amounts from the quote, the slippage ("slippage auto (Binance's default)", or the percent the user named), and the audit result if there was one. Remind them to do their own research, and say this yes sends the swap: there is no second preview. A yes is the confirmation. Don't interpret the quote's own `slippage` number.
4. Swap: `baw market-order swap --fromTokenQty <human amount> --fromToken <from> --toToken <to> --binanceChainId <id> [--slippage <same percent>] --json`.
5. Poll `baw market-order list --orderId <orderId> --json`, waiting 5 s (`sleep 5`) between polls, up to 3 minutes, until `FINISHED` or `FAILED`. `FINISHED` → report `txHash` and the received amount (`toTokenActualQty`); a non-empty `refund` list means a partial fill: say so and list each refunded `amount` and `symbol`. `FAILED` → show the error and stop, no retry without the user. Still `PENDING` → say it has not finished and stop.

## API errors

| HTTP | `code` | Say |
|---|---|---|
| 400 | `invalid_params` | The request was malformed; fix the parameter named in `message` |
| 400 | `unsupported_chain` | Agent steps don't support this chain |
| 404 | `curve_not_found` | No Melt Curve for that `fundManager` on that chain |
| 404 | `sale_not_found` | No pool or microsale for that `fundManager` on that chain |
| 429 | | Too many requests; wait a minute |

## `eligible: false` reasons

Stop, say the plain meaning, send nothing.

| `reason` | Plain meaning | Next |
|---|---|---|
| `agent_id_required` | This curve or sale is for Agent ID holders and CheesePad finds none on this wallet | `claimed: false` → claim one (Binance App → Web3 Wallet → Agent ID), then retry. Otherwise: `agent_id_required` while `claimed: true`: don't wait or retry in this turn. Tell the user CheesePad doesn't see an Agent ID on this wallet yet (it can lag about a minute after a claim), to ask again in a minute, and if it persists to check the claim in the Binance App. Never loop. |
| `max_wallet_exceeded` | The buy would take the wallet over the curve's per-wallet limit (`maxWalletBps`/100 % of supply) | Offer a smaller amount |
| `curve_graduated` | The curve is full and the token trades on a DEX | Offer a DEX swap ([buy.md](buy.md#graduated-curve), [sell.md](sell.md#graduated-curve)) |
| `curve_not_active` | The curve is not trading now. This includes a paused curve | Say it is not trading now (it may be paused) and suggest trying later |
| `sold_out` | The curve has sold out and is about to graduate | Stop; check again later |
| `insufficient_balance` | The wallet lacks the amount | Buy: offer a swap if the curve's quote is a token the wallet lacks ([buy.md](buy.md#insufficient-balance)). Sell or sale: say how much is missing |
| `not_whitelisted` | The wallet is not on this sale's list | Stop and say so |
| `whitelist_not_published` | The sale's list is not live yet | Stop; suggest trying later |
| `validation_required` | The sale needs a contribution signature | An agent can't join this sale; point the user to the sale page on cheesepad.ai |
| `sale_not_started` | The sale (or this wallet's window) has not opened | Stop; give the start time from the sale listing if known |
| `sale_ended` | The sale is over | Stop; claim or refund may apply |
| `below_min_contribution` | The amount is under the sale's minimum | Offer a larger amount |
| `above_max_contribution` | The amount would pass the per-wallet maximum | Offer a smaller amount |
| `hardcap_reached` | The sale has no room left for this amount | Stop |
| `nothing_to_claim` | This wallet has nothing to claim | Stop |
| `not_claimable_yet` | Claiming is not open yet, or more unlocks later | Stop; suggest trying later |
| `not_refundable` | No refund is available to this wallet now | Stop |
| `sale_paused` | The sale is paused for now | Say so and suggest trying later |
| `unsupported_sale` | Agent steps don't support this sale | Point the user to the sale page on cheesepad.ai. **Never suggest retrying** |

For a reason not in this table: show the `reason` text, do not guess, send nothing.
