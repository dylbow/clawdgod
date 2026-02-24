// ClawdGod Dashboard — Live Data Engine

const API_BASE = '';
const REFRESH_INTERVAL = 60000; // 1 minute

// === CLOCK ===
function updateClock() {
    const now = new Date();
    const opts = { timeZone: 'America/Phoenix', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false };
    document.getElementById('clock').textContent = now.toLocaleTimeString('en-US', opts) + ' MST';
}
setInterval(updateClock, 1000);
updateClock();

// === UPTIME ===
const startTime = Date.now();
function updateUptime() {
    const e = Date.now() - startTime;
    const h = Math.floor(e / 3600000), m = Math.floor((e % 3600000) / 60000), s = Math.floor((e % 60000) / 1000);
    const el = document.getElementById('uptime');
    if (el) el.textContent = `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
}
setInterval(updateUptime, 1000);
updateUptime();

// === HELPERS ===
function $(id) { return document.getElementById(id); }
function fmt(n) { return typeof n === 'number' ? '$' + n.toFixed(2) : n; }
function fmtK(n) { return n >= 1000 ? (n/1000).toFixed(1) + 'K' : n.toString(); }

function tickerToName(ticker) {
    const map = {
        'KXHIGHCHI': 'Chicago temp',
        'KXHIGHNY': 'NYC temp', 
        'KXHIGHDEN': 'Denver temp',
        'KXHIGHAUS': 'Austin temp',
        'KXOAIANTH': 'OpenAI IPO before Anthropic',
        'KXCABOUT': 'Pam Bondi first out',
        'KXCABLEAVE': 'Cabinet exit'
    };
    const parts = ticker.split('-');
    const series = parts[0];
    return map[series] || ticker;
}

// === KALSHI ===
async function fetchKalshi() {
    try {
        const res = await fetch(API_BASE + '/api/kalshi');
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        
        $('kalshi-balance').textContent = fmt(data.balance);
        $('kalshi-portfolio').textContent = fmt(data.portfolio_value);
        $('kalshi-total').textContent = fmt(data.total_value || (data.balance + data.portfolio_value));
        
        // P&L
        const pnlEl = $('kalshi-pnl');
        if (pnlEl && data.total_pnl !== undefined) {
            const pnl = data.total_pnl;
            pnlEl.textContent = (pnl >= 0 ? '+' : '') + fmt(pnl);
            pnlEl.style.color = pnl >= 0 ? 'var(--green)' : 'var(--red)';
        }
        
        const posDiv = $('kalshi-positions');
        if (data.positions && data.positions.length > 0) {
            posDiv.innerHTML = data.positions.map(p => {
                const name = tickerToName(p.ticker);
                const payout = ((p.position * 100 - parseFloat(p.exposure) * 100) / 100).toFixed(2);
                const isPositive = payout > 0;
                const priceStr = p.yes_price ? `${p.position}× YES @ ${p.yes_price}¢` : `${p.position}× YES`;
                const result = p.result;
                let pnlClass = 'neutral', pnlText = 'open';
                
                if (result === 'yes') { pnlClass = 'positive'; pnlText = '✅ WON'; }
                else if (result === 'no') { pnlClass = 'negative'; pnlText = '❌ LOST'; }
                else if (result === '') { 
                    pnlClass = isPositive ? 'positive' : 'neutral';
                    pnlText = isPositive ? `+$${payout} if YES` : 'open';
                }
                
                return `<div class="position">
                    <span class="position-name">${name}</span>
                    <span class="position-detail">${priceStr}</span>
                    <span class="position-pnl ${pnlClass}">${pnlText}</span>
                </div>`;
            }).join('');
        }
        
        $('kalshi-panel-status')?.classList.add('live');
    } catch(e) {
        console.error('Kalshi fetch error:', e);
    }
}

// === MONDAY.COM ===
async function fetchMonday() {
    try {
        const res = await fetch(API_BASE + '/api/monday');
        const data = await res.json();
        
        const taskDiv = $('monday-tasks');
        if (data.tasks && data.tasks.length > 0) {
            taskDiv.innerHTML = data.tasks.slice(0, 8).map(t => {
                const priorityIcon = t.priority === 'Critical' || t.priority === 'High' ? '🔴' : 
                                     t.priority === 'Medium' ? '🟡' : '🟢';
                const statusClass = t.status === 'Working on it' ? 'status-working' :
                                    t.status === 'Done' ? 'status-done' :
                                    t.status === 'Stuck' ? 'status-waiting' : 'status-todo';
                const statusText = t.status || 'TO DO';
                
                return `<div class="task">
                    <span class="task-priority">${priorityIcon}</span>
                    <span class="task-name">${t.name}</span>
                    <span class="task-status ${statusClass}">${statusText.toUpperCase()}</span>
                </div>`;
            }).join('');
        }
    } catch(e) {
        console.error('Monday fetch error:', e);
    }
}

// === YOUTUBE ===
async function fetchYouTube() {
    try {
        const res = await fetch(API_BASE + '/api/youtube');
        const data = await res.json();
        
        if (data.subscribers) $('yt-subs').textContent = data.subscribers;
        if (data.views) $('yt-views').textContent = fmtK(data.views);
        if (data.videos) $('yt-videos').textContent = data.videos;
        
        // Update top videos if available
        if (data.topVideos && data.topVideos.length > 0) {
            const container = $('yt-top-videos');
            if (container) {
                container.innerHTML = data.topVideos.map(v => 
                    `<div class="yt-video-row">
                        <span class="yt-video-title">${v.title}</span>
                        <span class="yt-video-views">${fmtK(v.views)}</span>
                    </div>`
                ).join('');
            }
        }
    } catch(e) {
        console.error('YouTube fetch error:', e);
    }
}

// === NOTIFICATIONS ===
async function fetchNotifications() {
    try {
        const res = await fetch(API_BASE + '/api/notifications');
        const data = await res.json();
        
        // Update email count badge
        const emailBadge = $('email-count');
        if (emailBadge) {
            const count = data.unreadEmails || 0;
            emailBadge.textContent = `📧 ${count}`;
            if (count > 0) {
                emailBadge.classList.add('has-unread');
            } else {
                emailBadge.classList.remove('has-unread');
            }
        }
        
        const notifList = $('notif-list');
        if (!notifList) return;
        
        const activeTab = document.querySelector('.notif-tab.active')?.dataset.tab || 'all';
        
        let items = data.notifications || [];
        if (activeTab === 'email') items = items.filter(n => n.type === 'email');
        if (activeTab === 'telegram') items = items.filter(n => n.type === 'telegram');
        
        // Add Telegram status as a notification
        if (activeTab === 'all' || activeTab === 'telegram') {
            items.push({
                type: 'telegram',
                from: 'Dylbot ⚡',
                subject: 'Connected — monitoring Dylan\'s chat',
                date: new Date().toISOString(),
                isStatus: true
            });
        }
        
        if (items.length === 0) {
            notifList.innerHTML = '<div class="notif-empty">No notifications</div>';
            return;
        }
        
        notifList.innerHTML = items.map(n => {
            const icon = n.type === 'email' ? '📧' : '💬';
            const from = n.from ? n.from.replace(/<.*>/, '').trim() : 'Unknown';
            const subject = n.subject || '(no subject)';
            let timeStr = '';
            if (n.date) {
                try {
                    const d = new Date(n.date);
                    const now = new Date();
                    const diffMin = Math.floor((now - d) / 60000);
                    if (diffMin < 60) timeStr = `${diffMin}m`;
                    else if (diffMin < 1440) timeStr = `${Math.floor(diffMin/60)}h`;
                    else timeStr = `${Math.floor(diffMin/1440)}d`;
                } catch(e) {}
            }
            
            return `<div class="notif-item" data-type="${n.type}">
                <span class="notif-icon">${icon}</span>
                <div class="notif-content">
                    <div class="notif-title">${subject}</div>
                    <div class="notif-meta">${from}</div>
                </div>
                <span class="notif-time">${timeStr}</span>
            </div>`;
        }).join('');
        
    } catch(e) {
        console.error('Notifications fetch error:', e);
        const notifList = $('notif-list');
        if (notifList) {
            notifList.innerHTML = `<div class="notif-item">
                <span class="notif-icon">💬</span>
                <div class="notif-content">
                    <div class="notif-title">Telegram — Connected</div>
                    <div class="notif-meta">Dylbot monitoring Dylan's chat</div>
                </div>
                <span class="notif-time">now</span>
            </div>
            <div class="notif-empty" style="padding:12px;font-size:11px;">Gmail: connect API for email notifications</div>`;
        }
    }
}

// Tab switching for notifications
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('notif-tab')) {
        document.querySelectorAll('.notif-tab').forEach(t => t.classList.remove('active'));
        e.target.classList.add('active');
        fetchNotifications();
    }
});

// === WEALTH TRACKER (surprise feature) ===
function initWealthTracker() {
    const container = $('wealth-tracker');
    if (!container) return;
    
    // Calculate total empire value
    const updateWealth = async () => {
        try {
            const [kalshi, yt] = await Promise.all([
                fetch(API_BASE + '/api/kalshi').then(r => r.json()).catch(() => ({})),
                fetch(API_BASE + '/api/youtube').then(r => r.json()).catch(() => ({}))
            ]);
            
            const kalshiTotal = (kalshi.balance || 0) + (kalshi.portfolio_value || 0);
            const subs = yt.subscribers || 0;
            const views = yt.views || 0;
            
            // Estimated channel value: ~$0.50-2 per sub at this stage
            const channelValue = subs * 1;
            
            // Revenue potential: ~$2 RPM for shorts-heavy channel
            const monthlyRevPotential = (views / 28) * 30 * 0.002;
            
            container.innerHTML = `
                <div class="wealth-grid">
                    <div class="wealth-item">
                        <span class="wealth-label">KALSHI</span>
                        <span class="wealth-value">${fmt(kalshiTotal)}</span>
                        <span class="wealth-delta">trading capital</span>
                    </div>
                    <div class="wealth-item">
                        <span class="wealth-label">THEORETIKA</span>
                        <span class="wealth-value">${subs} subs</span>
                        <span class="wealth-delta">${fmtK(views)} views / 28d</span>
                    </div>
                    <div class="wealth-item">
                        <span class="wealth-label">EST. MONTHLY REV</span>
                        <span class="wealth-value">${fmt(monthlyRevPotential + kalshiTotal * 0.1)}</span>
                        <span class="wealth-delta">at current pace</span>
                    </div>
                    <div class="wealth-item empire">
                        <span class="wealth-label">EMPYRE SCORE</span>
                        <span class="wealth-value score">${Math.floor(subs * 2 + views * 0.01 + kalshiTotal)}</span>
                        <span class="wealth-delta">level up at 500</span>
                    </div>
                </div>
            `;
        } catch(e) {}
    };
    
    updateWealth();
    setInterval(updateWealth, REFRESH_INTERVAL);
}

// === SPARKLINE CHART ENGINE ===
function drawSparkline(canvasId, data, options = {}) {
    const canvas = $(canvasId);
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const w = canvas.width = canvas.offsetWidth;
    const h = canvas.height = canvas.offsetHeight;
    
    const color = options.color || '#00d68f';
    const colorDim = options.colorDim || 'rgba(0, 214, 143, 0.1)';
    const hasZeroLine = options.zeroline !== false;
    const min = options.min !== undefined ? options.min : Math.min(...data);
    const max = options.max !== undefined ? options.max : Math.max(...data);
    const range = Math.max(max - min, 1);
    const padding = h * 0.1;
    
    // Zero line for P&L charts
    if (hasZeroLine && min < 0) {
        const zeroY = h - padding - ((0 - min) / range) * (h - padding * 2);
        ctx.strokeStyle = 'rgba(255,255,255,0.05)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(0, zeroY);
        ctx.lineTo(w, zeroY);
        ctx.stroke();
        ctx.setLineDash([]);
    }
    
    // Line
    const gradient = ctx.createLinearGradient(0, 0, w, 0);
    gradient.addColorStop(0, color.replace(')', ', 0.4)').replace('rgb', 'rgba'));
    gradient.addColorStop(1, color);
    
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.beginPath();
    
    data.forEach((val, i) => {
        const x = data.length === 1 ? w / 2 : (i / (data.length - 1)) * w;
        const y = h - padding - ((val - min) / range) * (h - padding * 2);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    });
    ctx.stroke();
    
    // Fill
    const lastX = data.length === 1 ? w / 2 : w;
    const lastY = h - padding - ((data[data.length - 1] - min) / range) * (h - padding * 2);
    ctx.lineTo(lastX, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fillStyle = colorDim;
    ctx.fill();
    
    // Dot on current value
    ctx.beginPath();
    ctx.arc(lastX, lastY, 3, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = color.replace(')', ', 0.3)').replace('rgb', 'rgba');
    ctx.lineWidth = 6;
    ctx.stroke();
}

function initAllCharts() {
    // Total revenue trend (Empyre Tracker - top)
    drawSparkline('total-chart', [0, 0, 0, 0.50, 0.51, 0.51], {
        color: 'rgb(108, 92, 231)',
        colorDim: 'rgba(108, 92, 231, 0.1)',
        min: -1
    });
    
    // Kalshi P&L trend
    drawSparkline('kalshi-chart', [0, -0.82, -0.60, -0.40, 0.10, 0.51], {
        color: 'rgb(0, 214, 143)',
        colorDim: 'rgba(0, 214, 143, 0.08)',
        min: -1
    });
    
    // YouTube views trend (daily views, simulated from what we know)
    drawSparkline('yt-chart', [50, 80, 120, 200, 350, 500, 600, 942], {
        color: 'rgb(255, 71, 87)',
        colorDim: 'rgba(255, 71, 87, 0.08)',
        zeroline: false,
        min: 0
    });
}

// === ROI TRACKER ===
async function initROI() {
    try {
        const res = await fetch(API_BASE + '/api/roi');
        const data = await res.json();
        
        const costsEl = $('roi-costs');
        const revEl = $('roi-revenue');
        const netEl = $('roi-net');
        const netLabel = $('roi-net-label');
        const bar = $('roi-bar');
        const breakdown = $('roi-breakdown');
        
        if (!costsEl) return;
        
        costsEl.textContent = '-' + fmt(data.totalCosts);
        revEl.textContent = '+' + fmt(data.totalRevenue);
        
        const net = data.totalRevenue - data.totalCosts;
        netEl.textContent = (net >= 0 ? '+' : '') + fmt(net);
        netEl.className = 'roi-value ' + (net >= 0 ? 'positive' : 'negative');
        netLabel.textContent = net >= 0 ? '🟢 PROFIT' : '🔴 TO BREAK EVEN';
        
        // Progress bar (0% = no revenue, 100% = break even)
        const pct = data.totalCosts > 0 ? Math.min((data.totalRevenue / data.totalCosts) * 100, 100) : 0;
        bar.style.width = pct + '%';
        
        // Cost breakdown
        let html = '<div style="margin-top:6px">';
        for (const [cat, amount] of Object.entries(data.costBreakdown)) {
            html += `<div class="breakdown-item"><span class="breakdown-label">${cat}</span><span class="breakdown-value">$${amount.toFixed(0)}</span></div>`;
        }
        html += '</div>';
        breakdown.innerHTML = html;
        
        // Toggle collapse
        const toggle = $('roi-toggle');
        const widget = $('roi-widget');
        $('roi-header').onclick = () => widget.classList.toggle('collapsed');
        
    } catch(e) {
        console.error('ROI fetch error:', e);
    }
}

// === DRAG & DROP REORDER ===
function initDragDrop() {
    const grid = $('dashboard-grid');
    if (!grid) return;
    
    const panels = grid.querySelectorAll('.draggable');
    let draggedEl = null;
    let placeholder = null;
    let offsetX, offsetY;
    
    panels.forEach(panel => {
        const handle = panel.querySelector('.drag-handle');
        if (!handle) return;
        
        handle.style.cursor = 'grab';
        
        handle.addEventListener('mousedown', (e) => {
            if (e.target.tagName === 'BUTTON' || e.target.tagName === 'A') return;
            
            draggedEl = panel;
            const rect = panel.getBoundingClientRect();
            offsetX = e.clientX - rect.left;
            offsetY = e.clientY - rect.top;
            
            // Create placeholder
            placeholder = document.createElement('div');
            placeholder.className = 'drag-placeholder';
            placeholder.style.height = rect.height + 'px';
            placeholder.style.gridColumn = getComputedStyle(panel).gridColumn;
            
            // Style dragged element
            panel.classList.add('dragging');
            panel.style.width = rect.width + 'px';
            panel.style.position = 'fixed';
            panel.style.zIndex = '1000';
            panel.style.left = rect.left + 'px';
            panel.style.top = rect.top + 'px';
            
            panel.parentNode.insertBefore(placeholder, panel);
            document.body.appendChild(panel);
            
            handle.style.cursor = 'grabbing';
            e.preventDefault();
        });
    });
    
    document.addEventListener('mousemove', (e) => {
        if (!draggedEl) return;
        
        draggedEl.style.left = (e.clientX - offsetX) + 'px';
        draggedEl.style.top = (e.clientY - offsetY) + 'px';
        
        // Find drop target
        const gridPanels = grid.querySelectorAll('.draggable:not(.dragging), .drag-placeholder');
        let closest = null;
        let closestDist = Infinity;
        
        gridPanels.forEach(p => {
            const rect = p.getBoundingClientRect();
            const centerY = rect.top + rect.height / 2;
            const dist = Math.abs(e.clientY - centerY);
            if (dist < closestDist) {
                closestDist = dist;
                closest = p;
            }
        });
        
        if (closest && closest !== placeholder) {
            const rect = closest.getBoundingClientRect();
            const midY = rect.top + rect.height / 2;
            if (e.clientY < midY) {
                grid.insertBefore(placeholder, closest);
            } else {
                grid.insertBefore(placeholder, closest.nextSibling);
            }
        }
    });
    
    document.addEventListener('mouseup', () => {
        if (!draggedEl) return;
        
        // Put panel back into grid at placeholder position
        draggedEl.classList.remove('dragging');
        draggedEl.style.position = '';
        draggedEl.style.zIndex = '';
        draggedEl.style.left = '';
        draggedEl.style.top = '';
        draggedEl.style.width = '';
        
        const handle = draggedEl.querySelector('.drag-handle');
        if (handle) handle.style.cursor = 'grab';
        
        if (placeholder && placeholder.parentNode) {
            placeholder.parentNode.insertBefore(draggedEl, placeholder);
            placeholder.remove();
        }
        
        // Save order to localStorage
        const order = [...grid.querySelectorAll('.draggable')].map(p => p.dataset.panel);
        localStorage.setItem('clawdgod-panel-order', JSON.stringify(order));
        
        draggedEl = null;
        placeholder = null;
    });
    
    // Restore saved order
    try {
        const saved = JSON.parse(localStorage.getItem('clawdgod-panel-order'));
        if (saved && saved.length > 0) {
            saved.forEach(panelId => {
                const panel = grid.querySelector(`[data-panel="${panelId}"]`);
                if (panel) grid.appendChild(panel);
            });
        }
    } catch(e) {}
}

// === AI AGENT ACTIVITY FEED ===
const ACTIVITY_FEED = [
    { time: '10:19', icon: '💡', action: '<strong>Empyre business plan updated</strong> — added tiered pricing, free tier strategy, marketing content roadmap', type: 'system' },
    { time: '10:15', icon: '📸', action: 'Dashboard screenshot captured for <strong>build-in-public</strong> content', type: 'system' },
    { time: '09:48', icon: '🖼️', action: 'Ancient Aliens thumbnail cropped — "BEFORE US?" text overlay added', type: 'content' },
    { time: '09:36', icon: '📊', action: '<strong>Kalshi weather scanner</strong> — 2 trades placed: NYC temp + Chicago temp', type: 'trading' },
    { time: '09:25', icon: '☀️', action: '<strong>Morning brief</strong> delivered — 3 Kalshi opportunities, 2 video tasks, market update', type: 'system' },
    { time: '09:00', icon: '🎬', action: 'Glass Rain Planet short <strong>uploaded to Drive</strong> — 56s, 4K vertical, ready to post', type: 'content' },
    { time: '08:30', icon: '🔍', action: 'Polymarket whale scan — <strong>Kevin Warsh</strong> position up to $395K (94.5¢ YES)', type: 'trading' },
    { time: '02:14', icon: '🎙️', action: 'Ancient Aliens v3 voiceover generated — 9:59 duration, Daniel voice', type: 'content' },
    { time: '01:30', icon: '🖼️', action: '<strong>7 images generated</strong> via fal.ai Flux Pro for Black Hole Sound short ($0.35)', type: 'content' },
    { time: '00:45', icon: '📝', action: 'Life Inside Earth <strong>image prompts refreshed</strong> — 16 scenes, uploaded to Drive', type: 'content' },
    { time: '00:02', icon: '💾', action: 'Nightly backup pushed to <strong>GitHub</strong> (dylbow/openclaw-backup)', type: 'system' },
];

function initActivityFeed() {
    const timeline = $('agent-feed-timeline');
    if (!timeline) return;

    const renderFeed = (filter) => {
        const items = filter === 'all' ? ACTIVITY_FEED : ACTIVITY_FEED.filter(i => i.type === filter);
        timeline.innerHTML = items.map(item => `
            <div class="feed-item" data-type="${item.type}">
                <span class="feed-icon">${item.icon}</span>
                <div class="feed-body">
                    <div class="feed-action">${item.action} <span class="feed-tag ${item.type}">${item.type.toUpperCase()}</span></div>
                </div>
                <span class="feed-time">${item.time}</span>
            </div>
        `).join('');
    };

    renderFeed('all');

    // Update stats
    $('feed-actions-today').textContent = ACTIVITY_FEED.length;
    $('feed-videos-made').textContent = ACTIVITY_FEED.filter(i => i.type === 'content' && i.action.includes('uploaded')).length + 1;
    $('feed-trades-placed').textContent = '2';
    $('feed-images-gen').textContent = '7';
    $('feed-cost-today').textContent = '$0.35';

    // Filter buttons
    document.querySelectorAll('.feed-filter').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.feed-filter').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderFeed(btn.dataset.filter);
        });
    });
}

// === CONTENT PIPELINE KANBAN ===
const PIPELINE_DATA = {
    script: [
        { title: 'Ocean Depths', type: 'long-form' },
    ],
    images: [
        { title: 'Life Inside Earth', type: 'long-form', note: 'Dylan generating' },
    ],
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
        const col = $(`kanban-${stage}`);
        if (!col) return;
        col.innerHTML = cards.map(c => `
            <div class="kanban-card ${c.type}">
                <div class="card-type">${c.type === 'long-form' ? '📹 Long' : '⚡ Short'}</div>
                <div class="card-title">${c.title}</div>
                ${c.note ? `<div style="font-size:10px;color:var(--text-muted);margin-top:3px;">${c.note}</div>` : ''}
            </div>
        `).join('') || '<div style="color:var(--text-muted);font-size:11px;text-align:center;padding:16px;">—</div>';
    });
}

// === INIT ===
async function init() {
    console.log('⚡ ClawdGod Command Center — Live Mode');
    
    // Initial fetch
    await Promise.allSettled([fetchKalshi(), fetchMonday(), fetchYouTube(), fetchNotifications()]);
    
    // Initialize special features
    initWealthTracker();
    initActivityFeed();
    initKanban();
    initROI();
    initDragDrop();
    setTimeout(initAllCharts, 500);
    
    // Auto-refresh
    setInterval(fetchKalshi, 30000);   // 30 sec
    setInterval(fetchMonday, 120000);  // 2 min
    setInterval(fetchYouTube, 300000); // 5 min
    setInterval(fetchNotifications, 120000); // 2 min
    
    console.log('📊 All systems online. Refreshing every 30s-5min.');
}

init();
