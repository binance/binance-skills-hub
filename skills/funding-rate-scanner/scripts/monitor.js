#!/usr/bin/env node
// Monitor specific coins funding rates
const https = require('https');

const coins = process.argv.slice(2);
if (coins.length === 0) {
  console.log('Usage: node monitor.js COIN1 COIN2 ...');
  console.log('Example: node monitor.js DUSK DASH AXS');
  process.exit(1);
}

const symbols = coins.map(c => c.toUpperCase() + 'USDT');

https.get('https://fapi.binance.com/fapi/v1/premiumIndex', res => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const rates = JSON.parse(data);
    console.log('=== Funding Rate Monitor ===');
    console.log('Coin'.padEnd(10), 'Rate'.padEnd(10), 'Annual(5x)');
    console.log('-'.repeat(35));
    
    for (const sym of symbols) {
      const r = rates.find(x => x.symbol === sym);
      if (r) {
        const rate = parseFloat(r.lastFundingRate) * 100;
        const annual = rate * 3 * 365 * 5;
        console.log(
          sym.replace('USDT','').padEnd(10),
          (rate.toFixed(3) + '%').padEnd(10),
          annual.toFixed(0) + '%'
        );
      }
    }
  });
});
