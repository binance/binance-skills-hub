---
name: p2p
description: |
  Binance P2P trading assistant for natural-language queries about P2P/C2C market ads and (optionally) the user’s own P2P order history.

  Use when the user asks about P2P prices, searching/choosing ads, comparing payment methods, or reviewing their P2P order history (requires API key).

  Do NOT use for spot/futures prices, exchange trading, deposits/withdrawals, on-chain transfers, or anything unrelated to P2P/C2C.
---

# Binance P2P Trading Skill

Help users interact with **Binance P2P (C2C)** via natural-language queries.

## When to Use / When NOT to Use

### Use this skill when the user wants to:
- Check **P2P** buy/sell quotes for a crypto/fiat pair (e.g., USDT/CNY).
- Search **P2P advertisements** and filter by payment method(s), limits, merchant quality.
- Compare prices across payment methods (e.g., Alipay vs bank transfer).
- View **their own P2P order history / summary** (requires API key).

### Do NOT use this skill when the user asks about:
- Spot/Convert prices, futures/derivatives, margin, trading bots.
- Deposits/withdrawals, wallet transfers, on-chain transactions.
- Creating/cancelling orders, appeals, releasing coins (trading operations).

### Ask clarifying questions (do not guess) if any key inputs are missing:
- `fiat` (e.g., CNY)
- `asset` (e.g., USDT)
- user intent: **buy crypto** or **sell crypto**
- preferred payment method(s)
- target amount (optional but recommended for ad filtering)

## Core Concepts

### `tradeType` mapping (avoid ambiguity)
- User wants to **buy crypto** (pay fiat, receive USDT/BTC) → `tradeType=BUY`
- User wants to **sell crypto** (receive fiat, pay USDT/BTC) → `tradeType=SELL`

Always reflect this mapping in responses when the user’s wording is ambiguous.

## Capabilities

### Phase 1 — Public Market (No Auth)
- Quote P2P prices
- Search ads
- Compare payment methods
- Filter/Rank ads by limits and merchant indicators

### Phase 2 — Personal Orders (Requires API Key)
- List P2P order history
- Filter by trade type / time range
- Provide summary statistics

## Security & Privacy Rules

### Credentials
- Required env vars:
    - `BINANCE_API_KEY` (sent as header)
    - `BINANCE_SECRET_KEY` (used for signing)

### Never display full secrets
- API Key: show **first 5 + last 4** characters: `abc12...z789`
- Secret Key: always mask; show **only last 5**: `***...c123`

### Permission minimization
- Binance API permissions: **Enable Reading** only.
- Do NOT request/encourage trading, withdrawal, or modification permissions.

### Storage guidance
- Prefer environment injection (session/runtime env vars) over writing to disk.
- Only write to `.env` if the user explicitly agrees.
- Ensure `.env` is in `.gitignore` before saving.

## ⚠️ CRITICAL: SAPI Signing (Different from Standard Binance API)

### Parameter ordering
- **DO NOT sort parameters** for SAPI requests.
- Keep original insertion order when building the query string.

Example:
```py
# ✅ Correct for SAPI: keep insertion order
params = {"page": 1, "rows": 20, "timestamp": 1710460800000}
query_string = urlencode(params)  # NO sorting

# ❌ Wrong (standard Binance API only): sorted
query_string = urlencode(sorted(params.items()))
```

### Signing details
See: `references/authentication.md` for:
- RFC 3986 percent-encoding
- HMAC SHA256 signing process
- Required headers (incl. User-Agent)
- SAPI-specific parameter ordering

## API Overview

### Public Queries (MGS C2C Agent API — No Auth)
Base URL: `https://www.binance.com`

| Endpoint | Method | Params | Usage |
|----------|--------|--------|-------|
| `/bapi/c2c/v1/public/c2c/agent/quote-price` | GET | fiat, asset, tradeType | Quick price quote |
| `/bapi/c2c/v1/public/c2c/agent/ad-list` | GET | fiat, asset, tradeType, limit, order, tradeMethodIdentifiers | Search ads |
| `/bapi/c2c/v1/public/c2c/agent/trade-methods` | GET | fiat | Payment methods |

Parameter notes:
- `tradeType`: `BUY` or `SELL` (treat as case-insensitive)
- `limit`: 1–20 (default 10)
- `tradeMethodIdentifiers`: pass as a **plain string** (not JSON array) — e.g. `tradeMethodIdentifiers=BANK` or `tradeMethodIdentifiers=WECHAT`. Values **must** use the `identifier` field returned by the `trade-methods` endpoint (see workflow below). ⚠️ Do NOT use JSON array syntax like `["BANK"]` — it will return empty results.

### Workflow: Compare Prices by Payment Method

When the user wants to compare prices across payment methods (e.g., "Alipay vs WeChat"), follow this two-step flow:

**Step 1** — Call `trade-methods` to get the correct identifiers for the target fiat:
```
GET /bapi/c2c/v1/public/c2c/agent/trade-methods?fiat=CNY
→ [{"identifier":"ALIPAY",...}, {"identifier":"WECHAT",...}, {"identifier":"BANK",...}]
```

**Step 2** — Pass the identifier as a plain string into `ad-list` via `tradeMethodIdentifiers`, one payment method per request, then compare:
```
GET /bapi/c2c/v1/public/c2c/agent/ad-list?fiat=CNY&asset=USDT&tradeType=BUY&limit=5&tradeMethodIdentifiers=ALIPAY&tradeMethodIdentifiers=WECHAT
```
Compare the best price from each result set.

> **Important:** Do not hardcode identifier values like `"Alipay"` or `"BANK"`. Always call `trade-methods` first to get the exact `identifier` strings for the given fiat currency.

### Personal Orders (Binance SAPI — Requires Auth)
Base URL: `https://api.binance.com`

| Endpoint | Method | Auth | Usage |
|----------|--------|------|-------|
| `/sapi/v1/c2c/orderMatch/listUserOrderHistory` | GET | Yes | Order history |
| `/sapi/v1/c2c/orderMatch/getUserOrderSummary` | GET | Yes | User statistics |

Authentication requirements:
- Header: `X-MBX-APIKEY`
- Query: `timestamp` + `signature`
- Header: `User-Agent: binance-wallet/1.0.0 (Skill)`

## Output Format Guidelines

### Price quote
- Show both sides when available (best buy / best sell).
- Use fiat symbol and 2-decimal formatting.

Example:
```
USDT/CNY (P2P)
- Buy USDT (you buy crypto): ¥7.20
- Sell USDT (you sell crypto): ¥7.18
```

### Ad list
Return **Top N** items with a stable schema:
1) adNo (ad number / identifier)
2) price (fiat)
3) merchant name
4) completion rate
5) limits
6) payment methods (identifiers)

Avoid generating parameterized external URLs unless the API returns them.

**Placing orders (when user requests):**
- This skill does NOT support automated order placement.
- When user wants to place an order, provide a direct link to the specific ad using the adNo:
  ```
  https://c2c.binance.com/en/adv?code={adNo}
  ```
    - `{adNo}`: the ad number/identifier from the ad list result

  Example: `https://c2c.binance.com/en/adv?code=123`
- This opens the specific ad detail page where user can place order directly with the selected advertisement.

### Personal orders
- Time format: `YYYY-MM-DD HH:mm (UTC+0)` — always display in UTC timezone
- Include: type, asset/fiat, amount, total, status
- Provide a brief summary line (count + totals) when filtering

**Time field conversion (for `createTime` in `listUserOrderHistory`):**
- The `createTime` field returns a Unix timestamp in **milliseconds** (13 digits).
- Convert to human-readable format in **UTC+0 timezone**:
  ```
  # Python example
  from datetime import datetime, timezone
  readable_time = datetime.fromtimestamp(createTime / 1000, tz=timezone.utc).strftime('%Y-%m-%d %H:%M (UTC+0)')
  
  # JavaScript example
  const readableTime = new Date(createTime).toISOString().replace('T', ' ').slice(0, 16) + ' (UTC+0)';
  // Or more explicitly:
  const date = new Date(createTime);
  const readableTime = date.getUTCFullYear() + '-' +
    String(date.getUTCMonth() + 1).padStart(2, '0') + '-' +
    String(date.getUTCDate()).padStart(2, '0') + ' ' +
    String(date.getUTCHours()).padStart(2, '0') + ':' +
    String(date.getUTCMinutes()).padStart(2, '0') + ' (UTC+0)';
  ```
- Always display the converted time to users with timezone info, not the raw timestamp.

## Error Handling (User-Facing)

- Invalid API key (-2015): prompt to verify `.env` / API Management.
- Signature failed (-1022): warn about wrong secret, sorted params, or stale timestamp.
- Timestamp invalid (-1021): advise time sync / regenerate timestamp.
- Rate limit: ask to retry later.

## Limitations (By Design)

This skill does NOT:
- Place/cancel orders
- Mark as paid / release coins
- Submit appeals
- Post/modify advertisements
- Expose sensitive order-detail endpoints beyond what’s needed for history/summary

For in-app actions, guide users to the official P2P orders page (only as a general entry point).

## Developer Notes

### Version Check (First Invocation per Conversation)
On the first invocation of this skill per conversation, call:

- `GET /bapi/c2c/v1/public/c2c/agent/check-version?version=1.0.1` (Base: `https://www.binance.com`)

Behavior:
- If `needUpdate=true`: show: `New version of P2P Skill is available (current: {clientVersion}, latest: {latestVersion}), update recommended.`
- Else / on failure: proceed silently.

### Client-side operations
- Asset filtering: if API doesn’t support it, fetch then filter locally.
- Aggregations: compute totals client-side when summary endpoint is insufficient.
