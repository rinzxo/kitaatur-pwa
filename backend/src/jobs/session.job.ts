import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Function to generate a random 4-digit PIN
const generatePin = () => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};

/**
 * Memastikan sesi dari jadwal otomatis (attendance_schedules) untuk hari ini
 * sudah dibuat di awal hari (sebelum sesi dimulai) agar anggota dan sekretaris
 * bisa mengajukan atau mencatat izin/sakit lebih awal.
 */
export const ensureTodayScheduledSessions = async (organizationId?: string) => {
  try {
    const nowWIB = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
    const currentDay = nowWIB.getDay(); // 0 = Sunday, 1 = Monday...
    
    const hours = String(nowWIB.getHours()).padStart(2, '0');
    const minutes = String(nowWIB.getMinutes()).padStart(2, '0');
    const currentTimeStr = `${hours}:${minutes}`;

    const startOfDay = new Date(nowWIB);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(nowWIB);
    endOfDay.setHours(23, 59, 59, 999);

    const whereClause: any = {
      is_active: true,
      days_of_week: { has: currentDay }
    };

    if (organizationId) {
      whereClause.organization_id = organizationId;
    }

    // Otomatis update is_active = false untuk sesi yang waktunya sudah berakhir
    await prisma.attendance_sessions.updateMany({
      where: {
        is_active: true,
        end_time: { lt: new Date() }
      },
      data: { is_active: false }
    });

    const schedules = await prisma.attendance_schedules.findMany({
      where: whereClause
    });

    for (const schedule of schedules) {
      // Sesi dibuat dari pagi asalkan belum melewati waktu selesai (end_time)
      if (currentTimeStr < schedule.end_time) {
        const existingSession = await prisma.attendance_sessions.findFirst({
          where: {
            organization_id: schedule.organization_id,
            title: schedule.title,
            created_at: {
              gte: startOfDay,
              lte: endOfDay
            }
          }
        });

        if (!existingSession) {
          console.log(`[SessionJob] Pre-creating scheduled session for org ${schedule.organization_id}: ${schedule.title}`);

          const startDateTime = new Date(nowWIB);
          const [startH, startM] = schedule.start_time.split(':');
          startDateTime.setHours(parseInt(startH), parseInt(startM), 0, 0);

          const endDateTime = new Date(nowWIB);
          const [endH, endM] = schedule.end_time.split(':');
          endDateTime.setHours(parseInt(endH), parseInt(endM), 0, 0);

          let lateDateTime = null;
          if (schedule.late_time) {
            lateDateTime = new Date(nowWIB);
            const [lateH, lateM] = schedule.late_time.split(':');
            lateDateTime.setHours(parseInt(lateH), parseInt(lateM), 0, 0);
          }

          const checkout_pin_code = schedule.session_type === 'in_out' ? generatePin() : null;

          await prisma.attendance_sessions.create({
            data: {
              organization_id: schedule.organization_id,
              created_by: schedule.created_by,
              title: schedule.title,
              session_type: schedule.session_type,
              start_time: startDateTime,
              end_time: endDateTime,
              late_time: lateDateTime,
              latitude: schedule.latitude,
              longitude: schedule.longitude,
              radius_meters: schedule.radius_meters || 50,
              pin_code: generatePin(),
              checkout_pin_code,
              is_active: true
            }
          });
        }
      }
    }
  } catch (error) {
    console.error('[SessionJob] Error ensuring today scheduled sessions:', error);
  }
};

export const initSessionJobs = () => {
  // Jalankan tiap menit untuk memastikan sesi terjadwal otomatis selalu siap
  cron.schedule('* * * * *', async () => {
    await ensureTodayScheduledSessions();
  });
};
