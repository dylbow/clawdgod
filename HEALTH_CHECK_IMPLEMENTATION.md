# Health Check Implementation - File-Based System

## Problem Solved
The health check button previously tried to connect to `localhost:18789` which only worked when browsing the dashboard from the Mac Mini. This failed when accessing from Vercel or any remote location.

## Solution: File-Based Health Data

### Architecture

1. **Cron Job** (`*/5 * * * *`)
   - Runs `/Users/dylbot/.openclaw/workspace/scripts/update-health.sh`
   - Fetches OpenClaw status via `openclaw status --json`
   - Parses main session data (context, tokens, model, age, compactions)
   - Writes to `api/health-data.json`
   - Commits and pushes to git (so Vercel serves it)

2. **API Endpoint** (`/api/health.js`)
   - Reads `api/health-data.json` from filesystem
   - Returns health data with freshness indicator
   - Works from anywhere (Vercel, localhost, mobile)

3. **Frontend** (`app.js`)
   - Health check button calls `/api/health`
   - Displays context usage, model, tokens, session age
   - Shows color-coded status (green/yellow/red)
   - Displays when data was last updated

4. **Compact Button** (`/api/compact.js`)
   - Writes `.compact-requested` flag file to workspace root
   - Heartbeat checks for this flag every hour
   - When found, triggers `/compact` command
   - Flag is deleted after processing

### Files Created

- `scripts/update-health.sh` - Health data update script
- `api/health-data.json` - Current health data (auto-updated)
- `api/health.js` - Health endpoint (updated)
- `api/compact.js` - Compact request endpoint (new)
- `app.js` - Frontend JS (updated health/compact functions)
- `HEARTBEAT.md` - Added compact flag check

### Cron Job

```bash
*/5 * * * * /Users/dylbot/.openclaw/workspace/scripts/update-health.sh >> /Users/dylbot/.openclaw/workspace/logs/health-update.log 2>&1
```

Logs: `/Users/dylbot/.openclaw/workspace/logs/health-update.log`

### Testing

1. **Health Check:**
   - Visit dashboard: https://clawdgod.vercel.app
   - Click "Health Check" button
   - Should show current context usage and stats

2. **Compact Request:**
   - Click "Compact / Refresh" button
   - Should show "✓ Queued" message
   - Within 1 hour, heartbeat will process the request
   - Check `.compact-requested` file exists in workspace root
   - After heartbeat, file should be deleted and /compact triggered

### Data Freshness

- **Fresh:** < 10 minutes old
- **Recent:** 10-30 minutes old
- **Stale:** > 30 minutes old

The cron job runs every 5 minutes, so data should always be fresh.

### Deployment

All changes committed and pushed:
- Dashboard: commit `a600ccb` - "feat: file-based health check system"
- Workspace: commit `b807949` - "feat: add health data update script"

Vercel will auto-deploy on next push.

---

**Status:** ✅ Complete - Health check now works from anywhere!
