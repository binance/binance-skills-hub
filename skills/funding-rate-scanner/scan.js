#!/usr/bin/env node
/**
 * Binance Funding Rate Scanner
 * Scans all perpetual contracts for negative funding rates
 * No API key required - uses public endpoints
 */

const https = require('https');

const BINANCE_API = 'https://fapi.binance.com';
const NEGATIVE_THRESHOLD = -0.0001; // -0.01%

/**
 * Make HTTPS request
 */
function request(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

/**
 * Get all perpetual symbols
 */
async function getPerpetualSymbols() {
  const data = await request(`${BINANCE_API}/fapi/v1/exchangeInfo`);
  return data.symbols
    .filter(s => s.contractType === 'PERPETUAL' && s.status === 'TRADING')
    .map(s => s.symbol);
}

/**
 * Get current funding rates
 */
async function getFundingRates() {
  return await request(`${BINANCE_API}/fapi/v1/premiumIndex`);
}

/**
 * Calculate next funding time
 */
function getNextFundingTime(nextFundingTime) {
  const now = Date.now();
  const diff = nextFundingTime - now;
  const hours = Math.floor(diff / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  return `${hours}h ${minutes}m`;
}

/**
 * Scan funding rates and find opportunities
 */
async function scanFundingRates() {
  console.log('🔍 Scanning Binance funding rates...\n');

  const rates = await getFundingRates();
  const opportunities = rates
    .filter(r => parseFloat(r.lastFundingRate) < NEGATIVE_THRESHOLD)
    .map(r => ({
      symbol: r.symbol,
      rate: parseFloat(r.lastFundingRate),
      nextFunding: r.nextFundingTime,
      dailyEarnings: parseFloat(r.lastFundingRate) * 3 * 100 // 3 payments per day
    }))
    .sort((a, b) => a.rate - b.rate); // Most negative first

  if (opportunities.length === 0) {
    console.log('❌ No negative funding rate opportunities found.');
    return [];
  }

  console.log(`🔥 Found ${opportunities.length} Negative Funding Rate Opportunities\n`);
  
  opportunities.forEach(opp => {
    console.log(`Symbol: ${opp.symbol}`);
    console.log(`Funding Rate: ${(opp.rate * 100).toFixed(4)}%`);
    console.log(`Next Funding: ${getNextFundingTime(opp.nextFunding)}`);
    console.log(`Daily Earnings: ${Math.abs(opp.dailyEarnings).toFixed(4)}% (3 payments)`);
    console.log(`Recommendation: Open long position\n`);
  });

  return opportunities;
}

/**
 * Main execution
 */
if (require.main === module) {
  scanFundingRates().catch(err => {
    console.error('❌ Error:', err.message);
    process.exit(1);
  });
}

module.exports = { scanFundingRates, getPerpetualSymbols, getFundingRates };
