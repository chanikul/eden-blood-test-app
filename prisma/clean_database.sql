-- Delete all existing orders first (to maintain referential integrity)
DELETE FROM "Order";

-- Delete all blood test products and prices
DELETE FROM "BloodTest";

-- Reset sequences if any exist
ALTER SEQUENCE IF EXISTS "Order_id_seq" RESTART WITH 1;
ALTER SEQUENCE IF EXISTS "BloodTest_id_seq" RESTART WITH 1;
