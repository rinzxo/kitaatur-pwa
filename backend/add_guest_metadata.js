const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addCustomDataColumn() {
  try {
    console.log("Menambahkan kolom custom_data ke org_guests...");
    
    try {
      await prisma.$queryRawUnsafe(`SELECT custom_data FROM public.org_guests LIMIT 1`);
      console.log("Kolom custom_data sudah ada.");
    } catch (e) {
      await prisma.$executeRawUnsafe(`ALTER TABLE public.org_guests ADD COLUMN custom_data JSONB;`);
      console.log("Berhasil menambahkan kolom custom_data ke org_guests.");
    }

    console.log("Selesai! Database berhasil diperbarui.");
  } catch (e) {
    console.error("Gagal menambahkan kolom:", e.message);
  } finally {
    await prisma.$disconnect();
  }
}

addCustomDataColumn();
