// ClawdGod Dashboard v4 — Multi-page SPA

const API_BASE = '';
const REFRESH_INTERVAL = 60000;

// ========== UTILITIES ==========

const $ = id => document.getElementById(id);
const fmt = n => typeof n === 'number' ? '$' + n.toFixed(2) : n;
const fmtK = n => n >= 1000 ? (n / 1000).toFixed(1) + 'K' : String(n);

async function smartFetch(endpoint, fallbackFile) {
    try {
        const res = await fetch(API_BASE + endpoint, { signal: AbortSignal.timeout(5000) });
        if (res.ok) return await res.json();
    } catch (e) {}
    try {
        const res = await fetch(fallbackFile, { signal: AbortSignal.timeout(3000) });
        if (res.ok) return await res.json();
    } catch (e) {}
    return null;
}

function tickerToName(ticker) {
    const map = {
        'KXHIGHCHI': 'Chicago temp', 'KXHIGHNY': 'NYC temp', 'KXHIGHDEN': 'Denver temp',
        'KXHIGHAUS': 'Austin temp', 'KXOAIANTH': 'OpenAI IPO before Anthropic',
        'KXCABOUT': 'Pam Bondi first out', 'KXCABLEAVE': 'Cabinet exit',
        'KXWARSHNOM': 'Kevin Warsh Fed Chair', 'KXBTCMINMON': 'BTC milestone'
    };
    const series = ticker.split('-')[0];
    return map[series] || ticker;
}

// ========== CLOCK ==========

function updateClock() {
    const now = new Date();
    const opts = { timeZone: 'America/Phoenix', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false };
    const short = { timeZone: 'America/Phoenix', hour: '2-digit', minute: '2-digit', hour12: false };
    const el = $('clock');
    if (el) el.textContent = now.toLocaleTimeString('en-US', opts) + ' MST';
    const mob = $('clock-mobile');
    if (mob) mob.textContent = now.toLocaleTimeString('en-US', short);
}
setInterval(updateClock, 1000);
updateClock();

// ========== UPTIME ==========

const startTime = Date.now();
function formatUptime(ms) {
    const h = Math.floor(ms / 3600000), m = Math.floor((ms % 3600000) / 60000), s = Math.floor((ms % 60000) / 1000);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function updateUptime() {
    const elapsed = Date.now() - startTime;
    const str = formatUptime(elapsed);
    const el = $('home-uptime');
    if (el) el.textContent = 'uptime: ' + str;
    const ael = $('agent-uptime');
    if (ael) ael.textContent = str;
}
setInterval(updateUptime, 1000);

// ========== ROUTING ==========

function navigate(hash) {
    const page = hash.replace('#', '') || 'home';
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    const target = $('page-' + page);
    if (target) target.classList.add('active');
    const navItem = document.querySelector(`.nav-item[data-page="${page}"]`);
    if (navItem) navItem.classList.add('active');
    // Close mobile sidebar
    $('sidebar')?.classList.remove('open');
    document.querySelector('.sidebar-overlay')?.classList.remove('show');
}

window.addEventListener('hashchange', () => navigate(location.hash));

// Mobile menu
document.addEventListener('DOMContentLoaded', () => {
    const overlay = document.createElement('div');
    overlay.className = 'sidebar-overlay';
    document.body.appendChild(overlay);

    $('menu-toggle')?.addEventListener('click', () => {
        $('sidebar').classList.toggle('open');
        overlay.classList.toggle('show');
    });
    overlay.addEventListener('click', () => {
        $('sidebar').classList.remove('open');
        overlay.classList.remove('show');
    });

    navigate(location.hash || '#home');
});

// ========== ACTIVITY FEED ==========

const ACTIVITY_FEED = [
    { time: '10:19', icon: '💡', action: '<strong>Empyre business plan updated</strong> — added tiered pricing, free tier strategy', type: 'system' },
    { time: '10:15', icon: '📸', action: 'Dashboard screenshot captured for <strong>build-in-public</strong>', type: 'system' },
    { time: '09:48', icon: '🖼️', action: 'Ancient Aliens thumbnail cropped — "BEFORE US?" overlay', type: 'content' },
    { time: '09:36', icon: '📊', action: '<strong>Kalshi weather scanner</strong> — 2 trades placed', type: 'trading' },
    { time: '09:25', icon: '☀️', action: '<strong>Morning brief</strong> delivered — 3 Kalshi opportunities', type: 'system' },
    { time: '09:00', icon: '🎬', action: 'Glass Rain Planet short <strong>uploaded to Drive</strong> — 56s, 4K', type: 'content' },
    { time: '08:30', icon: '🔍', action: 'Polymarket whale scan — <strong>Kevin Warsh</strong> $395K position', type: 'trading' },
    { time: '02:14', icon: '🎙️', action: 'Ancient Aliens v3 voiceover — 9:59, Daniel voice', type: 'content' },
    { time: '01:30', icon: '🖼️', action: '<strong>7 images generated</strong> via fal.ai Flux Pro ($0.35)', type: 'content' },
    { time: '00:45', icon: '📝', action: 'Life Inside Earth <strong>image prompts refreshed</strong> — 16 scenes', type: 'content' },
    { time: '00:02', icon: '💾', action: 'Nightly backup pushed to <strong>GitHub</strong>', type: 'system' },
];

function renderFeed(filter = 'all') {
    const container = $('home-feed');
    if (!container) return;
    const items = filter === 'all' ? ACTIVITY_FEED : ACTIVITY_FEED.filter(i => i.type === filter);
    container.innerHTML = items.map(item => `
        <div class="feed-item">
            <span class="feed-icon">${item.icon}</span>
            <div class="feed-body">
                <div class="feed-action">${item.action} <span class="feed-tag ${item.type}">${item.type.toUpperCase()}</span></div>
            </div>
            <span class="feed-time">${item.time}</span>
        </div>
    `).join('');
}

function initFeedFilters() {
    document.querySelectorAll('.feed-filters .chip').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.feed-filters .chip').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderFeed(btn.dataset.filter);
        });
    });
}

// ========== KANBAN ==========

const PIPELINE_DATA = {
    script: [{ title: 'Ocean Depths', type: 'long-form' }],
    images: [{ title: 'Life Inside Earth', type: 'long-form', note: 'Dylan generating' }],
    voice: [],
    assembly: [],
    review: [
        { title: 'Ancient Aliens', type: 'long-form', note: 'Scheduled Wed 3PM' },
        { title: 'Glass Rain Planet', type: 'short', note: 'On Drive' },
    ],
    posted: [
        { title: 'Fermi Paradox', type: 'long-form' },
        { title: 'Mars Colony', type: 'long-form' },
        { title: 'Black Hole Sound', type: 'short' },
        { title: 'Jupiter Fall', type: 'short' },
        { title: 'Dark Matter', type: 'short' },
        { title: 'Made of Stars', type: 'short' },
    ]
};

function initKanban() {
    Object.entries(PIPELINE_DATA).forEach(([stage, cards]) => {
        const col = $('kanban-' + stage);
        const count = $('kc-' + stage);
        if (!col) return;
        if (count) count.textContent = cards.length;
        col.innerHTML = cards.length ? cards.map(c => `
            <div class="kanban-card-item">
                <div class="kanban-card-type">${c.type === 'long-form' ? '📹 Long-form' : '⚡ Short'}</div>
                <div class="kanban-card-title">${c.title}</div>
                ${c.note ? `<div class="kanban-card-note">${c.note}</div>` : ''}
            </div>
        `).join('') : '<div class="kanban-empty">—</div>';
    });
}

// ========== DATA FETCHERS ==========

async function fetchYouTube() {
    const data = await smartFetch('/api/youtube', 'youtube-data.json');
    if (!data) return;

    // Home stats
    const el = $('home-subs');
    if (el) el.textContent = data.subscribers || 0;

    // Channels page — Theoretika
    const ts = $('ch-theo-subs'); if (ts) ts.textContent = data.subscribers || 0;
    const tv = $('ch-theo-views'); if (tv) tv.textContent = fmtK(data.views || 0);
    const th = $('ch-theo-hours'); if (th) th.textContent = (data.watchHours || 0).toFixed(1);
    const tr = $('ch-theo-rev'); if (tr) tr.textContent = '$0';

    // Totals
    const cs = $('ch-total-subs'); if (cs) cs.textContent = data.subscribers || 0;
    const cv = $('ch-total-views'); if (cv) cv.textContent = fmtK(data.views || 0);
}

async function fetchKalshi() {
    const data = await smartFetch('/api/kalshi', 'kalshi-data.json');
    if (!data) return;

    const bal = data.balance || 0;
    const port = data.portfolio_value || 0;
    const total = data.total_value || (bal + port);
    const pnl = data.total_pnl;

    // Home
    const ht = $('home-trades');
    if (ht) ht.textContent = (data.positions || []).filter(p => !p.result).length;

    // Channels page
    const kb = $('k-balance'); if (kb) kb.textContent = fmt(bal);
    const kp = $('k-portfolio'); if (kp) kp.textContent = fmt(port);
    const kt = $('k-total'); if (kt) kt.textContent = fmt(total);
    const kpnl = $('k-pnl');
    if (kpnl) {
        kpnl.textContent = (pnl >= 0 ? '+' : '') + fmt(pnl);
        kpnl.style.color = pnl >= 0 ? 'var(--green)' : 'var(--red)';
    }

    // Positions
    const posDiv = $('k-positions');
    if (posDiv && data.positions) {
        posDiv.innerHTML = data.positions.map(p => {
            const name = tickerToName(p.ticker);
            const priceStr = p.yes_price ? `${p.position}× YES @ ${p.yes_price}¢` : `${p.position}× YES`;
            let pnlClass = 'neutral', pnlText = 'open';
            if (p.result === 'yes') { pnlClass = 'positive'; pnlText = '✅ WON'; }
            else if (p.result === 'no') { pnlClass = 'negative'; pnlText = '❌ LOST'; }
            return `<div class="position-row">
                <span class="pos-name">${name}</span>
                <span class="pos-detail">${priceStr}</span>
                <span class="pos-pnl ${pnlClass}">${pnlText}</span>
            </div>`;
        }).join('');
    }
}

async function fetchMonday() {
    const data = await smartFetch('/api/monday', 'monday-data.json');
    if (!data) return;
    const tasks = data.tasks || [];
    const container = $('task-list');
    if (!container) return;
    container.innerHTML = tasks.filter(t => t.name !== 'New task').map(t => {
        const icon = t.priority === 'Critical' || t.priority === 'High' ? '🔴' :
            t.priority === 'Medium' ? '🟡' : '🟢';
        const statusClass = t.status === 'Working on it' ? 'working' :
            t.status === 'Done' ? 'done' : t.status === 'Stuck' ? 'stuck' : 'todo';
        const statusText = t.status || 'Not started';
        return `<div class="task-item">
            <span class="task-priority">${icon}</span>
            <span class="task-name">${t.name}</span>
            <span class="task-status ${statusClass}">${statusText}</span>
        </div>`;
    }).join('');
}

async function fetchROI() {
    let data = await smartFetch('/api/roi', 'roi-data.json');
    if (!data) return;

    // Parse raw format
    if (data.costs && !data.totalCosts) {
        let totalCosts = 0;
        const costBreakdown = {};
        for (const [cat, items] of Object.entries(data.costs)) {
            if (cat.startsWith('_')) continue;
            const sum = (items || []).reduce((s, i) => s + (i.amount || 0), 0);
            const label = cat.charAt(0).toUpperCase() + cat.slice(1).replace(/_/g, ' ');
            costBreakdown[label] = { total: sum, items };
            totalCosts += sum;
        }
        let totalRevenue = 0;
        for (const [cat, items] of Object.entries(data.revenue || {})) {
            totalRevenue += (items || []).reduce((s, i) => s + (i.amount || 0), 0);
        }
        data = { totalCosts, totalRevenue, costBreakdown };
    }

    // Home revenue
    const hr = $('home-revenue');
    if (hr) hr.textContent = fmt(data.totalRevenue);
    const cr = $('ch-total-rev');
    if (cr) cr.textContent = fmt(data.totalRevenue);

    // Finance page
    const fc = $('fin-costs'); if (fc) fc.textContent = '-' + fmt(data.totalCosts);
    const fr = $('fin-revenue'); if (fr) fr.textContent = '+' + fmt(data.totalRevenue);
    const fn = $('fin-net');
    const fnl = $('fin-net-label');
    if (fn) {
        const net = data.totalRevenue - data.totalCosts;
        fn.textContent = (net >= 0 ? '+' : '') + fmt(net);
        fn.classList.add(net >= 0 ? 'green' : 'red');
        if (fnl) fnl.textContent = net >= 0 ? '🟢 Profit' : '🔴 To break even';
    }

    // Progress bar
    const pct = data.totalCosts > 0 ? Math.min((data.totalRevenue / data.totalCosts) * 100, 100) : 0;
    const bar = $('fin-bar');
    if (bar) bar.style.width = pct + '%';
    const bpct = $('fin-bar-pct');
    if (bpct) bpct.textContent = pct.toFixed(0) + '%';

    // Expense categories
    const catEl = $('fin-categories');
    if (catEl && data.costBreakdown) {
        const icons = { Hardware: '🖥️', Subscriptions: '🔄', 'Api credits': '⚡', Other: '📦' };
        const colors = { Hardware: 'var(--blue)', Subscriptions: 'var(--purple)', 'Api credits': 'var(--orange)', Other: 'var(--text-muted)' };
        catEl.innerHTML = Object.entries(data.costBreakdown).map(([cat, info]) => `
            <div class="expense-card">
                <div class="expense-icon">${icons[cat] || '📦'}</div>
                <div class="expense-name">${cat}</div>
                <div class="expense-amount" style="color:${colors[cat] || 'var(--text-primary)'}">${fmt(info.total)}</div>
                <div class="expense-detail">${info.items?.length || 0} items</div>
            </div>
        `).join('');
    }
}

async function fetchDylbotStatus() {
    const data = await smartFetch('/api/status', 'dylbot-status.json');
    if (!data) return;

    const aa = $('agent-actions');
    if (aa) aa.textContent = ACTIVITY_FEED.length;
    const ah = $('agent-heartbeat');
    if (ah) ah.textContent = '< 1 min';
    const at = $('agent-trades-today');
    if (at) at.textContent = (data.trades_today || 0) + ' trades today';

    const log = $('agent-log');
    if (log && data.log) {
        log.innerHTML = data.log.map(e => `
            <div class="log-entry">
                <span class="log-time">${e.time}</span>
                <span class="log-msg">${e.msg}</span>
            </div>
        `).join('');
    }
}

// ========== SPARKLINE ENGINE ==========

function drawSparkline(canvasId, data, options = {}) {
    const canvas = $(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width = canvas.offsetWidth * 2;
    const h = canvas.height = canvas.offsetHeight * 2;
    ctx.scale(2, 2);
    const dw = canvas.offsetWidth, dh = canvas.offsetHeight;

    const color = options.color || '#34d399';
    const min = options.min !== undefined ? options.min : Math.min(...data);
    const max = Math.max(...data);
    const range = Math.max(max - min, 1);
    const pad = dh * 0.12;

    // Line
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.beginPath();
    data.forEach((val, i) => {
        const x = data.length === 1 ? dw / 2 : (i / (data.length - 1)) * dw;
        const y = dh - pad - ((val - min) / range) * (dh - pad * 2);
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Fill
    const lastX = data.length === 1 ? dw / 2 : dw;
    ctx.lineTo(lastX, dh);
    ctx.lineTo(0, dh);
    ctx.closePath();
    ctx.fillStyle = color.replace(')', ', 0.08)').replace('rgb', 'rgba');
    ctx.fill();
}

function initCharts() {
    // Keep sparklines for channel cards
    drawSparkline('spark-theo', [50, 80, 120, 200, 350, 500, 600, 942], { color: 'rgb(99, 102, 241)', min: 0 });
    drawSparkline('spark-lofi', [0], { color: 'rgb(236, 72, 153)', min: 0 });
    drawSparkline('spark-kalshi', [0, -0.82, -0.60, -0.40, 0.10, 0.51], { color: 'rgb(52, 211, 153)', min: -1 });

    // Initialize P&L Charts with Chart.js
    setTimeout(initPnLCharts, 300);
}

function initPnLCharts() {
    // Kalshi P&L Chart
    const kalshiCtx = document.getElementById('chart-kalshi-pnl');
    if (kalshiCtx && typeof Chart !== 'undefined') {
        new Chart(kalshiCtx, {
            type: 'line',
            data: {
                labels: ['Feb 9', 'Feb 12', 'Feb 15', 'Feb 18', 'Feb 21', 'Feb 24'],
                datasets: [{
                    label: 'P&L ($)',
                    data: [0, -5.25, -8.40, -12.60, -15.20, -15.84],
                    borderColor: 'rgb(52, 211, 153)',
                    backgroundColor: 'rgba(52, 211, 153, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: 'rgba(26, 29, 40, 0.95)',
                        titleColor: '#e8eaed',
                        bodyColor: '#e8eaed',
                        borderColor: 'rgba(255, 255, 255, 0.1)',
                        borderWidth: 1
                    }
                },
                scales: {
                    x: {
                        grid: { color: 'rgba(255, 255, 255, 0.05)' },
                        ticks: { color: '#9ca3af' }
                    },
                    y: {
                        grid: { color: 'rgba(255, 255, 255, 0.05)' },
                        ticks: { color: '#9ca3af', callback: value => '$' + value.toFixed(2) }
                    }
                }
            }
        });
    }

    // YouTube Revenue Chart  
    const youtubeCtx = document.getElementById('chart-youtube-revenue');
    if (youtubeCtx && typeof Chart !== 'undefined') {
        new Chart(youtubeCtx, {
            type: 'bar',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                datasets: [{
                    label: 'Revenue ($)',
                    data: [0, 0, 0, 0, 0, 0], // Not monetized yet
                    backgroundColor: 'rgba(96, 165, 250, 0.6)',
                    borderColor: 'rgb(96, 165, 250)',
                    borderWidth: 1
                }, {
                    label: 'Views',
                    data: [1200, 2800, 4100, 6200, 7500, 8634],
                    type: 'line',
                    borderColor: 'rgb(167, 139, 250)',
                    backgroundColor: 'rgba(167, 139, 250, 0.1)',
                    yAxisID: 'y1',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: true, labels: { color: '#e8eaed' } },
                    tooltip: {
                        backgroundColor: 'rgba(26, 29, 40, 0.95)',
                        titleColor: '#e8eaed',
                        bodyColor: '#e8eaed',
                        borderColor: 'rgba(255, 255, 255, 0.1)',
                        borderWidth: 1
                    }
                },
                scales: {
                    x: {
                        grid: { color: 'rgba(255, 255, 255, 0.05)' },
                        ticks: { color: '#9ca3af' }
                    },
                    y: {
                        type: 'linear',
                        position: 'left',
                        grid: { color: 'rgba(255, 255, 255, 0.05)' },
                        ticks: { color: '#9ca3af', callback: value => '$' + value.toFixed(2) }
                    },
                    y1: {
                        type: 'linear',
                        position: 'right',
                        grid: { drawOnChartArea: false },
                        ticks: { color: '#9ca3af' }
                    }
                }
            }
        });
    }

    // ROI Tracker Chart
    const roiCtx = document.getElementById('chart-roi-tracker');
    if (roiCtx && typeof Chart !== 'undefined') {
        new Chart(roiCtx, {
            type: 'doughnut',
            data: {
                labels: ['Costs', 'Break-even Target'],
                datasets: [{
                    data: [718, 282], // $718 spent, need $282 more to break even at $1000
                    backgroundColor: [
                        'rgba(248, 113, 113, 0.8)',
                        'rgba(52, 211, 153, 0.3)'
                    ],
                    borderColor: [
                        'rgb(248, 113, 113)',
                        'rgb(52, 211, 153)'
                    ],
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { color: '#e8eaed', padding: 20 }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(26, 29, 40, 0.95)',
                        titleColor: '#e8eaed',
                        bodyColor: '#e8eaed',
                        borderColor: 'rgba(255, 255, 255, 0.1)',
                        borderWidth: 1,
                        callbacks: {
                            label: function(context) {
                                const percentage = ((context.parsed / 1000) * 100).toFixed(1);
                                return context.label + ': $' + context.parsed + ' (' + percentage + '%)';
                            }
                        }
                    }
                },
                cutout: '60%'
            }
        });
    }
}

// ========== INIT ==========

async function init() {
    console.log('🧪 EmpyreLab — The Lab Dashboard');

    renderFeed('all');
    initFeedFilters();
    initKanban();

    await Promise.allSettled([fetchYouTube(), fetchKalshi(), fetchMonday(), fetchROI(), fetchDylbotStatus()]);

    setTimeout(initCharts, 300);

    // Auto-refresh
    setInterval(fetchKalshi, 30000);
    setInterval(fetchMonday, 120000);
    setInterval(fetchYouTube, 300000);
    setInterval(fetchROI, 300000);
    setInterval(fetchDylbotStatus, 60000);

    console.log('📊 All systems online.');
}

init();
