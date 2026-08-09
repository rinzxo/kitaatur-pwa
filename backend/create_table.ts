import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  try {
    await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS public.guest_attendees CASCADE;`);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS public.org_guests (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        identifier TEXT NOT NULL,
        qr_token UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS public.guest_attendance (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        session_id UUID NOT NULL REFERENCES public.attendance_sessions(id) ON DELETE CASCADE,
        guest_id UUID NOT NULL REFERENCES public.org_guests(id) ON DELETE CASCADE,
        status public.attendance_status NOT NULL DEFAULT 'present',
        check_in_time TIMESTAMPTZ NOT NULL DEFAULT now(),
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        UNIQUE(session_id, guest_id)
      );
    `);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS public.attendance_schedules (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
        created_by UUID NOT NULL REFERENCES public.profiles(id),
        title TEXT NOT NULL DEFAULT 'Sesi Rutin',
        session_type TEXT NOT NULL DEFAULT 'in_only',
        latitude FLOAT NOT NULL,
        longitude FLOAT NOT NULL,
        radius_meters INTEGER NOT NULL DEFAULT 50,
        days_of_week INTEGER[] NOT NULL,
        start_time TEXT NOT NULL,
        end_time TEXT NOT NULL,
        late_time TEXT,
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);
    console.log('Tables created successfully');
  } catch (error) {
    console.error('Error creating tables:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
