import dotenv from 'dotenv'
dotenv.config()
import { prisma } from './src/config/db'

async function test() {
  try {
    const profile = await prisma.profiles.findFirst()
    console.log('Profile fetch successful:', !!profile)
    const org = await prisma.organizations.findFirst()
    console.log('Org fetch successful:', !!org)
  } catch (e: any) {
    console.error('Error:', e.message)
  } finally {
    await prisma.$disconnect()
  }
}
test()
