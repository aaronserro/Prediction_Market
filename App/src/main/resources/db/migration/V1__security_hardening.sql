-- Security-hardening migration for the existing PostgreSQL schema.
-- This migration is deliberately fail-fast: identity problems must be resolved
-- from a reviewed backup rather than silently rewritten or deleted.

DO $$
BEGIN
    IF to_regclass('public.users') IS NULL THEN
        RAISE EXCEPTION 'Required existing table public.users is missing';
    END IF;
    IF to_regclass('public.trades') IS NULL THEN
        RAISE EXCEPTION 'Required existing table public.trades is missing';
    END IF;

    IF EXISTS (
        SELECT 1 FROM users
        WHERE username IS NULL OR btrim(username) = ''
    ) THEN
        RAISE EXCEPTION 'Users contain null or blank usernames; repair them before migration';
    END IF;

    IF EXISTS (
        SELECT 1 FROM users
        GROUP BY lower(btrim(username))
        HAVING count(*) > 1
    ) THEN
        RAISE EXCEPTION 'Users contain duplicate normalized usernames; repair them before migration';
    END IF;

    IF EXISTS (
        SELECT 1 FROM users
        WHERE email IS NULL OR btrim(email) = ''
    ) THEN
        RAISE EXCEPTION 'Users contain null or blank emails; repair them before migration';
    END IF;

    IF EXISTS (
        SELECT 1 FROM users
        GROUP BY lower(btrim(email))
        HAVING count(*) > 1
    ) THEN
        RAISE EXCEPTION 'Users contain duplicate normalized emails; repair them before migration';
    END IF;
END
$$;

ALTER TABLE users
    ALTER COLUMN username SET NOT NULL,
    ALTER COLUMN email SET NOT NULL;

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS account_enabled boolean NOT NULL DEFAULT true,
    ADD COLUMN IF NOT EXISTS token_version bigint NOT NULL DEFAULT 0;

CREATE UNIQUE INDEX IF NOT EXISTS users_username_normalized_uq
    ON users ((lower(btrim(username))));

CREATE UNIQUE INDEX IF NOT EXISTS users_email_normalized_uq
    ON users ((lower(btrim(email))));

ALTER TABLE trades
    ADD COLUMN IF NOT EXISTS idempotency_key varchar(128);

CREATE UNIQUE INDEX IF NOT EXISTS trades_idempotency_key_uq
    ON trades (idempotency_key)
    WHERE idempotency_key IS NOT NULL;

CREATE TABLE IF NOT EXISTS admin_mfa_credentials (
    user_id bigint PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    encrypted_secret varchar(1024) NOT NULL,
    enabled boolean NOT NULL DEFAULT false,
    verified_at timestamp with time zone
);

CREATE TABLE IF NOT EXISTS audit_events (
    id uuid PRIMARY KEY,
    occurred_at timestamp with time zone NOT NULL,
    actor_user_id bigint,
    action varchar(64) NOT NULL,
    target_type varchar(64) NOT NULL,
    target_id varchar(128),
    outcome varchar(16) NOT NULL,
    correlation_id varchar(64) NOT NULL
);

CREATE INDEX IF NOT EXISTS audit_events_occurred_at_idx
    ON audit_events (occurred_at DESC);

CREATE INDEX IF NOT EXISTS audit_events_actor_idx
    ON audit_events (actor_user_id, occurred_at DESC);

CREATE OR REPLACE FUNCTION prevent_audit_event_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    RAISE EXCEPTION 'audit_events is append-only';
END;
$$;

DROP TRIGGER IF EXISTS audit_events_append_only ON audit_events;
CREATE TRIGGER audit_events_append_only
BEFORE UPDATE OR DELETE ON audit_events
FOR EACH ROW
EXECUTE FUNCTION prevent_audit_event_mutation();
