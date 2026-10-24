#!/usr/bin/env node

import { createHash } from 'node:crypto'

const API_ORIGIN = 'https://api.assetfare.dev'
const CAPABILITIES_URL = `${API_ORIGIN}/v2/capabilities`
const QUOTE_URL = `${API_ORIGIN}/v2/quote`
const CLIENT_VERSION = '0.1.0'
const TIMEOUT_MS = 45_000
const MAX_RESPONSE_BYTES = 1_048_576
const MAX_RESPONSE_CHUNKS = 16_384

const ENDPOINTS = Object.freeze([
  ['solana', 'SOL'],
  ['solana', 'USDC'],
  ['solana', 'USDG'],
  ['base', 'ETH'],
  ['base', 'USDC'],
  ['arbitrum', 'ETH'],
  ['arbitrum', 'USDC'],
  ['robinhood', 'ETH'],
  ['robinhood', 'USDG'],
  ['polygon', 'USDC'],
  ['optimism', 'USDC'],
])
const DESTINATION_ENDPOINTS = ENDPOINTS.filter(([chain]) => !['polygon', 'optimism'].includes(chain))
const ENDPOINT_SET = new Set(ENDPOINTS.map(([chain, token]) => `${chain}:${token}`))
const DESTINATION_SET = new Set(DESTINATION_ENDPOINTS.map(([chain, token]) => `${chain}:${token}`))
const SOURCE_ONLY_ROUTES = new Set([
  'optimism:USDC->arbitrum:USDC',
  'optimism:USDC->base:USDC',
  'polygon:USDC->arbitrum:USDC',
  'polygon:USDC->base:USDC',
])

const SUMMARY_KEYS = Object.freeze([
  'version', 'route', 'from', 'to', 'classification', 'mode',
  'route_aggregator_used', 'external_intent_protocol_used',
  'provider_internal_dex_aggregation_possible', 'assetfare_fee_bps',
  'fee_collection_step_index', 'server_signing', 'server_submission',
  'step_count', 'steps',
])
const SUMMARY_STEP_KEYS = Object.freeze([
  'index', 'action', 'provider', 'from', 'to', 'expected_input_base',
  'minimum_input_base', 'expected_output_base', 'minimum_output_base',
  'assetfare_fee_bps', 'direct_protocol', 'external_intent_protocol',
  'aggregator_api_used',
])
const ROUTE_KEYS = Object.freeze([
  'status', 'version', 'route', 'mode', 'input_base', 'expected_output_base',
  'minimum_output_base', 'steps', 'quote_latency_ms', 'aggregator_api_used',
  'external_intent_protocol_used', 'server_signing', 'server_submission',
])
const RAW_STEP_SUFFIX = Object.freeze([
  'index', 'expected_input_base', 'floor_input_base', 'expected_output_base',
  'minimum_output_base', 'expected_evidence', 'floor_evidence',
])
const SWAP_PROVIDERS = new Set(['raydium_clmm', 'orca_whirlpool', 'uniswap_v3'])
const AMOUNT_STRING = /^[1-9][0-9]*$/
const DECIMAL_USD = /^(?:0|[1-9][0-9]*)(?:\.[0-9]{1,6})?$/
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const REQUEST_KEYS = Object.freeze(['from_chain', 'from_token', 'to_chain', 'to_token', 'amount_usd'])
const PINNED_ROUTE_CONTRACT_SHA256 = '3f6f64f66b6973f3da6ff53d1974c7b0cf725b0bc6bcc4554f0bfa5b55e7cff1'

function step(action, provider, from, to, feeBps) {
  return {
    action,
    provider,
    from,
    to,
    assetfare_fee_bps: feeBps,
    direct_protocol: provider !== 'across_intent_bridge',
    external_intent_protocol: provider === 'across_intent_bridge',
  }
}

function normalizeToUsdc(chain, token, feeBps = 0) {
  if (token === 'USDC') return []
  if (chain === 'solana' && token === 'SOL') return [step('swap', 'raydium_clmm', 'solana:SOL', 'solana:USDC', feeBps)]
  if (chain === 'solana' && token === 'USDG') return [step('swap', 'orca_whirlpool', 'solana:USDG', 'solana:USDC', feeBps)]
  if (['base', 'arbitrum'].includes(chain) && token === 'ETH') {
    return [step('swap', 'uniswap_v3', `${chain}:ETH`, `${chain}:USDC`, feeBps)]
  }
  return []
}

function normalizeFromUsdc(chain, token, feeBps = 0) {
  if (token === 'USDC') return []
  if (chain === 'solana' && token === 'SOL') return [step('swap', 'raydium_clmm', 'solana:USDC', 'solana:SOL', feeBps)]
  if (chain === 'solana' && token === 'USDG') return [step('swap', 'orca_whirlpool', 'solana:USDC', 'solana:USDG', feeBps)]
  if (['base', 'arbitrum'].includes(chain) && token === 'ETH') {
    return [step('swap', 'uniswap_v3', `${chain}:USDC`, `${chain}:ETH`, feeBps)]
  }
  return []
}

function plannedRoute(fromChain, fromToken, toChain, toToken) {
  const route = `${fromChain}:${fromToken}->${toChain}:${toToken}`
  if (!ENDPOINT_SET.has(`${fromChain}:${fromToken}`) || !DESTINATION_SET.has(`${toChain}:${toToken}`)) return null
  if (fromChain === toChain && fromToken === toToken) return null

  let mode
  let classification = 'direct_protocol_only'
  let steps

  if (SOURCE_ONLY_ROUTES.has(route)) {
    mode = `${fromChain}_source_cctp`
    steps = [step('bridge', 'circle_cctp', `${fromChain}:USDC`, `${toChain}:USDC`, 1)]
  } else if (['polygon', 'optimism'].includes(fromChain)) {
    return null
  } else if (fromChain === toChain) {
    if (fromChain === 'solana') {
      mode = fromToken === 'USDC' || toToken === 'USDC' ? 'same_chain_direct' : 'same_chain_direct_composition'
      if (fromToken === 'SOL') {
        steps = [
          step('swap', 'raydium_clmm', 'solana:SOL', 'solana:USDC', toToken === 'USDC' ? 1 : 0),
          ...normalizeFromUsdc('solana', toToken, toToken === 'USDG' ? 1 : 0),
        ]
      } else if (fromToken === 'USDG') {
        steps = [
          step('swap', 'orca_whirlpool', 'solana:USDG', 'solana:USDC', 1),
          ...normalizeFromUsdc('solana', toToken, 0),
        ]
      } else {
        steps = normalizeFromUsdc('solana', toToken, 1)
      }
    } else {
      mode = 'same_chain_direct'
      steps = [step('swap', 'uniswap_v3', `${fromChain}:${fromToken}`, `${toChain}:${toToken}`, 1)]
    }
  } else if (fromChain === 'robinhood') {
    mode = 'robinhood_paxos_egress_composition'
    steps = [
      ...(fromToken === 'ETH' ? [step('swap', 'uniswap_v3', 'robinhood:ETH', 'robinhood:USDG', 0)] : []),
      step('bridge', 'paxos_usdg_layerzero_oft', 'robinhood:USDG', 'solana:USDG', 1),
    ]
    if (toChain === 'solana') {
      if (toToken !== 'USDG') steps.push(step('swap', 'orca_whirlpool', 'solana:USDG', 'solana:USDC', 0))
      if (toToken === 'SOL') steps.push(step('swap', 'raydium_clmm', 'solana:USDC', 'solana:SOL', 0))
    } else if (['base', 'arbitrum'].includes(toChain)) {
      steps.push(step('swap', 'orca_whirlpool', 'solana:USDG', 'solana:USDC', 0))
      steps.push(step('bridge', 'circle_cctp', 'solana:USDC', `${toChain}:USDC`, 0))
      steps.push(...normalizeFromUsdc(toChain, toToken, 0))
    } else {
      return null
    }
  } else if (toChain === 'robinhood') {
    mode = 'robinhood_across_ingress_composition'
    classification = 'external_intent'
    if (fromChain === 'solana') {
      steps = [
        ...normalizeToUsdc('solana', fromToken, 0),
        step('bridge', 'circle_cctp', 'solana:USDC', 'base:USDC', 1),
        step('bridge', 'across_intent_bridge', 'base:USDC', 'robinhood:USDG', 0),
        ...(toToken === 'ETH' ? [step('swap', 'uniswap_v3', 'robinhood:USDG', 'robinhood:ETH', 0)] : []),
      ]
    } else if (['base', 'arbitrum'].includes(fromChain)) {
      const sourceSwap = normalizeToUsdc(fromChain, fromToken, fromToken === 'ETH' ? 1 : 0)
      const acrossFee = fromToken === 'USDC' && toToken === 'USDG' ? 1 : 0
      const destinationFee = fromToken === 'USDC' && toToken === 'ETH' ? 1 : 0
      steps = [
        ...sourceSwap,
        step('bridge', 'across_intent_bridge', `${fromChain}:USDC`, 'robinhood:USDG', acrossFee),
        ...(toToken === 'ETH' ? [step('swap', 'uniswap_v3', 'robinhood:USDG', 'robinhood:ETH', destinationFee)] : []),
      ]
    } else {
      return null
    }
  } else if (['base', 'arbitrum', 'solana'].includes(fromChain) && ['base', 'arbitrum', 'solana'].includes(toChain)) {
    mode = 'cctp_direct_composition'
    steps = [
      ...normalizeToUsdc(fromChain, fromToken, 0),
      step('bridge', 'circle_cctp', `${fromChain}:USDC`, `${toChain}:USDC`, 1),
      ...normalizeFromUsdc(toChain, toToken, 0),
    ]
  } else {
    return null
  }

  if (!steps?.length || steps.reduce((sum, value) => sum + value.assetfare_fee_bps, 0) !== 1) return null
  return {
    classification,
    mode,
    steps: steps.map((value, index) => ({ index, ...value })),
  }
}

export function buildRouteContract() {
  const routes = {}
  let stepCount = 0
  for (const [fromChain, fromToken] of ENDPOINTS) {
    for (const [toChain, toToken] of DESTINATION_ENDPOINTS) {
      const definition = plannedRoute(fromChain, fromToken, toChain, toToken)
      if (!definition) continue
      const name = `${fromChain}:${fromToken}->${toChain}:${toToken}`
      routes[name] = definition
      stepCount += definition.steps.length
    }
  }
  if (Object.keys(routes).length !== 76 || stepCount !== 168) throw new Error('assetfare_contract_internal_invalid')
  return Object.freeze({
    version: 'assetfare-direct-route-contract-v1',
    route_count: 76,
    step_count: 168,
    routes: Object.freeze(routes),
  })
}

const ROUTE_CONTRACT = buildRouteContract()

function canonicalJson(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value)
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`
  return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(',')}}`
}

const ROUTE_CONTRACT_SHA256 = createHash('sha256').update(canonicalJson(ROUTE_CONTRACT), 'utf8').digest('hex')
if (ROUTE_CONTRACT_SHA256 !== PINNED_ROUTE_CONTRACT_SHA256) throw new Error('assetfare_contract_internal_invalid')

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function exactKeys(value, expected) {
  if (!isObject(value)) return false
  const actual = Object.keys(value)
  return actual.length === expected.length && expected.every((key) => Object.hasOwn(value, key))
}

function rejectSensitive(value) {
  const forbidden = [
    'privatekey', 'privkey', 'secretkey', 'seedphrase', 'seed', 'mnemonic',
    'keypair', 'signedtransaction', 'signedtx', 'rawtransaction', 'password',
    'passphrase', 'signature', 'issafe',
  ]
  const stack = [[value, 0]]
  let seen = 0
  while (stack.length > 0) {
    const [node, depth] = stack.pop()
    seen += 1
    if (seen > 4096 || depth > 24) throw new Error('assetfare_response_unsafe')
    if (Array.isArray(node)) {
      for (const child of node) stack.push([child, depth + 1])
    } else if (isObject(node)) {
      for (const [key, child] of Object.entries(node)) {
        const normalized = key.toLowerCase().replaceAll('_', '').replaceAll('-', '')
        if (forbidden.some((term) => normalized.includes(term)) || normalized === 'safe') {
          throw new Error('assetfare_response_unsafe')
        }
        if (['signed', 'submitted'].includes(normalized) && child !== false) {
          throw new Error('assetfare_response_unsafe')
        }
        stack.push([child, depth + 1])
      }
    }
  }
}

function positiveAmountString(value) {
  if (typeof value !== 'string' || !AMOUNT_STRING.test(value)) throw new Error('assetfare_route_amount_invalid')
  return value
}

function rawNumberMatches(value, decimalString) {
  const exact = BigInt(decimalString)
  if (typeof value === 'bigint') return value === exact
  return typeof value === 'number' && Number.isSafeInteger(value) && value > 0 && BigInt(value) === exact
}

function positiveRawInteger(value) {
  return (typeof value === 'bigint' && value > 0n) ||
    (typeof value === 'number' && Number.isSafeInteger(value) && value > 0)
}

function rawStepKeys(definition) {
  if (SWAP_PROVIDERS.has(definition.provider)) {
    return ['kind', 'chain', 'provider', 'from', 'to', 'route_fee_bps', ...RAW_STEP_SUFFIX]
  }
  if (definition.provider === 'across_intent_bridge') {
    return ['kind', 'provider', 'from', 'to', 'from_asset', 'to_asset', 'external_intent_protocol', 'route_fee_bps', ...RAW_STEP_SUFFIX]
  }
  const sourceOnly = definition.provider === 'circle_cctp' && /^(polygon|optimism):/.test(definition.from)
  return [
    'kind', 'provider', 'from', 'to', 'asset',
    ...(sourceOnly ? ['cctp_mode', 'finality_threshold', 'destination_native_gas_required', 'economics_informational_only'] : []),
    'route_fee_bps', ...RAW_STEP_SUFFIX,
  ]
}

function rawEndpoints(raw, definition) {
  if (SWAP_PROVIDERS.has(definition.provider)) return [`${raw.chain}:${raw.from}`, `${raw.chain}:${raw.to}`]
  if (definition.provider === 'across_intent_bridge') return [`${raw.from}:${raw.from_asset}`, `${raw.to}:${raw.to_asset}`]
  return [`${raw.from}:${raw.asset}`, `${raw.to}:${raw.asset}`]
}

function evidenceValid(value) {
  return isObject(value) && value.status === 'pass' && value.aggregatorApiUsed === false &&
    value.signed === false && value.submitted === false
}

export function validateCapabilities(value) {
  rejectSensitive(value)
  if (!isObject(value) || value.version !== 'assetfare-multichain-api-v2' ||
      value.status !== 'capped_public_agent_release' || value.public_api_enabled !== true ||
      value.server_signing !== false || value.server_submission !== false ||
      value.route_aggregator_used !== false || value.directed_conversion_routes !== 76 ||
      value.unsigned_route_plans_ready !== 76 || value.execution_ready_routes !== 76) {
    throw new Error('assetfare_capabilities_invalid')
  }
  if (!isObject(value.amount_usd) || value.amount_usd.minimum !== 1 || value.amount_usd.maximum !== null ||
      value.amount_usd.policy !== 'no_business_maximum' || !isObject(value.fee_policy) ||
      value.fee_policy.exact_bps !== 1 || value.fee_policy.minimum_bps !== 1 ||
      value.fee_policy.maximum_bps !== 1 || value.fee_policy.zero_fee_routes_exist !== false ||
      value.fee_policy.fee_maximum_stable_base !== null || value.fee_policy.provider_and_network_fees_additional !== true) {
    throw new Error('assetfare_capabilities_invalid')
  }
  const endpoints = value.asset_endpoints
  if (!Array.isArray(endpoints) || endpoints.length !== ENDPOINT_SET.size ||
      new Set(endpoints.map((item) => isObject(item) ? `${item.chain}:${item.token}` : '')).size !== ENDPOINT_SET.size ||
      !endpoints.every((item) => isObject(item) && ENDPOINT_SET.has(`${item.chain}:${item.token}`))) {
    throw new Error('assetfare_capabilities_invalid')
  }
  const direct = value.direct_route_summary
  if (!isObject(direct) || direct.version !== 'assetfare-direct-route-summary-v1' ||
      direct.required_on_every_quote !== true || direct.route_count !== 76 || direct.step_count !== 168 ||
      direct.ordered_provider_path !== true || direct.normalized_chain_asset_endpoints !== true ||
      direct.base_unit_amounts_are_decimal_strings !== true || direct.assetfare_fee_step_bound !== true ||
      direct.route_aggregator_used_scope !== 'assetfare_engine_only' ||
      direct.external_intent !== 'Across only for Robinhood ingress; provider-internal liquidity sourcing or aggregation remains possible' ||
      direct.server_signing !== false || direct.server_submission !== false ||
      JSON.stringify(direct.classification_values) !== JSON.stringify(['direct_protocol_only', 'external_intent'])) {
    throw new Error('assetfare_capabilities_invalid')
  }
  const guidance = value.evaluation_guidance
  if (!isObject(guidance) || guidance.always_compare_fresh_at_intended_amount !== true ||
      guidance.representative_economic_evaluation_usd !== 1000 || guidance.reachability_smoke_usd !== 1 ||
      guidance.reachability_smoke_scope !== 'connectivity_only_not_economic_evaluation' ||
      guidance.not_guaranteed_best !== true || guidance.not_a_minimum !== true ||
      guidance.native_usdc_economic_evaluation_start_usd !== 50) {
    throw new Error('assetfare_capabilities_invalid')
  }
  return {
    version: value.version,
    status: value.status,
    amount_usd: { minimum: 1, maximum: null, policy: 'no_business_maximum' },
    asset_endpoints: endpoints.map((item) => ({ chain: item.chain, token: item.token })),
    directed_conversion_routes: 76,
    direct_route_summary: {
      version: direct.version,
      required_on_every_quote: true,
      route_count: 76,
      step_count: 168,
      ordered_provider_path: true,
      normalized_chain_asset_endpoints: true,
      base_unit_amounts_are_decimal_strings: true,
      assetfare_fee_step_bound: true,
      classification_values: ['direct_protocol_only', 'external_intent'],
      route_aggregator_used_scope: 'assetfare_engine_only',
      external_intent: direct.external_intent,
      server_signing: false,
      server_submission: false,
    },
    evaluation_guidance: {
      always_compare_fresh_at_intended_amount: true,
      native_usdc_economic_evaluation_start_usd: 50,
      not_a_minimum: true,
      not_guaranteed_best: true,
      reachability_smoke_scope: 'connectivity_only_not_economic_evaluation',
      reachability_smoke_usd: 1,
      representative_economic_evaluation_usd: 1000,
    },
    fee_policy: {
      exact_bps: 1,
      minimum_bps: 1,
      maximum_bps: 1,
      zero_fee_routes_exist: false,
      fee_maximum_stable_base: null,
      provider_and_network_fees_additional: true,
    },
    server_signing: false,
    server_submission: false,
  }
}

export function validateDirectRouteSummary(summary, rawRoute, risk, intent, offer) {
  rejectSensitive({ summary, rawRoute })
  if (!exactKeys(summary, SUMMARY_KEYS) || !exactKeys(rawRoute, ROUTE_KEYS)) {
    throw new Error('assetfare_direct_route_shape_invalid')
  }
  const routeName = `${intent.from}->${intent.to}`
  const definition = ROUTE_CONTRACT.routes[routeName]
  if (!definition || summary.version !== 'assetfare-direct-route-summary-v1' ||
      summary.route !== routeName || summary.from !== intent.from || summary.to !== intent.to ||
      summary.mode !== definition.mode || summary.classification !== definition.classification) {
    throw new Error('assetfare_direct_route_binding_invalid')
  }
  const external = definition.classification === 'external_intent'
  if (summary.route_aggregator_used !== false || summary.external_intent_protocol_used !== external ||
      summary.provider_internal_dex_aggregation_possible !== external || summary.assetfare_fee_bps !== 1 ||
      summary.server_signing !== false || summary.server_submission !== false ||
      summary.step_count !== definition.steps.length || !Array.isArray(summary.steps) ||
      summary.steps.length !== definition.steps.length) {
    throw new Error('assetfare_direct_route_boundary_invalid')
  }
  if (rawRoute.status !== 'pass' || rawRoute.version !== 'assetfare-direct-multichain-quote-v2' ||
      rawRoute.route !== routeName || rawRoute.mode !== definition.mode || rawRoute.aggregator_api_used !== false ||
      rawRoute.external_intent_protocol_used !== external || rawRoute.server_signing !== false ||
      rawRoute.server_submission !== false || !Array.isArray(rawRoute.steps) ||
      rawRoute.steps.length !== definition.steps.length) {
    throw new Error('assetfare_direct_route_raw_invalid')
  }
  if (!isObject(risk) || risk.external_intent_protocol_used !== external ||
      risk.provider_internal_dex_aggregation_possible !== external || risk.server_signing !== false ||
      risk.server_submission !== false) {
    throw new Error('assetfare_direct_route_risk_invalid')
  }

  let expectedCursor
  let minimumCursor
  let feeSum = 0
  let feeIndex = -1
  const safeSteps = []
  for (let index = 0; index < definition.steps.length; index += 1) {
    const planned = definition.steps[index]
    const value = summary.steps[index]
    const raw = rawRoute.steps[index]
    if (!exactKeys(value, SUMMARY_STEP_KEYS) || !exactKeys(raw, rawStepKeys(planned))) {
      throw new Error('assetfare_direct_route_step_shape_invalid')
    }
    for (const key of ['index', 'action', 'provider', 'from', 'to', 'assetfare_fee_bps', 'direct_protocol', 'external_intent_protocol']) {
      if (value[key] !== planned[key]) throw new Error('assetfare_direct_route_plan_invalid')
    }
    if (value.aggregator_api_used !== false || raw.index !== index || raw.provider !== planned.provider ||
        raw.route_fee_bps !== planned.assetfare_fee_bps) {
      throw new Error('assetfare_direct_route_step_invalid')
    }
    const [rawFrom, rawTo] = rawEndpoints(raw, planned)
    if (raw.kind !== (planned.action === 'swap' ? 'direct_swap' : 'direct_bridge') ||
        rawFrom !== planned.from || rawTo !== planned.to ||
        (planned.provider === 'across_intent_bridge'
          ? raw.external_intent_protocol !== true
          : Object.hasOwn(raw, 'external_intent_protocol'))) {
      throw new Error('assetfare_direct_route_raw_plan_invalid')
    }
    if (planned.provider === 'circle_cctp' && /^(polygon|optimism):/.test(planned.from) &&
        !(raw.cctp_mode === 'no_forward' && raw.finality_threshold === 2000 &&
          raw.destination_native_gas_required === true && raw.economics_informational_only === true)) {
      throw new Error('assetfare_direct_route_source_only_invalid')
    }
    if (!evidenceValid(raw.expected_evidence) || (raw.floor_evidence !== null && !evidenceValid(raw.floor_evidence))) {
      throw new Error('assetfare_direct_route_evidence_invalid')
    }
    const expectedInput = positiveAmountString(value.expected_input_base)
    const minimumInput = positiveAmountString(value.minimum_input_base)
    const expectedOutput = positiveAmountString(value.expected_output_base)
    const minimumOutput = positiveAmountString(value.minimum_output_base)
    if (BigInt(minimumOutput) > BigInt(expectedOutput) ||
        (index > 0 && (expectedInput !== expectedCursor || minimumInput !== minimumCursor))) {
      throw new Error('assetfare_direct_route_continuity_invalid')
    }
    const rawAmounts = [raw.expected_input_base, raw.floor_input_base, raw.expected_output_base, raw.minimum_output_base]
    const exactAmounts = [expectedInput, minimumInput, expectedOutput, minimumOutput]
    if (!rawAmounts.every((item, offset) => rawNumberMatches(item, exactAmounts[offset]))) {
      throw new Error('assetfare_direct_route_amount_binding_invalid')
    }
    expectedCursor = expectedOutput
    minimumCursor = minimumOutput
    feeSum += value.assetfare_fee_bps
    if (value.assetfare_fee_bps === 1) feeIndex = index
    safeSteps.push({ ...value })
  }

  if (!rawNumberMatches(intent.estimated_input_base, safeSteps[0].expected_input_base) ||
      !rawNumberMatches(rawRoute.input_base, safeSteps[0].expected_input_base) ||
      safeSteps[0].minimum_input_base !== safeSteps[0].expected_input_base ||
      !rawNumberMatches(rawRoute.expected_output_base, expectedCursor) ||
      !rawNumberMatches(rawRoute.minimum_output_base, minimumCursor) || feeSum !== 1 ||
      feeIndex !== summary.fee_collection_step_index || !isObject(offer) || offer.assetfare_fee_bps !== 1 ||
      offer.fee_modeled_bps !== 1 || offer.fee_collectible_now !== true ||
      !Array.isArray(offer.fee_collection_steps) || offer.fee_collection_steps.length !== 1 ||
      offer.fee_collection_steps[0] !== feeIndex) {
    throw new Error('assetfare_direct_route_fee_or_root_invalid')
  }
  return { ...summary, steps: safeSteps }
}

function finiteNumber(value) {
  return typeof value === 'number' && Number.isFinite(value)
}

function closeEnough(left, right) {
  return finiteNumber(left) && finiteNumber(right) && Math.abs(left - right) <= 0.000001
}

function safeProviderFeeComponents(value) {
  if (!Array.isArray(value) || value.length > 32) throw new Error('assetfare_quote_cost_invalid')
  return value.map((item) => {
    if (!isObject(item) || typeof item.provider !== 'string' || item.provider.length < 1 || item.provider.length > 128 ||
        typeof item.kind !== 'string' || item.kind.length < 1 || item.kind.length > 128 ||
        !finiteNumber(item.expected_usd) || item.expected_usd < 0 || !finiteNumber(item.maximum_usd) ||
        item.maximum_usd < item.expected_usd || item.included_in_receive_amount !== true ||
        (Object.hasOwn(item, 'includes_destination_gas') && typeof item.includes_destination_gas !== 'boolean')) {
      throw new Error('assetfare_quote_cost_invalid')
    }
    const expectedKeys = Object.hasOwn(item, 'includes_destination_gas')
      ? ['provider', 'kind', 'expected_usd', 'maximum_usd', 'included_in_receive_amount', 'includes_destination_gas']
      : ['provider', 'kind', 'expected_usd', 'maximum_usd', 'included_in_receive_amount']
    if (!exactKeys(item, expectedKeys)) throw new Error('assetfare_quote_cost_invalid')
    return { ...item }
  })
}

export function validateQuote(value, request, nowMs = Date.now()) {
  rejectSensitive(value)
  const asOfMs = Date.parse(value?.as_of)
  if (!isObject(value) || !UUID.test(value.quote_id ?? '') ||
      value.status !== 'capped_public_agent_release' ||
      value.version !== 'assetfare-direct-multichain-api-quote-v2' ||
      typeof value.as_of !== 'string' || !Number.isFinite(asOfMs) ||
      !Number.isInteger(value.ttl_seconds) || value.ttl_seconds < 1 || value.ttl_seconds > 60 ||
      !finiteNumber(nowMs) || asOfMs > nowMs + 5_000 || nowMs > asOfMs + (value.ttl_seconds * 1_000) + 5_000 ||
      !isObject(value.intent) || value.intent.from !== `${request.from_chain}:${request.from_token}` ||
      value.intent.to !== `${request.to_chain}:${request.to_token}` || value.intent.amount_usd !== request.amount_usd ||
      !positiveRawInteger(value.intent.estimated_input_base) ||
      !isObject(value.offer) || value.offer.output_symbol !== request.to_token ||
      !finiteNumber(value.offer.expected_receive_amount) || !finiteNumber(value.offer.estimated_min_receive_amount) ||
      value.offer.expected_receive_amount < value.offer.estimated_min_receive_amount ||
      value.offer.estimated_min_receive_amount <= 0 ||
      !finiteNumber(value.offer.expected_receive_usd) || !finiteNumber(value.offer.estimated_min_receive_usd) ||
      value.offer.expected_receive_usd < value.offer.estimated_min_receive_usd ||
      value.offer.estimated_min_receive_usd <= 0 || !finiteNumber(value.offer.estimated_time_seconds) ||
      value.offer.estimated_time_seconds < 0) {
    throw new Error('assetfare_quote_invalid')
  }
  const summary = validateDirectRouteSummary(value.direct_route_summary, value.route, value.risk, value.intent, value.offer)
  const costs = value.cost_summary
  const reachabilitySmoke = request.amount_usd === 1
  if (!isObject(costs) || costs.scope !== 'token_path_only_network_gas_excluded' ||
      costs.rankable_all_in !== false || !Array.isArray(costs.unpriced_costs) || costs.unpriced_costs.length === 0 ||
      !costs.unpriced_costs.every((item) => typeof item === 'string' && item.length > 0 && item.length <= 128) ||
      new Set(costs.unpriced_costs).size !== costs.unpriced_costs.length ||
      costs.input_value_usd !== request.amount_usd ||
      !closeEnough(costs.expected_receive_value_usd, value.offer.expected_receive_usd) ||
      !closeEnough(costs.minimum_receive_value_usd, value.offer.estimated_min_receive_usd) ||
      !finiteNumber(costs.expected_total_cost_usd) || !finiteNumber(costs.maximum_total_cost_usd) ||
      costs.expected_total_cost_usd < 0 || costs.maximum_total_cost_usd < costs.expected_total_cost_usd ||
      !finiteNumber(costs.expected_total_cost_percent) || costs.expected_total_cost_percent < 0 ||
      !finiteNumber(costs.maximum_total_cost_percent) || costs.maximum_total_cost_percent < costs.expected_total_cost_percent ||
      !closeEnough(costs.expected_total_cost_usd, costs.input_value_usd - costs.expected_receive_value_usd) ||
      !closeEnough(costs.maximum_total_cost_usd, costs.input_value_usd - costs.minimum_receive_value_usd) ||
      !closeEnough(costs.expected_total_cost_percent, costs.expected_total_cost_usd / costs.input_value_usd * 100) ||
      !closeEnough(costs.maximum_total_cost_percent, costs.maximum_total_cost_usd / costs.input_value_usd * 100) ||
      typeof costs.small_amount_warning !== 'boolean' || (reachabilitySmoke && costs.small_amount_warning !== true) ||
      (costs.small_amount_warning
        ? !(typeof costs.warning === 'string' && costs.warning.length > 0 && costs.warning.length <= 512)
        : costs.warning !== null) ||
      !exactKeys(costs.assetfare_service_fee, ['bps', 'estimated_usd', 'included_in_receive_amount', 'note']) ||
      costs.assetfare_service_fee.bps !== 1 || !finiteNumber(costs.assetfare_service_fee.estimated_usd) ||
      costs.assetfare_service_fee.estimated_usd < 0 || costs.assetfare_service_fee.included_in_receive_amount !== true ||
      typeof costs.assetfare_service_fee.note !== 'string' || costs.assetfare_service_fee.note.length < 1) {
    throw new Error('assetfare_quote_cost_invalid')
  }
  const providerFeeComponents = safeProviderFeeComponents(costs.provider_fee_components)
  return {
    quote_id: value.quote_id,
    as_of: value.as_of,
    ttl_seconds: value.ttl_seconds,
    expires_at: new Date(asOfMs + value.ttl_seconds * 1_000).toISOString(),
    intent: {
      from: value.intent.from,
      to: value.intent.to,
      amount_usd: value.intent.amount_usd,
    },
    offer: {
      expected_receive_amount: value.offer.expected_receive_amount,
      estimated_min_receive_amount: value.offer.estimated_min_receive_amount,
      expected_receive_usd: value.offer.expected_receive_usd,
      estimated_min_receive_usd: value.offer.estimated_min_receive_usd,
      output_symbol: value.offer.output_symbol,
      estimated_time_seconds: value.offer.estimated_time_seconds,
      assetfare_fee_bps: 1,
    },
    cost_summary: {
      scope: costs.scope,
      expected_total_cost_usd: costs.expected_total_cost_usd,
      maximum_total_cost_usd: costs.maximum_total_cost_usd,
      expected_total_cost_percent: costs.expected_total_cost_percent,
      maximum_total_cost_percent: costs.maximum_total_cost_percent,
      provider_fee_components: providerFeeComponents,
      unpriced_costs: [...costs.unpriced_costs],
      rankable_all_in: false,
      small_amount_warning: costs.small_amount_warning,
      warning: costs.warning,
    },
    direct_route_summary: summary,
    execution_boundary: {
      quote_only: true,
      wallet_data_sent: false,
      authenticated: false,
      session_created: false,
      action_prepared: false,
      server_signing: false,
      server_submission: false,
    },
    comparison_guidance: {
      compare_fresh_at_exact_intended_amount: true,
      source_network_gas_unpriced: true,
      not_guaranteed_best: true,
    },
  }
}

export function parseJsonLossless(text) {
  if (typeof text !== 'string') throw new Error('assetfare_response_invalid')
  let offset = 0
  let nodes = 0

  const fail = () => { throw new Error('assetfare_response_invalid') }
  const whitespace = () => {
    while (offset < text.length && /[\t\n\r ]/.test(text[offset])) offset += 1
  }
  const parseString = () => {
    if (text[offset] !== '"') fail()
    const start = offset
    offset += 1
    while (offset < text.length) {
      const char = text[offset]
      if (char === '"') {
        offset += 1
        try { return JSON.parse(text.slice(start, offset)) } catch { fail() }
      }
      if (char === '\\') {
        offset += 1
        if (offset >= text.length) fail()
        if (text[offset] === 'u') {
          if (!/^[0-9a-fA-F]{4}$/.test(text.slice(offset + 1, offset + 5))) fail()
          offset += 5
          continue
        }
        if (!'"\\/bfnrt'.includes(text[offset])) fail()
      } else if (text.charCodeAt(offset) < 0x20) {
        fail()
      }
      offset += 1
    }
    fail()
  }
  const parseNumber = () => {
    const start = offset
    if (text[offset] === '-') offset += 1
    if (text[offset] === '0') {
      offset += 1
      if (/[0-9]/.test(text[offset] ?? '')) fail()
    } else {
      if (!/[1-9]/.test(text[offset] ?? '')) fail()
      while (/[0-9]/.test(text[offset] ?? '')) offset += 1
    }
    let fractional = false
    if (text[offset] === '.') {
      fractional = true
      offset += 1
      if (!/[0-9]/.test(text[offset] ?? '')) fail()
      while (/[0-9]/.test(text[offset] ?? '')) offset += 1
    }
    if (text[offset] === 'e' || text[offset] === 'E') {
      fractional = true
      offset += 1
      if (text[offset] === '+' || text[offset] === '-') offset += 1
      if (!/[0-9]/.test(text[offset] ?? '')) fail()
      while (/[0-9]/.test(text[offset] ?? '')) offset += 1
    }
    const token = text.slice(start, offset)
    if (token.length > 128) fail()
    if (!fractional) {
      let exact
      try { exact = BigInt(token) } catch { fail() }
      if (exact >= BigInt(Number.MIN_SAFE_INTEGER) && exact <= BigInt(Number.MAX_SAFE_INTEGER)) return Number(exact)
      return exact
    }
    const value = Number(token)
    if (!Number.isFinite(value)) fail()
    return value
  }
  const parseValue = (depth) => {
    nodes += 1
    if (nodes > 100_000 || depth > 64) fail()
    whitespace()
    const char = text[offset]
    if (char === '"') return parseString()
    if (char === '-' || /[0-9]/.test(char ?? '')) return parseNumber()
    if (text.startsWith('true', offset)) { offset += 4; return true }
    if (text.startsWith('false', offset)) { offset += 5; return false }
    if (text.startsWith('null', offset)) { offset += 4; return null }
    if (char === '[') {
      offset += 1
      whitespace()
      const result = []
      if (text[offset] === ']') { offset += 1; return result }
      while (true) {
        result.push(parseValue(depth + 1))
        whitespace()
        if (text[offset] === ']') { offset += 1; return result }
        if (text[offset] !== ',') fail()
        offset += 1
      }
    }
    if (char === '{') {
      offset += 1
      whitespace()
      const result = Object.create(null)
      if (text[offset] === '}') { offset += 1; return result }
      while (true) {
        whitespace()
        const key = parseString()
        if (Object.hasOwn(result, key)) fail()
        whitespace()
        if (text[offset] !== ':') fail()
        offset += 1
        result[key] = parseValue(depth + 1)
        whitespace()
        if (text[offset] === '}') { offset += 1; return result }
        if (text[offset] !== ',') fail()
        offset += 1
      }
    }
    fail()
  }

  const value = parseValue(0)
  whitespace()
  if (offset !== text.length) fail()
  return value
}

async function readBoundedJson(response) {
  const contentType = response.headers.get('content-type') ?? ''
  if (!/^application\/json(?:\s*;|$)/i.test(contentType)) throw new Error('assetfare_response_invalid')
  const declared = Number(response.headers.get('content-length') ?? '0')
  if (Number.isFinite(declared) && declared > MAX_RESPONSE_BYTES) throw new Error('assetfare_response_invalid')
  if (!response.body || typeof response.body.getReader !== 'function') throw new Error('assetfare_response_invalid')
  const reader = response.body.getReader()
  const chunks = []
  let total = 0
  let count = 0
  try {
    while (true) {
      const item = await reader.read()
      if (!isObject(item) || typeof item.done !== 'boolean') throw new Error('assetfare_response_invalid')
      if (item.done) break
      if (!(item.value instanceof Uint8Array)) throw new Error('assetfare_response_invalid')
      total += item.value.byteLength
      count += 1
      if (total > MAX_RESPONSE_BYTES || count > MAX_RESPONSE_CHUNKS) throw new Error('assetfare_response_invalid')
      chunks.push(item.value)
    }
  } catch {
    try { await reader.cancel() } catch {}
    throw new Error('assetfare_response_invalid')
  }
  const bytes = new Uint8Array(total)
  let offset = 0
  for (const chunk of chunks) {
    bytes.set(chunk, offset)
    offset += chunk.byteLength
  }
  try {
    return parseJsonLossless(new TextDecoder('utf-8', { fatal: true }).decode(bytes))
  } catch {
    throw new Error('assetfare_response_invalid')
  }
}

async function requestJson(url, init, fetchImpl = globalThis.fetch, timeoutMs = TIMEOUT_MS) {
  const boundedTimeout = Number.isInteger(timeoutMs) && timeoutMs >= 1 ? Math.min(timeoutMs, TIMEOUT_MS) : TIMEOUT_MS
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), boundedTimeout)
  try {
    const response = await fetchImpl(url, {
      ...init,
      redirect: 'error',
      signal: controller.signal,
      headers: {
        accept: 'application/json',
        'user-agent': `assetfare-route-quote-skill/${CLIENT_VERSION}`,
        'x-assetfare-channel': 'binance-skills-hub',
        ...(init.headers ?? {}),
      },
    })
    if (!(response instanceof Response) || !response.ok) throw new Error('assetfare_upstream_unavailable')
    return await readBoundedJson(response)
  } catch (error) {
    if (error instanceof Error && ['assetfare_upstream_unavailable', 'assetfare_response_invalid'].includes(error.message)) throw error
    throw new Error('assetfare_upstream_unavailable')
  } finally {
    clearTimeout(timer)
  }
}

export async function getCapabilities(fetchImpl = globalThis.fetch, timeoutMs = TIMEOUT_MS) {
  const value = await requestJson(CAPABILITIES_URL, { method: 'GET' }, fetchImpl, timeoutMs)
  return validateCapabilities(value)
}

export async function getQuote(request, fetchImpl = globalThis.fetch, timeoutMs = TIMEOUT_MS) {
  const canonical = validateRequest(request)
  await getCapabilities(fetchImpl, timeoutMs)
  const value = await requestJson(QUOTE_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(canonical),
  }, fetchImpl, timeoutMs)
  return validateQuote(value, canonical)
}

function parseAmount(value) {
  if (typeof value !== 'string' || !DECIMAL_USD.test(value)) throw new Error('assetfare_request_invalid')
  const amount = Number(value)
  if (!Number.isFinite(amount) || amount < 1) throw new Error('assetfare_request_invalid')
  return amount
}

export function validateRequest(request) {
  if (!exactKeys(request, REQUEST_KEYS) || typeof request.from_chain !== 'string' ||
      typeof request.from_token !== 'string' || typeof request.to_chain !== 'string' ||
      typeof request.to_token !== 'string' || typeof request.amount_usd !== 'number' ||
      !Number.isFinite(request.amount_usd) || request.amount_usd < 1) {
    throw new Error('assetfare_request_invalid')
  }
  const canonical = {
    from_chain: request.from_chain,
    from_token: request.from_token,
    to_chain: request.to_chain,
    to_token: request.to_token,
    amount_usd: request.amount_usd,
  }
  if (canonical.from_chain !== canonical.from_chain.toLowerCase() ||
      canonical.to_chain !== canonical.to_chain.toLowerCase() ||
      canonical.from_token !== canonical.from_token.toUpperCase() ||
      canonical.to_token !== canonical.to_token.toUpperCase() ||
      !ROUTE_CONTRACT.routes[`${canonical.from_chain}:${canonical.from_token}->${canonical.to_chain}:${canonical.to_token}`]) {
    throw new Error('assetfare_request_invalid')
  }
  return canonical
}

export function parseCli(argv) {
  const [command, ...rest] = argv
  if (command === 'capabilities' && rest.length === 0) return { command }
  if (command !== 'quote') throw new Error('assetfare_request_invalid')
  if (rest.length % 2 !== 0) throw new Error('assetfare_request_invalid')
  const allowed = new Set(['--from-chain', '--from-token', '--to-chain', '--to-token', '--amount-usd'])
  const values = new Map()
  for (let index = 0; index < rest.length; index += 2) {
    const key = rest[index]
    const value = rest[index + 1]
    if (!allowed.has(key) || values.has(key) || typeof value !== 'string' || value.startsWith('--')) {
      throw new Error('assetfare_request_invalid')
    }
    values.set(key, value)
  }
  if (values.size !== allowed.size) throw new Error('assetfare_request_invalid')
  const request = {
    from_chain: values.get('--from-chain').toLowerCase(),
    from_token: values.get('--from-token').toUpperCase(),
    to_chain: values.get('--to-chain').toLowerCase(),
    to_token: values.get('--to-token').toUpperCase(),
    amount_usd: parseAmount(values.get('--amount-usd')),
  }
  return { command, request: validateRequest(request) }
}

function usage() {
  return [
    'Usage:',
    '  node scripts/route-quote.mjs capabilities',
    '  node scripts/route-quote.mjs quote --from-chain <chain> --from-token <token> --to-chain <chain> --to-token <token> --amount-usd <amount>',
    '',
    'Quote-only boundary: no wallet, authentication, session, prepare, signing, or submission.',
  ].join('\n')
}

export async function main(argv = process.argv.slice(2), fetchImpl = globalThis.fetch) {
  const parsed = parseCli(argv)
  return parsed.command === 'capabilities' ? getCapabilities(fetchImpl) : getQuote(parsed.request, fetchImpl)
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  main().then(
    (value) => process.stdout.write(`${JSON.stringify(value, null, 2)}\n`),
    () => {
      process.stderr.write(`assetfare_route_quote_failed\n\n${usage()}\n`)
      process.exitCode = 1
    },
  )
}

export const CONTRACT_COUNTS = Object.freeze({ routes: ROUTE_CONTRACT.route_count, steps: ROUTE_CONTRACT.step_count })
export const CONTRACT_SHA256 = ROUTE_CONTRACT_SHA256
export const LIMITS = Object.freeze({ timeout_ms: TIMEOUT_MS, max_response_bytes: MAX_RESPONSE_BYTES, max_response_chunks: MAX_RESPONSE_CHUNKS })
