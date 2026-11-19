# PostgreSQL credentials from Vault

This local demonstration runs the Enterprise API, PostgreSQL 18 and Vault in Docker Compose. The static role keeps one PostgreSQL login and rotates its password. The dynamic role issues a new PostgreSQL login for each lease. The checks create and read organizations through the Enterprise API before and after rotation, verify the records in PostgreSQL and check that the API process stayed up.

## Build and run

Follow the [local source prerequisites](../README.md#local-source-prerequisites)
to build the development distribution and set `ENTERPRISE_SOURCE_DIR`.
From the examples checkout, enter `vault-database-credentials/postgres-vault`.
Use Docker Compose v2, Bash, curl, jq and OpenSSL.

~~~bash
./demo.sh dynamic up
./demo.sh dynamic check
./demo.sh dynamic down
~~~

Use `static` in the same commands to run the standalone static password check.

Set `ENTERPRISE_DIST_DIR` to the absolute path of the installed development distribution if it is outside the default Gradle build directory. The API runs that distribution in a Java 21 container. The demo stages the private Enterprise checkout's development license and generates local bootstrap credentials in ignored `artifacts/<mode>/`. It mounts the local distribution and license files read-only at runtime. The API validates the development license at startup and uses the same Enterprise services and storage implementation as the production entry point.

The default loopback ports are `17500` for the API, `15432` for PostgreSQL and `18200` for Vault. To run both stacks together, set `DEMO_API_PORT`, `DEMO_POSTGRES_PORT` and `DEMO_VAULT_PORT` to distinct values for each mode and keep them set for subsequent commands in that mode. PostgreSQL and the Vault API stay on the Compose network for service-to-service traffic. The API shares Vault's network namespace so it can use loopback HTTP. `down` removes the selected Compose project and its volumes. Local bootstrap files remain in `artifacts/` so the project can be recreated.

`./record-demo.sh` runs one dynamic credential rollover for recording. It shows the Compose and database configuration, the Enterprise startup log, the original and replacement PostgreSQL usernames, the password comparison and live API operations. The final view shows timestamped Enterprise application logs for the rotation and the subsequent requests. Its default ports are `17501/15433/18201`. Run `./demo.sh dynamic down` before recording if the stack is running, and run it again afterward to remove the project.

For manual checks with two replicas, token replacement and lease expiry, see the [live Vault database checks](../checks/).

## What the check verifies

- **Static role.** A scoped demo operator calls Vault's `database/rotate-role/waltid-static` endpoint. A fresh PostgreSQL login using the old password fails with a password authentication error. The check disconnects any API backends that authenticated before the post-rotation timestamp, then waits for a newly authenticated backend with the same PostgreSQL login. The database role's regular Vault rotation period is one hour, and the API polls Vault every two seconds in this demo.
- **Dynamic role.** Vault leases last 40 seconds. The API requests a replacement before expiry and opens database connections with the new login. The check observes the two PostgreSQL usernames, uses the Enterprise API again after observing a replacement connection and verifies that Vault later removed the original login and its sessions. It looks up the password HMAC for each username in the demo's Vault audit file and outputs only whether the passwords differ. The demo mount logs its generated usernames for correlation. Vault keeps the password fields HMAC-protected. [Vault audit logs](https://developer.hashicorp.com/vault/docs/audit) and [secrets mount tuning](https://developer.hashicorp.com/vault/docs/commands/secrets/tune).
- **Both roles.** Using an authenticated Enterprise superadmin, the check creates and reads an organization before rotation. Afterward it reads that same organization, creates and reads a second one and independently counts the two PostgreSQL rows. It verifies the API container identity, PID, start timestamp and restart count.

## Database and Vault privileges

PostgreSQL initialization creates the `waltid` schema and a stable `waltid_owner` role with no login. Static and leased logins assume that role automatically on connection. The owner can run the Enterprise startup migrations and retains ownership of application objects when Vault drops an expired login. This setup proves rollover with schema DDL privileges. The current PostgreSQL startup path runs migrations, so deployments that require a CRUD-only API user need a separate migration path.

Vault's PostgreSQL connection uses a separate `vault_db_admin` login with role-management and session-termination privileges. The Enterprise token has read access to its single Vault credential endpoint. The static rotation demonstration uses a separate operator token. In a deployed setup the token file must be populated and refreshed by the chosen Vault authentication mechanism. The API reads the file on each Vault request. Superseded dynamic leases expire in Vault. Borrowed connections can drain until the earlier of `maxDrainSeconds` (default 30) and lease expiry; the API aborts connections still borrowed at that deadline. Revoking the issuing Vault token can revoke its leases early, so the token provider must preserve overlapping validity when replacing tokens.

The demo uses Vault development mode, loopback ports and local development license material. Deployments use managed Vault with TLS and their own secrets and license. A static rotation can briefly reject new connections until the next successful poll. Dynamic lease expiry makes `/readyz` return 503 until a validated replacement arrives; `/livez` remains independent of Vault. Early revocation can invalidate credentials before the local lease deadline and is not immediately reflected in readiness. The checks measure successful rollover over the demonstrated interval.
