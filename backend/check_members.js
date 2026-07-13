const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const sessionId = 'bd1bf910-e81f-476c-8cdb-7b106855a7f1';
  const session = await prisma.attendance_sessions.findUnique({ where: { id: sessionId } });
  
  const validOrgs = [session.organization_id, ...(session.shared_with_orgs || [])];
  console.log("Valid orgs:", validOrgs);

  const members = await prisma.organization_members.findMany({
      where: { organization_id: { in: validOrgs } },
      include: {
        profile: { select: { full_name: true, email: true, avatar_url: true } },
        organization: { select: { name: true } }
      }
  });
  
  console.log("Members count:", members.length);
  members.forEach(m => console.log(m.profile.full_name, m.organization.name));
}

check()
  .catch(console.error)
  .then(() => process.exit(0));
