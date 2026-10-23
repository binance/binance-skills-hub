import assert from 'node:assert/strict';

const originalEnv = { ...process.env };
const originalFetch = globalThis.fetch;

function jsonResponse(body) {
  return {
    ok: true,
    async json() {
      return body;
    },
  };
}

function errorResponse(status, body) {
  return {
    ok: false,
    status,
    async text() {
      return body;
    },
  };
}

Object.assign(process.env, {
  BINANCE_API_KEY: 'test-api-key-123',
  BINANCE_SECRET_KEY: 'test-secret-key-456',
  BINANCE_UID: '12345',
  BINANCE_TARGET_UID: '987654321',
  BINANCE_TRANSFER_ASSET: 'USDT',
  BINANCE_TRANSFER_AMOUNT: '10.25',
  BINANCE_TRANSFER_FROM_ACCOUNT: 'MAIN',
  BINANCE_TRANSFER_TO_ACCOUNT: 'FUNDING',
  BINANCE_FIAT_CURRENCY: 'USD',
  BINANCE_RECV_WINDOW: '5000',
  BINANCE_BASE_URL: 'https://api.binance.com',
  PUBLIC_MIRROR_URL: 'https://data-api.binance.vision',
});

const requests = [];

globalThis.fetch = async (url, opts = {}) => {
  const href = String(url);
  requests.push({ href, opts });

  if (href === 'https://api.binance.com/api/v3/time') {
    return jsonResponse({ serverTime: 20_000 });
  }

  if (href.startsWith('https://api.binance.com/api/v3/account?')) {
    const params = new URL(href).searchParams;
    assert.equal(params.get('timestamp'), '20000', 'account identity request must use Binance server-time offset');
    assert.equal(params.get('recvWindow'), '5000', 'account identity request must use validated recvWindow');
    assert.ok(params.get('signature'), 'account identity request must be signed');
    assert.equal(opts.headers['X-MBX-APIKEY'], 'test-api-key-123');
    return jsonResponse({
      uid: '12345',
      balances: [],
      permissions: ['SPOT'],
    });
  }

  if (href === 'https://api.binance.com/api/v3/ticker/price?symbol=USDTUSD') {
    return errorResponse(400, '{"code":-1121,"msg":"Invalid symbol."}');
  }

  if (href === 'https://api.binance.com/api/v3/ticker/price?symbol=USDTUSDC') {
    return jsonResponse({ symbol: 'USDTUSDC', price: '1.00050000' });
  }

  throw new Error(`Unexpected fetch URL: ${href}`);
};

try {
  const moduleUrl = `${new URL('../skills/binance/internal-transfer/scripts/internal-transfer.mjs', import.meta.url).href}?test=${Date.now()}`;
  const {
    buildTransferRequestPreview,
    estimateFiatValue,
    maskUid,
    resolveTransferConfig,
    runInternalTransfer,
    validateAmount,
    validateAsset,
    validateUid,
  } = await import(moduleUrl);

  assert.equal(validateUid('123456', 'target'), '123456');
  assert.throws(() => validateUid('abc', 'target'), /numeric string/);
  assert.equal(validateAsset('usdt'), 'USDT');
  assert.throws(() => validateAsset('usdt*'), /uppercase alphanumeric/);
  assert.equal(validateAmount('1.23456789'), '1.23456789');
  assert.throws(() => validateAmount('0'), /greater than zero/);
  assert.throws(() => validateAmount('1.123456789'), /up to 8 decimal places/);
  assert.equal(maskUid('987654321'), '98*****21');

  const config = resolveTransferConfig(process.env);
  const preview = buildTransferRequestPreview(config, { clockOffsetMs: 10_000 }, { now: () => 10_000 });
  assert.equal(preview.endpoint, '/sapi/v1/asset/transfer');
  assert.equal(preview.query.timestamp, '20000');
  assert.equal(preview.query.recvWindow, '5000');
  assert.equal(preview.query.signature, '[redacted]');
  assert.ok(!preview.redacted_path_and_query.includes('test-secret-key-456'));

  const valuation = await estimateFiatValue(config, { fetchImpl: globalThis.fetch });
  assert.equal(valuation.valuation_available, true);
  assert.equal(valuation.market_symbol, 'USDTUSDC');
  assert.equal(valuation.estimated_value, '10.25512500');

  const logs = [];
  const dryRunResult = await runInternalTransfer({
    argv: [],
    env: process.env,
    fetchImpl: globalThis.fetch,
    now: () => 10_000,
    logger: { log: (line) => logs.push(line) },
  });

  assert.equal(dryRunResult.mode, 'dry-run');
  assert.equal(dryRunResult.source_uid_check_status, 'matched');
  assert.ok(logs.some((line) => line.includes('target_uid: 98*****21')));
  assert.ok(logs.some((line) => line.includes('estimated_usd: 10.25512500 via USDTUSDC')));
  assert.ok(!logs.join('\n').includes('987654321'), 'logs must not print the full target UID');
  assert.ok(!logs.join('\n').includes('test-api-key-123'), 'logs must not leak API key');
  assert.ok(!logs.join('\n').includes('test-secret-key-456'), 'logs must not leak secret key');
  assert.ok(!logs.join('\n').match(/[a-f0-9]{64}/i), 'logs must not print the raw signature');
  assert.equal(requests.filter((request) => request.href.includes('/sapi/v1/asset/transfer')).length, 0, 'dry-run must not call the live transfer endpoint');

  let prompted = 0;
  await assert.rejects(
    runInternalTransfer({
      argv: ['--send'],
      env: process.env,
      fetchImpl: globalThis.fetch,
      now: () => 10_000,
      logger: { log() {} },
      confirmSend: async (details) => {
        prompted += 1;
        assert.equal(details.targetUid, '987654321');
        assert.equal(details.asset, 'USDT');
        assert.equal(details.amount, '10.25');
        assert.equal(details.fromAccount, 'MAIN');
        assert.equal(details.toAccount, 'FUNDING');
        return false;
      },
    }),
    /confirmation prompt was not accepted/,
  );
  assert.equal(prompted, 1, 'send mode must require interactive confirmation');
  assert.equal(requests.filter((request) => request.href.includes('/sapi/v1/asset/transfer')).length, 0, 'confirmation rejection must prevent live transfer calls');
  await assert.rejects(
    runInternalTransfer({
      argv: ['--send'],
      env: process.env,
      fetchImpl: globalThis.fetch,
      now: () => 10_000,
      logger: { log() {} },
      confirmSend: async () => true,
    }),
    /does not accept a target UID parameter/,
  );
  assert.equal(requests.filter((request) => request.href.includes('/sapi/v1/asset/transfer')).length, 0, 'unsupported UID routing must stay non-mutating');

  console.log('binance-internal-transfer:test passed — signing, validation, dry-run safety, confirmation gating, redaction, and USD valuation verified.');
} finally {
  globalThis.fetch = originalFetch;
  for (const key of Object.keys(process.env)) {
    if (!(key in originalEnv)) delete process.env[key];
  }
  Object.assign(process.env, originalEnv);
}
