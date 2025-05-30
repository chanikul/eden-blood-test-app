-- Check if admin exists and get their details
SELECT id, email, role, active, "passwordHash"
FROM "Admin"
WHERE email = 'admin@edenclinic.co.uk';
