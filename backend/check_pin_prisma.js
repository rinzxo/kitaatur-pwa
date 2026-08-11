const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  try {
    const org = await prisma.organizations.findUnique({
      where: { id: 'ee4d28ad-6e9c-4dcc-855c-8079263abb05', is_edu: true },
      select: { edu_pin: true, id: true }
    });
    console.log(org);
    console.log('type of edu_pin:', typeof org.edu_pin);
    console.log('edu_pin === "123456":', org.edu_pin === "123456");
  } catch(e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}
main();
