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
  ["aptos", "USDC"],
  ["arbitrum", "ETH"],
  ["arbitrum", "USDC"],
  ["avalanche", "USDC"],
  ["base", "ETH"],
  ["base", "USDC"],
  ["cronos", "USDC"],
  ["ethereum", "USDC"],
  ["hyperevm", "USDC"],
  ["injective", "USDC"],
  ["ink", "USDC"],
  ["linea", "USDC"],
  ["monad", "USDC"],
  ["optimism", "USDC"],
  ["robinhood", "ETH"],
  ["robinhood", "USDG"],
  ["sei", "USDC"],
  ["solana", "SOL"],
  ["solana", "USDC"],
  ["solana", "USDG"],
  ["sonic", "USDC"],
  ["unichain", "USDC"],
  ["xlayer", "USDC"]
])
const ENDPOINT_SET = new Set(ENDPOINTS.map(([chain, token]) => `${chain}:${token}`))
const ROUTE_CONTRACT_DATA = {"aptos:USDC->base:USDC":{"classification":"direct_protocol_only","mode":"aptos_move_cctp_direct","product_classification":"primary_direct","steps":[{"action":"bridge","aggregator_api_used":false,"assetfare_fee_bps":1,"direct_protocol":true,"external_intent_protocol":false,"from":"aptos:USDC","index":0,"provider":"circle_cctp","to":"base:USDC"}]},"aptos:USDC->solana:USDC":{"classification":"direct_protocol_only","mode":"aptos_move_cctp_direct","product_classification":"primary_direct","steps":[{"action":"bridge","aggregator_api_used":false,"assetfare_fee_bps":1,"direct_protocol":true,"external_intent_protocol":false,"from":"aptos:USDC","index":0,"provider":"circle_cctp","to":"solana:USDC"}]},"arbitrum:ETH->arbitrum:USDC":{"classification":"direct_protocol_only","mode":"same_chain_direct","product_classification":"primary_direct","steps":[{"action":"swap","aggregator_api_used":false,"assetfare_fee_bps":1,"direct_protocol":true,"external_intent_protocol":false,"from":"arbitrum:ETH","index":0,"provider":"uniswap_v3","to":"arbitrum:USDC"}]},"arbitrum:ETH->solana:USDG":{"classification":"direct_protocol_only","mode":"cctp_direct_composition","product_classification":"primary_direct","steps":[{"action":"swap","aggregator_api_used":false,"assetfare_fee_bps":0,"direct_protocol":true,"external_intent_protocol":false,"from":"arbitrum:ETH","index":0,"provider":"uniswap_v3","to":"arbitrum:USDC"},{"action":"bridge","aggregator_api_used":false,"assetfare_fee_bps":1,"direct_protocol":true,"external_intent_protocol":false,"from":"arbitrum:USDC","index":1,"provider":"circle_cctp","to":"solana:USDC"},{"action":"swap","aggregator_api_used":false,"assetfare_fee_bps":0,"direct_protocol":true,"external_intent_protocol":false,"from":"solana:USDC","index":2,"provider":"orca_whirlpool","to":"solana:USDG"}]},"arbitrum:USDC->arbitrum:ETH":{"classification":"direct_protocol_only","mode":"same_chain_direct","product_classification":"primary_direct","steps":[{"action":"swap","aggregator_api_used":false,"assetfare_fee_bps":1,"direct_protocol":true,"external_intent_protocol":false,"from":"arbitrum:USDC","index":0,"provider":"uniswap_v3","to":"arbitrum:ETH"}]},"arbitrum:USDC->robinhood:ETH":{"classification":"direct_protocol_only","mode":"robinhood_paxos_ingress_composition","product_classification":"primary_direct","steps":[{"action":"bridge","aggregator_api_used":false,"assetfare_fee_bps":1,"direct_protocol":true,"external_intent_protocol":false,"from":"arbitrum:USDC","index":0,"provider":"circle_cctp","to":"solana:USDC"},{"action":"swap","aggregator_api_used":false,"assetfare_fee_bps":0,"direct_protocol":true,"external_intent_protocol":false,"from":"solana:USDC","index":1,"provider":"orca_whirlpool","to":"solana:USDG"},{"action":"bridge","aggregator_api_used":false,"assetfare_fee_bps":0,"direct_protocol":true,"external_intent_protocol":false,"from":"solana:USDG","index":2,"provider":"paxos_usdg_layerzero_oft","to":"robinhood:USDG"},{"action":"swap","aggregator_api_used":false,"assetfare_fee_bps":0,"direct_protocol":true,"external_intent_protocol":false,"from":"robinhood:USDG","index":3,"provider":"uniswap_v3","to":"robinhood:ETH"}]},"arbitrum:USDC->robinhood:USDG":{"classification":"direct_protocol_only","mode":"robinhood_paxos_ingress_composition","product_classification":"primary_direct","steps":[{"action":"bridge","aggregator_api_used":false,"assetfare_fee_bps":1,"direct_protocol":true,"external_intent_protocol":false,"from":"arbitrum:USDC","index":0,"provider":"circle_cctp","to":"solana:USDC"},{"action":"swap","aggregator_api_used":false,"assetfare_fee_bps":0,"direct_protocol":true,"external_intent_protocol":false,"from":"solana:USDC","index":1,"provider":"orca_whirlpool","to":"solana:USDG"},{"action":"bridge","aggregator_api_used":false,"assetfare_fee_bps":0,"direct_protocol":true,"external_intent_protocol":false,"from":"solana:USDG","index":2,"provider":"paxos_usdg_layerzero_oft","to":"robinhood:USDG"}]},"arbitrum:USDC->solana:SOL":{"classification":"direct_protocol_only","mode":"cctp_direct_composition","product_classification":"primary_direct","steps":[{"action":"bridge","aggregator_api_used":false,"assetfare_fee_bps":1,"direct_protocol":true,"external_intent_protocol":false,"from":"arbitrum:USDC","index":0,"provider":"circle_cctp","to":"solana:USDC"},{"action":"swap","aggregator_api_used":false,"assetfare_fee_bps":0,"direct_protocol":true,"external_intent_protocol":false,"from":"solana:USDC","index":1,"provider":"raydium_clmm","to":"solana:SOL"}]},"arbitrum:USDC->solana:USDC":{"classification":"direct_protocol_only","mode":"cctp_direct_composition","product_classification":"primary_direct","steps":[{"action":"bridge","aggregator_api_used":false,"assetfare_fee_bps":1,"direct_protocol":true,"external_intent_protocol":false,"from":"arbitrum:USDC","index":0,"provider":"circle_cctp","to":"solana:USDC"}]},"arbitrum:USDC->solana:USDG":{"classification":"direct_protocol_only","mode":"cctp_direct_composition","product_classification":"primary_direct","steps":[{"action":"bridge","aggregator_api_used":false,"assetfare_fee_bps":1,"direct_protocol":true,"external_intent_protocol":false,"from":"arbitrum:USDC","index":0,"provider":"circle_cctp","to":"solana:USDC"},{"action":"swap","aggregator_api_used":false,"assetfare_fee_bps":0,"direct_protocol":true,"external_intent_protocol":false,"from":"solana:USDC","index":1,"provider":"orca_whirlpool","to":"solana:USDG"}]},"avalanche:USDC->base:USDC":{"classification":"direct_protocol_only","mode":"cctp_direct_composition","product_classification":"primary_direct","steps":[{"action":"bridge","aggregator_api_used":false,"assetfare_fee_bps":1,"direct_protocol":true,"external_intent_protocol":false,"from":"avalanche:USDC","index":0,"provider":"circle_cctp","to":"base:USDC"}]},"avalanche:USDC->solana:USDC":{"classification":"direct_protocol_only","mode":"cctp_direct_composition","product_classification":"primary_direct","steps":[{"action":"bridge","aggregator_api_used":false,"assetfare_fee_bps":1,"direct_protocol":true,"external_intent_protocol":false,"from":"avalanche:USDC","index":0,"provider":"circle_cctp","to":"solana:USDC"}]},"base:ETH->base:USDC":{"classification":"direct_protocol_only","mode":"same_chain_direct","product_classification":"primary_direct","steps":[{"action":"swap","aggregator_api_used":false,"assetfare_fee_bps":1,"direct_protocol":true,"external_intent_protocol":false,"from":"base:ETH","index":0,"provider":"uniswap_v3","to":"base:USDC"}]},"base:ETH->solana:SOL":{"classification":"direct_protocol_only","mode":"cctp_direct_composition","product_classification":"primary_direct","steps":[{"action":"swap","aggregator_api_used":false,"assetfare_fee_bps":0,"direct_protocol":true,"external_intent_protocol":false,"from":"base:ETH","index":0,"provider":"uniswap_v3","to":"base:USDC"},{"action":"bridge","aggregator_api_used":false,"assetfare_fee_bps":1,"direct_protocol":true,"external_intent_protocol":false,"from":"base:USDC","index":1,"provider":"circle_cctp","to":"solana:USDC"},{"action":"swap","aggregator_api_used":false,"assetfare_fee_bps":0,"direct_protocol":true,"external_intent_protocol":false,"from":"solana:USDC","index":2,"provider":"raydium_clmm","to":"solana:SOL"}]},"base:ETH->solana:USDC":{"classification":"direct_protocol_only","mode":"cctp_direct_composition","product_classification":"primary_direct","steps":[{"action":"swap","aggregator_api_used":false,"assetfare_fee_bps":0,"direct_protocol":true,"external_intent_protocol":false,"from":"base:ETH","index":0,"provider":"uniswap_v3","to":"base:USDC"},{"action":"bridge","aggregator_api_used":false,"assetfare_fee_bps":1,"direct_protocol":true,"external_intent_protocol":false,"from":"base:USDC","index":1,"provider":"circle_cctp","to":"solana:USDC"}]},"base:ETH->solana:USDG":{"classification":"direct_protocol_only","mode":"cctp_direct_composition","product_classification":"primary_direct","steps":[{"action":"swap","aggregator_api_used":false,"assetfare_fee_bps":0,"direct_protocol":true,"external_intent_protocol":false,"from":"base:ETH","index":0,"provider":"uniswap_v3","to":"base:USDC"},{"action":"bridge","aggregator_api_used":false,"assetfare_fee_bps":1,"direct_protocol":true,"external_intent_protocol":false,"from":"base:USDC","index":1,"provider":"circle_cctp","to":"solana:USDC"},{"action":"swap","aggregator_api_used":false,"assetfare_fee_bps":0,"direct_protocol":true,"external_intent_protocol":false,"from":"solana:USDC","index":2,"provider":"orca_whirlpool","to":"solana:USDG"}]},"base:USDC->base:ETH":{"classification":"direct_protocol_only","mode":"same_chain_direct","product_classification":"primary_direct","steps":[{"action":"swap","aggregator_api_used":false,"assetfare_fee_bps":1,"direct_protocol":true,"external_intent_protocol":false,"from":"base:USDC","index":0,"provider":"uniswap_v3","to":"base:ETH"}]},"base:USDC->robinhood:USDG":{"classification":"direct_protocol_only","mode":"robinhood_paxos_ingress_composition","product_classification":"primary_direct","steps":[{"action":"bridge","aggregator_api_used":false,"assetfare_fee_bps":1,"direct_protocol":true,"external_intent_protocol":false,"from":"base:USDC","index":0,"provider":"circle_cctp","to":"solana:USDC"},{"action":"swap","aggregator_api_used":false,"assetfare_fee_bps":0,"direct_protocol":true,"external_intent_protocol":false,"from":"solana:USDC","index":1,"provider":"orca_whirlpool","to":"solana:USDG"},{"action":"bridge","aggregator_api_used":false,"assetfare_fee_bps":0,"direct_protocol":true,"external_intent_protocol":false,"from":"solana:USDG","index":2,"provider":"paxos_usdg_layerzero_oft","to":"robinhood:USDG"}]},"base:USDC->solana:SOL":{"classification":"direct_protocol_only","mode":"cctp_direct_composition","product_classification":"primary_direct","steps":[{"action":"bridge","aggregator_api_used":false,"assetfare_fee_bps":1,"direct_protocol":true,"external_intent_protocol":false,"from":"base:USDC","index":0,"provider":"circle_cctp","to":"solana:USDC"},{"action":"swap","aggregator_api_used":false,"assetfare_fee_bps":0,"direct_protocol":true,"external_intent_protocol":false,"from":"solana:USDC","index":1,"provider":"raydium_clmm","to":"solana:SOL"}]},"base:USDC->solana:USDC":{"classification":"direct_protocol_only","mode":"cctp_direct_composition","product_classification":"primary_direct","steps":[{"action":"bridge","aggregator_api_used":false,"assetfare_fee_bps":1,"direct_protocol":true,"external_intent_protocol":false,"from":"base:USDC","index":0,"provider":"circle_cctp","to":"solana:USDC"}]},"base:USDC->solana:USDG":{"classification":"direct_protocol_only","mode":"cctp_direct_composition","product_classification":"primary_direct","steps":[{"action":"bridge","aggregator_api_used":false,"assetfare_fee_bps":1,"direct_protocol":true,"external_intent_protocol":false,"from":"base:USDC","index":0,"provider":"circle_cctp","to":"solana:USDC"},{"action":"swap","aggregator_api_used":false,"assetfare_fee_bps":0,"direct_protocol":true,"external_intent_protocol":false,"from":"solana:USDC","index":1,"provider":"orca_whirlpool","to":"solana:USDG"}]},"cronos:USDC->base:USDC":{"classification":"direct_protocol_only","mode":"cctp_direct_composition","product_classification":"primary_direct","steps":[{"action":"bridge","aggregator_api_used":false,"assetfare_fee_bps":1,"direct_protocol":true,"external_intent_protocol":false,"from":"cronos:USDC","index":0,"provider":"circle_cctp","to":"base:USDC"}]},"cronos:USDC->solana:USDC":{"classification":"direct_protocol_only","mode":"cctp_direct_composition","product_classification":"primary_direct","steps":[{"action":"bridge","aggregator_api_used":false,"assetfare_fee_bps":1,"direct_protocol":true,"external_intent_protocol":false,"from":"cronos:USDC","index":0,"provider":"circle_cctp","to":"solana:USDC"}]},"ethereum:USDC->solana:USDC":{"classification":"direct_protocol_only","mode":"cctp_direct_composition","product_classification":"primary_direct","steps":[{"action":"bridge","aggregator_api_used":false,"assetfare_fee_bps":1,"direct_protocol":true,"external_intent_protocol":false,"from":"ethereum:USDC","index":0,"provider":"circle_cctp","to":"solana:USDC"}]},"hyperevm:USDC->solana:USDC":{"classification":"direct_protocol_only","mode":"cctp_direct_composition","product_classification":"primary_direct","steps":[{"action":"bridge","aggregator_api_used":false,"assetfare_fee_bps":1,"direct_protocol":true,"external_intent_protocol":false,"from":"hyperevm:USDC","index":0,"provider":"circle_cctp","to":"solana:USDC"}]},"injective:USDC->base:USDC":{"classification":"direct_protocol_only","mode":"cctp_direct_composition","product_classification":"primary_direct","steps":[{"action":"bridge","aggregator_api_used":false,"assetfare_fee_bps":1,"direct_protocol":true,"external_intent_protocol":false,"from":"injective:USDC","index":0,"provider":"circle_cctp","to":"base:USDC"}]},"injective:USDC->solana:USDC":{"classification":"direct_protocol_only","mode":"cctp_direct_composition","product_classification":"primary_direct","steps":[{"action":"bridge","aggregator_api_used":false,"assetfare_fee_bps":1,"direct_protocol":true,"external_intent_protocol":false,"from":"injective:USDC","index":0,"provider":"circle_cctp","to":"solana:USDC"}]},"ink:USDC->solana:USDC":{"classification":"direct_protocol_only","mode":"cctp_direct_composition","product_classification":"primary_direct","steps":[{"action":"bridge","aggregator_api_used":false,"assetfare_fee_bps":1,"direct_protocol":true,"external_intent_protocol":false,"from":"ink:USDC","index":0,"provider":"circle_cctp","to":"solana:USDC"}]},"linea:USDC->base:USDC":{"classification":"direct_protocol_only","mode":"cctp_direct_composition","product_classification":"primary_direct","steps":[{"action":"bridge","aggregator_api_used":false,"assetfare_fee_bps":1,"direct_protocol":true,"external_intent_protocol":false,"from":"linea:USDC","index":0,"provider":"circle_cctp","to":"base:USDC"}]},"linea:USDC->solana:USDC":{"classification":"direct_protocol_only","mode":"cctp_direct_composition","product_classification":"primary_direct","steps":[{"action":"bridge","aggregator_api_used":false,"assetfare_fee_bps":1,"direct_protocol":true,"external_intent_protocol":false,"from":"linea:USDC","index":0,"provider":"circle_cctp","to":"solana:USDC"}]},"monad:USDC->base:USDC":{"classification":"direct_protocol_only","mode":"cctp_direct_composition","product_classification":"primary_direct","steps":[{"action":"bridge","aggregator_api_used":false,"assetfare_fee_bps":1,"direct_protocol":true,"external_intent_protocol":false,"from":"monad:USDC","index":0,"provider":"circle_cctp","to":"base:USDC"}]},"monad:USDC->solana:USDC":{"classification":"direct_protocol_only","mode":"cctp_direct_composition","product_classification":"primary_direct","steps":[{"action":"bridge","aggregator_api_used":false,"assetfare_fee_bps":1,"direct_protocol":true,"external_intent_protocol":false,"from":"monad:USDC","index":0,"provider":"circle_cctp","to":"solana:USDC"}]},"optimism:USDC->base:USDC":{"classification":"direct_protocol_only","mode":"optimism_source_cctp","product_classification":"primary_direct","steps":[{"action":"bridge","aggregator_api_used":false,"assetfare_fee_bps":1,"direct_protocol":true,"external_intent_protocol":false,"from":"optimism:USDC","index":0,"provider":"circle_cctp","to":"base:USDC"},{"action":"receive","aggregator_api_used":false,"assetfare_fee_bps":0,"direct_protocol":true,"external_intent_protocol":false,"from":"base:USDC","index":1,"provider":"circle_cctp_receive","to":"base:USDC"}]},"robinhood:ETH->arbitrum:USDC":{"classification":"direct_protocol_only","mode":"robinhood_paxos_egress_composition","product_classification":"primary_direct","steps":[{"action":"swap","aggregator_api_used":false,"assetfare_fee_bps":0,"direct_protocol":true,"external_intent_protocol":false,"from":"robinhood:ETH","index":0,"provider":"uniswap_v3","to":"robinhood:USDG"},{"action":"bridge","aggregator_api_used":false,"assetfare_fee_bps":1,"direct_protocol":true,"external_intent_protocol":false,"from":"robinhood:USDG","index":1,"provider":"paxos_usdg_layerzero_oft","to":"solana:USDG"},{"action":"swap","aggregator_api_used":false,"assetfare_fee_bps":0,"direct_protocol":true,"external_intent_protocol":false,"from":"solana:USDG","index":2,"provider":"orca_whirlpool","to":"solana:USDC"},{"action":"bridge","aggregator_api_used":false,"assetfare_fee_bps":0,"direct_protocol":true,"external_intent_protocol":false,"from":"solana:USDC","index":3,"provider":"circle_cctp","to":"arbitrum:USDC"}]},"robinhood:ETH->base:USDC":{"classification":"direct_protocol_only","mode":"robinhood_paxos_egress_composition","product_classification":"primary_direct","steps":[{"action":"swap","aggregator_api_used":false,"assetfare_fee_bps":0,"direct_protocol":true,"external_intent_protocol":false,"from":"robinhood:ETH","index":0,"provider":"uniswap_v3","to":"robinhood:USDG"},{"action":"bridge","aggregator_api_used":false,"assetfare_fee_bps":1,"direct_protocol":true,"external_intent_protocol":false,"from":"robinhood:USDG","index":1,"provider":"paxos_usdg_layerzero_oft","to":"solana:USDG"},{"action":"swap","aggregator_api_used":false,"assetfare_fee_bps":0,"direct_protocol":true,"external_intent_protocol":false,"from":"solana:USDG","index":2,"provider":"orca_whirlpool","to":"solana:USDC"},{"action":"bridge","aggregator_api_used":false,"assetfare_fee_bps":0,"direct_protocol":true,"external_intent_protocol":false,"from":"solana:USDC","index":3,"provider":"circle_cctp","to":"base:USDC"}]},"robinhood:ETH->robinhood:USDG":{"classification":"direct_protocol_only","mode":"same_chain_direct","product_classification":"primary_direct","steps":[{"action":"swap","aggregator_api_used":false,"assetfare_fee_bps":1,"direct_protocol":true,"external_intent_protocol":false,"from":"robinhood:ETH","index":0,"provider":"uniswap_v3","to":"robinhood:USDG"}]},"robinhood:ETH->solana:SOL":{"classification":"direct_protocol_only","mode":"robinhood_paxos_egress_composition","product_classification":"primary_direct","steps":[{"action":"swap","aggregator_api_used":false,"assetfare_fee_bps":0,"direct_protocol":true,"external_intent_protocol":false,"from":"robinhood:ETH","index":0,"provider":"uniswap_v3","to":"robinhood:USDG"},{"action":"bridge","aggregator_api_used":false,"assetfare_fee_bps":1,"direct_protocol":true,"external_intent_protocol":false,"from":"robinhood:USDG","index":1,"provider":"paxos_usdg_layerzero_oft","to":"solana:USDG"},{"action":"swap","aggregator_api_used":false,"assetfare_fee_bps":0,"direct_protocol":true,"external_intent_protocol":false,"from":"solana:USDG","index":2,"provider":"orca_whirlpool","to":"solana:USDC"},{"action":"swap","aggregator_api_used":false,"assetfare_fee_bps":0,"direct_protocol":true,"external_intent_protocol":false,"from":"solana:USDC","index":3,"provider":"raydium_clmm","to":"solana:SOL"}]},"robinhood:ETH->solana:USDC":{"classification":"direct_protocol_only","mode":"robinhood_paxos_egress_composition","product_classification":"primary_direct","steps":[{"action":"swap","aggregator_api_used":false,"assetfare_fee_bps":0,"direct_protocol":true,"external_intent_protocol":false,"from":"robinhood:ETH","index":0,"provider":"uniswap_v3","to":"robinhood:USDG"},{"action":"bridge","aggregator_api_used":false,"assetfare_fee_bps":1,"direct_protocol":true,"external_intent_protocol":false,"from":"robinhood:USDG","index":1,"provider":"paxos_usdg_layerzero_oft","to":"solana:USDG"},{"action":"swap","aggregator_api_used":false,"assetfare_fee_bps":0,"direct_protocol":true,"external_intent_protocol":false,"from":"solana:USDG","index":2,"provider":"orca_whirlpool","to":"solana:USDC"}]},"robinhood:ETH->solana:USDG":{"classification":"direct_protocol_only","mode":"robinhood_paxos_egress_composition","product_classification":"primary_direct","steps":[{"action":"swap","aggregator_api_used":false,"assetfare_fee_bps":0,"direct_protocol":true,"external_intent_protocol":false,"from":"robinhood:ETH","index":0,"provider":"uniswap_v3","to":"robinhood:USDG"},{"action":"bridge","aggregator_api_used":false,"assetfare_fee_bps":1,"direct_protocol":true,"external_intent_protocol":false,"from":"robinhood:USDG","index":1,"provider":"paxos_usdg_layerzero_oft","to":"solana:USDG"}]},"robinhood:USDG->arbitrum:USDC":{"classification":"direct_protocol_only","mode":"robinhood_paxos_egress_composition","product_classification":"primary_direct","steps":[{"action":"bridge","aggregator_api_used":false,"assetfare_fee_bps":1,"direct_protocol":true,"external_intent_protocol":false,"from":"robinhood:USDG","index":0,"provider":"paxos_usdg_layerzero_oft","to":"solana:USDG"},{"action":"swap","aggregator_api_used":false,"assetfare_fee_bps":0,"direct_protocol":true,"external_intent_protocol":false,"from":"solana:USDG","index":1,"provider":"orca_whirlpool","to":"solana:USDC"},{"action":"bridge","aggregator_api_used":false,"assetfare_fee_bps":0,"direct_protocol":true,"external_intent_protocol":false,"from":"solana:USDC","index":2,"provider":"circle_cctp","to":"arbitrum:USDC"}]},"robinhood:USDG->base:USDC":{"classification":"direct_protocol_only","mode":"robinhood_paxos_egress_composition","product_classification":"primary_direct","steps":[{"action":"bridge","aggregator_api_used":false,"assetfare_fee_bps":1,"direct_protocol":true,"external_intent_protocol":false,"from":"robinhood:USDG","index":0,"provider":"paxos_usdg_layerzero_oft","to":"solana:USDG"},{"action":"swap","aggregator_api_used":false,"assetfare_fee_bps":0,"direct_protocol":true,"external_intent_protocol":false,"from":"solana:USDG","index":1,"provider":"orca_whirlpool","to":"solana:USDC"},{"action":"bridge","aggregator_api_used":false,"assetfare_fee_bps":0,"direct_protocol":true,"external_intent_protocol":false,"from":"solana:USDC","index":2,"provider":"circle_cctp","to":"base:USDC"}]},"robinhood:USDG->robinhood:ETH":{"classification":"direct_protocol_only","mode":"same_chain_direct","product_classification":"primary_direct","steps":[{"action":"swap","aggregator_api_used":false,"assetfare_fee_bps":1,"direct_protocol":true,"external_intent_protocol":false,"from":"robinhood:USDG","index":0,"provider":"uniswap_v3","to":"robinhood:ETH"}]},"robinhood:USDG->solana:SOL":{"classification":"direct_protocol_only","mode":"robinhood_paxos_egress_composition","product_classification":"primary_direct","steps":[{"action":"bridge","aggregator_api_used":false,"assetfare_fee_bps":1,"direct_protocol":true,"external_intent_protocol":false,"from":"robinhood:USDG","index":0,"provider":"paxos_usdg_layerzero_oft","to":"solana:USDG"},{"action":"swap","aggregator_api_used":false,"assetfare_fee_bps":0,"direct_protocol":true,"external_intent_protocol":false,"from":"solana:USDG","index":1,"provider":"orca_whirlpool","to":"solana:USDC"},{"action":"swap","aggregator_api_used":false,"assetfare_fee_bps":0,"direct_protocol":true,"external_intent_protocol":false,"from":"solana:USDC","index":2,"provider":"raydium_clmm","to":"solana:SOL"}]},"robinhood:USDG->solana:USDC":{"classification":"direct_protocol_only","mode":"robinhood_paxos_egress_composition","product_classification":"primary_direct","steps":[{"action":"bridge","aggregator_api_used":false,"assetfare_fee_bps":1,"direct_protocol":true,"external_intent_protocol":false,"from":"robinhood:USDG","index":0,"provider":"paxos_usdg_layerzero_oft","to":"solana:USDG"},{"action":"swap","aggregator_api_used":false,"assetfare_fee_bps":0,"direct_protocol":true,"external_intent_protocol":false,"from":"solana:USDG","index":1,"provider":"orca_whirlpool","to":"solana:USDC"}]},"sei:USDC->base:USDC":{"classification":"direct_protocol_only","mode":"cctp_direct_composition","product_classification":"primary_direct","steps":[{"action":"bridge","aggregator_api_used":false,"assetfare_fee_bps":1,"direct_protocol":true,"external_intent_protocol":false,"from":"sei:USDC","index":0,"provider":"circle_cctp","to":"base:USDC"}]},"sei:USDC->solana:USDC":{"classification":"direct_protocol_only","mode":"cctp_direct_composition","product_classification":"primary_direct","steps":[{"action":"bridge","aggregator_api_used":false,"assetfare_fee_bps":1,"direct_protocol":true,"external_intent_protocol":false,"from":"sei:USDC","index":0,"provider":"circle_cctp","to":"solana:USDC"}]},"solana:SOL->base:USDC":{"classification":"direct_protocol_only","mode":"cctp_direct_composition","product_classification":"primary_direct","steps":[{"action":"swap","aggregator_api_used":false,"assetfare_fee_bps":0,"direct_protocol":true,"external_intent_protocol":false,"from":"solana:SOL","index":0,"provider":"raydium_clmm","to":"solana:USDC"},{"action":"bridge","aggregator_api_used":false,"assetfare_fee_bps":1,"direct_protocol":true,"external_intent_protocol":false,"from":"solana:USDC","index":1,"provider":"circle_cctp","to":"base:USDC"}]},"solana:SOL->robinhood:ETH":{"classification":"direct_protocol_only","mode":"robinhood_paxos_ingress_composition","product_classification":"primary_direct","steps":[{"action":"swap","aggregator_api_used":false,"assetfare_fee_bps":1,"direct_protocol":true,"external_intent_protocol":false,"from":"solana:SOL","index":0,"provider":"raydium_clmm","to":"solana:USDC"},{"action":"swap","aggregator_api_used":false,"assetfare_fee_bps":0,"direct_protocol":true,"external_intent_protocol":false,"from":"solana:USDC","index":1,"provider":"orca_whirlpool","to":"solana:USDG"},{"action":"bridge","aggregator_api_used":false,"assetfare_fee_bps":0,"direct_protocol":true,"external_intent_protocol":false,"from":"solana:USDG","index":2,"provider":"paxos_usdg_layerzero_oft","to":"robinhood:USDG"},{"action":"swap","aggregator_api_used":false,"assetfare_fee_bps":0,"direct_protocol":true,"external_intent_protocol":false,"from":"robinhood:USDG","index":3,"provider":"uniswap_v3","to":"robinhood:ETH"}]},"solana:SOL->robinhood:USDG":{"classification":"direct_protocol_only","mode":"robinhood_paxos_ingress_composition","product_classification":"primary_direct","steps":[{"action":"swap","aggregator_api_used":false,"assetfare_fee_bps":1,"direct_protocol":true,"external_intent_protocol":false,"from":"solana:SOL","index":0,"provider":"raydium_clmm","to":"solana:USDC"},{"action":"swap","aggregator_api_used":false,"assetfare_fee_bps":0,"direct_protocol":true,"external_intent_protocol":false,"from":"solana:USDC","index":1,"provider":"orca_whirlpool","to":"solana:USDG"},{"action":"bridge","aggregator_api_used":false,"assetfare_fee_bps":0,"direct_protocol":true,"external_intent_protocol":false,"from":"solana:USDG","index":2,"provider":"paxos_usdg_layerzero_oft","to":"robinhood:USDG"}]},"solana:SOL->solana:USDC":{"classification":"direct_protocol_only","mode":"same_chain_direct","product_classification":"primary_direct","steps":[{"action":"swap","aggregator_api_used":false,"assetfare_fee_bps":1,"direct_protocol":true,"external_intent_protocol":false,"from":"solana:SOL","index":0,"provider":"raydium_clmm","to":"solana:USDC"}]},"solana:SOL->solana:USDG":{"classification":"direct_protocol_only","mode":"same_chain_direct_composition","product_classification":"primary_direct","steps":[{"action":"swap","aggregator_api_used":false,"assetfare_fee_bps":0,"direct_protocol":true,"external_intent_protocol":false,"from":"solana:SOL","index":0,"provider":"raydium_clmm","to":"solana:USDC"},{"action":"swap","aggregator_api_used":false,"assetfare_fee_bps":1,"direct_protocol":true,"external_intent_protocol":false,"from":"solana:USDC","index":1,"provider":"orca_whirlpool","to":"solana:USDG"}]},"solana:USDC->arbitrum:USDC":{"classification":"direct_protocol_only","mode":"cctp_direct_composition","product_classification":"primary_direct","steps":[{"action":"bridge","aggregator_api_used":false,"assetfare_fee_bps":1,"direct_protocol":true,"external_intent_protocol":false,"from":"solana:USDC","index":0,"provider":"circle_cctp","to":"arbitrum:USDC"}]},"solana:USDC->base:USDC":{"classification":"direct_protocol_only","mode":"cctp_direct_composition","product_classification":"primary_direct","steps":[{"action":"bridge","aggregator_api_used":false,"assetfare_fee_bps":1,"direct_protocol":true,"external_intent_protocol":false,"from":"solana:USDC","index":0,"provider":"circle_cctp","to":"base:USDC"}]},"solana:USDC->robinhood:ETH":{"classification":"direct_protocol_only","mode":"robinhood_paxos_ingress_composition","product_classification":"primary_direct","steps":[{"action":"swap","aggregator_api_used":false,"assetfare_fee_bps":1,"direct_protocol":true,"external_intent_protocol":false,"from":"solana:USDC","index":0,"provider":"orca_whirlpool","to":"solana:USDG"},{"action":"bridge","aggregator_api_used":false,"assetfare_fee_bps":0,"direct_protocol":true,"external_intent_protocol":false,"from":"solana:USDG","index":1,"provider":"paxos_usdg_layerzero_oft","to":"robinhood:USDG"},{"action":"swap","aggregator_api_used":false,"assetfare_fee_bps":0,"direct_protocol":true,"external_intent_protocol":false,"from":"robinhood:USDG","index":2,"provider":"uniswap_v3","to":"robinhood:ETH"}]},"solana:USDC->robinhood:USDG":{"classification":"direct_protocol_only","mode":"robinhood_paxos_ingress_composition","product_classification":"primary_direct","steps":[{"action":"swap","aggregator_api_used":false,"assetfare_fee_bps":1,"direct_protocol":true,"external_intent_protocol":false,"from":"solana:USDC","index":0,"provider":"orca_whirlpool","to":"solana:USDG"},{"action":"bridge","aggregator_api_used":false,"assetfare_fee_bps":0,"direct_protocol":true,"external_intent_protocol":false,"from":"solana:USDG","index":1,"provider":"paxos_usdg_layerzero_oft","to":"robinhood:USDG"}]},"solana:USDG->arbitrum:ETH":{"classification":"direct_protocol_only","mode":"cctp_direct_composition","product_classification":"primary_direct","steps":[{"action":"swap","aggregator_api_used":false,"assetfare_fee_bps":0,"direct_protocol":true,"external_intent_protocol":false,"from":"solana:USDG","index":0,"provider":"orca_whirlpool","to":"solana:USDC"},{"action":"bridge","aggregator_api_used":false,"assetfare_fee_bps":1,"direct_protocol":true,"external_intent_protocol":false,"from":"solana:USDC","index":1,"provider":"circle_cctp","to":"arbitrum:USDC"},{"action":"swap","aggregator_api_used":false,"assetfare_fee_bps":0,"direct_protocol":true,"external_intent_protocol":false,"from":"arbitrum:USDC","index":2,"provider":"uniswap_v3","to":"arbitrum:ETH"}]},"solana:USDG->arbitrum:USDC":{"classification":"direct_protocol_only","mode":"cctp_direct_composition","product_classification":"primary_direct","steps":[{"action":"swap","aggregator_api_used":false,"assetfare_fee_bps":0,"direct_protocol":true,"external_intent_protocol":false,"from":"solana:USDG","index":0,"provider":"orca_whirlpool","to":"solana:USDC"},{"action":"bridge","aggregator_api_used":false,"assetfare_fee_bps":1,"direct_protocol":true,"external_intent_protocol":false,"from":"solana:USDC","index":1,"provider":"circle_cctp","to":"arbitrum:USDC"}]},"solana:USDG->base:USDC":{"classification":"direct_protocol_only","mode":"cctp_direct_composition","product_classification":"primary_direct","steps":[{"action":"swap","aggregator_api_used":false,"assetfare_fee_bps":0,"direct_protocol":true,"external_intent_protocol":false,"from":"solana:USDG","index":0,"provider":"orca_whirlpool","to":"solana:USDC"},{"action":"bridge","aggregator_api_used":false,"assetfare_fee_bps":1,"direct_protocol":true,"external_intent_protocol":false,"from":"solana:USDC","index":1,"provider":"circle_cctp","to":"base:USDC"}]},"solana:USDG->robinhood:ETH":{"classification":"direct_protocol_only","mode":"robinhood_paxos_ingress_composition","product_classification":"primary_direct","steps":[{"action":"bridge","aggregator_api_used":false,"assetfare_fee_bps":0,"direct_protocol":true,"external_intent_protocol":false,"from":"solana:USDG","index":0,"provider":"paxos_usdg_layerzero_oft","to":"robinhood:USDG"},{"action":"swap","aggregator_api_used":false,"assetfare_fee_bps":1,"direct_protocol":true,"external_intent_protocol":false,"from":"robinhood:USDG","index":1,"provider":"uniswap_v3","to":"robinhood:ETH"}]},"solana:USDG->robinhood:USDG":{"classification":"direct_protocol_only","mode":"robinhood_paxos_ingress_composition","product_classification":"primary_direct","steps":[{"action":"bridge","aggregator_api_used":false,"assetfare_fee_bps":1,"direct_protocol":true,"external_intent_protocol":false,"from":"solana:USDG","index":0,"provider":"paxos_usdg_layerzero_oft","to":"robinhood:USDG"}]},"sonic:USDC->base:USDC":{"classification":"direct_protocol_only","mode":"cctp_direct_composition","product_classification":"primary_direct","steps":[{"action":"bridge","aggregator_api_used":false,"assetfare_fee_bps":1,"direct_protocol":true,"external_intent_protocol":false,"from":"sonic:USDC","index":0,"provider":"circle_cctp","to":"base:USDC"}]},"sonic:USDC->solana:USDC":{"classification":"direct_protocol_only","mode":"cctp_direct_composition","product_classification":"primary_direct","steps":[{"action":"bridge","aggregator_api_used":false,"assetfare_fee_bps":1,"direct_protocol":true,"external_intent_protocol":false,"from":"sonic:USDC","index":0,"provider":"circle_cctp","to":"solana:USDC"}]},"unichain:USDC->solana:USDC":{"classification":"direct_protocol_only","mode":"cctp_direct_composition","product_classification":"primary_direct","steps":[{"action":"bridge","aggregator_api_used":false,"assetfare_fee_bps":1,"direct_protocol":true,"external_intent_protocol":false,"from":"unichain:USDC","index":0,"provider":"circle_cctp","to":"solana:USDC"}]},"xlayer:USDC->base:USDC":{"classification":"direct_protocol_only","mode":"cctp_direct_composition","product_classification":"primary_direct","steps":[{"action":"bridge","aggregator_api_used":false,"assetfare_fee_bps":1,"direct_protocol":true,"external_intent_protocol":false,"from":"xlayer:USDC","index":0,"provider":"circle_cctp","to":"base:USDC"}]},"xlayer:USDC->solana:USDC":{"classification":"direct_protocol_only","mode":"cctp_direct_composition","product_classification":"primary_direct","steps":[{"action":"bridge","aggregator_api_used":false,"assetfare_fee_bps":1,"direct_protocol":true,"external_intent_protocol":false,"from":"xlayer:USDC","index":0,"provider":"circle_cctp","to":"solana:USDC"}]}}

const SUMMARY_KEYS = Object.freeze([
  'version', 'route', 'from', 'to', 'classification', 'mode',
  'product_classification', 'economic_eligibility', 'public_execution_eligible',
  'primary_selection_eligible', 'route_minimum_guard_bps',
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
  'external_intent_protocol_used', 'product_classification', 'economic_eligibility',
  'public_execution_eligible', 'primary_selection_eligible', 'route_minimum_guard_bps',
  'server_signing', 'server_submission',
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
const PINNED_ROUTE_CONTRACT_SHA256 = 'ee9237e324821bf625f22da048733d3708cac9e0047da4340e19cd6be597e063'

export function buildRouteContract() {
  const routes = ROUTE_CONTRACT_DATA
  const stepCount = Object.values(routes).reduce((sum, value) => sum + value.steps.length, 0)
  if (Object.keys(routes).length !== 65 || stepCount !== 118) throw new Error('assetfare_contract_internal_invalid')
  return Object.freeze({
    version: 'assetfare-public-route-product-contract-v2',
    route_count: 65,
    step_count: 118,
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
      value.route_aggregator_used !== false || value.directed_conversion_routes !== 65 ||
      value.unsigned_route_plans_ready !== 65 || value.execution_ready_routes !== 65) {
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
      direct.required_on_every_quote !== true || direct.route_count !== 65 || direct.step_count !== 118 ||
      direct.ordered_provider_path !== true || direct.normalized_chain_asset_endpoints !== true ||
      direct.base_unit_amounts_are_decimal_strings !== true || direct.assetfare_fee_step_bound !== true ||
      direct.route_aggregator_used_scope !== 'assetfare_engine_only' ||
      direct.external_intent !== 'No public route uses an external intent protocol; provider-internal liquidity sourcing or aggregation remains possible' ||
      direct.server_signing !== false || direct.server_submission !== false ||
      JSON.stringify(direct.classification_values) !== JSON.stringify(['direct_protocol_only', 'external_intent'])) {
    throw new Error('assetfare_capabilities_invalid')
  }
  const guidance = value.evaluation_guidance
  if (!isObject(guidance) || guidance.always_compare_fresh_at_intended_amount !== true ||
      guidance.schema_version !== 5 || guidance.documentation_example_usd !== 1000 || guidance.reachability_smoke_usd !== 1 ||
      guidance.reachability_smoke_scope !== 'connectivity_only_not_economic_evaluation' ||
      guidance.not_guaranteed_best !== true || guidance.not_a_minimum !== true || guidance.route_minimum_usd !== 1 ||
      !isObject(guidance.route_specific_guidance) || guidance.route_specific_guidance.public_active_routes !== 65 ||
      guidance.route_specific_guidance.public_inactive_routes !== 35 ||
      guidance.route_specific_guidance.amount_specific_product_gates !== false ||
      guidance.route_specific_guidance.competitor_rankings_public_product !== false) {
    throw new Error('assetfare_capabilities_invalid')
  }
  return {
    version: value.version,
    status: value.status,
    amount_usd: { minimum: 1, maximum: null, policy: 'no_business_maximum' },
    asset_endpoints: endpoints.map((item) => ({ chain: item.chain, token: item.token })),
    directed_conversion_routes: 65,
    direct_route_summary: {
      version: direct.version,
      required_on_every_quote: true,
      route_count: 65,
      step_count: 118,
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
      documentation_example_usd: 1000,
      not_a_minimum: true,
      not_guaranteed_best: true,
      reachability_smoke_scope: 'connectivity_only_not_economic_evaluation',
      reachability_smoke_usd: 1,
      route_minimum_usd: 1,
      route_specific_guidance: { ...guidance.route_specific_guidance },
      schema_version: 5,
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
      summary.mode !== definition.mode || summary.classification !== definition.classification ||
      summary.product_classification !== definition.product_classification ||
      summary.economic_eligibility !== 'not_asserted_by_capability' ||
      summary.public_execution_eligible !== true || summary.primary_selection_eligible !== true ||
      (summary.route_minimum_guard_bps !== null && summary.route_minimum_guard_bps !== 50)) {
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
      rawRoute.product_classification !== definition.product_classification ||
      rawRoute.economic_eligibility !== 'not_asserted_by_capability' ||
      rawRoute.public_execution_eligible !== true || rawRoute.primary_selection_eligible !== true ||
      rawRoute.route_minimum_guard_bps !== summary.route_minimum_guard_bps ||
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
