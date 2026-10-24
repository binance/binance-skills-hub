#!/usr/bin/env node
/**
 * read_orders.mjs — dependency-free reader for an approval-based order-book
 * market on BSC (see SKILL.md). Prints every active order with its remaining
 * amount and unit price.
 *
 * Usage:
 *   node read_orders.mjs [marketAddress] [rpcUrl]
 *
 * Defaults to the live reference deployment from SKILL.md.
 */

const DEFAULT_MARKET = "0xCF19D05878Ab8bC53280299442De280afaaA16C8";
const DEFAULT_RPC = "https://bsc-dataseed.binance.org";

const SEL = {
  orderCount: "0x2453ffa8", // orderCount()
  orders: "0xa85c38ef",     // orders(uint256)
};

const market = process.argv[2] || DEFAULT_MARKET;
const rpc = process.argv[3] || DEFAULT_RPC;

async function ethCall(to, data) {
  const res = await fetch(rpc, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "eth_call",
      params: [{ to, data }, "latest"],
    }),
  });
  if (!res.ok) throw new Error(`RPC HTTP ${res.status}`);
  const json = await res.json();
  if (json.error) throw new Error(JSON.stringify(json.error));
  return json.result;
}

const word = (hex, i) => "0x" + hex.slice(2 + i * 64, 2 + (i + 1) * 64);

const countHex = await ethCall(market, SEL.orderCount);
const count = Number(BigInt(countHex));

const out = [];
for (let id = 0; id < count; id++) {
  const data = SEL.orders + id.toString(16).padStart(64, "0");
  const r = await ethCall(market, data);
  const maker = "0x" + word(r, 0).slice(-40);
  const amount = BigInt(word(r, 1));
  const filled = BigInt(word(r, 2));
  const priceWei = BigInt(word(r, 3));
  const active = BigInt(word(r, 4)) !== 0n;
  const remainingTokens = amount - filled;
  if (active && remainingTokens > 0n) {
    out.push({
      id,
      maker,
      remaining: (Number(remainingTokens) / 1e18).toString(),
      priceBnbPerToken: (Number(priceWei) / 1e18).toString(),
      totalBnb: (Number((remainingTokens * priceWei) / 10n ** 18n) / 1e18).toString(),
    });
  }
}

console.log(JSON.stringify({ market, orderCount: count, activeOrders: out }, null, 2));
