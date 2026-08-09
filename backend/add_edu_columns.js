const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addColumns() {
  try {
    console.log("Menambahkan kolom is_edu dan edu_pin secara manual...");
    
    // Check if is_edu exists
    try {
      await prisma.$queryRawUnsafe(`SELECT is_edu FROM public.organizations LIMIT 1`);
      console.log("Kolom is_edu sudah ada.");
    } catch (e) {
      await prisma.$executeRawUnsafe(`ALTER TABLE public.organizations ADD COLUMN is_edu BOOLEAN DEFAULT false;`);
      console.log("Berhasil menambahkan kolom is_edu.");
    }

    // Check if edu_pin exists
    try {
      await prisma.$queryRawUnsafe(`SELECT edu_pin FROM public.organizations LIMIT 1`);
      console.log("Kolom edu_pin sudah ada.");
    } catch (e) {
      await prisma.$executeRawUnsafe(`ALTER TABLE public.organizations ADD COLUMN edu_pin VARCHAR(10);`);
      console.log("Berhasil menambahkan kolom edu_pin.");
    }

    console.log("Selesai! Database berhasil diperbarui.");
  } catch (e) {
    console.error("Gagal menambahkan kolom:", e.message);
  } finally {
    await prisma.$disconnect();
  }
}

addColumns();
