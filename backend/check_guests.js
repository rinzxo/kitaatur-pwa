const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkGuests() {
  try {
    const guests = await prisma.org_guests.findMany({
      select: { identifier: true, name: true, organization: { select: { slug: true } } },
      take: 5
    });
    console.log("Guests in DB:", guests);
  } catch (e) {
    console.error("Error:", e.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkGuests();
