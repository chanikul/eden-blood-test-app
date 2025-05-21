$env:DATABASE_URL = "postgresql://postgres.dlzfhnnwyvddaoikrung:DNE8ytm_uyw1jbc*qbr@aws-0-eu-west-2.pooler.supabase.com:6543/postgres?pgbouncer=true"
npx prisma db execute --file ./prisma/migrations/20250521_fix_admin_user.sql --schema ./prisma/schema.prisma
