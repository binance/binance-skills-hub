# Buy on a Melt Curve

Do the checks in [SKILL.md](../SKILL.md#rules-that-always-apply) first.

## 1. Pick the curve

Get `fundManager`, `quoteToken`, `agentIdOnly`, `maxWalletBps` from [find-curves.md](find-curves.md).

- `agentIdOnly: true` (BSC only) → run `baw wallet agent-id --json` first ([agent-id.md](agent-id.md)). `claimed: false` → stop.
- `maxWalletBps > 0` → tell the user the per-wallet limit is `maxWalletBps / 100` % of supply.

## 2. Get the steps

`GET https://api.cheesepad.ai/agent-trade/melt-curve/buy`

| Param | Required | Meaning |
|---|---|---|
| `chainId` | yes | `56` or `4663` |
| `fundManager` | yes | the curve |
| `buyer` | yes | the wallet address from `baw wallet address --json` |
| `amountIn` | yes | amount of the quote in wei (whole number). Native coin: 18 decimals |
| `slippageBps` | no | 0 to 5000, default 100 (1 %). Use the user's number if they give one |

Convert the user's amount to wei with the quote's decimals (the curve list has none):

| Quote | Decimals |
|---|---|
| Native coin (zero address) | 18 |
| BSC USDT `0x55d398326f99059fF775485246999027B3197955` | 18 |
| Robinhood USDG `0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168` | 6 |
| Any other | assume 18, then check `tokenInfos[<quote address, lowercase>].decimals` in the first preview. Different → stop, tell the user, recompute and fetch the steps again |

Response fields:

| Field | Meaning |
|---|---|
| `eligible` | `false` → follow [safety.md](safety.md#eligible-false-reasons) and stop |
| `steps` | in order: an `approve` (only when the quote is a token and the allowance is short), then the `buy` |
| `binanceChainId` | pass to `--binanceChainId` |
| `quoteToken`, `token` | quote and bought token |
| `amountIn`, `expectedOut`, `minOut` | wei. Tell the user `expectedOut` and the minimum `minOut` |
| `slippageBps` | the tolerance in use |
| `agentIdOnly`, `maxWalletBps` | the curve's rules |

State what they spend, the expected tokens, the minimum after slippage and the step count, then go straight to the first preview ([safety.md](safety.md#send-a-step)).

## 3. After the last step

Report the confirmed `txHash`. Do not claim a price or gain.

## Graduated curve

Listing `state` 1 / `listedAt` set, or `reason: curve_graduated` → the token trades on a DEX. Say so, then follow [Swap](safety.md#swap) with `--fromToken <quote address>` (the native coin address if the quote is the zero address), `--toToken <token.address>`, and the user's spend as `--fromTokenQty`.

## Insufficient balance

`reason: insufficient_balance` on a curve priced in a token the wallet lacks (for example USDT):

1. Say the wallet has too little of that token (`baw wallet balance --tokenAddress <quoteToken> --binanceChainId <id> --json` shows the balance).
2. Offer to swap BNB for it: [Swap](safety.md#swap) with `--fromToken 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE` and `--toToken <quoteToken>`. Size it with the quote so the result covers `amountIn`.
3. Ask CheesePad for the buy steps again and continue from step 2 above.

If the wallet lacks the native coin, tell the user to top up. Do not swap it for them.
