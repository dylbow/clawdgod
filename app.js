// ClawdGod Dashboard — App Logic

// Clock
function updateClock() {
    const now = new Date();
    const options = { 
        timeZone: 'America/Phoenix',
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit',
        hour12: false 
    };
    document.getElementById('clock').textContent = now.toLocaleTimeString('en-US', options) + ' MST';
}
setInterval(updateClock, 1000);
updateClock();

// Uptime counter (from when page loaded)
const startTime = Date.now();
function updateUptime() {
    const elapsed = Date.now() - startTime;
    const hours = Math.floor(elapsed / 3600000);
    const mins = Math.floor((elapsed % 3600000) / 60000);
    const secs = Math.floor((elapsed % 60000) / 1000);
    document.getElementById('uptime').textContent = 
        `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}
setInterval(updateUptime, 1000);
updateUptime();

// Future: Connect to Kalshi API, YouTube API, Monday.com API
// For now, data is static/manually updated
console.log('⚡ ClawdGod Command Center initialized');
console.log('📊 Dashboard v1.0 — Static data mode');
console.log('🔜 Next: Live API connections');
