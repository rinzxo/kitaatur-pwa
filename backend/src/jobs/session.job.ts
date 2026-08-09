import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

// Function to generate a random 6-digit PIN
const generatePin = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const initSessionJobs = () => {
  // Run every minute
  cron.schedule('* * * * *', async () => {
    try {
      // Get current time in Asia/Jakarta (WIB)
      const nowWIB = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
      const currentDay = nowWIB.getDay(); // 0 = Sunday, 1 = Monday...
      
      const hours = String(nowWIB.getHours()).padStart(2, '0');
      const minutes = String(nowWIB.getMinutes()).padStart(2, '0');
      const currentTimeStr = `${hours}:${minutes}`;

      // Start of day in WIB for duplicate checking
      const startOfDay = new Date(nowWIB);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(nowWIB);
      endOfDay.setHours(23, 59, 59, 999);

      // Find all active schedules that match current day
      const schedules = await prisma.attendance_schedules.findMany({
        where: {
          is_active: true,
          days_of_week: { has: currentDay }
        }
      });

      for (const schedule of schedules) {
        // Check if current time is within the schedule's active window
        if (currentTimeStr >= schedule.start_time && currentTimeStr < schedule.end_time) {
          
          // Check if a session for this schedule (matching title) has already been created TODAY
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
            console.log(`[Cron] Triggering scheduled session for org ${schedule.organization_id}: ${schedule.title}`);

            // Parse times to Date objects for today
            const startDateTime = new Date();
            startDateTime.setHours(parseInt(schedule.start_time.split(':')[0]), parseInt(schedule.start_time.split(':')[1]), 0, 0);

            const endDateTime = new Date();
            endDateTime.setHours(parseInt(schedule.end_time.split(':')[0]), parseInt(schedule.end_time.split(':')[1]), 0, 0);

            let lateDateTime = null;
            if (schedule.late_time) {
              lateDateTime = new Date();
              lateDateTime.setHours(parseInt(schedule.late_time.split(':')[0]), parseInt(schedule.late_time.split(':')[1]), 0, 0);
            }

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
                radius_meters: schedule.radius_meters,
                pin_code: generatePin(),
                is_active: true
              }
            });
          }
        }
      }
    } catch (error) {
      console.error('[Cron] Error running session job:', error);
    }
  });
};
