const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const session = await prisma.attendance_sessions.findUnique({ where: { id: "04938645-ec7e-49b4-ab95-e8b83dd61536" } });
  if (!session) {
    const all = await prisma.attendance_sessions.findMany({ where: { title: { contains: "Sesi" } } });
    console.log("Found sessions:", all.map(s => s.id));
    return;
  }
  const validOrgs = [session.organization_id, ...(session.shared_with_orgs || [])];
  console.log("validOrgs:", validOrgs);

  const members = await prisma.organization_members.findMany({
    where: { organization_id: { in: validOrgs } },
    include: {
      profile: { select: { full_name: true, email: true } },
      organization: { select: { name: true } }
    }
  });

  console.log("members:", members.map(m => m.profile.full_name + " (" + m.organization.name + ")"));
}
main().catch(console.error).finally(() => prisma.$disconnect());
