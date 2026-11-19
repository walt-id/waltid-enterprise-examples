# MongoDB credentials from Vault

This Compose configuration connects the Enterprise API to an authenticated MongoDB
8.0 replica set using Vault's MongoDB database plugin. Follow the
[local setup](../README.md#local-setup) to build the development distribution and
export `ENTERPRISE_SOURCE_DIR`.

From the examples repository root:

~~~bash
export DEMO_MODE=dynamic
./vault-database-credentials/prepare.sh mongodb "$DEMO_MODE"
cd vault-database-credentials/mongodb-vault
docker compose up -d
~~~

Select `DEMO_MODE=static` to use the existing `waltid_static` MongoDB account with
a Vault-managed password. The static password rotates hourly and the API polls
Vault every two seconds. The dynamic configuration issues users with 50-second
leases. The API obtains replacement credentials before expiry.

The default loopback ports are `17503` for the API, `27029` for MongoDB and
`18203` for Vault. Override `DEMO_API_PORT`, `DEMO_MONGO_PORT` and
`DEMO_VAULT_PORT` when another configuration uses those ports. The replica set
advertises `mongo:27017` inside Compose. The API shares Vault's network namespace
to access Vault over loopback HTTP.

Run `docker compose down --volumes` from the same directory to remove the local
containers and database volumes.

## Database and Vault setup

`init-mongo.js` initializes the replica set and creates the Vault user-management
account. The static and leased users are stored in `admin` and have `readWrite`
access to `waltid-enterprise`, where the API runs its startup migrations.
`mongodb.vault.authSource` selects the authentication database, while
`mongodb.database` selects the application database.

The API's Vault token can read only its selected database credential endpoint.
The API loads the token file on every Vault request. Deployed instances supply
and refresh that file using their chosen Vault authentication mechanism.

Superseded clients can drain operations and sessions until the earlier of
`maxDrainSeconds` (default 30) and dynamic lease expiry. Active subscriptions fail
and the old client closes at that deadline. Token providers must preserve
overlapping validity until all API replicas have adopted replacement credentials.
