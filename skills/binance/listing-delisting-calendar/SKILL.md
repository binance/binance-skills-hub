---
title: Listing Delisting Calendar
description: Binance new listing, delisting, and airdrop announcement monitor. Uses the public CMS article API to track listing/delisting events and airdrop announcements.
metadata:
  version: "1.0.0"
  author: mefai-dev
license: MIT
---

# Listing & Delisting Calendar

Monitor Binance announcements for new listings, delistings, and airdrop events. Uses the CMS article API with category-specific catalog IDs to filter relevant announcements.

## Quick Reference

| Endpoint | Description | Required | Optional | Authentication |
|----------|-------------|----------|----------|----------------|
| `/bapi/composite/v1/public/cms/article/list/query` (GET) | CMS article list by category | type, catalogId | pageNo, pageSize | No |

## API Details

### Get Announcement List

Returns articles from the Binance announcement center filtered by category.

**Method:** `GET`

**URL:** `https://www.binance.com/bapi/composite/v1/public/cms/article/list/query`

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `type` | integer | Yes | Content type (1 = article) |
| `catalogId` | integer | Yes | Category ID (see catalog table below) |
| `pageNo` | integer | No | Page number (default 1) |
| `pageSize` | integer | No | Items per page (default 20, max 50) |

**Catalog IDs:**

| ID | Category |
|----|----------|
| 48 | New Listings |
| 161 | Delisting |
| 128 | Airdrop |
| 49 | Activities & Promotions |
| 157 | System Maintenance |
| 51 | API Updates |

**Example Request:**

```bash
# New Listings
curl -s "https://www.binance.com/bapi/composite/v1/public/cms/article/list/query?type=1&catalogId=48&pageNo=1&pageSize=20"

# Delistings
curl -s "https://www.binance.com/bapi/composite/v1/public/cms/article/list/query?type=1&catalogId=161&pageNo=1&pageSize=20"

# Airdrops
curl -s "https://www.binance.com/bapi/composite/v1/public/cms/article/list/query?type=1&catalogId=128&pageNo=1&pageSize=20"
```

**Response Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `data.catalogs` | array | Category containers |
| `data.catalogs[].articles` | array | List of articles |
| `data.catalogs[].articles[].title` | string | Article title |
| `data.catalogs[].articles[].code` | string | Article URL slug |
| `data.catalogs[].articles[].releaseDate` | long | Publication timestamp |

**Example Response:**

```json
{
  "data": {
    "catalogs": [
      {
        "catalogId": 48,
        "articles": [
          {
            "title": "Binance Will List Token XYZ (XYZ)",
            "code": "binance-will-list-xyz",
            "releaseDate": 1709500000000
          }
        ]
      }
    ]
  }
}
```

## Use Cases

1. **New Listing Alerts**: Monitor catalogId 48 for new token listings — early listing announcements often precede significant price moves
2. **Delisting Risk**: Track catalogId 161 for delisting announcements to avoid holding delisted tokens
3. **Airdrop Tracking**: Monitor catalogId 128 for airdrop eligibility announcements
4. **Event Calendar**: Build a calendar view of upcoming Binance events from announcement data
5. **Keyword Extraction**: Parse titles for token symbols to automatically identify affected assets

## Notes

- This is a public endpoint with no authentication required
- Articles include full titles which typically contain token symbols and key details
- Article code can be used to construct the full URL: `https://www.binance.com/en/support/announcement/{code}`
- Listing announcements usually appear 12-48 hours before actual trading begins
- Delisting announcements include a trading cessation date
- Pagination supports up to 50 articles per page
