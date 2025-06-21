# Eden Clinic Web App - Reusable Prompt Instructions
# Purpose: Track reusable prompt instructions for Eden Clinic Web App
# Platform: Next.js (frontend), Supabase (prod), Firebase emulator (dev)

## Supabase Row-Level Security (RLS) Policies

### TestResult Table

```sql
-- Enable RLS on TestResult table
ALTER TABLE "TestResult" ENABLE ROW LEVEL SECURITY;

-- Create policy for clients to see only their own test results
CREATE POLICY "clients_can_view_own_test_results" 
ON "TestResult"
FOR SELECT
TO authenticated
USING (
  auth.uid()::text = "clientId"
);

-- Create policy for admins to see all test results
CREATE POLICY "admins_can_view_all_test_results" 
ON "TestResult"
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM "Admin"
    WHERE "id" = auth.uid()::text
  )
);
```

### Order Table

```sql
-- Enable RLS on Order table
ALTER TABLE "Order" ENABLE ROW LEVEL SECURITY;

-- Create policy for clients to access only their own orders
CREATE POLICY "clients_can_view_own_orders" 
ON "Order"
FOR SELECT
TO authenticated
USING (
  auth.uid()::text = "clientId"
);

-- Create policy for admins to access all orders
CREATE POLICY "admins_can_access_all_orders" 
ON "Order"
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM "Admin"
    WHERE "id" = auth.uid()::text
  )
);
```

### Address Table

```sql
-- Enable RLS on Address table
ALTER TABLE "Address" ENABLE ROW LEVEL SECURITY;

-- Create policy for clients to see and modify only their own addresses
CREATE POLICY "clients_can_manage_own_addresses" 
ON "Address"
FOR ALL
TO authenticated
USING (
  auth.uid()::text = "clientId"
);

-- Create policy for admins to access any address
CREATE POLICY "admins_can_access_all_addresses" 
ON "Address"
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM "Admin"
    WHERE "id" = auth.uid()::text
  )
);
```

### ClientUser Table

```sql
-- Enable RLS on ClientUser table
ALTER TABLE "ClientUser" ENABLE ROW LEVEL SECURITY;

-- Create policy for clients to SELECT only their own row
CREATE POLICY "clients_can_view_own_profile" 
ON "ClientUser"
FOR SELECT
TO authenticated
USING (
  auth.uid()::text = id
);

-- Create policy for admins to access any client row
CREATE POLICY "admins_can_access_all_clients" 
ON "ClientUser"
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM "Admin"
    WHERE "id" = auth.uid()::text
  )
);
```
