-- Replace destructive user deletion with an auditable disabled-account state.
-- Financial records continue to reference the durable users.id value.

ALTER TABLE users
    ADD COLUMN deactivated_at timestamp with time zone,
    ADD COLUMN deactivated_by_user_id bigint;

-- Existing disabled accounts predate deactivation metadata. Remove their login
-- identity and credentials before enforcing the state invariant.
UPDATE users
SET username = 'deactivated-' || id,
    email = 'deactivated-' || id || '@users.invalid',
    password_hash = '!deactivated!',
    deactivated_at = CURRENT_TIMESTAMP,
    deactivated_by_user_id = NULL,
    token_version = token_version + 1
WHERE account_enabled = false;

DELETE FROM user_roles
WHERE user_id IN (
    SELECT id FROM users WHERE account_enabled = false
);

DELETE FROM admin_mfa_credentials
WHERE user_id IN (
    SELECT id FROM users WHERE account_enabled = false
);

ALTER TABLE users
    ADD CONSTRAINT users_deactivation_state_ck CHECK (
        (account_enabled = true
            AND deactivated_at IS NULL
            AND deactivated_by_user_id IS NULL)
        OR
        (account_enabled = false
            AND deactivated_at IS NOT NULL)
    );

CREATE OR REPLACE FUNCTION prevent_user_deletion()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    RAISE EXCEPTION 'Physical user deletion is prohibited; deactivate the account instead';
END;
$$;

DROP TRIGGER IF EXISTS users_no_delete ON users;
CREATE TRIGGER users_no_delete
BEFORE DELETE ON users
FOR EACH ROW
EXECUTE FUNCTION prevent_user_deletion();