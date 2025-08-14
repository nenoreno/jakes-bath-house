-- Add password field to users table if it doesn't exist
-- Run this if you get password field errors

DO $$ 
BEGIN 
    -- Check if password column exists, if not add it
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'password'
    ) THEN
        ALTER TABLE users ADD COLUMN password VARCHAR(255);
        UPDATE users SET password = '$2a$10$dummy.hash.for.existing.users' WHERE password IS NULL;
        ALTER TABLE users ALTER COLUMN password SET NOT NULL;
    END IF;
END $$;

-- Ensure wash_count has default value
UPDATE users SET wash_count = 0 WHERE wash_count IS NULL;