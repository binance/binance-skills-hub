# Sales: contribute, claim, refund

Covers presales, fair launches, subscriptions and microsales. Do the checks in
[SKILL.md](../SKILL.md#rules-that-always-apply) first. Find the sale and its `fundManager` with
[find-curves.md](find-curves.md).

**Sales that need a contribution signature (`reason: validation_required`) can't be joined by an
agent.** Say so plainly and point the user to the sale page on cheesepad.ai.

## Endpoints

All `GET https://api.cheesepad.ai/agent-trade/sale/<action>`.

| Action | Path | Params |
|---|---|---|
| Contribute | `/agent-trade/sale/contribute` | `chainId`, `fundManager`, `wallet`, `amount`, optional `slippageBps` |
| Claim tokens | `/agent-trade/sale/claim` | `chainId`, `fundManager`, `wallet` |
| Refund | `/agent-trade/sale/refund` | `chainId`, `fundManager`, `wallet` |

`wallet` = the address from `baw wallet address --json`. `amount` = whole-number wei of the sale's
currency (`currency.decimals` from the listing; the native coin has 18). The sale kind and
whether it needs an approve are decided by CheesePad.

Response fields (as in [buy.md](buy.md#2-get-the-steps), plus). Ignore `expectedOut` and `minOut` (always `"0"`) and `slippageBps` (sales do not use it). `amountIn` is the user's amount for a contribute, `"0"` for claim and refund:

| Field | Meaning |
|---|---|
| `saleKind` | `presale`, `fairlaunch`, `subscription`, `microsale` |
| `currency` | the sale's currency; the zero address = native coin |
| `steps` | contribute: an `approve` first when the currency is a token, then `contribute`. Claim: `claim`. Refund: `refund` |
| `agentIdOnly` | `true` when this contribution is under an Agent ID rule |
| `penaltyBps`, `refundAmount` | refund only |

## Contribute

1. Agent ID sale (`whitelistSource: agentId` before `publicSaleStartTime`, or microsale `agentIdOnly: true`) → [agent-id.md](agent-id.md) first.
2. Call `contribute`. `eligible: false` → [safety.md](safety.md#eligible-false-reasons).
3. State the sale, amount and currency, the sale's min, max and hard cap from the listing, and the step count, then go straight to the first preview ([safety.md](safety.md#send-a-step)).
4. Tokens are not in the wallet yet. They come from a claim after the sale is finalized.

## Claim

1. Call `claim` with the same `wallet`. `not_claimable_yet` (sale not finalized, vesting or listing not open) and `nothing_to_claim` are normal: explain and stop.
2. Go straight to the preview ([safety.md](safety.md#send-a-step)). The response has no claim amount: it comes from the preview's `balanceChanges`. Vested sales pay only the unlocked part; claim again later for more.

## Refund

A refund returns the wallet's contribution. Three cases: the sale was cancelled, the sale ended
below its soft cap, or the user exits a live sale early (with a penalty).

1. Call `refund`. `eligible: false` → [safety.md](safety.md#eligible-false-reasons).
2. **Before any preview**, tell the user in plain words:
   - how much comes back: `refundAmount`, which is net of any penalty, in the sale's currency (convert wei with the currency decimals, name the currency);
   - if `penaltyBps > 0`: the penalty as a percent, `penaltyBps / 100` %, kept by the sale. Example, `penaltyBps: 1000`: "You'll get back 0.18 BNB. A 10% penalty on your contribution is kept by the sale." Never compute a currency penalty;
   - that the refund is final.
3. Ask: "Do you want to refund?" Get a clear yes. Not yet → no preview.
4. Only then send the step ([safety.md](safety.md#send-a-step)). Two yeses: the first is to the refund and its penalty, the second to Binance's preview.

Never start a refund the user didn't ask for, and never present the penalty as optional.

## Reading `sale_*` reasons

| Reason | Contribute | Claim | Refund |
|---|---|---|---|
| `sale_paused` | sale paused, try later | same | same |
| `unsupported_sale` | not supported by agent steps, use the sale page; never retry | same | same |
| `whitelist_not_published` | the sale's list isn't live yet, try later | | |
| `not_whitelisted` | wallet not on the list; stop | | |
| `validation_required` | agents can't join; stop | | |

The complete reason list is in [safety.md](safety.md#eligible-false-reasons).
