# Database credentials from Vault

Run Enterprise with PostgreSQL or MongoDB credentials issued by HashiCorp Vault.
Each database example supports a static role that rotates a password and a
dynamic role that issues short-lived usernames and passwords.

The database credential provider is part of the prerelease work in
[Enterprise PR 908](https://github.com/walt-id/waltid-identity-enterprise/pull/908).
Use an Enterprise source checkout and development distribution containing that
change. Access to the private Enterprise build inputs is required.

## Local source prerequisites

Install Docker Compose v2, Bash, curl, jq and OpenSSL. The manual multi-replica
checks also use Python 3.9 or later. Follow the Enterprise repository's build
instructions to set up the coordinated `waltid-unified-build` checkout, select the
Enterprise revision containing the credential provider, and build the development
distribution from that build root.

~~~bash
./gradlew :waltid-enterprise-api-development:installDist
~~~

Set `ENTERPRISE_SOURCE_DIR` to the absolute path of the private
`waltid-identity-enterprise` checkout that supplied the build. It must provide
`waltid-enterprise-api/config/` and the matching `dev-license/` development
material. `ENTERPRISE_DIST_DIR` defaults to
`$ENTERPRISE_SOURCE_DIR/waltid-enterprise-api-development/build/install/waltid-enterprise-api-development`.
Set it to an absolute path if the distribution is installed elsewhere.

Run the following examples from this repository after exporting that environment.
The runners validate those inputs before starting services.

## Run a database example

- [PostgreSQL](postgres-vault/) verifies a password or login change while preserving
  organization data and the Enterprise process.
- [MongoDB](mongodb-vault/) runs an authenticated replica set and verifies the same
  Enterprise read and write behavior.
- [Manual checks](checks/) cover all four database and role combinations, including
  two replicas, repeated rotations, token-file replacement, Vault outages, lease
  expiry, early token revocation and operator CLI compatibility.

~~~bash
cd vault-database-credentials/postgres-vault
./demo.sh dynamic up
./demo.sh dynamic check
./demo.sh dynamic down
~~~

Use `static` in the same commands for the password-only role. The MongoDB example
has the same interface. `postgres-vault/record-demo.sh` retains the dynamic recording
flow with the Compose file, database configuration and native application logs.

## Local runtime material

The scripts stage development license files from the private source checkout into
ignored `artifacts/` directories and generate local bootstrap credentials there.
The runtime mounts the distribution, configuration and license material read-only.
The multi-replica harness removes temporary fixture files and Compose resources
when it exits. Standalone `down` removes its containers and volumes, and leaves
its ignored bootstrap files for another local run.

The examples use local development licensing and Vault development mode. Production
Vault authentication, token renewal and TLS configuration belong to the deployment.
The [Enterprise quickstart guide preview](https://github.com/walt-id/waltid-enterprise-quickstart/blob/codex/vault-database-credentials/VAULT-DATABASES.md)
and [Vault credential runbook preview](https://github.com/walt-id/waltid-docs/blob/codex/vault-database-credentials/src/content/3.enterprise-stack/3.setup/2.deployment/7.vault-database-credentials.md)
describe deployment configuration. The runbook is pending release in
[documentation PR 493](https://github.com/walt-id/waltid-docs/pull/493).
