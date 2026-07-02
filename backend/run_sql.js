const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.vapjaqgoikyllyeuilfs:masukkitaatur@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true'
});

async function run() {
  try {
    await client.connect();
    console.log('Connected to database');
    
    await client.query(`
      ALTER TABLE public.goal_transactions 
      ADD COLUMN IF NOT EXISTS description TEXT;
    `);
    
    console.log('goal_transactions table created successfully');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

run();
