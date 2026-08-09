import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
prisma.$queryRawUnsafe('SELECT 1').then(console.log).catch(console.error).finally(()=>prisma.$disconnect());
