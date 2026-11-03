---
name: ailn-discovery
title: AILN Discovery
description: Discover AILN tool capabilities through public HTTP endpoints and run an optional sponsored search demonstration without a wallet, API key, signature, or visitor payment. Use for service discovery and response validation.
version: 0.1.0
license: MIT
metadata:
  version: 0.1.0
  author: numerous4311-design
---

# AILN Discovery

Use the public service to inspect tools and, when requested, try a sponsored information query. This skill does not purchase assets, sign wallet messages, approve tokens, or make payments.

## Discover

Send JSON-RPC to `https://ailn.ai/mcp` using **POST** and `Content-Type: application/json`:

```json
{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"discovery-client","version":"1.0"}}}
```

Then use `{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}`. Read the returned tool schemas rather than assuming a name, price, or availability. GET on this MCP endpoint is not the discovery method. These requests require no wallet or API key.

## Sponsored search, when the user asks for a demonstration

POST `https://ailn.ai/demo/search` with JSON `{"query":"<public topic>"}`. Do not include personal or confidential data in the query. No payment proof or signing is needed. Do not automatically retry a submission: it consumes sponsored service quota.

- `status=COMPLETED`: show the returned results and their sources; confirm `chargedMicros=0` when reported.
- `status=RUNNING`: retain `runId`, wait at least `pollAfterMs`, and GET `/demo/search/<runId>` until completed, failed, or `maxWaitMs` expires.
- Rate limited or sponsorship unavailable: report the returned status and stop. Do not fall back to a paid call.
- A payment challenge on another tool is a quote, not permission to pay. Stop before signing or paying.

Use a 20-second HTTP timeout, check response status and content type, and retain error codes. Never interpret a failed request as a zero price or an empty successful result.

For installation and scope see [README.md](README.md).
