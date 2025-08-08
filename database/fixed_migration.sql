-- Fixed Enhanced Appointment Management Database Migration
-- Save this as: database/fixed_migration.sql

-- First, let's check the actual appointments table structure
-- to understand what columns exist

-- 1. Fix the appointments table index (use correct column name)
-- Let's check what the actual column name is in appointments table
DO $$ 
BEGIN
    -- Create index for datetime column (trying both possible names)
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'appointments' AND column_name = 'datetime') THEN
        CREATE INDEX IF NOT EXISTS idx_appointments_datetime ON appointments(datetime);
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'appointments' AND column_name = 'date_time') THEN
        CREATE INDEX IF NOT EXISTS idx_appointments_date_time ON appointments(date_time);
    END IF;
END $$;

-- 2. Fix the constraint syntax for older PostgreSQL versions
DO $$
BEGIN
    -- Add constraint if it doesn't exist (PostgreSQL 9.6+ compatible)
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'valid_appointment_status') THEN
        ALTER TABLE appointments 
        ADD CONSTRAINT valid_appointment_status 
        CHECK (status IN ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled'));
    END IF;
END $$;

-- 3. Create a corrected view that works with actual column names
DROP VIEW IF EXISTS appointment_details;

-- Let's create the view dynamically based on actual column structure
DO $$ 
DECLARE 
    datetime_col TEXT;
BEGIN
    -- Check which datetime column exists
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'appointments' AND column_name = 'datetime') THEN
        datetime_col := 'datetime';
    ELSIF EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'appointments' AND column_name = 'date_time') THEN
        datetime_col := 'date_time';
    ELSE
        datetime_col := 'created_at'; -- fallback
    END IF;
    
    -- Create view with correct column name
    EXECUTE format('
        CREATE OR REPLACE VIEW appointment_details AS
        SELECT 
            a.id,
            a.user_id,
            a.pet_id,
            a.service_id,
            a.%I as appointment_datetime,
            a.status,
            COALESCE(a.notes, '''') as notes,
            a.created_at,
            a.updated_at,
            u.name as user_name,
            u.email as user_email,
            COALESCE(u.phone, '''') as user_phone,
            p.name as pet_name,
            COALESCE(p.breed, '''') as pet_breed,
            COALESCE(p.size, '''') as pet_size,
            s.name as service_name,
            COALESCE(s.price, 0) as service_price,
            COALESCE(s.duration, 60) as service_duration
        FROM appointments a
        LEFT JOIN users u ON a.user_id = u.id
        LEFT JOIN pets p ON a.pet_id = p.id
        LEFT JOIN services s ON a.service_id = s.id', datetime_col);
END $$;

-- 4. Update the appointment history logging function to use correct column names
CREATE OR REPLACE FUNCTION log_appointment_changes()
RETURNS TRIGGER AS $$
DECLARE
    datetime_col_old TIMESTAMP;
    datetime_col_new TIMESTAMP;
BEGIN
    -- Handle both possible datetime column names
    BEGIN
        datetime_col_old := OLD.datetime;
        datetime_col_new := NEW.datetime;
    EXCEPTION WHEN undefined_column THEN
        BEGIN
            datetime_col_old := OLD.date_time;
            datetime_col_new := NEW.date_time;
        EXCEPTION WHEN undefined_column THEN
            datetime_col_old := OLD.created_at;
            datetime_col_new := NEW.created_at;
        END;
    END;

    -- Only log if status or datetime changed
    IF (OLD.status IS DISTINCT FROM NEW.status) OR 
       (datetime_col_old IS DISTINCT FROM datetime_col_new) THEN
        
        INSERT INTO appointment_history (
            appointment_id, 
            old_status, 
            new_status, 
            old_date_time, 
            new_date_time,
            change_reason
        ) VALUES (
            NEW.id,
            OLD.status,
            NEW.status,
            datetime_col_old,
            datetime_col_new,
            CASE 
                WHEN OLD.status IS DISTINCT FROM NEW.status THEN 'Status changed'
                WHEN datetime_col_old IS DISTINCT FROM datetime_col_new THEN 'Rescheduled'
                ELSE 'Updated'
            END
        );
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 5. Recreate the trigger
DROP TRIGGER IF EXISTS log_appointment_changes ON appointments;
CREATE TRIGGER log_appointment_changes
    AFTER UPDATE ON appointments
    FOR EACH ROW
    EXECUTE FUNCTION log_appointment_changes();

-- 6. Let's also check what we actually have in the database
-- Show current table structures for debugging
\echo 'Current appointments table structure:'
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'appointments' 
ORDER BY ordinal_position;

\echo 'Current users table structure:'
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;

\echo 'Migration fixes completed!';