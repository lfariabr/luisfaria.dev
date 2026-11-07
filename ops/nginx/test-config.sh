#!/usr/bin/env bash
# Validates nginx/conf/default.conf and checks its routing, using Docker only.
#   - `nginx -t` must pass with no warnings
#   - the real config runs against stub frontend_app/backend_api upstreams and a
#     self-signed cert at the production path, and each route is checked with curl
#
#   bash ops/nginx/test-config.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
IMAGE="${NGINX_IMAGE:-nginx:alpine}"   # same tag as docker-compose.yml
WORK="$(mktemp -d)"
NET="nginx-test-$$"
PORT_HTTP="${PORT_HTTP:-18080}"
PORT_HTTPS="${PORT_HTTPS:-18443}"

cleanup() {
  docker rm -f "$NET-gw" "$NET-fe" "$NET-be" >/dev/null 2>&1 || true
  docker network rm "$NET" >/dev/null 2>&1 || true
  rm -rf "$WORK"
}
trap cleanup EXIT

# Self-signed cert where the config expects Let's Encrypt's
mkdir -p "$WORK/le/live/luisfaria.dev" "$WORK/certbot-www/.well-known/acme-challenge"
openssl req -x509 -newkey rsa:2048 -nodes -days 1 -subj "/CN=luisfaria.dev" \
  -addext "subjectAltName=DNS:luisfaria.dev,DNS:www.luisfaria.dev" \
  -keyout "$WORK/le/live/luisfaria.dev/privkey.pem" \
  -out "$WORK/le/live/luisfaria.dev/fullchain.pem" 2>/dev/null
echo "acme-token" > "$WORK/certbot-www/.well-known/acme-challenge/t1"
chmod -R a+rX "$WORK"

# 1. Syntax, with no warnings (upstream names resolved to localhost)
echo "== nginx -t"
out=$(docker run --rm \
  --add-host frontend_app:127.0.0.1 --add-host backend_api:127.0.0.1 \
  -v "$ROOT/nginx/conf:/etc/nginx/conf.d:ro" \
  -v "$WORK/le:/etc/letsencrypt:ro" \
  "$IMAGE" nginx -t 2>&1) || { echo "$out"; exit 1; }
echo "$out"
if grep -q "\[warn\]\|\[emerg\]" <<< "$out"; then echo "FAIL: nginx -t printed warnings"; exit 1; fi

# 2. Routing against stub upstreams that echo who answered
stub_conf() { # stub_conf <name> <port>
  # shellcheck disable=SC2016 # $request_uri is for nginx, not the shell
  printf 'server { listen %s; location / { default_type text/plain; return 200 "%s $request_uri\\n"; } }\n' "$2" "$1"
}
mkdir -p "$WORK/fe" "$WORK/be"
stub_conf frontend 3000 > "$WORK/fe/default.conf"
stub_conf backend 4000 > "$WORK/be/default.conf"
chmod -R a+rX "$WORK"

docker network create "$NET" >/dev/null
docker run -d --name "$NET-fe" --network "$NET" --network-alias frontend_app \
  -v "$WORK/fe:/etc/nginx/conf.d:ro" "$IMAGE" >/dev/null
docker run -d --name "$NET-be" --network "$NET" --network-alias backend_api \
  -v "$WORK/be:/etc/nginx/conf.d:ro" "$IMAGE" >/dev/null
docker run -d --name "$NET-gw" --network "$NET" \
  -p "127.0.0.1:$PORT_HTTP:80" -p "127.0.0.1:$PORT_HTTPS:443" \
  -v "$ROOT/nginx/conf:/etc/nginx/conf.d:ro" \
  -v "$WORK/le:/etc/letsencrypt:ro" \
  -v "$WORK/certbot-www:/var/www/certbot:ro" \
  "$IMAGE" >/dev/null

for _ in $(seq 1 30); do
  curl -sk -o /dev/null --resolve "luisfaria.dev:$PORT_HTTPS:127.0.0.1" "https://luisfaria.dev:$PORT_HTTPS/" && break
  sleep 1
done

PASS=0
FAIL=0
expect() { # expect <description> <expected> <actual>
  if [ "$2" = "$3" ]; then PASS=$((PASS + 1)); echo "ok   - $1"
  else FAIL=$((FAIL + 1)); echo "FAIL - $1: expected [$2], got [$3]"; fi
}
https() { # https <host> <path> [extra curl args...] -> "<status> <first body line>"
  local host="$1" path="$2" code body; shift 2
  code=$(curl -sk -m 5 --resolve "$host:$PORT_HTTPS:127.0.0.1" -o "$WORK/body" -w '%{http_code}' \
    "$@" "https://$host:$PORT_HTTPS$path" || true)
  body=$(head -1 "$WORK/body" 2>/dev/null || true)
  if [ -n "$body" ]; then echo "$code $body"; else echo "$code"; fi
}
status() { # status <url> [extra curl args...]
  local url="$1"; shift
  curl -sk -m 5 -o /dev/null -w '%{http_code}' "$@" "$url" || true
}
header() { # header <name> <host> <path>
  curl -sk -m 5 -D - -o /dev/null --resolve "$2:$PORT_HTTPS:127.0.0.1" "https://$2:$PORT_HTTPS$3" \
    | tr -d '\r' | awk -v h="$(tr '[:upper:]' '[:lower:]' <<< "$1")" -F': ' 'tolower($1)==h {print $2}'
}

echo "== routing"
expect "/ goes to the frontend"                 "200 frontend /"                  "$(https luisfaria.dev /)"
expect "an article slug with .github reaches the frontend" \
                                                "200 frontend /articles/foo.github.io" "$(https luisfaria.dev /articles/foo.github.io)"
expect "/health goes to the backend"            "200 backend /health"             "$(https luisfaria.dev /health)"
expect "/health/ready goes to the backend"      "200 backend /health/ready"       "$(https luisfaria.dev /health/ready)"
expect "/healthz is not the backend"            "200 frontend /healthz"           "$(https luisfaria.dev /healthz)"
expect "/graphql goes to the backend"           "200 backend /graphql"            "$(https luisfaria.dev /graphql -X POST -d '{}')"
expect "/webhooks/ goes to the backend"         "200 backend /webhooks/stripe"    "$(https luisfaria.dev /webhooks/stripe -X POST -d '{}')"
expect "OPTIONS /graphql is a 204 preflight"    "204"                             "$(https luisfaria.dev /graphql -X OPTIONS | cut -d' ' -f1)"
expect "/.env is 404"                           "404"                             "$(https luisfaria.dev /.env | cut -d' ' -f1)"
expect "/.git/config is 404"                    "404"                             "$(https luisfaria.dev /.git/config | cut -d' ' -f1)"
expect "/index.php is 404"                      "404"                             "$(https luisfaria.dev /index.php | cut -d' ' -f1)"
expect "/wp-login.php is 404"                   "404"                             "$(https luisfaria.dev /wp-login.php | cut -d' ' -f1)"
expect "/wp-admin/ is 404"                      "404"                             "$(https luisfaria.dev /wp-admin/ | cut -d' ' -f1)"

echo "== headers"
expect "HSTS on the frontend"                   "max-age=31536000; includeSubDomains" "$(header Strict-Transport-Security luisfaria.dev /)"
expect "CSP on the backend routes too"          "1"                               "$(header Content-Security-Policy luisfaria.dev /health | grep -c "default-src 'self'")"

echo "== redirects and catch-alls"
expect "http apex redirects to https"           "301"  "$(status "http://luisfaria.dev:$PORT_HTTP/x" --resolve "luisfaria.dev:$PORT_HTTP:127.0.0.1")"
expect "https www redirects to apex"            "https://luisfaria.dev/x" \
  "$(curl -sk -m 5 -o /dev/null -w '%{redirect_url}' --resolve "www.luisfaria.dev:$PORT_HTTPS:127.0.0.1" "https://www.luisfaria.dev:$PORT_HTTPS/x")"
expect "ACME challenge is served over http"     "acme-token" \
  "$(curl -s -m 5 --resolve "luisfaria.dev:$PORT_HTTP:127.0.0.1" "http://luisfaria.dev:$PORT_HTTP/.well-known/acme-challenge/t1")"
expect "bare-IP http gets no response (444)"    "000"  "$(status "http://127.0.0.1:$PORT_HTTP/")"
expect "unknown SNI is refused at TLS"          "000"  "$(status "https://other.example:$PORT_HTTPS/" --resolve "other.example:$PORT_HTTPS:127.0.0.1")"

echo
echo "$PASS passed, $FAIL failed"
if [ "$FAIL" -ne 0 ]; then docker logs "$NET-gw" 2>&1 | tail -20; exit 1; fi
