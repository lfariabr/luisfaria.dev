#!/usr/bin/env bash
# Prints the nginx image docker-compose.yml runs (#525), so the CI tests and the
# deploy's `nginx -t` check the exact image that ships. Pin the version there only.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
image="$(awk '$1 == "image:" && $2 ~ /^nginx:/ { print $2; exit }' "$ROOT/docker-compose.yml")"
[ -n "$image" ] || { echo "no nginx image in $ROOT/docker-compose.yml" >&2; exit 1; }
echo "$image"
