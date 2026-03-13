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

// Fallback data when no private key configured (updated 2026-03-13 6:01 AM)
const FALLBACK = {
  balance: 6.83,
  portfolio_value: 3.05,
  total_value: 9.88,
  total_pnl: -21.03,
  positions: [
    { ticker: 'KXGDP-26APR30-T2.5', position: -2, exposure: 1.12, result: '' },
    { ticker: 'KXTAIWANLVL4-26JUL01', position: 5, exposure: 0.50, result: '' },
    { ticker: 'KXCABOUT-26MAR-PHEG', position: 3, exposure: 0.51, result: '' },
    { ticker: 'KXOAIANTH-40-OAI', position: 2, exposure: 0.82, result: '' }
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
    
    // Kalshi returns event_positions (not market_positions)
    const portfolio = positionsData.event_positions || positionsData.market_positions || [];
    
    let portfolioValue = 0;
    let totalPnl = 0;
    const positions = portfolio.map(p => {
      const exposure = parseFloat(p.event_exposure_dollars || p.market_exposure || 0);
      const cost = parseFloat(p.total_cost_dollars || 0);
      const realizedPnl = parseFloat(p.realized_pnl_dollars || 0);
      const shares = parseFloat(p.total_cost_shares_fp || p.position || 0);
      portfolioValue += exposure;
      totalPnl += realizedPnl;
      return {
        ticker: p.event_ticker || p.ticker,
        position: Math.round(shares),
        exposure: exposure,
        cost: cost,
        realized_pnl: realizedPnl,
        result: p.settlement_status === 'settled' ? (realizedPnl > 0 ? 'yes' : 'no') : ''
      };
    });
    
    // Calculate total P&L: current value - total invested
    const totalInvested = 30.83; // $20 + $11 deposits
    const netPnl = (balance + portfolioValue) - totalInvested;
    
    res.json({
      balance,
      portfolio_value: portfolioValue,
      total_value: balance + portfolioValue,
      total_pnl: netPnl,
      positions
    });
  } catch(e) {
    res.json(FALLBACK);
  }
};
