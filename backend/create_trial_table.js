const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  try {
    console.log('Creating trial_claims table...');
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS public.trial_claims (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        profile_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
        email VARCHAR(255) NOT NULL,
        ip_address VARCHAR(100),
        user_agent TEXT,
        claimed_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
        expires_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
      );
    `);

    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS idx_trial_claims_profile_id ON public.trial_claims(profile_id);
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS idx_trial_claims_email ON public.trial_claims(email);
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS idx_trial_claims_ip ON public.trial_claims(ip_address, created_at);
    `);

    console.log('trial_claims table created successfully!');
  } catch (err) {
    console.error('Error creating trial_claims table:', err);
  } finally {
    await prisma.$disconnect();
  }
}

run();
