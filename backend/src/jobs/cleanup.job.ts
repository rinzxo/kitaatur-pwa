import cron from 'node-cron';
import { prisma } from '../config/db';

/**
 * Auto-Retention Maintenance Job
 * Berjalan setiap hari pukul 02:00 WIB untuk membersihkan data usang/sampah
 * agar database tetap ramping dan tidak pernah melebihi kuota Supabase.
 */
export function initCleanupJob() {
  // Cron: Setiap hari pukul 02:00 pagi
  cron.schedule('0 2 * * *', async () => {
    try {
      console.log('[CLEANUP] Menjalankan pembersihan retensi data otomatis...');

      // 1. Hapus notifikasi yang sudah dibaca yang lebih tua dari 14 hari
      const deletedRead = await prisma.notifications.deleteMany({
        where: {
          is_read: true,
          created_at: {
            lt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
          }
        }
      });

      // 2. Hapus seluruh notifikasi (termasuk yang belum dibaca) yang lebih tua dari 30 hari
      const deletedOld = await prisma.notifications.deleteMany({
        where: {
          created_at: {
            lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        }
      });

      console.log(`[CLEANUP] Selesai: Dihapus ${deletedRead.count} notifikasi lama terbaca, ${deletedOld.count} notifikasi kadaluarsa (>30 hari).`);
    } catch (err) {
      console.error('[CLEANUP] Gagal menjalankan pembersihan data:', err);
    }
  });

  console.log('✅ Cron Jobs Auto-Retention pembersih data diinisialisasi.');
}
