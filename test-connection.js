const { Client } = require('pg');

const client = new Client({
  connectionString: process.env.DIRECT_URL,
  ssl: {
    rejectUnauthorized: false,
    ssl: true
  }
});

async function testConnection() {
  try {
    await client.connect();
    console.log('Connected successfully');
    const result = await client.query('SELECT NOW()');
    console.log('Query result:', result.rows[0]);
    await client.end();
  } catch (err) {
    console.error('Connection error:', err);
  }
}

testConnection();
