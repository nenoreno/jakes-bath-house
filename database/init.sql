-- Jake's Bath House Database Schema

-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    wash_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Pets table
CREATE TABLE pets (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    breed VARCHAR(255),
    size VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Services table
CREATE TABLE services (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    price DECIMAL(10,2),
    duration_minutes INTEGER,
    description TEXT,
    active BOOLEAN DEFAULT TRUE
);

-- Appointments table
CREATE TABLE appointments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    pet_id INTEGER REFERENCES pets(id) ON DELETE CASCADE,
    service_id INTEGER REFERENCES services(id),
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    status VARCHAR(50) DEFAULT 'confirmed',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Rewards table
CREATE TABLE rewards (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    points_earned INTEGER DEFAULT 0,
    points_used INTEGER DEFAULT 0,
    reward_type VARCHAR(255),
    claimed_at TIMESTAMP,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Staff schedule table
CREATE TABLE staff_schedule (
    id SERIAL PRIMARY KEY,
    day_of_week INTEGER NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    service_type VARCHAR(50) NOT NULL,
    active BOOLEAN DEFAULT TRUE
);

-- Insert sample services
INSERT INTO services (name, type, price, duration_minutes, description) VALUES
('Professional Grooming - Small Dog', 'groom', 45.00, 90, 'Full grooming service for small dogs'),
('Professional Grooming - Medium Dog', 'groom', 60.00, 120, 'Full grooming service for medium dogs'),
('Professional Grooming - Large Dog', 'groom', 75.00, 150, 'Full grooming service for large dogs'),
('DIY Wash Station', 'diy', 15.00, 60, 'Self-service wash with all supplies provided');

-- Insert staff schedule
INSERT INTO staff_schedule (day_of_week, start_time, end_time, service_type) VALUES
(1, '09:00', '18:00', 'groom'), -- Monday
(2, '09:00', '18:00', 'groom'), -- Tuesday  
(3, '09:00', '18:00', 'groom'), -- Wednesday
(4, '09:00', '18:00', 'groom'), -- Thursday
(5, '09:00', '18:00', 'groom'), -- Friday
(6, '09:00', '18:00', 'groom'), -- Saturday
(0, '07:00', '19:00', 'diy'),   -- Sunday DIY only
(1, '07:00', '19:00', 'diy'),   -- Monday DIY
(2, '07:00', '19:00', 'diy'),   -- Tuesday DIY
(3, '07:00', '19:00', 'diy'),   -- Wednesday DIY
(4, '07:00', '19:00', 'diy'),   -- Thursday DIY
(5, '07:00', '19:00', 'diy'),   -- Friday DIY
(6, '07:00', '19:00', 'diy');   -- Saturday DIY