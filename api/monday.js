const https = require('https');

module.exports = async (req, res) => {
  const query = `{ boards(ids: 18399989313) { items_page(limit: 50) { items { id name column_values { id text } } } } }`;
  
  const data = JSON.stringify({ query });
  const options = {
    hostname: 'api.monday.com',
    path: '/v2',
    method: 'POST',
    headers: {
      'Authorization': process.env.MONDAY_TOKEN,
      'Content-Type': 'application/json',
      'API-Version': '2024-10',
      'Content-Length': Buffer.byteLength(data)
    }
  };

  return new Promise((resolve) => {
    const request = https.request(options, (response) => {
      let body = '';
      response.on('data', c => body += c);
      response.on('end', () => {
        try { res.json(JSON.parse(body)); } catch(e) { res.json({error: body}); }
        resolve();
      });
    });
    request.on('error', (e) => { res.status(500).json({error: e.message}); resolve(); });
    request.write(data);
    request.end();
  });
};
