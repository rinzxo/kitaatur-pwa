require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS payment_url TEXT;`);
    console.log("Successfully added payment_url column");
  } catch (err) {
    console.error("Error adding column:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
