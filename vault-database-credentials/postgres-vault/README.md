# PostgreSQL credentials from Vault

This Compose configuration connects the Enterprise API to PostgreSQL 18 using a
Vault database role. Follow the [local setup](../README.md#local-setup) to build
the development distribution and export `ENTERPRISE_SOURCE_DIR`.

From the examples repository root:

~~~bash
export DEMO_MODE=dynamic
./vault-database-credentials/prepare.sh postgres "$DEMO_MODE"
cd vault-database-credentials/postgres-vault
docker compose up -d
~~~

Select `DEMO_MODE=static` to use the existing `waltid_static` PostgreSQL account
with a Vault-managed password. The static password rotates hourly and the API
polls Vault every two seconds. The dynamic configuration creates users with
40-second leases. The API obtains replacement credentials before expiry.

The default loopback ports are `17500` for the API, `15432` for PostgreSQL and
`18200` for Vault. Override `DEMO_API_PORT`, `DEMO_POSTGRES_PORT` and
`DEMO_VAULT_PORT` when another configuration uses those ports. The API shares
Vault's network namespace to access Vault over loopback HTTP.

Run `docker compose down --volumes` from the same directory to remove the local
containers and database volumes.

## Database and Vault setup

Database initialization creates the `waltid` schema and a stable `waltid_owner`
role with no login. Static and leased users assume that role on connection.
It owns application objects and can run Enterprise's startup migrations, allowing
Vault to drop expired login roles. This configuration grants schema DDL privileges.

Vault uses a separate `vault_db_admin` login with role-management and
session-termination privileges. The API token can read only the chosen credential
endpoint. The token file is loaded on every Vault request. Supply and refresh that
file through the chosen Vault authentication mechanism in a deployment.

Superseded dynamic leases expire in Vault. Borrowed connections drain until the
earlier of `maxDrainSeconds` (default 30) and lease expiry. Connections still
borrowed at that deadline are aborted. Token providers must preserve overlapping
validity until all API replicas have adopted replacement credentials.
