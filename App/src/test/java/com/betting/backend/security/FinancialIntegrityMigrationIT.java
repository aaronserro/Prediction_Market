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
class FinancialIntegrityMigrationIT {

    @Container
    private static final PostgreSQLContainer<?> POSTGRES =
            new PostgreSQLContainer<>("postgres:16-alpine");

    @BeforeAll
    static void migrateSchema() throws SQLException {
        createPreFlywaySchema();

        Flyway.configure()
                .dataSource(POSTGRES.getJdbcUrl(), POSTGRES.getUsername(), POSTGRES.getPassword())
                .baselineOnMigrate(true)
                .baselineVersion(MigrationVersion.fromVersion("0"))
                .target(MigrationVersion.fromVersion("2"))
                .load()
                .migrate();

        insertFinancialFixtures();

        Flyway.configure()
                .dataSource(POSTGRES.getJdbcUrl(), POSTGRES.getUsername(), POSTGRES.getPassword())
            .target(MigrationVersion.fromVersion("3"))
                .load()
                .migrate();
    }

    @Test
    void retainedFinancialRowsCannotBeDeleted() throws SQLException {
        assertDeleteRejected("wallet_transactions", "id = 500");
        assertDeleteRejected("fund_requests", "id = 600");
        assertDeleteRejected("trades", "id = 700");
        assertDeleteRejected("positions", "id = 800");
        assertDeleteRejected("wallets", "id = 400");

        try (Connection connection = connection(); Statement statement = connection.createStatement()) {
            assertThat(count(statement, "SELECT count(*) FROM wallets WHERE id = 400")).isOne();
            assertThat(count(statement,
                    "SELECT count(*) FROM wallet_transactions WHERE id = 500")).isOne();
            assertThat(count(statement, "SELECT count(*) FROM fund_requests WHERE id = 600")).isOne();
            assertThat(count(statement, "SELECT count(*) FROM trades WHERE id = 700")).isOne();
            assertThat(count(statement, "SELECT count(*) FROM positions WHERE id = 800")).isOne();
        }
    }

    @Test
    void ledgerEntriesAndExecutedTradesCannotBeUpdated() throws SQLException {
        assertUpdateRejected(
                "UPDATE wallet_transactions SET balance_after_cents = 999 WHERE id = 500",
                "wallet_transactions");
        assertUpdateRejected("UPDATE trades SET quantity = 2 WHERE id = 700", "trades");

        try (Connection connection = connection(); Statement statement = connection.createStatement()) {
            assertThat(singleLong(statement,
                    "SELECT balance_after_cents FROM wallet_transactions WHERE id = 500"))
                    .isEqualTo(100L);
            assertThat(singleLong(statement, "SELECT quantity FROM trades WHERE id = 700"))
                    .isEqualTo(1L);
        }
    }

    @Test
    void requiredFinancialLifecycleUpdatesRemainAllowed() throws SQLException {
        try (Connection connection = connection(); Statement statement = connection.createStatement()) {
            assertThat(statement.executeUpdate(
                    "UPDATE wallets SET balance_cents = 150, version = version + 1 WHERE id = 400"))
                    .isOne();
            assertThat(statement.executeUpdate("""
                    UPDATE fund_requests
                    SET status = 'APPROVED', processed_at = CURRENT_TIMESTAMP, version = version + 1
                    WHERE id = 600
                    """)).isOne();
            assertThat(statement.executeUpdate("""
                    UPDATE positions
                    SET quantity = 0, cost_basis_cents = 0, realized_pnl = 25,
                        status = 'SETTLED'
                    WHERE id = 800
                    """)).isOne();

            assertThat(singleLong(statement, "SELECT balance_cents FROM wallets WHERE id = 400"))
                    .isEqualTo(150L);
            assertThat(singleString(statement, "SELECT status FROM fund_requests WHERE id = 600"))
                    .isEqualTo("APPROVED");
            assertThat(singleString(statement, "SELECT status FROM positions WHERE id = 800"))
                    .isEqualTo("SETTLED");
        }
    }

    @Test
    void tradingStateConstraintsEnforceBoundaries() throws SQLException {
        assertInsertRejected(tradeInsert(701, 0), "trades_quantity_ck");
        assertInsertRejected(tradeInsert(702, 10001), "trades_quantity_ck");
        assertInsertRejected(positionInsert(801, -1, 0), "positions_quantity_ck");
        assertInsertRejected(positionInsert(802, 0, -1), "positions_cost_basis_ck");
        assertUpdateRejected(
                "UPDATE outcomes SET total_outstanding = -1 WHERE id = '00000000-0000-0000-0000-000000000002'",
                "outcomes_outstanding_ck");

        try (Connection connection = connection(); Statement statement = connection.createStatement()) {
            assertThat(statement.executeUpdate(tradeInsert(703, 1))).isOne();
            assertThat(statement.executeUpdate(tradeInsert(704, 10000))).isOne();
        }
    }

    private static void createPreFlywaySchema() throws SQLException {
        try (Connection connection = connection(); Statement statement = connection.createStatement()) {
            statement.execute("""
                    CREATE TABLE users (
                        id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
                        username varchar(255),
                        email varchar(255),
                        password_hash varchar(255) NOT NULL
                    )
                    """);
            statement.execute("""
                    CREATE TABLE user_roles (
                        user_id bigint NOT NULL REFERENCES users(id),
                        role varchar(255)
                    )
                    """);
            statement.execute("""
                    CREATE TABLE markets (
                        id uuid PRIMARY KEY,
                        title varchar(255) NOT NULL
                    )
                    """);
            statement.execute("""
                    CREATE TABLE outcomes (
                        id uuid PRIMARY KEY,
                        market_id uuid NOT NULL REFERENCES markets(id),
                        total_outstanding integer NOT NULL
                    )
                    """);
            statement.execute("""
                    CREATE TABLE wallets (
                        id bigint PRIMARY KEY,
                        userid bigint NOT NULL UNIQUE REFERENCES users(id),
                        balance_cents bigint NOT NULL,
                        version integer NOT NULL
                    )
                    """);
            statement.execute("""
                    CREATE TABLE wallet_transactions (
                        id bigint PRIMARY KEY,
                        wallet_id bigint NOT NULL REFERENCES wallets(id),
                        delta_cents bigint NOT NULL,
                        balance_after_cents bigint NOT NULL,
                        idempotency_key varchar(128) NOT NULL UNIQUE,
                        ref_id varchar(255),
                        created_at timestamp NOT NULL
                    )
                    """);
            statement.execute("""
                    CREATE TABLE fund_requests (
                        id bigint PRIMARY KEY,
                        wallet_id bigint NOT NULL REFERENCES wallets(id),
                        amount_cents bigint NOT NULL,
                        idempotency_key varchar(128) UNIQUE,
                        version integer NOT NULL,
                        created_at timestamp with time zone NOT NULL,
                        processed_at timestamp with time zone,
                        reason varchar(1000),
                        status varchar(32) NOT NULL
                    )
                    """);
            statement.execute("""
                    CREATE TABLE trades (
                        id bigint PRIMARY KEY,
                        user_id bigint NOT NULL REFERENCES users(id),
                        market_id uuid NOT NULL REFERENCES markets(id),
                        outcome_id uuid NOT NULL REFERENCES outcomes(id),
                        side varchar(16) NOT NULL,
                        created_at timestamp NOT NULL,
                        amount bigint NOT NULL,
                        quantity integer NOT NULL,
                        price_per_share integer NOT NULL
                    )
                    """);
            statement.execute("""
                    CREATE TABLE positions (
                        id bigint PRIMARY KEY,
                        user_id bigint NOT NULL REFERENCES users(id),
                        outcome_id uuid NOT NULL REFERENCES outcomes(id),
                        status varchar(32) NOT NULL,
                        quantity integer NOT NULL,
                        cost_basis_cents bigint NOT NULL,
                        realized_pnl bigint
                    )
                    """);
        }
    }

    private static void insertFinancialFixtures() throws SQLException {
        try (Connection connection = connection(); Statement statement = connection.createStatement()) {
            statement.executeUpdate("""
                    INSERT INTO users
                        (id, username, email, password_hash, account_enabled, token_version)
                    VALUES (300, 'fixture-user', 'fixture@example.com', 'hash', true, 0)
                    """);
            statement.executeUpdate("""
                    INSERT INTO markets (id, title)
                    VALUES ('00000000-0000-0000-0000-000000000001', 'Fixture market')
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
                    VALUES (500, 400, 100, 100, 'fixture-credit', CURRENT_TIMESTAMP)
                    """);
            statement.executeUpdate("""
                    INSERT INTO fund_requests
                        (id, wallet_id, amount_cents, idempotency_key, version, created_at, reason, status)
                    VALUES (600, 400, 50, 'fixture-request', 0, CURRENT_TIMESTAMP,
                            'fixture', 'PENDING')
                    """);
            statement.executeUpdate(tradeInsert(700, 1));
            statement.executeUpdate(positionInsert(800, 1, 100));
        }
    }

    private static String tradeInsert(long id, int quantity) {
        return """
                INSERT INTO trades
                    (id, user_id, market_id, outcome_id, side, created_at, amount,
                     quantity, price_per_share, idempotency_key)
                VALUES (%d, 300,
                        '00000000-0000-0000-0000-000000000001',
                        '00000000-0000-0000-0000-000000000002',
                        'BUY', CURRENT_TIMESTAMP, 100, %d, 100, 'trade-%d')
                """.formatted(id, quantity, id);
    }

    private static String positionInsert(long id, int quantity, long costBasis) {
        return """
                INSERT INTO positions
                    (id, user_id, outcome_id, status, quantity, cost_basis_cents, realized_pnl)
                VALUES (%d, 300, '00000000-0000-0000-0000-000000000002',
                        'OPEN', %d, %d, 0)
                """.formatted(id, quantity, costBasis);
    }

    private static void assertDeleteRejected(String table, String predicate) throws SQLException {
        try (Connection connection = connection(); Statement statement = connection.createStatement()) {
            assertThatThrownBy(() -> statement.executeUpdate(
                    "DELETE FROM " + table + " WHERE " + predicate))
                    .isInstanceOf(SQLException.class)
                    .hasMessageContaining("Physical deletion from " + table + " is prohibited");
        }
    }

    private static void assertUpdateRejected(String sql, String expectedMessage) throws SQLException {
        try (Connection connection = connection(); Statement statement = connection.createStatement()) {
            assertThatThrownBy(() -> statement.executeUpdate(sql))
                    .isInstanceOf(SQLException.class)
                    .hasMessageContaining(expectedMessage);
        }
    }

    private static void assertInsertRejected(String sql, String constraint) throws SQLException {
        try (Connection connection = connection(); Statement statement = connection.createStatement()) {
            assertThatThrownBy(() -> statement.executeUpdate(sql))
                    .isInstanceOf(SQLException.class)
                    .hasMessageContaining(constraint);
        }
    }

    private static Connection connection() throws SQLException {
        return DriverManager.getConnection(
                POSTGRES.getJdbcUrl(), POSTGRES.getUsername(), POSTGRES.getPassword());
    }

    private static long count(Statement statement, String sql) throws SQLException {
        return singleLong(statement, sql);
    }

    private static long singleLong(Statement statement, String sql) throws SQLException {
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