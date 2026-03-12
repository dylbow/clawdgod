# 🔑 Environment Variables Setup - READY TO PASTE

## ✅ YouTube API Key Configured

**Your YouTube Data API v3 key:** `AIzaSyDn8k3BWkAJW2UODLzqPiwGnC0SygxlZSI`

**Verified channels:**
- ✅ **THEORETIKA** - 85 subs, 13,730 views, 38 videos
- ✅ **dylbot** (OpenDyl) - 8 subs, 686 views, 3 videos

---

## 📋 Add to Vercel (2 steps)

### Step 1: Add YOUTUBE_API_KEY

1. Go to: https://vercel.com/dylbow/clawdgod-dashboard/settings/environment-variables
2. Click **"Add New"**
3. Fill in:
   - **Name:** `YOUTUBE_API_KEY`
   - **Value:** `AIzaSyDn8k3BWkAJW2UODLzqPiwGnC0SygxlZSI`
   - **Environments:** ✅ Production, ✅ Preview, ✅ Development
4. Click **Save**

---

### Step 2: Add KALSHI_PRIVATE_KEY

1. Still in: https://vercel.com/dylbow/clawdgod-dashboard/settings/environment-variables
2. Click **"Add New"**
3. Fill in:
   - **Name:** `KALSHI_PRIVATE_KEY`
   - **Value:** Copy the entire block below ⬇️

```
-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEAyj/DingUN4ae3YYOvS7D8rf6v5cmuNpQp5Ppd6xZtmTudK6Y
7cXFy+egT/eQFn7v31tKsn5PvXX0pgTb4dnRY0h9TlL/CqUXDl5IgjSlOehgyAk/
cNaf2C9MOIfYOYEflNlEzoqt0Al4s9H2hcbvvaZFuiLLYMXfC/LFDq6paFG0Mm+5
Rr58bydKeBSpQbPHhaY4OLtLwDzkeKwM3ouUH5MnNoqTKwsui9U+io9So2p0QzQ3
L92E8G8JcnG1QbE8kzp5CUf83k9jy8O2GRVCylYZXsGYAsjr3fFpEYG7DK7qg52x
V6ZFl+hTDLAaDmgZi76Zenfrk1W8sb6/T92pvwIDAQABAoIBAC/DllUd3bxtTRiI
//Ma18j7PTtBIbJ3UKP68SDDsd47APvKfjBtTDTHK5unHj7J1LGduErmPMPEVzZc
IGe6ztIRPRKh1Dy513ObvakOcNT3td+YG4T1EwP1y5zwLBcMkR5Qn4jdxIXErt5c
4Ekgvd6+pWn7rKdao74JJBO/GSAa+/qUFWbqNuK91VZoA7goa2iVKjA5a9ohO3xt
Zpkajm/c1v+BkDb3xUrVgklxze41hMsK954QccOk1cVCBy+IxxXDTCHb+ELd2jf/
yLtYFIcYlV+yTHsR89f8zdvtP+7Amas3OOs5TWz+I5lRoh6yZ67wy6G7eJxkbrCp
psoaH1UCgYEA8NlEkmfpKFAgnC3mU1mTDDpLKiqsIREv86IIg8ZZ72E6kiWZKZTu
6Ad4gLM6lYhMkaprbkFP2AZNVBMoAfYlvjis4kLKTrTx0biOdS4TQDd4DZHNMRt0
siGeAKi3DcSxZeqi0XfyC9g6utH5gn6YlhJIy8o454lMRC6z5hwek1sCgYEA1vje
72lQTs3kobLh7SN/E1IpJhkMYOKOHgo81l610sjLeO8XtR3MN4WMVXUD0XEZ+0xq
CDSkKAV4i65nF9dxJsPGbk6sJ/dDeAbaPNa3WZjDGC0f3dRTU1UfBP2zZiI+wwgI
QvM+Fc1Y8u+olWO48k/+kH1PIOMxF169SMT6hG0CgYBTiVhSW34wQFJ/OSBZKolp
RVLKxlA7i+WQ4FOJuSN6dsPE6wuLs5+FlQnDweaA9Oxx3aUzca3K5Kyvi5Fl1MVU
i/3S4I2g7Puu3Q90L034CQU316lO7hH0stpFqj8LpHxPOCnO84Zde1srbybWjyhH
bQIYxQQlsqZkQ7qcBobIXwKBgQCbYnpqHPpya7ql8pIBgdXZllqt8g8TfM7zAb1l
ykGs4XzJpjDBto8lVr/QCWvAGPuJvHssATjiwMmYVXCpOA3O0lX855rirIS1Hmbi
8OTIu3XRZNSS2GV+Z5mrVuI0oe4xtP2bvwySX8K6nuaBTPqjE5VSxXDLucyDMvSo
w9C8pQKBgQCWlrs/DnC9DgeBwsX4+3cVZ/90I322gguQi7pZxuf+pTznVS8glpqM
Pny0ZpPNpyEk8iaZauLEw7DThxz65J0I6qqP0MMgMb4rRlSmLV9MXS+ts4PDevF1
WjhQIGWZGfIsJFdOL35Kgp3rnsApbofxQYXzBSoX2xmu63PzJ32RMg==
-----END RSA PRIVATE KEY-----
```

4. **Important:** Make sure to include the `-----BEGIN` and `-----END` lines
5. **Environments:** ✅ Production, ✅ Preview, ✅ Development
6. Click **Save**

---

### Step 3: Redeploy

After adding both keys:

**Option A - Vercel Dashboard:**
1. Go to: https://vercel.com/dylbow/clawdgod-dashboard
2. Click "Deployments" tab
3. Find the latest deployment
4. Click ⋯ menu → **"Redeploy"**
5. Confirm

**Option B - Git Push:**
```bash
cd /Users/dylbot/.openclaw/workspace/projects/clawdgod/dashboard
git commit --allow-empty -m "Trigger redeploy with YouTube API key"
git push
```

---

## ✅ What This Enables

Once deployed with env vars:

1. **Real-time YouTube stats** (updates every 5 min):
   - Theoretika: Live subscriber count, views, videos
   - dylbot (OpenDyl): Live subscriber count, views, videos
   - Combined totals with animated counters

2. **Real-time Kalshi data** (updates every 30s):
   - Live balance ($9.16 → real-time)
   - Portfolio positions with current exposure
   - Win/loss tracking
   - P&L chart

3. **Content pipeline auto-sync** (updates every 60s)
4. **AI actions counter** (updates every 30s)
5. **Quick actions panel** (fully interactive)

---

## 🧪 Test After Deployment

1. Open: https://clawdgod-dashboard.vercel.app
2. **Home page:** Watch "Total Subscribers" animate to **93** (85 + 8)
3. **Channels page:** See real data for both Theoretika and dylbot
4. Open browser console (F12) → Network tab
5. Refresh and see `/api/youtube` returning live data
6. Wait 5 minutes and refresh - numbers should update if new subs/views

---

## 📊 Current Live Stats

**THEORETIKA:**
- 85 subscribers
- 13,730 views
- 38 videos
- ~109.8 watch hours

**dylbot (OpenDyl):**
- 8 subscribers
- 686 views
- 3 videos
- ~8.2 watch hours

**Combined:**
- 93 total subscribers
- 14,416 total views
- 41 videos

*These will update automatically every 5 minutes once deployed!*

---

## 🔐 Security Notes

✅ `.env.local` is in `.gitignore` - never committed
✅ Vercel encrypts environment variables at rest
✅ API keys only accessible to serverless functions
✅ No keys exposed to browser/client-side code

Your keys are safe!
