# Production Security Runbook

## Required Render configuration

Set these values in the Render service and never commit them:

| Variable | Requirement |
| --- | --- |
| `SPRING_PROFILES_ACTIVE` | `prod` |
| `DATABASE_URL` | Internal JDBC URL beginning with `jdbc:postgresql://` |
| `DATABASE_USERNAME` | Least-privileged application/migration role |
| `DATABASE_PASSWORD` | Database password |
| `APP_ALLOWED_ORIGINS` | Exact HTTPS browser origins, comma-separated; no wildcard |
| `JWT_SECRET` | Random value of at least 32 bytes |
| `MFA_ENCRYPTION_KEY` | Independent random value of at least 32 bytes |
| `JWT_ISSUER` | Stable production issuer, for example `pryzm-api` |
| `JWT_AUDIENCE` | Stable browser-client audience, for example `pryzm-web` |
| `PORT` | Supplied by Render; defaults to `8080` |

`REDIS_URL` remains optional while `app.rate-limit.enabled=false`. Mail and news credentials are optional while their integrations are disabled.

## Before the first Flyway deployment

1. Disable writes or place the service in maintenance mode.
2. Take a Render PostgreSQL backup and verify its timestamp and retention.
3. Restore that backup into an isolated PostgreSQL instance with no production network access.
4. Run these duplicate checks. Each query must return zero rows:

   - `select lower(trim(username)), count(*) from users group by 1 having count(*) > 1;`
   - `select lower(trim(email)), count(*) from users group by 1 having count(*) > 1;`
   - `select id from users where username is null or trim(username) = '' or email is null or trim(email) = '';`

5. Start the candidate image against the sanitized restore with the production profile. Flyway baselines the pre-existing schema at version `0`, runs migration `V1`, and Hibernate then validates the result.
6. Verify `flyway_schema_history` contains a successful version `1`, application startup succeeds, and audit rows cannot be updated or deleted.
7. Resolve duplicate or missing identity values through an approved data-repair script and repeat the rehearsal. Never delete or merge accounts automatically.

Do not deploy `V1` directly to the only copy of production data. A fresh empty database is not bootstrapped by this migration; it upgrades the existing Hibernate-created schema.

## Deployment and rollback

1. Record the current image digest, database backup identifier, and migration checksum.
2. Deploy with one instance first and inspect Flyway and Hibernate validation logs.
3. Exercise CSRF login, a non-financial authenticated read, and an administrator-disabled login check before restoring traffic.
4. If migration or validation fails, stop the new service. Do not edit `flyway_schema_history`.
5. Restore the pre-migration backup to a new database, point the previous image at it, verify balances and recent ledger entries, then restore traffic.

There is intentionally no automatic down migration. Restoring the reviewed backup is the rollback path because identity constraints and append-only audit controls must not be partially removed in place.

## Key rotation and revocation

### JWT incident response

- Disable one account and revoke all of its existing JWTs:
  `update users set account_enabled = false, token_version = token_version + 1 where id = ?;`
- Revoke one account without disabling it:
  `update users set token_version = token_version + 1 where id = ?;`
- Revoke every JWT by replacing `JWT_SECRET` and restarting every instance. Existing cookies then fail signature validation.
- Preserve relevant audit records and request IDs before broader remediation.

### MFA encryption-key rotation

MFA secrets cannot be decrypted after replacing `MFA_ENCRYPTION_KEY`. Enter maintenance mode, disable administrator access, remove existing administrator MFA credentials through an approved database change, rotate the key, and require every administrator to enroll again through the controlled enrollment flow before re-enabling access. Never log or export plaintext TOTP secrets.

## Operational checks

- Confirm cookies are host-only, `Secure`, `HttpOnly`, and `SameSite=Lax`.
- Confirm responses hide exception messages and stack traces.
- Confirm `spring.jpa.hibernate.ddl-auto=validate` and Flyway are active in production.
- Confirm the container runs as UID/GID `10001`, writes temporary files only under `/tmp`, and passes its health check.
- Generate a CycloneDX SBOM and run Maven and container vulnerability scans in CI before deployment. CI configuration belongs in the hosting repository and is not present here.
- Rehearse backup restoration, migration, rollback, JWT revocation, MFA re-enrollment, and administrator lockout recovery before opening production traffic.
