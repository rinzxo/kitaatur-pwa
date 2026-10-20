import fs from 'fs'
import path from 'path'
import { prisma } from '../config/db'

async function run() {
  console.log('Starting index application...')
  const sqlPath = path.resolve(__dirname, '../../../optimize_indexes.sql')
  const sqlContent = fs.readFileSync(sqlPath, 'utf8')

  // Split statements by semicolon
  const statements = sqlContent
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'))

  for (const statement of statements) {
    // Extract index name or preview
    const firstLine = statement.split('\n')[0].trim()
    try {
      console.log(`Executing: ${firstLine}`)
      await prisma.$executeRawUnsafe(statement)
      console.log(`✅ Success: ${firstLine}`)
    } catch (err: any) {
      console.error(`❌ Error on: ${firstLine}`, err.message)
    }
  }

  console.log('All indexes processed successfully!')
  await prisma.$disconnect()
}

run().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
