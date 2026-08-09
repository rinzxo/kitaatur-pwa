import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Creating tables...');

  try {
    // 1. Create org_guests
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "public"."org_guests" (
        "id" UUID NOT NULL DEFAULT gen_random_uuid(),
        "organization_id" UUID NOT NULL,
        "name" TEXT NOT NULL,
        "identifier" TEXT NOT NULL,
        "qr_token" UUID NOT NULL DEFAULT gen_random_uuid(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "org_guests_pkey" PRIMARY KEY ("id")
      );
    `);
    
    // Create unique constraint if not exists
    await prisma.$executeRawUnsafe(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'org_guests_qr_token_key') THEN
          ALTER TABLE "public"."org_guests" ADD CONSTRAINT "org_guests_qr_token_key" UNIQUE ("qr_token");
        END IF;
      END $$;
    `);

    // Create foreign key if not exists
    await prisma.$executeRawUnsafe(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'org_guests_organization_id_fkey') THEN
          ALTER TABLE "public"."org_guests" ADD CONSTRAINT "org_guests_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;
      END $$;
    `);

    console.log('org_guests created');

    // 2. Create guest_attendance
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "public"."guest_attendance" (
        "id" UUID NOT NULL DEFAULT gen_random_uuid(),
        "session_id" UUID NOT NULL,
        "guest_id" UUID NOT NULL,
        "check_in_time" TIMESTAMPTZ NOT NULL,
        "check_in_location" JSONB,
        "status" TEXT NOT NULL DEFAULT 'present',
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "guest_attendance_pkey" PRIMARY KEY ("id")
      );
    `);
    
    await prisma.$executeRawUnsafe(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'guest_attendance_session_id_guest_id_key') THEN
          ALTER TABLE "public"."guest_attendance" ADD CONSTRAINT "guest_attendance_session_id_guest_id_key" UNIQUE ("session_id", "guest_id");
        END IF;
      END $$;
    `);
    
    await prisma.$executeRawUnsafe(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'guest_attendance_session_id_fkey') THEN
          ALTER TABLE "public"."guest_attendance" ADD CONSTRAINT "guest_attendance_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."attendance_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'guest_attendance_guest_id_fkey') THEN
          ALTER TABLE "public"."guest_attendance" ADD CONSTRAINT "guest_attendance_guest_id_fkey" FOREIGN KEY ("guest_id") REFERENCES "public"."org_guests"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;
      END $$;
    `);

    console.log('guest_attendance created');

    // 3. Create attendance_schedules
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "public"."attendance_schedules" (
        "id" UUID NOT NULL DEFAULT gen_random_uuid(),
        "organization_id" UUID NOT NULL,
        "created_by" UUID NOT NULL,
        "title" TEXT NOT NULL DEFAULT 'Sesi Rutin',
        "session_type" TEXT NOT NULL DEFAULT 'in_only',
        "days_of_week" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
        "start_time" TEXT NOT NULL,
        "late_time" TEXT,
        "end_time" TEXT NOT NULL,
        "latitude" DECIMAL(65,30) NOT NULL,
        "longitude" DECIMAL(65,30) NOT NULL,
        "radius_meters" INTEGER NOT NULL DEFAULT 50,
        "is_active" BOOLEAN NOT NULL DEFAULT true,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "attendance_schedules_pkey" PRIMARY KEY ("id")
      );
    `);
    
    await prisma.$executeRawUnsafe(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'attendance_schedules_organization_id_fkey') THEN
          ALTER TABLE "public"."attendance_schedules" ADD CONSTRAINT "attendance_schedules_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'attendance_schedules_created_by_fkey') THEN
          ALTER TABLE "public"."attendance_schedules" ADD CONSTRAINT "attendance_schedules_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
        END IF;
      END $$;
    `);

    console.log('attendance_schedules created');
    
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
