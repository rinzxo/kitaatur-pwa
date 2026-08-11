const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  try {
    const org = await prisma.$queryRawUnsafe('SELECT id, name, edu_pin, is_edu FROM public.organizations WHERE id = $1::uuid', 'ee4d28ad-6e9c-4dcc-855c-8079263abb05');
    console.log(org);
  } catch(e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}
main();
