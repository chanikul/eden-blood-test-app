-- First, delete any existing admin user
DELETE FROM "Admin" WHERE email = 'admin@edenclinic.co.uk';

-- Then create a new admin with a known password hash
INSERT INTO "Admin" (
    id,
    email,
    name,
    "passwordHash",
    role,
    active,
    "createdAt",
    "updatedAt"
) VALUES (
    'cln1234567890',
    'admin@edenclinic.co.uk',
    'Admin User',
    -- This is the hash for password: Admin123!
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
    'SUPER_ADMIN',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);
