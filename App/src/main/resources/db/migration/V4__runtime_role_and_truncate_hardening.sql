-- Flyway must run as the schema-owning migration role. The application uses
-- the distinct, least-privileged role supplied by the runtimeRole placeholder.

DO $$
DECLARE
    runtime_role_text text := '${runtimeRole}';
    runtime_role_record record;
    foreign_object text;
BEGIN
    IF runtime_role_text IS NULL
            OR btrim(runtime_role_text) = ''
            OR runtime_role_text !~ '^[A-Za-z_][A-Za-z0-9_$-]{0,62}$' THEN
        RAISE EXCEPTION 'A valid runtimeRole Flyway placeholder is required';
    END IF;

    SELECT rolname, rolsuper, rolcreaterole, rolcreatedb, rolbypassrls
    INTO runtime_role_record
    FROM pg_roles
    WHERE rolname = runtime_role_text;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Runtime database role % does not exist', runtime_role_text;
    END IF;
    IF runtime_role_text = session_user THEN
        RAISE EXCEPTION 'Runtime and migration database roles must be distinct';
    END IF;
    IF runtime_role_record.rolsuper
            OR runtime_role_record.rolcreaterole
            OR runtime_role_record.rolcreatedb
            OR runtime_role_record.rolbypassrls THEN
        RAISE EXCEPTION 'Runtime database role % has prohibited elevated attributes',
            runtime_role_text;
    END IF;

    SELECT format('%I.%I', namespace.nspname, class.relname)
    INTO foreign_object
    FROM pg_class class
    JOIN pg_namespace namespace ON namespace.oid = class.relnamespace
    JOIN pg_roles owner_role ON owner_role.oid = class.relowner
    WHERE namespace.nspname = 'public'
      AND class.relkind IN ('r', 'p', 'S')
      AND class.relname <> 'flyway_schema_history'
      AND owner_role.rolname <> session_user
    LIMIT 1;

    IF foreign_object IS NOT NULL THEN
        RAISE EXCEPTION 'Migration role % must own application object %',
            session_user, foreign_object;
    END IF;

    SELECT format('%I.%I', namespace.nspname, procedure.proname)
    INTO foreign_object
    FROM pg_proc procedure
    JOIN pg_namespace namespace ON namespace.oid = procedure.pronamespace
    JOIN pg_roles owner_role ON owner_role.oid = procedure.proowner
    WHERE namespace.nspname = 'public'
      AND owner_role.rolname <> session_user
    LIMIT 1;

    IF foreign_object IS NOT NULL THEN
        RAISE EXCEPTION 'Migration role % must own application function %',
            session_user, foreign_object;
    END IF;
END
$$;

DO $$
DECLARE
    runtime_role_text text := '${runtimeRole}';
BEGIN
    EXECUTE 'REVOKE CREATE ON SCHEMA public FROM PUBLIC';
    EXECUTE format('REVOKE CREATE ON SCHEMA public FROM %I', runtime_role_text);
    EXECUTE format('REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM %I',
        runtime_role_text);
    EXECUTE format('REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public FROM %I',
        runtime_role_text);

    EXECUTE format('GRANT USAGE ON SCHEMA public TO %I', runtime_role_text);
    EXECUTE format(
        'GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE '
        || 'users, user_roles, markets, outcomes, trades, positions, wallets, '
        || 'wallet_transactions, fund_requests, admin_mfa_credentials, audit_events TO %I',
        runtime_role_text);
    EXECUTE format(
        'GRANT USAGE, SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA public TO %I',
        runtime_role_text);

    EXECUTE format(
        'ALTER DEFAULT PRIVILEGES FOR ROLE %I IN SCHEMA public '
        || 'REVOKE ALL PRIVILEGES ON TABLES FROM %I',
        session_user, runtime_role_text);
    EXECUTE format(
        'ALTER DEFAULT PRIVILEGES FOR ROLE %I IN SCHEMA public '
        || 'GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO %I',
        session_user, runtime_role_text);
    EXECUTE format(
        'ALTER DEFAULT PRIVILEGES FOR ROLE %I IN SCHEMA public '
        || 'REVOKE ALL PRIVILEGES ON SEQUENCES FROM %I',
        session_user, runtime_role_text);
    EXECUTE format(
        'ALTER DEFAULT PRIVILEGES FOR ROLE %I IN SCHEMA public '
        || 'GRANT USAGE, SELECT, UPDATE ON SEQUENCES TO %I',
        session_user, runtime_role_text);
END
$$;

-- Statement-level guards protect retained history even from a privileged
-- maintenance connection that owns the tables. Runtime receives no TRUNCATE
-- privilege, providing an independent first boundary.
CREATE OR REPLACE FUNCTION prevent_retained_history_truncate()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    RAISE EXCEPTION 'TRUNCATE of retained history table % is prohibited', TG_TABLE_NAME;
END;
$$;

CREATE TRIGGER users_no_truncate
BEFORE TRUNCATE ON users
FOR EACH STATEMENT EXECUTE FUNCTION prevent_retained_history_truncate();

CREATE TRIGGER wallets_no_truncate
BEFORE TRUNCATE ON wallets
FOR EACH STATEMENT EXECUTE FUNCTION prevent_retained_history_truncate();

CREATE TRIGGER wallet_transactions_no_truncate
BEFORE TRUNCATE ON wallet_transactions
FOR EACH STATEMENT EXECUTE FUNCTION prevent_retained_history_truncate();

CREATE TRIGGER fund_requests_no_truncate
BEFORE TRUNCATE ON fund_requests
FOR EACH STATEMENT EXECUTE FUNCTION prevent_retained_history_truncate();

CREATE TRIGGER trades_no_truncate
BEFORE TRUNCATE ON trades
FOR EACH STATEMENT EXECUTE FUNCTION prevent_retained_history_truncate();

CREATE TRIGGER positions_no_truncate
BEFORE TRUNCATE ON positions
FOR EACH STATEMENT EXECUTE FUNCTION prevent_retained_history_truncate();

CREATE TRIGGER audit_events_no_truncate
BEFORE TRUNCATE ON audit_events
FOR EACH STATEMENT EXECUTE FUNCTION prevent_retained_history_truncate();