const { Pool } = require('pg');

// Direct connection to Supabase
const pool = new Pool({
  user: 'postgres.dlzfhnnwyvddaoikrung',
  password: 'DNE8ytm_uyw1jbc*qbr',
  host: 'aws-0-eu-central-1.pooler.supabase.com',
  port: 6543,
  database: 'postgres',
  ssl: {
    rejectUnauthorized: false
  }
});

async function testConnection() {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    console.log('Database connection successful!');
    console.log('Current time from database:', result.rows[0].now);
    client.release();
  } catch (error) {
    console.error('Database connection failed:');
    console.error(error);
  } finally {
    await pool.end();
  }
}

testConnection();
