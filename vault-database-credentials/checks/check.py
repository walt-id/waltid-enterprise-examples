#!/usr/bin/env python3
"""Run the authenticated Compose checks and challenge a live Enterprise credential rollover."""

import argparse
import concurrent.futures
import contextlib
import datetime
import http.client
import json
import os
from pathlib import Path
import re
import secrets
import signal
import socket
import subprocess
import tempfile
import threading
import time
import urllib.parse


HERE = Path(__file__).resolve().parent
DEMO_NAMES = {"postgres": "PostgreSQL", "mongodb": "MongoDB"}
API_SERVICES = {"api": 0, "api-peer": 1}
DATABASE_CONFIG = "/demo/config/database.conf"
DEMO_LICENSE_STATE_KEY = "waltid-local-development-license-state-key"


def available_ports(count):
    with contextlib.ExitStack() as stack:
        sockets = [stack.enter_context(socket.socket()) for _ in range(count)]
        for sock in sockets:
            sock.bind(("127.0.0.1", 0))
        return [sock.getsockname()[1] for sock in sockets]


def await_condition(description, predicate, timeout=90):
    deadline = time.monotonic() + timeout
    while not predicate():
        if time.monotonic() >= deadline:
            raise RuntimeError(f"Timed out waiting for {description}")
        time.sleep(1)


def utc_now():
    return datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="microseconds")


def enterprise_paths():
    value = os.environ.get("ENTERPRISE_SOURCE_DIR", "")
    if not value or not Path(value).is_absolute():
        raise RuntimeError("Set ENTERPRISE_SOURCE_DIR to the absolute path of your private Enterprise source checkout")
    source = Path(value)
    required = (
        "waltid-enterprise-api/config/auth.conf",
        "dev-license/development.waltlicense",
        "dev-license/holder-key.json",
        "dev-license/issuer-public.jwk",
        "dev-license/network-fetch-guard.conf",
    )
    if not all((source / file).is_file() for file in required):
        raise RuntimeError("ENTERPRISE_SOURCE_DIR must provide the Enterprise API configuration and development license")
    dist = Path(os.environ.get(
        "ENTERPRISE_DIST_DIR",
        str(source / "waltid-enterprise-api-development/build/install/waltid-enterprise-api-development"),
    ))
    if not dist.is_absolute() or not (dist / "bin/waltid-enterprise-api-development").is_file():
        raise RuntimeError("Build the development distribution or set ENTERPRISE_DIST_DIR to its absolute path")
    return source.resolve(), dist.resolve()


def vault_time(value):
    # Vault emits UTC with up to nanosecond precision, while Python keeps microseconds.
    seconds, point, digits = value.removesuffix("Z").partition(".")
    fraction = point + digits[:6].ljust(6, "0") if point else ""
    return datetime.datetime.fromisoformat(seconds + fraction + "+00:00")


class ComposeStack:
    def __init__(self, backend, mode, state, source, dist):
        self.backend = backend
        self.database = DEMO_NAMES[backend]
        self.mode = mode
        self.directory = HERE.parent / f"{backend}-vault"
        self.state = state
        api, peer, db, vault, metrics, peer_metrics = available_ports(6)
        self.ports = (api, peer)
        self.metrics_ports = (metrics, peer_metrics)
        base = self.directory / "compose.yaml"
        self.env = {
            **os.environ,
            "COMPOSE_FILE": os.pathsep.join((str(base), str(HERE / "compose.peer.yaml"))),
            "COMPOSE_PROJECT_NAME": f"vault-check-{backend}-{mode}-{secrets.token_hex(5)}",
            "ENTERPRISE_SOURCE_DIR": str(source),
            "ENTERPRISE_DIST_DIR": str(dist),
            "DEMO_MODE": mode,
            "DEMO_STATE_DIR": str(state),
            "DEMO_BASE_COMPOSE": str(base),
            "DEMO_API_PORT": str(api),
            "DEMO_PEER_API_PORT": str(peer),
            "DEMO_POSTGRES_PORT": str(db),
            "DEMO_MONGO_PORT": str(db),
            "DEMO_VAULT_PORT": str(vault),
            "DEMO_METRICS_PORT": str(metrics),
            "DEMO_PEER_METRICS_PORT": str(peer_metrics),
        }
        self.admin_token = None

    def command(self, *arguments, input_text=None, show=False, timeout=180):
        result = subprocess.run(
            arguments,
            cwd=self.directory,
            env=self.env,
            input=input_text,
            stdin=subprocess.DEVNULL if input_text is None else None,
            text=True,
            stdout=None if show else subprocess.PIPE,
            stderr=None if show else subprocess.PIPE,
            timeout=timeout,
            check=False,
        )
        if result.returncode:
            # The supplied command can read secrets, so do not include its raw stdout or stderr.
            label = arguments[2] if arguments[:2] == ("docker", "compose") else arguments[0]
            raise RuntimeError(f"{label} failed (exit {result.returncode})")
        return result.stdout if not show else ""

    def compose(self, *arguments, **options):
        return self.command("docker", "compose", *arguments, **options)

    def request(self, replica, path, *, payload=None, authenticated=False):
        headers = {"Host": f"enterprise.localhost:{self.ports[replica]}"}
        if authenticated:
            headers["Authorization"] = f"Bearer {self.admin_token}"
        body = None
        if payload is not None:
            headers["Content-Type"] = "application/json"
            body = json.dumps(payload)
        connection = http.client.HTTPConnection("127.0.0.1", self.ports[replica], timeout=8)
        try:
            connection.request("GET" if payload is None else "POST", path, body, headers)
            response = connection.getresponse()
            return response.status, response.read()
        except (OSError, http.client.HTTPException):
            return 0, b""
        finally:
            connection.close()

    def ready(self, expected=200):
        return all(self.request(replica, "/readyz")[0] == expected for replica in API_SERVICES.values())

    def vault_metrics(self, replica):
        connection = http.client.HTTPConnection("127.0.0.1", self.metrics_ports[replica], timeout=3)
        values = {}
        try:
            connection.request("GET", "/metrics")
            response = connection.getresponse()
            if response.status != 200:
                return values
            for line in response.read().decode().splitlines():
                sample = re.fullmatch(r'(database_vault_[a-z_]+)\{([^}]+)\}\s+([0-9.eE+-]+)', line)
                if sample:
                    metric, labels, value = sample.groups()
                    if metric == "database_vault_failures_total" and 'reason="VAULT_AUTHORIZATION"' in labels:
                        values["authorization_failures"] = float(value)
                    elif metric == "database_vault_lease_remaining_seconds":
                        values["lease_remaining"] = float(value)
        except (OSError, http.client.HTTPException):
            return {}
        finally:
            connection.close()
        return values

    def login(self):
        password = (self.state / "admin-password").read_text().strip()
        status, body = self.request(
            0, "/auth/account/emailpass", payload={"email": "demo-admin@example.test", "password": password}
        )
        require(status == 200, f"Superadmin login returned HTTP {status}")
        self.admin_token = json.loads(body)["token"]
        require(bool(self.admin_token), "Superadmin login omitted its API token")

    def process_ids(self):
        processes = []
        for service in API_SERVICES:
            container = self.compose("ps", "-q", service).strip()
            require(bool(container), f"{service} did not have a running container")
            processes.append(self.command(
                "docker", "inspect", "--format",
                "{{.Id}} {{.State.Pid}} {{.State.StartedAt}} {{.RestartCount}}", container,
            ))
        return processes

    def logs_count(self, service, since, event):
        logs = self.compose("logs", "--since", since, "--no-color", "--no-log-prefix", service)
        return logs.count(event)

    @property
    def rotation_event(self):
        return f"Rotated {self.database} credentials from Vault ({self.mode.upper()})"

    def wait_rotations(self, since, count):
        await_condition(
            f"{count} rotations on each API",
            lambda: all(self.logs_count(service, since, self.rotation_event) >= count for service in API_SERVICES),
            timeout=110,
        )

    def force_static_rotation(self):
        self.compose(
            "exec", "-T", "vault", "sh", "-eu", "-c",
            'VAULT_TOKEN="$(cat /run/vault-operator/token)"; export VAULT_TOKEN; '
            'vault write -f database/rotate-role/waltid-static >/dev/null',
        )

    def get_org(self, replica, identifier):
        status, body = self.request(replica, f"/v1/admin/organizations/{identifier}", authenticated=True)
        require(status == 200, f"Replica {replica + 1} organization read returned HTTP {status}")
        record = json.loads(body)
        require(
            record.get("_id") == identifier and record.get("profile", {}).get("name") == identifier,
            "Organization read returned unexpected data",
        )

    def cross_write(self, replica):
        identifier = f"vault-ci-{secrets.token_hex(6)}"
        status, _ = self.request(
            replica,
            "/v1/admin/organizations",
            payload={"_id": identifier, "profile": {"name": identifier}},
            authenticated=True,
        )
        require(status == 201, f"Replica {replica + 1} organization write returned HTTP {status}")
        self.get_org(1 - replica, identifier)
        return identifier

    def token_file(self, valid):
        # Rotate the shared token file atomically. Keep the previous Vault token and its leases intact.
        token_command = (
            'VAULT_TOKEN="$(cat /run/secrets/vault-root-token)"; export VAULT_TOKEN; '
            'vault token create -field=token -no-default-policy -policy=enterprise-db -ttl=4h >"$next"'
            if valid else 'printf "%s\\n" "invalid-local-demo-token" >"$next"'
        )
        self.compose(
            "run", "--rm", "--no-deps", "--entrypoint", "sh", "vault-init", "-eu", "-c",
            'umask 077; next="$(mktemp /run/vault/app-token.XXXXXX)"; '
            'trap \'rm -f "$next"\' EXIT; ' + token_command + '; mv "$next" /run/vault/app-token',
        )

    def vault_admin(self, operation):
        return self.compose(
            "run", "--rm", "--no-deps", "--entrypoint", "sh", "vault-init", "-eu", "-c",
            'VAULT_TOKEN="$(cat /run/secrets/vault-root-token)"; export VAULT_TOKEN; ' + operation,
        )

    def dynamic_users(self):
        if self.backend == "postgres":
            users = self.compose(
                "exec", "-T", "postgres", "psql", "-X", "-At", "-v", "ON_ERROR_STOP=1",
                "-U", "postgres", "-d", "waltid_enterprise",
                "-c", "SELECT rolname FROM pg_roles WHERE rolname LIKE 'v-%'",
            )
            return set(users.splitlines())
        users = self.compose(
            "exec", "-T", "-e", "DEMO_MONGO_ACTION=list-vault-users", "mongo",
            "mongosh", "--quiet", "--nodb", "--file", "/demo/mongo-tools.js",
        )
        return set(json.loads(users))

    def dynamic_issuances(self):
        audit_name = "postgres" if self.backend == "postgres" else "mongo"
        lines = self.compose("exec", "-T", "vault", "cat", f"/tmp/{audit_name}-demo-audit.jsonl")
        issued = {}
        for line in lines.splitlines():
            record = json.loads(line)
            if record["type"] == "response" and record["request"]["path"] == "database/creds/waltid-dynamic":
                username = ((record.get("response") or {}).get("data") or {}).get("username")
                if username:
                    issued[username] = vault_time(record["time"])
        return issued

    def backup_status(self):
        return self.compose("ps", "-a", "--format", "table {{.Service}}\t{{.Status}}")

    def cleanup(self):
        # A signal can arrive after Docker pauses Vault but before the pause command returns.
        with contextlib.suppress(RuntimeError, subprocess.TimeoutExpired):
            self.compose("unpause", "vault", timeout=20)
        self.compose("down", "--volumes", "--remove-orphans", timeout=120)


def require(condition, description):
    if not condition:
        raise RuntimeError(description)


def steady_traffic(stack, rotations=2, minimum_writes=10):
    stop = threading.Event()
    started = [threading.Event(), threading.Event()]
    minimum = [threading.Event(), threading.Event()]

    def worker(replica):
        writes = 0
        while not stop.is_set():
            stack.cross_write(replica)
            writes += 1
            started[replica].set()
            if writes >= minimum_writes:
                minimum[replica].set()
            stop.wait(1)
        return writes

    with concurrent.futures.ThreadPoolExecutor(max_workers=2) as workers:
        pending = [workers.submit(worker, replica) for replica in API_SERVICES.values()]

        def workers_healthy():
            for future in pending:
                if future.done():
                    future.result()
            return True

        try:
            await_condition("traffic from both replicas", lambda: workers_healthy() and all(e.is_set() for e in started))
            since = utc_now()
            for target in range(1, rotations + 1):
                if stack.mode == "static":
                    stack.force_static_rotation()
                await_condition(
                    f"rotation {target} under concurrent traffic",
                    lambda: workers_healthy() and all(
                        stack.logs_count(service, since, stack.rotation_event) >= target for service in API_SERVICES
                    ),
                    timeout=95,
                )
            await_condition(
                "minimum verified writes from both replicas",
                lambda: workers_healthy() and all(e.is_set() for e in minimum),
                timeout=30,
            )
        finally:
            stop.set()

    counts = [future.result() for future in pending]
    return counts


def bad_token_recovery(stack):
    lifetime = None
    if stack.mode == "dynamic":
        lifetime = int(stack.vault_admin("vault read -field=default_ttl database/roles/waltid-dynamic").strip())
    snapshots = {}

    def fresh_credential_barrier():
        snapshots.clear()
        for replica in API_SERVICES.values():
            metrics = stack.vault_metrics(replica)
            if "authorization_failures" not in metrics:
                return False
            if lifetime and metrics.get("lease_remaining", 0) <= lifetime * 0.7:
                return False
            snapshots[replica] = metrics
        return True

    await_condition("fresh measured credentials on both replicas", fresh_credential_barrier, timeout=95)
    baseline = {replica: metrics["authorization_failures"] for replica, metrics in snapshots.items()}
    stack.token_file(valid=False)
    try:
        checked = set()
        remaining = {}

        def authorization_observed():
            for replica in API_SERVICES.values():
                if replica in checked:
                    continue
                metrics = stack.vault_metrics(replica)
                if metrics.get("authorization_failures", 0) <= baseline[replica]:
                    continue
                seconds = metrics.get("lease_remaining")
                require(not lifetime or seconds is not None and seconds > 0,
                        "The credential lease expired before authorization was observed")
                status, _ = stack.request(replica, "/readyz")
                after = stack.vault_metrics(replica).get("lease_remaining")
                require(not lifetime or after is not None and after > 0,
                        "The credential lease expired or its metric was unavailable during the readiness check")
                require(status == 200, f"Replica {replica + 1} became unready with {after} lease seconds remaining")
                stack.cross_write(replica)
                remaining[replica] = after
                checked.add(replica)
            return len(checked) == len(API_SERVICES)

        await_condition("measured authorization failures while credentials remain valid", authorization_observed, timeout=75)
        if lifetime:
            print(
                f"{stack.backend}/{stack.mode} authorization failures observed with "
                f"{remaining[0]:.0f}/{remaining[1]:.0f} lease seconds remaining",
                flush=True,
            )
    finally:
        since = utc_now()
        stack.token_file(valid=True)

    if stack.mode == "static":
        stack.force_static_rotation()
    stack.wait_rotations(since, 1)
    require(stack.ready(), "The API did not stay ready after the replacement Vault token")
    stack.cross_write(0)
    stack.cross_write(1)


def expired_lease_recovery(stack):
    original = stack.cross_write(0)
    since = utc_now()
    stack.compose("pause", "vault")
    try:
        await_condition("both live replicas to report expired credentials", lambda: stack.ready(503))
        for replica in API_SERVICES.values():
            require(stack.request(replica, "/livez")[0] == 200, "Vault outage affected API liveness")
            status, _ = stack.request(replica, f"/v1/admin/organizations/{original}", authenticated=True)
            require(500 <= status < 600, f"Expired credentials allowed a database read (HTTP {status})")
        for service in API_SERVICES:
            require(
                any(stack.logs_count(service, since, f"{stack.database} Vault credential attempt failed ({category})")
                    for category in ("VAULT_UNAVAILABLE", "VAULT_REQUEST_TIMEOUT")),
                "No Vault connectivity failure was reported before credentials expired",
            )
    finally:
        stack.compose("unpause", "vault")

    await_condition("readiness to recover on both replicas", stack.ready)
    for replica in API_SERVICES.values():
        stack.get_org(replica, original)
        stack.cross_write(replica)


def early_token_revocation(stack):
    lifetime = int(stack.vault_admin("vault read -field=default_ttl database/roles/waltid-dynamic").strip())
    since = utc_now()
    stack.wait_rotations(since, 1)
    newest = datetime.datetime.fromisoformat(since)
    issued = {}

    def recent_users_observed():
        current = stack.dynamic_users()
        now = datetime.datetime.now(datetime.timezone.utc)
        issued.clear()
        for user, timestamp in stack.dynamic_issuances().items():
            expiration = timestamp + datetime.timedelta(seconds=lifetime)
            if user in current and timestamp >= newest and (expiration - now).total_seconds() > 10:
                issued[user] = expiration
        return len(issued) >= len(API_SERVICES)

    await_condition("recent Vault users for both replicas", recent_users_observed, timeout=50)
    earliest_expiry = min(issued.values())
    since = utc_now()
    try:
        stack.vault_admin('vault token revoke "$(cat /run/vault/app-token)" >/dev/null')
        await_condition(
            "Vault to remove the issued database users",
            lambda: issued.keys().isdisjoint(stack.dynamic_users()),
            timeout=20,
        )
        require(datetime.datetime.now(datetime.timezone.utc) < earliest_expiry, "Users disappeared only at lease expiry")
        authorization = f"{stack.database} Vault credential attempt failed (VAULT_AUTHORIZATION)"
        await_condition(
            "authorization failures for the revoked token on both replicas",
            lambda: all(stack.logs_count(service, since, authorization) for service in API_SERVICES),
            timeout=75,
        )
    finally:
        since = utc_now()
        stack.token_file(valid=True)

    stack.wait_rotations(since, 1)
    await_condition("both replicas to recover after token revocation", stack.ready)
    stack.cross_write(0)
    stack.cross_write(1)
    return len(issued)


def license_request(stack, config):
    # Use the production entry point on the installed classpath. Capture the public request locally,
    # validate its shape, and keep the signed payload out of command output and uploaded evidence.
    command = (
        'set -eu; umask 077; work="$(mktemp -d)"; '
        'trap \'rm -rf "$work"\' EXIT; request="$work/request.json"; direct="$work/direct.conf"; '
        f'config="{DATABASE_CONFIG}"; '
        'if [ "$1" = direct ]; then cat >"$direct"; config="$direct"; fi; '
        'java -Dconfig.file.database="$config" '
        '-Dconfig.file.license=/demo/waltid-enterprise-api/config/license.conf '
        '-cp "/opt/enterprise/lib/*" id.walt.enterprise.MainKt license request '
        'local-vault-test local-vault-test --output "$request" >/dev/null; cat "$request"'
    )
    raw = stack.compose(
        "run", "-T", "--rm", "--no-deps", "--entrypoint", "sh",
        "-e", f"LICENSE_STATE_ENCRYPTION_KEY={DEMO_LICENSE_STATE_KEY}", "api", "-c", command,
        "demo-cli", "direct" if config else "vault",
        input_text=json.dumps(config) if config else None,
    )
    signed = json.loads(raw)
    request = signed["request"]
    require(
        request["licenseId"] == "local-vault-test" and request["organizationId"] == "local-vault-test"
        and bool(request["publicKeyJwk"]) and signed["proof"].count(".") == 2,
        "Enterprise CLI did not return an installation request for the synthetic IDs",
    )
    return request["installationId"], request["publicKeyJwk"]


def verify_cli(stack):
    password = stack.compose(
        "exec", "-T", "vault", "sh", "-eu", "-c",
        'VAULT_TOKEN="$(cat /run/vault-operator/token)"; export VAULT_TOKEN; '
        'vault read -field=password database/static-creds/waltid-static',
    ).strip()
    require(bool(password), "Vault did not return a password for the CLI direct-credential control")
    if stack.backend == "postgres":
        direct = {"databaseType": "postgresql", "postgresql": {
            "connectionString": "jdbc:postgresql://postgres:5432/waltid_enterprise", "schema": "waltid",
            "username": "waltid_static", "password": password,
        }}
    else:
        uri_password = urllib.parse.quote(password, safe="")
        direct = {"databaseType": "mongodb", "mongodb": {
            "connectionString": f"mongodb://waltid_static:{uri_password}@mongo:27017/admin?replicaSet=rs0",
            "database": "waltid-enterprise", "profile": "MONGODB_8",
        }}

    require(
        license_request(stack, direct) == license_request(stack, None),
        "Direct and Vault CLI requests did not reuse the stored installation key",
    )


def run_case(backend, mode, evidence, source, dist):
    state_root = HERE / "artifacts"
    state_root.mkdir(exist_ok=True)
    with tempfile.TemporaryDirectory(prefix=f"vault-{backend}-{mode}-", dir=state_root) as state:
        stack = ComposeStack(backend, mode, Path(state), source, dist)
        phase = "bootstrap"
        failed = True

        def passed(detail=""):
            print(f"{backend}/{mode} {phase}: PASS" + (f" ({detail})" if detail else ""), flush=True)
            with evidence.open("a", encoding="utf-8") as report:
                print(backend, mode, phase, "PASS", detail, sep="\t", file=report)

        try:
            stack.command("./demo.sh", mode, "prepare")
            features = stack.state / "dev-license/_features.conf"
            features.write_text(features.read_text().replace("    admin\n", "    admin\n    prometheus\n"))
            if mode == "static":
                phase = "cli"
                stack.compose("up", "-d", "vault-init", show=True)
                stack.compose("wait", "vault-init")
                verify_cli(stack)
                passed("direct and Vault installation requests reused the same key")

            phase = "single-replica"
            stack.compose("up", "-d", "api", show=True)
            stack.command("./demo.sh", mode, "check", show=True, timeout=360)
            passed()

            phase = "two-replica-rotation"
            stack.compose("up", "-d", "api-peer", show=True)
            await_condition("both Enterprise API replicas to be ready", stack.ready, timeout=150)
            process_ids = stack.process_ids()
            stack.login()
            writes = steady_traffic(stack)
            passed(f"two rotations per replica, cross-verified writes {writes[0]}/{writes[1]}")

            phase = "token-file-recovery"
            bad_token_recovery(stack)
            passed("unauthorized refresh observed while ready, then rotated using a replacement token")

            if mode == "dynamic":
                phase = "vault-outage"
                expired_lease_recovery(stack)
                passed("both live replicas refused expired credentials, then recovered")

                phase = "early-token-revocation"
                revoked = early_token_revocation(stack)
                passed(f"{revoked} database users removed before expiry; both APIs recovered")

            phase = "continuity"
            require(process_ids == stack.process_ids(), "Enterprise API container or process restarted")
            passed("same replicas and process identities")
            failed = False
        except (RuntimeError, subprocess.TimeoutExpired, ValueError, KeyError) as error:
            with evidence.open("a", encoding="utf-8") as report:
                print(backend, mode, phase, "FAIL", type(error).__name__, sep="\t", file=report)
            # Only the controlled RuntimeError messages are safe to display; no raw payloads.
            detail = str(error) if isinstance(error, RuntimeError) else type(error).__name__
            print(f"{backend}/{mode} {phase}: FAIL ({detail})", flush=True)
            with contextlib.suppress(RuntimeError, subprocess.TimeoutExpired):
                print(stack.backup_status(), flush=True)
        finally:
            phase = "cleanup"
            try:
                stack.cleanup()
            except (RuntimeError, subprocess.TimeoutExpired):
                print(f"{backend}/{mode} cleanup failed for {stack.env['COMPOSE_PROJECT_NAME']}", flush=True)
                with evidence.open("a", encoding="utf-8") as report:
                    print(backend, mode, phase, "FAIL", "Compose teardown failed", sep="\t", file=report)
                failed = True
            else:
                passed()
        return not failed


def stop_run(signum, frame):
    raise KeyboardInterrupt


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--backend", choices=tuple(DEMO_NAMES), action="append", help="Default is both databases")
    parser.add_argument("--mode", choices=("static", "dynamic"), action="append", help="Default is both role modes")
    parser.add_argument("--evidence", type=Path, default=HERE / "artifacts" / "results.tsv")
    args = parser.parse_args()
    try:
        source, dist = enterprise_paths()
    except RuntimeError as error:
        parser.error(str(error))
    args.evidence.parent.mkdir(exist_ok=True, parents=True)
    args.evidence.write_text("database\trole\tphase\tresult\tdetail\n", encoding="utf-8")
    signal.signal(signal.SIGTERM, stop_run)
    results = [
        run_case(backend, mode, args.evidence, source, dist)
        for backend in args.backend or DEMO_NAMES
        for mode in args.mode or ("static", "dynamic")
    ]
    return 0 if all(results) else 1


if __name__ == "__main__":
    raise SystemExit(main())
