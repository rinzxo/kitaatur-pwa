import { prisma } from '../config/db'

async function main() {
  try {
    console.log('Creating school_linked_orgs table...')
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS public.school_linked_orgs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        school_org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
        linked_org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
        CONSTRAINT uq_school_linked_orgs UNIQUE (school_org_id, linked_org_id),
        CONSTRAINT chk_school_not_self CHECK (school_org_id != linked_org_id)
      );
    `)
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS idx_school_linked_orgs_child ON public.school_linked_orgs(linked_org_id);
    `)
    console.log('Successfully created school_linked_orgs table and indexes!')
  } catch (e) {
    console.error('Failed to create school_linked_orgs:', e)
  } finally {
    await prisma.$disconnect()
  }
}

main()
