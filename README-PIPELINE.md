# Content Pipeline Tracking System ✅

## Overview

The dashboard now tracks Theoretika video production using a **JSON state file** (`pipeline-state.json`) instead of folder scanning. This gives accurate, manual control over each video's progress through the pipeline.

## Pipeline Stages

Each video progresses through these stages in order:

1. **🎙️ Voiceover** - Generate voiceover with ElevenLabs
2. **🎨 Images** - Generate images with ChatGPT/DALL-E or fal.ai
3. **🎬 Video Creation** - Assemble video in DaVinci Resolve
4. **📤 Video Upload** - Upload to YouTube
5. **✅ Done** - Completed and published

## State File Format

`pipeline-state.json` tracks each video:

```json
{
  "mars-colony": {
    "title": "Mars Colony",
    "stage": "voiceover",
    "stages_complete": [],
    "last_updated": "2026-03-12T14:55:00Z",
    "type": "short",
    "channel": "Theoretika",
    "notes": ""
  },
  "black-holes": {
    "title": "Black Holes Explained",
    "stage": "images",
    "stages_complete": ["voiceover"],
    "last_updated": "2026-03-12T15:00:00Z",
    "type": "short",
    "channel": "Theoretika",
    "notes": "Using Flux Pro for images"
  }
}
```

## Management Script

Use `scripts/update-pipeline.js` to manage videos:

### Add New Video

```bash
node scripts/update-pipeline.js add "mars-colony" "Mars Colony" voiceover
node scripts/update-pipeline.js add "ocean-depths" "Ocean Depths" images short Theoretika
```

### Complete a Stage (auto-advances to next)

```bash
node scripts/update-pipeline.js complete "mars-colony" voiceover
# → moves to "images" stage and marks "voiceover" as complete
```

### Update Stage Manually

```bash
node scripts/update-pipeline.js update "mars-colony" video-creation
```

### List All Videos

```bash
node scripts/update-pipeline.js list
```

Output:
```
📊 Content Pipeline Status:

🎬 Mars Colony (mars-colony)
   Current stage: voiceover
   Progress: 0/4
   Completed: none
   Last updated: 3/12/2026, 2:57:41 PM

🎬 Black Holes Explained (black-holes)
   Current stage: images
   Progress: 1/4
   Completed: voiceover
   Last updated: 3/12/2026, 2:57:41 PM
```

### Remove Video

```bash
node scripts/update-pipeline.js remove "mars-colony"
```

## Dashboard Display

The **Tasks & Pipeline** page shows a Kanban board with:

- Each column = one stage
- Cards show: title, type, progress (X/4), notes
- Auto-refreshes every 60 seconds
- Counts update with smooth animations

## API Endpoint

`GET /api/content-pipeline`

Returns:

```json
{
  "pipeline": {
    "voiceover": [{ "id": "mars-colony", "title": "Mars Colony", "progress": "0/4", ... }],
    "images": [{ "id": "black-holes", "title": "Black Holes", "progress": "1/4", ... }],
    "video-creation": [],
    "video-upload": [],
    "done": [{ "id": "gravity-doubled", "title": "Gravity Doubled", "progress": "4/4", ... }]
  },
  "counts": { "voiceover": 1, "images": 1, "video-creation": 0, "video-upload": 0, "done": 1 },
  "total_videos": 4,
  "last_updated": "2026-03-12T21:57:46.453Z"
}
```

## Workflow Example

1. **Start new video:**
   ```bash
   node scripts/update-pipeline.js add "ancient-aliens" "Ancient Aliens" voiceover
   ```

2. **After generating voiceover in ElevenLabs:**
   ```bash
   node scripts/update-pipeline.js complete "ancient-aliens" voiceover
   ```
   → Now appears in "Images" column

3. **After generating images in ChatGPT:**
   ```bash
   node scripts/update-pipeline.js complete "ancient-aliens" images
   ```
   → Now appears in "Video Creation" column

4. **After editing in DaVinci Resolve:**
   ```bash
   node scripts/update-pipeline.js complete "ancient-aliens" video-creation
   ```
   → Now appears in "Video Upload" column

5. **After uploading to YouTube:**
   ```bash
   node scripts/update-pipeline.js complete "ancient-aliens" video-upload
   ```
   → Moves to "Done" column (all stages complete)

## Why JSON Instead of Folder Scanning?

- **Reliable:** File names don't always reflect true status
- **Manual control:** You decide when each stage is done
- **Flexible:** Easy to add notes, track metadata
- **Multi-source:** Can track work across ChatGPT, ElevenLabs, Drive, etc.
- **Simple:** Just edit JSON or use the helper script

## Testing

```bash
# Start server
cd /Users/dylbot/.openclaw/workspace/projects/clawdgod/dashboard
node _server-local.js

# Visit: http://localhost:3000/#tasks

# Add test videos
node scripts/update-pipeline.js add "test-video" "Test Video" voiceover
node scripts/update-pipeline.js complete "test-video" voiceover
# Watch it move to the next column!
```

## Future Enhancements

- Add notes/comments field (already in schema)
- Track timestamps for each stage completion
- Auto-detect from ElevenLabs API / YouTube API
- Notifications when videos get stuck in one stage too long
- Analytics: average time per stage

---

**Previous approach (folder scanning)** removed in favor of this more reliable system.
