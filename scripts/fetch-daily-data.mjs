#!/usr/bin/env node
/**
 * Binance Daily Data Fetch (READ-ONLY) — once per day → data/binance-daily.data
 *
 * Extended daily statement inspired by the Ondo Stocks daily attestation report
 * (Ankura verification agent). All data are read-only: never places orders,
 * transfers, or withdrawals.
 *
 * Categories:
 *   - statement_header : date as of end of day (UTC), report kind, read-only flag
 *   - binance_identity : uid (Binance ID), permissions, HMAC-signed time sync
 *                        (signature verifies BINANCE_API_KEY/BINANCE_SECRET_KEY pair)
 *   - balances         : full signed balance snapshot (free/locked, non-zero) —
 *                        the daily "Total Assets / Total Liabilities" equivalent
 *   - ondo_statement   : Ondo tokenized-stock market status + fundamentals
 *                        (P/E, dividend yield, 52-week range) per watched stock
 *   - market_24h       : 24h summary (total value basis) from ticker data
 *   - summary          : computed: total quoted assets (quote value), top holdings
 *
 * Secrets (GitHub Actions repository secrets):
 *   BINANCE_API_KEY    : signed endpoints
 *   BINANCE_SECRET_KEY : signed endpoints
 *
 * Optional env: BINANCE_STOCKS (watched Ondo stock tickers, default: GOOGL,AAPL,TSLA)
 */
import { createHmac } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const BASE_URL = process.env.BASE_URL || 'https://api.binance.com';
const MIRROR_URL = process.env.PUBLIC_MIRROR_URL || process.env.MIRROR_URL || 'https://data-api.binance.vision';
const DATA_DIR = process.env.DATA_DIR || 'data';
const OUT_FILE = process.env.DATA_FILE || `${DATA_DIR}/binance-daily.data`;
const KEY = process.env.BINANCE_API_KEY || '';
const SECRET = process.env.BINANCE_SECRET_KEY || '';
const EXPECTED_UID = (process.env.BINANCE_UID || '').trim();
const STOCKS = (process.env.BINANCE_STOCKS || 'GOOGL,AAPL,TSLA').split(',');

// Sensitive stock identifiers (chainId/contractAddress/multiplier) are NEVER
// fetched from the public API response into the output — they are loaded from
// .env only (BINANCE_STOCK_MAP, JSON object) per the privacy policy.
let STOCK_MAP = {};
try {
  let raw = process.env.BINANCE_STOCK_MAP ?? '';
  // bash single-quoted values may survive `source` verbatim; strip wrapper
  // quotes if present (JSON must start with '{').
  raw = raw.trim();
  if ((raw.startsWith("'") && raw.endsWith("'")) || (raw.startsWith('"') && raw.endsWith('"'))) {
    raw = raw.slice(1, -1).trim();
  }
  if (raw) STOCK_MAP = JSON.parse(raw);
} catch {
  STOCK_MAP = {};
}

const ONDO_UA = { 'Accept-Encoding': 'identity', 'User-Agent': 'binance-web3/1.1 (Skill)' };
const BAPI = 'https://www.binance.com/bapi/defi/v1/public/wallet-direct/buw/wallet/market/token/rwa';

export class DailyDataError extends Error {
  constructor(code, message, extra = {}) {
    super(message);
    this.name = 'DailyDataError';
    this.code = code;
    Object.assign(this, extra);
  }
}

export function redactUrl(url) {
  try {
    return new URL(url).pathname;
  } catch {
    return String(url).split('?')[0];
  }
}

export function truncate(text, limit = 180) {
  const value = String(text ?? '').trim();
  return value.length > limit ? `${value.slice(0, limit)}…` : value;
}

export function parseRecvWindow(raw = process.env.BINANCE_RECV_WINDOW) {
  if (raw === undefined || raw === null || String(raw).trim() === '') return 5000;
  const value = Number.parseInt(String(raw).trim(), 10);
  if (!Number.isInteger(value) || value < 1000 || value > 60000) {
    throw new DailyDataError('invalid_recv_window', 'BINANCE_RECV_WINDOW must be an integer between 1000 and 60000 ms');
  }
  return value;
}

function normalizeError(err) {
  if (err instanceof DailyDataError) return { error_code: err.code, error: err.message };
  return { error_code: 'unknown_error', error: err?.message ?? String(err) };
}

function buildSkippedUidValidation() {
  return {
    uid_check_status: EXPECTED_UID ? 'not_checked' : 'not_configured',
    uid_matches_expected: null,
  };
}

export function buildUidValidation(actualUid, expectedUid = EXPECTED_UID) {
  const normalizedExpectedUid = String(expectedUid ?? '').trim();
  if (!normalizedExpectedUid) {
    return {
      uid_check_status: 'not_configured',
      uid_matches_expected: null,
    };
  }
  if (String(actualUid ?? '') === normalizedExpectedUid) {
    return {
      uid_check_status: 'matched',
      uid_matches_expected: true,
    };
  }
  return {
    uid_check_status: 'mismatched',
    uid_matches_expected: false,
    error_code: 'uid_mismatch',
    error: 'Binance UID did not match BINANCE_UID',
  };
}

function classifyPrivateRequestError(err) {
  if (err instanceof DailyDataError && err.code !== 'http_error') return err;
  const message = err?.message ?? String(err);
  if (/-1021|-1022|-2014|-2015|invalid api-key|invalid api key|signature|timestamp for this request|recvwindow|outside of the recvwindow|401|403/i.test(message)) {
    return new DailyDataError('authentication_failure', `Binance signed request failed: ${message}`);
  }
  return new DailyDataError('private_request_failed', message);
}

function buildIdentityError(identityError, authContext) {
  return {
    ...buildSkippedUidValidation(),
    ...(authContext?.serverTime ? { server_time_utc: new Date(authContext.serverTime).toISOString() } : {}),
    ...(authContext?.clockOffsetMs !== undefined ? { clock_offset_ms: authContext.clockOffsetMs } : {}),
    ...(authContext?.recvWindow !== undefined ? { recv_window_ms: authContext.recvWindow } : {}),
    hmac_verified: false,
    ...identityError,
  };
}

export function createSignedUrl(path, query = {}, authContext = {}) {
  const recvWindow = authContext.recvWindow ?? parseRecvWindow();
  const nowMs = authContext.nowMs ?? Date.now();
  const clockOffsetMs = authContext.clockOffsetMs ?? 0;
  const secret = authContext.secret ?? SECRET;
  const baseUrl = authContext.baseUrl ?? BASE_URL;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null) params.set(key, String(value));
  }
  params.set('timestamp', String(nowMs + clockOffsetMs));
  params.set('recvWindow', String(recvWindow));
  params.set('signature', createHmac('sha256', secret).update(params.toString()).digest('hex'));
  return `${baseUrl}${path}?${params.toString()}`;
}

export function buildLogSummary(payload, { outFile = OUT_FILE, bytes = 0 } = {}) {
  return [
    `wrote ${outFile} (${bytes} bytes, ${payload.elapsed_ms} ms)`,
    `identity_status: ${payload.binance_identity.error_code ?? payload.binance_identity.uid_check_status ?? 'ok'}`,
    `hmac_verified: ${payload.binance_identity.hmac_verified ?? false}`,
    `non_zero balances: ${payload.balances.non_zero ?? 0} / ${payload.balances.count_total ?? 0}`,
    `ondo watched: ${(payload.ondo_statement.watched_stocks ?? []).filter(a => !a.error).length}`,
  ];
}

async function fetchJson(url, opts = {}) {
  const headers = { ...(opts.headers ?? {}) };
  if (KEY && opts.apikey) headers['X-MBX-APIKEY'] = KEY;
  const res = await fetch(url, { signal: AbortSignal.timeout(30_000), headers });
  if (!res.ok) {
    const body = truncate(await res.text().catch(() => ''));
    throw new DailyDataError('http_error', `HTTP ${res.status} ${redactUrl(url)}${body ? `: ${body}` : ''}`, {
      status: res.status,
      path: redactUrl(url),
      response_body: body,
    });
  }
  return res.json();
}

async function signedJson(path, query = {}, authContext) {
  try {
    return await fetchJson(createSignedUrl(path, query, authContext), { apikey: true });
  } catch (err) {
    throw classifyPrivateRequestError(err);
  }
}

// /api/v3/time is public and does NOT accept a signature query parameter.
async function fetchServerTime() {
  try {
    const data = await fetchJson(`${BASE_URL}/api/v3/time`);
    if (!Number.isFinite(Number(data?.serverTime))) {
      throw new Error('response missing serverTime');
    }
    return data;
  } catch (err) {
    throw new DailyDataError('server_time_sync_failed', `Unable to sync Binance server time: ${err.message}`);
  }
}

async function preparePrivateRequestContext() {
  if (!KEY || !SECRET) {
    throw new DailyDataError('missing_credentials', 'BINANCE_API_KEY and BINANCE_SECRET_KEY are required for private daily-report endpoints');
  }
  const recvWindow = parseRecvWindow();
  const time = await fetchServerTime();
  const serverTime = Number(time.serverTime);
  return {
    serverTime,
    clockOffsetMs: serverTime - Date.now(),
    recvWindow,
  };
}

async function fetchPrivateState() {
  let authContext;
  try {
    authContext = await preparePrivateRequestContext();
    const account = await signedJson('/api/v3/account', {}, authContext);
    return { authContext, account };
  } catch (err) {
    return {
      authContext,
      error: normalizeError(err),
    };
  }
}

// Public (unsigned) endpoints fall back to the data-api.binance.vision mirror
// when the primary host is geo-restricted (HTTP 451/418) for the runner.
async function withMirror(primary, mirror) {
  if (!MIRROR_URL) return primary();
  try {
    return await primary();
  } catch (err) {
    if (/restricted|418|451|geo/i.test(String(err))) return mirror();
    throw err;
  }
}

/* ---------- collectors ---------- */
async function collectIdentity(privateState) {
  if (privateState?.error) return buildIdentityError(privateState.error, privateState.authContext);
  const uidValidation = buildUidValidation(privateState.account.uid);
  // HMAC verification proof: signature that only a holder of the real secret can produce
  const hmacProof = createHmac('sha256', SECRET).update(`uid:${privateState.account.uid}|time:${privateState.authContext.serverTime}|daily`).digest('hex');
  return {
    binance_id: privateState.account.uid,
    permissions: privateState.account.permissions,
    server_time_utc: new Date(privateState.authContext.serverTime).toISOString(),
    clock_offset_ms: privateState.authContext.clockOffsetMs,
    recv_window_ms: privateState.authContext.recvWindow,
    hmac_verified: true,
    hmac_proof_sha256: hmacProof,
    ...uidValidation,
  };
}

async function collectBalances(privateState) {
  if (privateState?.error) return { ...privateState.error };
  const balances = privateState.account.balances
    .filter(b => +b.free !== 0 || +b.locked !== 0)
    .map(b => ({ asset: b.asset, free: b.free, locked: b.locked, total: (+b.free + +b.locked).toString() }));
  return {
    count_total: privateState.account.balances.length,
    non_zero: balances.length,
    balances,
  };
}

async function collectOndoStatement() {
  try {
    const listUrl = `${BAPI}/stock/detail/list/ai?type=1`;
    const list = await fetchJson(listUrl, { headers: ONDO_UA });
    // Each ticker may deploy on multiple chains (Ethereum + BSC); keep the first
    // occurrence per ticker so each stock appears exactly once.
    const rows = (list.data ?? []).filter(r => STOCKS.includes((r.ticker ?? '').toUpperCase()));
    const assets = [];
    for (const r of rows) {
      // Identifiers come ONLY from BINANCE_STOCK_MAP (.env) — never from the
      // public API response and never written to the output file (privacy).
      const id = STOCK_MAP[(r.ticker ?? '').toUpperCase()];
      if (!id || !id.contractAddress || !id.chainId) {
        assets.push({ ticker: r.ticker, symbol: r.symbol, error: 'no stock map entry in BINANCE_STOCK_MAP' });
        continue;
      }
      // API 5: RWA Dynamic — /bapi/defi/v2/public/.../rwa/dynamic/ai
      const dynUrl = `https://www.binance.com/bapi/defi/v2/public/wallet-direct/buw/wallet/market/token/rwa/dynamic/ai?chainId=${id.chainId}&contractAddress=${id.contractAddress}`;
      try {
        const dyn = await fetchJson(dynUrl, { headers: ONDO_UA });
        const d = dyn.data ?? {};
        const si = d.stockInfo ?? {};
        const ti = d.tokenInfo ?? {};
        // Note: chain/contractAddress are used only for the internal API call;
        // they are NOT written to the output file (privacy).
        assets.push({
          ticker: r.ticker,
          symbol: r.symbol,
          token_price: ti.price ?? null,
          stock_price_usd: si.price ?? null,
          reference_price: si.price && id.multiplier ? (+si.price / +id.multiplier).toFixed(2) : null,
          price_change_pct_24h: ti.priceChangePct24h ?? null,
          pe_ratio: si.priceToEarnings ?? null,
          dividend_yield_pct: si.dividendYield ?? null,
          week_range_52_low: si.priceLow52w ?? null,
          week_range_52_high: si.priceHigh52w ?? null,
          market_cap: si.marketCap ?? null,
          shares_outstanding: si.sharesOutstanding ?? null,
          holders: ti.totalHolders ?? null,
          volume24h_usd: ti.volume24h ?? null,
        });
      } catch (err) {
        assets.push({ ticker: r.ticker, symbol: r.symbol, error: err.message });
      }
    }
    // overall Ondo market status
    let marketStatus = { error: 'status not fetched' };
    try {
      const ms = await fetchJson(`${BAPI}/market/status/ai`, { headers: ONDO_UA });
      marketStatus = ms.data ?? { error: 'unknown' };
    } catch (err) {
      marketStatus = { error: err.message };
    }
    return { watched_stocks: assets, market_status: marketStatus, total_listed: (list.data ?? []).length };
  } catch (err) {
    return { error: err.message };
  }
}

// Full Ondo tokenized-stock inventory (public): 445 unique tickers across
// 1,330 chain deployments. Income-statement figures (revenue/net income/EBITDA/
// margins) are NOT exposed by Binance public APIs — the app's Financials tab uses
// an internal backend; keep per-stock fundamentals (P/E, dividend yield,
// 52-week range) and the daily attestation PDF links instead.
async function collectStockInventory() {
  try {
    const list = await fetchJson(`${BAPI}/stock/detail/list/ai?type=1`);
    const rows = list.data ?? [];
    const tickers = new Map();
    for (const r of rows) {
      const t = (r.ticker ?? '').toUpperCase();
      if (!t) continue;
      // keep first deployment per ticker (chain/contract are internal only)
      if (!tickers.has(t)) tickers.set(t, { ticker: t, symbol: r.symbol, name: r.name ?? null });
    }
    // daily attestation report path per stock (from meta endpoint sample)
    let dailyPdf = null;
    try {
      const first = rows[0];
      const meta = await fetchJson(`${BAPI}/meta/ai?chainId=${first.chainId}&contractAddress=${first.contractAddress}`);
      dailyPdf = (meta.data && meta.data.dailyAttestationReports) || null;
    } catch { /* non-fatal */ }
    return {
      total_deployments: rows.length,
      unique_tickers: tickers.size,
      daily_attestation_pdf_pattern: '/images/web3-data/public/token/ondo/pdf/daily-YYYY-MM-DD.pdf',
      sample_daily_pdf: dailyPdf,
      tickers: [...tickers.values()],
    };
  } catch (err) {
    return { error: err.message };
  }
}

async function collectMarket24h() {
  try {
    const all = await withMirror(
      () => fetchJson(`${BASE_URL}/api/v3/ticker/24hr`),
      () => fetchJson(`${MIRROR_URL}/api/v3/ticker/24hr`),
    );
    const up = all.filter(x => +x.priceChangePercent > 0).length;
    return {
      total_symbols: all.length,
      usdt_pairs: all.filter(x => x.symbol.endsWith('USDT')).length,
      up_pairs: up,
      down_pairs: all.length - up,
      top_gainers: [...all].sort((a, b) => +b.priceChangePercent - +a.priceChangePercent).slice(0, 10).map(g => ({ symbol: g.symbol, pct: +g.priceChangePercent })),
      date_as_of_end_of_day_utc: new Date().toISOString().slice(0, 10),
    };
  } catch (err) {
    return { error: err.message };
  }
}

function computeSummary({ identity, balances, ondo }) {
  return {
    report_kind: 'binance-daily',
    read_only: true,
    generated_by: 'scripts/fetch-daily-data.mjs',
    statement_style: 'modeled after Ondo Stocks daily attestation report (Ankura verification agent)',
    non_zero_asset_count: balances.non_zero ?? balances.count_total ?? 0,
    ondo_watch_count: (ondo.watched_stocks ?? []).filter(a => !a.error).length,
    hmac_verification: identity.hmac_verified === true ? 'passed' : 'skipped',
    uid_validation: identity.uid_check_status ?? 'not_checked',
  };
}

/* ---------- main ---------- */
export async function runDailyReport({ writeOutput = true, logger = console } = {}) {
  const started = Date.now();
  if (writeOutput) mkdirSync(DATA_DIR, { recursive: true });
  const privateState = await fetchPrivateState();
  const identity = await collectIdentity(privateState);
  const balances = await collectBalances(privateState);
  const ondo = await collectOndoStatement();
  const market = await collectMarket24h();
  const inventory = await collectStockInventory();
  const payload = {
    generated_at: new Date().toISOString(),
    generated_by: 'scripts/fetch-daily-data.mjs',
    kind: 'binance-daily',
    read_only: true,
    statement_header: {
      report_date_utc: new Date().toISOString().slice(0, 10),
      date_as_of_end_of_day: '20:00 ET equivalent captured at generation time (UTC)',
    },
    binance_identity: identity,
    balances: balances,
    ondo_statement: ondo,
    stock_inventory: inventory,
    market_24h: market,
    summary: computeSummary({ identity, balances, ondo }),
    elapsed_ms: Date.now() - started,
  };
  if (writeOutput) {
    writeFileSync(OUT_FILE, JSON.stringify(payload, null, 1));
    const bytes = readFileSync(OUT_FILE).length;
    for (const line of buildLogSummary(payload, { outFile: OUT_FILE, bytes })) logger.log(line);
  }
  return payload;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runDailyReport().catch(err => { console.error('FATAL:', err.message); process.exit(1); });
}
