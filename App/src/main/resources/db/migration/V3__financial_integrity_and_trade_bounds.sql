-- Preserve financial history at the database boundary and reject invalid
-- trading state before exact-arithmetic application safeguards are enabled.

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM trades WHERE quantity < 1 OR quantity > 10000) THEN
        RAISE EXCEPTION 'Trades contain quantities outside the supported range 1..10000';
    END IF;
    IF EXISTS (SELECT 1 FROM positions WHERE quantity < 0) THEN
        RAISE EXCEPTION 'Positions contain negative quantities';
    END IF;
    IF EXISTS (SELECT 1 FROM positions WHERE cost_basis_cents < 0) THEN
        RAISE EXCEPTION 'Positions contain negative cost basis values';
    END IF;
    IF EXISTS (SELECT 1 FROM outcomes WHERE total_outstanding < 0) THEN
        RAISE EXCEPTION 'Outcomes contain negative outstanding quantities';
    END IF;
END
$$;

ALTER TABLE trades
    ADD CONSTRAINT trades_quantity_ck CHECK (quantity BETWEEN 1 AND 10000);

ALTER TABLE positions
    ADD CONSTRAINT positions_quantity_ck CHECK (quantity >= 0),
    ADD CONSTRAINT positions_cost_basis_ck CHECK (cost_basis_cents >= 0);

ALTER TABLE outcomes
    ADD CONSTRAINT outcomes_outstanding_ck CHECK (total_outstanding >= 0);

CREATE OR REPLACE FUNCTION prevent_financial_row_deletion()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    RAISE EXCEPTION 'Physical deletion from % is prohibited; financial history is retained',
        TG_TABLE_NAME;
END;
$$;

CREATE TRIGGER wallets_no_delete
BEFORE DELETE ON wallets
FOR EACH ROW EXECUTE FUNCTION prevent_financial_row_deletion();

CREATE TRIGGER wallet_transactions_no_delete
BEFORE DELETE ON wallet_transactions
FOR EACH ROW EXECUTE FUNCTION prevent_financial_row_deletion();

CREATE TRIGGER fund_requests_no_delete
BEFORE DELETE ON fund_requests
FOR EACH ROW EXECUTE FUNCTION prevent_financial_row_deletion();

CREATE TRIGGER trades_no_delete
BEFORE DELETE ON trades
FOR EACH ROW EXECUTE FUNCTION prevent_financial_row_deletion();

CREATE TRIGGER positions_no_delete
BEFORE DELETE ON positions
FOR EACH ROW EXECUTE FUNCTION prevent_financial_row_deletion();

CREATE OR REPLACE FUNCTION prevent_immutable_financial_row_update()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    RAISE EXCEPTION 'Updates to immutable financial table % are prohibited', TG_TABLE_NAME;
END;
$$;

CREATE TRIGGER wallet_transactions_no_update
BEFORE UPDATE ON wallet_transactions
FOR EACH ROW EXECUTE FUNCTION prevent_immutable_financial_row_update();

CREATE TRIGGER trades_no_update
BEFORE UPDATE ON trades
FOR EACH ROW EXECUTE FUNCTION prevent_immutable_financial_row_update();