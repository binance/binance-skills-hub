---
name: binance-wallet
version: 1.0.0
description: Binance Wallet API — universal asset transfers between all wallet types, balance queries, and account snapshots.
category: exchange
tags: [binance, wallet, transfer, balance, asset-management]
author: fundingArb
authentication: hmac-sha256
base_urls:
  mainnet: https://api.binance.com
  testnet: https://testnet.binance.vision
user_agent: "binance-wallet/1.0.0 (Skill)"
---

# Binance Wallet API Skill

## Overview

This skill provides complete coverage of the Binance Wallet and Asset Management API surface. It enables:

- **Universal transfers** between all Binance wallet types (Spot, USDT-M Futures, COIN-M Futures, Margin, Isolated Margin, Funding)
- **Balance queries** across every wallet in a single call
- **Daily account snapshots** for Spot, Margin, and Futures accounts
- **Coin network configuration** including deposit/withdrawal chain details
- **Transfer history** with pagination and time-range filtering

All endpoints are under the `/sapi/` namespace and require HMAC-SHA256 signed requests with a valid API key.

---

## Authentication

All endpoints in this skill require **HMAC-SHA256** request signing.

### Requirements

| Parameter   | Location     | Description                                      |
|-------------|--------------|--------------------------------------------------|
| X-MBX-APIKEY | HTTP Header | Your Binance API key                             |
| timestamp   | Query string | Current UTC time in milliseconds (Unix epoch ms) |
| signature   | Query string | HMAC-SHA256 of the full query string              |

### Signing Procedure

1. Construct the query string with all parameters **except** `signature`.
2. Compute HMAC-SHA256 of that query string using your **Secret Key** as the key.
3. Append `&signature=<hex digest>` to the query string.

### Full Example

Given:

- API Key: `vmPUZE6mv9SD5VNHk4HlWFsOr6aKE2zvsw0MuIgwCIPy6utIco14y7Ju91duEh8A`
- Secret Key: `NhqPtmdSJYdKjVHjA7PZj4Mge3R5YNiP1e3UZjInClVN65XAbvqqM6A7H5fATj0j`

**Step 1 — Build query string:**

```
asset=USDT&amount=100&type=MAIN_UMFUTURE&timestamp=1688888888000&recvWindow=5000
```

**Step 2 — Compute HMAC-SHA256:**

```bash
echo -n "asset=USDT&amount=100&type=MAIN_UMFUTURE&timestamp=1688888888000&recvWindow=5000" \
  | openssl dgst -sha256 -hmac "NhqPtmdSJYdKjVHjA7PZj4Mge3R5YNiP1e3UZjInClVN65XAbvqqM6A7H5fATj0j"
```

Output: `a1b2c3d4e5f6...` (hex string)

**Step 3 — Send signed request:**

```bash
curl -X POST "https://api.binance.com/sapi/v1/asset/transfer?\
asset=USDT&amount=100&type=MAIN_UMFUTURE&timestamp=1688888888000&recvWindow=5000\
&signature=a1b2c3d4e5f6..." \
  -H "X-MBX-APIKEY: vmPUZE6mv9SD5VNHk4HlWFsOr6aKE2zvsw0MuIgwCIPy6utIco14y7Ju91duEh8A"
```

### Python Signing Helper

```python
import hmac
import hashlib
import time
import requests

API_KEY = "your_api_key"
SECRET_KEY = "your_secret_key"
BASE_URL = "https://api.binance.com"

def sign(params: dict) -> dict:
    """Add timestamp and HMAC-SHA256 signature to params."""
    params["timestamp"] = int(time.time() * 1000)
    query_string = "&".join(f"{k}={v}" for k, v in params.items())
    signature = hmac.new(
        SECRET_KEY.encode(), query_string.encode(), hashlib.sha256
    ).hexdigest()
    params["signature"] = signature
    return params

def headers() -> dict:
    return {"X-MBX-APIKEY": API_KEY}
```

---

## Transfer Type Matrix

The universal transfer endpoint supports transfers between the following wallet pairs. Each direction is a separate type.

| Type                      | From                | To                  | Notes                                 |
|---------------------------|---------------------|---------------------|---------------------------------------|
| `MAIN_UMFUTURE`          | Spot                | USDT-M Futures      |                                       |
| `UMFUTURE_MAIN`          | USDT-M Futures      | Spot                |                                       |
| `MAIN_CMFUTURE`          | Spot                | COIN-M Futures      |                                       |
| `CMFUTURE_MAIN`          | COIN-M Futures      | Spot                |                                       |
| `MAIN_MARGIN`            | Spot                | Cross Margin        |                                       |
| `MARGIN_MAIN`            | Cross Margin        | Spot                |                                       |
| `MAIN_ISOLATED_MARGIN`   | Spot                | Isolated Margin     | Requires `toSymbol` (e.g. "BTCUSDT") |
| `ISOLATED_MARGIN_MAIN`   | Isolated Margin     | Spot                | Requires `fromSymbol`                 |
| `UMFUTURE_MARGIN`        | USDT-M Futures      | Cross Margin        |                                       |
| `MARGIN_UMFUTURE`        | Cross Margin        | USDT-M Futures      |                                       |
| `CMFUTURE_MARGIN`        | COIN-M Futures      | Cross Margin        |                                       |
| `MARGIN_CMFUTURE`        | Cross Margin        | COIN-M Futures      |                                       |
| `MAIN_FUNDING`           | Spot                | Funding             |                                       |
| `FUNDING_MAIN`           | Funding             | Spot                |                                       |

> **Isolated Margin note:** When transferring to or from an isolated margin account, you must specify the trading pair symbol via `toSymbol` or `fromSymbol` respectively.

---

## Endpoints

---

### POST /sapi/v1/asset/transfer

**Universal Transfer**

Execute a transfer between any two supported wallet types.

**Weight:** 900

**Parameters:**

| Name        | Type    | Required | Description                                                                 |
|-------------|---------|----------|-----------------------------------------------------------------------------|
| type        | STRING  | Yes      | Transfer type from the Transfer Type Matrix (e.g. `MAIN_UMFUTURE`)         |
| asset       | STRING  | Yes      | Asset to transfer (e.g. `USDT`, `BTC`)                                     |
| amount      | DECIMAL | Yes      | Transfer amount (e.g. `100.50`)                                            |
| fromSymbol  | STRING  | No       | Required when type is `ISOLATED_MARGIN_MAIN` (e.g. `BTCUSDT`)             |
| toSymbol    | STRING  | No       | Required when type is `MAIN_ISOLATED_MARGIN` (e.g. `BTCUSDT`)             |
| recvWindow  | LONG    | No       | Max milliseconds the request is valid after timestamp. Default 5000        |
| timestamp   | LONG    | Yes      | Current UTC time in milliseconds                                           |
| signature   | STRING  | Yes      | HMAC-SHA256 signature                                                      |

**Example Request:**

```bash
curl -X POST "https://api.binance.com/sapi/v1/asset/transfer?\
type=MAIN_UMFUTURE&asset=USDT&amount=500.00&timestamp=1700000000000\
&signature=<signature>" \
  -H "X-MBX-APIKEY: <api_key>"
```

**Example Response (200 OK):**

```json
{
    "tranId": 13526853623
}
```

The returned `tranId` can be used to verify the transfer via the transfer history endpoint.

**Example Request — Isolated Margin:**

```bash
curl -X POST "https://api.binance.com/sapi/v1/asset/transfer?\
type=MAIN_ISOLATED_MARGIN&asset=USDT&amount=200.00&toSymbol=BTCUSDT\
&timestamp=1700000000000&signature=<signature>" \
  -H "X-MBX-APIKEY: <api_key>"
```

**Example Response:**

```json
{
    "tranId": 13526853701
}
```

---

### GET /sapi/v1/asset/transfer

**Transfer History**

Query the history of universal transfers with pagination.

**Weight:** 1

**Parameters:**

| Name       | Type   | Required | Description                                                      |
|------------|--------|----------|------------------------------------------------------------------|
| type       | STRING | Yes      | Transfer type from the Transfer Type Matrix                      |
| startTime  | LONG   | No       | Start time in ms. Default: 30 days before endTime                |
| endTime    | LONG   | No       | End time in ms. Default: current time                            |
| current    | INT    | No       | Page number, starting from 1. Default: 1                         |
| size       | INT    | No       | Results per page. Default: 10, max: 100                          |
| recvWindow | LONG   | No       | Max milliseconds the request is valid after timestamp            |
| timestamp  | LONG   | Yes      | Current UTC time in milliseconds                                 |
| signature  | STRING | Yes      | HMAC-SHA256 signature                                            |

**Example Request:**

```bash
curl -G "https://api.binance.com/sapi/v1/asset/transfer" \
  --data-urlencode "type=MAIN_UMFUTURE" \
  --data-urlencode "startTime=1699900000000" \
  --data-urlencode "endTime=1700100000000" \
  --data-urlencode "current=1" \
  --data-urlencode "size=20" \
  --data-urlencode "timestamp=1700100000000" \
  --data-urlencode "signature=<signature>" \
  -H "X-MBX-APIKEY: <api_key>"
```

**Example Response (200 OK):**

```json
{
    "total": 3,
    "rows": [
        {
            "asset": "USDT",
            "amount": "500.00000000",
            "type": "MAIN_UMFUTURE",
            "status": "CONFIRMED",
            "tranId": 13526853623,
            "timestamp": 1700000000000
        },
        {
            "asset": "USDT",
            "amount": "1200.00000000",
            "type": "MAIN_UMFUTURE",
            "status": "CONFIRMED",
            "tranId": 13526853590,
            "timestamp": 1699950000000
        },
        {
            "asset": "BTC",
            "amount": "0.05000000",
            "type": "MAIN_UMFUTURE",
            "status": "CONFIRMED",
            "tranId": 13526853401,
            "timestamp": 1699900500000
        }
    ]
}
```

**Transfer statuses:** `PENDING`, `CONFIRMED`, `FAILED`

---

### GET /sapi/v3/asset/getUserAsset

**All Asset Balances**

Returns balances for all assets (or a specific asset) across the user's Spot wallet. Use this to enumerate holdings before transferring.

**Weight:** 5

**Parameters:**

| Name             | Type    | Required | Description                                           |
|------------------|---------|----------|-------------------------------------------------------|
| asset            | STRING  | No       | Filter by a single asset (e.g. `BTC`). Omit for all. |
| needBtcValuation | BOOLEAN | No       | If `true`, include BTC valuation. Default: `false`    |
| recvWindow       | LONG    | No       | Max milliseconds the request is valid after timestamp |
| timestamp        | LONG    | Yes      | Current UTC time in milliseconds                      |
| signature        | STRING  | Yes      | HMAC-SHA256 signature                                 |

**Example Request:**

```bash
curl -G "https://api.binance.com/sapi/v3/asset/getUserAsset" \
  --data-urlencode "needBtcValuation=true" \
  --data-urlencode "timestamp=1700000000000" \
  --data-urlencode "signature=<signature>" \
  -H "X-MBX-APIKEY: <api_key>"
```

**Example Response (200 OK):**

```json
[
    {
        "asset": "USDT",
        "free": "15234.56000000",
        "locked": "500.00000000",
        "freeze": "0.00000000",
        "withdrawing": "0.00000000",
        "ipoable": "0.00000000",
        "btcValuation": "0.22851840"
    },
    {
        "asset": "BTC",
        "free": "0.45230000",
        "locked": "0.00000000",
        "freeze": "0.00000000",
        "withdrawing": "0.00000000",
        "ipoable": "0.00000000",
        "btcValuation": "0.45230000"
    },
    {
        "asset": "ETH",
        "free": "12.80000000",
        "locked": "2.50000000",
        "freeze": "0.00000000",
        "withdrawing": "0.00000000",
        "ipoable": "0.00000000",
        "btcValuation": "0.61440000"
    },
    {
        "asset": "BNB",
        "free": "35.20000000",
        "locked": "0.00000000",
        "freeze": "0.00000000",
        "withdrawing": "0.00000000",
        "ipoable": "0.00000000",
        "btcValuation": "0.03168000"
    },
    {
        "asset": "SOL",
        "free": "120.00000000",
        "locked": "0.00000000",
        "freeze": "0.00000000",
        "withdrawing": "0.00000000",
        "ipoable": "0.00000000",
        "btcValuation": "0.04320000"
    }
]
```

**Field definitions:**

| Field         | Description                                    |
|---------------|------------------------------------------------|
| free          | Available balance                              |
| locked        | In open orders                                 |
| freeze        | Frozen by the system (e.g. margin collateral)  |
| withdrawing   | Pending withdrawal                             |
| ipoable       | Available for Launchpad subscription            |
| btcValuation  | Estimated BTC value (only if requested)        |

---

### GET /sapi/v1/capital/config/getall

**Coin Network Information**

Returns network configuration for all coins, including deposit/withdrawal details per chain.

**Weight:** 10

**Parameters:**

| Name       | Type   | Required | Description                                           |
|------------|--------|----------|-------------------------------------------------------|
| recvWindow | LONG   | No       | Max milliseconds the request is valid after timestamp |
| timestamp  | LONG   | Yes      | Current UTC time in milliseconds                      |
| signature  | STRING | Yes      | HMAC-SHA256 signature                                 |

**Example Request:**

```bash
curl -G "https://api.binance.com/sapi/v1/capital/config/getall" \
  --data-urlencode "timestamp=1700000000000" \
  --data-urlencode "signature=<signature>" \
  -H "X-MBX-APIKEY: <api_key>"
```

**Example Response (200 OK) — truncated to one coin:**

```json
[
    {
        "coin": "USDT",
        "depositAllEnable": true,
        "withdrawAllEnable": true,
        "name": "TetherUS",
        "free": "15234.56000000",
        "locked": "500.00000000",
        "freeze": "0.00000000",
        "withdrawing": "0.00000000",
        "ipoing": "0.00000000",
        "ipoable": "0.00000000",
        "storage": "0.00000000",
        "isLegalMoney": false,
        "trading": true,
        "networkList": [
            {
                "network": "ETH",
                "coin": "USDT",
                "withdrawIntegerMultiple": "0.00000100",
                "isDefault": false,
                "depositEnable": true,
                "withdrawEnable": true,
                "depositDesc": "",
                "withdrawDesc": "",
                "specialTips": "",
                "name": "Ethereum (ERC20)",
                "resetAddressStatus": false,
                "addressRegex": "^(0x)[0-9A-Fa-f]{40}$",
                "memoRegex": "",
                "withdrawFee": "3.00000000",
                "withdrawMin": "10.00000000",
                "withdrawMax": "10000000.00000000",
                "minConfirm": 12,
                "unLockConfirm": 0,
                "sameAddress": false,
                "estimatedArrivalTime": 5,
                "busy": false,
                "country": ""
            },
            {
                "network": "TRX",
                "coin": "USDT",
                "withdrawIntegerMultiple": "0.00000100",
                "isDefault": true,
                "depositEnable": true,
                "withdrawEnable": true,
                "depositDesc": "",
                "withdrawDesc": "",
                "specialTips": "",
                "name": "Tron (TRC20)",
                "resetAddressStatus": false,
                "addressRegex": "^T[1-9A-HJ-NP-Za-km-z]{33}$",
                "memoRegex": "",
                "withdrawFee": "1.00000000",
                "withdrawMin": "10.00000000",
                "withdrawMax": "10000000.00000000",
                "minConfirm": 1,
                "unLockConfirm": 0,
                "sameAddress": false,
                "estimatedArrivalTime": 2,
                "busy": false,
                "country": ""
            }
        ]
    }
]
```

---

### GET /sapi/v1/accountSnapshot

**Daily Account Snapshot**

Returns a daily snapshot of Spot, Margin, or Futures account balances. Useful for tracking portfolio value over time and reconciliation.

**Weight:** 2400

**Parameters:**

| Name       | Type   | Required | Description                                                        |
|------------|--------|----------|--------------------------------------------------------------------|
| type       | STRING | Yes      | Account type: `SPOT`, `MARGIN`, or `FUTURES`                       |
| startTime  | LONG   | No       | Start time in ms. Default: 7 days ago                              |
| endTime    | LONG   | No       | End time in ms. Default: current time                              |
| limit      | INT    | No       | Number of days. Min: 7, Max: 30, Default: 7                       |
| recvWindow | LONG   | No       | Max milliseconds the request is valid after timestamp              |
| timestamp  | LONG   | Yes      | Current UTC time in milliseconds                                   |
| signature  | STRING | Yes      | HMAC-SHA256 signature                                              |

**Example Request:**

```bash
curl -G "https://api.binance.com/sapi/v1/accountSnapshot" \
  --data-urlencode "type=SPOT" \
  --data-urlencode "limit=7" \
  --data-urlencode "timestamp=1700000000000" \
  --data-urlencode "signature=<signature>" \
  -H "X-MBX-APIKEY: <api_key>"
```

**Example Response — SPOT (200 OK):**

```json
{
    "code": 200,
    "msg": "",
    "snapshotVos": [
        {
            "type": "spot",
            "updateTime": 1699920000000,
            "data": {
                "totalAssetOfBtc": "0.68189840",
                "balances": [
                    {
                        "asset": "USDT",
                        "free": "15234.56000000",
                        "locked": "500.00000000"
                    },
                    {
                        "asset": "BTC",
                        "free": "0.45230000",
                        "locked": "0.00000000"
                    },
                    {
                        "asset": "ETH",
                        "free": "12.80000000",
                        "locked": "2.50000000"
                    }
                ]
            }
        },
        {
            "type": "spot",
            "updateTime": 1699833600000,
            "data": {
                "totalAssetOfBtc": "0.67542100",
                "balances": [
                    {
                        "asset": "USDT",
                        "free": "14800.00000000",
                        "locked": "700.00000000"
                    },
                    {
                        "asset": "BTC",
                        "free": "0.45230000",
                        "locked": "0.00000000"
                    }
                ]
            }
        }
    ]
}
```

**Example Response — FUTURES:**

```json
{
    "code": 200,
    "msg": "",
    "snapshotVos": [
        {
            "type": "futures",
            "updateTime": 1699920000000,
            "data": {
                "assets": [
                    {
                        "asset": "USDT",
                        "marginBalance": "8500.23000000",
                        "walletBalance": "9000.00000000"
                    }
                ],
                "position": [
                    {
                        "symbol": "BTCUSDT",
                        "entryPrice": "42150.00000000",
                        "markPrice": "42380.50000000",
                        "positionAmt": "0.10000000",
                        "unRealizedProfit": "23.05000000"
                    }
                ]
            }
        }
    ]
}
```

---

### POST /sapi/v1/futures/transfer (DEPRECATED)

**Legacy Futures Transfer**

> **Deprecated.** This endpoint is maintained for backward compatibility only. Use `POST /sapi/v1/asset/transfer` with type `MAIN_UMFUTURE` / `UMFUTURE_MAIN` instead.

**Weight:** 1

**Parameters:**

| Name       | Type    | Required | Description                                           |
|------------|---------|----------|-------------------------------------------------------|
| asset      | STRING  | Yes      | Asset to transfer (e.g. `USDT`)                       |
| amount     | DECIMAL | Yes      | Transfer amount                                       |
| type       | INT     | Yes      | `1` = Spot to USDT-M Futures, `2` = USDT-M Futures to Spot |
| recvWindow | LONG    | No       | Max milliseconds the request is valid after timestamp |
| timestamp  | LONG    | Yes      | Current UTC time in milliseconds                      |
| signature  | STRING  | Yes      | HMAC-SHA256 signature                                 |

**Example Request:**

```bash
curl -X POST "https://api.binance.com/sapi/v1/futures/transfer?\
asset=USDT&amount=1000&type=1&timestamp=1700000000000\
&signature=<signature>" \
  -H "X-MBX-APIKEY: <api_key>"
```

**Example Response (200 OK):**

```json
{
    "tranId": 100000001
}
```

> **Migration guide:** Replace `type=1` with universal transfer type `MAIN_UMFUTURE`. Replace `type=2` with `UMFUTURE_MAIN`. All other parameters remain the same.

---

## Common Patterns

### Pattern 1: Verify a Transfer Succeeded

After initiating a transfer, poll the transfer history to confirm it reached `CONFIRMED` status.

```python
import time

def transfer_and_verify(asset: str, amount: float, transfer_type: str) -> bool:
    """Transfer funds and wait for confirmation."""
    # Step 1: Execute transfer
    params = sign({"type": transfer_type, "asset": asset, "amount": str(amount)})
    resp = requests.post(f"{BASE_URL}/sapi/v1/asset/transfer", params=params, headers=headers())
    resp.raise_for_status()
    tran_id = resp.json()["tranId"]

    # Step 2: Poll for confirmation (max 30 seconds)
    for _ in range(6):
        time.sleep(5)
        hist_params = sign({
            "type": transfer_type,
            "startTime": str(int(time.time() * 1000) - 60000),
            "size": "10"
        })
        hist = requests.get(
            f"{BASE_URL}/sapi/v1/asset/transfer", params=hist_params, headers=headers()
        )
        for row in hist.json().get("rows", []):
            if row["tranId"] == tran_id:
                if row["status"] == "CONFIRMED":
                    return True
                elif row["status"] == "FAILED":
                    raise Exception(f"Transfer {tran_id} failed")

    raise TimeoutError(f"Transfer {tran_id} not confirmed within 30s")
```

### Pattern 2: Calculate Total Portfolio Value Across All Wallets

Combine Spot balances with Futures and Margin snapshots to compute total portfolio value.

```python
def get_total_portfolio_btc() -> float:
    """Sum BTC-denominated value across Spot, Futures, and Margin accounts."""
    total_btc = 0.0

    # Spot snapshot
    spot_params = sign({"type": "SPOT", "limit": "1"})
    spot = requests.get(
        f"{BASE_URL}/sapi/v1/accountSnapshot", params=spot_params, headers=headers()
    ).json()
    if spot["snapshotVos"]:
        total_btc += float(spot["snapshotVos"][0]["data"]["totalAssetOfBtc"])

    # Margin snapshot
    margin_params = sign({"type": "MARGIN", "limit": "1"})
    margin = requests.get(
        f"{BASE_URL}/sapi/v1/accountSnapshot", params=margin_params, headers=headers()
    ).json()
    if margin["snapshotVos"]:
        total_btc += float(margin["snapshotVos"][0]["data"].get("totalNetAssetOfBtc", "0"))

    # Futures — sum wallet balances (convert via price if needed)
    futures_params = sign({"type": "FUTURES", "limit": "1"})
    futures = requests.get(
        f"{BASE_URL}/sapi/v1/accountSnapshot", params=futures_params, headers=headers()
    ).json()
    if futures["snapshotVos"]:
        for asset_entry in futures["snapshotVos"][0]["data"].get("assets", []):
            if asset_entry["asset"] == "BTC":
                total_btc += float(asset_entry["walletBalance"])
            # For USDT, you would convert via current BTC/USDT price

    return total_btc
```

### Pattern 3: Transfer for Futures Arbitrage (Spot to USDT-M Futures)

A typical funding-rate arbitrage flow: move USDT from Spot to USDT-M Futures wallet.

```python
def prepare_futures_arb(usdt_amount: float) -> int:
    """Transfer USDT from Spot to USDT-M Futures for arbitrage positioning."""
    # 1. Check spot balance
    balance_params = sign({"asset": "USDT"})
    balances = requests.get(
        f"{BASE_URL}/sapi/v3/asset/getUserAsset", params=balance_params, headers=headers()
    ).json()

    available = 0.0
    for b in balances:
        if b["asset"] == "USDT":
            available = float(b["free"])
            break

    if available < usdt_amount:
        raise ValueError(
            f"Insufficient USDT: need {usdt_amount}, available {available}"
        )

    # 2. Transfer Spot -> USDT-M Futures
    transfer_params = sign({
        "type": "MAIN_UMFUTURE",
        "asset": "USDT",
        "amount": str(usdt_amount)
    })
    resp = requests.post(
        f"{BASE_URL}/sapi/v1/asset/transfer",
        params=transfer_params,
        headers=headers()
    )
    resp.raise_for_status()
    tran_id = resp.json()["tranId"]
    print(f"Transfer initiated: tranId={tran_id}, {usdt_amount} USDT -> USDT-M Futures")
    return tran_id


def unwind_futures_arb(usdt_amount: float) -> int:
    """Transfer USDT back from USDT-M Futures to Spot after closing positions."""
    transfer_params = sign({
        "type": "UMFUTURE_MAIN",
        "asset": "USDT",
        "amount": str(usdt_amount)
    })
    resp = requests.post(
        f"{BASE_URL}/sapi/v1/asset/transfer",
        params=transfer_params,
        headers=headers()
    )
    resp.raise_for_status()
    return resp.json()["tranId"]
```

---

## Error Codes

| HTTP Status | Error Code | Message                                  | Description                                                        |
|-------------|------------|------------------------------------------|--------------------------------------------------------------------|
| 400         | -1102      | Mandatory parameter missing              | A required parameter was not sent                                  |
| 400         | -1013      | Invalid amount                           | Amount is zero, negative, or exceeds precision limits              |
| 400         | -1003      | Too many requests                        | Rate limit exceeded — back off and retry                           |
| 400         | -2010      | Insufficient balance                     | Not enough free balance in the source wallet                       |
| 400         | -3020      | Transfer not allowed                     | Transfer type not supported or account restriction                 |
| 400         | -3041      | Balance is not enough                    | Insufficient balance in the source wallet for this transfer type   |
| 400         | -9000      | Asset not supported for this transfer    | The asset cannot be transferred via the specified type             |
| 401         | -2015      | Invalid API-key, IP, or permissions      | API key is wrong, IP not whitelisted, or missing Wallet permission |
| 400         | -1021      | Timestamp outside recvWindow             | Request arrived too late — check clock sync                        |
| 400         | -1022      | Signature for this request is not valid  | HMAC signature does not match                                      |

**Error Response Format:**

```json
{
    "code": -2010,
    "msg": "Insufficient balance."
}
```

### Handling Errors

```python
resp = requests.post(f"{BASE_URL}/sapi/v1/asset/transfer", params=params, headers=headers())
if resp.status_code != 200:
    error = resp.json()
    code = error.get("code")
    msg = error.get("msg")
    if code == -2010 or code == -3041:
        # Insufficient balance — check available funds
        pass
    elif code == -1003:
        # Rate limited — implement exponential backoff
        pass
    elif code == -1021:
        # Clock drift — resync system time
        pass
    raise Exception(f"Binance API error {code}: {msg}")
```

---

## Rate Limits

All `/sapi/` endpoints share the account's global rate limit pool.

| Endpoint                            | Weight | Notes                                          |
|-------------------------------------|--------|-------------------------------------------------|
| POST /sapi/v1/asset/transfer        | 900    | High weight — batch transfers carefully          |
| GET /sapi/v1/asset/transfer         | 1      | Lightweight — safe to poll                       |
| GET /sapi/v3/asset/getUserAsset     | 5      | Low weight                                       |
| GET /sapi/v1/capital/config/getall  | 10     | Cache results, coin configs change infrequently  |
| GET /sapi/v1/accountSnapshot        | 2400   | Very heavy — call sparingly, cache aggressively  |
| POST /sapi/v1/futures/transfer      | 1      | Deprecated, low weight                           |

**Account-level limits:**

- **1,200 request weight per minute** per API key (default). Some VIP tiers have higher limits.
- **10 orders per second** (order-specific, not applicable to wallet endpoints).
- **200,000 orders per 24 hours** (order-specific).

**Best practices:**

1. **Cache coin config** (`/capital/config/getall`) — refresh at most once per hour.
2. **Avoid account snapshots in loops** — weight of 2400 means a single call consumes most of your budget. Use `getUserAsset` for real-time balance checks instead.
3. **Batch transfers logically** — the 900-weight transfer endpoint means you can do roughly one transfer per second sustainably.
4. **Use `recvWindow`** — set to 5000ms (default) to prevent replay issues. Ensure your server clock is NTP-synced.
5. **Monitor `X-MBX-USED-WEIGHT-1M` response header** — Binance returns your consumed weight in response headers. Use this to implement adaptive rate limiting.

---

## Appendix: Response Headers

Every Binance API response includes rate-limit headers:

| Header                      | Description                                         |
|-----------------------------|-----------------------------------------------------|
| X-MBX-USED-WEIGHT-1M       | Weight consumed in the current 1-minute window      |
| X-MBX-ORDER-COUNT-10S      | Orders placed in the current 10-second window       |
| X-MBX-ORDER-COUNT-1D       | Orders placed in the current 24-hour window         |
| Retry-After                 | Seconds to wait (only present when rate-limited)    |

When `X-MBX-USED-WEIGHT-1M` approaches your limit (default 1200), pause requests until the window resets.
