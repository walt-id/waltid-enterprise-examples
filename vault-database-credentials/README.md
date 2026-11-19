# Database credentials from Vault

Compose configuration examples for running Enterprise with PostgreSQL or MongoDB
credentials issued by HashiCorp Vault. Both databases support a static role that
rotates a password and a dynamic role that issues short-lived usernames and passwords.

The credential provider is part of the prerelease work in
[Enterprise PR 908](https://github.com/walt-id/waltid-identity-enterprise/pull/908).
Use a private Enterprise source checkout and development distribution containing
that change.

## Local setup

Install Docker Compose v2, Bash and OpenSSL. Follow the Enterprise repository's
build instructions to prepare the coordinated `waltid-unified-build` checkout.
Build the development distribution from that build root.

~~~bash
./gradlew :waltid-enterprise-api-development:installDist
~~~

Export `ENTERPRISE_SOURCE_DIR` as the absolute path of the private
`waltid-identity-enterprise` checkout. It supplies `waltid-enterprise-api/config/`
and the matching `dev-license/` development material. `ENTERPRISE_DIST_DIR`
defaults to
`$ENTERPRISE_SOURCE_DIR/waltid-enterprise-api-development/build/install/waltid-enterprise-api-development`.
Set an absolute `ENTERPRISE_DIST_DIR` if the distribution is installed elsewhere.

Choose the [PostgreSQL](postgres-vault/) or [MongoDB](mongodb-vault/) configuration.
From this repository's root, prepare local runtime files and start the selected
Compose project.

~~~bash
export DEMO_MODE=dynamic
./vault-database-credentials/prepare.sh postgres "$DEMO_MODE"
cd vault-database-credentials/postgres-vault
docker compose up -d
~~~

Use `static` for a password rotation role. For MongoDB, pass `mongodb` to
`prepare.sh` and enter `vault-database-credentials/mongodb-vault`. Keep the selected
mode exported for startup and cleanup. The Compose files use separate project names
for each role mode. Set the port variables described in each example when running
more than one configuration concurrently.

`prepare.sh` stages development license files from the private source checkout and
generates bootstrap credentials under the selected example's ignored
`artifacts/<mode>/` directory. The runtime mounts the distribution, configuration
and license material read-only. `docker compose down --volumes` removes containers
and data volumes. The ignored bootstrap files remain available for another local run.
To place those files elsewhere, export an absolute `DEMO_STATE_DIR` before preparing
and keep it exported for Compose.

The configurations use local development licensing and Vault development mode.
Production Vault authentication, token renewal and TLS configuration belong to
the deployment. Deployment guidance is available in the
[Enterprise quickstart guide preview](https://github.com/walt-id/waltid-enterprise-quickstart/blob/codex/vault-database-credentials/VAULT-DATABASES.md)
and the
[Vault credential runbook preview](https://github.com/walt-id/waltid-docs/blob/codex/vault-database-credentials/src/content/3.enterprise-stack/3.setup/2.deployment/7.vault-database-credentials.md),
pending release in [documentation PR 493](https://github.com/walt-id/waltid-docs/pull/493).
