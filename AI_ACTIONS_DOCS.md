# AI Actions Today Counter - Documentation

## Overview
The "AI Actions Today" counter tracks and displays how many automated tasks Dylbot performs each day. This creates a dynamic, impressive visual for video content showing real-time AI automation.

## Current Count
**404 actions today** (as of 2026-03-12 16:27 MST)

## Architecture

### 1. Data Collection (`scripts/update-actions.sh`)
Bash script that runs every 5 minutes via cron to count daily actions from multiple sources:

**Data Sources:**
- **Memory logs** (`~/.openclaw/workspace/memory/YYYY-MM-DD.md`) - counts action keywords
- **Session files** (`~/.openclaw/agents/main/sessions/*.jsonl`) - counts sessions started today
- **Git commits** - counts commits pushed today
- **Kalshi trades** - scans session logs for trade executions
- **Cron jobs** - estimates scheduled task runs (current_hour × 12)
- **Content generation** - counts images, videos, TTS from memory
- **Messages** - counts emails/notifications processed

### 2. Data Storage (`api/actions-data.json`)
JSON file updated every 5 minutes with:
```json
{
  "count": 404,
  "date": "2026-03-12",
  "updated": "2026-03-12T23:28:45Z",
  "breakdown": [
    {
      "type": "memory_logs",
      "count": 7,
      "description": "Logged actions from memory"
    },
    {
      "type": "sessions",
      "count": 18,
      "description": "Agent sessions started"
    },
    ...
  ]
}
```

### 3. API Endpoint (`api/actions.js`)
Vercel serverless function that:
- Reads pre-generated `actions-data.json`
- Returns cached data (30s cache)
- Provides breakdown and recent actions
- Handles missing file gracefully

### 4. Dashboard Display (`app.js` + `index.html`)
Frontend integration:
- Animated counter on homepage (counts up from 0 to current value)
- Breakdown display in activity feed with emojis
- Auto-refreshes every 60 seconds
- Shows action type counts (e.g., "192× Scheduled tasks executed")

## Deployment

### Cron Job
```bash
*/5 * * * * /Users/dylbot/.openclaw/workspace/projects/clawdgod/dashboard/scripts/update-actions.sh >> /Users/dylbot/.openclaw/workspace/logs/actions-update.log 2>&1
```

### Git Auto-Push
Script automatically commits and pushes `actions-data.json` when count changes, triggering Vercel redeployment.

### Live URL
Dashboard: https://clawdgod-dashboard.vercel.app

## Breakdown by Type

| Type | Current Count | Description |
|------|---------------|-------------|
| Memory Logs | 7 | Action keywords in daily memory |
| Sessions | 18 | Agent sessions started |
| Git Commits | 3 | Code pushed to repo |
| Kalshi Trades | 187 | Market scans/trades executed |
| Cron Jobs | 192 | Scheduled tasks (12/hr × 16 hrs) |
| Content Gen | 0 | Images/videos/TTS created |
| Messages | 0 | Emails/notifications sent |

## Video Content Features

### Why This Is Great for Videos
1. **Real-time automation showcase** - counter updates live
2. **Impressive numbers** - 400+ actions/day shows high activity
3. **Visual breakdown** - emojis + counts make it scannable
4. **Automatic updates** - no manual tracking needed
5. **Professional look** - animated counters feel polished

### Filming Tips
- Point camera at dashboard during busy automation (e.g., Kalshi scan)
- Refresh page to trigger count-up animation
- Show breakdown feed to highlight specific action types
- Compare morning (low count) vs evening (high count)

## Maintenance

### Adding New Action Types
Edit `scripts/update-actions.sh`:
1. Add counting logic in appropriate section
2. Call `add_action "type_name" $count "Description"`
3. Add emoji to `app.js` iconMap if desired

### Debugging
Check logs:
```bash
tail -f ~/.openclaw/workspace/logs/actions-update.log
```

View current data:
```bash
cat ~/..openclaw/workspace/projects/clawdgod/dashboard/api/actions-data.json | jq
```

## Future Enhancements
- [ ] Hourly breakdown chart (show peak automation times)
- [ ] Week-over-week comparison
- [ ] Action type filtering in dashboard
- [ ] Real-time websocket updates (instead of polling)
- [ ] Historical action archive (store daily totals)
- [ ] Action velocity (actions/hour graph)

## Files Created/Modified

**New Files:**
- `scripts/update-actions.sh` - Main counting script
- `api/actions-data.json` - Live data file
- `AI_ACTIONS_DOCS.md` - This documentation

**Modified Files:**
- `api/actions.js` - Updated to read from JSON file
- `app.js` - Updated fetchActions() to display breakdown
- Crontab - Added 5-minute update job

**Deployment:**
- Live on Vercel: https://clawdgod-dashboard.vercel.app
- Auto-updates every 5 minutes
- Git push triggers redeployment

---

**Status:** ✅ Complete and deployed
**Last Updated:** 2026-03-12 16:30 MST
**Current Count:** 404 actions today
