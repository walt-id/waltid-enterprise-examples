#!/bin/sh
set -eu

VAULT_TOKEN="$(cat /run/secrets/vault-root-token)"
export VAULT_TOKEN

token_current() {
    [ -s "$1" ] && vault token lookup "$(cat "$1")" >/dev/null 2>&1
}

if token_current /run/vault/app-token; then
    exit 0
fi

if ! vault read sys/mounts/database/tune >/dev/null 2>&1; then
    vault secrets enable database >/dev/null
fi

vault write database/config/enterprise \
    plugin_name=mongodb-database-plugin \
    allowed_roles="waltid-$DEMO_MODE" \
    connection_url='mongodb://{{username}}:{{password}}@mongo:27017/admin?replicaSet=rs0' \
    username=vault_demo_manager \
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
        vault write database/roles/waltid-dynamic db_name=enterprise default_ttl=50s max_ttl=50s \
            creation_statements='{"db":"admin","roles":[{"role":"readWrite","db":"waltid-enterprise"}]}' \
            revocation_statements='{"db":"admin"}' >/dev/null
        credential_path=database/creds/waltid-dynamic
        ;;
    *) exit 2 ;;
esac

printf 'path "%s" { capabilities = ["read"] }\n' "$credential_path" |
    vault policy write enterprise-db - >/dev/null
umask 077
vault token create -field=token -no-default-policy -policy=enterprise-db -ttl=4h >/run/vault/app-token.new
mv /run/vault/app-token.new /run/vault/app-token

printf 'Vault provisioned the %s MongoDB role and a scoped API token.\n' "$DEMO_MODE"
