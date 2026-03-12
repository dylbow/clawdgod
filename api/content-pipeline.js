const fs = require('fs');
const path = require('path');

// New pipeline stages (in order)
const STAGES = ['voiceover', 'images', 'video-creation', 'video-upload'];

// Load pipeline state from JSON file
function loadPipelineState() {
  const stateFile = path.join(__dirname, '..', 'pipeline-state.json');
  
  try {
    if (!fs.existsSync(stateFile)) {
      console.log('pipeline-state.json not found, creating empty state');
      return {};
    }
    
    const data = fs.readFileSync(stateFile, 'utf8');
    return JSON.parse(data);
  } catch(e) {
    console.error('Error loading pipeline state:', e.message);
    return {};
  }
}

// Organize videos by current stage
function organizePipeline() {
  const state = loadPipelineState();
  
  const pipeline = {
    voiceover: [],
    images: [],
    'video-creation': [],
    'video-upload': [],
    done: []
  };
  
  Object.entries(state).forEach(([id, video]) => {
    const currentStage = video.stage || 'voiceover';
    const stagesComplete = video.stages_complete || [];
    
    const videoCard = {
      id: id,
      title: video.title || id.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
      type: video.type || 'short',
      channel: video.channel || 'Theoretika',
      stage: currentStage,
      stages_complete: stagesComplete,
      progress: `${stagesComplete.length}/${STAGES.length}`,
      note: video.notes || ''
    };
    
    // If all stages complete, put in "done"
    if (stagesComplete.length === STAGES.length || currentStage === 'done' || currentStage === 'video-upload' && stagesComplete.includes('video-upload')) {
      pipeline.done.push(videoCard);
    } else {
      // Put in current stage column
      if (pipeline[currentStage]) {
        pipeline[currentStage].push(videoCard);
      } else {
        // Fallback to first incomplete stage
        const nextStage = STAGES.find(s => !stagesComplete.includes(s)) || 'voiceover';
        pipeline[nextStage].push(videoCard);
      }
    }
  });
  
  return pipeline;
}

module.exports = (req, res) => {
  res.setHeader('Cache-Control', 's-maxage=60'); // 1 min cache
  
  try {
    const pipeline = organizePipeline();
    const state = loadPipelineState();
    
    res.json({
      pipeline,
      counts: {
        voiceover: pipeline.voiceover.length,
        images: pipeline.images.length,
        'video-creation': pipeline['video-creation'].length,
        'video-upload': pipeline['video-upload'].length,
        done: pipeline.done.length
      },
      total_videos: Object.keys(state).length,
      last_updated: new Date().toISOString()
    });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
};
