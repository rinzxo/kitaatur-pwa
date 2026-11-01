import cron from 'node-cron';
import { prisma } from '../config/db';
import { sendPushNotification } from '../controllers/notification.controller';

/**
 * Job Pengingat Presensi Otomatis
 * Mengirimkan notifikasi pengingat HANYA SEKALI (anti-spam) tepat:
 * - 20 menit sebelum waktu dinyatakan telat (jika sesi memiliki late_time)
 * - ATAU 20 menit sebelum sesi ditutup (end_time) jika tidak ada batas telat
 */
export function initJobs() {
  // Dijalankan setiap 2 menit untuk menangkap jendela 20 menit secara presisi
  cron.schedule('*/2 * * * *', async () => {
    try {
      const now = new Date();
      // Batas waktu pengingat: 20 menit ke depan
      const reminderWindowMs = 20 * 60 * 1000;
      const reminderThreshold = new Date(now.getTime() + reminderWindowMs);

      // Cari sesi yang sedang aktif dan belum pernah dikirimkan pengingat
      const activeSessions = await prisma.attendance_sessions.findMany({
        where: {
          is_active: true,
          reminder_sent: false,
          end_time: {
            gt: now
          }
        },
        include: {
          organization: {
            select: {
              id: true,
              name: true,
              slug: true
            }
          }
        }
      });

      for (const session of activeSessions) {
        // Tentukan batas waktu sasaran pengingat:
        // Prioritaskan late_time jika ada dan masih di masa depan, jika tidak gunakan end_time
        let targetTime: Date;
        let isLateReminder = false;

        if (session.late_time && new Date(session.late_time) > now) {
          targetTime = new Date(session.late_time);
          isLateReminder = true;
        } else {
          targetTime = new Date(session.end_time);
          isLateReminder = false;
        }

        // Cek apakah targetTime sudah memasuki jendela 20 menit (antara sekarang dan 20 menit ke depan)
        if (targetTime > now && targetTime <= reminderThreshold) {
          // Cari semua anggota organisasi
          const allMembers = await prisma.organization_members.findMany({
            where: { organization_id: session.organization_id },
            select: { profile_id: true }
          });

          // Cari anggota yang SUDAH absen di sesi ini
          const attendances = await prisma.attendance.findMany({
            where: { session_id: session.id },
            select: { profile_id: true }
          });

          const checkedInProfileIds = new Set(attendances.map(a => a.profile_id));

          const title = isLateReminder
            ? 'Pengingat Presensi: 20 Menit Menuju Batas Telat'
            : 'Pengingat Presensi: 20 Menit Sebelum Sesi Ditutup';

          const message = isLateReminder
            ? `Sesi "${session.title}" di ${session.organization.name} akan memasuki batas waktu telat dalam 20 menit. Segera absen agar hadir tepat waktu!`
            : `Sesi "${session.title}" di ${session.organization.name} akan segera ditutup dalam 20 menit. Segera lakukan presensi sebelum sesi berakhir!`;

          let sentCount = 0;
          // Kirim web push notification HANYA ke anggota yang belum presensi
          for (const member of allMembers) {
            if (!checkedInProfileIds.has(member.profile_id)) {
              await sendPushNotification(
                member.profile_id,
                title,
                message,
                `/org/${session.organization.slug}/attendance/scan`,
                false // Jangan simpan ke database tabel notifications agar tidak spam
              );
              sentCount++;
            }
          }

          console.log(`[CRON Reminder] Terkirim ${sentCount} pengingat untuk sesi "${session.title}" (${isLateReminder ? '20 menit menuju batas telat' : '20 menit sebelum sesi ditutup'})`);

          // Tandai sesi ini sudah diingatkan secara permanen di database agar tidak berulang
          await prisma.attendance_sessions.update({
            where: { id: session.id },
            data: { reminder_sent: true }
          });
        }
      }

    } catch (err) {
      console.error('[CRON Reminder] Error saat mengecek pengingat absen:', err);
    }
  });

  console.log('✅ Cron Jobs pengingat absen diinisialisasi (20 menit sebelum telat / sebelum ditutup).');
}
