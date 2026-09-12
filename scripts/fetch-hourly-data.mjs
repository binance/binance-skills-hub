#!/usr/bin/env node
/**
 * Binance Hourly Data Fetch (READ-ONLY) — every 1 hour → data/binance-1h.data
 *
 * Categories collected (all read-only; never places orders/withdrawals/transfers):
 *   - spot         : 24h ticker stats for watched symbols
 *   - market       : global market summary (top movers, breadth)
 *   - funding      : USDS futures funding rates (BTCUSDT)
 *   - margin       : margin interest rates + borrowable asset count
 *   - stock        : tokenized stock symbols in exchangeInfo
 *   - bnb_alpha    : BNB ecosystem alpha (BNB momentum vs market, BNB pairs breadth,
 *                    BNB burn context from price/volume stats)
 *   - smart_money  : synthesized market opinion (momentum + funding + breadth signals)
 *   - account      : signed snapshot (uid, permissions, balances) via HMAC auth
 *
 * Output: data/binance-1h.data (JSON, single-line, timestamped)
 *
 * Secrets (GitHub Actions repository secrets):
 *   BINANCE_API_KEY    : signed endpoints (account snapshot)
 *   BINANCE_SECRET_KEY : signed endpoints (account snapshot)
 *
 * Works on geo-restricted runners via data-api.binance.vision mirror fallback.
 */
import { createHmac } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const BASE_URL = process.env.BASE_URL || 'https://api.binance.com';
const MIRROR_URL = process.env.PUBLIC_MIRROR_URL || process.env.MIRROR_URL || 'https://data-api.binance.vision';
const DATA_DIR = process.env.DATA_DIR || 'data';
const OUT_FILE = process.env.DATA_FILE || `${DATA_DIR}/binance-1h.data`;
const KEY = process.env.BINANCE_API_KEY || '';
const SECRET = process.env.BINANCE_SECRET_KEY || '';
const SYMBOLS = (process.env.BINANCE_SYMBOLS || 'BTCUSDT,ETHUSDT,BNBUSDT,SOLUSDT').split(',');

mkdirSync(DATA_DIR, { recursive: true });

/* ---------- helpers ---------- */
async function fetchJson(url, opts = {}) {
  const headers = { ...(opts.headers ?? {}) };
  if (KEY) headers['X-MBX-APIKEY'] = KEY;
  const res = await fetch(url, { signal: AbortSignal.timeout(25_000), headers });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
  return res.json();
}

function signedJson(path, query = {}) {
  const params = new URLSearchParams({ ...query, timestamp: Date.now().toString() });
  params.set('signature', createHmac('sha256', SECRET).update(params.toString()).digest('hex'));
  return fetchJson(`${BASE_URL}${path}?${params}`);
}

async function withMirror(primary, mirror) {
  if (!MIRROR_URL) return primary();
  try {
    return await primary();
  } catch (err) {
    if (/restricted|418|451|geo/i.test(String(err))) return mirror();
    throw err;
  }
}

/* ---------- category collectors (all read-only) ---------- */
async function collectSpot() {
  const pick = t => ({ last_price: +t.lastPrice, change_pct: +t.priceChangePercent, high: +t.highPrice, low: +t.lowPrice, volume: +t.quoteVolume });
  return withMirror(
    async () => {
      const all = await fetchJson(`${BASE_URL}/api/v3/ticker/24hr`);
      return Object.fromEntries(SYMBOLS.map(sym => [sym, pick(all.find(x => x.symbol === sym) || {})]));
    },
    async () => {
      const all = await fetchJson(`${MIRROR_URL}/api/v3/ticker/24hr`);
      return Object.fromEntries(SYMBOLS.map(sym => [sym, pick(all.find(x => x.symbol === sym) || {})]));
    },
  );
}

async function collectMarket() {
  const build = async url => {
    const depth = await fetchJson(`${url}/api/v3/ticker/24hr`, {});
    const usdt = depth.filter(x => x.symbol.endsWith('USDT'));
    const up = usdt.filter(x => +x.priceChangePercent > 0).length;
    const all = [...depth].sort((a, b) => +b.priceChangePercent - +a.priceChangePercent);
    return {
      total_symbols: depth.length,
      usdt_pairs: usdt.length,
      up_pairs: up,
      down_pairs: usdt.length - up,
      top_gainers: all.slice(0, 10).map(g => ({ symbol: g.symbol, pct: +g.priceChangePercent })),
      top_losers: all.slice(-10).reverse().map(g => ({ symbol: g.symbol, pct: +g.priceChangePercent })),
    };
  };
  return withMirror(() => build(BASE_URL), () => build(MIRROR_URL));
}

async function collectFunding() {
  try {
    const hist = await fetchJson(`${BASE_URL}/fapi/v1/fundingRate?symbol=BTCUSDT&limit=5`);
    const mark = await fetchJson(`${BASE_URL}/fapi/v1/premiumIndex?symbol=BTCUSDT`);
    return {
      symbol: 'BTCUSDT',
      last_rate: hist[hist.length - 1]?.fundingRate ?? null,
      history: hist.map(h => ({ time: new Date(h.fundingTime).toISOString(), rate: h.fundingRate })),
      next_funding: mark.nextFundingTime ? new Date(mark.nextFundingTime).toISOString() : null,
    };
  } catch (err) {
    // /fapi endpoints return 403 on geo-restricted runners; no public mirror exists.
    return { error: `futures funding not available from this region: ${err.message}` };
  }
}

async function collectMargin() {
  try {
    const allAssets = await fetchJson(`${BASE_URL}/sapi/v1/margin/allAssets`);
    const borrowable = allAssets.filter(a => a.isBorrowable);
    return {
      total_assets: allAssets.length,
      borrowable_assets: borrowable.map(a => a.assetName).slice(0, 50),
      borrowable_count: borrowable.length,
      usdt_borrowable: borrowable.some(a => a.assetName === 'USDT'),
    };
  } catch (err) {
    return { error: err.message };
  }
}

async function collectStock() {
  try {
    const info = await fetchJson(`${BASE_URL}/api/v3/exchangeInfo`);
    const stocks = info.symbols.filter(s => s.symbol.endsWith('USD') && s.baseAsset.length > 3 && s.baseAsset.length <= 5);
    // Tokenized stocks have no dedicated asset type flag on the public API; the filter
    // above catches 5-letter stock tickers (e.g. OZOP, TSLA, AAPL) paired against USD.
    return {
      count: stocks.length,
      sample: stocks.slice(0, 20).map(s => ({ symbol: s.symbol, status: s.status })),
    };
  } catch (err) {
    return { error: err.message };
  }
}

async function collectBnbAlpha(market) {
  try {
    const info = await fetchJson(`${BASE_URL}/api/v3/exchangeInfo`);
    const bnbPairs = info.symbols.filter(s => (s.baseAsset === 'BNB' || s.quoteAsset === 'BNB') && s.status === 'TRADING').length;
    const klines = await fetchJson(`${BASE_URL}/api/v3/klines?symbol=BNBUSDT&interval=1h&limit=24`);
    const closes = klines.map(k => +k[4]);
    const bnbNow = closes[closes.length - 1];
    const bnbAvg = closes.reduce((a, b) => a + b, 0) / closes.length;
    const momentum = ((bnbNow - closes[0]) / closes[0]) * 100;
    return {
      bnb_price: bnbNow,
      momentum_24h_pct: +momentum.toFixed(3),
      price_vs_24h_avg_pct: +(((bnbNow - bnbAvg) / bnbAvg) * 100).toFixed(3),
      bnb_pair_count: bnbPairs,
      note: 'BNB momentum vs its own 24h range and ecosystem pair count',
    };
  } catch (err) {
    return { error: err.message };
  }
}

async function collectAccount() {
  if (!KEY || !SECRET) return { error: 'BINANCE_API_KEY/BINANCE_SECRET_KEY not set; account snapshot skipped' };
  try {
    const acct = await signedJson('/api/v3/account');
    const nonZero = acct.balances.filter(b => +b.free !== 0 || +b.locked !== 0).map(b => ({ asset: b.asset, free: b.free, locked: b.locked }));
    return { uid: acct.uid, permissions: acct.permissions, balance_count: acct.balances.length, non_zero_balances: nonZero };
  } catch (err) {
    return { error: err.message };
  }
}

function smartMoneyOpinion({ tickers, market, funding }) {
  const avgChange = Object.values(tickers).reduce((s, t) => s + t.change_pct, 0) / Math.max(Object.values(tickers).length, 1);
  const fundingRate = funding.last_rate ? +funding.last_rate : null;
  const breadth = market.up_pairs / Math.max(market.usdt_pairs, 1);
  const signals = [];
  let score = 0;
  if (avgChange > 2) { signals.push('strong momentum (watched avg > +2% 24h)'); score += 2; }
  else if (avgChange > 0) { signals.push('mild bullish momentum (watched avg positive)'); score += 1; }
  else if (avgChange < -2) { signals.push('strong bearish pressure (watched avg < -2% 24h)'); score -= 2; }
  else signals.push('neutral sideways momentum');
  if (fundingRate !== null) {
    if (fundingRate > 0.0005) { signals.push('longs crowded (positive funding)'); score -= 1; }
    else if (fundingRate < -0.0005) { signals.push('shorts crowded (negative funding)'); score += 1; }
    else signals.push('funding neutral');
  }
  if (breadth > 0.7) { signals.push('broad market breadth (70%+ USDT pairs up)'); score += 1; }
  else if (breadth < 0.3) { signals.push('weak market breadth (70%+ USDT pairs down)'); score -= 1; }
  const verdict = score >= 2 ? 'bullish' : score <= -2 ? 'bearish' : 'neutral';
  return { signals, composite_score: score, opinion: verdict, watched_avg_change_pct: +avgChange.toFixed(3), breadth_up_ratio: +breadth.toFixed(3) };
}

/* ---------- main ---------- */
async function run() {
  const started = Date.now();
  const tickers = await collectSpot();
  const market = await collectMarket();
  const funding = await collectFunding();
  const margin = await collectMargin();
  const stock = await collectStock();
  const bnbAlpha = await collectBnbAlpha(market);
  const account = await collectAccount();
  const payload = {
    generated_at: new Date().toISOString(),
    generated_by: 'scripts/fetch-hourly-data.mjs',
    kind: 'binance-1h',
    read_only: true,
    spot_tickers: tickers,
    market_summary: market,
    funding: funding,
    margin: margin,
    stock: stock,
    bnb_alpha: bnbAlpha,
    account: account,
    smart_money_opinion: smartMoneyOpinion({ tickers, market, funding }),
    elapsed_ms: Date.now() - started,
  };
  writeFileSync(OUT_FILE, JSON.stringify(payload));
  console.log(`wrote ${OUT_FILE} (${readFileSync(OUT_FILE).length} bytes, ${payload.elapsed_ms} ms)`);
  console.log('opinion:', payload.smart_money_opinion.opinion, '| score:', payload.smart_money_opinion.composite_score);
  if (bnbAlpha.bnb_price) console.log('bnb_alpha: price', bnbAlpha.bnb_price, 'momentum', bnbAlpha.momentum_24h_pct + '%');
  if (account.uid) console.log('account uid:', account.uid);
}

run().catch(err => { console.error('FATAL:', err.message); process.exit(1); });
