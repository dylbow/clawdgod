const crypto = require('crypto');
const https = require('https');

const API_KEY = "ff60a402-f21e-4be1-8226-3bede0becfe7";
const PRIVATE_KEY_PEM = process.env.KALSHI_PRIVATE_KEY;

function kalshiRequest(path) {
  return new Promise((resolve, reject) => {
    const timestamp = Date.now().toString();
    const message = timestamp + 'GET' + '/trade-api/v2' + path;
    const key = crypto.createPrivateKey(PRIVATE_KEY_PEM);
    const signature = crypto.sign('sha256', Buffer.from(message), {
      key, padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
      saltLength: crypto.constants.RSA_PSS_SALTLEN_MAX_LEN
    }).toString('base64');

    const options = {
      hostname: 'api.elections.kalshi.com',
      path: '/trade-api/v2' + path,
      headers: {
        'KALSHI-ACCESS-KEY': API_KEY,
        'KALSHI-ACCESS-TIMESTAMP': timestamp,
        'KALSHI-ACCESS-SIGNATURE': signature
      }
    };

    https.get(options, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch(e) { resolve({error: data}); }
      });
    }).on('error', reject);
  });
}

// Fallback data when no private key configured
const FALLBACK = {
  balance: 7.81,
  portfolio_value: 2.96,
  total_value: 10.77,
  total_pnl: -20.25,
  positions: [
    { ticker: 'KXHIGHCHI-26MAR01-T36', position: -1, exposure: 0.93, result: '' },
    { ticker: 'KXHIGHNY-26MAR01-T38', position: 1, exposure: 0.14, result: '' },
    { ticker: 'KXHIGHNY-26FEB28-T50', position: 1, exposure: 0.52, result: '' },
    { ticker: 'KXWARSHNOM-26MAR01-T0', position: 31, exposure: 1.68, result: '' },
    { ticker: 'KXBTCMINMON-BTC-26FEB28-6000000', position: 1, exposure: 0.47, result: '' },
    { ticker: 'KXOAIANTH-40-OAI', position: 2, exposure: 0.82, result: '' },
    { ticker: 'KXCABOUT-29JAN-PBON', position: 4, exposure: 0.88, result: '' },
    { ticker: 'KXCABLEAVE-26FEB-26FEB', position: 5, exposure: 1.00, result: '' },
  ]
};

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 's-maxage=30');
  
  if (!PRIVATE_KEY_PEM) {
    return res.json(FALLBACK);
  }
  
  try {
    const [balanceData, positionsData] = await Promise.all([
      kalshiRequest('/portfolio/balance'),
      kalshiRequest('/portfolio/positions')
    ]);
    
    const balance = balanceData.balance ? balanceData.balance / 100 : FALLBACK.balance;
    const portfolio = positionsData.market_positions || [];
    
    let portfolioValue = 0;
    const positions = portfolio.filter(p => p.total_traded > 0).map(p => {
      const pos = p.position || 0;
      const price = p.market_exposure ? (p.market_exposure / pos / 100) : 0;
      portfolioValue += (p.market_exposure || 0) / 100;
      return {
        ticker: p.ticker,
        position: pos,
        yes_price: Math.round(price * 100),
        exposure: (p.market_exposure || 0) / 100,
        result: p.settlement_status === 'settled' ? (p.realized_pnl > 0 ? 'yes' : 'no') : ''
      };
    });
    
    res.json({
      balance,
      portfolio_value: portfolioValue,
      total_value: balance + portfolioValue,
      total_pnl: (balanceData.pnl || 0) / 100,
      positions
    });
  } catch(e) {
    res.json(FALLBACK);
  }
};
