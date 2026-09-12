import assert from 'node:assert/strict';

const originalEnv = { ...process.env };
const originalFetch = globalThis.fetch;
const originalNow = Date.now;

process.env.BINANCE_API_KEY = 'test-api-key-123';
process.env.BINANCE_SECRET_KEY = 'test-secret-key-456';
process.env.BINANCE_UID = '12345';
process.env.BINANCE_STOCKS = 'GOOGL';
process.env.BINANCE_STOCK_MAP = JSON.stringify({
  GOOGL: {
    chainId: '1',
    contractAddress: '0xabc',
    multiplier: '1',
  },
});
delete process.env.BINANCE_RECV_WINDOW;

const requests = [];

function jsonResponse(body) {
  return {
    ok: true,
    async json() {
      return body;
    },
  };
}

globalThis.fetch = async (url) => {
  const href = String(url);
  requests.push(href);

  if (href.endsWith('/api/v3/time')) {
    return jsonResponse({ serverTime: 20_000 });
  }

  if (href.startsWith('https://api.binance.com/api/v3/account?')) {
    const params = new URL(href).searchParams;
    assert.equal(params.get('timestamp'), '20000', 'signed request must use Binance server-time offset');
    assert.equal(params.get('recvWindow'), '5000', 'signed request must use the safe default recvWindow');
    assert.ok(params.get('signature'), 'signed request must include HMAC signature');
    return jsonResponse({
      uid: 12345,
      permissions: ['SPOT'],
      balances: [
        { asset: 'USDT', free: '12.5', locked: '0' },
        { asset: 'BTC', free: '0', locked: '0' },
      ],
    });
  }

  if (href.includes('/stock/detail/list/ai?type=1')) {
    return jsonResponse({
      data: [
        {
          ticker: 'GOOGL',
          symbol: 'GOOGLUSD',
          name: 'Alphabet',
          chainId: '1',
          contractAddress: '0xabc',
        },
      ],
    });
  }

  if (href.includes('/rwa/dynamic/ai?chainId=1&contractAddress=0xabc')) {
    return jsonResponse({
      data: {
        stockInfo: {
          price: '100',
          priceToEarnings: '20',
          dividendYield: '1.2',
          priceLow52w: '80',
          priceHigh52w: '120',
          marketCap: '1',
          sharesOutstanding: '2',
        },
        tokenInfo: {
          price: '100',
          priceChangePct24h: '1.5',
          totalHolders: 7,
          volume24h: '42',
        },
      },
    });
  }

  if (href.includes('/market/status/ai')) {
    return jsonResponse({ data: { openState: 'OPEN', reasonCode: 'REGULAR' } });
  }

  if (href.includes('/meta/ai?chainId=1&contractAddress=0xabc')) {
    return jsonResponse({ data: { dailyAttestationReports: '/images/web3-data/public/token/ondo/pdf/daily-2026-09-10.pdf' } });
  }

  if (href.endsWith('/api/v3/ticker/24hr')) {
    return jsonResponse([
      { symbol: 'BTCUSDT', priceChangePercent: '1.1' },
      { symbol: 'ETHUSDT', priceChangePercent: '-0.4' },
    ]);
  }

  throw new Error(`Unexpected fetch URL: ${href}`);
};

Date.now = () => 10_000;

try {
  const moduleUrl = `${new URL('./fetch-daily-data.mjs', import.meta.url).href}?test=${Date.now()}`;
  const { buildLogSummary, buildUidValidation, createSignedUrl, parseRecvWindow, runDailyReport } = await import(moduleUrl);

  assert.equal(parseRecvWindow(), 5000, 'default recvWindow should stay at 5000 ms');
  assert.throws(() => parseRecvWindow('99999'), /BINANCE_RECV_WINDOW/, 'unsafe recvWindow values must be rejected');
  assert.deepEqual(buildUidValidation(12345, '12345'), { uid_check_status: 'matched', uid_matches_expected: true });
  assert.deepEqual(buildUidValidation(12345, ''), { uid_check_status: 'not_configured', uid_matches_expected: null });
  assert.equal(buildUidValidation(12345, '99999').error_code, 'uid_mismatch');

  const sampleSignedUrl = createSignedUrl('/api/v3/account', {}, {
    baseUrl: 'https://api.binance.com',
    secret: 'demo-secret',
    nowMs: 100,
    clockOffsetMs: 25,
    recvWindow: 5000,
  });
  const sampleParams = new URL(sampleSignedUrl).searchParams;
  assert.equal(sampleParams.get('timestamp'), '125');
  assert.equal(sampleParams.get('recvWindow'), '5000');

  const payload = await runDailyReport({ writeOutput: false });
  assert.equal(payload.binance_identity.binance_id, 12345);
  assert.equal(payload.binance_identity.uid_matches_expected, true);
  assert.equal(payload.binance_identity.uid_check_status, 'matched');
  assert.equal(payload.binance_identity.hmac_verified, true);
  assert.equal(payload.summary.uid_validation, 'matched');
  assert.equal(payload.balances.non_zero, 1);
  assert.equal(requests.filter((href) => href.endsWith('/api/v3/time')).length, 1, 'server time should be fetched once before signed requests');

  const serialized = JSON.stringify(payload);
  assert.ok(!serialized.includes(process.env.BINANCE_API_KEY), 'serialized report must not leak API key');
  assert.ok(!serialized.includes(process.env.BINANCE_SECRET_KEY), 'serialized report must not leak secret key');

  const logSummary = buildLogSummary(payload, { outFile: 'data/binance-daily.data', bytes: 123 }).join('\n');
  assert.ok(!logSummary.includes(process.env.BINANCE_API_KEY), 'logs must not leak API key');
  assert.ok(!logSummary.includes(process.env.BINANCE_SECRET_KEY), 'logs must not leak secret key');
  assert.ok(!logSummary.includes('12345'), 'logs must not print the raw Binance UID');

  console.log('binance-daily:test passed — signed timestamp offset, UID validation, and credential-safe output/logs verified.');
} finally {
  globalThis.fetch = originalFetch;
  Date.now = originalNow;
  for (const key of Object.keys(process.env)) {
    if (!(key in originalEnv)) delete process.env[key];
  }
  Object.assign(process.env, originalEnv);
}
