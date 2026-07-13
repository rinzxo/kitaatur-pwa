require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log("Running migration...");
    await prisma.$executeRawUnsafe(`ALTER TABLE attendance_sessions ADD COLUMN IF NOT EXISTS shared_with_orgs text[] DEFAULT '{}';`);
    await prisma.$executeRawUnsafe(`ALTER TABLE attendance_sessions ADD COLUMN IF NOT EXISTS pending_shared_orgs text[] DEFAULT '{}';`);
    console.log("Migration successful!");
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
