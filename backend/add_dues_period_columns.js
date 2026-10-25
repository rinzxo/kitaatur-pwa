const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addPeriodColumns() {
  try {
    console.log("Menambahkan kolom dues_start_period dan dues_end_period...");
    
    // Check if dues_start_period exists
    try {
      await prisma.$queryRawUnsafe(`SELECT dues_start_period FROM public.organizations LIMIT 1`);
      console.log("Kolom dues_start_period sudah ada.");
    } catch (e) {
      await prisma.$executeRawUnsafe(`ALTER TABLE public.organizations ADD COLUMN dues_start_period VARCHAR(7);`);
      console.log("Berhasil menambahkan kolom dues_start_period.");
    }

    // Check if dues_end_period exists
    try {
      await prisma.$queryRawUnsafe(`SELECT dues_end_period FROM public.organizations LIMIT 1`);
      console.log("Kolom dues_end_period sudah ada.");
    } catch (e) {
      await prisma.$executeRawUnsafe(`ALTER TABLE public.organizations ADD COLUMN dues_end_period VARCHAR(7);`);
      console.log("Berhasil menambahkan kolom dues_end_period.");
    }

    console.log("Selesai! Database berhasil diperbarui dengan kolom periode kas.");
  } catch (e) {
    console.error("Gagal menambahkan kolom:", e.message);
  } finally {
    await prisma.$disconnect();
  }
}

addPeriodColumns();
