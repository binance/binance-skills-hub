#!/usr/bin/env node
// RadarCrypto BTC Score — CLI (sem dependencias, Node >= 18)
const API = process.env.RADARCRYPTO_API || 'https://radarcrypto.com.br/api/indicators.json';

async function load() {
  const r = await fetch(API + '?_t=' + Date.now(), { headers: { 'accept': 'application/json' } });
  if (!r.ok) throw new Error(`API ${r.status} ${r.statusText}`);
  return r.json();
}

const fmt = (v) => v === null || v === undefined ? '—' : (typeof v === 'number' ? String(v) : String(v));

function printKV(obj, indent = '  ') {
  for (const [k, v] of Object.entries(obj)) {
    if (v && typeof v === 'object' && !Array.isArray(v)) { console.log(`${indent}${k}:`); printKV(v, indent + '  '); }
    else console.log(`${indent}${k.padEnd(24)} ${fmt(Array.isArray(v) ? v.join(', ') : v)}`);
  }
}

function score(d) {
  console.log(`\nBTC Score: ${d.score}/100  ·  ${d.score_zone} (${d.score_range})`);
  console.log(`Sinal: ${d.risk_signal}`);
  if (d.indicators?.btc_price_fmt) console.log(`Preco: ${d.indicators.btc_price_fmt}  ${d.indicators.change_24h_fmt || ''}`);
  if (d.capitulation?.active) console.log(`CAPITULACAO: ${d.capitulation.text || d.capitulation.reasons?.join('; ')}`);
  console.log(`Atualizado: ${d.updated_at}  (engine ${d.engine_version})\n`);
}

function sub(d) { console.log('\nSub-scores:'); printKV(d.sub_scores || {}); console.log(); }
function ind(d) { console.log('\nIndicadores:'); printKV(d.indicators || {}); console.log(); }

const cmd = process.argv[2] || 'score';
try {
  const d = await load();
  if (cmd === 'json') console.log(JSON.stringify(d, null, 2));
  else if (cmd === 'indicators') { score(d); ind(d); }
  else if (cmd === 'subscores') { score(d); sub(d); }
  else if (cmd === 'full') { score(d); sub(d); ind(d); }
  else if (cmd === 'score') score(d);
  else { console.error('Uso: cli.mjs [score|subscores|indicators|full|json]'); process.exit(2); }
} catch (e) { console.error('Erro:', e.message); process.exit(1); }
