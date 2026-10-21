#!/usr/bin/env node
// Aiko decision-scoring engine — self-contained, zero-dep, Node >= 22.
// Pure function: takes already-fetched signal data from sibling skills and
// returns one composite decision. Aiko makes NO network calls and holds NO
// credentials or wallet access — it only reasons over data the caller supplies.
//
// Usage: node cli.mjs decide '<json_input>'
// See references/cli.md for the full input/output schema and scoring formula.

import { realpathSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// Same guard used by binance-sports-ai-analyzer's cli.mjs: compares resolved
// filesystem paths (via realpathSync, which also collapses the symlinks the
// `skills add` installer creates) rather than raw URL strings, since
// `import.meta.url === \`file://${process.argv[1]}\`` never matches on
// Windows (file:// URLs there use forward slashes and a /drive: prefix that
// never string-equals argv[1]'s OS-native backslash path).
function isDirectExecution() {
  if (!process.argv[1]) return false;
  try {
    return realpathSync(fileURLToPath(import.meta.url)) === realpathSync(process.argv[1]);
  } catch {
    return false;
  }
}

const CLAMP = (n, lo, hi) => Math.min(hi, Math.max(lo, n));

const DEFAULT_WEIGHTS = { momentum: 0.35, flow: 0.25, risk: 0.40 };

function scoreMomentum(signal) {
  if (!signal) return { score: 50, note: 'no trading-signal data supplied' };
  const { direction, status, exitRate, smartMoneyCount = 0 } = signal;
  let score = 50;
  if (direction === 'buy') score += 20;
  if (direction === 'sell') score -= 20;
  if (status === 'active') score += 10;
  if (status === 'timeout') score -= 10;
  if (status === 'completed') score -= 5;
  const exit = Number(exitRate) || 0;
  score -= CLAMP(exit / 2, 0, 25);
  score += CLAMP(Number(smartMoneyCount) || 0, 0, 20);
  return {
    score: CLAMP(score, 0, 100),
    note: `direction=${direction ?? 'n/a'} status=${status ?? 'n/a'} exitRate=${exit}% smartMoneyCount=${smartMoneyCount}`,
  };
}

function scoreFlow(rank) {
  if (!rank || rank.position == null || !rank.totalRanked) {
    return { score: 50, note: 'no rank data supplied' };
  }
  const percentile = 1 - (rank.position - 1) / rank.totalRanked;
  return { score: CLAMP(percentile * 100, 0, 100), note: `rank ${rank.position}/${rank.totalRanked}` };
}

function scoreRisk(audit) {
  if (!audit || audit.hasResult === false || audit.isSupported === false) {
    return { score: 30, veto: false, note: 'audit unavailable — treated as elevated risk, not verified safe' };
  }
  const level = Number(audit.riskLevel);
  const table = { 0: 95, 1: 85, 2: 65, 3: 50, 4: 15, 5: 0 };
  let score = table[level] ?? 50;
  const buyTax = Number(audit?.extraInfo?.buyTax) || 0;
  const sellTax = Number(audit?.extraInfo?.sellTax) || 0;
  if (buyTax > 10 || sellTax > 10) score = Math.min(score, 10);
  else if (buyTax > 5 || sellTax > 5) score = Math.min(score, 40);
  if (audit?.extraInfo?.isVerified === false) score = Math.min(score, 40);
  const veto = level >= 4 || buyTax > 10 || sellTax > 10;
  return {
    score: CLAMP(score, 0, 100),
    veto,
    note: `riskLevel=${audit.riskLevelEnum ?? level} buyTax=${buyTax}% sellTax=${sellTax}%`,
  };
}

function bucket(composite, momentumDir, veto, sourcesAvailable) {
  if (veto) return 'AVOID';
  // With zero real inputs, the composite is pulled entirely by scoreRisk's
  // conservative "unavailable" default — that's a statement about missing
  // data, not a bearish read. Don't let it masquerade as a leaning decision.
  if (sourcesAvailable === 0) return 'NEUTRAL';
  if (composite >= 70) return momentumDir === 'sell' ? 'NEUTRAL' : 'LEAN_BUY';
  if (composite < 45) return momentumDir === 'buy' ? 'NEUTRAL' : 'LEAN_SELL';
  return 'NEUTRAL';
}

function computeDecision(input = {}) {
  const { signal, rank, audit, weights = {} } = input;
  const w = { ...DEFAULT_WEIGHTS, ...weights };
  const m = scoreMomentum(signal);
  const f = scoreFlow(rank);
  const r = scoreRisk(audit);

  const composite = m.score * w.momentum + f.score * w.flow + r.score * w.risk;

  const auditAvailable = audit && audit.hasResult !== false && audit.isSupported !== false;
  const sourcesAvailable = [signal, rank, auditAvailable ? audit : null].filter(Boolean).length;
  const decision = bucket(composite, signal?.direction, r.veto, sourcesAvailable);
  const confidence = CLAMP(20 + sourcesAvailable * 20, 20, 80);

  return {
    decision,
    compositeScore: Math.round(composite),
    confidence,
    subscores: { momentum: Math.round(m.score), flow: Math.round(f.score), risk: Math.round(r.score) },
    rationale: [m.note, f.note, r.note],
    riskVeto: r.veto,
    generatedAt: new Date().toISOString(),
    disclaimer:
      'Informational only — not investment, financial, or trading advice. Aiko does not execute trades; any action requires a separate, explicitly confirmed step in the appropriate skill (e.g. binance-agentic-wallet). DYOR.',
  };
}

// ---- exports (for unit testing; direct execution still works — see dispatch below) ----
export { computeDecision, scoreMomentum, scoreFlow, scoreRisk, DEFAULT_WEIGHTS };

// ---- CLI dispatch (only runs when executed directly, not when imported) ----
if (isDirectExecution()) {
  const [cmd, paramsStr] = process.argv.slice(2);

  if (!cmd || cmd === '--help' || cmd === '-h') {
    console.log("Usage: node cli.mjs decide '<json_input>'\n\nSee references/cli.md for the input/output schema.");
    process.exit(0);
  }

  if (cmd !== 'decide') {
    console.error(`Unknown command: ${cmd}\nOnly "decide" is supported.`);
    process.exit(1);
  }

  let input = {};
  if (paramsStr) {
    try { input = JSON.parse(paramsStr); }
    catch { console.error('Invalid JSON params'); process.exit(1); }
  }

  console.log(JSON.stringify(computeDecision(input), null, 2));
}
