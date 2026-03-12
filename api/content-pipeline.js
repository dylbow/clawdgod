const fs = require('fs');
const path = require('path');

// Dylan's 4-stage workflow
const STAGES = ['voiceover', 'image-generation', 'video-creation', 'video-upload'];

// Stage display names
const STAGE_NAMES = {
  'voiceover': 'Voiceover',
  'image-generation': 'Image Generation',
  'video-creation': 'Video Creation',
  'video-upload': 'Video Upload'
};

// Content directory (where video projects live)
const CONTENT_DIR = path.join(__dirname, '..', '..', '..', 'youtube');

// Detect current stage based on files present
function detectStage(projectPath) {
  try {
    const files = fs.readdirSync(projectPath);
    
    // Check for file types
    const hasMP3 = files.some(f => f.endsWith('.mp3'));
    const hasImages = files.some(f => f.endsWith('.jpg') || f.endsWith('.png'));
    const hasMP4 = files.some(f => f.endsWith('.mp4'));
    
    // Stage priority (show the FURTHEST stage reached)
    if (hasMP4) {
      return 'video-upload';
    } else if (hasMP3 && hasImages) {
      return 'video-creation';
    } else if (hasImages) {
      return 'image-generation';
    } else if (hasMP3) {
      return 'voiceover';
    }
    
    // Default: no files yet, first stage
    return 'voiceover';
  } catch(e) {
    console.error(`Error detecting stage for ${projectPath}:`, e.message);
    return 'voiceover';
  }
}

// Get all video projects
function scanContentProjects() {
  const projects = [];
  
  try {
    if (!fs.existsSync(CONTENT_DIR)) {
      console.log(`Content directory not found: ${CONTENT_DIR}`);
      return projects;
    }
    
    const entries = fs.readdirSync(CONTENT_DIR, { withFileTypes: true });
    
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      
      // Skip utility directories
      if (['scripts', 'branding', 'lora-training'].includes(entry.name)) continue;
      
      const projectPath = path.join(CONTENT_DIR, entry.name);
      const stage = detectStage(projectPath);
      
      // Calculate progress (stages completed)
      const stageIndex = STAGES.indexOf(stage);
      const stagesComplete = STAGES.slice(0, stageIndex + 1);
      
      projects.push({
        id: entry.name,
        title: entry.name.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
        type: entry.name.startsWith('short-') ? 'short' : 'video',
        channel: 'Theoretika',
        stage: stage,
        stages_complete: stagesComplete,
        progress: `${stagesComplete.length}/${STAGES.length}`,
        path: projectPath
      });
    }
  } catch(e) {
    console.error('Error scanning content projects:', e.message);
  }
  
  return projects;
}

// Organize videos by current stage
function organizePipeline() {
  const projects = scanContentProjects();
  
  const pipeline = {
    'voiceover': [],
    'image-generation': [],
    'video-creation': [],
    'video-upload': []
  };
  
  for (const project of projects) {
    const stage = project.stage;
    if (pipeline[stage]) {
      pipeline[stage].push(project);
    }
  }
  
  return pipeline;
}

module.exports = (req, res) => {
  res.setHeader('Cache-Control', 's-maxage=60'); // 1 min cache
  
  try {
    const pipeline = organizePipeline();
    const totalVideos = Object.values(pipeline).reduce((sum, arr) => sum + arr.length, 0);
    
    res.json({
      pipeline,
      counts: {
        'voiceover': pipeline['voiceover'].length,
        'image-generation': pipeline['image-generation'].length,
        'video-creation': pipeline['video-creation'].length,
        'video-upload': pipeline['video-upload'].length
      },
      stage_names: STAGE_NAMES,
      total_videos: totalVideos,
      last_updated: new Date().toISOString()
    });
  } catch(e) {
    console.error('Pipeline API error:', e);
    res.status(500).json({ error: e.message });
  }
};
