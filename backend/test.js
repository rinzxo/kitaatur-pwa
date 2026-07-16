const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const sessions = await prisma.attendance_sessions.findMany({ include: { organization: true } });
  console.log(JSON.stringify(sessions.map(s => ({
    title: s.title,
    org: s.organization.name,
    shared: s.shared_with_orgs,
    pending: s.pending_shared_orgs
  })), null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
