$env:DATABASE_URL = "postgresql://postgres.dlzfhnnwyvddaoikrung:DNE8ytm_uyw1jbc*qbr@aws-0-eu-west-2.pooler.supabase.com:5432/postgres"

# Run the SQL script using psql
$env:PGPASSWORD = "DNE8ytm_uyw1jbc*qbr"
psql -h aws-0-eu-west-2.pooler.supabase.com -U postgres.dlzfhnnwyvddaoikrung -d postgres -f ./scripts/recreate-admin-final.sql
