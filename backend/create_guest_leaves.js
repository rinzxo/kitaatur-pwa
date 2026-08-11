require('dotenv').config();
const { Client } = require('pg');

const client = new Client({
  connectionString: process.env.DATABASE_URL
});

async function run() {
  try {
    await client.connect();
    console.log('Connected to database');
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.guest_leaves (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
        guest_id UUID NOT NULL REFERENCES public.org_guests(id) ON DELETE CASCADE,
        type TEXT NOT NULL,
        date DATE NOT NULL,
        notes TEXT,
        proof_url TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);
    
    console.log('guest_leaves table created successfully');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

run();
