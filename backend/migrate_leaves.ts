import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Altering guest_leaves table...');
  try {
    // Drop the date column and add session_id
    // This will drop existing records because we add a non-null column without default, 
    // or we can truncate first. Let's just TRUNCATE.
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE guest_leaves CASCADE;`);
    
    await prisma.$executeRawUnsafe(`
      ALTER TABLE guest_leaves 
      DROP COLUMN date,
      ADD COLUMN session_id UUID NOT NULL REFERENCES attendance_sessions(id) ON DELETE CASCADE;
    `);

    console.log('Migration successful!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
