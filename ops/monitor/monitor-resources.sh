#!/usr/bin/env bash
# =============================================================================
# Resource Monitor — alerts to Discord when CPU/memory/disk exceed thresholds,
# a container is down, or the API stops being ready (/health/ready)
# Runs via cron every 5 minutes as the dedicated "monitor" system user.
#
# Setup (run as root on the production server):
#
#   # 1. Create dedicated monitor user (no login shell, no home)
#   useradd --system --user-group --no-create-home --shell /usr/sbin/nologin monitor
#   usermod -aG docker monitor   # needed for `docker ps`; NOTE: docker group is root-equivalent
#
#   # 2. Deploy script
#   mkdir -p /opt/monitor
#   cp ops/monitor/monitor-resources.sh /opt/monitor/   # from a checkout of this repo
#   chown -R monitor:monitor /opt/monitor
#   chmod 750 /opt/monitor/monitor-resources.sh
#
#   # 3. Restricted secrets file
#   mkdir -p /etc/monitor
#   cat > /etc/monitor/monitor.env <<'EOF'
#   DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/YOUR_WEBHOOK
#   EOF
#   chown monitor:monitor /etc/monitor/monitor.env
#   chmod 600 /etc/monitor/monitor.env
#
#   # 4. State directory for alert deduplication + log file the monitor user can append to
#   #    (cron runs as monitor, which cannot create files in root-owned /var/log)
#   mkdir -p /var/lib/monitor
#   chown monitor:monitor /var/lib/monitor
#   install -o monitor -g monitor -m 640 /dev/null /var/log/monitor-resources.log
#
#   # 5. Cron (every 5 minutes, runs as monitor user)
#   cat > /etc/cron.d/monitor-resources <<'EOF'
#   */5 * * * * monitor /opt/monitor/monitor-resources.sh >> /var/log/monitor-resources.log 2>&1
#   EOF
#
#   # 6. Logrotate (the config needs `su root syslog`: Ubuntu's /var/log is group-writable)
#   cp ops/monitor/monitor-logrotate.conf /etc/logrotate.d/monitor-resources
#   logrotate -d /etc/logrotate.d/monitor-resources   # must show no error
#
#   # 7. Test
#   sudo -u monitor /opt/monitor/monitor-resources.sh
#
# Updating: the deploy does NOT install this file. After a change merges, on the server:
#   install -o monitor -g monitor -m 750 /var/www/portfolio/ops/monitor/monitor-resources.sh /opt/monitor/
#
# Tests (Linux): bash ops/monitor/test-monitor.sh  (also runs in CI)
# =============================================================================

set -euo pipefail

# ---------------------------------------------------------------------------
# Load secrets from restricted env file
# ---------------------------------------------------------------------------
ENV_FILE="${MONITOR_ENV_FILE:-/etc/monitor/monitor.env}"
if [ -f "$ENV_FILE" ]; then
  set -a
  # shellcheck disable=SC1090 # configurable path; the file holds only secrets
  source "$ENV_FILE"
  set +a
fi

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
DISCORD_WEBHOOK_URL="${DISCORD_WEBHOOK_URL:-}"
HOSTNAME=$(hostname)
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# Thresholds (percentage)
CPU_THRESHOLD=85
MEMORY_THRESHOLD=85
DISK_THRESHOLD=85

# Container health: list of expected containers. Alert after
# CONTAINERS_FAILURES_TO_ALERT consecutive failed checks (2 x 5 min), so a
# deploy's force-recreate (< 1 min) does not page.
EXPECTED_CONTAINERS="nginx_gateway frontend_app backend_api mongodb_db redis_cache"
CONTAINERS_FAILURES_TO_ALERT=2

# Alert deduplication — suppress repeated alerts for the same check
# within COOLDOWN_SECONDS (default 30 min = 1800s, covers 6 consecutive runs)
STATE_DIR="${MONITOR_STATE_DIR:-/var/lib/monitor}"
COOLDOWN_SECONDS=1800

# Readiness: the API and its dependencies (MongoDB + Redis) through nginx.
# Alert after READY_FAILURES_TO_ALERT consecutive non-200 runs (2 x 5 min), so a
# deploy restart (< 1 min) does not page. Sentry Uptime watches "/" from outside
# (covers the whole host being down); this covers "host up, API not ready".
READY_URL="${READY_URL:-https://luisfaria.dev/health/ready}"
READY_FAILURES_TO_ALERT=2

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

# Returns 0 (true) if we should alert, 1 (false) if still in cooldown
should_alert() {
  local check_name="$1"
  local state_file="${STATE_DIR}/${check_name}.last_alert"

  if [ ! -d "$STATE_DIR" ]; then
    mkdir -p "$STATE_DIR" 2>/dev/null || true
  fi

  if [ -f "$state_file" ]; then
    local last_ts
    last_ts=$(cat "$state_file" 2>/dev/null || echo "0")
    local now_ts
    now_ts=$(date +%s)
    local elapsed=$(( now_ts - last_ts ))
    if [ "$elapsed" -lt "$COOLDOWN_SECONDS" ]; then
      echo "[$TIMESTAMP] Suppressed duplicate alert for '$check_name' (${elapsed}s < ${COOLDOWN_SECONDS}s cooldown)"
      return 1
    fi
  fi

  # Record this alert timestamp
  date +%s > "$state_file" 2>/dev/null || true
  return 0
}

# Reads a consecutive-failure counter; anything but a plain number counts as 0.
read_counter() {
  local value
  value=$(cat "$1" 2>/dev/null || true)
  if [[ "$value" =~ ^(0|[1-9][0-9]*)$ ]]; then echo "$value"; else echo 0; fi
}

send_alert() {
  local check_name="$1"
  local title="$2"
  local description="$3"
  local color="${4:-16711680}" # default red

  # Deduplication gate
  if ! should_alert "$check_name"; then
    return
  fi

  if ! post_discord "$title" "$description" "$color"; then
    echo "[$TIMESTAMP] [ERROR] Discord webhook failed for '$check_name' (alert not delivered)"
    rm -f "${STATE_DIR}/${check_name}.last_alert"   # retry next run instead of muting for the cooldown
  fi
}

# Posts one embed to Discord. Returns non-zero if the webhook rejects it.
post_discord() {
  local title="$1"
  local description="$2"
  local color="$3"

  if [ -z "$DISCORD_WEBHOOK_URL" ]; then
    echo "[WARN] DISCORD_WEBHOOK_URL not set — printing alert to stdout"
    echo "ALERT: $title — $description"
    return 0
  fi

  curl -sf -m 10 -H "Content-Type: application/json" \
    -d "{
      \"embeds\": [{
        \"title\": \"$title\",
        \"description\": \"$description\",
        \"color\": $color,
        \"footer\": {\"text\": \"$HOSTNAME · $TIMESTAMP\"}
      }]
    }" \
    "$DISCORD_WEBHOOK_URL" > /dev/null
}

# ---------------------------------------------------------------------------
# CPU check (1-minute load average vs number of cores)
# ---------------------------------------------------------------------------
check_cpu() {
  local cores
  cores=$(nproc)
  local load_1m
  load_1m=$(awk '{print $1}' /proc/loadavg)
  local cpu_pct
  cpu_pct=$(awk "BEGIN {printf \"%.0f\", ($load_1m / $cores) * 100}")

  if [ "$cpu_pct" -ge "$CPU_THRESHOLD" ]; then
    send_alert "cpu" \
      "⚠️ High CPU Load" \
      "**Load:** ${load_1m} (${cpu_pct}% of ${cores} cores)\n**Threshold:** ${CPU_THRESHOLD}%"
  fi
  echo "[$TIMESTAMP] CPU: ${cpu_pct}% (load ${load_1m}, cores ${cores})"
}

# ---------------------------------------------------------------------------
# Memory check
# ---------------------------------------------------------------------------
check_memory() {
  local mem_info
  mem_info=$(free | awk '/^Mem:/ {printf "%.0f %d %d", ($3/$2)*100, $3/1024, $2/1024}')
  local mem_pct used_mb total_mb
  read -r mem_pct used_mb total_mb <<< "$mem_info"

  if [ "$mem_pct" -ge "$MEMORY_THRESHOLD" ]; then
    send_alert "memory" \
      "⚠️ High Memory Usage" \
      "**Used:** ${used_mb}MB / ${total_mb}MB (${mem_pct}%)\n**Threshold:** ${MEMORY_THRESHOLD}%"
  fi
  echo "[$TIMESTAMP] Memory: ${mem_pct}% (${used_mb}MB / ${total_mb}MB)"
}

# ---------------------------------------------------------------------------
# Disk check (root partition)
# ---------------------------------------------------------------------------
check_disk() {
  local disk_pct
  disk_pct=$(df / | awk 'NR==2 {gsub("%",""); print $5}')

  if [ "$disk_pct" -ge "$DISK_THRESHOLD" ]; then
    send_alert "disk" \
      "⚠️ High Disk Usage" \
      "**Used:** ${disk_pct}%\n**Threshold:** ${DISK_THRESHOLD}%"
  fi
  echo "[$TIMESTAMP] Disk: ${disk_pct}%"
}

# ---------------------------------------------------------------------------
# Docker container health check
# ---------------------------------------------------------------------------
check_containers() {
  local failures_file="${STATE_DIR}/containers.failures"
  local running ps_ok=1
  running=$(docker ps --format '{{.Names}}' 2>&1) || ps_ok=0

  local missing=""
  if [ "$ps_ok" = 1 ]; then
    for container in $EXPECTED_CONTAINERS; do
      # Here-string, not `echo | grep -q`: under pipefail a pipe can fail even when grep matched.
      if ! grep -qxF -- "$container" <<< "$running"; then
        missing="${missing} ${container}"
      fi
    done
  fi

  local failures
  failures=$(read_counter "$failures_file")

  if [ "$ps_ok" = 1 ] && [ -z "$missing" ]; then
    if [ "$failures" -ge "$CONTAINERS_FAILURES_TO_ALERT" ]; then
      # We alerted for this outage, so say it is over (bypasses the cooldown).
      if post_discord "✅ Container Check Passing Again" \
        "All expected containers are running. The check had failed ${failures} times in a row (~$(( failures * 5 )) min)." \
        3066993; then
        echo "[$TIMESTAMP] Containers: recovery sent"
      else
        echo "[$TIMESTAMP] [ERROR] Discord webhook failed for 'containers' recovery"
      fi
      rm -f "${STATE_DIR}/containers.last_alert"
    fi
    echo 0 > "$failures_file" 2>/dev/null || true
    echo "[$TIMESTAMP] Containers: $(grep -c . <<< "$running") running"
    return
  fi

  failures=$(( failures + 1 ))
  echo "$failures" > "$failures_file" 2>/dev/null || true

  local problem
  if [ "$ps_ok" = 1 ]; then
    problem="not running:${missing}"
  else
    problem="docker ps failed"
  fi
  # Log what we saw, so a false alarm can be diagnosed from the log alone.
  echo "[$TIMESTAMP] Containers: ${problem} (consecutive failures: ${failures}); docker ps output: [$(tr '\n' ' ' <<< "$running")]"

  if [ "$failures" -ge "$CONTAINERS_FAILURES_TO_ALERT" ]; then
    # The counter covers both failure kinds; the title and text describe this run only.
    local streak="The container check has failed ${failures} times in a row."
    if [ "$ps_ok" = 1 ]; then
      send_alert "containers" "🔴 Container(s) Down" \
        "These containers are not running:\n$(for c in $missing; do printf '• %s\\n' "$c"; done)${streak}"
    else
      send_alert "containers" "⚠️ Container Status Unknown" \
        "\`docker ps\` failed, so container status is unknown. ${streak}"
    fi
  fi
}

# ---------------------------------------------------------------------------
# API readiness check (GET /health/ready through nginx: 200 = MongoDB + Redis OK)
# ---------------------------------------------------------------------------
check_ready() {
  local failures_file="${STATE_DIR}/ready.failures"
  local status
  status=$(curl -s -o /dev/null -w "%{http_code}" -m 10 "$READY_URL" 2>/dev/null || true)
  [ -n "$status" ] || status="000"

  local failures
  failures=$(read_counter "$failures_file")

  if [ "$status" = "200" ]; then
    if [ "$failures" -ge "$READY_FAILURES_TO_ALERT" ]; then
      # We alerted for this outage, so say it is over (bypasses the cooldown).
      if post_discord "✅ API Ready Again" \
        "**${READY_URL}** returns 200 again after ${failures} failed checks (~$(( failures * 5 )) min)." \
        3066993; then
        echo "[$TIMESTAMP] Ready: recovery sent"
      else
        echo "[$TIMESTAMP] [ERROR] Discord webhook failed for 'ready' recovery"
      fi
      rm -f "${STATE_DIR}/ready.last_alert"
    fi
    echo 0 > "$failures_file" 2>/dev/null || true
    echo "[$TIMESTAMP] Ready: 200"
    return
  fi

  failures=$(( failures + 1 ))
  echo "$failures" > "$failures_file" 2>/dev/null || true
  echo "[$TIMESTAMP] Ready: HTTP ${status} (consecutive failures: ${failures})"

  if [ "$failures" -ge "$READY_FAILURES_TO_ALERT" ]; then
    send_alert "ready" \
      "🔴 API Not Ready" \
      "**${READY_URL}** returned HTTP ${status} on ${failures} consecutive checks.\n503 = MongoDB or Redis down; 000 = no response.\nCheck: \`docker ps\`, \`docker logs backend_api --tail 50\`"
  fi
}

# ---------------------------------------------------------------------------
# Run all checks
# ---------------------------------------------------------------------------
echo "=== Resource Monitor Run: $TIMESTAMP ==="
check_cpu
check_memory
check_disk
check_containers
check_ready
echo "=== Done ==="
