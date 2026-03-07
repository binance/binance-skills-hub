---
title: P2P Market Scanner
description: Scan Binance P2P marketplace for best buy/sell offers across multiple fiat currencies and crypto assets with merchant quality metrics.
metadata:
  version: "1.0.0"
  author: mefai-dev
license: MIT
---

# Binance P2P Market Scanner

Scan the Binance P2P (peer-to-peer) marketplace to find the best buy and sell offers for crypto assets across multiple fiat currencies. Compare merchant quality, completion rates, and payment methods in real-time.

## Quick Reference

| Endpoint | Description | Authentication |
|----------|-------------|----------------|
| `POST /bapi/c2c/v2/friendly/c2c/adv/search` | Search P2P advertisements | No |

## API Details

### Search P2P Advertisements

Search for P2P buy/sell advertisements with filters for fiat currency, crypto asset, trade type, and payment methods.

**Method:** `POST`

**URL:** `https://p2p.binance.com/bapi/c2c/v2/friendly/c2c/adv/search`

**Headers:**
| Header | Value |
|--------|-------|
| Content-Type | application/json |

**Request Body Fields:**

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| fiat | string | No | TRY | Fiat currency code (TRY, USD, EUR, GBP, NGN, BRL, INR, VND, RUB, ARS) |
| asset | string | No | USDT | Crypto asset (USDT, BTC, ETH, BNB, FDUSD) |
| tradeType | string | No | BUY | Trade direction: BUY or SELL |
| page | integer | No | 1 | Page number |
| rows | integer | No | 20 | Results per page (max 20) |
| payTypes | array | No | [] | Filter by payment methods |
| publisherType | string | No | null | Filter: null=all, "merchant"=verified merchants only |

**Example Request:**

```bash
curl -X POST 'https://p2p.binance.com/bapi/c2c/v2/friendly/c2c/adv/search' \
  -H 'Content-Type: application/json' \
  -d '{
    "fiat": "TRY",
    "asset": "USDT",
    "tradeType": "BUY",
    "page": 1,
    "rows": 10,
    "payTypes": [],
    "publisherType": null
  }'
```

**Response Fields:**

| Field | Type | Description |
|-------|------|-------------|
| data | array | List of P2P advertisements |
| data[].adv.price | string | Price per unit in fiat |
| data[].adv.surplusAmount | string | Available quantity |
| data[].adv.asset | string | Crypto asset code |
| data[].adv.fiatUnit | string | Fiat currency code |
| data[].adv.minSingleTransAmount | string | Minimum transaction amount |
| data[].adv.dynamicMaxSingleTransAmount | string | Maximum transaction amount |
| data[].adv.tradeMethods | array | Available payment methods |
| data[].adv.tradeMethods[].tradeMethodShortName | string | Payment method short name |
| data[].advertiser.nickName | string | Merchant username |
| data[].advertiser.monthFinishRate | number | 30-day completion rate (0-1) |
| data[].advertiser.monthOrderCount | integer | 30-day order count |
| data[].advertiser.userType | string | "user" or "merchant" |

## Use Cases

1. **Find Best P2P Rate** — Compare prices across multiple merchants for the best buy/sell rate in your local currency
2. **Merchant Quality Check** — Filter by completion rate and order count to find reliable P2P merchants
3. **Payment Method Filter** — Find ads supporting specific payment methods (bank transfer, mobile payment, etc.)
4. **Arbitrage Detection** — Compare buy vs sell spreads across different fiat currencies
5. **Market Depth Analysis** — Assess P2P liquidity for specific fiat/crypto pairs

## Notes

- This is a **public endpoint** — no API key or authentication required
- The P2P marketplace is region-dependent; available fiat currencies vary by country
- Prices are set by individual merchants, not by Binance
- Completion rate (`monthFinishRate`) is a 30-day rolling metric; higher is better
- Merchant badge (`publisherType: "merchant"`) indicates Binance-verified merchants
- Rate limit: standard Binance public API limits apply
- Results are sorted by price (best price first) by default
