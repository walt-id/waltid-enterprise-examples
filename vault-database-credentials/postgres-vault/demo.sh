#!/usr/bin/env bash
set -euo pipefail

cd -- "$(dirname -- "$0")"
mode=${1:-}
action=${2:-}
case "$mode" in
    static|dynamic) ;;
    *) printf 'Usage: %s {static|dynamic} {prepare|up|ready|check|down}\n' "$0" >&2; exit 2 ;;
esac
export DEMO_MODE="$mode"
export DEMO_STATE_DIR=${DEMO_STATE_DIR:-"$PWD/artifacts/$mode"}
port=${DEMO_API_PORT:-17500}

fail() { printf '%s\n' "$*" >&2; exit 1; }
compose() { docker compose "$@"; }

source_dir=${ENTERPRISE_SOURCE_DIR:-}
[[ "$source_dir" = /* && -d "$source_dir" ]] ||
    fail 'Set ENTERPRISE_SOURCE_DIR to the absolute path of your private Enterprise source checkout.'
ENTERPRISE_SOURCE_DIR=$(cd -- "$source_dir" && pwd)
export ENTERPRISE_SOURCE_DIR
export ENTERPRISE_DIST_DIR=${ENTERPRISE_DIST_DIR:-"$ENTERPRISE_SOURCE_DIR/waltid-enterprise-api-development/build/install/waltid-enterprise-api-development"}
[[ "$ENTERPRISE_DIST_DIR" = /* ]] || fail 'ENTERPRISE_DIST_DIR must be an absolute path.'

preflight() {
    local file
    [[ -f "$ENTERPRISE_SOURCE_DIR/waltid-enterprise-api/config/auth.conf" ]] ||
        fail 'ENTERPRISE_SOURCE_DIR must contain waltid-enterprise-api/config/auth.conf.'
    for file in development.waltlicense holder-key.json issuer-public.jwk network-fetch-guard.conf; do
        [[ -f "$ENTERPRISE_SOURCE_DIR/dev-license/$file" ]] ||
            fail "The private Enterprise checkout must provide dev-license/$file."
    done
}

prepare() {
    local file
    local dev_source="$ENTERPRISE_SOURCE_DIR/dev-license"
    preflight
    umask 077
    mkdir -p "$DEMO_STATE_DIR/dev-license"
    for file in development.waltlicense holder-key.json issuer-public.jwk network-fetch-guard.conf; do
        cp "$dev_source/$file" "$DEMO_STATE_DIR/dev-license/"
    done
    cp config/_features.conf "$DEMO_STATE_DIR/dev-license/"
    for file in postgres-password vault-db-password vault-root-token admin-token admin-password dev-mode-token; do
        if [[ ! -s "$DEMO_STATE_DIR/$file" ]]; then
            openssl rand -hex 24 > "$DEMO_STATE_DIR/$file"
        fi
    done
    cat > "$DEMO_STATE_DIR/dev-license/superadmin-registration.conf" <<EOF
tokens {
    "$(cat "$DEMO_STATE_DIR/admin-token")" {
        expiration = "2099-01-01T00:00:00Z"
        devModeOnly = true
        account {
            type = "email"
            identifier { email = "demo-admin@example.test" }
            data { password = "$(cat "$DEMO_STATE_DIR/admin-password")" }
        }
    }
}
EOF
    printf 'accessToken = "%s"\n' "$(cat "$DEMO_STATE_DIR/dev-mode-token")" \
        > "$DEMO_STATE_DIR/dev-license/dev-mode-access.conf"
}

api() {
    local path=$1
    shift
    curl --silent --show-error --fail --max-time 15 --noproxy '*' \
        --resolve "enterprise.localhost:$port:127.0.0.1" \
        "$@" "http://enterprise.localhost:$port$path"
}

login() {
    local response
    response=$(jq -Rn '{email:"demo-admin@example.test",password:input}' < "$DEMO_STATE_DIR/admin-password" |
        api /auth/account/emailpass -H 'Content-Type: application/json' --data-binary @- --write-out $'\n%{http_code}') ||
        return 1
    [[ "${response##*$'\n'}" == 200 ]] || return 1
    jq -er '.token | strings | select(length > 0)' <<<"${response%$'\n'*}"
}

admin() {
    api "$1" -H @<(printf 'Authorization: Bearer %s\n' "$bearer") "${@:2}"
}

create_org() {
    local status
    status=$(jq -n --arg id "$1" '{_id:$id,profile:{name:$id}}' |
        admin /v1/admin/organizations -H "X-Request-Id: create-$1" \
            -H 'Content-Type: application/json' --data-binary @- \
            --output /dev/null --write-out '%{http_code}')
    [[ "$status" == 201 ]] || fail "Organization $1 creation returned HTTP $status."
    printf 'POST /v1/admin/organizations -> HTTP %s (%s)\n' "$status" "$1"
}

read_org() {
    local response status
    response=$(admin "/v1/admin/organizations/$1" -H "X-Request-Id: read-$1" --write-out $'\n%{http_code}')
    status="${response##*$'\n'}"
    if [[ "$status" != 200 ]] ||
        ! jq -e --arg id "$1" '._id == $id and .profile.name == $id' <<<"${response%$'\n'*}" >/dev/null; then
        fail "Organization $1 read did not match the expected HTTP 200 payload."
    fi
    printf 'GET /v1/admin/organizations/%s -> HTTP %s\n' "$1" "$status"
}

db() {
    local sql=$1
    shift
    printf '%s\n' "$sql" | compose exec -T postgres psql -X -Atq -v ON_ERROR_STOP=1 \
        -U postgres -d waltid_enterprise "$@"
}

operator_vault() {
    # shellcheck disable=SC2016  # The container expands the arguments and reads its token.
    compose exec -T vault sh -ec '
        VAULT_TOKEN="$(cat /run/vault-operator/token)"
        export VAULT_TOKEN
        exec vault "$@"
    ' demo "$@"
}

static_login() {
    printf '%s\n' "$1" | compose exec -T postgres sh -ec '
        IFS= read -r PGPASSWORD
        export PGPASSWORD
        export LC_ALL=C
        exec psql -X -w -At -h postgres -U waltid_static -d waltid_enterprise -c "SELECT 1"
    '
}

ready() { api /readyz >/dev/null 2>&1; }

wait_until() {
    local seconds=$1
    local description=$2
    shift 2
    local deadline=$((SECONDS + seconds))
    until "$@"; do
        (( SECONDS < deadline )) || fail "$description timed out."
        sleep 1
    done
}

db_true() { [[ "$(db "$@")" == t ]]; }

api_process() {
    local container
    container=$(compose ps -q api)
    [[ -n "$container" ]] || return 1
    docker inspect --format '{{.Id}} {{.State.Pid}} {{.State.StartedAt}} {{.RestartCount}}' "$container"
}

check_static() {
    local old_password denied cutoff
    old_password=$(operator_vault read -field=password database/static-creds/waltid-static)
    [[ "$(static_login "$old_password")" == 1 ]] || fail 'Static password baseline login failed.'
    printf '%s\n' '$ vault write -f database/rotate-role/waltid-static'
    operator_vault write -f database/rotate-role/waltid-static >/dev/null
    if denied=$(static_login "$old_password" 2>&1) ||
        [[ "$denied" != *"password authentication failed"* ]]; then
        fail 'PostgreSQL did not reject the old static password as expected.'
    fi
    printf 'Vault rotated the static password. PostgreSQL rejected the old password.\n'
    cutoff=$(db 'SELECT clock_timestamp()')
    db "SELECT pg_terminate_backend(pid)
        FROM pg_stat_activity
        WHERE application_name = 'enterprise-vault-demo' AND backend_start <= :'cutoff';" \
        -v "cutoff=$cutoff" >/dev/null
    wait_until 35 'Fresh connection using the rotated password' db_true \
        "SELECT EXISTS (SELECT FROM pg_stat_activity
                        WHERE application_name = 'enterprise-vault-demo'
                          AND usename = 'waltid_static' AND backend_start > :'cutoff')
             AND NOT EXISTS (SELECT FROM pg_stat_activity
                             WHERE application_name = 'enterprise-vault-demo'
                               AND backend_start <= :'cutoff');" -v "cutoff=$cutoff"
    printf 'Disconnected the old PostgreSQL sessions and verified a fresh API connection under the same login.\n'
}

database_login() {
    db "SELECT usename FROM pg_stat_activity
        WHERE application_name = 'enterprise-vault-demo'
          AND usename <> :'exclude'
        ORDER BY backend_start DESC LIMIT 1;" -v "exclude=${1:-}"
}

password_hmac() {
    compose exec -T vault cat /tmp/postgres-demo-audit.jsonl |
        jq -er --arg username "$1" '
            select(.type == "response" and .request.path == "database/creds/waltid-dynamic"
                and .response.data.username == $username)
            | .response.data.password
            | select(type == "string" and test("^hmac-sha256:[0-9a-f]{64}$"))
        '
}

check_dynamic() {
    local previous=$1
    local replacement previous_hmac replacement_hmac
    printf 'Waiting for the API to request a replacement lease and authenticate to PostgreSQL.\n'
    local deadline=$((SECONDS + 70))
    until replacement=$(database_login "$previous") && [[ -n "$replacement" ]]; do
        (( SECONDS < deadline )) || fail 'Replacement dynamic login authentication timed out.'
        sleep 1
    done
    db_true "SELECT EXISTS (SELECT FROM pg_roles WHERE rolname = :'previous');" -v "previous=$previous" ||
        fail 'The previous dynamic role expired before the replacement was observed.'
    printf 'Replacement PostgreSQL username: %s\n' "$replacement"
    printf 'PostgreSQL authenticated the replacement before the previous role expired.\n'
    previous_hmac=$(password_hmac "$previous") || fail 'Vault audit entry missing for the previous login.'
    replacement_hmac=$(password_hmac "$replacement") || fail 'Vault audit entry missing for the replacement login.'
    [[ "$previous_hmac" != "$replacement_hmac" ]] || fail 'Vault issued the same password for both logins.'
    printf 'Password changed: true (Vault audit HMACs differ; passwords and hashes remain hidden)\n'
}

wait_dynamic_expired() {
    local previous=$1
    wait_until 70 'Revocation of the old dynamic login' db_true \
        "SELECT NOT EXISTS (SELECT FROM pg_roles WHERE rolname = :'previous')
             AND NOT EXISTS (SELECT FROM pg_stat_activity WHERE usename = :'previous');" \
        -v "previous=$previous"
    printf 'Vault expired the old lease. PostgreSQL removed its login and closed its sessions.\n'
}

rotation_logs() {
    compose logs --since "$1" --timestamps --no-color --no-log-prefix api |
        awk -v before="$2" -v after="$3" '
            /Rotated PostgreSQL credentials from Vault [(]DYNAMIC[)]/ && !rotation {
                rotation = $0
            }
            rotation && /200 OK: GET - \/v1\/admin\/organizations\// &&
                index($0, "callId=read-" before) {
                print rotation
                print
                old_read = 1
            }
            old_read && /201 Created: POST - \/v1\/admin\/organizations / &&
                index($0, "callId=create-" after) {
                print
                new_write = 1
            }
            new_write && /200 OK: GET - \/v1\/admin\/organizations\// &&
                index($0, "callId=read-" after) {
                print
                new_read = 1
            }
            END { if (!rotation || !old_read || !new_write || !new_read) exit 1 }
        '
}

check() {
    local start ids before after bearer pid started_at restarts previous since app_logs deadline
    wait_until 120 'Enterprise API readiness' ready
    start=$(api_process)
    read -r _ pid started_at restarts <<<"$start"
    if [[ "$mode" == dynamic ]]; then
        printf '\n## Before rotation | Enterprise API\n'
    fi
    printf 'API before rotation: PID %s, started %s, restarts %s\n' "$pid" "$started_at" "$restarts"
    if ! bearer=$(login 2>/dev/null); then
        jq -Rn '{token:input}' < "$DEMO_STATE_DIR/admin-token" |
            api /v1/superadmin/create-by-token -H 'Content-Type: application/json' --data-binary @- >/dev/null
        bearer=$(login)
    fi
    printf 'Enterprise API ready. POST /auth/account/emailpass -> HTTP 200 (superadmin authenticated).\n'

    ids="vault-$mode-$(openssl rand -hex 5)"
    before="$ids-before"
    after="$ids-after"
    create_org "$before"
    read_org "$before"
    printf 'Created and read an organization through the Enterprise API before rotation.\n'

    if [[ "$mode" == static ]]; then
        check_static
    else
        since=$(date -u +%Y-%m-%dT%H:%M:%SZ)
        previous=$(database_login)
        [[ -n "$previous" ]] || fail 'Cannot identify the original Vault-issued PostgreSQL login.'
        printf 'Original PostgreSQL username: %s\n' "$previous"
        printf '\n## Rotation | Vault issues a new username and password\n'
        check_dynamic "$previous"
        printf '\n## After rotation | Enterprise API reads and writes\n'
    fi

    read_org "$before"
    create_org "$after"
    read_org "$after"
    [[ "$(db "SELECT count(*) FROM waltid.organizations
              WHERE id IN (:'first', :'second');" -v "first=$before" -v "second=$after")" == 2 ]] ||
        fail 'PostgreSQL did not contain both organizations.'
    printf 'PostgreSQL contains both organization rows (count = 2).\n'

    if [[ "$mode" == dynamic ]]; then
        deadline=$((SECONDS + 5))
        until app_logs=$(rotation_logs "$since" "$before" "$after"); do
            (( SECONDS < deadline )) ||
                fail 'Expected rotation and post-rotation API requests were missing or out of order in the application logs.'
            sleep 1
        done
        wait_dynamic_expired "$previous"
        printf '\n## Enterprise application logs | rotation and subsequent requests\n'
        printf '$ docker compose logs --since %s --timestamps api (matching events)\n' "$since"
        printf '%s\n' "$app_logs"
    fi

    [[ "$(api_process)" == "$start" ]] || fail 'Enterprise API container or process restarted.'
    printf 'API after rotation: PID %s, started %s, restarts %s (unchanged)\n' "$pid" "$started_at" "$restarts"
}

case "$action" in
    prepare) prepare ;;
    up)
        [[ -x "$ENTERPRISE_DIST_DIR/bin/waltid-enterprise-api-development" ]] ||
            fail 'Build :waltid-enterprise-api-development:installDist or set ENTERPRISE_DIST_DIR.'
        prepare
        compose up -d
        ;;
    ready)
        wait_until 120 'Enterprise API readiness' ready
        printf 'GET /readyz -> HTTP 200\n'
        ;;
    check) check ;;
    down) compose down --volumes ;;
    *) fail "Usage: $0 {static|dynamic} {prepare|up|ready|check|down}" ;;
esac
