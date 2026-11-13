#!/usr/bin/env bash
# =============================================================================
# Renews the Let's Encrypt certificate for luisfaria.dev and reloads nginx.
#
# Root's crontab runs it twice a day, straight from the deploy checkout:
#   0 0,12 * * * /bin/bash /var/www/portfolio/ops/certbot/renew-cert.sh > /var/log/cert-renew.log 2>&1
# The log keeps only the last run. `certbot renew` is a no-op until the cert is
# within 30 days of expiry, so most runs just reload nginx.
#
# Manual check (talks to Let's Encrypt's staging server, changes nothing):
#   CERTBOT_ARGS=--dry-run bash /var/www/portfolio/ops/certbot/renew-cert.sh
# =============================================================================
set -euo pipefail

ROOT="${PORTFOLIO_DIR:-/var/www/portfolio}"
# shellcheck disable=SC2206 # intentional word splitting of extra certbot flags
EXTRA_ARGS=(${CERTBOT_ARGS:-})

echo "=== $(date -u +%Y-%m-%dT%H:%M:%SZ) certbot renew ${EXTRA_ARGS[*]:-}"
docker run --rm \
  -v "$ROOT/certbot/conf:/etc/letsencrypt" \
  -v "$ROOT/certbot/www:/var/www/certbot" \
  certbot/certbot renew --quiet "${EXTRA_ARGS[@]}"

# Only reached if certbot succeeded (set -e): pick up a renewed cert.
docker exec nginx_gateway nginx -s reload
echo "=== $(date -u +%Y-%m-%dT%H:%M:%SZ) done"
