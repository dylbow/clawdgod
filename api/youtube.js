const fs = require('fs');
const path = require('path');

module.exports = (req, res) => {
  try {
    // Try reading from multiple possible paths (Vercel + local)
    const paths = [
      path.join(process.cwd(), 'public', 'youtube-data.json'),
      path.join(__dirname, '..', 'public', 'youtube-data.json'),
      path.join(__dirname, '..', 'youtube-data.json'),
    ];
    
    for (const p of paths) {
      try {
        const data = JSON.parse(fs.readFileSync(p, 'utf8'));
        res.setHeader('Cache-Control', 's-maxage=300');
        return res.json(data);
      } catch(e) { continue; }
    }
    
    // Fallback with latest known data
    res.json({ subscribers: 70, views: 8634, videos: 18, watchHours: 68.7 });
  } catch(e) {
    res.json({ subscribers: 70, views: 8634, videos: 18, watchHours: 68.7 });
  }
};
