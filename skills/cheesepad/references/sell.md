# Sell on a Melt Curve

Do the checks in [SKILL.md](../SKILL.md#rules-that-always-apply) first. Selling needs **no Agent ID
check**, even on an Agent ID-only curve.

## 1. Check the listing, then get the amount

Listing `state` 1 / `listedAt` set → go to [Graduated curve](#graduated-curve), no steps call.

User gives a token amount, or "all". Run `baw wallet balance --tokenAddress <token.address> --binanceChainId <id> --json` → `data` is an array of `{symbol, address, binanceChainId, balance, price, value}`. Take the entry whose `address` is the token; `balance` is in **human units** (no decimals field). Empty array = zero balance. For "all", convert `balance` to wei with `token.decimals` from [find-curves.md](find-curves.md), without rounding up.

## 2. Get the steps

`GET https://api.cheesepad.ai/agent-trade/melt-curve/sell`

| Param | Required | Meaning |
|---|---|---|
| `chainId` | yes | `56` or `4663` |
| `fundManager` | yes | the curve |
| `seller` | yes | the wallet address from `baw wallet address --json` |
| `tokenAmount` | yes | token amount in wei (whole number) |
| `slippageBps` | no | 0 to 5000, default 100 |

Response: same shape as [buy.md](buy.md#2-get-the-steps). `steps` = an `approve` of the token (only
when the allowance is short), then the `sell`. `expectedOut` and `minOut` are in the quote
token's wei.

State tokens sold, expected proceeds, the minimum after slippage and the step count, then go straight to the first preview ([safety.md](safety.md#send-a-step)).

## Graduated curve

Listing `state` 1 / `listedAt` set, or `reason: curve_graduated` → the token trades on a DEX. Say so. With an explicit amount, check `baw wallet balance` covers it before quoting: short → say how much the wallet holds and stop. For "all", the amount is the token's `balance` from `baw wallet balance --tokenAddress <token.address> --binanceChainId <id> --json` (human units), passed as `--fromTokenQty`; zero → say the wallet holds none and stop. Then follow [Swap](safety.md#swap) with `--fromToken <token address>`, `--toToken <quote address>` (the native coin address if the quote is the zero address) and the amount as `--fromTokenQty`.

Other reasons: [safety.md](safety.md#eligible-false-reasons). `insufficient_balance` on a sell means
the wallet holds fewer tokens than `tokenAmount`: say how many it holds.
