import cron from 'node-cron';
import { prisma } from '../config/db';
import { sendPushNotification } from '../controllers/notification.controller';

// Set untuk melacak sesi mana saja yang sudah dikirimkan pengingat agar tidak spam
const remindedSessions = new Set<string>();

export function initJobs() {
  // Berjalan setiap 5 menit
  cron.schedule('*/5 * * * *', async () => {
    try {
      console.log('[CRON] Menjalankan pengecekan pengingat absen...');
      const now = new Date();
      // Batas peringatan: 60 menit sebelum end_time
      const reminderThreshold = new Date(now.getTime() + 60 * 60 * 1000); 

      // Cari sesi yang aktif dan akan segera berakhir (end_time antara sekarang dan 60 menit ke depan)
      const endingSessions = await prisma.attendance_sessions.findMany({
        where: {
          is_active: true,
          end_time: {
            gt: now,
            lte: reminderThreshold
          }
        },
        include: {
          organization: true
        }
      });

      for (const session of endingSessions) {
        // Jika sudah pernah diingatkan di memory cache, lewati
        if (remindedSessions.has(session.id)) continue;

        // Cari semua anggota organisasi
        const allMembers = await prisma.organization_members.findMany({
          where: { organization_id: session.organization_id }
        });

        // Cari anggota yang SUDAH absen di sesi ini
        const attendances = await prisma.attendance.findMany({
          where: { session_id: session.id }
        });

        const checkedInProfileIds = new Set(attendances.map(a => a.profile_id));

        let sentCount = 0;
        // Kirim notifikasi ke yang belum absen
        for (const member of allMembers) {
          if (!checkedInProfileIds.has(member.profile_id)) {
            await sendPushNotification(
              member.profile_id,
              'Waktu Absen Hampir Habis! ⏰',
              `Sesi "${session.title}" di ${session.organization.name} akan segera ditutup. Jangan lupa absen!`,
              `/org/${session.organization.slug}/attendance/scan`
            );
            sentCount++;
          }
        }

        console.log(`[CRON] Terkirim ${sentCount} pengingat untuk sesi ${session.title}`);
        
        // Tandai sesi ini sudah diingatkan
        remindedSessions.add(session.id);
      }

      // Bersihkan memory cache untuk sesi yang sudah benar-benar lewat (optimasi)
      const passedSessions = await prisma.attendance_sessions.findMany({
        where: {
          is_active: true,
          end_time: { lte: now }
        },
        select: { id: true }
      });
      for (const p of passedSessions) {
        remindedSessions.delete(p.id);
      }

    } catch (err) {
      console.error('[CRON] Error saat mengecek pengingat absen:', err);
    }
  });
  
  console.log('✅ Cron Jobs diinisialisasi.');
}
