const fs = require('fs');
const path = require('path');
module.exports = (req, res) => {
  try {
    const data = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'public', 'roi-data.json'), 'utf8'));
    res.json(data);
  } catch(e) { res.json({error: e.message}); }
};
