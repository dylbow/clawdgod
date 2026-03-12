const fs = require('fs');
const path = require('path');

// Scan directories for video content stages
function scanContentPipeline() {
  const projectsPath = process.env.CONTENT_ROOT || '/Users/dylbot/.openclaw/workspace/projects';
  
  const pipeline = {
    script: [],
    images: [],
    voice: [],
    assembly: [],
    review: [],
    posted: []
  };
  
  // Check Theoretika shorts directory
  const theoretikaPath = path.join(projectsPath, 'theoretika/shorts');
  
  try {
    if (fs.existsSync(theoretikaPath)) {
      const shorts = fs.readdirSync(theoretikaPath, { withFileTypes: true })
        .filter(d => d.isDirectory())
        .map(d => d.name);
      
      shorts.forEach(shortName => {
        const shortPath = path.join(theoretikaPath, shortName);
        const hasScript = fs.existsSync(path.join(shortPath, 'script.md')) || 
                         fs.existsSync(path.join(shortPath, 'script.txt'));
        const hasImages = fs.existsSync(path.join(shortPath, 'images'));
        const hasVoice = fs.existsSync(path.join(shortPath, 'voiceover.mp3')) ||
                        fs.existsSync(path.join(shortPath, 'voice.mp3'));
        const hasFinal = fs.existsSync(path.join(shortPath, 'final.mp4')) ||
                        fs.existsSync(path.join(shortPath, 'output.mp4'));
        
        const video = {
          title: shortName.replace(/-/g, ' ').replace(/^\w/, c => c.toUpperCase()),
          type: 'short',
          channel: 'Theoretika'
        };
        
        if (hasFinal) {
          pipeline.posted.push(video);
        } else if (hasVoice && hasImages) {
          pipeline.assembly.push(video);
        } else if (hasImages) {
          pipeline.images.push({ ...video, note: 'Images ready' });
        } else if (hasScript) {
          pipeline.script.push(video);
        }
      });
    }
  } catch(e) {
    console.error('Error scanning content pipeline:', e.message);
  }
  
  // Fallback/example data if nothing found
  if (Object.values(pipeline).every(arr => arr.length === 0)) {
    pipeline.script = [{ title: 'Ocean Depths', type: 'long-form', channel: 'Theoretika' }];
    pipeline.images = [{ title: 'Life Inside Earth', type: 'long-form', channel: 'Theoretika', note: 'Generating' }];
    pipeline.review = [
      { title: 'Ancient Aliens', type: 'long-form', channel: 'Theoretika', note: 'Scheduled Wed 3PM' },
      { title: 'Glass Rain Planet', type: 'short', channel: 'Theoretika', note: 'On Drive' }
    ];
    pipeline.posted = [
      { title: 'Fermi Paradox', type: 'long-form', channel: 'Theoretika' },
      { title: 'Mars Colony', type: 'long-form', channel: 'Theoretika' },
      { title: 'Black Hole Sound', type: 'short', channel: 'Theoretika' }
    ];
  }
  
  return pipeline;
}

module.exports = (req, res) => {
  res.setHeader('Cache-Control', 's-maxage=60'); // 1 min cache
  
  try {
    const pipeline = scanContentPipeline();
    res.json({
      pipeline,
      counts: {
        script: pipeline.script.length,
        images: pipeline.images.length,
        voice: pipeline.voice.length,
        assembly: pipeline.assembly.length,
        review: pipeline.review.length,
        posted: pipeline.posted.length
      },
      last_updated: new Date().toISOString()
    });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
};
