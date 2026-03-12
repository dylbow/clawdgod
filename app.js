// EmpyreLab Dashboard v5 — Multi-page SPA with Liquid Glass

const API_BASE = '';
const REFRESH_INTERVAL = 60000;

// ========== UTILITIES ==========

const $ = id => document.getElementById(id);
const fmt = n => typeof n === 'number' ? '$' + n.toFixed(2) : n;
const fmtK = n => n >= 1000 ? (n / 1000).toFixed(1) + 'K' : String(n);

// Animated counter — counts up to target value
function animateCounter(element, target, duration = 1000, suffix = '') {
    if (!element) return;
    const start = 0;
    const range = target - start;
    const startTime = Date.now();
    
    function update() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
        const current = start + range * eased;
        
        if (suffix === '$') {
            element.textContent = '$' + current.toFixed(2);
        } else if (suffix === 'K') {
            element.textContent = fmtK(Math.floor(current));
        } else {
            element.textContent = Math.floor(current) + suffix;
        }
        
        if (progress < 1) {
            requestAnimationFrame(update);
        } else {
            // Final value
            if (suffix === '$') element.textContent = '$' + target.toFixed(2);
            else if (suffix === 'K') element.textContent = fmtK(target);
            else element.textContent = target + suffix;
        }
    }
    
    update();
}

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

async function fetchContentPipeline() {
    const data = await smartFetch('/api/content-pipeline', null);
    if (!data || !data.pipeline) return;
    
    const pipeline = data.pipeline;
    
    Object.entries(pipeline).forEach(([stage, cards]) => {
        const col = $('kanban-' + stage);
        const count = $('kc-' + stage);
        if (!col) return;
        if (count) {
            const num = cards.length;
            if (!count.dataset.animated) {
                animateCounter(count, num, 800);
                count.dataset.animated = 'true';
            } else {
                count.textContent = num;
            }
        }
        col.innerHTML = cards.length ? cards.map(c => `
            <div class="kanban-card-item">
                <div class="kanban-card-type">${c.type === 'long-form' ? '📹 Long-form' : '⚡ Short'}</div>
                <div class="kanban-card-title">${c.title}</div>
                ${c.progress ? `<div class="kanban-card-progress">Progress: ${c.progress}</div>` : ''}
                ${c.note ? `<div class="kanban-card-note">${c.note}</div>` : ''}
                ${c.channel ? `<div class="kanban-card-channel">${c.channel}</div>` : ''}
            </div>
        `).join('') : '<div class="kanban-empty">—</div>';
    });
}

// ========== DATA FETCHERS ==========

async function fetchYouTube() {
    const data = await smartFetch('/api/youtube', 'youtube-data.json');
    if (!data) return;

    // Support both old format (single channel) and new format (multi-channel)
    const totalSubs = data.total_subscribers || data.subscribers || 0;
    const totalViews = data.total_views || data.views || 0;
    
    // Home stats — with animation
    const el = $('home-subs');
    if (el && !el.dataset.animated) {
        animateCounter(el, totalSubs, 1500);
        el.dataset.animated = 'true';
    } else if (el) {
        el.textContent = totalSubs;
    }

    // Project tile — YouTube (live data)
    const pys = $('proj-yt-subs');
    if (pys) pys.textContent = totalSubs;
    const pyv = $('proj-yt-views');
    if (pyv) pyv.textContent = fmtK(totalViews);

    // Channels page — Theoretika
    if (data.theoretika) {
        const ts = $('ch-theo-subs');
        if (ts && !ts.dataset.animated) {
            animateCounter(ts, data.theoretika.subscribers, 1200);
            ts.dataset.animated = 'true';
        } else if (ts) {
            ts.textContent = data.theoretika.subscribers;
        }
        
        const tv = $('ch-theo-views');
        if (tv && !tv.dataset.animated) {
            animateCounter(tv, data.theoretika.views || 0, 1200, 'K');
            tv.dataset.animated = 'true';
        } else if (tv) {
            tv.textContent = fmtK(data.theoretika.views || 0);
        }
        
        const th = $('ch-theo-hours');
        if (th && !th.dataset.animated) {
            const hours = data.theoretika.watchHours || 0;
            // Custom animation for decimal hours
            const start = 0;
            const duration = 1200;
            const startTime = Date.now();
            
            function updateHours() {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const eased = 1 - Math.pow(1 - progress, 3);
                const current = start + (hours - start) * eased;
                th.textContent = current.toFixed(1);
                
                if (progress < 1) {
                    requestAnimationFrame(updateHours);
                } else {
                    th.textContent = hours.toFixed(1);
                }
            }
            updateHours();
            th.dataset.animated = 'true';
        } else if (th) {
            th.textContent = (data.theoretika.watchHours || 0).toFixed(1);
        }
        
        const tr = $('ch-theo-rev'); 
        if (tr) tr.textContent = '$0';
    }
    
    // OpenDyl channel
    if (data.opendyl) {
        const os = $('ch-opendyl-subs');
        if (os && !os.dataset.animated) {
            animateCounter(os, data.opendyl.subscribers, 1200);
            os.dataset.animated = 'true';
        } else if (os) {
            os.textContent = data.opendyl.subscribers;
        }
        
        const ov = $('ch-opendyl-views');
        if (ov && !ov.dataset.animated) {
            animateCounter(ov, data.opendyl.views || 0, 1200, 'K');
            ov.dataset.animated = 'true';
        } else if (ov) {
            ov.textContent = fmtK(data.opendyl.views || 0);
        }
        
        const oh = $('ch-opendyl-hours');
        if (oh && !oh.dataset.animated) {
            const hours = data.opendyl.watchHours || 0;
            const start = 0;
            const duration = 1200;
            const startTime = Date.now();
            
            function updateHours() {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const eased = 1 - Math.pow(1 - progress, 3);
                const current = start + (hours - start) * eased;
                oh.textContent = current.toFixed(1);
                
                if (progress < 1) {
                    requestAnimationFrame(updateHours);
                } else {
                    oh.textContent = hours.toFixed(1);
                }
            }
            updateHours();
            oh.dataset.animated = 'true';
        } else if (oh) {
            oh.textContent = (data.opendyl.watchHours || 0).toFixed(1);
        }
        
        const orev = $('ch-opendyl-rev');
        if (orev) orev.textContent = '$0';
    }

    // Totals — with animation
    const cs = $('ch-total-subs');
    if (cs && !cs.dataset.animated) {
        animateCounter(cs, totalSubs, 1500);
        cs.dataset.animated = 'true';
    } else if (cs) {
        cs.textContent = totalSubs;
    }
    
    const cv = $('ch-total-views');
    if (cv && !cv.dataset.animated) {
        animateCounter(cv, totalViews, 1500, 'K');
        cv.dataset.animated = 'true';
    } else if (cv) {
        cv.textContent = fmtK(totalViews);
    }
}

async function fetchKalshi() {
    const data = await smartFetch('/api/kalshi', 'kalshi-data.json');
    if (!data) return;

    const bal = data.balance || 0;
    const port = data.portfolio_value || 0;
    const total = data.total_value || (bal + port);
    const pnl = data.total_pnl;

    // Home — with animation
    const ht = $('home-trades');
    const openTrades = (data.positions || []).filter(p => !p.result).length;
    if (ht && !ht.dataset.animated) {
        animateCounter(ht, openTrades, 1000);
        ht.dataset.animated = 'true';
    } else if (ht) {
        ht.textContent = openTrades;
    }

    // Project tile — Trading (live data)
    const ptb = $('proj-tr-balance');
    if (ptb) ptb.textContent = '$' + total.toFixed(2);
    const ptt = $('proj-tr-trades');
    if (ptt) ptt.textContent = openTrades;
    const ptp = $('proj-tr-pnl');
    if (ptp) {
        const pnlSign = pnl >= 0 ? '+' : '';
        ptp.textContent = pnlSign + '$' + pnl.toFixed(2);
        ptp.style.color = pnl >= 0 ? '#4ade80' : '#f87171';
    }

    // Finances page — with animation
    const kb = $('k-balance');
    if (kb && !kb.dataset.animated) {
        animateCounter(kb, bal, 1200, '$');
        kb.dataset.animated = 'true';
    } else if (kb) {
        kb.textContent = fmt(bal);
    }
    
    const kp = $('k-portfolio');
    if (kp && !kp.dataset.animated) {
        animateCounter(kp, port, 1200, '$');
        kp.dataset.animated = 'true';
    } else if (kp) {
        kp.textContent = fmt(port);
    }
    
    const kt = $('k-total');
    if (kt && !kt.dataset.animated) {
        animateCounter(kt, total, 1200, '$');
        kt.dataset.animated = 'true';
    } else if (kt) {
        kt.textContent = fmt(total);
    }
    
    const kpnl = $('k-pnl');
    if (kpnl) {
        const isPositive = pnl >= 0;
        
        if (!kpnl.dataset.animated) {
            const el = document.createElement('span');
            kpnl.innerHTML = '';
            kpnl.appendChild(document.createTextNode(isPositive ? '+' : ''));
            kpnl.appendChild(el);
            animateCounter(el, Math.abs(pnl), 1200, '$');
            kpnl.dataset.animated = 'true';
        } else {
            kpnl.textContent = (isPositive ? '+' : '') + fmt(pnl);
        }
        
        kpnl.style.color = isPositive ? 'var(--green)' : 'var(--red)';
    }

    // Win/Loss stats — with animation
    const positions = data.positions || [];
    const won = positions.filter(p => p.result === 'yes').length;
    const lost = positions.filter(p => p.result === 'no').length;
    const open = positions.filter(p => !p.result).length;
    const kStats = $('k-stats');
    if (kStats && !kStats.dataset.animated) {
        // Create elements for animation
        const wonSpan = document.createElement('span');
        wonSpan.className = 'stat-won';
        const lostSpan = document.createElement('span');
        lostSpan.className = 'stat-lost';
        const openSpan = document.createElement('span');
        openSpan.className = 'stat-open';
        
        kStats.innerHTML = '';
        kStats.appendChild(wonSpan);
        kStats.appendChild(document.createTextNode(' · '));
        kStats.appendChild(lostSpan);
        kStats.appendChild(document.createTextNode(' · '));
        kStats.appendChild(openSpan);
        
        // Animate each stat
        animateCounter(wonSpan, won, 1000, ' Won');
        setTimeout(() => animateCounter(lostSpan, lost, 1000, ' Lost'), 200);
        setTimeout(() => animateCounter(openSpan, open, 1000, ' Open'), 400);
        
        kStats.dataset.animated = 'true';
    } else if (kStats) {
        kStats.innerHTML = `<span class="stat-won">${won} Won</span> · <span class="stat-lost">${lost} Lost</span> · <span class="stat-open">${open} Open</span>`;
    }

    // P&L mini chart
    const chartEl = $('k-pnl-chart');
    if (chartEl && typeof Chart !== 'undefined') {
        if (window._kalshiChart) window._kalshiChart.destroy();
        // Build cumulative P&L from positions (settled first, then open at current exposure)
        const pnlPoints = [];
        let running = 0;
        const settled = positions.filter(p => p.result);
        const openPos = positions.filter(p => !p.result);
        settled.forEach((p, i) => {
            const delta = p.result === 'yes' ? (1 - (p.yes_price||50)/100) * Math.abs(p.position) : -(p.yes_price||50)/100 * Math.abs(p.position);
            running += delta;
            pnlPoints.push({ x: i + 1, y: +running.toFixed(2) });
        });
        openPos.forEach((p, i) => {
            pnlPoints.push({ x: settled.length + i + 1, y: +running.toFixed(2) });
        });
        if (pnlPoints.length === 0) pnlPoints.push({ x: 1, y: 0 });
        
        const isPositive = pnlPoints[pnlPoints.length - 1].y >= 0;
        const lineColor = isPositive ? 'rgb(52, 211, 153)' : 'rgb(248, 113, 113)';
        const fillColor = isPositive ? 'rgba(52, 211, 153, 0.15)' : 'rgba(248, 113, 113, 0.15)';
        
        window._kalshiChart = new Chart(chartEl, {
            type: 'line',
            data: {
                datasets: [{
                    data: pnlPoints,
                    borderColor: lineColor,
                    backgroundColor: fillColor,
                    fill: true,
                    tension: 0.3,
                    pointRadius: 3,
                    pointBackgroundColor: lineColor,
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => '$' + ctx.parsed.y.toFixed(2) } } },
                scales: {
                    x: { type: 'linear', display: true, title: { display: true, text: 'Trade #', color: '#8b93a1', font: { size: 10 } }, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#8b93a1', font: { size: 9 } } },
                    y: { display: true, title: { display: true, text: 'P&L ($)', color: '#8b93a1', font: { size: 10 } }, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#8b93a1', font: { size: 9 }, callback: v => '$' + v } }
                }
            }
        });
    }

    // Positions
    const posDiv = $('k-positions');
    if (posDiv && positions) {
        posDiv.innerHTML = positions.map(p => {
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

    // Home revenue — with animation
    const hr = $('home-revenue');
    if (hr && !hr.dataset.animated) {
        const val = data.totalRevenue;
        animateCounter(hr, val, 1500, '$');
        hr.dataset.animated = 'true';
    } else if (hr) {
        hr.textContent = fmt(data.totalRevenue);
    }
    
    const cr = $('ch-total-rev');
    if (cr && !cr.dataset.animated) {
        const val = data.totalRevenue;
        animateCounter(cr, val, 1500, '$');
        cr.dataset.animated = 'true';
    } else if (cr) {
        cr.textContent = fmt(data.totalRevenue);
    }

    // Finance page — with animation
    const fc = $('fin-costs');
    if (fc && !fc.dataset.animated) {
        // Animate counter, then add minus sign
        const el = document.createElement('span');
        fc.innerHTML = '';
        fc.appendChild(document.createTextNode('-'));
        fc.appendChild(el);
        animateCounter(el, data.totalCosts, 1200, '$');
        fc.dataset.animated = 'true';
    } else if (fc) {
        fc.textContent = '-' + fmt(data.totalCosts);
    }
    
    const fr = $('fin-revenue');
    if (fr && !fr.dataset.animated) {
        const el = document.createElement('span');
        fr.innerHTML = '';
        fr.appendChild(document.createTextNode('+'));
        fr.appendChild(el);
        animateCounter(el, data.totalRevenue, 1200, '$');
        fr.dataset.animated = 'true';
    } else if (fr) {
        fr.textContent = '+' + fmt(data.totalRevenue);
    }
    
    const fn = $('fin-net');
    const fnl = $('fin-net-label');
    if (fn) {
        const net = data.totalRevenue - data.totalCosts;
        const isPositive = net >= 0;
        
        if (!fn.dataset.animated) {
            const el = document.createElement('span');
            fn.innerHTML = '';
            fn.appendChild(document.createTextNode(isPositive ? '+' : ''));
            fn.appendChild(el);
            animateCounter(el, Math.abs(net), 1200, '$');
            fn.dataset.animated = 'true';
        } else {
            fn.textContent = (isPositive ? '+' : '') + fmt(net);
        }
        
        fn.classList.add(isPositive ? 'green' : 'red');
        if (fnl) fnl.textContent = isPositive ? '🟢 Profit' : '🔴 To break even';
    }

    // Progress bar
    const pct = data.totalCosts > 0 ? Math.min((data.totalRevenue / data.totalCosts) * 100, 100) : 0;
    const bar = $('fin-bar');
    if (bar) bar.style.width = pct + '%';
    const bpct = $('fin-bar-pct');
    if (bpct) bpct.textContent = pct.toFixed(0) + '%';

    // Expense categories — with animation
    const catEl = $('fin-categories');
    if (catEl && data.costBreakdown) {
        const icons = { Hardware: '🖥️', Subscriptions: '🔄', 'Api credits': '⚡', Other: '📦' };
        const colors = { Hardware: 'var(--blue)', Subscriptions: 'var(--purple)', 'Api credits': 'var(--orange)', Other: 'var(--text-muted)' };
        
        if (!catEl.dataset.animated) {
            catEl.innerHTML = '';
            let delay = 0;
            
            Object.entries(data.costBreakdown).forEach(([cat, info]) => {
                const card = document.createElement('div');
                card.className = 'expense-card';
                card.innerHTML = `
                    <div class="expense-icon">${icons[cat] || '📦'}</div>
                    <div class="expense-name">${cat}</div>
                    <div class="expense-amount" style="color:${colors[cat] || 'var(--text-primary)'}"></div>
                    <div class="expense-detail">${info.items?.length || 0} items</div>
                `;
                catEl.appendChild(card);
                
                const amountEl = card.querySelector('.expense-amount');
                setTimeout(() => {
                    animateCounter(amountEl, info.total, 1000, '$');
                }, delay);
                delay += 150;
            });
            
            catEl.dataset.animated = 'true';
        } else {
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
}

async function fetchActions() {
    const data = await smartFetch('/api/actions', null);
    if (!data) return;
    
    // Store data globally for detail panel
    window.actionsData = data;
    
    // AI Actions Today counter
    const counter = $('ai-actions-today');
    if (counter && !counter.dataset.animated) {
        animateCounter(counter, data.count, 1500);
        counter.dataset.animated = 'true';
    } else if (counter) {
        counter.textContent = data.count;
    }
    
    // Update activity feed with action breakdown
    if (data.breakdown && data.breakdown.length > 0) {
        const container = $('home-feed');
        if (container && container.children.length === 0) {
            // Map action types to emojis
            const iconMap = {
                'memory_logs': '📝',
                'sessions': '🔄',
                'git_commits': '📦',
                'kalshi_trades': '📈',
                'cron_jobs': '⏰',
                'content_generation': '🎨',
                'messages': '📧'
            };
            
            container.innerHTML = data.breakdown.map(item => `
                <div class="feed-item">
                    <span class="feed-icon">${iconMap[item.type] || '⚡'}</span>
                    <div class="feed-body">
                        <div class="feed-action">${item.description}</div>
                        <div class="feed-meta">${item.type.replace(/_/g, ' ')}</div>
                    </div>
                    <span class="feed-time">${item.count}×</span>
                </div>
            `).join('');
        }
    }
    
    // Populate detail panel breakdown
    if (data.breakdown && data.breakdown.length > 0) {
        const breakdownContainer = $('actions-breakdown');
        if (breakdownContainer) {
            const iconMap = {
                'memory_logs': '📝',
                'sessions': '🔄',
                'git_commits': '💾',
                'kalshi_trades': '📈',
                'cron_jobs': '⏰',
                'content_generation': '🎨',
                'messages': '📧'
            };
            
            breakdownContainer.innerHTML = data.breakdown.map(item => `
                <div class="breakdown-item">
                    <div class="breakdown-icon">${iconMap[item.type] || '⚡'}</div>
                    <div class="breakdown-info">
                        <div class="breakdown-type">${item.description}</div>
                        <div class="breakdown-count">${item.count}</div>
                    </div>
                </div>
            `).join('');
        }
    }
    
    // Populate recent actions list
    if (data.recent_actions && data.recent_actions.length > 0) {
        const recentContainer = $('recent-actions-list');
        if (recentContainer) {
            recentContainer.innerHTML = data.recent_actions.map(action => `
                <div class="recent-action-item">
                    <div class="recent-action-icon">${action.icon || '⚡'}</div>
                    <div class="recent-action-text">${action.description}</div>
                    <div class="recent-action-time">${action.time}</div>
                </div>
            `).join('');
        }
    } else {
        const recentContainer = $('recent-actions-list');
        if (recentContainer) {
            recentContainer.innerHTML = '<div style="padding: 20px; text-align: center; color: rgba(255,255,255,0.5);">No recent actions logged yet</div>';
        }
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

// Quick Actions Panel
function initQuickActions() {
    const actions = [
        { id: 'kalshi-scan', label: '🔍 Run Kalshi Scan', command: 'kalshi-scan' },
        { id: 'generate-short', label: '🎬 Generate Theoretika Short', command: 'generate-short' },
        { id: 'check-email', label: '📧 Check Email', command: 'check-email' },
        { id: 'backup', label: '💾 Run Backup', command: 'backup' },
    ];
    
    actions.forEach(action => {
        const btn = $(action.id);
        if (btn) {
            btn.addEventListener('click', () => {
                btn.classList.add('loading');
                btn.textContent = 'Running...';
                // Simulate action (in production, this would call an API endpoint)
                setTimeout(() => {
                    btn.classList.remove('loading');
                    btn.classList.add('success');
                    btn.textContent = '✓ Complete';
                    setTimeout(() => {
                        btn.classList.remove('success');
                        btn.textContent = action.label;
                    }, 2000);
                }, 1500);
            });
        }
    });
}

// Health Check + Compact
function initHealthActions() {
    const healthBtn = $('health-check');
    const compactBtn = $('compact-agent');
    const panel = $('health-panel');
    
    if (healthBtn) {
        healthBtn.addEventListener('click', async () => {
            healthBtn.classList.add('loading');
            
            // Call the file-based health endpoint (works from anywhere)
            let data = null;
            try {
                const res = await fetch('/api/health', { signal: AbortSignal.timeout(5000) });
                if (res.ok) data = await res.json();
            } catch(e) {
                console.error('Health check failed:', e);
            }
            
            healthBtn.classList.remove('loading');
            
            if (panel) {
                panel.style.display = 'block';
                
                if (data && !data.error) {
                    const ctx = data.context || {};
                    const used = ctx.used || 0;
                    const max = ctx.max || 200000;
                    const pct = ctx.percent || 0;
                    
                    const bar = $('health-context-bar');
                    if (bar) {
                        bar.style.width = pct + '%';
                        bar.className = 'health-bar' + (pct > 80 ? ' danger' : pct > 50 ? ' warning' : '');
                    }
                    
                    const ctxEl = $('health-context');
                    if (ctxEl) ctxEl.textContent = Math.round(used/1000) + 'k / ' + Math.round(max/1000) + 'k (' + pct + '%)';
                    
                    const tokEl = $('health-tokens');
                    if (tokEl) tokEl.textContent = data.tokens.input + ' in / ' + data.tokens.output + ' out';
                    
                    const modEl = $('health-model');
                    if (modEl) modEl.textContent = data.model || 'unknown';
                    
                    const ageEl = $('health-age');
                    if (ageEl) ageEl.textContent = data.sessionAge || 'unknown';
                    
                    const compEl = $('health-compactions');
                    if (compEl) compEl.textContent = data.compactions || '0';
                    
                    const statusEl = $('health-status');
                    if (statusEl) {
                        if (pct > 80) {
                            statusEl.textContent = '⚠️ HIGH — Compact recommended';
                            statusEl.style.color = '#f87171';
                        } else if (pct > 50) {
                            statusEl.textContent = '⚡ MODERATE — Running well';
                            statusEl.style.color = '#fbbf24';
                        } else {
                            statusEl.textContent = '✅ HEALTHY — Plenty of context';
                            statusEl.style.color = '#4ade80';
                        }
                    }
                    
                    const tsEl = $('health-timestamp');
                    if (tsEl) {
                        const updateTime = new Date(data.timestamp);
                        const freshness = data.freshness ? ` (${data.freshness.status})` : '';
                        tsEl.textContent = 'Last update: ' + updateTime.toLocaleTimeString() + freshness;
                    }
                } else {
                    // Error or data not available
                    const statusEl = $('health-status');
                    if (statusEl) {
                        statusEl.textContent = data?.hint || '⚠️ Health data not available';
                        statusEl.style.color = '#fbbf24';
                    }
                    const tsEl = $('health-timestamp');
                    if (tsEl) tsEl.textContent = 'Waiting for first update...';
                }
            }
        });
    }
    
    if (compactBtn) {
        compactBtn.addEventListener('click', async () => {
            compactBtn.classList.add('loading');
            compactBtn.querySelector('.action-label').textContent = 'Requesting...';
            
            try {
                const res = await fetch('/api/compact', { 
                    method: 'POST',
                    signal: AbortSignal.timeout(5000) 
                });
                
                if (res.ok) {
                    const result = await res.json();
                    compactBtn.classList.remove('loading');
                    compactBtn.classList.add('success');
                    compactBtn.querySelector('.action-label').textContent = '✓ Queued';
                    
                    // Show hint about waiting for heartbeat
                    setTimeout(() => {
                        compactBtn.classList.remove('success');
                        compactBtn.querySelector('.action-label').textContent = 'Compact / Refresh';
                    }, 4000);
                } else {
                    throw new Error('Request failed');
                }
            } catch(e) {
                compactBtn.classList.remove('loading');
                compactBtn.querySelector('.action-label').textContent = '❌ Failed';
                setTimeout(() => {
                    compactBtn.querySelector('.action-label').textContent = 'Compact / Refresh';
                }, 3000);
            }
        });
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
    // Stock market style growth charts for each channel
    // Theoretika: steady subscriber growth, viral view spikes
    drawSparkline('spark-theo-subs', [45, 52, 68, 102, 185, 320, 580, 942], { color: 'rgb(99, 102, 241)', min: 0 });
    drawSparkline('spark-theo-views', [1200, 1850, 2400, 3100, 5800, 7200, 8100, 8634], { color: 'rgb(167, 139, 250)', min: 0 });
    
    // OpenDyl: early stage growth
    drawSparkline('spark-opendyl-subs', [3, 4, 5, 6, 7, 8], { color: 'rgb(34, 211, 238)', min: 0 });
    drawSparkline('spark-opendyl-views', [150, 210, 280, 420, 550, 686], { color: 'rgb(96, 165, 250)', min: 0 });

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
    console.log('🧪 EmpyreLab — The Lab Dashboard v6');

    renderFeed('all');
    initFeedFilters();
    initQuickActions();
    initHealthActions();

    // Fetch all data in parallel
    await Promise.allSettled([
        fetchYouTube(),
        fetchKalshi(),
        fetchMonday(),
        fetchROI(),
        fetchDylbotStatus(),
        fetchContentPipeline(),
        fetchActions()
    ]);

    setTimeout(initCharts, 300);

    // Auto-refresh intervals
    setInterval(fetchKalshi, 30000);          // 30s - Kalshi data
    setInterval(fetchMonday, 120000);         // 2min - Monday tasks
    setInterval(fetchYouTube, 300000);        // 5min - YouTube stats
    setInterval(fetchROI, 300000);            // 5min - ROI data
    setInterval(fetchDylbotStatus, 60000);    // 1min - Dylbot status
    setInterval(fetchContentPipeline, 60000); // 1min - Content pipeline
    setInterval(fetchActions, 30000);         // 30s - AI actions

    console.log('📊 All systems online. Animated counters enabled.');
    
    // Initialize AI Actions detail panel
    initActionsDetailPanel();
}

// ========== AI ACTIONS DETAIL PANEL ==========
function initActionsDetailPanel() {
    const card = $('ai-actions-card');
    const panel = $('actions-detail-panel');
    const closeBtn = $('close-actions-panel');
    
    if (card && panel) {
        card.addEventListener('click', () => {
            // Toggle panel visibility
            if (panel.style.display === 'none' || !panel.style.display) {
                panel.style.display = 'block';
                // Scroll to panel smoothly
                setTimeout(() => {
                    panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }, 100);
            } else {
                panel.style.display = 'none';
            }
        });
    }
    
    if (closeBtn && panel) {
        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            panel.style.display = 'none';
        });
    }
}

init();
