# Market Order

Swap tokens on-chain at the current market price, get quotes, and check market-order status.

## Security Pre-Check

Before executing `market-order swap`, complete the swap security pre-check in [security.md §1](security.md#1-swap-security-pre-check). This includes auditing non-trusted target tokens and presenting the security summary to the user.

## Fees

Market orders are subject to Binance Web3 Wallet trading fees. For the current fee schedule, see: https://www.binance.com/en/support/faq/detail/87cbb1ca0df34a348eaecb73c26167d7

## `market-order swap`

Swap one token for another at the current market price.

### Syntax

```bash
baw market-order swap --fromTokenQty <fromTokenQty> --fromToken <fromToken> --toToken <toToken> --binanceChainId <binanceChainId> [--slippage <slippage>] [--mev <mev>] [--gasLevel <gasLevel>] --json
```

### Parameters

| Parameter          | Required | Default | Description                                                                           |
|--------------------|----------|---------|---------------------------------------------------------------------------------------|
| `--fromTokenQty`   | Yes      | —       | Amount to swap, in human-readable units                                               |
| `--fromToken`      | Yes      | —       | Source token contract address                                                         |
| `--toToken`        | Yes      | —       | Destination token contract address                                                    |
| `--binanceChainId` | Yes      | —       | Binance chain ID: `56` (BSC), `CT_501` (Solana). For a full list, see `wallet chains` |
| `--slippage`       | No       | `auto`  | Slippage tolerance: "auto" or 0–100 (e.g., "2.5" = 2.5%)                              |
| `--mev`            | No       | `true`  | MEV protection: "true" or "false"                                                     |
| `--gasLevel`       | No       | `MEDIUM`  | Gas level: "LOW", "MEDIUM", or "HIGH"                                                 |

### Example

```bash
# Swap 0.1 BNB to USDT (defaults: slippage auto, mev on, gas level MEDIUM)
baw market-order swap --fromTokenQty 0.1 --fromToken 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE --toToken 0x55d398326f99059fF775485246999027B3197955 --binanceChainId 56 --json

# Swap 100 USDT to BNB with custom settings
baw market-order swap --fromTokenQty 100 --fromToken 0x55d398326f99059fF775485246999027B3197955 --toToken 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE --binanceChainId 56 --slippage 5 --mev false --gasLevel MEDIUM --json
```

### Response

```json
{ "success": true, "data": { "orderId": "1234567890" } }
```

### ⚠️ Mandatory: an orderId is NOT a completed swap — poll to a terminal state before reporting success

A `success: true` response with an `orderId` means the swap has only been **submitted**. It does **NOT** mean the swap executed. The order can still end up `FAILED` on-chain (with `txHash: null`) due to slippage, insufficient liquidity, routing, or network issues. Treating `success: true` / `orderId` as "done" is a real failure mode — it makes you report a success that never happened.

**You MUST do this after every `market-order swap` — do not skip it:**
1. **Do NOT tell the user the swap succeeded yet.** At most say it has been *submitted* and you are confirming.
2. **Poll `market-order list --orderId <orderId> --json` until `status` reaches a terminal state** (`FINISHED` or `FAILED`). `PENDING` is not terminal — keep polling.
3. **Report based on the terminal status, not on the submit response:**
   - `FINISHED` → report success, include `txHash` and actual received amount. **Check `refund` on the order:** if it has valid, non-empty entries, it was a **partial fill** — say so and list the refunded amount(s). A missing `refund` does not prove a full fill (see [Partial fill and `refund`](#partial-fill-and-refund)).
   - `FAILED` → **tell the user it failed** (note `txHash` may be `null`); do not present it as success or leave it ambiguous. Suggest retrying or a different token if appropriate.
   - Still `PENDING` after a reasonable wait (e.g. ~30s) → tell the user it is *still processing*, not that it succeeded; keep an eye on it or let them re-check with `market-order list`.

---

## `market-order quote`

Get a swap quote without executing the trade. Use this to show the user the expected output before they commit.

### Syntax

```bash
baw market-order quote --fromTokenQty <fromTokenQty> --fromToken <fromToken> --toToken <toToken> --binanceChainId <binanceChainId> [--slippage <slippage>] --json
```

### Parameters

| Parameter          | Required | Default | Description                                                                           |
|--------------------|----------|---------|---------------------------------------------------------------------------------------|
| `--fromTokenQty`   | Yes      | —       | Amount to swap, in human-readable units                                               |
| `--fromToken`      | Yes      | —       | Source token contract address                                                         |
| `--toToken`        | Yes      | —       | Destination token contract address                                                    |
| `--binanceChainId` | Yes      | —       | Binance chain ID: `56` (BSC), `CT_501` (Solana). For a full list, see `wallet chains` |
| `--slippage`       | No       | `auto`  | Slippage tolerance: "auto" or 0–100 (e.g., "2.5" = 2.5%)                              |

### Example

```bash
# Get a quote for swapping 0.1 BNB to USDT
baw market-order quote --fromTokenQty 0.1 --fromToken 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE --toToken 0x55d398326f99059fF775485246999027B3197955 --binanceChainId 56 --json
```

### Response

```json
{
  "success": true,
  "data": {
    "fromCoinSymbol": "BNB",
    "fromCoinAmount": "0.1",
    "toCoinSymbol": "USDT",
    "toCoinAmount": "87.686076196559241381",
    "slippage": 0.005
  }
}
```

---

## `market-order list`

List market orders, optionally filtered by status, token, or time range.

### Syntax

```bash
baw market-order list [--orderId <orderId>] [--status <status>] [--fromToken <fromToken>] [--toToken <toToken>] [--startTime <startTime>] [--endTime <endTime>] [--page <page>] [--pageSize <pageSize>] [--binanceChainId <binanceChainId>] --json
```

### Parameters

| Parameter          | Required | Default | Description                                                                           |
|--------------------|----------|---------|---------------------------------------------------------------------------------------|
| `--orderId`        | No       | —       | Look up a specific market order by ID (ignores other filters)                         |
| `--status`         | No       | —       | `PENDING`, `FINISHED`, or `FAILED`                                                    |
| `--fromToken`      | No       | —       | Filter by source token address                                                        |
| `--toToken`        | No       | —       | Filter by target token address                                                        |
| `--startTime`      | No       | —       | Start time (ms timestamp)                                                             |
| `--endTime`        | No       | —       | End time (ms timestamp)                                                               |
| `--page`           | No       | `1`     | Page number                                                                           |
| `--pageSize`       | No       | `20`    | Items per page, max 100                                                               |
| `--binanceChainId` | No       | —       | Binance chain ID: `56` (BSC), `CT_501` (Solana). For a full list, see `wallet chains` |

### Example

```bash
# List all market orders
baw market-order list --json

# Look up a specific market order
baw market-order list --orderId 1234567890 --json

# List pending market orders
baw market-order list --status PENDING --json
```

### Response

```json
{
  "success": true,
  "data": {
    "total": 2,
    "page": 1,
    "pageSize": 20,
    "list": [
      {
        "orderType": "market",
        "orderId": "1234567890",
        "chain": "56",
        "fromToken": "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
        "fromTokenName": "BNB",
        "fromTokenQty": "1.0",
        "toToken": "0x55d398326f99059fF775485246999027B3197955",
        "toTokenName": "USDT",
        "status": "FINISHED",
        "slippage": "0.5000",
        "txHash": "0xabcdef...",
        "bookTime": "2026-04-01T23:46:54+08:00",
        "updatedTime": "2026-04-01T23:46:56+08:00"
      },
      {
        "orderType": "market",
        "orderId": "1234567891",
        "chain": "56",
        "fromToken": "0x55d398326f99059fF775485246999027B3197955",
        "fromTokenName": "USDT",
        "fromTokenQty": "10",
        "toToken": "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
        "toTokenName": "BNB",
        "toTokenActualQty": "0.0167",
        "status": "FINISHED",
        "slippage": "0.5000",
        "txHash": "0xabcdef...",
        "bookTime": "2026-04-01T23:50:10+08:00",
        "updatedTime": "2026-04-01T23:50:12+08:00",
        "refund": [
          { "tokenAddress": "0x55d398326f99059fF775485246999027B3197955", "amount": "0.000000008796", "symbol": "USDT" }
        ]
      }
    ]
  }
}
```

### Partial fill and `refund`

A `FINISHED` order may carry an optional `refund` array listing tokens returned to the user.

- **Report a refund only for valid, non-empty `refund` entries.** Then the order was **partially filled**: say so, state the received amount (`toTokenActualQty`), and list each refunded `amount` + `symbol`. Do not just say "success".
- **A missing `refund` does not prove a full fill.** The CLI omits the field whenever the raw data is absent, unparsable, empty or malformed, so "no `refund`" only means no refund information is available. Report the actual received amount (`toTokenActualQty`); do not claim the order was filled in full.
- **A refund alone does not tell you why.** Do not attribute it to a specific cause (e.g. a holding cap) unless something else confirms it.

| Field                    | Description                                 |
|--------------------------|---------------------------------------------|
| `refund[].tokenAddress`  | Contract address of the refunded token      |
| `refund[].amount`        | Refunded amount, human-readable             |
| `refund[].symbol`        | Symbol of the refunded token                |

Use `symbol` as returned; do not substitute it from `tokenAddress`.

### Market Order Status

| Status     | Description              |
|------------|--------------------------|
| `PENDING`  | Being processed on-chain |
| `FINISHED` | Executed successfully    |
| `FAILED`   | Execution failed         |
