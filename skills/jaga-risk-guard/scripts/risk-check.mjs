#!/usr/bin/env node
// jaga-risk-guard — one risk check over an account snapshot.
//   node risk-check.mjs --account account.json --prices prices.json --rules rules.json [--state state.json] [--json]
// Reads whatever shape your Binance MCP server or CLI returned, values the book, runs the rules,
// prints the violations and the sells that would restore the limits. No keys, no network, no orders.
import fs from "node:fs";
import { evaluate, freshState } from "./engine.mjs";
import { parseBalances, parsePrices, valueSnapshot, validateConfig } from "./shapes.mjs";

const args = process.argv.slice(2);
const opt = (n, d) => (args.includes(n) ? args[args.indexOf(n) + 1] : d);
const flag = (n) => args.includes(n);
const read = (p, what) => {
  try {
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch (e) {
    console.error(`cannot read ${what} from ${p}: ${e.message}`);
    process.exit(2);
  }
};

const accountPath = opt("--account");
const pricesPath = opt("--prices");
const rulesPath = opt("--rules");
if (!accountPath || !pricesPath || !rulesPath) {
  console.error("usage: risk-check.mjs --account <file> --prices <file> --rules <file> [--state <file>] [--json]");
  process.exit(2);
}
const statePath = opt("--state");
const rules = read(rulesPath, "rules");

// A risk rule with a missing threshold never fires and looks fine doing it — fail loud instead.
const errs = validateConfig({ rules, mcp: { url: "n/a" }, tools: { account: "n/a", prices: "n/a", order: "n/a" } });
if (errs.length) {
  console.error("invalid rules:\n  " + errs.join("\n  "));
  process.exit(2);
}

const balances = parseBalances(read(accountPath, "account"));
const prices = parsePrices(read(pricesPath, "prices"));
if (!balances.length) {
  console.error("no balances parsed — is this the account tool's raw JSON?");
  process.exit(2);
}
const snapshot = valueSnapshot(balances, prices, rules.quote);
snapshot.ts = Date.now();

const prevState = statePath && fs.existsSync(statePath) ? read(statePath, "state") : freshState();
const { violations, actions, state, headroom } = evaluate(snapshot, rules, prevState);
if (statePath) fs.writeFileSync(statePath, JSON.stringify(state, null, 2));

const drawdownPct = state.peak > 0 ? ((state.peak - snapshot.total) / state.peak) * 100 : 0;
if (flag("--json")) {
  console.log(JSON.stringify({ total: snapshot.total, quote: rules.quote, peak: state.peak, drawdownPct, positions: snapshot.positions, unpriced: snapshot.unpriced, violations, suggestedOrders: actions, headroom }, null, 2));
} else {
  const n = (x) => x.toLocaleString(undefined, { maximumFractionDigits: 2 });
  console.log(`\n🛡️  portfolio ${n(snapshot.total)} ${rules.quote} · peak ${n(state.peak)} · drawdown ${drawdownPct.toFixed(1)}%${rules.maxDrawdownPct ? ` / ${rules.maxDrawdownPct}%` : ""}\n`);
  if (!violations.length) console.log("✅ every rule inside its limit");
  else {
    console.log(`⚠️  ${violations.length} violation${violations.length > 1 ? "s" : ""}`);
    for (const v of violations) console.log(`   [${v.rule}] ${v.detail}`);
    if (actions.length) {
      console.log("\n   suggested (nothing is placed by this skill):");
      for (const a of actions) console.log(`   ${a.side} ${a.symbol} ~${a.usd}${a.full ? " (full position)" : ""}`);
    }
  }
  const hot = headroom.slice(0, 3).map((h) => `${h.rule} ${h.asset} ${h.value}/${h.limit} (${h.pct}%)`);
  if (hot.length) console.log(`\n   closest to tripping: ${hot.join(" · ")}`);
  if (snapshot.unpriced?.length) console.log(`   valued through a bridge, not tradable here: ${snapshot.unpriced.map((p) => p.asset).join(", ")}`);
  if (!statePath) console.log("\n   note: no --state file, so entry prices are this tick's prices — stop-loss and trailing stop cannot fire yet.");
  console.log();
}
process.exit(violations.length ? 1 : 0); // non-zero = something breached, easy to wire into a cron
