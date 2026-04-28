#!/usr/bin/env node
/**
 * Funding Rate Scanner - Find arbitrage opportunities
 */
const https = require('https');

const TOP_N = 10;

function fetch(url) {
  return new Promise((resolve, reject) => {
    https.get(url, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });
}

async function main() {
  console.log('Scanning Binance Futures funding rates...\n');
  
  const data = await fetch('https://fapi.binance.com/fapi/v1/premiumIndex');
  
  const rates = data
    .filter(d => d.symbol.endsWith('USDT'))
    .map(d => ({
      symbol: d.symbol.replace('USDT', ''),
      rate: parseFloat(d.lastFundingRate) * 100,
      price: parseFloat(d.markPrice)
    }))
    .sort((a, b) => a.rate - b.rate);
  
  console.log('=== Top Negative Funding Rates ===\n');
  console.log('Rank  Coin      Rate      Annual(5x)');
  console.log('─'.repeat(40));
  
  rates.slice(0, TOP_N).forEach((r, i) => {
    const annual = (r.rate * 3 * 365 * 5).toFixed(0);
    console.log(
      String(i + 1).padStart(2) + '    ' +
      r.symbol.padEnd(8) + '  ' +
      r.rate.toFixed(4).padStart(8) + '%  ' +
      (annual + '%').padStart(8)
    );
  });
  
  console.log('\n💡 Negative rate = longs earn from shorts');
  console.log('⚠️  Always use stop-loss!');
}

main().catch(console.error);
