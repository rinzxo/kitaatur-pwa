const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.vapjaqgoikyllyeuilfs:masukkitaatur@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres',
  ssl: { rejectUnauthorized: false }
});

async function main() {
  try {
    await client.connect();
    console.log('Connected to Supabase Postgres (Pooler)');

    const query = `
      ALTER TABLE "public"."organizations" 
      ADD COLUMN IF NOT EXISTS "dues_target_amount" DECIMAL(15,2), 
      ADD COLUMN IF NOT EXISTS "dues_presets" TEXT DEFAULT '10000,20000,50000,100000';
    `;
    
    await client.query(query);
    console.log('Migration successful: Added dues_target_amount and dues_presets to organizations table.');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await client.end();
  }
}

main();
