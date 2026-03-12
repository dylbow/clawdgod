const fs = require('fs');
const path = require('path');

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 's-maxage=10');
  
  try {
    // Read health data from the JSON file (updated by cron/heartbeat)
    const healthFilePath = path.join(__dirname, 'health-data.json');
    
    if (!fs.existsSync(healthFilePath)) {
      return res.json({
        error: 'Health data not available yet',
        hint: 'Waiting for first health update from agent',
        status: 'pending'
      });
    }
    
    const data = JSON.parse(fs.readFileSync(healthFilePath, 'utf8'));
    
    // Calculate data freshness
    const timestamp = new Date(data.timestamp);
    const ageMs = Date.now() - timestamp.getTime();
    const ageMin = Math.round(ageMs / 60000);
    
    // Add freshness indicator
    data.freshness = {
      ageMinutes: ageMin,
      status: ageMin < 10 ? 'fresh' : ageMin < 30 ? 'recent' : 'stale'
    };
    
    res.json(data);
  } catch(e) {
    res.status(500).json({
      error: 'Failed to read health data',
      message: e.message,
      status: 'error'
    });
  }
};
