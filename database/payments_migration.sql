-- Payment System Migration
-- Adds payment processing capabilities

-- 1. Create payments table
CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    appointment_id INTEGER REFERENCES appointments(id) ON DELETE SET NULL,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    stripe_payment_id VARCHAR(255) UNIQUE NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'usd',
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, succeeded, failed, canceled, refunded
    payment_type VARCHAR(20) DEFAULT 'full', -- full, deposit
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Add payment_id to appointments table
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS payment_id INTEGER REFERENCES payments(id);

-- 3. Add service pricing information for dynamic pricing
ALTER TABLE services ADD COLUMN IF NOT EXISTS deposit_percentage INTEGER DEFAULT 0; -- 0-100, percentage for deposits
ALTER TABLE services ADD COLUMN IF NOT EXISTS requires_deposit BOOLEAN DEFAULT FALSE;

-- 4. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_appointment_id ON payments(appointment_id);
CREATE INDEX IF NOT EXISTS idx_payments_stripe_id ON payments(stripe_payment_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_payment_id ON appointments(payment_id);

-- 5. Update services with deposit requirements
UPDATE services SET 
    requires_deposit = TRUE,
    deposit_percentage = 50
WHERE type = 'groom';

UPDATE services SET 
    requires_deposit = FALSE,
    deposit_percentage = 0
WHERE type = 'diy';

-- 6. Add business settings for Stripe
INSERT INTO business_settings (category, setting_key, setting_value, data_type, description) VALUES
('payment', 'stripe_publishable_key', '', 'string', 'Stripe publishable key'),
('payment', 'stripe_secret_key', '', 'string', 'Stripe secret key (encrypted)'),
('payment', 'payment_enabled', 'false', 'boolean', 'Enable payment processing'),
('payment', 'deposit_enabled', 'true', 'boolean', 'Enable deposit payments for grooming'),
('payment', 'currency', 'usd', 'string', 'Payment currency'),
('payment', 'business_name', 'Jake''s Bath House', 'string', 'Business name for payments')
ON CONFLICT (category, setting_key) DO NOTHING;

-- 7. Create payment audit function
CREATE OR REPLACE FUNCTION log_payment_changes()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO audit_logs (user_id, action, table_name, record_id, old_data, new_data, created_at)
    VALUES (
        COALESCE(NEW.user_id, OLD.user_id),
        TG_OP,
        'payments',
        COALESCE(NEW.id, OLD.id),
        CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE NULL END,
        CASE WHEN TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN to_jsonb(NEW) ELSE NULL END,
        CURRENT_TIMESTAMP
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- 8. Create trigger for payment auditing
DROP TRIGGER IF EXISTS audit_payments_changes ON payments;
CREATE TRIGGER audit_payments_changes
    AFTER INSERT OR UPDATE OR DELETE ON payments
    FOR EACH ROW EXECUTE FUNCTION log_payment_changes();

-- 9. Create function to calculate deposit amount
CREATE OR REPLACE FUNCTION calculate_deposit_amount(service_id INTEGER)
RETURNS DECIMAL(10,2) AS $$
DECLARE
    service_price DECIMAL(10,2);
    deposit_percentage INTEGER;
    deposit_amount DECIMAL(10,2);
BEGIN
    SELECT price, COALESCE(services.deposit_percentage, 0)
    INTO service_price, deposit_percentage
    FROM services 
    WHERE id = service_id;
    
    IF deposit_percentage > 0 THEN
        deposit_amount := ROUND(service_price * (deposit_percentage::DECIMAL / 100), 2);
    ELSE
        deposit_amount := service_price;
    END IF;
    
    RETURN deposit_amount;
END;
$$ LANGUAGE plpgsql;

-- 10. Create view for payment reporting
CREATE OR REPLACE VIEW payment_summary AS
SELECT 
    p.id,
    p.stripe_payment_id,
    p.amount,
    p.currency,
    p.status,
    p.payment_type,
    p.created_at,
    u.name as customer_name,
    u.email as customer_email,
    CASE 
        WHEN p.appointment_id IS NOT NULL THEN 
            (SELECT s.name FROM appointments a JOIN services s ON a.service_id = s.id WHERE a.id = p.appointment_id)
        ELSE 'Direct Payment'
    END as service_name,
    CASE 
        WHEN p.appointment_id IS NOT NULL THEN 
            (SELECT pt.name FROM appointments a JOIN pets pt ON a.pet_id = pt.id WHERE a.id = p.appointment_id)
        ELSE NULL
    END as pet_name
FROM payments p
JOIN users u ON p.user_id = u.id
ORDER BY p.created_at DESC;

COMMENT ON TABLE payments IS 'Payment transactions processed through Stripe';
COMMENT ON COLUMN payments.stripe_payment_id IS 'Stripe Payment Intent ID';
COMMENT ON COLUMN payments.payment_type IS 'full payment or deposit only';
COMMENT ON FUNCTION calculate_deposit_amount IS 'Calculate deposit amount based on service pricing';

\echo 'Payment system migration completed successfully!';
\echo 'Created payments table and related functions';
\echo 'Updated services with deposit requirements';
\echo 'Added Stripe configuration settings';