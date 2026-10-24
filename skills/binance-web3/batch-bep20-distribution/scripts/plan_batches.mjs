#!/usr/bin/env node
/**
 * plan_batches.mjs — split a recipient CSV into sized batches for a
 * batch-sender distribution (see SKILL.md).
 *
 * Usage:
 *   node plan_batches.mjs <recipients.csv> [batchSize]
 *
 * CSV format (no header):  0xAddress,amountInTokens
 * Amounts are whole-token units with optional decimals (18-decimal token math).
 *
 * Prints: batch count, recipient total, token sum, and writes
 * <csv>.batches.json next to the input file.
 */

import { readFileSync, writeFileSync } from "node:fs";

const csvPath = process.argv[2];
const batchSize = Number(process.argv[3] || 200);

if (!csvPath) {
  console.error("Usage: node plan_batches.mjs <recipients.csv> [batchSize]");
  process.exitCode = 2;
} else {
  await run(csvPath, batchSize);
}

function toWei(amountStr) {
  const [i, f = ""] = amountStr.trim().split(".");
  return BigInt(i) * 10n ** 18n + BigInt((f + "000000000000000000").slice(0, 18));
}

async function run(csvPath, batchSize) {
  const lines = readFileSync(csvPath, "utf8")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const recipients = [];
  for (const [idx, line] of lines.entries()) {
    const [addr, amt] = line.split(",");
    if (!/^0x[0-9a-fA-F]{40}$/.test(addr || "") || !amt || isNaN(Number(amt))) {
      console.error(`Bad row ${idx + 1}: ${line}`);
      process.exitCode = 2;
      return;
    }
    recipients.push({ to: addr, amount: amt, amountWei: toWei(amt).toString() });
  }

  const total = recipients.reduce((s, r) => s + BigInt(r.amountWei), 0n);
  const batches = [];
  for (let i = 0; i < recipients.length; i += batchSize) {
    batches.push(recipients.slice(i, i + batchSize));
  }

  const outPath = csvPath.replace(/\.csv$/i, "") + ".batches.json";
  writeFileSync(outPath, JSON.stringify(batches, null, 2));

  console.log(JSON.stringify({
    recipients: recipients.length,
    batchSize,
    batches: batches.length,
    totalTokens: (Number(total) / 1e18).toString(),
    output: outPath,
  }, null, 2));
}
