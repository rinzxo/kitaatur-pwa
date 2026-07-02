const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const subs = await prisma.push_subscriptions.findMany();
  console.log('Subscriptions:', subs.length);
  const notifs = await prisma.notifications.findMany({
    orderBy: { created_at: 'desc' },
    take: 5
  });
  console.log('Recent Notifs:', notifs.length);
  process.exit(0);
}
main();
