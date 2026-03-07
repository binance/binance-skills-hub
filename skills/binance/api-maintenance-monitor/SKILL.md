---
title: API Maintenance Monitor
description: Binance API and system maintenance status monitor. Tracks scheduled maintenance windows, API changes, system updates, and incident resolution announcements.
metadata:
  version: "1.0.0"
  author: mefai-dev
license: MIT
---

# API & Maintenance Monitor

Monitor Binance system status, scheduled maintenance windows, and API changes. Essential for trading bots and automated systems that need to handle downtime gracefully.

## Quick Reference

| Endpoint | Description | Required | Optional | Authentication |
|----------|-------------|----------|----------|----------------|
| `/bapi/composite/v1/public/cms/article/list/query` (GET) | System/API announcements | type, catalogId | pageNo, pageSize | No |

## API Details

### Get System/API Announcements

Uses the same CMS article API with different catalog IDs for system and API-specific announcements.

**Method:** `GET`

**URL:** `https://www.binance.com/bapi/composite/v1/public/cms/article/list/query`

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `type` | integer | Yes | Content type (1 = article) |
| `catalogId` | integer | Yes | 157 = System Maintenance, 51 = API Updates |
| `pageNo` | integer | No | Page number (default 1) |
| `pageSize` | integer | No | Items per page (default 20, max 50) |

**Example Request:**

```bash
# System Maintenance
curl -s "https://www.binance.com/bapi/composite/v1/public/cms/article/list/query?type=1&catalogId=157&pageNo=1&pageSize=20"

# API Changes
curl -s "https://www.binance.com/bapi/composite/v1/public/cms/article/list/query?type=1&catalogId=51&pageNo=1&pageSize=20"
```

**Response Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `data.catalogs[].articles` | array | List of announcements |
| `data.catalogs[].articles[].title` | string | Announcement title |
| `data.catalogs[].articles[].code` | string | URL slug for full article |
| `data.catalogs[].articles[].releaseDate` | long | Publication timestamp |

**Title Pattern Examples:**

| Pattern | Meaning |
|---------|---------|
| "Scheduled System Maintenance" | Planned downtime window |
| "Completed" / "Resolved" | Maintenance/incident resolved |
| "API Update" / "API Upgrade" | API endpoint changes |
| "Wallet Maintenance" | Deposit/withdrawal suspension |

## Use Cases

1. **Bot Downtime Handling**: Detect scheduled maintenance to pause trading bots before downtime
2. **API Migration**: Track API endpoint changes and deprecations to update integrations
3. **Incident Awareness**: Monitor for unplanned incidents that may affect trading
4. **Deposit/Withdrawal**: Track wallet maintenance that affects specific asset deposits/withdrawals
5. **Compliance**: Maintain an audit trail of system changes affecting trading operations

## Notes

- This is a public endpoint with no authentication required
- System maintenance (catalogId 157) covers exchange-wide downtime events
- API updates (catalogId 51) covers REST and WebSocket API changes
- Announcements typically include start/end times for maintenance windows
- "Completed" announcements confirm resolution of maintenance or incidents
- Recommended polling interval: every 2-5 minutes during trading hours
