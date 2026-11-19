#!/usr/bin/env bash
set -euo pipefail

cd -- "$(dirname -- "$0")"
export DEMO_MODE=dynamic
export DEMO_STATE_DIR="$PWD/artifacts/dynamic"
export DEMO_API_PORT=${DEMO_API_PORT:-17501}
export DEMO_POSTGRES_PORT=${DEMO_POSTGRES_PORT:-15433}
export DEMO_VAULT_PORT=${DEMO_VAULT_PORT:-18201}

printf '## Docker Compose file\n'
printf '$ cat compose.yaml\n'
awk '
    /^  (vault|vault-init|api):$/ && !seen_secrets {
        printf "\n## Docker Compose / %s\n", $1
    }
    /^secrets:$/ {
        seen_secrets = 1
        printf "\n## Docker Compose / secrets and volumes\n"
    }
    { print }
' compose.yaml

printf '\n## Dynamic credentials | Enterprise PostgreSQL configuration\n'
printf '$ cat config/database-dynamic.conf\n'
cat config/database-dynamic.conf

printf '\n## Startup | PostgreSQL, Vault and Enterprise API\n'
printf '$ ./demo.sh dynamic up\n'
./demo.sh dynamic up
printf '$ docker compose ps\n'
docker compose ps --format 'table {{.Service}}\t{{.Status}}'
printf '$ ./demo.sh dynamic ready\n'
./demo.sh dynamic ready
printf '$ docker compose logs --timestamps api (startup events)\n'
docker compose logs --timestamps --no-color --no-log-prefix api | awk '
    /waltid-enterprise-postgres.*Start completed|PostgreSQL document store initialized|Application started in |Responding at http/ {
        if (!seen[$0]++ && lines++ < 5) print
    }
'

printf '$ ./demo.sh dynamic check\n'
./demo.sh dynamic check
