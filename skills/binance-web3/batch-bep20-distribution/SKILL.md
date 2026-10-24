---
name: batch-bep20-distribution
description: |
  Distribute a BEP-20 token to thousands of addresses on BNB Smart Chain (BSC)
  cheaply and reliably with a batch-sender contract. Covers: why naive per-address
  transfers do not scale, the approve-once + batch transferFrom pattern, batch
  sizing and gas math, idempotency and retry strategy, funding-wallet hygiene, and
  a live production reference deployment that airdropped to ~90,000 addresses.

  Use this skill when users ask about:
  - Airdropping a BEP-20 token to many wallets on BSC
  - Estimating gas cost of a mass token distribution
  - Building or using a multisend / batch-sender contract
  - Resuming an interrupted airdrop without double-paying
metadata:
  author: m284743
  version: "1.0"
---

# Batch BEP-20 Distribution on BSC

## Overview

Sending a token to N addresses one `transfer` at a time costs ~21,000–65,000 gas
per address in transaction overhead alone — at 90,000 recipients that is days of
transactions and a large BNB bill. The standard fix is a **batch-sender
contract**: one transaction moves tokens to hundreds of recipients, amortizing the
21,000-gas base fee and calldata costs across the whole batch.

## The Pattern

```solidity
interface IERC20Minimal {
    function transferFrom(address from, address to, uint256 value) external returns (bool);
}

contract BatchSender {
    /// Caller must first approve(this, total) on the token contract.
    function sendBatch(address token, address[] calldata tos, uint256[] calldata amounts) external {
        require(tos.length == amounts.length, "length");
        for (uint256 i = 0; i < tos.length; i++) {
            require(
                IERC20Minimal(token).transferFrom(msg.sender, tos[i], amounts[i]),
                "transfer failed"
            );
        }
    }
}
```

`sendBatch(address,address[],uint256[])` selector: `0x1f734c59`

Key properties:

- **Approve once, send many batches.** The sender approves the contract for the
  full distribution total, then calls `sendBatch` repeatedly. Tokens move directly
  from the sender's wallet; the contract never holds a balance.
- **Atomic per batch.** If any single `transferFrom` fails, the whole batch
  reverts — no partial batch states to reconcile.
- **Nothing to rescue.** The contract holds no funds, so there is no admin or
  withdraw function to abuse.

## Gas Math (BSC mainnet, ~1–3 gwei)

Rule of thumb per `sendBatch` call: `base ≈ 25,000 gas + ≈ 32,000–48,000 gas per
recipient` (ERC-20 `transferFrom` to a fresh address costs more than to an
existing holder).

| Recipients per tx | Approx gas/tx | Why this size |
|-------------------|---------------|---------------|
| 100               | ~3.5–5 M      | Conservative; fast retry loop |
| 200               | ~7–10 M       | Common sweet spot on BSC |
| 300               | ~10–15 M      | Approach block gas target; test first |

Total cost scales linearly with recipient count: ~90,000 fresh-address recipients
≈ 450 batches of 200 ≈ low single-digit BNB at typical gas prices. Always
dry-run one batch on mainnet with 5–10 recipients and extrapolate from the real
receipt instead of trusting estimates.

## Idempotency & Retries

Airdrops get interrupted (RPC limits, nonce gaps, crashes). Design for resume:

1. **Persist progress.** Write the recipient list to a file with a `sent` flag
   per row; update after every confirmed receipt.
2. **Verify on-chain before re-sending.** For spot checks, `balanceOf` the
   recipient — but prefer the local ledger; balance checks cannot distinguish
   your payment from the recipient's own trading.
3. **Never re-send an unconfirmed batch blindly.** If a tx times out, fetch its
   receipt first (`eth_getTransactionReceipt`); only resend if it is absent or
   reverted.
4. **Fixed nonce discipline.** Send batches sequentially from one wallet with
   locally tracked nonces, or use `eth_getTransactionCount(pending)`.

## Funding-Wallet Hygiene

- Use a **dedicated payer wallet** holding exactly the distribution budget plus a
  gas buffer — not your treasury or fee-collector wallet (unless it is itself the
  designated payer).
- Fund it with `total_amount + ~10%` and the BNB gas estimate × 1.5.
- After completion, revoke the remaining allowance
  (`approve(batchSender, 0)`) and sweep leftovers.

## Planning Tool

`scripts/plan_batches.mjs` (included) takes a CSV (`address,amount`) and splits
it into sized batches with running totals — useful for progress files and for
verifying the sum before funding the payer wallet.

## Live Reference Deployment (Case Study)

A production batch-sender on BSC, inspectable on BscScan:

| Component        | Address                                      |
|------------------|----------------------------------------------|
| BatchSender      | `0x882e4475622c2e8dca9ea2c1aef21f1011b5de64` |
| Distributed token| `0x67B8c7abeB7A6b6ef29f15032423AfAB4006888f` |

This exact pattern was used to airdrop 0.1 tokens each to ~90,000 Agent ID holder
addresses (~450 sequential batches, resume-safe, from a dedicated payer wallet).

*This deployment is cited strictly as an educational reference for the batch
distribution pattern. Nothing here is a recommendation, endorsement, or guarantee
of any asset.*
