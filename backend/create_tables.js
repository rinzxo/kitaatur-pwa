const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS public.system_settings (
        key VARCHAR PRIMARY KEY,
        value JSONB NOT NULL,
        description TEXT,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    console.log("system_settings created");

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS public.announcements (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR NOT NULL,
        content TEXT NOT NULL,
        type VARCHAR NOT NULL DEFAULT 'info',
        is_active BOOLEAN NOT NULL DEFAULT true,
        starts_at TIMESTAMPTZ,
        ends_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    console.log("announcements created");

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS public.feature_flags (
        key VARCHAR PRIMARY KEY,
        is_enabled BOOLEAN NOT NULL DEFAULT false,
        description TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    console.log("feature_flags created");

  } catch (e) {
    console.error("Error creating tables:", e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
