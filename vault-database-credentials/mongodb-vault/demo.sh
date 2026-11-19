#!/usr/bin/env bash
set -euo pipefail

cd -- "$(dirname -- "$0")"
mode=${1:-}
action=${2:-}
case "$mode" in
    static|dynamic) ;;
    *) printf 'Usage: %s {static|dynamic} {prepare|up|check|down}\n' "$0" >&2; exit 2 ;;
esac
export DEMO_MODE="$mode"
export DEMO_STATE_DIR=${DEMO_STATE_DIR:-"$PWD/artifacts/$mode"}
port=${DEMO_API_PORT:-17503}

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
    for file in mongo-admin-password mongo-keyfile mongo-static-password vault-db-password vault-root-token admin-token admin-password dev-mode-token; do
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

mongo_tool() {
    local action=$1
    shift
    compose exec -T -e "DEMO_MONGO_ACTION=$action" "$@" mongo \
        mongosh --quiet --nodb --file /demo/mongo-tools.js
}

operator_vault() {
    # shellcheck disable=SC2016  # The container reads its token and expands arguments.
    compose exec -T vault sh -ec '
        VAULT_TOKEN="$(cat /run/vault-operator/token)"
        export VAULT_TOKEN
        exec vault "$@"
    ' demo "$@"
}

mongo_authentication() {
    local since=$1 user=$2 exclude=$3
    compose logs --no-color --no-log-prefix --since "$since" mongo |
        jq -Rn -r --arg user "$user" --arg exclude "$exclude" '
            reduce (inputs | fromjson?) as $line (
                {connections: {}, login: ""};
                if $line.id == 51800 and $line.attr.doc.application.name == "enterprise-mongodb-vault-demo" then
                    .connections[$line.ctx] = true
                elif $line.id == 5286306 and .connections[$line.ctx] and $line.attr.db == "admin"
                    and ($user == "" or $line.attr.user == $user) and $line.attr.user != $exclude then
                    .login = $line.attr.user
                else
                    .
                end
            ) | .login
        '
}

wait_until() {
    local timeout=$1 description=$2
    shift 2
    local deadline=$((SECONDS + timeout))
    until "$@"; do
        (( SECONDS < deadline )) || fail "$description timed out."
        sleep 1
    done
}

readiness() { api /readyz >/dev/null 2>&1; }

api_process() {
    local container
    container=$(compose ps -q api)
    [[ -n "$container" ]] || return 1
    docker inspect --format '{{.Id}} {{.State.Pid}} {{.State.StartedAt}} {{.RestartCount}}' "$container"
}

check_static() {
    local old_password cutoff
    old_password=$(operator_vault read -field=password database/static-creds/waltid-static)
    [[ "$(printf '%s\n' "$old_password" | mongo_tool static-login)" == authenticated ]] ||
        fail 'The original static password did not authenticate.'
    printf '$ vault write -f database/rotate-role/waltid-static\n'
    operator_vault write -f database/rotate-role/waltid-static >/dev/null
    [[ "$(printf '%s\n' "$old_password" | mongo_tool static-login)" == rejected ]] ||
        fail 'MongoDB did not reject the old static password as expected.'
    cutoff=$(operator_vault read -field=last_vault_rotation database/static-creds/waltid-static)
    wait_until 40 'Fresh Enterprise connection with the rotated password' static_authentication "$cutoff"
    printf 'MongoDB rejected the old password and authenticated a fresh API connection as waltid_static.\n'
}

static_authentication() {
    [[ "$(mongo_authentication "$1" waltid_static "")" == waltid_static ]]
}

password_hmac() {
    compose exec -T vault cat /tmp/mongo-demo-audit.jsonl |
        jq -er --arg username "$1" '
            select(.type == "response" and .request.path == "database/creds/waltid-dynamic"
                and .response.data.username == $username)
            | .response.data.password
            | select(type == "string" and test("^hmac-sha256:[0-9a-f]{64}$"))
        '
}

check_dynamic() {
    local previous=$1 since=$2 replacement previous_hmac replacement_hmac
    printf 'Original MongoDB username: %s\n' "$previous"
    printf 'Waiting for the API to authenticate with a replacement Vault lease.\n'
    local deadline=$((SECONDS + 75))
    until replacement=$(mongo_authentication "$since" "" "$previous") && [[ -n "$replacement" ]]; do
        (( SECONDS < deadline )) || fail 'Replacement MongoDB authentication timed out.'
        sleep 1
    done
    [[ "$(mongo_tool user-exists -e "DEMO_MONGO_USER=$previous")" == true ]] ||
        fail 'The old MongoDB user had already expired before replacement was observed.'
    printf 'Replacement MongoDB username: %s\n' "$replacement"

    previous_hmac=$(password_hmac "$previous") || fail 'Vault audit entry missing for the old MongoDB login.'
    replacement_hmac=$(password_hmac "$replacement") || fail 'Vault audit entry missing for the new MongoDB login.'
    [[ "$previous_hmac" != "$replacement_hmac" ]] || fail 'Vault issued the same password for both MongoDB logins.'
    printf 'Password changed: true (Vault audit HMACs differ)\n'
}

old_user_removed() {
    [[ "$(mongo_tool user-exists -e "DEMO_MONGO_USER=$1")" == false ]]
}

rotation_logs() {
    local role_type
    role_type=$(printf '%s' "$mode" | tr '[:lower:]' '[:upper:]')
    compose logs --since "$1" --timestamps --no-color --no-log-prefix api |
        awk -v before="$2" -v after="$3" -v role="$role_type" '
            !rotation && index($0, "Rotated MongoDB credentials from Vault (" role ")") {
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
    local start id before after bearer pid started_at restarts previous since app_logs deadline
    wait_until 120 'Enterprise API readiness' readiness
    start=$(api_process)
    read -r _ pid started_at restarts <<<"$start"
    printf 'API before rotation: PID %s, started %s, restarts %s\n' "$pid" "$started_at" "$restarts"
    if ! bearer=$(login 2>/dev/null); then
        jq -Rn '{token:input}' < "$DEMO_STATE_DIR/admin-token" |
            api /v1/superadmin/create-by-token -H 'Content-Type: application/json' --data-binary @- >/dev/null
        bearer=$(login)
    fi
    printf 'POST /auth/account/emailpass -> HTTP 200 (superadmin authenticated)\n'

    id="mongo-$mode-$(openssl rand -hex 5)"
    before="$id-before"
    after="$id-after"
    create_org "$before"
    read_org "$before"

    since=$(date -u +%Y-%m-%dT%H:%M:%SZ)
    if [[ "$mode" == static ]]; then
        check_static
    else
        previous=$(mongo_authentication "$started_at" "" "")
        [[ -n "$previous" ]] || fail 'Cannot identify the original Vault-issued MongoDB login.'
        check_dynamic "$previous" "$since"
    fi

    read_org "$before"
    create_org "$after"
    read_org "$after"
    [[ "$(mongo_tool count-organizations -e "DEMO_ORG_BEFORE=$before" -e "DEMO_ORG_AFTER=$after")" == 2 ]] ||
        fail 'MongoDB did not contain both organizations.'
    printf 'MongoDB contains both organization documents (count = 2).\n'

    deadline=$((SECONDS + 5))
    until app_logs=$(rotation_logs "$since" "$before" "$after"); do
        (( SECONDS < deadline )) || fail 'Expected rotation and subsequent organization requests in the application log.'
        sleep 1
    done
    if [[ "$mode" == dynamic ]]; then
        wait_until 70 'Removal of the original Vault-issued MongoDB user' old_user_removed "$previous"
        printf 'Vault expired the old lease and removed its MongoDB user.\n'
    fi

    printf '\nEnterprise application log for rotation and subsequent requests\n%s\n' "$app_logs"
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
    check) check ;;
    down) compose down --volumes ;;
    *) fail "Usage: $0 {static|dynamic} {prepare|up|check|down}" ;;
esac
