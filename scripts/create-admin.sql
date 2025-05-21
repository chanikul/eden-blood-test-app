-- First, delete any existing admin user
DELETE FROM "Admin" WHERE email = 'admin@edenclinic.co.uk';

-- Then create a new admin user with password hash for 'Admin123!'
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
  '$2a$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cGLcZEiGDMVr5yUP1KUOYTa',
  'SUPER_ADMIN',
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);
