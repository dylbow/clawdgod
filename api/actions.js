const fs = require('fs');
const path = require('path');

// Track Dylbot's daily actions - reads from pre-generated JSON
module.exports = (req, res) => {
  res.setHeader('Cache-Control', 's-maxage=30'); // 30s cache
  
  try {
    // Read pre-generated actions data
    const dataPath = path.join(__dirname, 'actions-data.json');
    
    if (fs.existsSync(dataPath)) {
      const rawData = fs.readFileSync(dataPath, 'utf8');
      const data = JSON.parse(rawData);
      
      // Add recent actions summary from breakdown
      const recentActions = [];
      if (data.breakdown && Array.isArray(data.breakdown)) {
        data.breakdown.forEach(item => {
          if (item.count > 0) {
            recentActions.push({
              type: item.type,
              count: item.count,
              description: item.description
            });
          }
        });
      }
      
      // Return full data with recent actions
      res.json({
        count: data.count || 0,
        date: data.date,
        updated: data.updated,
        breakdown: data.breakdown || [],
        recent: recentActions
      });
    } else {
      // Fallback if file doesn't exist yet
      res.json({
        count: 0,
        date: new Date().toISOString().split('T')[0],
        updated: new Date().toISOString(),
        breakdown: [],
        recent: []
      });
    }
  } catch(e) {
    console.error('Error reading actions data:', e.message);
    res.status(500).json({ error: e.message });
  }
};
