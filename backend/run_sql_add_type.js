require('dotenv').config()
const { Client } = require('pg')

const client = new Client({
  connectionString: process.env.DATABASE_URL
})

async function run() {
  try {
    await client.connect()
    console.log('Connected to database')
    
    await client.query(`
      ALTER TABLE public.goal_transactions 
      ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'income';
    `)
    console.log('Added type column successfully')
  } catch (err) {
    console.error('Error:', err)
  } finally {
    await client.end()
  }
}

run()
