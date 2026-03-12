const fs = require('fs');
const path = require('path');

module.exports = async (req, res) => {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    // Write a flag file that the heartbeat/cron will pick up
    const flagPath = path.join(__dirname, '../../..', '.compact-requested');
    const timestamp = new Date().toISOString();
    
    fs.writeFileSync(flagPath, `Compact requested via dashboard at ${timestamp}\n`);
    
    res.json({
      success: true,
      message: 'Compact request queued',
      hint: 'The agent will process this on next heartbeat (~5 min)',
      timestamp
    });
  } catch(e) {
    res.status(500).json({
      error: 'Failed to write compact flag',
      message: e.message
    });
  }
};
