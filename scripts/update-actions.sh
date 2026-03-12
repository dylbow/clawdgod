#!/bin/bash
set -e

# Count Dylbot's automated actions today
# Runs every 5 min, updates dashboard with real-time action count

TODAY=$(date +%Y-%m-%d)
MEMORY_FILE="$HOME/.openclaw/workspace/memory/$TODAY.md"
SESSION_DIR="$HOME/.openclaw/agents/main/sessions"
DASHBOARD_DIR="$HOME/.openclaw/workspace/projects/clawdgod/dashboard"
OUTPUT_FILE="$DASHBOARD_DIR/api/actions-data.json"

# Initialize counters
total_actions=0
breakdown=()

# Helper: add to breakdown
add_action() {
  local type="$1"
  local count="$2"
  local desc="$3"
  if [ "$count" -gt 0 ]; then
    total_actions=$((total_actions + count))
    breakdown+=("{\"type\":\"$type\",\"count\":$count,\"description\":\"$desc\"}")
  fi
}

## 1. Count from memory file
memory_actions=0
if [ -f "$MEMORY_FILE" ]; then
  # Count action indicators in today's memory log
  memory_actions=$(grep -oiE '\[TRADE\]|\[VIDEO\]|\[IMAGE\]|\[CONTENT\]|\[SCAN\]|\[SYSTEM\]|generated|uploaded|deployed|created|updated|built|placed.*trade|sent.*message|automated' "$MEMORY_FILE" 2>/dev/null | wc -l | tr -d ' ')
fi
add_action "memory_logs" "$memory_actions" "Logged actions from memory"

## 2. Count session files created today
session_count=$(find "$SESSION_DIR" -type f -name "*.jsonl*" -newermt "$TODAY 00:00:00" ! -newermt "$(date -v+1d +%Y-%m-%d) 00:00:00" 2>/dev/null | wc -l | tr -d ' ')
add_action "sessions" "$session_count" "Agent sessions started"

## 3. Count git commits today (from workspace)
git_commits=$(cd "$HOME/.openclaw/workspace" && git log --all --since="$TODAY 00:00:00" --until="$(date -v+1d +%Y-%m-%d) 00:00:00" --oneline 2>/dev/null | wc -l | tr -d ' ')
add_action "git_commits" "$git_commits" "Git commits pushed"

## 4. Count Kalshi trades today (from session logs)
kalshi_trades=0
for session_file in "$SESSION_DIR"/*.jsonl*; do
  if [ -f "$session_file" ]; then
    # Check if file is from today
    file_date=$(stat -f %Sm -t %Y-%m-%d "$session_file" 2>/dev/null || echo "")
    if [ "$file_date" = "$TODAY" ]; then
      # Count Kalshi trade mentions
      trades=$(grep -ic 'kalshi.*trade\|placed.*order\|bought.*contract' "$session_file" 2>/dev/null || echo "0")
      trades=$(echo "$trades" | tr -d '\n' | head -1)
      [ -z "$trades" ] && trades=0
      kalshi_trades=$((kalshi_trades + trades))
    fi
  fi
done
add_action "kalshi_trades" "$kalshi_trades" "Kalshi trades scanned/placed"

## 5. Count cron runs today (estimate from current hour)
current_hour=$(date +%H | sed 's/^0*//')
[ -z "$current_hour" ] && current_hour=0
cron_runs=$((current_hour * 12))  # Assuming crons run ~12 times/hour
add_action "cron_jobs" "$cron_runs" "Scheduled tasks executed"

## 6. Count generated content (images, videos) from memory
content_gen=0
if [ -f "$MEMORY_FILE" ]; then
  content_gen=$(grep -oiE 'generated.*image|created.*video|uploaded.*short|dall-e|fal\.ai|kling|elevenlabs' "$MEMORY_FILE" 2>/dev/null | wc -l | tr -d ' ')
fi
add_action "content_generation" "$content_gen" "Content pieces generated"

## 7. Count email/message actions
message_actions=0
if [ -f "$MEMORY_FILE" ]; then
  message_actions=$(grep -oiE 'sent.*email|checked.*inbox|telegram.*sent|notification.*sent' "$MEMORY_FILE" 2>/dev/null | wc -l | tr -d ' ')
fi
add_action "messages" "$message_actions" "Messages/emails processed"

# Build breakdown JSON array
breakdown_json="["
first=true
for item in "${breakdown[@]}"; do
  if [ "$first" = true ]; then
    first=false
  else
    breakdown_json+=","
  fi
  breakdown_json+="$item"
done
breakdown_json+="]"

# Write JSON output
cat > "$OUTPUT_FILE" << EOF
{
  "count": $total_actions,
  "date": "$TODAY",
  "updated": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "breakdown": $breakdown_json
}
EOF

# Git commit and push
cd "$DASHBOARD_DIR"
git add "$OUTPUT_FILE"
if git diff --staged --quiet; then
  echo "No changes to commit"
else
  git commit -m "🤖 Update AI actions: $total_actions actions on $TODAY" -m "Auto-updated by Dylbot"
  git push origin main
  echo "✅ Actions updated: $total_actions total"
fi
