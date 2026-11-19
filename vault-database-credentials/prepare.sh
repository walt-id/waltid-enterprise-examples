#!/usr/bin/env bash
set -euo pipefail

cd -- "$(dirname -- "$0")"
backend=${1:-}
mode=${2:-}
case "$backend:$mode" in
    postgres:static|postgres:dynamic|mongodb:static|mongodb:dynamic) ;;
    *) printf 'Usage: %s {postgres|mongodb} {static|dynamic}\n' "$0" >&2; exit 2 ;;
esac

fail() { printf '%s\n' "$*" >&2; exit 1; }

source_dir=${ENTERPRISE_SOURCE_DIR:-}
[[ "$source_dir" = /* && -f "$source_dir/waltid-enterprise-api/config/auth.conf" ]] ||
    fail 'Set ENTERPRISE_SOURCE_DIR to the absolute path of your private Enterprise source checkout.'
dist=${ENTERPRISE_DIST_DIR:-"$source_dir/waltid-enterprise-api-development/build/install/waltid-enterprise-api-development"}
[[ "$dist" = /* && -x "$dist/bin/waltid-enterprise-api-development" ]] ||
    fail 'Build the development distribution or set ENTERPRISE_DIST_DIR to its absolute path.'
for file in development.waltlicense holder-key.json issuer-public.jwk network-fetch-guard.conf; do
    [[ -f "$source_dir/dev-license/$file" ]] ||
        fail "The private Enterprise checkout must provide dev-license/$file."
done

example="$PWD/$backend-vault"
state=${DEMO_STATE_DIR:-"$example/artifacts/$mode"}
[[ "$state" = /* ]] || fail 'DEMO_STATE_DIR must be an absolute path when overridden.'
umask 077
mkdir -p "$state/dev-license"
for file in development.waltlicense holder-key.json issuer-public.jwk network-fetch-guard.conf; do
    cp "$source_dir/dev-license/$file" "$state/dev-license/"
done
cp "$example/config/_features.conf" "$state/dev-license/"
files=(vault-db-password vault-root-token dev-mode-token)
if [[ "$backend" == postgres ]]; then
    files+=(postgres-password)
else
    files+=(mongo-admin-password mongo-keyfile mongo-static-password)
fi
for file in "${files[@]}"; do
    if [[ ! -s "$state/$file" ]]; then
        openssl rand -hex 24 > "$state/$file"
    fi
done

printf 'tokens = {}\n' > "$state/dev-license/superadmin-registration.conf"
printf 'accessToken = "%s"\n' "$(cat "$state/dev-mode-token")" \
    > "$state/dev-license/dev-mode-access.conf"
printf 'Prepared local %s configuration for the %s Vault role.\n' "$backend" "$mode"
