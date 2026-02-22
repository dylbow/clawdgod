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

module.exports = async (req, res) => {
  try {
    const [balance, positions] = await Promise.all([
      kalshiRequest('/portfolio/balance'),
      kalshiRequest('/portfolio/positions')
    ]);
    res.json({ balance, positions });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
};
