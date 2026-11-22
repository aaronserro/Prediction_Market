package com.betting.backend.security;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;

import org.flywaydb.core.Flyway;
import org.flywaydb.core.api.MigrationVersion;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

@Testcontainers(disabledWithoutDocker = true)
class DatabaseRoleHardeningMigrationIT {

    private static final String MIGRATION_ROLE = "migration_owner";
    private static final String MIGRATION_PASSWORD = "migration-test-password";
    private static final String RUNTIME_ROLE = "app_runtime";
    private static final String RUNTIME_PASSWORD = "runtime-test-password";
    private static final String[] RETAINED_TABLES = {
        "users", "wallets", "wallet_transactions", "fund_requests",
        "trades", "positions", "audit_events"
            };

    @Container
    private static final PostgreSQLContainer<?> POSTGRES =
            new PostgreSQLContainer<>("postgres:16-alpine");

    @BeforeAll
    static void migrateWithSeparatedRoles() throws SQLException {
        try (Connection connection = adminConnection(); Statement statement = connection.createStatement()) {
            statement.execute("CREATE ROLE " + MIGRATION_ROLE
                    + " LOGIN PASSWORD '" + MIGRATION_PASSWORD + "'");
            statement.execute("CREATE ROLE " + RUNTIME_ROLE
                    + " LOGIN PASSWORD '" + RUNTIME_PASSWORD + "'");
            statement.execute("GRANT CONNECT ON DATABASE " + POSTGRES.getDatabaseName()
                    + " TO " + MIGRATION_ROLE + ", " + RUNTIME_ROLE);
            createPreFlywaySchema(statement);
        }

        Flyway.configure()
                .dataSource(POSTGRES.getJdbcUrl(), POSTGRES.getUsername(), POSTGRES.getPassword())
                .baselineOnMigrate(true)
                .baselineVersion(MigrationVersion.fromVersion("0"))
                .target(MigrationVersion.fromVersion("3"))
                .load()
                .migrate();

        try (Connection connection = adminConnection(); Statement statement = connection.createStatement()) {
            transferPublicApplicationOwnership(statement);
        }

        Flyway.configure()
                .dataSource(POSTGRES.getJdbcUrl(), MIGRATION_ROLE, MIGRATION_PASSWORD)
                .placeholders(java.util.Map.of("runtimeRole", RUNTIME_ROLE))
                .load()
                .migrate();

        insertRetainedFixtures();
    }

    @Test
    void runtimeRoleHasRequiredDmlAndSequenceAccess() throws SQLException {
        try (Connection connection = runtimeConnection(); Statement statement = connection.createStatement()) {
            long id;
            try (ResultSet result = statement.executeQuery("""
                    INSERT INTO users (username, email, password_hash, account_enabled, token_version)
                    VALUES ('runtime-user', 'runtime@example.com', 'hash', true, 0)
                    RETURNING id
                    """)) {
                assertThat(result.next()).isTrue();
                id = result.getLong(1);
            }
            assertThat(statement.executeUpdate(
                    "UPDATE users SET token_version = 1 WHERE id = " + id)).isOne();
            assertThat(count(statement, "SELECT count(*) FROM users WHERE id = " + id)).isOne();
        }
    }

    @Test
    void runtimeRoleCannotCreateAlterDropOrManageTriggers() throws SQLException {
        assertRuntimeDenied("CREATE TABLE public.runtime_escape (id bigint)");
        assertRuntimeDenied("ALTER TABLE users ADD COLUMN runtime_escape text");
        assertRuntimeDenied("DROP TABLE users");
        assertRuntimeDenied("DROP TRIGGER users_no_delete ON users");
        assertRuntimeDenied("""
                CREATE TRIGGER runtime_trigger BEFORE DELETE ON users
                FOR EACH ROW EXECUTE FUNCTION prevent_user_deletion()
                """);

        try (Connection connection = adminConnection(); Statement statement = connection.createStatement()) {
            assertThat(singleString(statement, """
                    SELECT tableowner FROM pg_tables
                    WHERE schemaname = 'public' AND tablename = 'users'
                    """)).isEqualTo(MIGRATION_ROLE);
            assertThat(singleString(statement, """
                    SELECT owner_role.rolname
                    FROM pg_proc procedure
                    JOIN pg_namespace namespace ON namespace.oid = procedure.pronamespace
                    JOIN pg_roles owner_role ON owner_role.oid = procedure.proowner
                    WHERE namespace.nspname = 'public'
                      AND procedure.proname = 'prevent_user_deletion'
                    """)).isEqualTo(MIGRATION_ROLE);
        }
    }

    @Test
    void runtimeRoleHasNoElevatedAttributesOrTableOwnership() throws SQLException {
        try (Connection connection = adminConnection(); Statement statement = connection.createStatement()) {
            try (ResultSet result = statement.executeQuery("""
                    SELECT rolsuper, rolcreaterole, rolcreatedb, rolbypassrls
                    FROM pg_roles WHERE rolname = 'app_runtime'
                    """)) {
                assertThat(result.next()).isTrue();
                assertThat(result.getBoolean("rolsuper")).isFalse();
                assertThat(result.getBoolean("rolcreaterole")).isFalse();
                assertThat(result.getBoolean("rolcreatedb")).isFalse();
                assertThat(result.getBoolean("rolbypassrls")).isFalse();
            }
            assertThat(count(statement, """
                    SELECT count(*)
                    FROM pg_class class
                    JOIN pg_namespace namespace ON namespace.oid = class.relnamespace
                    JOIN pg_roles owner_role ON owner_role.oid = class.relowner
                    WHERE namespace.nspname = 'public' AND owner_role.rolname = 'app_runtime'
                    """)).isZero();
        }
    }

    @Test
    void runtimeRoleCannotTruncateRetainedHistory() throws SQLException {
        for (String table : RETAINED_TABLES) {
            try (Connection connection = runtimeConnection();
                    Statement statement = connection.createStatement()) {
                assertThatThrownBy(() -> statement.execute("TRUNCATE TABLE " + table))
                        .isInstanceOf(SQLException.class);
            }
        }

        assertRetainedFixtureRowsRemain();
    }

    @Test
    void migrationOwnerCannotAccidentallyTruncateRetainedHistory() throws SQLException {
        for (String table : RETAINED_TABLES) {
            try (Connection connection = migrationConnection();
                    Statement statement = connection.createStatement()) {
                assertThatThrownBy(() -> statement.execute("TRUNCATE TABLE " + table + " CASCADE"))
                        .isInstanceOf(SQLException.class)
                        .hasMessageContaining("TRUNCATE of retained history table");
            }
        }

        assertRetainedFixtureRowsRemain();
    }

    @Test
    void migrationRejectsIdenticalRuntimeAndMigrationRoles() throws SQLException {
        String database = "same_role_rejection";
        String databaseUrl = POSTGRES.getJdbcUrl().replace(
                "/" + POSTGRES.getDatabaseName(), "/" + database);

        try (Connection connection = adminConnection(); Statement statement = connection.createStatement()) {
            statement.execute("CREATE DATABASE " + database);
        }

        try {
            try (Connection connection = DriverManager.getConnection(
                    databaseUrl, POSTGRES.getUsername(), POSTGRES.getPassword());
                    Statement statement = connection.createStatement()) {
                createPreFlywaySchema(statement);
            }

            Flyway.configure()
                    .dataSource(databaseUrl, POSTGRES.getUsername(), POSTGRES.getPassword())
                    .baselineOnMigrate(true)
                    .baselineVersion(MigrationVersion.fromVersion("0"))
                    .target(MigrationVersion.fromVersion("3"))
                    .load()
                    .migrate();

            try (Connection connection = DriverManager.getConnection(
                    databaseUrl, POSTGRES.getUsername(), POSTGRES.getPassword());
                    Statement statement = connection.createStatement()) {
                transferPublicApplicationOwnership(statement);
            }

            assertThatThrownBy(() -> Flyway.configure()
                    .dataSource(databaseUrl, MIGRATION_ROLE, MIGRATION_PASSWORD)
                    .placeholders(java.util.Map.of("runtimeRole", MIGRATION_ROLE))
                    .load()
                    .migrate())
                    .rootCause()
                    .hasMessageContaining("Runtime and migration database roles must be distinct");
        } finally {
            try (Connection connection = adminConnection(); Statement statement = connection.createStatement()) {
                statement.execute("DROP DATABASE " + database + " WITH (FORCE)");
            }
        }
    }

    private static void assertRuntimeDenied(String sql) throws SQLException {
        try (Connection connection = runtimeConnection(); Statement statement = connection.createStatement()) {
            assertThatThrownBy(() -> statement.execute(sql)).isInstanceOf(SQLException.class);
        }
    }

    private static void createPreFlywaySchema(Statement statement) throws SQLException {
        statement.execute("""
                CREATE TABLE users (
                    id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
                    username varchar(255), email varchar(255), password_hash varchar(255) NOT NULL)
                """);
        statement.execute("""
                CREATE TABLE user_roles (
                    user_id bigint NOT NULL REFERENCES users(id), role varchar(255))
                """);
        statement.execute("""
                CREATE TABLE markets (id uuid PRIMARY KEY, title varchar(255) NOT NULL)
                """);
        statement.execute("""
                CREATE TABLE outcomes (
                    id uuid PRIMARY KEY, market_id uuid NOT NULL REFERENCES markets(id),
                    total_outstanding integer NOT NULL)
                """);
        statement.execute("""
                CREATE TABLE wallets (
                    id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
                    userid bigint NOT NULL UNIQUE REFERENCES users(id),
                    balance_cents bigint NOT NULL, version integer NOT NULL)
                """);
        statement.execute("""
                CREATE TABLE wallet_transactions (
                    id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
                    wallet_id bigint NOT NULL REFERENCES wallets(id), delta_cents bigint NOT NULL,
                    balance_after_cents bigint NOT NULL, idempotency_key varchar(128) NOT NULL UNIQUE,
                    ref_id varchar(255), created_at timestamp NOT NULL)
                """);
        statement.execute("""
                CREATE TABLE fund_requests (
                    id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
                    wallet_id bigint NOT NULL REFERENCES wallets(id), amount_cents bigint NOT NULL,
                    idempotency_key varchar(128) UNIQUE, version integer NOT NULL,
                    created_at timestamp with time zone NOT NULL,
                    processed_at timestamp with time zone, reason varchar(1000), status varchar(32) NOT NULL)
                """);
        statement.execute("""
                CREATE TABLE trades (
                    id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
                    user_id bigint NOT NULL REFERENCES users(id), market_id uuid NOT NULL REFERENCES markets(id),
                    outcome_id uuid NOT NULL REFERENCES outcomes(id), side varchar(16) NOT NULL,
                    created_at timestamp NOT NULL, amount bigint NOT NULL, quantity integer NOT NULL,
                    price_per_share integer NOT NULL)
                """);
        statement.execute("""
                CREATE TABLE positions (
                    id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
                    user_id bigint NOT NULL REFERENCES users(id), outcome_id uuid NOT NULL REFERENCES outcomes(id),
                    status varchar(32) NOT NULL, quantity integer NOT NULL,
                    cost_basis_cents bigint NOT NULL, realized_pnl bigint)
                """);
    }

    private static void transferPublicApplicationOwnership(Statement statement) throws SQLException {
        statement.execute("ALTER SCHEMA public OWNER TO " + MIGRATION_ROLE);
        statement.execute("""
                DO $ownership$
                DECLARE object_record record;
                BEGIN
                    FOR object_record IN
                        SELECT class.relkind, namespace.nspname, class.relname
                        FROM pg_class class
                        JOIN pg_namespace namespace ON namespace.oid = class.relnamespace
                        WHERE namespace.nspname = 'public'
                          AND class.relkind IN ('r', 'p')
                    LOOP
                        EXECUTE format('ALTER TABLE %I.%I OWNER TO %I',
                            object_record.nspname, object_record.relname, 'migration_owner');
                    END LOOP;

                    FOR object_record IN
                        SELECT namespace.nspname, procedure.proname,
                               pg_get_function_identity_arguments(procedure.oid) AS arguments
                        FROM pg_proc procedure
                        JOIN pg_namespace namespace ON namespace.oid = procedure.pronamespace
                        WHERE namespace.nspname = 'public'
                    LOOP
                        EXECUTE format('ALTER FUNCTION %I.%I(%s) OWNER TO %I',
                            object_record.nspname, object_record.proname,
                            object_record.arguments, 'migration_owner');
                    END LOOP;
                END
                $ownership$;
                """);
        statement.execute("GRANT USAGE, CREATE ON SCHEMA public TO " + MIGRATION_ROLE);
    }

    private static void insertRetainedFixtures() throws SQLException {
        try (Connection connection = migrationConnection();
                Statement statement = connection.createStatement()) {
            statement.executeUpdate("""
                    INSERT INTO users
                    (id, username, email, password_hash, account_enabled, token_version)
                    VALUES (300, 'retained-user', 'retained@example.com', 'hash', true, 0)
                    """);
            statement.executeUpdate("""
                    INSERT INTO markets (id, title)
                    VALUES ('00000000-0000-0000-0000-000000000001', 'Retained market')
                    """);
            statement.executeUpdate("""
                    INSERT INTO outcomes (id, market_id, total_outstanding)
                    VALUES ('00000000-0000-0000-0000-000000000002',
                        '00000000-0000-0000-0000-000000000001', 1)
                    """);
            statement.executeUpdate(
                    "INSERT INTO wallets (id, userid, balance_cents, version) VALUES (400, 300, 100, 0)");
            statement.executeUpdate("""
                    INSERT INTO wallet_transactions
                    (id, wallet_id, delta_cents, balance_after_cents, idempotency_key, created_at)
                    VALUES (500, 400, 100, 100, 'retained-credit', CURRENT_TIMESTAMP)
                    """);
            statement.executeUpdate("""
                    INSERT INTO fund_requests
                    (id, wallet_id, amount_cents, idempotency_key, version, created_at, reason, status)
                    VALUES (600, 400, 50, 'retained-request', 0, CURRENT_TIMESTAMP,
                        'retained', 'PENDING')
                    """);
            statement.executeUpdate("""
                    INSERT INTO trades
                    (id, user_id, market_id, outcome_id, side, created_at, amount,
                     quantity, price_per_share, idempotency_key)
                    VALUES (700, 300,
                        '00000000-0000-0000-0000-000000000001',
                        '00000000-0000-0000-0000-000000000002',
                        'BUY', CURRENT_TIMESTAMP, 100, 1, 100, 'retained-trade')
                    """);
            statement.executeUpdate("""
                    INSERT INTO positions
                    (id, user_id, outcome_id, status, quantity, cost_basis_cents, realized_pnl)
                    VALUES (800, 300, '00000000-0000-0000-0000-000000000002',
                        'OPEN', 1, 100, 0)
                    """);
            statement.executeUpdate("""
                    INSERT INTO audit_events
                    (id, occurred_at, actor_user_id, action, target_type, target_id,
                     outcome, correlation_id)
                    VALUES ('00000000-0000-0000-0000-000000000003', CURRENT_TIMESTAMP,
                        300, 'FIXTURE', 'USER', '300', 'SUCCESS', 'fixture')
                    """);
        }
    }

    private static void assertRetainedFixtureRowsRemain() throws SQLException {
        try (Connection connection = adminConnection(); Statement statement = connection.createStatement()) {
            for (String table : RETAINED_TABLES) {
                assertThat(count(statement, "SELECT count(*) FROM " + table))
                        .as("retained rows in %s", table)
                        .isPositive();
            }
        }
    }

    private static Connection adminConnection() throws SQLException {
        return DriverManager.getConnection(
                POSTGRES.getJdbcUrl(), POSTGRES.getUsername(), POSTGRES.getPassword());
    }

    private static Connection runtimeConnection() throws SQLException {
        return DriverManager.getConnection(
                POSTGRES.getJdbcUrl(), RUNTIME_ROLE, RUNTIME_PASSWORD);
    }

    private static Connection migrationConnection() throws SQLException {
        return DriverManager.getConnection(
                POSTGRES.getJdbcUrl(), MIGRATION_ROLE, MIGRATION_PASSWORD);
    }

    private static long count(Statement statement, String sql) throws SQLException {
        try (ResultSet result = statement.executeQuery(sql)) {
            result.next();
            return result.getLong(1);
        }
    }

    private static String singleString(Statement statement, String sql) throws SQLException {
        try (ResultSet result = statement.executeQuery(sql)) {
            result.next();
            return result.getString(1);
        }
    }

}