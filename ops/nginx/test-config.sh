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
  docker network rm "$NET" "$NET-priv" >/dev/null 2>&1 || true
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
PAD="$(printf 'x%.0s' $(seq 1 2000))"   # ~2 KB body, over gzip_min_length
stub_conf() { # stub_conf <name> <port> <big-path> [self-gzip]
  # Echoes who answered; <big-path> returns ~2 KB of JSON, gzipped by the stub itself when self-gzip is set
  local selfgz=""; [ -n "${4:-}" ] && selfgz="gzip on; gzip_types application/json; gzip_min_length 1;"
  # shellcheck disable=SC2016 # $request_uri is for nginx, not the shell
  printf 'server { listen %s; add_header X-Powered-By "stub"; %s location / { default_type text/plain; return 200 "%s $request_uri\\n"; } location = %s { default_type application/json; return 200 '"'"'{"pad":"%s"}'"'"'; } }\n' \
    "$2" "$selfgz" "$1" "$3" "$PAD"
}
mkdir -p "$WORK/fe" "$WORK/be"
stub_conf frontend 3000 /big gzip > "$WORK/fe/default.conf"   # like Next: compresses its own responses
stub_conf backend 4000 /health/big > "$WORK/be/default.conf"    # like Express /graphql: uncompressed JSON
chmod -R a+rX "$WORK"

# Public-looking subnet (CGNAT range), so clients on it are rate limited like real
# visitors. The gateway also joins a private network, standing in for SSR traffic.
docker network create --subnet 100.64.250.0/24 "$NET" >/dev/null
docker network create --subnet 172.31.250.0/24 "$NET-priv" >/dev/null
docker run -d --name "$NET-fe" --network "$NET" --network-alias frontend_app \
  -v "$WORK/fe:/etc/nginx/conf.d:ro" "$IMAGE" >/dev/null
docker run -d --name "$NET-be" --network "$NET" --network-alias backend_api \
  -v "$WORK/be:/etc/nginx/conf.d:ro" "$IMAGE" >/dev/null
docker run -d --name "$NET-gw" --network "$NET" --network-alias gw \
  -p "127.0.0.1:$PORT_HTTP:80" -p "127.0.0.1:$PORT_HTTPS:443" \
  -v "$ROOT/nginx/conf:/etc/nginx/conf.d:ro" \
  -v "$WORK/le:/etc/letsencrypt:ro" \
  -v "$WORK/certbot-www:/var/www/certbot:ro" \
  "$IMAGE" >/dev/null
docker network connect --alias gw "$NET-priv" "$NET-gw"

ready=0
for _ in $(seq 1 30); do
  if curl -sk -m 5 -o /dev/null --resolve "luisfaria.dev:$PORT_HTTPS:127.0.0.1" "https://luisfaria.dev:$PORT_HTTPS/"; then
    ready=1; break
  fi
  sleep 1
done
if [ "$ready" -ne 1 ]; then
  echo "FAIL: gateway did not answer within 30s"; docker logs "$NET-gw" 2>&1 | tail -20; exit 1
fi

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
curl_exit() { # curl_exit <url> [extra curl args...] -> curl's exit code (52 = empty reply, 35 = TLS handshake failed)
  local url="$1"; shift
  local rc=0
  curl -sk -m 5 -o /dev/null "$@" "$url" || rc=$?
  echo "$rc"
}
header() { # header <name> <host> <path>
  curl -sk -m 5 -D - -o /dev/null --resolve "$2:$PORT_HTTPS:127.0.0.1" "https://$2:$PORT_HTTPS$3" \
    | tr -d '\r' | awk -v h="$(tr '[:upper:]' '[:lower:]' <<< "$1")" \
      'i = index($0, ": ") { if (tolower(substr($0, 1, i - 1)) == h) print substr($0, i + 2) }'   # split on the first ": " only (CSP has "data: https:")
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
expect "OPTIONS /graphql reaches the backend"    "200 backend /graphql"            "$(https luisfaria.dev /graphql -X OPTIONS)"
expect "/.env is 404"                           "404"                             "$(https luisfaria.dev /.env | cut -d' ' -f1)"
expect "/.git/config is 404"                    "404"                             "$(https luisfaria.dev /.git/config | cut -d' ' -f1)"
expect "/index.php is 404"                      "404"                             "$(https luisfaria.dev /index.php | cut -d' ' -f1)"
expect "/wp-login.php is 404"                   "404"                             "$(https luisfaria.dev /wp-login.php | cut -d' ' -f1)"
expect "/wp-admin/ is 404"                      "404"                             "$(https luisfaria.dev /wp-admin/ | cut -d' ' -f1)"

echo "== headers"
expect "HSTS on the frontend"                   "max-age=31536000; includeSubDomains" "$(header Strict-Transport-Security luisfaria.dev /)"
expect "CSP on the backend routes too"          "1"                               "$(header Content-Security-Policy luisfaria.dev /health | grep -c "default-src 'self'")"

expect "Referrer-Policy keeps the origin cross-site" "strict-origin-when-cross-origin" "$(header Referrer-Policy luisfaria.dev /)"
expect "X-XSS-Protection is off (CSP replaces it)" "0" "$(header X-XSS-Protection luisfaria.dev /)"
expect "Permissions-Policy denies unused features" "camera=(), microphone=(), geolocation=(), payment=(), usb=()" \
  "$(header Permissions-Policy luisfaria.dev /)"
csp="$(header Content-Security-Policy luisfaria.dev /)"
for d in "object-src 'none'" "base-uri 'self'" "form-action 'self'" "frame-ancestors 'none'" "https://o4510868467417088.ingest.us.sentry.io"; do
  expect "CSP has $d" "1" "$(grep -cF -- "$d" <<< "$csp")"
done
expect "X-Powered-By from upstreams is hidden"   "" "$(header X-Powered-By luisfaria.dev /)$(header X-Powered-By luisfaria.dev /health)"
expect "Server header has no nginx version"      "nginx" "$(header Server luisfaria.dev /)"
expect "no CORS headers from nginx on pages"     "0" \
  "$(curl -sk -m 5 -D - -o /dev/null --resolve "luisfaria.dev:$PORT_HTTPS:127.0.0.1" "https://luisfaria.dev:$PORT_HTTPS/" | grep -ci '^access-control-')"
expect "no CORS headers from nginx on /graphql"  "0" \
  "$(curl -sk -m 5 -D - -o /dev/null -X POST -d '{}' --resolve "luisfaria.dev:$PORT_HTTPS:127.0.0.1" "https://luisfaria.dev:$PORT_HTTPS/graphql" | grep -ci '^access-control-')"

echo "== http2 and gzip"
expect "HTTP/2 is negotiated"                    "2" \
  "$(curl -sk -m 5 --http2 -o /dev/null -w '%{http_version}' --resolve "luisfaria.dev:$PORT_HTTPS:127.0.0.1" "https://luisfaria.dev:$PORT_HTTPS/")"
gz() { # gz <path> [Accept-Encoding] -> "<Content-Encoding count> <encoding> <decoded body bytes>"
  curl -sk -m 5 --resolve "luisfaria.dev:$PORT_HTTPS:127.0.0.1" -H "Accept-Encoding: ${2:-gzip}" \
    -D "$WORK/gzh" -o "$WORK/gzb" "https://luisfaria.dev:$PORT_HTTPS$1" || true
  local n enc size
  n=$(tr -d '\r' < "$WORK/gzh" | grep -ci '^content-encoding:' || true)
  enc=$(tr -d '\r' < "$WORK/gzh" | awk -F': ' 'tolower($1)=="content-encoding" {print $2}' | head -1)
  if [ "$enc" = "gzip" ]; then size=$(gzip -dc < "$WORK/gzb" | wc -c); else size=$(wc -c < "$WORK/gzb"); fi
  echo "$n ${enc:-none} $(tr -d ' ' <<< "$size")"
}
expect "big backend JSON is gzipped"             "1 gzip 2010" "$(gz /health/big)"
expect "no gzip when the client doesn't ask"     "0 none 2010" "$(gz /health/big identity)"
expect "small responses are not gzipped"         "0 none 16"   "$(gz /health)"
expect "already-gzipped upstream is not gzipped twice" "1 gzip 2010" "$(gz /big)"

echo "== rate limits"
burst() { # burst <network> <count> <curl args...> -> one status code per request, from a fresh client container
  local net="$1" n="$2"; shift 2
  docker run --rm --network "$net" "$IMAGE" sh -c \
    'n=$1; shift; i=0; while [ $i -lt $n ]; do curl -sk -m 5 -o /dev/null -w "%{http_code} " --connect-to luisfaria.dev:443:gw:443 "$@"; i=$((i+1)); done' \
    sh "$n" "$@"
}
# One client for all /api/discord checks, so they share one quota deterministically
discord=$(docker run --rm --network "$NET" "$IMAGE" sh -c '
  c() { curl -sk -m 5 -o /dev/null -w "%{http_code} " --connect-to luisfaria.dev:443:gw:443 "$@" https://luisfaria.dev/api/discord; }
  c; for i in 1 2 3 4 5 6; do c -X POST -d "{}"; done' | sed 's/ $//')
expect "/api/discord: GET is refused"            "403" "$(cut -d' ' -f1 <<< "$discord")"
expect "/api/discord: 5 requests per IP (the GET counts), the 6th gets 429" "200 200 200 200 429 429" "$(cut -d' ' -f2- <<< "$discord")"
expect "/graphql: a 150-request flood gets 429s" "yes" \
  "$(burst "$NET" 150 -X POST -d '{}' https://luisfaria.dev/graphql | grep -q 429 && echo yes || echo no)"
expect "/graphql: SSR (private IP) is never limited" "no" \
  "$(burst "$NET-priv" 150 -X POST -d '{}' https://luisfaria.dev/graphql | grep -q 429 && echo yes || echo no)"
expect "no User-Agent on http: connection closed (curl 52)" "52" \
  "$(curl_exit "http://luisfaria.dev:$PORT_HTTP/robots.txt" -A "" --resolve "luisfaria.dev:$PORT_HTTP:127.0.0.1")"
expect "with a User-Agent, http still redirects" "301" \
  "$(status "http://luisfaria.dev:$PORT_HTTP/robots.txt" -A "test" --resolve "luisfaria.dev:$PORT_HTTP:127.0.0.1")"

echo "== redirects and catch-alls"
expect "http apex redirects to https"           "301"  "$(status "http://luisfaria.dev:$PORT_HTTP/x" --resolve "luisfaria.dev:$PORT_HTTP:127.0.0.1")"
expect "https www redirects to apex"            "https://luisfaria.dev/x" \
  "$(curl -sk -m 5 -o /dev/null -w '%{redirect_url}' --resolve "www.luisfaria.dev:$PORT_HTTPS:127.0.0.1" "https://www.luisfaria.dev:$PORT_HTTPS/x")"
expect "ACME challenge is served over http"     "acme-token" \
  "$(curl -s -m 5 --resolve "luisfaria.dev:$PORT_HTTP:127.0.0.1" "http://luisfaria.dev:$PORT_HTTP/.well-known/acme-challenge/t1")"
# Exit codes, not "000": they prove the gateway answered and rejected, not that it was unreachable.
expect "bare-IP http: connection closed with no reply (444, curl 52)" "52" "$(curl_exit "http://127.0.0.1:$PORT_HTTP/")"
expect "unknown SNI: TLS handshake refused (curl 35)" "35" \
  "$(curl_exit "https://other.example:$PORT_HTTPS/" --resolve "other.example:$PORT_HTTPS:127.0.0.1")"
expect "gateway still up after the rejections"  "200 frontend /" "$(https luisfaria.dev /)"

echo
echo "$PASS passed, $FAIL failed"
if [ "$FAIL" -ne 0 ]; then docker logs "$NET-gw" 2>&1 | tail -20; exit 1; fi
