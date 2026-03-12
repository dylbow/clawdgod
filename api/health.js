const https = require('https');
const http = require('http');

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 's-maxage=10');
  
  // Try to reach the OpenClaw gateway status endpoint
  try {
    const data = await new Promise((resolve, reject) => {
      const request = http.get('http://127.0.0.1:18789/api/status', { 
        timeout: 3000 
      }, (response) => {
        let body = '';
        response.on('data', c => body += c);
        response.on('end', () => {
          try { resolve(JSON.parse(body)); } catch(e) { reject(e); }
        });
      });
      request.on('error', reject);
      request.on('timeout', () => { request.destroy(); reject(new Error('timeout')); });
    });
    
    res.json(data);
  } catch(e) {
    // Fallback — gateway not reachable from Vercel (expected)
    // Return a status that tells the frontend to check locally
    res.json({
      error: 'Gateway not reachable from Vercel (runs locally)',
      hint: 'Health check works when dashboard is served locally',
      status: 'remote'
    });
  }
};
