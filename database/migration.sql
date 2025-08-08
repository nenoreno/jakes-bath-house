-- Enhanced Appointment Management Database Migration
-- Save this as: database/migration.sql

-- 1. Add role column to users table if it doesn't exist
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'customer';

-- Update existing users to have proper roles
UPDATE users SET role = 'customer' WHERE role IS NULL;
UPDATE users SET role = 'admin' WHERE email = 'ant@test.com';

-- 2. Modify appointments table to add enhanced status management
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Update existing appointments to have proper status
UPDATE appointments SET status = 'confirmed' WHERE status IS NULL OR status = '';

-- 3. Create appointment_history table for tracking changes
CREATE TABLE IF NOT EXISTS appointment_history (
    id SERIAL PRIMARY KEY,
    appointment_id INTEGER REFERENCES appointments(id) ON DELETE CASCADE,
    old_status VARCHAR(20),
    new_status VARCHAR(20),
    old_date_time TIMESTAMP,
    new_date_time TIMESTAMP,
    changed_by INTEGER REFERENCES users(id),
    change_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Create notification_preferences table
CREATE TABLE IF NOT EXISTS notification_preferences (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    email_notifications BOOLEAN DEFAULT true,
    sms_notifications BOOLEAN DEFAULT false,
    push_notifications BOOLEAN DEFAULT true,
    appointment_reminders BOOLEAN DEFAULT true,
    status_updates BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

-- 5. Create appointment_status_updates table for real-time tracking
CREATE TABLE IF NOT EXISTS appointment_status_updates (
    id SERIAL PRIMARY KEY,
    appointment_id INTEGER REFERENCES appointments(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL,
    message TEXT,
    updated_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_appointments_user_id ON appointments(user_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date_time ON appointments(date_time);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointment_history_appointment_id ON appointment_history(appointment_id);
CREATE INDEX IF NOT EXISTS idx_appointment_status_updates_appointment_id ON appointment_status_updates(appointment_id);

-- 7. Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 8. Create triggers for automatic timestamp updates
DROP TRIGGER IF EXISTS update_appointments_updated_at ON appointments;
CREATE TRIGGER update_appointments_updated_at
    BEFORE UPDATE ON appointments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_notification_preferences_updated_at ON notification_preferences;
CREATE TRIGGER update_notification_preferences_updated_at
    BEFORE UPDATE ON notification_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 9. Create function to log appointment changes
CREATE OR REPLACE FUNCTION log_appointment_changes()
RETURNS TRIGGER AS $$
BEGIN
    -- Only log if status or date_time changed
    IF (OLD.status IS DISTINCT FROM NEW.status) OR 
       (OLD.date_time IS DISTINCT FROM NEW.date_time) THEN
        
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
            OLD.date_time,
            NEW.date_time,
            CASE 
                WHEN OLD.status IS DISTINCT FROM NEW.status THEN 'Status changed'
                WHEN OLD.date_time IS DISTINCT FROM NEW.date_time THEN 'Rescheduled'
                ELSE 'Updated'
            END
        );
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 10. Create trigger for appointment change logging
DROP TRIGGER IF EXISTS log_appointment_changes ON appointments;
CREATE TRIGGER log_appointment_changes
    AFTER UPDATE ON appointments
    FOR EACH ROW
    EXECUTE FUNCTION log_appointment_changes();

-- 11. Insert default notification preferences for existing users
INSERT INTO notification_preferences (user_id)
SELECT id FROM users 
WHERE id NOT IN (SELECT user_id FROM notification_preferences);

-- 12. Add constraints for valid appointment statuses
ALTER TABLE appointments 
ADD CONSTRAINT IF NOT EXISTS valid_appointment_status 
CHECK (status IN ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled'));

-- 13. Create view for appointment details with joined data
CREATE OR REPLACE VIEW appointment_details AS
SELECT 
    a.id,
    a.user_id,
    a.pet_id,
    a.service_id,
    a.date_time,
    a.status,
    a.notes,
    a.created_at,
    a.updated_at,
    u.name as user_name,
    u.email as user_email,
    u.phone as user_phone,
    p.name as pet_name,
    p.breed as pet_breed,
    p.size as pet_size,
    s.name as service_name,
    s.price as service_price,
    s.duration as service_duration
FROM appointments a
LEFT JOIN users u ON a.user_id = u.id
LEFT JOIN pets p ON a.pet_id = p.id
LEFT JOIN services s ON a.service_id = s.id;