const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const sessions = await prisma.attendance_sessions.findMany({
    where: { title: { contains: 'Collab' } }
  });
  console.log(JSON.stringify(sessions, null, 2));

  for (let s of sessions) {
     const members = await prisma.organization_members.findMany({
       where: { organization_id: { in: [s.organization_id, ...(s.shared_with_orgs || [])] } },
       include: { profile: true }
     });
     console.log('Members for session ' + s.title + ':', members.length);
     console.log(members.map(m => m.profile.full_name || m.profile.email));
  }
}

check()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
