---
title: Announcement Monitor
description: Monitor Binance announcements for new listings, delistings, airdrops, and activities using the public CMS article API.
metadata:
  version: "1.0.0"
  author: mefai-dev
license: MIT
---

# Binance Announcement Monitor

Monitor Binance official announcements in real-time for new token listings, delistings, airdrops, promotional activities, and other market-moving events using the public CMS article API.

## Quick Reference

| Endpoint | Description | Authentication |
|----------|-------------|----------------|
| `GET /bapi/composite/v1/public/cms/article/list/query` | List announcements by category | No |

## API Details

### List Announcements

Retrieve paginated announcements filtered by category.

**Method:** `GET`

**URL:** `https://www.binance.com/bapi/composite/v1/public/cms/article/list/query`

**Query Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| type | integer | No | 1 | Content type (1 = articles) |
| catalogId | integer | No | 48 | Category filter (see table below) |
| pageNo | integer | No | 1 | Page number |
| pageSize | integer | No | 20 | Results per page (max 50) |

**Catalog IDs:**

| ID | Category | Description |
|----|----------|-------------|
| 48 | New Listings | New token listing announcements |
| 49 | Activities | Promotional events, trading competitions |
| 161 | Delisting | Token removal announcements |
| 128 | Airdrop | Airdrop and reward announcements |

**Example Request:**

```bash
curl 'https://www.binance.com/bapi/composite/v1/public/cms/article/list/query?type=1&catalogId=48&pageNo=1&pageSize=20'
```

**Response Fields:**

| Field | Type | Description |
|-------|------|-------------|
| data.catalogs | array | Category-grouped results |
| data.catalogs[].catalogId | integer | Category ID |
| data.catalogs[].catalogName | string | Category name |
| data.catalogs[].articles | array | Article list |
| data.catalogs[].articles[].id | integer | Article ID |
| data.catalogs[].articles[].code | string | Article URL slug |
| data.catalogs[].articles[].title | string | Announcement title |
| data.catalogs[].articles[].releaseDate | integer | Publication timestamp (ms) |

**Example Response:**

```json
{
  "code": "000000",
  "data": {
    "catalogs": [{
      "catalogId": 48,
      "catalogName": "New Cryptocurrency Listing",
      "articles": [{
        "id": 123456,
        "code": "abc123",
        "title": "Binance Will List Token (TOKEN)",
        "releaseDate": 1709600000000
      }]
    }]
  }
}
```

### Keyword Detection

Monitor announcement titles for actionable keywords:

| Keyword | Pattern | Impact |
|---------|---------|--------|
| LIST | `/\b(list\|listing\|listed)\b/i` | Typically bullish for the token |
| DELIST | `/\b(delist\|removal\|remove)\b/i` | Typically bearish for the token |
| AIRDROP | `/\b(airdrop\|reward\|bonus)\b/i` | Potential free tokens |
| FUTURES | `/\b(futures\|perpetual\|usdm)\b/i` | New derivatives market |
| MARGIN | `/\b(margin\|leverage)\b/i` | New margin trading pair |

## Use Cases

1. **New Listing Alerts** — Get early notification of new token listings
2. **Delisting Monitor** — Track tokens being removed from Binance
3. **Airdrop Discovery** — Find upcoming airdrop and reward opportunities
4. **Event Trading** — Monitor promotional activities and trading competitions
5. **Portfolio Risk** — Check if any held tokens face delisting

## Notes

- This is a **public endpoint** — no API key or authentication required
- The endpoint uses Binance's internal CMS API (`/bapi/composite/`)
- Response availability may vary by geographic region due to CDN routing
- Article URLs follow the pattern: `https://www.binance.com/en/support/announcement/{code}`
- Announcement timing is critical — listings often cause significant price movements
- Consider forwarding User-Agent header when proxying to avoid empty responses
- Rate limit: standard web API limits apply
- For programmatic monitoring, poll every 60-120 seconds
