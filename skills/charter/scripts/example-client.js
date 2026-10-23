#!/usr/bin/env node
/**
 * Minimal example: propose a trade to a running CHARTER instance
 * (`charter serve`, default port 4477) and print the verdict.
 *
 * Usage: node example-client.js <mandateId> <symbol> <side> <usd>
 *
 * Set CHARTER_BASE_URL to point at a remote instance instead of localhost.
 * Set CHARTER_API_KEY if the instance requires the X-Charter-Api-Key header.
 */

const [, , mandateId, symbol, side, usdStr] = process.argv;

if (!mandateId || !symbol || !side || !usdStr) {
  console.error("Usage: node example-client.js <mandateId> <symbol> <side> <usd>");
  process.exit(1);
}

const baseUrl = process.env.CHARTER_BASE_URL ?? "http://localhost:4477";
const apiKey = process.env.CHARTER_API_KEY;

const res = await fetch(`${baseUrl}/propose`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    ...(apiKey ? { "X-Charter-Api-Key": apiKey } : {}),
  },
  body: JSON.stringify({
    agentId: "example-client",
    mandateId,
    symbol,
    side,
    usd: parseFloat(usdStr),
    reason: "example-client.js",
    execute: false,
  }),
});

const body = await res.json();
console.log(JSON.stringify(body, null, 2));
