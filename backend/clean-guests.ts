import * as dotenv from 'dotenv';
dotenv.config();
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function deleteAll() {
  await prisma.org_guests.deleteMany();
  console.log(`Deleted all guests for a fresh start.`);
}

deleteAll().catch(console.error).finally(() => prisma.$disconnect());
