# Production Security Runbook

## Required Render configuration

Set these values in the Render service and never commit them:

| Variable | Requirement |
| --- | --- |
| `SPRING_PROFILES_ACTIVE` | `prod` |
| `DATABASE_URL` | Internal JDBC URL beginning with `jdbc:postgresql://` |
| `DATABASE_RUNTIME_USERNAME` | Least-privileged application role; must own no schema objects |
| `DATABASE_RUNTIME_PASSWORD` | Independent runtime-role password |
| `DATABASE_MIGRATION_USERNAME` | Schema-owning role used only by Flyway at startup |
| `DATABASE_MIGRATION_PASSWORD` | Independent migration-role password |
| `APP_ALLOWED_ORIGINS` | Exact HTTPS browser origins, comma-separated; no wildcard |
| `JWT_SECRET` | Random value of at least 32 bytes |
| `MFA_ENCRYPTION_KEY` | Independent random value of at least 32 bytes |
| `JWT_ISSUER` | Stable production issuer, for example `pryzm-api` |
| `JWT_AUDIENCE` | Stable browser-client audience, for example `pryzm-web` |
| `PORT` | Supplied by Render; defaults to `8080` |
| `SIGNUP_BONUS_ENABLED` | Keep `false` unless granting transferable signup credit is explicitly approved |
| `SIGNUP_BONUS_CENTS` | Positive amount no greater than `1000000`; ignored while the bonus is disabled |

`REDIS_URL` is required because production rate limiting is enabled and login and financial
operations fail closed when Redis is unavailable. Mail and news credentials are optional while
their integrations are disabled.

## Before the first Flyway deployment

1. Disable writes or place the service in maintenance mode.
2. Take a Render PostgreSQL backup and verify its timestamp and retention.
3. Restore that backup into an isolated PostgreSQL instance with no production network access.
4. Inventory every row where `account_enabled=false`. Confirm that V2 may replace its
  username, email, and password, clear its roles and MFA credential, increment its token
  version, and retain its durable user ID and financial history.
5. Run these duplicate checks. Each query must return zero rows:

   - `select lower(trim(username)), count(*) from users group by 1 having count(*) > 1;`
   - `select lower(trim(email)), count(*) from users group by 1 having count(*) > 1;`
   - `select id from users where username is null or trim(username) = '' or email is null or trim(email) = '';`

6. Record row counts for users, wallets, wallet ledger entries, trades, positions, fund
  requests, and audit events.
7. Provision distinct migration-owner and runtime LOGIN roles with independent credentials.
  Neither role may be `SUPERUSER`, `CREATEDB`, `CREATEROLE`, or `BYPASSRLS`; the runtime role
  must own no schemas, tables, sequences, functions, or triggers.
8. Transfer ownership of the public application schema, its tables and sequences, and its
  trigger functions to the migration role. Do this before V4; V4 intentionally fails if the
  migration connection does not own those objects.
9. Start the candidate image against the sanitized restore with the production profile.
  Hikari must connect with `DATABASE_RUNTIME_USERNAME`, while Flyway connects separately with
  `DATABASE_MIGRATION_USERNAME`. Flyway baselines at version `0`, runs V1 through V4, and
  Hibernate then validates the schema through the runtime connection.
10. Verify `flyway_schema_history` contains successful versions `1` through `4`,
  `users_deactivation_state_ck`, financial checks, deletion guards, immutable-history guards,
  and all `*_no_truncate` triggers exist.
11. Reconcile every recorded row count. Verify legacy disabled users are tombstoned and have
  no roles or MFA credential, while their financial and audit records remain linked to the
  same user IDs.
12. Resolve duplicate or missing identity values through an approved data-repair script and
   repeat the rehearsal. Never delete or merge accounts automatically.

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

- Deactivate one account and revoke all of its existing JWTs through the administrator
  `DELETE /api/v1/users/{userId}` operation. Do not bypass the lifecycle service with a
  direct `account_enabled` update because V2 requires matching deactivation metadata.
- Revoke one account without disabling it:
  `update users set token_version = token_version + 1 where id = ?;`
- Revoke every JWT by replacing `JWT_SECRET` and restarting every instance. Existing cookies then fail signature validation.
- Preserve relevant audit records and request IDs before broader remediation.

### MFA encryption-key rotation

MFA secrets cannot be decrypted after replacing `MFA_ENCRYPTION_KEY`. Enter maintenance mode, disable administrator access, remove existing administrator MFA credentials through an approved database change, rotate the key, and require every administrator to enroll again through the controlled enrollment flow before re-enabling access. Never log or export plaintext TOTP secrets.

## Operational checks

- Confirm cookies are host-only, `Secure`, `HttpOnly`, and `SameSite=Lax`.
- Confirm a signup with `SIGNUP_BONUS_ENABLED` absent or `false` creates a zero-balance wallet and no signup-bonus ledger entry.
- Treat bonus activation as a reviewed deployment: record the approver, configured amount, deployment time, and abuse-monitoring plan, then set `SIGNUP_BONUS_ENABLED=true` and redeploy.
- After activation, confirm one disposable signup receives exactly one `SIGNUP_BONUS` ledger credit for `SIGNUP_BONUS_CENTS`, including after an idempotent retry.
- Roll back by setting `SIGNUP_BONUS_ENABLED=false` and redeploying. Disabling the switch prevents future credits but does not reverse existing credits.
- Confirm responses hide exception messages and stack traces.
- Confirm `spring.jpa.hibernate.ddl-auto=validate` and Flyway are active in production.
- Confirm administrator deactivation returns `204 No Content` but retains the user row,
  wallet, wallet ledger, trades, positions, fund requests, and audit history.
- Confirm the deactivated username and email use the deterministic ID-based tombstone,
  roles and MFA credentials are removed, and an otherwise valid old JWT receives `401`.
- Confirm self-deactivation and attempted deactivation of the final enabled administrator
  each return `409 Conflict`.
- Confirm repeat deactivation requests return `204 No Content` without creating another
  lifecycle audit event.
- Confirm administrator-created accounts reject any role other than `ROLE_USER` and
  `ROLE_ADMIN`. Creating an account with `ROLE_ADMIN` must require a current valid TOTP from
  the acting administrator and emit `USER_CREATE_ADMIN` without recording identity or MFA data.
- Confirm direct `DELETE FROM users` is rejected by `users_no_delete` and leaves related
  records intact. Account reactivation is not supported; use backup restoration and an
  approved repair procedure for administrative recovery rather than editing tombstones.
- Connect using the runtime role and confirm required application DML and identity-sequence
  access work, but `CREATE TABLE`, `ALTER TABLE`, `DROP TABLE`, trigger creation/removal, and
  `TRUNCATE` are denied. Confirm the runtime role owns no application object and has no elevated
  PostgreSQL role attributes.
- Connect using the migration role on a restored backup and confirm `TRUNCATE` of users,
  wallets, wallet transactions, fund requests, trades, positions, and audit events is rejected
  by the statement-level history guards.
- Confirm the container runs as UID/GID `10001`, writes temporary files only under `/tmp`, and passes its health check.
- Generate a CycloneDX SBOM and run Maven and container vulnerability scans in CI before deployment. CI configuration belongs in the hosting repository and is not present here.
- Rehearse backup restoration, migration, rollback, JWT revocation, MFA re-enrollment, and administrator lockout recovery before opening production traffic.
