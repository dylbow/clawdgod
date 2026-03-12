#!/usr/bin/env node

/**
 * Update Pipeline State
 * 
 * Usage:
 *   node scripts/update-pipeline.js add "mars-exploration" "Mars Exploration" voiceover
 *   node scripts/update-pipeline.js update "mars-exploration" images
 *   node scripts/update-pipeline.js complete "mars-exploration" images
 *   node scripts/update-pipeline.js list
 *   node scripts/update-pipeline.js remove "mars-exploration"
 */

const fs = require('fs');
const path = require('path');

const STATE_FILE = path.join(__dirname, '..', 'pipeline-state.json');
const STAGES = ['voiceover', 'images', 'video-creation', 'video-upload'];

function loadState() {
  try {
    if (!fs.existsSync(STATE_FILE)) {
      return {};
    }
    return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
  } catch(e) {
    console.error('Error loading state:', e.message);
    return {};
  }
}

function saveState(state) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf8');
  console.log('✅ State saved to pipeline-state.json');
}

function addVideo(id, title, stage = 'voiceover', type = 'short', channel = 'Theoretika') {
  const state = loadState();
  
  if (state[id]) {
    console.error(`❌ Video "${id}" already exists. Use 'update' to modify.`);
    process.exit(1);
  }
  
  if (!STAGES.includes(stage)) {
    console.error(`❌ Invalid stage "${stage}". Valid stages: ${STAGES.join(', ')}`);
    process.exit(1);
  }
  
  state[id] = {
    title: title,
    stage: stage,
    stages_complete: [],
    last_updated: new Date().toISOString(),
    type: type,
    channel: channel,
    notes: ''
  };
  
  saveState(state);
  console.log(`✅ Added "${title}" at stage: ${stage}`);
}

function updateVideo(id, newStage) {
  const state = loadState();
  
  if (!state[id]) {
    console.error(`❌ Video "${id}" not found.`);
    process.exit(1);
  }
  
  if (!STAGES.includes(newStage)) {
    console.error(`❌ Invalid stage "${newStage}". Valid stages: ${STAGES.join(', ')}`);
    process.exit(1);
  }
  
  state[id].stage = newStage;
  state[id].last_updated = new Date().toISOString();
  
  saveState(state);
  console.log(`✅ Updated "${state[id].title}" to stage: ${newStage}`);
}

function completeStage(id, stage) {
  const state = loadState();
  
  if (!state[id]) {
    console.error(`❌ Video "${id}" not found.`);
    process.exit(1);
  }
  
  if (!STAGES.includes(stage)) {
    console.error(`❌ Invalid stage "${stage}". Valid stages: ${STAGES.join(', ')}`);
    process.exit(1);
  }
  
  // Add to stages_complete if not already there
  if (!state[id].stages_complete.includes(stage)) {
    state[id].stages_complete.push(stage);
  }
  
  // Move to next stage
  const currentIndex = STAGES.indexOf(stage);
  if (currentIndex < STAGES.length - 1) {
    state[id].stage = STAGES[currentIndex + 1];
  } else {
    // All stages complete
    state[id].stage = 'video-upload';
  }
  
  state[id].last_updated = new Date().toISOString();
  
  saveState(state);
  console.log(`✅ Completed "${stage}" for "${state[id].title}" → now at: ${state[id].stage}`);
}

function listVideos() {
  const state = loadState();
  const videos = Object.entries(state);
  
  if (videos.length === 0) {
    console.log('📭 No videos in pipeline.');
    return;
  }
  
  console.log('\n📊 Content Pipeline Status:\n');
  
  videos.forEach(([id, video]) => {
    const progress = `${video.stages_complete.length}/${STAGES.length}`;
    const completedStages = video.stages_complete.join(', ') || 'none';
    
    console.log(`🎬 ${video.title} (${id})`);
    console.log(`   Current stage: ${video.stage}`);
    console.log(`   Progress: ${progress}`);
    console.log(`   Completed: ${completedStages}`);
    console.log(`   Last updated: ${new Date(video.last_updated).toLocaleString()}`);
    console.log('');
  });
}

function removeVideo(id) {
  const state = loadState();
  
  if (!state[id]) {
    console.error(`❌ Video "${id}" not found.`);
    process.exit(1);
  }
  
  const title = state[id].title;
  delete state[id];
  
  saveState(state);
  console.log(`✅ Removed "${title}" from pipeline.`);
}

// ========== CLI ==========

const [,, command, ...args] = process.argv;

if (!command) {
  console.log(`
Usage:
  node scripts/update-pipeline.js add <id> <title> [stage] [type] [channel]
  node scripts/update-pipeline.js update <id> <new-stage>
  node scripts/update-pipeline.js complete <id> <stage>
  node scripts/update-pipeline.js list
  node scripts/update-pipeline.js remove <id>

Stages: ${STAGES.join(', ')}

Examples:
  node scripts/update-pipeline.js add "mars-colony" "Mars Colony" voiceover
  node scripts/update-pipeline.js complete "mars-colony" voiceover
  node scripts/update-pipeline.js update "mars-colony" video-creation
  node scripts/update-pipeline.js list
  `);
  process.exit(0);
}

switch(command) {
  case 'add':
    if (args.length < 2) {
      console.error('❌ Usage: add <id> <title> [stage] [type] [channel]');
      process.exit(1);
    }
    addVideo(args[0], args[1], args[2], args[3], args[4]);
    break;
    
  case 'update':
    if (args.length < 2) {
      console.error('❌ Usage: update <id> <new-stage>');
      process.exit(1);
    }
    updateVideo(args[0], args[1]);
    break;
    
  case 'complete':
    if (args.length < 2) {
      console.error('❌ Usage: complete <id> <stage>');
      process.exit(1);
    }
    completeStage(args[0], args[1]);
    break;
    
  case 'list':
    listVideos();
    break;
    
  case 'remove':
    if (args.length < 1) {
      console.error('❌ Usage: remove <id>');
      process.exit(1);
    }
    removeVideo(args[0]);
    break;
    
  default:
    console.error(`❌ Unknown command: ${command}`);
    process.exit(1);
}
