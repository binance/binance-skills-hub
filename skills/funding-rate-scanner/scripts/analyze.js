#!/usr/bin/env node
// Detailed analysis for a specific coin
const https = require('https');

const coin = process.argv[2];
if (!coin) {
  console.log('Usage: node analyze.js COIN');
  console.log('Example: node analyze.js DUSK');
  process.exit(1);
}

const symbol = coin.toUpperCase() + 'USDT';

Promise.all([
  fetch(`https://fapi.binance.com/fapi/v1/premiumIndex?symbol=${symbol}`),
  fetch(`https://fapi.binance.com/fapi/v1/fundingRate?symbol=${symbol}&limit=10`),
  fetch(`https://fapi.binance.com/fapi/v1/ticker/24hr?symbol=${symbol}`)
]).then(async ([idx, history, ticker]) => {
  const current = await idx.json();
  const rates = await history.json();
  const stats = await ticker.json();
  
  const rate = parseFloat(current.lastFundingRate) * 100;
  
  console.log(`=== ${coin.toUpperCase()} Analysis ===`);
  console.log('');
  console.log('Current Rate:', rate.toFixed(4) + '%');
  console.log('Annual (5x):', (rate * 3 * 365 * 5).toFixed(0) + '%');
  console.log('');
  console.log('24h Stats:');
  console.log('  Price:', parseFloat(stats.lastPrice).toFixed(4));
  console.log('  Change:', parseFloat(stats.priceChangePercent).toFixed(2) + '%');
  console.log('  Volume:', (parseFloat(stats.quoteVolume) / 1e6).toFixed(1) + 'M');
  console.log('');
  console.log('Recent Rates:');
  rates.slice(-5).forEach(r => {
    const rt = parseFloat(r.fundingRate) * 100;
    const time = new Date(r.fundingTime).toISOString().slice(5,16).replace('T',' ');
    console.log(' ', time, rt.toFixed(4) + '%');
  });
});

function fetch(url) {
  return new Promise((resolve, reject) => {
    https.get(url, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ json: () => JSON.parse(data) }));
    }).on('error', reject);
  });
}
