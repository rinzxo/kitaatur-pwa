import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  try {
    await prisma.$executeRawUnsafe(`ALTER TYPE org_member_role ADD VALUE IF NOT EXISTS 'auditor';`)
    console.log('Successfully added auditor to org_member_role')
  } catch (e) {
    console.error('Failed to add auditor:', e)
  } finally {
    await prisma.$disconnect()
  }
}

main()
