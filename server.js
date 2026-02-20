// ClawdGod Dashboard — Local API Server
// Serves dashboard + proxies live data from Kalshi, YouTube, Monday.com

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = 3000;

// === CONFIG ===
const KALSHI_API_KEY = 'ff60a402-f21e-4be1-8226-3bede0becfe7';
const KALSHI_KEY_PATH = path.join(__dirname, '..', '..', '..', 'scripts', 'kalshi-private-key.pem');
const KALSHI_BASE = 'https://api.elections.kalshi.com';
const MONDAY_TOKEN_PATH = path.join(__dirname, '..', '..', '..', 'scripts', 'monday_token.txt');
const YT_CHANNEL_ID = 'UC_uHTi5uHWjR3gPslwWAlJw';

// Load keys
let kalshiPrivateKey;
try { kalshiPrivateKey = fs.readFileSync(KALSHI_KEY_PATH); } catch(e) { console.warn('No Kalshi key found'); }
let mondayToken;
try { mondayToken = fs.readFileSync(MONDAY_TOKEN_PATH, 'utf8').trim(); } catch(e) { console.warn('No Monday token found'); }

// === KALSHI AUTH ===
function kalshiSign(method, apiPath) {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const message = timestamp + method + apiPath;
    const sign = crypto.createSign('RSA-SHA256');
    sign.update(message);
    const signature = sign.sign({ key: kalshiPrivateKey, padding: crypto.constants.RSA_PKCS1_PSS_PADDING, saltLength: crypto.constants.RSA_PSS_SALTLEN_MAX_LENGTH }, 'base64');
    return { timestamp, signature };
}

function kalshiRequest(apiPath) {
    return new Promise((resolve, reject) => {
        const { timestamp, signature } = kalshiSign('GET', '/trade-api/v2' + apiPath);
        const options = {
            hostname: 'api.elections.kalshi.com',
            path: '/trade-api/v2' + apiPath,
            method: 'GET',
            headers: {
                'KALSHI-ACCESS-KEY': KALSHI_API_KEY,
                'KALSHI-ACCESS-SIGNATURE': signature,
                'KALSHI-ACCESS-TIMESTAMP': timestamp,
                'Content-Type': 'application/json'
            }
        };
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => {
                try { resolve(JSON.parse(data)); } catch(e) { reject(e); }
            });
        });
        req.on('error', reject);
        req.end();
    });
}

// === MONDAY.COM ===
function mondayQuery(query) {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify({ query });
        const options = {
            hostname: 'api.monday.com',
            path: '/v2',
            method: 'POST',
            headers: {
                'Authorization': mondayToken,
                'Content-Type': 'application/json',
                'API-Version': '2024-10',
                'Content-Length': Buffer.byteLength(data)
            }
        };
        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', c => body += c);
            res.on('end', () => {
                try { resolve(JSON.parse(body)); } catch(e) { reject(e); }
            });
        });
        req.on('error', reject);
        req.write(data);
        req.end();
    });
}

// === YOUTUBE (public, no API key needed for basic scraping via OpenClaw browser) ===
// We'll use the YouTube Data API v3 with no key for basic channel info
// Actually, we'll scrape from the browser snapshot data file

// === CACHE ===
const cache = {};
const CACHE_TTL = 60000; // 1 minute

function cached(key, ttl, fn) {
    if (cache[key] && Date.now() - cache[key].time < (ttl || CACHE_TTL)) {
        return Promise.resolve(cache[key].data);
    }
    return fn().then(data => {
        cache[key] = { data, time: Date.now() };
        return data;
    });
}

// === API ENDPOINTS ===
async function handleAPI(pathname, res) {
    try {
        if (pathname === '/api/kalshi') {
            const [balance, positions] = await Promise.all([
                cached('kalshi-balance', 30000, () => kalshiRequest('/portfolio/balance')),
                cached('kalshi-positions', 30000, () => kalshiRequest('/portfolio/positions'))
            ]);
            
            // Get market prices for each position
            const positionsWithPrices = [];
            for (const p of (positions.market_positions || [])) {
                let market = {};
                try {
                    const m = await cached('market-' + p.ticker, 60000, () => kalshiRequest('/markets/' + p.ticker));
                    market = m.market || {};
                } catch(e) {}
                positionsWithPrices.push({
                    ticker: p.ticker,
                    position: p.position,
                    exposure: p.market_exposure_dollars,
                    realized_pnl: p.realized_pnl_dollars,
                    yes_price: market.yes_ask || market.last_price,
                    result: market.result || '',
                    subtitle: market.subtitle || market.title || p.ticker
                });
            }
            
            // Calculate P&L
            const totalDeposited = 31; // $20 + $11 deposits
            const cashBalance = balance.balance / 100;
            const portfolioValue = positionsWithPrices.reduce((sum, p) => sum + (p.position * (p.yes_price || 0)), 0) / 100;
            const totalValue = cashBalance + portfolioValue;
            const totalPnL = totalValue - totalDeposited;
            
            res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
            res.end(JSON.stringify({
                balance: cashBalance,
                portfolio_value: portfolioValue,
                total_value: totalValue,
                total_deposited: totalDeposited,
                total_pnl: totalPnL,
                positions: positionsWithPrices
            }));
            
        } else if (pathname === '/api/monday') {
            const data = await cached('monday', 120000, () => 
                mondayQuery('{ boards(ids: 18399989313) { items_page(limit: 20) { items { id name column_values(ids: ["project_status", "priority_1", "date"]) { id text } } } } }')
            );
            const items = data?.data?.boards?.[0]?.items_page?.items || [];
            const tasks = items.map(item => ({
                id: item.id,
                name: item.name,
                status: item.column_values.find(c => c.id === 'project_status')?.text || '',
                priority: item.column_values.find(c => c.id === 'priority_1')?.text || '',
                due: item.column_values.find(c => c.id === 'date')?.text || ''
            })).filter(t => t.status !== 'Done' || Date.now() - new Date(t.due).getTime() < 7 * 86400000);
            
            res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
            res.end(JSON.stringify({ tasks }));
            
        } else if (pathname === '/api/youtube') {
            // Read from a local JSON file that we update periodically
            let ytData = { subscribers: 54, views: 4900, videos: 10, watchHours: 39.9 };
            try {
                const cached = fs.readFileSync(path.join(__dirname, 'youtube-data.json'), 'utf8');
                ytData = JSON.parse(cached);
            } catch(e) {}
            res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
            res.end(JSON.stringify(ytData));

        } else if (pathname === '/api/roi') {
            let roiData = {};
            try {
                roiData = JSON.parse(fs.readFileSync(path.join(__dirname, 'roi-data.json'), 'utf8'));
            } catch(e) {}
            
            // Calculate totals
            let totalCosts = 0;
            const costBreakdown = {};
            
            const now = new Date();
            const startDate = new Date('2026-02-01');
            const monthsActive = Math.max(1, (now - startDate) / (30 * 86400000));
            
            // Hardware (one-time)
            for (const item of (roiData.costs?.hardware || [])) {
                totalCosts += item.amount;
                costBreakdown['Hardware'] = (costBreakdown['Hardware'] || 0) + item.amount;
            }
            
            // Subscriptions (monthly, calculate total paid so far)
            for (const item of (roiData.costs?.subscriptions || [])) {
                if (item.recurring === 'monthly') {
                    const subStart = new Date(item.date);
                    const monthsPaid = Math.ceil(Math.max(1, (now - subStart) / (30 * 86400000)));
                    const total = item.amount * monthsPaid;
                    totalCosts += total;
                    costBreakdown['Subscriptions'] = (costBreakdown['Subscriptions'] || 0) + total;
                }
            }
            
            // API credits (one-time)
            for (const item of (roiData.costs?.api_credits || [])) {
                totalCosts += item.amount;
                costBreakdown['API & Trading'] = (costBreakdown['API & Trading'] || 0) + item.amount;
            }
            
            // Revenue
            let totalRevenue = 0;
            for (const category of Object.values(roiData.revenue || {})) {
                for (const item of (category || [])) {
                    totalRevenue += item.amount;
                }
            }
            
            // Add Kalshi portfolio value as unrealized revenue
            try {
                const kalshiData = await cached('kalshi-balance', 30000, () => kalshiRequest('/portfolio/balance'));
                const kalshiBalance = (kalshiData.balance || 0) / 100;
                // Kalshi deposits are costs, current balance is asset value
                totalRevenue += kalshiBalance;
            } catch(e) {}
            
            res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
            res.end(JSON.stringify({ totalCosts, totalRevenue, costBreakdown, monthsActive }));

        } else if (pathname === '/api/status') {
            // Dylbot activity log from file
            let status = { uptime: process.uptime(), trades_today: 0, scanner: 'active', log: [] };
            try {
                const cached = fs.readFileSync(path.join(__dirname, 'dylbot-status.json'), 'utf8');
                status = { ...status, ...JSON.parse(cached) };
            } catch(e) {}
            res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
            res.end(JSON.stringify(status));
            
        } else {
            res.writeHead(404);
            res.end('Not found');
        }
    } catch(err) {
        console.error('API error:', err.message);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
    }
}

// === STATIC FILE SERVER ===
const MIME_TYPES = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
};

function serveStatic(pathname, res) {
    if (pathname === '/') pathname = '/index.html';
    const filePath = path.join(__dirname, pathname);
    const ext = path.extname(filePath);
    
    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(404);
            res.end('Not found');
            return;
        }
        res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'text/plain' });
        res.end(data);
    });
}

// === SERVER ===
const server = http.createServer((req, res) => {
    const url = new URL(req.url, `http://localhost:${PORT}`);
    
    if (url.pathname.startsWith('/api/')) {
        handleAPI(url.pathname, res);
    } else {
        serveStatic(url.pathname, res);
    }
});

server.listen(PORT, () => {
    console.log(`⚡ ClawdGod Command Center running on http://localhost:${PORT}`);
    console.log('📊 API endpoints: /api/kalshi, /api/monday, /api/youtube, /api/status');
});
