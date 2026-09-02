#!/usr/bin/env node
/**
 * Minimal example: propose a trade to a locally running CHARTER instance
 * (`charter serve`, default port 4477) and print the verdict.
 *
 * Usage: node example-client.js <mandateId> <symbol> <side> <usd>
 */

const [, , mandateId, symbol, side, usdStr] = process.argv;

if (!mandateId || !symbol || !side || !usdStr) {
  console.error("Usage: node example-client.js <mandateId> <symbol> <side> <usd>");
  process.exit(1);
}

const res = await fetch("http://localhost:4477/propose", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
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
