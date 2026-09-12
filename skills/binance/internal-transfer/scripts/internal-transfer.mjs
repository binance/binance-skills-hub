#!/usr/bin/env node
import { createInterface } from 'node:readline/promises';
import { stdin as defaultStdin, stdout as defaultStdout } from 'node:process';
import { pathToFileURL } from 'node:url';

import {
  DailyDataError,
  buildUidValidation,
  createSignedUrl,
  parseRecvWindow,
  redactUrl,
  truncate,
} from '../../../../scripts/fetch-daily-data.mjs';

const DEFAULT_BASE_URL = process.env.BINANCE_BASE_URL || process.env.BASE_URL || 'https://api.binance.com';
const DEFAULT_MIRROR_URL = process.env.PUBLIC_MIRROR_URL || process.env.MIRROR_URL || 'https://data-api.binance.vision';
const DEFAULT_ASSET = 'USDT';
const DEFAULT_FIAT = 'USD';
const TRANSFER_PATH = '/sapi/v1/asset/transfer';
const ACCOUNT_PATH = '/api/v3/account';
const SERVER_TIME_PATH = '/api/v3/time';
const PRICE_PATH = '/api/v3/ticker/price';
const AMOUNT_DECIMAL_LIMIT = 8;
const UID_PATTERN = /^\d+$/;
const ASSET_PATTERN = /^[A-Z0-9]{2,20}$/;
const ACCOUNT_PATTERN = /^[A-Z0-9_]{2,32}$/;
const USAGE = `Usage:
  node skills/binance/internal-transfer/scripts/internal-transfer.mjs [--send] [--no-valuation]

Environment:
  BINANCE_API_KEY
  BINANCE_SECRET_KEY
  BINANCE_UID                  optional expected source UID validation
  BINANCE_TRANSFER_ASSET       default USDT
  BINANCE_TRANSFER_AMOUNT      required
  BINANCE_TARGET_UID           required
  BINANCE_TRANSFER_FROM_ACCOUNT required
  BINANCE_TRANSFER_TO_ACCOUNT   required
  BINANCE_FIAT_CURRENCY        default USD
  BINANCE_RECV_WINDOW          optional, 1000-60000 ms

Notes:
  Dry-run is the default.
  The documented public wallet transfer endpoint is POST /sapi/v1/asset/transfer.
  That endpoint transfers between account types on the same Binance account context; it does not
  expose a target-UID parameter in the official request surface.
`;

function normalizeError(err) {
  if (err instanceof DailyDataError) return { error_code: err.code, error: err.message };
  return { error_code: 'unknown_error', error: err?.message ?? String(err) };
}

function classifyPrivateRequestError(err) {
  if (err instanceof DailyDataError && err.code !== 'http_error') return err;
  const message = err?.message ?? String(err);
  if (/-1021|-1022|-2014|-2015|invalid api-key|invalid api key|signature|timestamp for this request|recvwindow|outside of the recvwindow|401|403/i.test(message)) {
    return new DailyDataError('authentication_failure', `Binance signed request failed: ${message}`);
  }
  return new DailyDataError('private_request_failed', message);
}

function requireNonEmpty(value, field) {
  if (value === undefined || value === null || String(value).trim() === '') {
    throw new DailyDataError('missing_required_field', `${field} is required`);
  }
  return String(value).trim();
}

export function maskUid(uid) {
  const value = String(uid ?? '').trim();
  if (!value) return '';
  if (value.length <= 4) return `${'*'.repeat(Math.max(0, value.length - 1))}${value.slice(-1)}`;
  return `${value.slice(0, 2)}${'*'.repeat(Math.max(2, value.length - 4))}${value.slice(-2)}`;
}

export function validateUid(raw, field = 'UID') {
  const value = requireNonEmpty(raw, field);
  if (!UID_PATTERN.test(value)) {
    throw new DailyDataError('invalid_uid', `${field} must be a non-empty numeric string`);
  }
  return value;
}

export function validateAsset(raw) {
  const value = String(raw ?? DEFAULT_ASSET).trim().toUpperCase();
  if (!ASSET_PATTERN.test(value)) {
    throw new DailyDataError('invalid_asset', 'BINANCE_TRANSFER_ASSET must be uppercase alphanumeric');
  }
  return value;
}

export function validateAmount(raw) {
  const value = requireNonEmpty(raw, 'BINANCE_TRANSFER_AMOUNT');
  if (!/^\d+(?:\.\d+)?$/.test(value)) {
    throw new DailyDataError('invalid_amount', 'BINANCE_TRANSFER_AMOUNT must be a positive decimal');
  }
  const [, fraction = ''] = value.split('.');
  if (fraction.length > AMOUNT_DECIMAL_LIMIT) {
    throw new DailyDataError('invalid_amount_precision', `BINANCE_TRANSFER_AMOUNT supports up to ${AMOUNT_DECIMAL_LIMIT} decimal places`);
  }
  if (!(Number(value) > 0)) {
    throw new DailyDataError('invalid_amount', 'BINANCE_TRANSFER_AMOUNT must be greater than zero');
  }
  return value;
}

export function validateAccountType(raw, field) {
  const value = requireNonEmpty(raw, field).toUpperCase();
  if (!ACCOUNT_PATTERN.test(value)) {
    throw new DailyDataError('invalid_account_type', `${field} must be uppercase letters, numbers, or underscores`);
  }
  return value;
}

function validateFiatCurrency(raw) {
  const value = String(raw ?? DEFAULT_FIAT).trim().toUpperCase();
  if (!ASSET_PATTERN.test(value)) {
    throw new DailyDataError('invalid_fiat_currency', 'BINANCE_FIAT_CURRENCY must be uppercase alphanumeric');
  }
  return value;
}

export function parseCliArgs(argv = []) {
  const args = Array.from(argv);
  const options = {
    send: false,
    valuation: true,
    help: false,
  };
  for (const arg of args) {
    if (arg === '--send') options.send = true;
    else if (arg === '--no-valuation') options.valuation = false;
    else if (arg === '--dry-run') options.send = false;
    else if (arg === '--help' || arg === '-h') options.help = true;
    else throw new DailyDataError('invalid_cli_flag', `Unknown flag: ${arg}`);
  }
  return options;
}

export function resolveTransferConfig(env = process.env) {
  const recvWindow = parseRecvWindow(env.BINANCE_RECV_WINDOW);
  return {
    apiKey: requireNonEmpty(env.BINANCE_API_KEY, 'BINANCE_API_KEY'),
    secretKey: requireNonEmpty(env.BINANCE_SECRET_KEY, 'BINANCE_SECRET_KEY'),
    expectedUid: String(env.BINANCE_UID ?? '').trim(),
    targetUid: validateUid(env.BINANCE_TARGET_UID, 'BINANCE_TARGET_UID'),
    asset: validateAsset(env.BINANCE_TRANSFER_ASSET),
    amount: validateAmount(env.BINANCE_TRANSFER_AMOUNT),
    fromAccount: validateAccountType(env.BINANCE_TRANSFER_FROM_ACCOUNT, 'BINANCE_TRANSFER_FROM_ACCOUNT'),
    toAccount: validateAccountType(env.BINANCE_TRANSFER_TO_ACCOUNT, 'BINANCE_TRANSFER_TO_ACCOUNT'),
    fiatCurrency: validateFiatCurrency(env.BINANCE_FIAT_CURRENCY),
    recvWindow,
    baseUrl: String(env.BINANCE_BASE_URL || env.BASE_URL || DEFAULT_BASE_URL).trim(),
    mirrorUrl: String(env.PUBLIC_MIRROR_URL || env.MIRROR_URL || DEFAULT_MIRROR_URL).trim(),
  };
}

function redactSignedUrl(url) {
  const redacted = new URL(url);
  if (redacted.searchParams.has('signature')) redacted.searchParams.set('signature', '[redacted]');
  return `${redacted.pathname}?${redacted.searchParams.toString()}`;
}

async function fetchJson(url, { headers = {} } = {}, fetchImpl = globalThis.fetch) {
  const res = await fetchImpl(url, {
    signal: AbortSignal.timeout(30_000),
    headers,
  });
  if (!res.ok) {
    const body = truncate(await res.text().catch(() => ''));
    throw new DailyDataError('http_error', `HTTP ${res.status} ${redactUrl(url)}${body ? `: ${body}` : ''}`);
  }
  return res.json();
}

export async function fetchServerTime({ baseUrl = DEFAULT_BASE_URL, fetchImpl = globalThis.fetch } = {}) {
  try {
    const data = await fetchJson(`${baseUrl}${SERVER_TIME_PATH}`, {}, fetchImpl);
    if (!Number.isFinite(Number(data?.serverTime))) {
      throw new Error('response missing serverTime');
    }
    return Number(data.serverTime);
  } catch (err) {
    throw new DailyDataError('server_time_sync_failed', `Unable to sync Binance server time: ${err.message}`);
  }
}

export async function prepareTransferContext({
  apiKey,
  secretKey,
  recvWindow,
  baseUrl = DEFAULT_BASE_URL,
  fetchImpl = globalThis.fetch,
  now = Date.now,
} = {}) {
  if (!apiKey || !secretKey) {
    throw new DailyDataError('missing_credentials', 'BINANCE_API_KEY and BINANCE_SECRET_KEY are required for internal transfer validation');
  }
  const localNow = Number(now());
  const serverTime = await fetchServerTime({ baseUrl, fetchImpl });
  return {
    apiKey,
    secretKey,
    recvWindow,
    baseUrl,
    now,
    serverTime,
    clockOffsetMs: serverTime - localNow,
  };
}

export async function fetchAccountIdentity(authContext, fetchImpl = globalThis.fetch) {
  try {
    const signedUrl = createSignedUrl(ACCOUNT_PATH, {}, {
      baseUrl: authContext.baseUrl,
      secret: authContext.secretKey,
      nowMs: Number(authContext.now()),
      recvWindow: authContext.recvWindow,
      clockOffsetMs: authContext.clockOffsetMs,
    });
    return await fetchJson(signedUrl, { headers: { 'X-MBX-APIKEY': authContext.apiKey } }, fetchImpl);
  } catch (err) {
    throw classifyPrivateRequestError(err);
  }
}

export function buildTransferRequestPreview(config, authContext, { now = Date.now } = {}) {
  const signedUrl = createSignedUrl(
    TRANSFER_PATH,
    {
      type: `${config.fromAccount}_${config.toAccount}`,
      asset: config.asset,
      amount: config.amount,
    },
    {
      baseUrl: config.baseUrl,
      secret: config.secretKey,
      nowMs: Number(now()),
      clockOffsetMs: authContext.clockOffsetMs,
      recvWindow: config.recvWindow,
    },
  );
  const redactedQuery = new URL(signedUrl).searchParams;
  const previewQuery = Object.fromEntries(redactedQuery.entries());
  previewQuery.signature = '[redacted]';
  return {
    method: 'POST',
    endpoint: TRANSFER_PATH,
    transfer_type: `${config.fromAccount}_${config.toAccount}`,
    redacted_path_and_query: redactSignedUrl(signedUrl),
    query: previewQuery,
  };
}

function buildUsdQuoteCandidates(asset, fiatCurrency) {
  const fiat = fiatCurrency.toUpperCase();
  const candidates = [];
  if (asset !== fiat) candidates.push({ symbol: `${asset}${fiat}`, estimated_from: `${asset}/${fiat}` });
  if (fiat === 'USD') {
    for (const proxy of ['USDC', 'USDT', 'FDUSD']) {
      if (asset === proxy) continue;
      candidates.push({ symbol: `${asset}${proxy}`, estimated_from: `${asset}/${proxy}` });
    }
  }
  return candidates;
}

async function fetchTickerPrice(symbol, { baseUrl, mirrorUrl, fetchImpl = globalThis.fetch }) {
  const encoded = encodeURIComponent(symbol);
  const primary = `${baseUrl}${PRICE_PATH}?symbol=${encoded}`;
  try {
    return await fetchJson(primary, {}, fetchImpl);
  } catch (err) {
    if (!mirrorUrl || !/restricted|418|451|geo/i.test(String(err))) throw err;
    return fetchJson(`${mirrorUrl}${PRICE_PATH}?symbol=${encoded}`, {}, fetchImpl);
  }
}

export async function estimateFiatValue(config, { fetchImpl = globalThis.fetch } = {}) {
  const candidates = buildUsdQuoteCandidates(config.asset, config.fiatCurrency);
  if (candidates.length === 0) {
    return {
      valuation_available: false,
      valuation_status: 'not_available',
      fiat_currency: config.fiatCurrency,
      note: `No Binance market-data symbol candidates available for ${config.asset}/${config.fiatCurrency}`,
    };
  }

  for (const candidate of candidates) {
    try {
      const quote = await fetchTickerPrice(candidate.symbol, {
        baseUrl: config.baseUrl,
        mirrorUrl: config.mirrorUrl,
        fetchImpl,
      });
      const price = Number(quote?.price);
      if (!Number.isFinite(price) || !(price > 0)) continue;
      return {
        valuation_available: true,
        valuation_status: 'estimated',
        fiat_currency: config.fiatCurrency,
        market_symbol: candidate.symbol,
        estimated_from: candidate.estimated_from,
        unit_price: price.toFixed(8),
        estimated_value: (price * Number(config.amount)).toFixed(8),
        note: `${config.fiatCurrency} value is an estimate at quote time from Binance public market data; it does not convert the transfer into fiat.`,
      };
    } catch {
      // Try the next symbol candidate.
    }
  }

  return {
    valuation_available: false,
    valuation_status: 'unavailable',
    fiat_currency: config.fiatCurrency,
    note: `No Binance public market-data quote was available for ${config.asset}/${config.fiatCurrency}`,
  };
}

function buildResultSummary(result) {
  const lines = [
    `mode: ${result.mode}`,
    `source_uid_check: ${result.source_uid_check_status}`,
    `target_uid: ${result.masked_target_uid}`,
    `asset: ${result.asset}`,
    `amount: ${result.amount}`,
    `account_path: ${result.from_account} -> ${result.to_account}`,
    `endpoint_support: ${result.endpoint_support}`,
    `transfer_request: ${result.transfer_preview.redacted_path_and_query}`,
  ];

  if (result.valuation?.valuation_available) {
    lines.push(`estimated_${result.valuation.fiat_currency.toLowerCase()}: ${result.valuation.estimated_value} via ${result.valuation.market_symbol}`);
  } else if (result.valuation?.note) {
    lines.push(`valuation: ${result.valuation.note}`);
  }

  if (result.warning) lines.push(`warning: ${result.warning}`);
  return lines;
}

async function defaultConfirmSend({ asset, amount, fromAccount, toAccount, targetUid }, { stdin = defaultStdin, stdout = defaultStdout } = {}) {
  const rl = createInterface({ input: stdin, output: stdout });
  try {
    const answer = await rl.question(
      `Live send requested.\nTarget UID: ${targetUid}\nAsset: ${asset}\nAmount: ${amount}\nAccount types: ${fromAccount} -> ${toAccount}\nType CONFIRM to continue: `,
    );
    return answer.trim() === 'CONFIRM';
  } finally {
    rl.close();
  }
}

export async function runInternalTransfer({
  argv = process.argv.slice(2),
  env = process.env,
  logger = console,
  fetchImpl = globalThis.fetch,
  confirmSend = defaultConfirmSend,
  now = Date.now,
} = {}) {
  const options = parseCliArgs(argv);
  if (options.help) {
    logger.log(USAGE);
    return { help: true };
  }

  const config = resolveTransferConfig(env);
  const authContext = await prepareTransferContext({
    apiKey: config.apiKey,
    secretKey: config.secretKey,
    recvWindow: config.recvWindow,
    baseUrl: config.baseUrl,
    fetchImpl,
    now,
  });
  const account = await fetchAccountIdentity(authContext, fetchImpl);
  const sourceUid = validateUid(account?.uid, 'Binance account UID');
  const uidValidation = buildUidValidation(sourceUid, config.expectedUid);
  if (uidValidation.uid_matches_expected === false) {
    throw new DailyDataError(uidValidation.error_code, uidValidation.error);
  }

  const transferPreview = buildTransferRequestPreview(config, authContext, { now });
  const valuation = options.valuation ? await estimateFiatValue(config, { fetchImpl }) : {
    valuation_available: false,
    valuation_status: 'skipped',
    fiat_currency: config.fiatCurrency,
    note: 'USD valuation skipped by --no-valuation',
  };

  const result = {
    mode: options.send ? 'send' : 'dry-run',
    source_uid_check_status: uidValidation.uid_check_status,
    source_uid_matches_expected: uidValidation.uid_matches_expected,
    masked_target_uid: maskUid(config.targetUid),
    asset: config.asset,
    amount: config.amount,
    from_account: config.fromAccount,
    to_account: config.toAccount,
    endpoint_support: 'documented account-type transfer only',
    transfer_preview: transferPreview,
    valuation,
    warning: 'Official Binance POST /sapi/v1/asset/transfer documentation does not expose a recipient UID parameter; live UID-routed transfers stay blocked.',
  };

  for (const line of buildResultSummary(result)) logger.log(line);

  if (!options.send) return result;

  const confirmed = await confirmSend({
    asset: config.asset,
    amount: config.amount,
    fromAccount: config.fromAccount,
    toAccount: config.toAccount,
    targetUid: config.targetUid,
  });
  if (!confirmed) {
    throw new DailyDataError('confirmation_required', 'Live send cancelled because the confirmation prompt was not accepted');
  }

  throw new DailyDataError(
    'unsupported_target_uid',
    'Official Binance POST /sapi/v1/asset/transfer does not accept a target UID parameter; refusing live mutation instead of inventing unsupported behavior',
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runInternalTransfer().catch((err) => {
    const normalized = normalizeError(err);
    console.error(`${normalized.error_code}: ${normalized.error}`);
    process.exit(1);
  });
}
