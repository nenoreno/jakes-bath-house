-- Admin System Migration
-- Adds admin users, roles, permissions, and business settings

-- 1. Add role and permissions to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'customer';
ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMP;

-- 2. Create admin_users table for staff management
CREATE TABLE IF NOT EXISTS admin_users (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL DEFAULT 'staff',
    permissions TEXT[], -- Array of permissions
    hired_date DATE,
    salary DECIMAL(10,2),
    notes TEXT,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Create roles table
CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    permissions TEXT[], -- Array of permissions
    color VARCHAR(20) DEFAULT 'bg-gray-500',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Create business_settings table
CREATE TABLE IF NOT EXISTS business_settings (
    id SERIAL PRIMARY KEY,
    category VARCHAR(50) NOT NULL,
    setting_key VARCHAR(100) NOT NULL,
    setting_value TEXT,
    data_type VARCHAR(20) DEFAULT 'string', -- string, number, boolean, json
    description TEXT,
    updated_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(category, setting_key)
);

-- 5. Create audit_logs table for tracking changes
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    table_name VARCHAR(50),
    record_id INTEGER,
    old_data JSONB,
    new_data JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Insert default roles
INSERT INTO roles (name, display_name, description, permissions, color) VALUES
('super_admin', 'Super Admin', 'Full system access', 
 ARRAY['all'], 'bg-red-500')
ON CONFLICT (name) DO NOTHING;

INSERT INTO roles (name, display_name, description, permissions, color) VALUES
('manager', 'Manager', 'Business operations management', 
 ARRAY['staff_management', 'appointment_management', 'customer_management', 'service_management', 'financial_reports', 'analytics', 'business_settings'], 'bg-blue-500')
ON CONFLICT (name) DO NOTHING;

INSERT INTO roles (name, display_name, description, permissions, color) VALUES
('staff', 'Staff', 'Day-to-day operations', 
 ARRAY['appointment_management', 'customer_service', 'pet_management', 'basic_reports', 'schedule_view'], 'bg-green-500')
ON CONFLICT (name) DO NOTHING;

INSERT INTO roles (name, display_name, description, permissions, color) VALUES
('viewer', 'Viewer', 'Read-only access', 
 ARRAY['schedule_view', 'customer_lookup', 'basic_reports'], 'bg-gray-500')
ON CONFLICT (name) DO NOTHING;

-- 7. Insert default business settings
INSERT INTO business_settings (category, setting_key, setting_value, data_type, description) VALUES
('business_hours', 'monday', '{"start": "09:00", "end": "18:00", "closed": false}', 'json', 'Monday business hours'),
('business_hours', 'tuesday', '{"start": "09:00", "end": "18:00", "closed": false}', 'json', 'Tuesday business hours'),
('business_hours', 'wednesday', '{"start": "09:00", "end": "18:00", "closed": false}', 'json', 'Wednesday business hours'),
('business_hours', 'thursday', '{"start": "09:00", "end": "18:00", "closed": false}', 'json', 'Thursday business hours'),
('business_hours', 'friday', '{"start": "09:00", "end": "18:00", "closed": false}', 'json', 'Friday business hours'),
('business_hours', 'saturday', '{"start": "09:00", "end": "17:00", "closed": false}', 'json', 'Saturday business hours'),
('business_hours', 'sunday', '{"start": "10:00", "end": "16:00", "closed": false}', 'json', 'Sunday business hours')
ON CONFLICT (category, setting_key) DO NOTHING;

INSERT INTO business_settings (category, setting_key, setting_value, data_type, description) VALUES
('security', 'session_timeout', '30', 'number', 'Session timeout in minutes'),
('security', 'two_factor_auth', 'true', 'boolean', 'Two-factor authentication enabled'),
('security', 'password_min_length', '6', 'number', 'Minimum password length'),
('notifications', 'email_notifications', 'true', 'boolean', 'Email notifications enabled'),
('notifications', 'sms_notifications', 'false', 'boolean', 'SMS notifications enabled'),
('business', 'business_name', 'Jake''s Bath House', 'string', 'Business name'),
('business', 'phone', '(561) 812-3931', 'string', 'Business phone number'),
('business', 'address', '606 Royal Palm Beach Blvd, Royal Palm Beach, FL 33411', 'string', 'Business address'),
('business', 'timezone', 'America/New_York', 'string', 'Business timezone')
ON CONFLICT (category, setting_key) DO NOTHING;

-- 8. Create admin users for existing users
-- Make the ant@test.com user a super admin
UPDATE users SET role = 'super_admin' WHERE email = 'ant@test.com';

-- Insert some staff users for demo
INSERT INTO users (name, email, phone, password, role, created_at) VALUES
('Jake (Owner)', 'jake@jakesbathhouse.com', '(561) 812-3931', '$2a$10$dummy.hash.for.staff.user', 'manager', CURRENT_TIMESTAMP),
('Sarah (Groomer)', 'sarah@jakesbathhouse.com', '(561) 555-0101', '$2a$10$dummy.hash.for.staff.user', 'staff', CURRENT_TIMESTAMP),
('Mike (Assistant)', 'mike@jakesbathhouse.com', '(561) 555-0102', '$2a$10$dummy.hash.for.staff.user', 'staff', CURRENT_TIMESTAMP),
('Lisa (Part-time)', 'lisa@jakesbathhouse.com', '(561) 555-0103', '$2a$10$dummy.hash.for.staff.user', 'viewer', CURRENT_TIMESTAMP)
ON CONFLICT (email) DO NOTHING;

-- Create admin_users entries for staff
INSERT INTO admin_users (user_id, role, hired_date, notes, created_by)
SELECT u.id, u.role, CURRENT_DATE - INTERVAL '6 months', 'Demo staff member', 
       (SELECT id FROM users WHERE email = 'ant@test.com' LIMIT 1)
FROM users u 
WHERE u.role IN ('manager', 'staff', 'viewer')
ON CONFLICT DO NOTHING;

-- 9. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_business_settings_category ON business_settings(category);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- 10. Update trigger function for audit logging
CREATE OR REPLACE FUNCTION log_data_changes()
RETURNS TRIGGER AS $$
BEGIN
    -- Log all changes to important tables
    IF TG_TABLE_NAME IN ('users', 'appointments', 'services', 'business_settings') THEN
        INSERT INTO audit_logs (user_id, action, table_name, record_id, old_data, new_data)
        VALUES (
            COALESCE(current_setting('app.current_user_id', true)::INTEGER, 1),
            TG_OP,
            TG_TABLE_NAME,
            COALESCE(NEW.id, OLD.id),
            CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE NULL END,
            CASE WHEN TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN to_jsonb(NEW) ELSE NULL END
        );
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create triggers for audit logging
DROP TRIGGER IF EXISTS audit_users_changes ON users;
CREATE TRIGGER audit_users_changes
    AFTER INSERT OR UPDATE OR DELETE ON users
    FOR EACH ROW EXECUTE FUNCTION log_data_changes();

DROP TRIGGER IF EXISTS audit_business_settings_changes ON business_settings;
CREATE TRIGGER audit_business_settings_changes
    AFTER INSERT OR UPDATE OR DELETE ON business_settings
    FOR EACH ROW EXECUTE FUNCTION log_data_changes();

COMMENT ON TABLE admin_users IS 'Staff management and admin user details';
COMMENT ON TABLE roles IS 'Role definitions with permissions';
COMMENT ON TABLE business_settings IS 'Configurable business settings';
COMMENT ON TABLE audit_logs IS 'Audit trail for system changes';

\echo 'Admin system migration completed successfully!';
\echo 'Created tables: admin_users, roles, business_settings, audit_logs';
\echo 'Added roles and permissions system';
\echo 'Inserted default business settings';
\echo 'Created demo staff users';