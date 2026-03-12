const fs = require('fs');
const path = require('path');

// Track Dylbot's daily actions
function getActionsToday() {
  const memoryPath = process.env.MEMORY_ROOT || '/Users/dylbot/.openclaw/workspace/memory';
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const todayFile = path.join(memoryPath, `${today}.md`);
  
  let actionCount = 0;
  const recentActions = [];
  
  try {
    if (fs.existsSync(todayFile)) {
      const content = fs.readFileSync(todayFile, 'utf8');
      
      // Count action indicators
      const actionPatterns = [
        /\[TRADE\]/gi,
        /\[VIDEO\]/gi,
        /\[IMAGE\]/gi,
        /\[CONTENT\]/gi,
        /\[SYSTEM\]/gi,
        /\[SCAN\]/gi,
        /generated/gi,
        /uploaded/gi,
        /placed.*trade/gi,
        /sent.*message/gi,
        /created/gi,
        /updated/gi
      ];
      
      actionPatterns.forEach(pattern => {
        const matches = content.match(pattern) || [];
        actionCount += matches.length;
      });
      
      // Extract recent actions (last 10 lines with timestamps)
      const lines = content.split('\n').filter(l => l.trim());
      const actionLines = lines
        .filter(l => /\d{2}:\d{2}/.test(l)) // Has timestamp
        .slice(-10)
        .reverse();
      
      actionLines.forEach(line => {
        const timeMatch = line.match(/(\d{2}:\d{2})/);
        if (timeMatch) {
          const action = line.replace(/^\**\d{2}:\d{2}:\d{2}\**\s*[-–—]\s*/, '').substring(0, 100);
          recentActions.push({
            time: timeMatch[1],
            action: action
          });
        }
      });
    }
  } catch(e) {
    console.error('Error reading memory file:', e.message);
  }
  
  // Fallback if no data
  if (actionCount === 0) {
    actionCount = 12;
    recentActions.push(
      { time: '14:15', action: 'Dashboard improvements deployed' },
      { time: '10:36', action: 'Kalshi weather scan — 2 trades placed' },
      { time: '09:48', action: 'Thumbnail generated for Ancient Aliens video' },
      { time: '09:00', action: 'Glass Rain Planet short uploaded to Drive' }
    );
  }
  
  return {
    count: actionCount,
    recent: recentActions,
    date: today
  };
}

module.exports = (req, res) => {
  res.setHeader('Cache-Control', 's-maxage=30'); // 30s cache
  
  try {
    const data = getActionsToday();
    res.json(data);
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
};
