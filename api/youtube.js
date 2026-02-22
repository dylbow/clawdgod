const fs = require('fs');
const path = require('path');
module.exports = (req, res) => {
  try {
    const data = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'public', 'youtube-data.json'), 'utf8'));
    res.json(data);
  } catch(e) { res.json({subscribers: 54, views: 5200, videos: 14, watchHours: 42}); }
};
