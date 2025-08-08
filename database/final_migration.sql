-- Final migration to fix the view with correct column names
-- Save as: database/final_migration.sql

-- 1. Create the correct view based on actual schema
DROP VIEW IF EXISTS appointment_details;

CREATE OR REPLACE VIEW appointment_details AS
SELECT 
    a.id,
    a.user_id,
    a.pet_id,
    a.service_id,
    a.appointment_date,
    a.appointment_time,
    (a.appointment_date + a.appointment_time) as appointment_datetime,
    a.status,
    COALESCE(a.notes, '') as notes,
    a.created_at,
    a.updated_at,
    u.name as user_name,
    u.email as user_email,
    COALESCE(u.phone, '') as user_phone,
    p.name as pet_name,
    COALESCE(p.breed, '') as pet_breed,
    COALESCE(p.size, '') as pet_size,
    s.name as service_name,
    COALESCE(s.price, 0) as service_price
FROM appointments a
LEFT JOIN users u ON a.user_id = u.id
LEFT JOIN pets p ON a.pet_id = p.id
LEFT JOIN services s ON a.service_id = s.id;

-- 2. Check what columns exist in services table
\echo 'Current services table structure:'
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'services' 
ORDER BY ordinal_position;

-- 3. Check what columns exist in pets table
\echo 'Current pets table structure:'
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'pets' 
ORDER BY ordinal_position;

-- 4. Update the appointment history function to use correct date/time columns
CREATE OR REPLACE FUNCTION log_appointment_changes()
RETURNS TRIGGER AS $$
BEGIN
    -- Only log if status, date, or time changed
    IF (OLD.status IS DISTINCT FROM NEW.status) OR 
       (OLD.appointment_date IS DISTINCT FROM NEW.appointment_date) OR
       (OLD.appointment_time IS DISTINCT FROM NEW.appointment_time) THEN
        
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
            (OLD.appointment_date + OLD.appointment_time),
            (NEW.appointment_date + NEW.appointment_time),
            CASE 
                WHEN OLD.status IS DISTINCT FROM NEW.status THEN 'Status changed'
                WHEN (OLD.appointment_date IS DISTINCT FROM NEW.appointment_date) OR 
                     (OLD.appointment_time IS DISTINCT FROM NEW.appointment_time) THEN 'Rescheduled'
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

\echo 'Schema-correct migration completed!';