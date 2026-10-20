import { prisma } from '../config/db'

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
