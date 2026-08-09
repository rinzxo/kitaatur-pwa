const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  try {
    const res = await prisma.$queryRawUnsafe(`SELECT is_edu, edu_pin FROM public.organizations LIMIT 1`);
    console.log("Success:", res);
  } catch (e) {
    console.error("Error:", e.message);
  } finally {
    await prisma.$disconnect();
  }
}

check();
