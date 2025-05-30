UPDATE "Admin" 
SET "passwordHash" = '$2b$10$ryDt0GVFL/mo2iUDtsueZ.5yWixac.JRiuNl.zfH5qSI9k52vt2fK',
    "updatedAt" = CURRENT_TIMESTAMP 
WHERE email = 'admin@edenclinic.co.uk';
