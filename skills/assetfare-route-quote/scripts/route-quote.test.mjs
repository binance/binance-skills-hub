import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

import {
  CONTRACT_COUNTS,
  CONTRACT_SHA256,
  LIMITS,
  buildRouteContract,
  getCapabilities,
  getQuote,
  parseJsonLossless,
  parseCli,
  validateCapabilities,
  validateQuote,
} from './route-quote.mjs'

const CONTRACT = buildRouteContract()
const ENDPOINTS = [
  ['solana', 'SOL'], ['solana', 'USDC'], ['solana', 'USDG'],
  ['base', 'ETH'], ['base', 'USDC'],
  ['arbitrum', 'ETH'], ['arbitrum', 'USDC'],
  ['robinhood', 'ETH'], ['robinhood', 'USDG'],
  ['polygon', 'USDC'], ['optimism', 'USDC'],
]

function capabilities(overrides = {}) {
  return {
    amount_usd: { maximum: null, minimum: 1, policy: 'no_business_maximum' },
    asset_endpoints: ENDPOINTS.map(([chain, token]) => ({ chain, token })),
    chains: ['arbitrum', 'base', 'optimism', 'polygon', 'robinhood', 'solana'],
    direct_route_summary: {
      assetfare_fee_step_bound: true,
      base_unit_amounts_are_decimal_strings: true,
      classification_values: ['direct_protocol_only', 'external_intent'],
      external_intent: 'Across only for Robinhood ingress; provider-internal liquidity sourcing or aggregation remains possible',
      normalized_chain_asset_endpoints: true,
      ordered_provider_path: true,
      required_on_every_quote: true,
      route_aggregator_used_scope: 'assetfare_engine_only',
      route_count: 76,
      server_signing: false,
      server_submission: false,
      step_count: 168,
      version: 'assetfare-direct-route-summary-v1',
    },
    directed_conversion_routes: 76,
    evaluation_guidance: {
      always_compare_fresh_at_intended_amount: true,
      native_usdc_economic_evaluation_start_usd: 50,
      not_a_minimum: true,
      not_guaranteed_best: true,
      reachability_smoke_scope: 'connectivity_only_not_economic_evaluation',
      reachability_smoke_usd: 1,
      representative_economic_evaluation_usd: 1000,
    },
    execution_ready_routes: 76,
    fee_policy: {
      exact_bps: 1,
      minimum_bps: 1,
      maximum_bps: 1,
      zero_fee_routes_exist: false,
      fee_maximum_stable_base: null,
      provider_and_network_fees_additional: true,
    },
    public_api_enabled: true,
    route_aggregator_used: false,
    server_signing: false,
    server_submission: false,
    status: 'capped_public_agent_release',
    unsigned_route_plans_ready: 76,
    version: 'assetfare-multichain-api-v2',
    ...overrides,
  }
}

function rawStep(planned, expectedInput, minimumInput, expectedOutput, minimumOutput) {
  const [fromChain, fromAsset] = planned.from.split(':')
  const [toChain, toAsset] = planned.to.split(':')
  const common = {
    index: planned.index,
    expected_input_base: expectedInput,
    floor_input_base: minimumInput,
    expected_output_base: expectedOutput,
    minimum_output_base: minimumOutput,
    expected_evidence: {
      status: 'pass',
      aggregatorApiUsed: false,
      signed: false,
      submitted: false,
    },
    floor_evidence: null,
  }
  if (planned.action === 'swap') {
    return {
      kind: 'direct_swap',
      chain: fromChain,
      provider: planned.provider,
      from: fromAsset,
      to: toAsset,
      route_fee_bps: planned.assetfare_fee_bps,
      ...common,
    }
  }
  if (planned.provider === 'across_intent_bridge') {
    return {
      kind: 'direct_bridge',
      provider: planned.provider,
      from: fromChain,
      to: toChain,
      from_asset: fromAsset,
      to_asset: toAsset,
      external_intent_protocol: true,
      route_fee_bps: planned.assetfare_fee_bps,
      ...common,
    }
  }
  const sourceOnly = planned.provider === 'circle_cctp' && ['polygon', 'optimism'].includes(fromChain)
  return {
    kind: 'direct_bridge',
    provider: planned.provider,
    from: fromChain,
    to: toChain,
    asset: fromAsset,
    ...(sourceOnly ? {
      cctp_mode: 'no_forward',
      finality_threshold: 2000,
      destination_native_gas_required: true,
      economics_informational_only: true,
    } : {}),
    route_fee_bps: planned.assetfare_fee_bps,
    ...common,
  }
}

function quote(request) {
  const routeName = `${request.from_chain}:${request.from_token}->${request.to_chain}:${request.to_token}`
  const definition = CONTRACT.routes[routeName]
  assert.ok(definition, `missing fixture route ${routeName}`)
  const summarySteps = []
  const rawSteps = []
  let expectedInput = 1_000_000
  let minimumInput = 1_000_000
  for (const planned of definition.steps) {
    const expectedOutput = expectedInput - 1_000
    const minimumOutput = minimumInput - 2_000
    rawSteps.push(rawStep(planned, expectedInput, minimumInput, expectedOutput, minimumOutput))
    summarySteps.push({
      index: planned.index,
      action: planned.action,
      provider: planned.provider,
      from: planned.from,
      to: planned.to,
      expected_input_base: String(expectedInput),
      minimum_input_base: String(minimumInput),
      expected_output_base: String(expectedOutput),
      minimum_output_base: String(minimumOutput),
      assetfare_fee_bps: planned.assetfare_fee_bps,
      direct_protocol: planned.direct_protocol,
      external_intent_protocol: planned.external_intent_protocol,
      aggregator_api_used: false,
    })
    expectedInput = expectedOutput
    minimumInput = minimumOutput
  }
  const external = definition.classification === 'external_intent'
  const feeIndex = definition.steps.findIndex((item) => item.assetfare_fee_bps === 1)
  const expectedReceiveUsd = request.amount_usd - 0.1
  const minimumReceiveUsd = request.amount_usd - 0.2
  const expectedCostUsd = request.amount_usd - expectedReceiveUsd
  const maximumCostUsd = request.amount_usd - minimumReceiveUsd
  const smallAmountWarning = request.amount_usd < 50
  return {
    quote_id: '00000000-0000-4000-8000-000000000001',
    status: 'capped_public_agent_release',
    version: 'assetfare-direct-multichain-api-quote-v2',
    as_of: new Date().toISOString(),
    ttl_seconds: 60,
    intent: {
      from: `${request.from_chain}:${request.from_token}`,
      to: `${request.to_chain}:${request.to_token}`,
      amount_usd: request.amount_usd,
      estimated_input_base: 1_000_000,
    },
    offer: {
      expected_receive_amount: 999_900,
      estimated_min_receive_amount: 999_000,
      expected_receive_usd: expectedReceiveUsd,
      estimated_min_receive_usd: minimumReceiveUsd,
      output_symbol: request.to_token,
      estimated_time_seconds: 30,
      assetfare_fee_bps: 1,
      fee_modeled_bps: 1,
      fee_collectible_now: true,
      fee_collection_steps: [feeIndex],
    },
    cost_summary: {
      scope: 'token_path_only_network_gas_excluded',
      input_value_usd: request.amount_usd,
      expected_receive_value_usd: expectedReceiveUsd,
      minimum_receive_value_usd: minimumReceiveUsd,
      expected_total_cost_usd: expectedCostUsd,
      maximum_total_cost_usd: maximumCostUsd,
      expected_total_cost_percent: expectedCostUsd / request.amount_usd * 100,
      maximum_total_cost_percent: maximumCostUsd / request.amount_usd * 100,
      assetfare_service_fee: {
        bps: 1,
        estimated_usd: request.amount_usd / 10_000,
        included_in_receive_amount: true,
        note: 'AssetFare service fee only; not total cost',
      },
      provider_fee_components: [],
      unpriced_costs: ['source_chain_network_fee'],
      rankable_all_in: false,
      small_amount_warning: smallAmountWarning,
      warning: smallAmountWarning ? 'connectivity-only amount' : null,
    },
    route: {
      status: 'pass',
      version: 'assetfare-direct-multichain-quote-v2',
      route: routeName,
      mode: definition.mode,
      input_base: 1_000_000,
      expected_output_base: expectedInput,
      minimum_output_base: minimumInput,
      steps: rawSteps,
      quote_latency_ms: 1,
      aggregator_api_used: false,
      external_intent_protocol_used: external,
      server_signing: false,
      server_submission: false,
    },
    direct_route_summary: {
      version: 'assetfare-direct-route-summary-v1',
      route: routeName,
      from: `${request.from_chain}:${request.from_token}`,
      to: `${request.to_chain}:${request.to_token}`,
      classification: definition.classification,
      mode: definition.mode,
      route_aggregator_used: false,
      external_intent_protocol_used: external,
      provider_internal_dex_aggregation_possible: external,
      assetfare_fee_bps: 1,
      fee_collection_step_index: feeIndex,
      server_signing: false,
      server_submission: false,
      step_count: summarySteps.length,
      steps: summarySteps,
    },
    risk: {
      external_intent_protocol_used: external,
      provider_internal_dex_aggregation_possible: external,
      server_signing: false,
      server_submission: false,
    },
    caller_action_plan_handoff: { not_returned_by_skill: true },
  }
}

function mockFetchFor(request, quoteOverride) {
  const calls = []
  const fetch = async (url, init = {}) => {
    calls.push({ url: String(url), init })
    if (String(url).endsWith('/v2/capabilities')) return Response.json(capabilities())
    if (String(url).endsWith('/v2/quote')) {
      const posted = JSON.parse(init.body)
      assert.deepEqual(posted, request)
      return Response.json(quoteOverride ?? quote(request))
    }
    throw new Error('unexpected URL')
  }
  return { calls, fetch }
}

test('contract reproduces all 76 routes and 168 ordered provider steps', () => {
  assert.deepEqual(CONTRACT_COUNTS, { routes: 76, steps: 168 })
  assert.equal(CONTRACT_SHA256, '3f6f64f66b6973f3da6ff53d1974c7b0cf725b0bc6bcc4554f0bfa5b55e7cff1')
  assert.equal(CONTRACT.version, 'assetfare-direct-route-contract-v1')
  assert.equal(Object.values(CONTRACT.routes).filter((item) => item.classification === 'external_intent').length, 14)
})

test('lossless parser preserves unsafe integers and rejects duplicate keys', () => {
  const value = parseJsonLossless('{"safe":9007199254740991,"unsafe":9007199254740993,"decimal":1.5}')
  assert.equal(value.safe, 9_007_199_254_740_991)
  assert.equal(value.unsafe, 9_007_199_254_740_993n)
  assert.equal(value.decimal, 1.5)
  assert.throws(() => parseJsonLossless('{"same":1,"same":2}'), /assetfare_response_invalid/)
  assert.throws(() => parseJsonLossless('{"bad":01}'), /assetfare_response_invalid/)
  assert.throws(() => parseJsonLossless(`{"too_large":${'9'.repeat(129)}}`), /assetfare_response_invalid/)
})

test('runtime source contains only capabilities and quote API paths', () => {
  const source = readFileSync(new URL('./route-quote.mjs', import.meta.url), 'utf8')
  assert.deepEqual([...source.matchAll(/\/v2\/[a-z-]+/g)].map((match) => match[0]).sort(), ['/v2/capabilities', '/v2/quote'])
  assert.doesNotMatch(source, /process\.env|authorization\s*:/i)
  assert.doesNotMatch(source, /\/v2\/(?:auth|prepare|session|action|submit)/i)
})

test('CLI accepts representative USD 1000 and connectivity-only USD 1 without defaults', () => {
  assert.deepEqual(parseCli(['capabilities']), { command: 'capabilities' })
  const representative = parseCli(['quote', '--from-chain', 'Solana', '--from-token', 'usdc', '--to-chain', 'BASE', '--to-token', 'usdc', '--amount-usd', '1000'])
  assert.equal(representative.request.amount_usd, 1000)
  const smoke = parseCli(['quote', '--from-chain', 'solana', '--from-token', 'USDC', '--to-chain', 'base', '--to-token', 'USDC', '--amount-usd', '1'])
  assert.equal(smoke.request.amount_usd, 1)
  for (const invalid of [
    [],
    ['quote', '--from-chain', 'solana', '--from-token', 'USDC', '--to-chain', 'base', '--to-token', 'USDC'],
    ['quote', '--from-chain', 'solana', '--from-token', 'USDC', '--to-chain', 'base', '--to-token', 'USDC', '--amount-usd', '0.99'],
    ['quote', '--from-chain', 'solana', '--from-token', 'USDC', '--to-chain', 'base', '--to-token', 'USDC', '--amount-usd', '1e3'],
    ['quote', '--from-chain', 'base', '--from-token', 'SOL', '--to-chain', 'solana', '--to-token', 'USDC', '--amount-usd', '1000'],
    ['quote', '--from-chain', 'solana', '--from-token', 'USDC', '--to-chain', 'base', '--to-token', 'USDC', '--amount-usd', '1000', '--wallet', 'forbidden'],
  ]) assert.throws(() => parseCli(invalid), /assetfare_request_invalid/)
})

test('capabilities validation requires 2.3 route summary contract and evaluation guidance', async () => {
  const output = validateCapabilities(capabilities())
  assert.equal(output.directed_conversion_routes, 76)
  assert.equal(output.direct_route_summary.step_count, 168)
  assert.equal(output.evaluation_guidance.representative_economic_evaluation_usd, 1000)
  assert.equal(output.evaluation_guidance.reachability_smoke_usd, 1)
  assert.deepEqual(Object.keys(output.amount_usd).sort(), ['maximum', 'minimum', 'policy'])
  assert.equal(Object.hasOwn(output, 'unexpected'), false)
  for (const hostile of [
    capabilities({ server_submission: true }),
    capabilities({ directed_conversion_routes: 75 }),
    capabilities({ asset_endpoints: ENDPOINTS.slice(0, -1).map(([chain, token]) => ({ chain, token })) }),
    capabilities({ direct_route_summary: { ...capabilities().direct_route_summary, step_count: 167 } }),
    capabilities({ direct_route_summary: { ...capabilities().direct_route_summary, external_intent: 'always direct' } }),
    capabilities({ evaluation_guidance: { ...capabilities().evaluation_guidance, not_guaranteed_best: false } }),
    capabilities({ fee_policy: { ...capabilities().fee_policy, exact_bps: 2 } }),
    capabilities({ amount_usd: { maximum: 1000, minimum: 1, policy: 'capped' } }),
  ]) assert.throws(() => validateCapabilities(hostile), /assetfare_capabilities_invalid|assetfare_response_unsafe/)
  const fetch = async () => Response.json(capabilities())
  assert.equal((await getCapabilities(fetch)).server_submission, false)
})

test('quote performs one GET then one exact five-field POST with no auth or wallet data', async () => {
  const request = { from_chain: 'solana', from_token: 'USDC', to_chain: 'base', to_token: 'USDC', amount_usd: 1000 }
  const mocked = mockFetchFor(request)
  const output = await getQuote(request, mocked.fetch)
  assert.equal(mocked.calls.length, 2)
  assert.equal(mocked.calls[0].url, 'https://api.assetfare.dev/v2/capabilities')
  assert.equal(mocked.calls[0].init.method, 'GET')
  assert.equal(mocked.calls[1].url, 'https://api.assetfare.dev/v2/quote')
  assert.equal(mocked.calls[1].init.method, 'POST')
  assert.deepEqual(Object.keys(JSON.parse(mocked.calls[1].init.body)).sort(), ['amount_usd', 'from_chain', 'from_token', 'to_chain', 'to_token'])
  for (const call of mocked.calls) {
    assert.equal(call.init.redirect, 'error')
    assert.equal(call.init.headers.authorization, undefined)
    assert.equal(call.init.headers['x-assetfare-channel'], 'binance-skills-hub')
  }
  assert.equal(output.direct_route_summary.steps[0].provider, 'circle_cctp')
  assert.equal(output.execution_boundary.quote_only, true)
  assert.equal(output.execution_boundary.wallet_data_sent, false)
  assert.equal(output.execution_boundary.action_prepared, false)
  assert.equal(output.execution_boundary.server_signing, false)
  assert.equal(output.execution_boundary.server_submission, false)
  assert.equal(Object.hasOwn(output, 'caller_action_plan_handoff'), false)
  assert.equal(Object.hasOwn(output, 'route'), false)
})

test('exported quote client rejects any sixth field before capabilities or quote fetch', async () => {
  const calls = []
  const fetch = async (...args) => { calls.push(args); throw new Error('must not fetch') }
  await assert.rejects(getQuote({
    from_chain: 'solana',
    from_token: 'USDC',
    to_chain: 'base',
    to_token: 'USDC',
    amount_usd: 1000,
    wallet_address: 'forbidden',
  }, fetch), /assetfare_request_invalid/)
  assert.equal(calls.length, 0)
})

test('USD 1 remains a connectivity-only quote and is never promoted as economic evidence', async () => {
  const request = { from_chain: 'solana', from_token: 'USDC', to_chain: 'base', to_token: 'USDC', amount_usd: 1 }
  const mocked = mockFetchFor(request)
  const output = await getQuote(request, mocked.fetch)
  assert.equal(output.intent.amount_usd, 1)
  assert.equal(output.cost_summary.small_amount_warning, true)
  assert.equal(output.comparison_guidance.not_guaranteed_best, true)
  const hostile = quote(request)
  hostile.cost_summary.small_amount_warning = false
  hostile.cost_summary.warning = null
  assert.throws(() => validateQuote(hostile, request), /assetfare_quote_cost_invalid/)
})

test('lossless transport validates live-compatible ETH wei above Number.MAX_SAFE_INTEGER', async () => {
  const request = { from_chain: 'base', from_token: 'ETH', to_chain: 'arbitrum', to_token: 'USDC', amount_usd: 1000 }
  let body = JSON.stringify(quote(request))
  body = body.replaceAll(':1000000', ':9007199254740993').replaceAll(':"1000000"', ':"9007199254740993"')
  const calls = []
  const fetch = async (url, init = {}) => {
    calls.push(String(url))
    if (String(url).endsWith('/v2/capabilities')) return Response.json(capabilities())
    return new Response(body, { status: 200, headers: { 'content-type': 'application/json' } })
  }
  const output = await getQuote(request, fetch)
  assert.equal(output.direct_route_summary.steps[0].expected_input_base, '9007199254740993')
  assert.deepEqual(calls, ['https://api.assetfare.dev/v2/capabilities', 'https://api.assetfare.dev/v2/quote'])
})

test('all 76 planner routes validate with exact topology and amount continuity', () => {
  let routeCount = 0
  let stepCount = 0
  for (const routeName of Object.keys(CONTRACT.routes)) {
    const [from, to] = routeName.split('->')
    const [from_chain, from_token] = from.split(':')
    const [to_chain, to_token] = to.split(':')
    const request = { from_chain, from_token, to_chain, to_token, amount_usd: 1000 }
    const output = validateQuote(quote(request), request)
    assert.equal(output.direct_route_summary.route, routeName)
    routeCount += 1
    stepCount += output.direct_route_summary.step_count
  }
  assert.equal(routeCount, 76)
  assert.equal(stepCount, 168)
})

test('Across ingress is explicit external intent, never a direct-only route', () => {
  const request = { from_chain: 'base', from_token: 'USDC', to_chain: 'robinhood', to_token: 'USDG', amount_usd: 1000 }
  const output = validateQuote(quote(request), request)
  assert.equal(output.direct_route_summary.classification, 'external_intent')
  assert.equal(output.direct_route_summary.external_intent_protocol_used, true)
  assert.equal(output.direct_route_summary.provider_internal_dex_aggregation_possible, true)
  assert.equal(output.direct_route_summary.route_aggregator_used, false)
})

test('direct route summary and duplicate raw route fail closed under hostile mutations', () => {
  const directRequest = { from_chain: 'solana', from_token: 'SOL', to_chain: 'base', to_token: 'ETH', amount_usd: 1000 }
  const acrossRequest = { from_chain: 'base', from_token: 'USDC', to_chain: 'robinhood', to_token: 'USDG', amount_usd: 1000 }
  const hostiles = []
  {
    const value = quote(directRequest); delete value.direct_route_summary; hostiles.push([value, directRequest])
  }
  {
    const value = quote(directRequest); value.direct_route_summary.extra = true; hostiles.push([value, directRequest])
  }
  {
    const value = quote(directRequest); value.direct_route_summary.steps[0].provider = 'uniswap_v3'; hostiles.push([value, directRequest])
  }
  {
    const value = quote(directRequest); value.direct_route_summary.steps[1].expected_input_base = '777'; hostiles.push([value, directRequest])
  }
  {
    const value = quote(directRequest); value.direct_route_summary.steps[1].minimum_output_base = value.direct_route_summary.steps[1].expected_output_base + '0'; hostiles.push([value, directRequest])
  }
  {
    const value = quote(directRequest); value.direct_route_summary.fee_collection_step_index = 0; hostiles.push([value, directRequest])
  }
  {
    const value = quote(directRequest)
    value.direct_route_summary.steps[0].assetfare_fee_bps = 1
    value.direct_route_summary.steps[1].assetfare_fee_bps = 0
    value.direct_route_summary.fee_collection_step_index = 0
    value.route.steps[0].route_fee_bps = 1
    value.route.steps[1].route_fee_bps = 0
    value.offer.fee_collection_steps = [0]
    hostiles.push([value, directRequest])
  }
  {
    const value = quote(directRequest); value.direct_route_summary.steps[0].aggregator_api_used = true; hostiles.push([value, directRequest])
  }
  {
    const value = quote(directRequest); value.direct_route_summary.server_signing = true; hostiles.push([value, directRequest])
  }
  {
    const value = quote(directRequest); value.risk.server_submission = true; hostiles.push([value, directRequest])
  }
  {
    const value = quote(directRequest); value.route.extra = 'forbidden'; hostiles.push([value, directRequest])
  }
  {
    const value = quote(directRequest); value.intent.estimated_input_base += 1; hostiles.push([value, directRequest])
  }
  {
    const value = quote(directRequest); value.route.expected_output_base += 1; hostiles.push([value, directRequest])
  }
  {
    const value = quote(directRequest)
    value.intent.estimated_input_base = 9_007_199_254_740_992
    value.route.input_base = 9_007_199_254_740_992
    value.route.steps[0].expected_input_base = 9_007_199_254_740_992
    value.route.steps[0].floor_input_base = 9_007_199_254_740_992
    value.direct_route_summary.steps[0].expected_input_base = '9007199254740993'
    value.direct_route_summary.steps[0].minimum_input_base = '9007199254740993'
    hostiles.push([value, directRequest])
  }
  {
    const value = quote(directRequest); value.route.steps[0].expected_evidence.aggregatorApiUsed = true; hostiles.push([value, directRequest])
  }
  {
    const value = quote(directRequest); delete value.route.steps[0].expected_evidence.status; hostiles.push([value, directRequest])
  }
  {
    const value = quote(directRequest); delete value.route.steps[0].expected_evidence.signed; hostiles.push([value, directRequest])
  }
  {
    const value = quote(directRequest); delete value.route.steps[0].expected_evidence.submitted; hostiles.push([value, directRequest])
  }
  {
    const value = quote(directRequest); value.route.steps[0].private_key = 'forbidden'; hostiles.push([value, directRequest])
  }
  {
    const value = quote(directRequest); value.route.steps[0].signed = true; hostiles.push([value, directRequest])
  }
  {
    const value = quote(acrossRequest)
    value.direct_route_summary.classification = 'direct_protocol_only'
    value.direct_route_summary.external_intent_protocol_used = false
    value.direct_route_summary.provider_internal_dex_aggregation_possible = false
    hostiles.push([value, acrossRequest])
  }
  {
    const value = quote(directRequest); value.cost_summary.rankable_all_in = true; hostiles.push([value, directRequest])
  }
  {
    const value = quote(directRequest); value.as_of = '2000-01-01T00:00:00Z'; hostiles.push([value, directRequest])
  }
  {
    const value = quote(directRequest); value.as_of = '2099-01-01T00:00:00Z'; hostiles.push([value, directRequest])
  }
  {
    const value = quote(directRequest)
    value.cost_summary.provider_fee_components = [{
      provider: 'circle', kind: 'fee', expected_usd: 0.01, maximum_usd: 0.02,
      included_in_receive_amount: true, extra: 'forbidden',
    }]
    hostiles.push([value, directRequest])
  }
  {
    const value = quote(directRequest)
    value.intent.estimated_input_base = 9_007_199_254_740_992n
    value.route.input_base = 9_007_199_254_740_992n
    value.route.steps[0].expected_input_base = 9_007_199_254_740_992n
    value.route.steps[0].floor_input_base = 9_007_199_254_740_992n
    value.direct_route_summary.steps[0].expected_input_base = '9007199254740993'
    value.direct_route_summary.steps[0].minimum_input_base = '9007199254740993'
    hostiles.push([value, directRequest])
  }
  for (const [value, request] of hostiles) assert.throws(() => validateQuote(value, request), /assetfare_/)
})

test('transport rejects declared/streamed oversize, chunk floods, malformed UTF-8/JSON, timeout, and upstream details', async () => {
  const streamedOversize = () => new Response(new ReadableStream({
    start(controller) {
      controller.enqueue(new Uint8Array(LIMITS.max_response_bytes + 1))
      controller.close()
    },
  }), { status: 200, headers: { 'content-type': 'application/json' } })
  const chunkFlood = () => new Response(new ReadableStream({
    start(controller) {
      for (let index = 0; index <= LIMITS.max_response_chunks; index += 1) controller.enqueue(new Uint8Array([0x20]))
      controller.close()
    },
  }), { status: 200, headers: { 'content-type': 'application/json' } })
  const badResponses = [
    async () => new Response('<secret>', { status: 200, headers: { 'content-type': 'text/html' } }),
    async () => new Response('{}', { status: 200, headers: { 'content-type': 'application/json', 'content-length': String(LIMITS.max_response_bytes + 1) } }),
    async () => streamedOversize(),
    async () => chunkFlood(),
    async () => new Response(new Uint8Array([0xff]), { status: 200, headers: { 'content-type': 'application/json' } }),
    async () => new Response('{"broken":', { status: 200, headers: { 'content-type': 'application/json' } }),
    async () => Response.json({ detail: 'secret upstream detail' }, { status: 502 }),
    async () => { throw new Error('secret network detail') },
  ]
  for (const fetch of badResponses) {
    await assert.rejects(getCapabilities(fetch), (error) => {
      assert.match(error.message, /^assetfare_(?:response_invalid|upstream_unavailable)$/)
      assert.doesNotMatch(error.message, /secret/i)
      return true
    })
  }
  const timeoutFetch = async (_url, init) => new Promise((resolve, reject) => {
    init.signal.addEventListener('abort', () => reject(new Error('secret timeout detail')), { once: true })
  })
  await assert.rejects(getCapabilities(timeoutFetch, 5), (error) => {
    assert.equal(error.message, 'assetfare_upstream_unavailable')
    return true
  })
})
