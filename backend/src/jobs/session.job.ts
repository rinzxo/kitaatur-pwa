import cron from 'node-cron';
import { prisma } from '../config/db';

// Function to generate a random 4-digit PIN
const generatePin = () => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};

const activeSyncs = new Set<string>();

/**
 * Memastikan sesi dari jadwal otomatis (attendance_schedules) untuk hari ini
 * sudah dibuat di awal hari (sebelum sesi dimulai) agar anggota dan sekretaris
 * bisa mengajukan atau mencatat izin/sakit lebih awal.
 */
export const ensureTodayScheduledSessions = async (organizationId?: string) => {
  const syncKey = organizationId || 'GLOBAL';
  if (activeSyncs.has(syncKey)) {
    return;
  }
  activeSyncs.add(syncKey);

  try {
    // Tanggal hari ini dalam format WIB (YYYY-MM-DD)
    const todayWIBStr = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Jakarta',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(new Date());

    // Jam & menit saat ini dalam WIB (HH:mm)
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Jakarta',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).formatToParts(new Date());
    const hours = parts.find(p => p.type === 'hour')?.value || '00';
    const minutes = parts.find(p => p.type === 'minute')?.value || '00';
    const currentTimeStr = `${hours}:${minutes}`;

    // Awal dan akhir hari dalam WIB dengan offset eksplisit +07:00
    const startOfWIBDay = new Date(`${todayWIBStr}T00:00:00.000+07:00`);
    const endOfWIBDay = new Date(`${todayWIBStr}T23:59:59.999+07:00`);
    const currentDay = startOfWIBDay.getDay(); // 0 = Sunday, 1 = Monday...

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
        ...(organizationId ? { organization_id: organizationId } : {}),
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
        // Cek apakah sesi hari ini sudah ada (berdasarkan start_time atau created_at dalam rentang hari WIB)
        const existingSession = await prisma.attendance_sessions.findFirst({
          where: {
            organization_id: schedule.organization_id,
            title: schedule.title,
            OR: [
              {
                start_time: {
                  gte: startOfWIBDay,
                  lte: endOfWIBDay
                }
              },
              {
                created_at: {
                  gte: startOfWIBDay,
                  lte: endOfWIBDay
                }
              }
            ]
          }
        });

        if (!existingSession) {
          console.log(`[SessionJob] Pre-creating scheduled session for org ${schedule.organization_id}: ${schedule.title}`);

          const startDateTime = new Date(`${todayWIBStr}T${schedule.start_time}:00.000+07:00`);
          const endDateTime = new Date(`${todayWIBStr}T${schedule.end_time}:00.000+07:00`);

          let lateDateTime: Date | null = null;
          if (schedule.late_time) {
            lateDateTime = new Date(`${todayWIBStr}T${schedule.late_time}:00.000+07:00`);
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
  } finally {
    activeSyncs.delete(syncKey);
  }
};

/**
 * Otomatis ubah status sakit tanpa surat bukti yang sudah melewati 1x24 jam
 * sejak jam check-in menjadi status izin biasa (excused).
 */
export const sweepExpiredSickLeaves = async () => {
  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const expiredSickRecords = await prisma.attendance.findMany({
      where: {
        status: 'sick',
        proof_url: null,
        check_in_time: { lte: twentyFourHoursAgo }
      }
    });

    for (const record of expiredSickRecords) {
      const autoNote = record.notes 
        ? `${record.notes} [CONVERTED_TO_EXCUSED: Batas 24 jam surat sakit terlewati]`
        : '[CONVERTED_TO_EXCUSED: Batas 24 jam surat sakit terlewati]';
      await prisma.attendance.update({
        where: { id: record.id },
        data: {
          status: 'excused',
          notes: autoNote
        }
      });
    }
  } catch (err) {
    console.error('[SessionJob] Error sweeping expired sick leaves:', err);
  }
};

export const initSessionJobs = () => {
  // 1. Sesi terjadwal cukup dicek tiap 15 menit (menghemat 93% query & Egress dibanding tiap menit)
  cron.schedule('*/15 * * * *', async () => {
    await ensureTodayScheduledSessions();
  });

  // 2. Pembersihan masa berlaku surat sakit (toleransi 24 jam) cukup dijalankan 1 jam sekali
  cron.schedule('0 * * * *', async () => {
    await sweepExpiredSickLeaves();
  });
};

