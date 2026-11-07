#!/usr/bin/env bash
# Tests for monitor-resources.sh's container check. Linux only (reads /proc, uses `free`).
# `docker` and `curl` are stubbed on PATH, so nothing touches Docker or Discord.
#
#   bash ops/monitor/test-monitor.sh
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCRIPT="$HERE/monitor-resources.sh"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

mkdir -p "$WORK/bin" "$WORK/state"

# docker ps: prints $WORK/docker.out, exits with $WORK/docker.exit (default 0).
cat > "$WORK/bin/docker" <<'EOF'
#!/usr/bin/env bash
cat "$STUB_DIR/docker.out"
exit "$(cat "$STUB_DIR/docker.exit" 2>/dev/null || echo 0)"
EOF

# curl: the readiness probe (-w) gets 200; a Discord post appends its payload to posts.log.
cat > "$WORK/bin/curl" <<'EOF'
#!/usr/bin/env bash
for arg in "$@"; do [ "$arg" = "-w" ] && { printf 200; exit 0; }; done
while [ $# -gt 0 ]; do
  if [ "$1" = "-d" ]; then printf '%s\n---\n' "$2" >> "$STUB_DIR/posts.log"; fi
  shift
done
EOF
chmod +x "$WORK/bin/docker" "$WORK/bin/curl"

ALL="nginx_gateway
frontend_app
backend_api
mongodb_db
redis_cache"
NO_REDIS="nginx_gateway
frontend_app
backend_api
mongodb_db"

run_monitor() {
  : > "$WORK/posts.log"
  STUB_DIR="$WORK" PATH="$WORK/bin:$PATH" \
    MONITOR_ENV_FILE=/nonexistent MONITOR_STATE_DIR="$WORK/state" \
    DISCORD_WEBHOOK_URL="http://discord.stub/webhook" \
    bash "$SCRIPT" > "$WORK/run.log" 2>&1
}
docker_says() { printf '%s\n' "$1" > "$WORK/docker.out"; echo "${2:-0}" > "$WORK/docker.exit"; }

PASS=0
FAIL=0
check() { # check <description> <command...>
  local desc="$1"; shift
  if "$@"; then PASS=$((PASS + 1)); echo "ok   - $desc"
  else FAIL=$((FAIL + 1)); echo "FAIL - $desc"; sed 's/^/       log: /' "$WORK/run.log"; fi
}
logged() { grep -qF -- "$1" "$WORK/run.log"; }
posted() { grep -qF -- "$1" "$WORK/posts.log"; }
not_posted() { ! posted "$1"; }

docker_says "$ALL"; run_monitor
check "all running: logs the count" logged "Containers: 5 running"
check "all running: no container alert" not_posted "Container(s) Down"

docker_says "$NO_REDIS"; run_monitor
check "first miss: logs the missing name" logged "not running: redis_cache (consecutive failures: 1)"
check "first miss: logs the raw docker ps output" logged "docker ps output: [nginx_gateway frontend_app backend_api mongodb_db ]"
check "first miss: does not alert" not_posted "Container(s) Down"

run_monitor
check "second miss in a row: alerts" posted "Container(s) Down"
check "second miss in a row: names the container" posted "redis_cache"
check "second miss in a row: names only that container" not_posted "nginx_gateway"

run_monitor
check "third miss: suppressed by the cooldown" not_posted "Container(s) Down"

docker_says "$ALL"; run_monitor
check "recovery: sends the recovery message" posted "Containers Running Again"
check "recovery: resets the failure count" logged "Containers: 5 running"

run_monitor
check "after recovery: no repeat recovery message" not_posted "Containers Running Again"

docker_says "$NO_REDIS"; run_monitor
docker_says "$ALL"; run_monitor
check "single blip: no alert and no recovery message" not_posted "Container"

docker_says "Cannot connect to the Docker daemon" 1; run_monitor
check "docker ps fails: logged as such" logged "docker ps failed (consecutive failures: 1)"
run_monitor
check "docker ps fails twice: alerts that status is unknown" posted "status is unknown"
check "docker ps fails twice: does not claim containers are down" not_posted "redis_cache"

echo
echo "$PASS passed, $FAIL failed"
[ "$FAIL" -eq 0 ]
