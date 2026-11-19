# Live Vault database rotation checks

The manual harness runs PostgreSQL and MongoDB with both static and dynamic
Vault roles. Every case uses an authenticated local database, a scoped Vault token,
its own Compose project and loopback ports.

Follow the [local source prerequisites](../README.md#local-source-prerequisites)
to build the development distribution and set `ENTERPRISE_SOURCE_DIR`.
From the examples checkout, run the checks with Docker Compose v2, Python 3.9+,
Bash, curl, jq and OpenSSL. To select a single case, specify both options.

~~~bash
python3 vault-database-credentials/checks/check.py
python3 vault-database-credentials/checks/check.py --backend mongodb --mode dynamic
~~~

The checks use the same setup and credentials as the standalone [PostgreSQL](../postgres-vault/)
and [MongoDB](../mongodb-vault/) demos. An existing development distribution outside the
default Gradle directory can be selected with `ENTERPRISE_DIST_DIR`. The harness starts
and removes one isolated Compose project at a time. It removes its temporary bootstrap
files, Docker containers and volumes on exit.

Each case verifies:

- **One API replica.** The standalone demonstration proves a fresh database connection
  after rotation, successful Enterprise API reads and writes across the change,
  continued access to persisted records and the same API process.
- **Two API replicas.** Both processes handle organization writes while credentials
  rotate twice. Each write is read on the opposite replica. Every request must succeed
  during this phase and both replicas must reach the minimum write count.
- **Vault token replacement.** Both replicas encounter a refresh authorization error
  after the token file is replaced with an invalid token. The fixture exposes the
  existing credential metrics on separate loopback-only ports. Dynamic cases wait
  for fresh leases on both replicas, compare authorization counters to their
  per-replica baselines and check readiness while measuring that replica's remaining
  lease lifetime. A second file replacement installs a new valid token. The checks
  require both replicas to rotate and serve writes with it.
- **Dynamic credential expiry.** Pausing Vault prevents refresh through expiry.
  Both replicas report HTTP 503 on readiness, refuse database reads and still report
  HTTP 200 on liveness. Resuming Vault restores readiness, persisted reads and new
  writes without restarting either replica.
- **Early token revocation.** In dynamic mode, revoking the active Vault token removes
  its recently issued database users before their lease deadline. Both replicas
  observe Vault authorization errors and resume reads and writes once a new token
  is installed. Readiness follows the locally tracked lease deadline during early
  revocation.
- **Operator CLI.** The static case for each database runs the shipped `license request`
  CLI once with directly configured credentials and once with Vault. Both requests
  must use the same stored installation key. The synthetic requests stay local.

Results default to ignored `checks/artifacts/results.tsv` under this example.
Use `--evidence` to set another path. The TSV contains phase names, pass or fail
status, and counts. The harness removes its temporary credentials and Compose
resources on exit.
