# Vercel Environment Variables Setup

To enable all dashboard features, configure these environment variables in your Vercel project settings:

## Required Environment Variables

### 1. YouTube Data API v3
```
YOUTUBE_API_KEY=<your-youtube-api-key>
```

**How to get:**
1. Go to https://console.cloud.google.com/
2. Create/select a project
3. Enable "YouTube Data API v3"
4. Create credentials → API Key
5. Copy the API key

**Used for:** Real-time subscriber counts, view counts, and video stats for Theoretika and OpenDyl channels.

---

### 2. Kalshi Private Key
```
KALSHI_PRIVATE_KEY=<your-kalshi-private-key-pem-content>
```

**How to get:**
1. Your private key is at: `/Users/dylbot/.openclaw/workspace/scripts/kalshi-private-key.pem`
2. Copy the entire contents (including `-----BEGIN RSA PRIVATE KEY-----` and `-----END RSA PRIVATE KEY-----`)
3. Paste directly into Vercel env var (preserve line breaks - Vercel handles multi-line values)

**Used for:** Real-time Kalshi balance, portfolio value, and position data.

**Note:** The API key ID (`ff60a402-f21e-4be1-8226-3bede0becfe7`) is already hardcoded in `/api/kalshi.js`.

---

### 3. Content Root Path (Optional)
```
CONTENT_ROOT=/Users/dylbot/.openclaw/workspace/projects
```

**Used for:** Auto-syncing the content pipeline Kanban board from file system.

**Note:** This won't work on Vercel's serverless environment. For production, we'll need to implement a webhook-based sync or manual API.

---

### 4. Memory Root Path (Optional)
```
MEMORY_ROOT=/Users/dylbot/.openclaw/workspace/memory
```

**Used for:** Tracking daily AI actions from memory logs.

**Note:** Same as above - won't work on Vercel. Consider implementing a logging API endpoint instead.

---

## Setting Environment Variables in Vercel

1. Go to https://vercel.com/dylbow/clawdgod-dashboard/settings/environment-variables
2. Click "Add New"
3. Enter variable name and value
4. Select environments: Production, Preview, Development
5. Click "Save"
6. **Redeploy** your project for changes to take effect

---

## Fallback Behavior

All API endpoints have fallback data when environment variables are missing:
- YouTube API → Uses static data from `youtube-data.json`
- Kalshi API → Uses hardcoded example positions
- Content Pipeline → Shows example Theoretika shorts
- Actions Counter → Shows mock action count

This ensures the dashboard never breaks, even without API keys configured.

---

## Testing Locally

To test with environment variables locally:

1. Create `.env.local` file:
```bash
YOUTUBE_API_KEY=your-key-here
KALSHI_PRIVATE_KEY="$(cat /Users/dylbot/.openclaw/workspace/scripts/kalshi-private-key.pem)"
```

2. Run local server:
```bash
vercel dev
# or
node _server-local.js
```

3. Open http://localhost:3000

---

## Security Notes

- ✅ Private keys are safe in Vercel environment variables (encrypted at rest)
- ✅ API endpoints run server-side only (not exposed to browser)
- ❌ Never commit `.env.local` to git
- ✅ Keys are already in `.gitignore`
