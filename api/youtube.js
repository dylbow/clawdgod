const https = require('https');

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

// Active channel IDs (Theoretika, OpenDyl/dylbot)
const CHANNELS = {
  theoretika: 'UC_uHTi5uHWjR3gPslwWAlJw',
  opendyl: 'UCHAaQuRctKj6PXSl2d9pL2Q'
};

function youtubeRequest(endpoint) {
  return new Promise((resolve, reject) => {
    const url = `https://www.googleapis.com/youtube/v3/${endpoint}`;
    https.get(url, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } 
        catch(e) { reject(e); }
      });
    }).on('error', reject);
  });
}

async function getChannelStats(channelId) {
  try {
    const data = await youtubeRequest(`channels?part=statistics,snippet&id=${channelId}&key=${YOUTUBE_API_KEY}`);
    if (data.items && data.items[0]) {
      const stats = data.items[0].statistics;
      const snippet = data.items[0].snippet;
      return {
        title: snippet.title,
        subscribers: parseInt(stats.subscriberCount || 0),
        views: parseInt(stats.viewCount || 0),
        videos: parseInt(stats.videoCount || 0),
        thumbnail: snippet.thumbnails?.default?.url || ''
      };
    }
  } catch(e) {
    console.error('YouTube API error:', e.message);
  }
  return null;
}

// Fallback data when API fails or no key
const FALLBACK = {
  theoretika: { title: 'Theoretika', subscribers: 70, views: 8634, videos: 18, watchHours: 68.7, thumbnail: '' },
  opendyl: { title: 'OpenDyl', subscribers: 85, views: 12400, videos: 24, watchHours: 95.2, thumbnail: '' },
  total_subscribers: 155,
  total_views: 21034,
  total_videos: 42,
  last_updated: new Date().toISOString()
};

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 's-maxage=300'); // 5 min cache
  
  if (!YOUTUBE_API_KEY) {
    console.log('No YouTube API key, using fallback data');
    return res.json(FALLBACK);
  }
  
  try {
    const [theoretikaStats, opendylStats] = await Promise.all([
      getChannelStats(CHANNELS.theoretika),
      getChannelStats(CHANNELS.opendyl)
    ]);
    
    const theoretika = theoretikaStats || FALLBACK.theoretika;
    const opendyl = opendylStats || FALLBACK.opendyl;
    
    // Estimate watch hours (not available via API without Analytics API)
    const watchHours = {
      theoretika: (theoretika.views * 0.008).toFixed(1), // ~30s avg watch time
      opendyl: (opendyl.views * 0.012).toFixed(1) // ~45s avg
    };
    
    res.json({
      theoretika: { ...theoretika, watchHours: parseFloat(watchHours.theoretika) },
      opendyl: { ...opendyl, watchHours: parseFloat(watchHours.opendyl) },
      total_subscribers: theoretika.subscribers + opendyl.subscribers,
      total_views: theoretika.views + opendyl.views,
      total_videos: theoretika.videos + opendyl.videos,
      last_updated: new Date().toISOString()
    });
  } catch(e) {
    console.error('YouTube fetch error:', e);
    res.json(FALLBACK);
  }
};
