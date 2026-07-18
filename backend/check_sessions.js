const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const sessions = await prisma.attendance_sessions.findMany({});
  console.log(sessions.map(s => ({
    title: s.title,
    start: s.start_time,
    end: s.end_time,
    active: s.is_active
  })));
}

main().finally(() => prisma.$disconnect());
