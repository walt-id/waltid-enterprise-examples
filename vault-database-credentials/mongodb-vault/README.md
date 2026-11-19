# MongoDB credentials from Vault

This demo runs Enterprise against an authenticated MongoDB 8.0 replica set with credentials from Vault's MongoDB database plugin. Each run verifies Enterprise API reads and writes across one credential change and checks that the API process stayed up. [Vault MongoDB database plugin](https://developer.hashicorp.com/vault/docs/secrets/databases/mongodb).

## Run the demo

Follow the [local source prerequisites](../README.md#local-source-prerequisites)
to build the development distribution and set `ENTERPRISE_SOURCE_DIR`.
From the examples checkout, enter `vault-database-credentials/mongodb-vault`.
Use Docker Compose v2, Bash, curl, jq and OpenSSL.

~~~bash
./demo.sh static up
./demo.sh static check
./demo.sh static down

./demo.sh dynamic up
./demo.sh dynamic check
./demo.sh dynamic down
~~~

Set `ENTERPRISE_DIST_DIR` to the absolute path of the installed development distribution if it is outside the default Gradle build directory. The Java 21 container mounts the distribution and staged development license read-only. The script generates local bootstrap credentials under ignored `artifacts/<mode>/`. `down` removes the selected Compose project and its volumes. The local bootstrap files remain available for another run.

The default loopback ports are `17503` for Enterprise, `27029` for MongoDB and `18203` for Vault. For simultaneous runs, set `DEMO_API_PORT`, `DEMO_MONGO_PORT` and `DEMO_VAULT_PORT` to different values for each mode. The MongoDB replica set advertises `mongo:27017` inside Compose. The API shares Vault's network namespace to use loopback HTTP in this local setup.

For manual checks with two replicas, token replacement and lease expiry, see the [live Vault database checks](../checks/).

## What the checks verify

- **Static role.** A fresh client authenticates as `waltid_static` with the original password. A scoped operator rotates that password through Vault, then the same fresh-client probe confirms MongoDB rejects the old password. MongoDB logs a fresh Enterprise connection using the same username after Vault's rotation timestamp.
- **Dynamic role.** Vault issues a new MongoDB username and password for each 50-second lease. MongoDB connection and authentication logs confirm Enterprise authenticates with a different username while the old account still exists. The demo compares Vault audit password HMACs for the two generated usernames and prints only the result of the comparison. It verifies that Vault later removes the original user when the lease expires. [Vault audit logging](https://developer.hashicorp.com/vault/docs/audit).
- **Both roles.** An authenticated Enterprise superadmin creates and reads an organization before rotation. After rotation, the check reads that organization and creates and reads another. A separate MongoDB query confirms both documents. The check displays the native Enterprise rotation and request logs in order, verifies the request IDs, and compares the container identity, PID, start time and restart count.

## Authentication and database access

MongoDB stores the static and leased login accounts in `admin`. Their `readWrite` access applies to the `waltid-enterprise` database, where the API also runs its startup migrations. `mongodb.vault.authSource` identifies the authentication database. `mongodb.database` selects the application database.

The MongoDB bootstrap administrator creates a dedicated Vault account with user management actions in `admin` and permission to grant roles on `waltid-enterprise`. The Enterprise Vault token can read only its selected database credential endpoint. The static check uses a separate operator token to force password rotation. The dynamic demo's Vault audit mount records generated usernames to correlate with MongoDB connection logs and keeps passwords HMAC-protected.

The API reads its Vault token from a file on every Vault request. Deployed instances rely on infrastructure for Vault authentication and token refresh and use HTTPS to reach Vault. Superseded clients can drain operations and sessions until the earlier of `maxDrainSeconds` (default 30) and dynamic lease expiry. At that deadline active subscriptions fail and the old client closes. Dynamic expiry makes `/readyz` return 503 until validated credentials replace it, while `/livez` remains independent of Vault. Early token or lease revocation can interrupt database work before the local lease deadline and is not immediately reflected in readiness. The demo uses a single local MongoDB member, Vault development mode and development licensing.
