-- First, delete the admin if it exists
DELETE FROM "Admin" WHERE email = 'admin@edenclinic.co.uk';

-- Then create a new admin with the correct hash
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
  '$2b$10$ryDt0GVFL/mo2iUDtsueZ.5yWixac.JRiuNl.zfH5qSI9k52vt2fK',
  'SUPER_ADMIN',
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);
