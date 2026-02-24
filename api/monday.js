const https = require('https');

const MONDAY_TOKEN = process.env.MONDAY_TOKEN;

const FALLBACK_TASKS = [
  { name: 'Empyre AI - Brand & Vision', status: 'Working on it', priority: 'High' },
  { name: 'clawdgod', status: 'Working on it', priority: 'High' },
  { name: 'youtube', status: 'Stuck', priority: 'High' },
  { name: 'Instagram @theoretika Setup', status: '', priority: 'Medium' },
  { name: 'Script Video #1 - Human Disappearance', status: '', priority: 'Medium' },
  { name: 'Theoretika Logo & Banner Upload', status: '', priority: 'Medium' },
];

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 's-maxage=120');
  
  if (!MONDAY_TOKEN) {
    return res.json({ tasks: FALLBACK_TASKS });
  }
  
  const query = `{ boards(ids: 18399989313) { items_page(limit: 20) { items { id name column_values(ids: ["project_status", "priority_1"]) { id text } } } } }`;
  
  const data = JSON.stringify({ query });
  const options = {
    hostname: 'api.monday.com',
    path: '/v2',
    method: 'POST',
    headers: {
      'Authorization': MONDAY_TOKEN,
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
        try {
          const parsed = JSON.parse(body);
          const items = parsed?.data?.boards?.[0]?.items_page?.items || [];
          const tasks = items.map(item => {
            const cols = {};
            (item.column_values || []).forEach(c => { cols[c.id] = c.text; });
            return {
              name: item.name,
              status: cols.project_status || '',
              priority: cols.priority_1 || ''
            };
          }).filter(t => t.status !== 'Done');
          res.json({ tasks });
        } catch(e) {
          res.json({ tasks: FALLBACK_TASKS });
        }
        resolve();
      });
    });
    request.on('error', (e) => { res.json({ tasks: FALLBACK_TASKS }); resolve(); });
    request.write(data);
    request.end();
  });
};
