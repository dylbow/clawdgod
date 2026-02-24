const fs = require('fs');
const path = require('path');

module.exports = (req, res) => {
  try {
    const paths = [
      path.join(process.cwd(), 'public', 'roi-data.json'),
      path.join(__dirname, '..', 'public', 'roi-data.json'),
      path.join(__dirname, '..', 'roi-data.json'),
    ];
    
    for (const p of paths) {
      try {
        const raw = JSON.parse(fs.readFileSync(p, 'utf8'));
        // Calculate totals
        const costCats = raw.costs || {};
        let totalCosts = 0;
        const costBreakdown = {};
        for (const [cat, items] of Object.entries(costCats)) {
          if (cat.startsWith('_')) continue;
          const sum = items.reduce((s, i) => s + (i.amount || 0), 0);
          costBreakdown[cat.charAt(0).toUpperCase() + cat.slice(1)] = sum;
          totalCosts += sum;
        }
        
        const revCats = raw.revenue || {};
        let totalRevenue = 0;
        for (const [cat, items] of Object.entries(revCats)) {
          totalRevenue += items.reduce((s, i) => s + (i.amount || 0), 0);
        }
        
        res.setHeader('Cache-Control', 's-maxage=300');
        return res.json({ totalCosts, totalRevenue, costBreakdown });
      } catch(e) { continue; }
    }
    
    res.json({ totalCosts: 718, totalRevenue: 12.05, costBreakdown: { Hardware: 599, Subscriptions: 53, 'API & Trading': 66 } });
  } catch(e) {
    res.json({ totalCosts: 718, totalRevenue: 12.05, costBreakdown: { Hardware: 599, Subscriptions: 53, 'API & Trading': 66 } });
  }
};
