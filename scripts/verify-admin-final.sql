-- Check if admin exists and get their details
SELECT 
    id,
    email,
    "passwordHash",
    role,
    active,
    "createdAt",
    "updatedAt"
FROM "Admin"
WHERE email = 'admin@edenclinic.co.uk';
