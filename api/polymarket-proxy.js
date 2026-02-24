const https = require('https');

module.exports = (req, res) => {
  const proxyKey = req.headers['x-proxy-key'];
  if (proxyKey !== (process.env.POLY_PROXY_KEY || 'dylbot-poly-2026')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Get the target path from query param
  const targetPath = req.query.path || '/';
  const targetUrl = `https://clob.polymarket.com${targetPath}`;

  // Forward relevant headers
  const headers = {};
  const forwardHeaders = ['poly_address', 'poly_signature', 'poly_timestamp', 'poly_api_key', 'poly_passphrase', 'poly_nonce', 'content-type'];
  for (const h of forwardHeaders) {
    if (req.headers[h]) headers[h] = req.headers[h];
  }

  const url = new URL(targetUrl);
  const options = {
    hostname: url.hostname,
    path: url.pathname + url.search,
    method: req.method,
    headers: {
      ...headers,
      'User-Agent': '@polymarket/clob-client',
    },
  };

  const proxyReq = https.request(options, (proxyRes) => {
    let data = '';
    proxyRes.on('data', (chunk) => data += chunk);
    proxyRes.on('end', () => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Headers', '*');
      res.status(proxyRes.statusCode).send(data);
    });
  });

  proxyReq.on('error', (e) => {
    res.status(500).json({ error: e.message });
  });

  if (req.method === 'POST' || req.method === 'PUT') {
    const body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    proxyReq.write(body);
  }

  proxyReq.end();
};
