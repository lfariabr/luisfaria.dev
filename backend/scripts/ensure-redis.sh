#!/usr/bin/env bash
# Pre-test guard: the backend suites talk to a real Redis (rate limiter, chatbot,
# APOD, screams). Checks the REDIS_URL target is reachable; when it is a local
# port and nothing answers, starts a throwaway Redis container on that port.
set -euo pipefail

cd "$(dirname "$0")/.."

if [[ -z "${REDIS_URL:-}" && -f .env ]]; then
  REDIS_URL="$( { grep -E '^REDIS_URL=' .env || true; } | head -1 | cut -d= -f2- | awk '{print $1}')"
fi
REDIS_URL="${REDIS_URL:-redis://localhost:6379}"

hostport="${REDIS_URL#redis://}"
hostport="${hostport#*@}"
hostport="${hostport%%/*}"
host="${hostport%%:*}"
port="${hostport##*:}"
[[ "$host" == "$port" ]] && port=6379

reachable() { (echo > "/dev/tcp/$host/$port") >/dev/null 2>&1; }

if reachable; then
  exit 0
fi

if [[ "$host" != "localhost" && "$host" != "127.0.0.1" ]]; then
  echo "ensure-redis: $host:$port is not reachable and is not local; cannot start it for you." >&2
  exit 1
fi

if ! command -v docker >/dev/null 2>&1; then
  echo "ensure-redis: nothing listening on $host:$port and docker is not installed." >&2
  echo "Start a Redis on that port (e.g. 'redis-server --port $port') and rerun." >&2
  exit 1
fi

name="redis-test-$port"
echo "ensure-redis: starting $name on port $port"
docker rm -f "$name" >/dev/null 2>&1 || true
docker run -d --name "$name" -p "127.0.0.1:$port:6379" redis:alpine >/dev/null

for _ in $(seq 1 30); do
  reachable && exit 0
  sleep 0.5
done
echo "ensure-redis: $name did not come up on $port" >&2
exit 1
