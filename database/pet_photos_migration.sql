-- Pet Photo Gallery Migration
-- Adds photo storage and management for pets

-- 1. Create pet_photos table
CREATE TABLE IF NOT EXISTS pet_photos (
    id SERIAL PRIMARY KEY,
    pet_id INTEGER REFERENCES pets(id) ON DELETE CASCADE,
    appointment_id INTEGER REFERENCES appointments(id) ON DELETE SET NULL,
    uploaded_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    photo_url VARCHAR(500) NOT NULL,
    photo_type VARCHAR(50) DEFAULT 'general', -- general, before_groom, after_groom, customer_upload
    caption TEXT,
    is_featured BOOLEAN DEFAULT FALSE,
    is_public BOOLEAN DEFAULT TRUE, -- Allow sharing in gallery
    file_size INTEGER, -- bytes
    file_type VARCHAR(20), -- jpg, png, etc
    upload_source VARCHAR(50) DEFAULT 'app', -- app, staff_portal, admin
    metadata JSONB, -- EXIF data, dimensions, etc
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Create photo_albums table for organizing photos
CREATE TABLE IF NOT EXISTS photo_albums (
    id SERIAL PRIMARY KEY,
    pet_id INTEGER REFERENCES pets(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    album_name VARCHAR(255) NOT NULL,
    description TEXT,
    cover_photo_id INTEGER REFERENCES pet_photos(id) ON DELETE SET NULL,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Create photo_likes table for engagement
CREATE TABLE IF NOT EXISTS photo_likes (
    id SERIAL PRIMARY KEY,
    photo_id INTEGER REFERENCES pet_photos(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(photo_id, user_id)
);

-- 4. Create photo_comments table
CREATE TABLE IF NOT EXISTS photo_comments (
    id SERIAL PRIMARY KEY,
    photo_id INTEGER REFERENCES pet_photos(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    comment_text TEXT NOT NULL,
    is_staff_comment BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Add photo count to pets table
ALTER TABLE pets ADD COLUMN IF NOT EXISTS photo_count INTEGER DEFAULT 0;

-- 6. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_pet_photos_pet_id ON pet_photos(pet_id);
CREATE INDEX IF NOT EXISTS idx_pet_photos_appointment_id ON pet_photos(appointment_id);
CREATE INDEX IF NOT EXISTS idx_pet_photos_type ON pet_photos(photo_type);
CREATE INDEX IF NOT EXISTS idx_pet_photos_created_at ON pet_photos(created_at);
CREATE INDEX IF NOT EXISTS idx_photo_albums_pet_id ON photo_albums(pet_id);
CREATE INDEX IF NOT EXISTS idx_photo_likes_photo_id ON photo_likes(photo_id);
CREATE INDEX IF NOT EXISTS idx_photo_comments_photo_id ON photo_comments(photo_id);

-- 7. Create function to update pet photo count
CREATE OR REPLACE FUNCTION update_pet_photo_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE pets SET photo_count = (
            SELECT COUNT(*) FROM pet_photos WHERE pet_id = NEW.pet_id
        ) WHERE id = NEW.pet_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE pets SET photo_count = (
            SELECT COUNT(*) FROM pet_photos WHERE pet_id = OLD.pet_id
        ) WHERE id = OLD.pet_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 8. Create trigger for photo count updates
DROP TRIGGER IF EXISTS trigger_update_pet_photo_count ON pet_photos;
CREATE TRIGGER trigger_update_pet_photo_count
    AFTER INSERT OR DELETE ON pet_photos
    FOR EACH ROW EXECUTE FUNCTION update_pet_photo_count();

-- 9. Create default albums for existing pets
INSERT INTO photo_albums (pet_id, user_id, album_name, description, is_default)
SELECT p.id, p.user_id, 'My Pet Photos', 'Default album for ' || p.name, TRUE
FROM pets p
WHERE NOT EXISTS (
    SELECT 1 FROM photo_albums pa WHERE pa.pet_id = p.id AND pa.is_default = TRUE
);

-- 10. Add business settings for photo features
INSERT INTO business_settings (category, setting_key, setting_value, data_type, description) VALUES
('photos', 'max_photo_size_mb', '10', 'number', 'Maximum photo file size in MB'),
('photos', 'allowed_formats', 'jpg,jpeg,png,webp', 'string', 'Allowed photo file formats'),
('photos', 'enable_public_gallery', 'true', 'boolean', 'Allow public pet photo gallery'),
('photos', 'enable_photo_sharing', 'true', 'boolean', 'Allow customers to share photos'),
('photos', 'auto_backup_photos', 'true', 'boolean', 'Automatically backup photos to cloud'),
('photos', 'watermark_staff_photos', 'true', 'boolean', 'Add Jake''s Bath House watermark to staff photos')
ON CONFLICT (category, setting_key) DO NOTHING;

-- 11. Create view for photo gallery with metadata
CREATE OR REPLACE VIEW photo_gallery_view AS
SELECT 
    pp.id,
    pp.pet_id,
    pp.appointment_id,
    pp.photo_url,
    pp.photo_type,
    pp.caption,
    pp.is_featured,
    pp.is_public,
    pp.created_at,
    p.name as pet_name,
    p.breed as pet_breed,
    p.size as pet_size,
    u.name as owner_name,
    staff.name as uploaded_by_name,
    a.appointment_date,
    s.name as service_name,
    (SELECT COUNT(*) FROM photo_likes pl WHERE pl.photo_id = pp.id) as like_count,
    (SELECT COUNT(*) FROM photo_comments pc WHERE pc.photo_id = pp.id) as comment_count
FROM pet_photos pp
JOIN pets p ON pp.pet_id = p.id
JOIN users u ON p.user_id = u.id
LEFT JOIN users staff ON pp.uploaded_by = staff.id
LEFT JOIN appointments a ON pp.appointment_id = a.id
LEFT JOIN services s ON a.service_id = s.id
WHERE pp.is_public = TRUE
ORDER BY pp.created_at DESC;

COMMENT ON TABLE pet_photos IS 'Photo storage for pets with before/after grooming photos';
COMMENT ON TABLE photo_albums IS 'Photo albums for organizing pet photos';
COMMENT ON TABLE photo_likes IS 'Photo engagement - likes from users';
COMMENT ON TABLE photo_comments IS 'Comments on pet photos';
COMMENT ON VIEW photo_gallery_view IS 'Complete photo gallery view with metadata';

\echo 'Pet photo gallery migration completed successfully!';
\echo 'Created tables: pet_photos, photo_albums, photo_likes, photo_comments';
\echo 'Added photo management features and public gallery view';
\echo 'Ready for photo uploads and before/after grooming photos';