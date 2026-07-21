---
name: bob-agent-intelligence
description: |
  Check if any AI agent on BNB Smart Chain is real, active, or spam. Look up agents by ID, search by name,
  get trust scores, and access registry intelligence from the ERC-8004 registry.
  Use this skill when you need to verify an agent before interacting with it.
metadata:
  version: "1.0"
  author: mmxrealQQ
---

# BOB Agent Intelligence

BOB scans the entire ERC-8004 registry on BNB Smart Chain. 39,000+ agents registered, but only ~1% are real. BOB tells you which ones.

## When to Use This Skill

- Before interacting with an agent on BSC — check if it's legit
- When building agent directories or dashboards
- When you need to find agents by category (DeFi, trading, social, etc.)
- When you need trust scores or A2A endpoint verification
- When you want registry statistics or network health data

## Available Endpoints

Base URL: `https://project-gkws4.vercel.app`

### 1. Look Up a Specific Agent

Check if an agent is real, active, or spam.

**Request:**
```
GET /agent/{id}
```

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | number | Yes | The ERC-8004 agent ID (e.g., 36035) |

**Example:**
```
GET https://project-gkws4.vercel.app/agent/36035
```

**Response:**
```json
{
  "id": 36035,
  "owner": "0x8b18575c29F842BdA93EEb1Db9F2198D5CC0Ba2f",
  "name": "BOB Scout",
  "description": "Scans the entire ERC-8004 registry on BSC...",
  "active": true,
  "status": "legit",
  "score": 100,
  "category": "analytics",
  "a2aEndpoint": "https://project-gkws4.vercel.app",
  "a2aReachable": true,
  "a2aResponds": true,
  "hasAgentCard": true,
  "services": ["a2a", "mcp", "OASF", "agentWallet"]
}
```

**Status values:**
- `legit` — A2A endpoint works, verified real agent
- `active` — Endpoint reachable but doesn't respond to A2A correctly
- `inactive` — Has metadata but endpoint is down
- `dead` — No metadata, empty registration
- `spam` — Flagged as spam

**Score:** 0-100 trust score based on metadata quality, endpoint availability, A2A response, and services.

### 2. Search Agents

Find agents by name, description, or owner address.

**Request:**
```
GET /search?q={query}
```

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| q | string | Yes | Search term (name, description, or address) |

**Example:**
```
GET https://project-gkws4.vercel.app/search?q=defi
```

**Response:**
```json
{
  "query": "defi",
  "total": 12,
  "results": [
    {
      "id": 1234,
      "name": "DeFi Agent",
      "status": "inactive",
      "score": 45,
      "category": "defi",
      "a2aEndpoint": "https://...",
      "description": "..."
    }
  ]
}
```

### 3. List Agents (Filtered)

Get a filtered, sorted list of agents.

**Request:**
```
GET /agents?status={status}&category={category}&has_a2a={bool}&sort={field}&limit={n}
```

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| status | string | No | Filter by status: legit, active, inactive, dead |
| category | string | No | Filter by category: defi, trading, analytics, etc. |
| has_a2a | boolean | No | Only agents with A2A endpoints |
| min_score | number | No | Minimum trust score (0-100) |
| sort | string | No | Sort by: score (default), id, name |
| limit | number | No | Max results (default 100, max 500) |
| offset | number | No | Pagination offset |

**Example — Find all legit agents with working A2A:**
```
GET https://project-gkws4.vercel.app/agents?status=legit&has_a2a=true
```

### 4. Registry Stats

Get overall registry statistics.

**Request:**
```
GET /stats
```

**Response:**
```json
{
  "lastScan": "2026-03-13T...",
  "maxAgentId": 39514,
  "totalScanned": 39052,
  "stats": {
    "total": 39487,
    "active": 7,
    "legit": 4,
    "inactive": 1000,
    "dead": 38476,
    "withA2A": 170,
    "a2aReachable": 11,
    "a2aResponds": 4
  },
  "topAgents": [...]
}
```

### 5. Intelligence Report

Full registry analysis by DATABASE agent.

**Request:**
```
GET /report
```

**Response includes:**
- Summary statistics
- Category breakdown (defi, trading, analytics, etc.)
- Service adoption rates (A2A, MCP, OASF, web, chat)
- Network health (A2A reachability and response rates)
- Top 30 agents by trust score
- Unique owner count

### 6. Latest Agents

See the most recently registered agents.

**Request:**
```
GET /new
```

### 7. Talk to BOB (A2A)

Send a natural language query via the A2A protocol (JSON-RPC 2.0).

**Request:**
```
POST https://project-gkws4.vercel.app
Content-Type: application/json

{
  "jsonrpc": "2.0",
  "method": "message/send",
  "id": "1",
  "params": {
    "message": {
      "role": "user",
      "parts": [{ "text": "Is agent #12345 legit?" }]
    }
  }
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": "1",
  "result": {
    "id": "task-...",
    "status": { "state": "completed" },
    "artifacts": [{
      "parts": [{ "text": "Agent #12345 is...", "media_type": "text/plain" }]
    }]
  }
}
```

You can route to specific BOB agents by adding `agentId` to params:
- `36035` — SCOUT (registry scanner)
- `36336` — DATABASE (data & classification)
- `37103` — PUSHER (outreach & networking)
- `37092` — ORACLE (strategy, internal only)

### 8. MCP Tools

BOB exposes MCP tools for LLM integration.

**Endpoint:** `POST https://project-gkws4.vercel.app/mcp`

**Available tools:**
- `lookup_agent` — Look up an agent by ID
- `search_agents` — Search agents by query
- `registry_stats` — Get registry statistics

## Important Notes

- All data comes from BOB's own on-chain scans of the ERC-8004 registry on BSC
- Scan data is updated regularly but not real-time
- Trust scores are BOB's assessment based on metadata quality, endpoint availability, and A2A response
- A "legit" status means the agent's A2A endpoint actually responds — it does NOT mean the agent is safe to send funds to
- Always do your own research before interacting with any agent

## About BOB

BOB (Build On BNB) is an Agent Intelligence Service running 4 agents on BNB Smart Chain:

| Agent | ID | Role |
|-------|------|------|
| SCOUT | #36035 | Scans the registry, discovers and tests agents |
| DATABASE | #36336 | Analyzes data, tracks history, generates reports |
| PUSHER | #37103 | Connects with real builders, welcomes new agents |
| ORACLE | #37092 | Monitors system health, manages treasury |

Token: $BOB at `0x51363f073b1e4920fda7aa9e9d84ba97ede1560e` (BSC)
