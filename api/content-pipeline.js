const fs = require('fs');
const path = require('path');
const os = require('os');

// Scan directories for video content stages
function scanContentPipeline() {
  const shortsPath = path.join(os.homedir(), 'Desktop/Theoretika/Shorts');
  
  const pipeline = {
    script: [],
    images: [],
    voice: [],
    assembly: [],
    review: [],
    posted: []
  };
  
  try {
    if (!fs.existsSync(shortsPath)) {
      console.log('Shorts directory not found:', shortsPath);
      return getFallbackData();
    }

    const files = fs.readdirSync(shortsPath);
    const projects = {};

    // Group files by project name
    files.forEach(filename => {
      const ext = path.extname(filename).toLowerCase();
      const basename = path.basename(filename, ext);
      
      // Extract project name (strip suffixes and numbers)
      // e.g., "gravity-doubled-final.mp4" → "gravity-doubled"
      // e.g., "black-holes-1.jpg" → "black-holes"
      // e.g., "ocean-depths-script.txt" → "ocean-depths"
      let projectName = basename
        .replace(/-final$|-script$|-voice$|-voiceover$/, '')  // Remove known suffixes
        .replace(/-\d+$/, '');  // Remove trailing numbers (e.g., -1, -2, -3)
      
      if (!projects[projectName]) {
        projects[projectName] = {
          name: projectName,
          hasScript: false,
          hasImages: false,
          hasVoice: false,
          hasFinal: false,
          imageCount: 0
        };
      }

      // Categorize file type
      if (['.txt', '.md'].includes(ext)) {
        projects[projectName].hasScript = true;
      } else if (['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext)) {
        projects[projectName].hasImages = true;
        projects[projectName].imageCount++;
      } else if (['.mp3', '.wav', '.m4a'].includes(ext)) {
        projects[projectName].hasVoice = true;
      } else if (ext === '.mp4') {
        projects[projectName].hasFinal = true;
      }
    });

    // Categorize each project into pipeline stages
    Object.entries(projects).forEach(([name, data]) => {
      const video = {
        title: name.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
        type: 'short',
        channel: 'Theoretika'
      };

      if (data.hasFinal) {
        pipeline.posted.push({ ...video, note: 'Complete' });
      } else if (data.hasVoice && data.hasImages) {
        pipeline.assembly.push({ ...video, note: 'Ready for editing' });
      } else if (data.hasVoice) {
        pipeline.voice.push({ ...video, note: 'Need images' });
      } else if (data.hasImages) {
        pipeline.images.push({ ...video, note: `${data.imageCount} image${data.imageCount > 1 ? 's' : ''}` });
      } else if (data.hasScript) {
        pipeline.script.push({ ...video, note: 'Script ready' });
      }
    });

  } catch(e) {
    console.error('Error scanning content pipeline:', e.message);
    return getFallbackData();
  }
  
  return pipeline;
}

function getFallbackData() {
  return {
    script: [{ title: 'Ocean Depths', type: 'long-form', channel: 'Theoretika' }],
    images: [{ title: 'Life Inside Earth', type: 'long-form', channel: 'Theoretika', note: 'Generating' }],
    voice: [],
    assembly: [],
    review: [
      { title: 'Ancient Aliens', type: 'long-form', channel: 'Theoretika', note: 'Scheduled Wed 3PM' },
      { title: 'Glass Rain Planet', type: 'short', channel: 'Theoretika', note: 'On Drive' }
    ],
    posted: [
      { title: 'Fermi Paradox', type: 'long-form', channel: 'Theoretika' },
      { title: 'Mars Colony', type: 'long-form', channel: 'Theoretika' },
      { title: 'Black Hole Sound', type: 'short', channel: 'Theoretika' }
    ]
  };
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
