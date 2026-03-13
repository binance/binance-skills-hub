---
name: query-token-info
description: |
  Query token details by keyword, contract address, or chain. Search tokens, get metadata and social links,
  retrieve real-time market data (price, price trend, volume, holders, liquidity), and fetch K-Line candlestick charts.
  Use this skill when users search tokens, check token prices, view market data, or request kline/candlestick charts.
metadata:
  author: binance-web3-team
  version: "1.0"
---

# Query Token Info Skill

## Overview

| API | Function | Use Case |
|-----|----------|----------|
| Token Search | Search tokens | Find tokens by name, symbol, or contract address |
| Token Metadata | Static info | Get token details,name,symbol,logo, social links, creator address |
| Token Dynamic Data | Real-time market data | Price, volume, holders, liquidity, market cap |
| Token K-Line | Candlestick charts | OHLCV data for technical analysis |

## Use Cases

1. **Search Tokens**: Find tokens by name, symbol, or contract address across chains
2. **Project Research**: Get token metadata, social links, and creator info
3. **Market Analysis**: Real-time price, volume, holder distribution, and liquidity data
4. **Chart Analysis**: K-Line candlestick data for technical analysis

## Supported Chains

| Chain Name | chainId |
|------------|---------|
| BSC | 56 |
| Base | 8453 |
| Solana | CT_501 |

---

## API 1: Token Search

### Method: GET

**URL**: 
```
https://web3.binance.com/bapi/defi/v5/public/wallet-direct/buw/wallet/market/token/search
```

**Request Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| keyword | string | Yes | Search keyword (name/symbol/contract address) |
| chainIds | string | No | Chain ID list, comma-separated, e.g., `56,8453,CT_501` |
| orderBy | string | No | Sort field, e.g., `volume24h` |

**Request Headers**:
```
Accept-Encoding: identity
User-Agent: binance-web3/1.0 (Skill)
```

**Example Request**:
```bash
curl --location 'https://web3.binance.com/bapi/defi/v5/public/wallet-direct/buw/wallet/market/token/search?keyword=xxx&chainIds=56,8453,CT_501&orderBy=volume24h' \
--header 'Accept-Encoding: identity' \
--header 'User-Agent: binance-web3/1.0 (Skill)'
```

**Response Example**:
```json
{
    "code": "000000",
    "data": [
        {
            "chainId": "56",
            "contractAddress": "0x1234...",
            "tokenId": "CC1F457...",
            "name": "Token",
            "symbol": "symbol of token",
            "icon": "/images/web3-data/public/token/logos/xxx.png",
            "price": "47.98771375939603199404",
            "percentChange24h": "-0.01",
            "volume24h": "53687246.955803546359104902201",
            "marketCap": "162198400",
            "liquidity": "13388877.147327333572157",
            "tokenAddresses": [...],
            "tagsInfo": {
                "AI Analysis": [{"tagName": "AI Widget", "languageKey": "wmp-label-title-ai-widget"}],
                "Community Recognition Level": [{"tagName": "Alpha", "languageKey": "wmp-label-title-alpha"}]
            },
            "links": [
                {"label": "website", "link": "https://www.web.site/"},
                {"label": "x", "link": "https://twitter.com/..."}
            ],
            "createTime": 1600611727000,
            "holdersTop10Percent": "93.267178480644823",
            "riskLevel": null
        }
    ],
    "success": true
}
```

**Response Fields**:

| Field | Type | Description |
|-------|------|-------------|
| chainId | string | Chain ID |
| contractAddress | string | Contract address |
| tokenId | string | Token unique ID |
| name | string | Token name |
| symbol | string | Token symbol |
| icon | string | Icon URL path |
| price | string | Current price (USD) |
| percentChange24h | string | 24-hour price change (%) |
| volume24h | string | 24-hour trading volume (USD) |
| marketCap | string | Market cap (USD) |
| liquidity | string | Liquidity (USD) |
| tagsInfo | object | Tag information |
| links | array | Social links list |
| createTime | number | Creation timestamp (ms) |
| holdersTop10Percent | string | Top 10 holders percentage (%) |

---

## API 2: Token Metadata

### Method: GET

**URL**: 
```
https://web3.binance.com/bapi/defi/v1/public/wallet-direct/buw/wallet/dex/market/token/meta/info
```

**Request Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| chainId | string | Yes | Chain ID |
| contractAddress | string | Yes | Token contract address |

**Request Headers**:
```
Accept-Encoding: identity
User-Agent: binance-web3/1.0 (Skill)
```

**Example Request**:
```bash
curl --location 'https://web3.binance.com/bapi/defi/v1/public/wallet-direct/buw/wallet/dex/market/token/meta/info?chainId=56&contractAddress=0x55d398326f99059ff775485246999027b3197955' \
--header 'Accept-Encoding: identity' \
--header 'User-Agent: binance-web3/1.0 (Skill)'
```

**Response Example**:
```json
{
    "code": "000000",
    "data": {
        "tokenId": "CC1F457B",
        "name": "name of Token",
        "symbol": "symbol of token",
        "chainId": "56",
        "chainIconUrl": "https://bin.bnbstatic.com/image/admin_mgs_image_upload/20250228/d0216ce4-a3e9-4bda-8937-4a6aa943ccf2.png",
        "chainName": "BSC",
        "contractAddress": "0x55d398326f99059ff775485246999027b3197955",
        "decimals": 18,
        "icon": "/images/web3-data/public/token/logos/xxx.png",
        "nativeAddressFlag": false,
        "aiNarrativeFlag": 1,
        "links": [
            {"label": "website", "link": "https://www.web.site/"},
            {"label": "whitepaper", "link": "https://drive.google.com/file/d/..."},
            {"label": "x", "link": "https://twitter.com/..."}
        ],
        "previewLink": {
            "website": ["https://www.web.site/"],
            "x": ["https://twitter.com/..."],
            "tg": []
        },
        "createTime": 1600611727000,
        "creatorAddress": "0x1234...",
        "auditInfo": {
            "isBlacklist": false,
            "isWhitelist": true
        },
        "description": "this is a good token..."
    },
    "success": true
}
```

**Response Fields**:

| Field | Type | Description |
|-------|------|-------------|
| tokenId | string | Token unique ID |
| name | string | Token name |
| symbol | string | Token symbol |
| chainId | string | Chain ID |
| chainName | string | Chain name |
| contractAddress | string | Contract address |
| decimals | number | Token decimals |
| icon | string | Icon URL path |
| links | array | Social links list |
| createTime | number | Creation timestamp (ms) |
| creatorAddress | string | Creator address |
| description | string | Token description |

---

## API 3: Token Dynamic Data

### Method: GET

**URL**: 
```
https://web3.binance.com/bapi/defi/v4/public/wallet-direct/buw/wallet/market/token/dynamic/info
```

**Request Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| chainId | string | Yes | Chain ID |
| contractAddress | string | Yes | Token contract address |

**Request Headers**:
```
Accept-Encoding: identity
User-Agent: binance-web3/1.0 (Skill)
```

**Example Request**:
```bash
curl --location 'https://web3.binance.com/bapi/defi/v4/public/wallet-direct/buw/wallet/market/token/dynamic/info?chainId=56&contractAddress=0x55d398326f99059ff775485246999027b3197955' \
--header 'Accept-Encoding: identity' \
--header 'User-Agent: binance-web3/1.0 (Skill)'
```

**Response Example**:
```json
{
    "code": "000000",
    "data": {
        "price": "48.00617218672732466029",
        "nativeTokenPrice": "589.09115969567768209591",
        "volume24h": "53803143.235015073706599196363",
        "volume24hBuy": "26880240.472839229350983682189",
        "volume24hSell": "26922902.762175844355615514174",
        "volume4h": "7179919.170580971950485838372",
        "volume1h": "3181854.878039371691111933489",
        "volume5m": "84557.068962077549412188792",
        "count24h": "39869",
        "count24hBuy": "19850",
        "count24hSell": "20019",
        "percentChange5m": "0.03",
        "percentChange1h": "0.02",
        "percentChange4h": "0.03",
        "percentChange24h": "0.01",
        "marketCap": "162260777.94315716831842935701774977509483735135",
        "totalSupply": "3379998.56",
        "circulatingSupply": "3379998.249225519124584315",
        "priceHigh24h": "48.59526604943723770716",
        "priceLow24h": "47.4815509902145490401",
        "holders": "78255",
        "fdv": "162260792.8622504084644326891824",
        "liquidity": "13393863.149264026822944",
        "launchTime": 1600950241000,
        "top10HoldersPercentage": "93.2621248736909194",
        "kycHolderCount": "23579",
        "kolHolders": "17",
        "kolHoldingPercent": "0.000059",
        "devHoldingPercent": "0.0000",
        "proHolders": "138",
        "proHoldingPercent": "0.003357",
        "smartMoneyHolders": "1",
        "smartMoneyHoldingPercent": "0"
    },
    "success": true
}
```

**Response Fields**:

### Price Related
| Field | Type | Description |
|-------|------|-------------|
| price | string | Current price (USD) |
| nativeTokenPrice | string | Native token price |
| priceHigh24h | string | 24-hour high price |
| priceLow24h | string | 24-hour low price |

### Price Change
| Field | Type | Description |
|-------|------|-------------|
| percentChange5m | string | 5-minute price change (%) |
| percentChange1h | string | 1-hour price change (%) |
| percentChange4h | string | 4-hour price change (%) |
| percentChange24h | string | 24-hour price change (%) |

### Volume
| Field | Type | Description |
|-------|------|-------------|
| volume24h | string | 24-hour total volume (USD) |
| volume24hBuy | string | 24-hour buy volume |
| volume24hSell | string | 24-hour sell volume |
| volume4h | string | 4-hour volume |
| volume1h | string | 1-hour volume |
| volume5m | string | 5-minute volume |

### Transaction Count
| Field | Type | Description |
|-------|------|-------------|
| count24h | string | 24-hour transaction count |
| count24hBuy | string | 24-hour buy count |
| count24hSell | string | 24-hour sell count |

### Market Data
| Field | Type | Description |
|-------|------|-------------|
| marketCap | string | Market cap (USD) |
| fdv | string | Fully diluted valuation |
| totalSupply | string | Total supply |
| circulatingSupply | string | Circulating supply |
| liquidity | string | Liquidity (USD) |

### Holder Data
| Field | Type | Description |
|-------|------|-------------|
| holders | string | Total holder count |
| top10HoldersPercentage | string | Top 10 holders percentage (%) |
| kycHolderCount | string | KYC holder count |
| kolHolders | string | KOL holder count |
| kolHoldingPercent | string | KOL holding percentage |
| devHoldingPercent| string | Dev holding percentage |
| proHoldingPercent | string | Professional investor holding percentage |
| smartMoneyHoldingPercent | string | Smart money holding percentage |

---

## API 4: Token K-Line (Candlestick)

### Method: GET

**URL**:
```
https://dquery.sintral.io/u-kline/v1/k-line/candles
```

**Request Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| address | string | Yes | Token contract address |
| platform | string | Yes | Chain platform: `ethereum`, `bsc`, `solana`, `base` |
| interval | string | Yes | Kline interval (see Interval Reference below) |
| limit | number | No | Number of candles to return (has higher priority than `from`) |
| from | number | No | Start timestamp in milliseconds |
| to | number | No | End timestamp in milliseconds |
| pm | string | No | Kline type: `p` for price, `m` for market cap (default: `p`) |

**Interval Reference**:

| Interval | Description |
|----------|-------------|
| 1s | 1 second |
| 1min | 1 minute |
| 3min | 3 minutes |
| 5min | 5 minutes |
| 15min | 15 minutes |
| 30min | 30 minutes |
| 1h | 1 hour |
| 2h | 2 hours |
| 4h | 4 hours |
| 6h | 6 hours |
| 8h | 8 hours |
| 12h | 12 hours |
| 1d | 1 day |
| 3d | 3 days |
| 1w | 1 week |
| 1m | 1 month |

**Platform Mapping**:

| Chain | platform value |
|-------|---------------|
| Ethereum | ethereum |
| BSC | bsc |
| Solana | solana |
| Base | base |

**Request Headers**:
```
Accept-Encoding: identity
User-Agent: binance-web3/1.0 (Skill)
```

**Example Request**:
```bash
curl --location 'https://dquery.sintral.io/u-kline/v1/k-line/candles?address=0x55d398326f99059ff775485246999027b3197955&interval=1min&limit=500&platform=bsc&to=1772126280000' \
--header 'Accept-Encoding: identity' \
--header 'User-Agent: binance-web3/1.0 (Skill)'
```

**Response Example**:
```json
{
    "data": [
        [0.10779318, 0.10779318, 0.10778039, 0.10778039, 2554.06, 1772125800000, 3],
        [0.10778039, 0.10781213, 0.10770104, 0.10770104, 2994.53, 1772125920000, 3],
        [0.10770104, 0.10770104, 0.10769200, 0.10769200, 2825.65, 1772126040000, 3],
        [0.10769200, 0.10777858, 0.10766827, 0.10777858, 2457.99, 1772126160000, 3],
        [0.10777858, 0.10778521, 0.10764351, 0.10764351, 3106.87, 1772126280000, 4]
    ],
    "status": {
        "timestamp": "2026-02-28T05:52:25.717Z",
        "error_code": "0",
        "error_message": "SUCCESS",
        "elapsed": "0",
        "credit_count": 0
    }
}
```

**Response Fields**:

Each candle is an array with 7 elements in order:

| Index | Field | Type | Description |
|-------|-------|------|-------------|
| 0 | open | number | Open price |
| 1 | high | number | High price |
| 2 | low | number | Low price |
| 3 | close | number | Close price |
| 4 | volume | number | Trading volume |
| 5 | timestamp | number | Candle timestamp (ms) |
| 6 | count | number | Transaction count |

---

## User Agent Header

Include `User-Agent` header with the following string: `binance-web3/1.0 (Skill)`

## Notes

1. Icon URL requires full domain prefix: `https://bin.bnbstatic.com` + icon path
2. All numeric fields are string format, convert when using
3. Dynamic data updates in real-time, suitable for market display
4. K-Line API uses `platform` (eth/bsc/solana/base) instead of `chainId`, and `limit` takes priority over `from` when both are provided
5. K-Line response is a 2D array (not JSON objects) — parse by index: [open, high, low, close, volume, timestamp, count]
