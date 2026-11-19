#!/bin/sh
set -eu

VAULT_TOKEN="$(cat /run/secrets/vault-root-token)"
export VAULT_TOKEN

token_current() {
    [ -s "$1" ] && vault token lookup "$(cat "$1")" >/dev/null 2>&1
}

if ! vault read sys/mounts/database/tune >/dev/null 2>&1; then
    vault secrets enable database >/dev/null
fi

if [ "$DEMO_MODE" = dynamic ]; then
    # Correlate synthetic demo usernames with PostgreSQL. Vault still HMACs passwords.
    vault secrets tune -audit-non-hmac-response-keys=username database/ >/dev/null
    if ! vault audit list -format=json | grep -Fq '"postgres-demo/"'; then
        vault audit enable -path=postgres-demo file file_path=/tmp/postgres-demo-audit.jsonl >/dev/null
    fi
fi

if token_current /run/vault/app-token &&
    { [ "$DEMO_MODE" = dynamic ] || token_current /run/vault-operator/token; }; then
    exit 0
fi

vault write database/config/enterprise \
    plugin_name=postgresql-database-plugin \
    allowed_roles="waltid-$DEMO_MODE" \
    connection_url='postgresql://{{username}}:{{password}}@postgres:5432/waltid_enterprise?sslmode=disable' \
    username=vault_db_admin \
    password="$(cat /run/secrets/vault-db-password)" >/dev/null

case "$DEMO_MODE" in
    static)
        if ! vault read database/static-roles/waltid-static >/dev/null 2>&1; then
            vault write database/static-roles/waltid-static \
                db_name=enterprise username=waltid_static rotation_period=1h >/dev/null
        fi
        credential_path=database/static-creds/waltid-static
        ;;
    dynamic)
        # All persistent objects are owned by waltid_owner, so expired login roles can be dropped.
        creation='CREATE ROLE "{{name}}" LOGIN PASSWORD '\''{{password}}'\'' VALID UNTIL '\''{{expiration}}'\'' IN ROLE waltid_owner;
ALTER ROLE "{{name}}" IN DATABASE waltid_enterprise SET role TO waltid_owner;'
        revocation='SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE usename = '\''{{name}}'\'';
DROP ROLE IF EXISTS "{{name}}";'
        vault write database/roles/waltid-dynamic db_name=enterprise default_ttl=40s max_ttl=40s \
            creation_statements="$creation" revocation_statements="$revocation" >/dev/null
        credential_path=database/creds/waltid-dynamic
        ;;
    *) exit 2 ;;
esac

printf 'path "%s" { capabilities = ["read"] }\n' "$credential_path" |
    vault policy write enterprise-db - >/dev/null
umask 077
vault token create -field=token -no-default-policy -policy=enterprise-db -ttl=4h >/run/vault/app-token.new
mv /run/vault/app-token.new /run/vault/app-token

if [ "$DEMO_MODE" = static ]; then
    vault policy write demo-operator - >/dev/null <<'HCL'
path "database/static-creds/waltid-static" { capabilities = ["read"] }
path "database/rotate-role/waltid-static" { capabilities = ["update"] }
HCL
    vault token create -field=token -no-default-policy -policy=demo-operator -ttl=4h >/run/vault-operator/token.new
    mv /run/vault-operator/token.new /run/vault-operator/token
fi

printf 'Vault provisioned the %s PostgreSQL role and a scoped API token.\n' "$DEMO_MODE"
