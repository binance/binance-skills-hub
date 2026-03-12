#!/usr/bin/env node
/**
 * Test script for Funding Rate Scanner
 */

const scanner = require('./scan.js');

async function test() {
  console.log('=== Testing Binance Funding Rate Scanner ===\n');

  try {
    // Test 1: Get perpetual symbols
    console.log('Test 1: Fetching perpetual symbols...');
    const symbols = await scanner.getPerpetualSymbols();
    console.log(`✅ Found ${symbols.length} perpetual contracts\n`);

    // Test 2: Get funding rates
    console.log('Test 2: Fetching funding rates...');
    const rates = await scanner.getFundingRates();
    console.log(`✅ Retrieved ${rates.length} funding rates\n`);

    // Test 3: Scan for opportunities
    console.log('Test 3: Scanning for negative funding opportunities...');
    const opportunities = await scanner.scanFundingRates();
    
    if (opportunities.length > 0) {
      console.log(`\n✅ All tests passed! Found ${opportunities.length} opportunities.`);
    } else {
      console.log('\n✅ All tests passed! No opportunities at this time.');
    }

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

test();
