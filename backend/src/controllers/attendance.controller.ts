import { Request, Response } from 'express'
import { prisma } from '../config/db'
import { sendPushNotification } from './notification.controller'

// Helper function to calculate distance using Haversine formula
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // metres
  const phi1 = lat1 * Math.PI/180;
  const phi2 = lat2 * Math.PI/180;
  const dPhi = (lat2-lat1) * Math.PI/180;
  const dLambda = (lon2-lon1) * Math.PI/180;

  const a = Math.sin(dPhi/2) * Math.sin(dPhi/2) +
          Math.cos(phi1) * Math.cos(phi2) *
          Math.sin(dLambda/2) * Math.sin(dLambda/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c;
}

// 1. Create a new Attendance Session (Head & Sekretaris)
export async function createSession(req: any, res: Response) {
  const orgMemberContext = req.orgMember;
  const userId = req.user?.id;
  const { title, session_type, start_time, end_time, late_time, checkout_start_time, latitude, longitude, radius_meters } = req.body;

  if (!orgMemberContext || (orgMemberContext.role !== 'head' && orgMemberContext.role !== 'sekretaris')) {
    return res.status(403).json({ error: 'Hanya Ketua dan Sekretaris yang bisa membuka sesi absensi' });
  }

  if (latitude == null || longitude == null) {
    return res.status(400).json({ error: 'Lokasi (latitude & longitude) wajib disertakan' });
  }

  if (!start_time || !end_time) {
    return res.status(400).json({ error: 'Waktu mulai dan selesai wajib disertakan' });
  }

  try {
    // Generate random 4-digit PIN
    const pin_code = Math.floor(1000 + Math.random() * 9000).toString();
    const checkout_pin_code = session_type === 'in_out' ? Math.floor(1000 + Math.random() * 9000).toString() : null;

    const newSession = await prisma.attendance_sessions.create({
      data: {
        organization_id: orgMemberContext.organizationId,
        created_by: userId,
        title: title || 'Sesi Absensi',
        session_type: session_type || 'in_only',
        start_time: new Date(start_time),
        end_time: new Date(end_time),
        late_time: late_time ? new Date(late_time) : null,
        checkout_start_time: checkout_start_time ? new Date(checkout_start_time) : null,
        pin_code,
        checkout_pin_code,
        latitude,
        longitude,
        radius_meters: radius_meters || 50,
        is_active: true
      } as any
    });

    
    const org = await prisma.organizations.findUnique({ where: { id: orgMemberContext.organizationId } });
    if (org) {
      const members = await prisma.organization_members.findMany({ where: { organization_id: org.id } });
      for (const m of members) {
        if (m.profile_id !== userId) {
          sendPushNotification(m.profile_id, 'Sesi Absensi Dibuka!', `Sesi "${newSession.title}" di ${org.name} telah dibuka. Segera lakukan presensi!`, `/org/${org.slug}/attendance/scan`);
        }
      }
    }
    return res.status(201).json(newSession);
  } catch (err) {
    console.error('Error creating session:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

// 1B. Get All Sessions (Upcoming, Ongoing, Past)
export async function getSessions(req: any, res: Response) {
  const orgMemberContext = req.orgMember;

  if (!orgMemberContext) {
    return res.status(403).json({ error: 'Akses ditolak' });
  }

  try {
    const sessions = await prisma.attendance_sessions.findMany({
      where: {
        organization_id: orgMemberContext.organizationId
      },
      orderBy: {
        start_time: 'desc'
      }
    });

    return res.status(200).json(sessions);
  } catch (err) {
    console.error('Error getting sessions:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

// 8. Update Attendance Status (e.g. Reject to Absent)
export async function updateAttendanceStatus(req: any, res: Response) {
  const { orgIdOrSlug, attendanceId } = req.params;
  const { status } = req.body;
  const orgMemberContext = req.orgMember;

  if (!orgMemberContext || (orgMemberContext.role !== 'head' && orgMemberContext.role !== 'sekretaris')) {
    return res.status(403).json({ error: 'Hanya Ketua dan Sekretaris yang bisa mengubah status absen' });
  }

  try {
    const org = await prisma.organizations.findFirst({
      where: {
        OR: [
          { id: orgIdOrSlug.length === 36 ? orgIdOrSlug : undefined },
          { slug: orgIdOrSlug }
        ]
      }
    });

    if (!org) {
      return res.status(404).json({ error: 'Organisasi tidak ditemukan' });
    }

    const updated = await prisma.attendance.update({
      where: { 
        id: attendanceId,
        organization_id: org.id 
      },
      data: { status }
    });

    res.json({ message: 'Status absen berhasil diubah', data: updated });
  } catch (error) {
    console.error('Error updating attendance status:', error);
    res.status(500).json({ error: 'Terjadi kesalahan saat mengubah status absen' });
  }
}

// 8b. Approve/Validate Attendance
export async function validateAttendance(req: any, res: Response) {
  const { orgIdOrSlug, attendanceId } = req.params;
  const orgMemberContext = req.orgMember;

  if (!orgMemberContext || (orgMemberContext.role !== 'head' && orgMemberContext.role !== 'sekretaris')) {
    return res.status(403).json({ error: 'Hanya Ketua dan Sekretaris yang bisa menyetujui izin' });
  }

  try {
    const org = await prisma.organizations.findFirst({
      where: {
        OR: [
          { id: orgIdOrSlug.length === 36 ? orgIdOrSlug : undefined },
          { slug: orgIdOrSlug }
        ]
      }
    });

    if (!org) {
      return res.status(404).json({ error: 'Organisasi tidak ditemukan' });
    }

    const existing = await prisma.attendance.findUnique({ where: { id: attendanceId } });
    if (!existing) {
      return res.status(404).json({ error: 'Data absensi tidak ditemukan' });
    }

    const newNotes = existing.notes ? (existing.notes.includes('[VALIDATED]') ? existing.notes : `${existing.notes} [VALIDATED]`) : '[VALIDATED]';

    const updated = await prisma.attendance.update({
      where: { 
        id: attendanceId,
        organization_id: org.id 
      },
      data: { notes: newNotes }
    });

    res.json({ message: 'Izin/Sakit berhasil disetujui (divalidasi)', data: updated });
  } catch (error) {
    console.error('Error validating attendance:', error);
    res.status(500).json({ error: 'Terjadi kesalahan saat memvalidasi absen' });
  }
}

// 2. Get Active Session (We define active as is_active=true AND now() < end_time)
export async function getActiveSession(req: any, res: Response) {
  const orgMemberContext = req.orgMember;
  const { sessionId } = req.params;

  if (!orgMemberContext) {
    return res.status(403).json({ error: 'Akses ditolak' });
  }

  try {
    let session = null;
    if (sessionId) {
      session = await prisma.attendance_sessions.findUnique({
        where: { id: sessionId }
      });
    } else {
      // Find the first currently ongoing session
      const now = new Date();
      session = await prisma.attendance_sessions.findFirst({
        where: {
          organization_id: orgMemberContext.organizationId,
          is_active: true,
          start_time: { lte: now },
          end_time: { gte: now }
        },
        orderBy: { start_time: 'asc' }
      });
    }

    return res.status(200).json(session);
  } catch (err) {
    console.error('Error getting active session:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

// 3. Close Session
export async function closeSession(req: any, res: Response) {
  const orgMemberContext = req.orgMember;
  const { sessionId } = req.params;

  if (!orgMemberContext || (orgMemberContext.role !== 'head' && orgMemberContext.role !== 'sekretaris')) {
    return res.status(403).json({ error: 'Akses ditolak' });
  }

  try {
    const session = await prisma.attendance_sessions.update({
      where: { id: sessionId },
      data: {
        is_active: false,
        closed_at: new Date()
      }
    });

    return res.status(200).json(session);
  } catch (err) {
    console.error('Error closing session:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

// 4. Check-In (and Check-Out) with GPS and PIN
export async function checkIn(req: any, res: Response) {
  const orgMemberContext = req.orgMember;
  const userId = req.user?.id;
  const { pin, latitude, longitude, status, proof_url, notes } = req.body;

  if (!orgMemberContext) {
    return res.status(403).json({ error: 'Akses ditolak' });
  }

  try {
    let activeSession: any = null;

    if (status === 'present') {
      activeSession = await prisma.attendance_sessions.findFirst({
        where: {
          organization_id: orgMemberContext.organizationId,
          is_active: true,
          OR: [
            { pin_code: pin },
            { checkout_pin_code: pin }
          ]
        }
      });
      if (!activeSession) {
        return res.status(404).json({ error: 'Sesi absensi tidak ditemukan atau sudah ditutup (atau PIN salah)' });
      }
    } else {
      if (!req.body.session_id) {
         return res.status(400).json({ error: 'Pilih agenda/sesi terlebih dahulu' });
      }
      activeSession = await prisma.attendance_sessions.findFirst({
        where: {
          id: req.body.session_id,
          organization_id: orgMemberContext.organizationId
        }
      });
      if (!activeSession) {
        return res.status(404).json({ error: 'Agenda tidak ditemukan' });
      }
    }

    const now = new Date();

    if (now > activeSession.end_time) {
      return res.status(400).json({ error: 'Sesi absensi ini sudah berakhir' });
    }

    if (now < activeSession.start_time) {
      return res.status(400).json({ error: 'Sesi absensi ini belum dimulai' });
    }

    const isCheckOutAttempt = activeSession.checkout_pin_code === pin;

    if (isCheckOutAttempt && activeSession.session_type !== 'in_out') {
      return res.status(400).json({ error: 'PIN tidak valid untuk sesi ini' });
    }

    const existing: any = await prisma.attendance.findFirst({
      where: {
        session_id: activeSession.id,
        profile_id: userId
      }
    });

    let distance_meters = null;
    let finalStatus = status || 'present';

    // --- LOGIKA ABSEN PULANG ---
    if (isCheckOutAttempt) {
      if (activeSession.checkout_start_time && now < activeSession.checkout_start_time) {
        return res.status(400).json({ error: 'Waktu absen pulang belum dimulai. Silakan coba lagi nanti.' });
      }

      if (!existing) {
        return res.status(400).json({ error: 'Anda belum absen datang. Silakan absen datang terlebih dahulu.' });
      }
      if (existing.check_out_time) {
        return res.status(400).json({ error: 'Anda sudah melakukan absen pulang.' });
      }

      // Validasi GPS untuk Pulang
      if (latitude == null || longitude == null) {
        return res.status(400).json({ error: 'Gagal mendapatkan lokasi GPS untuk absen pulang' });
      }

      distance_meters = calculateDistance(activeSession.latitude, activeSession.longitude, latitude, longitude);

      if (distance_meters > activeSession.radius_meters) {
        return res.status(400).json({ 
          error: `Lokasi pulang Anda terlalu jauh (${Math.round(distance_meters)}m). Maksimal radius: ${activeSession.radius_meters}m` 
        });
      }

      const updatedRecord = await prisma.attendance.update({
        where: { id: existing.id },
        data: { check_out_time: now } as any
      });
      
      return res.status(200).json({ message: 'Absen pulang berhasil dicatat', record: updatedRecord });
    } 
    
    // --- LOGIKA ABSEN DATANG ---
    else {
      if (existing) {
        return res.status(400).json({ error: 'Anda sudah melakukan absen datang untuk sesi ini.' });
      }

      if (finalStatus === 'present') {
        if (latitude == null || longitude == null) {
          return res.status(400).json({ error: 'Gagal mendapatkan lokasi GPS' });
        }

        distance_meters = calculateDistance(activeSession.latitude, activeSession.longitude, latitude, longitude);

        if (distance_meters > activeSession.radius_meters) {
          return res.status(400).json({ 
            error: `Lokasi kedatangan terlalu jauh (${Math.round(distance_meters)}m). Maksimal radius: ${activeSession.radius_meters}m` 
          });
        }
        
        if (activeSession.late_time && now > activeSession.late_time) {
          finalStatus = 'late';
        }
      } else {
        if (!proof_url && finalStatus !== 'absent') {
          return res.status(400).json({ error: 'Surat bukti wajib disertakan untuk status sakit/izin' });
        }
      }

      const record = await prisma.attendance.create({
        data: {
          organization_id: orgMemberContext.organizationId,
          profile_id: userId,
          session_id: activeSession.id,
          status: finalStatus as any,
          notes: notes || null,
          proof_url: proof_url || null,
          latitude: latitude || null,
          longitude: longitude || null,
          distance_meters
        } as any
      });

      return res.status(201).json({ message: 'Absen datang berhasil dicatat', record });
    }

  } catch (err) {
    console.error('Error checking in/out:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

// 5. Mengambil Daftar Rekam Jejak Kehadiran (Akses: Semua Anggota)
export async function getAttendanceRecords(req: any, res: Response) {
  const orgMemberContext = req.orgMember;
  const { sessionId } = req.query;

  if (!orgMemberContext) {
    return res.status(403).json({ error: 'Akses organisasi dibatasi' });
  }

  try {
    const whereClause: any = {
      organization_id: orgMemberContext.organizationId
    };

    if (sessionId) {
      whereClause.session_id = sessionId;
    }

    const records = await prisma.attendance.findMany({
      where: whereClause,
      include: {
        profile: {
          select: { full_name: true, email: true }
        },
        session: {
          select: { session_type: true }
        }
      },
      orderBy: {
        check_in_time: 'desc'
      }
    });

    return res.status(200).json(records);
  } catch (err) {
    console.error('Error fetching attendance records:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

// 6. Get Attendance Stats (For Secretary Dashboard)
export async function getAttendanceStats(req: any, res: Response) {
  const orgMemberContext = req.orgMember;

  if (!orgMemberContext) {
    return res.status(403).json({ error: 'Akses organisasi dibatasi' });
  }

  try {
    const totalSessions = await prisma.attendance_sessions.count({
      where: { organization_id: orgMemberContext.organizationId }
    });

    // Leaderboard (Present)
    const attendanceStats = await prisma.attendance.groupBy({
      by: ['profile_id'],
      where: { 
        organization_id: orgMemberContext.organizationId,
        status: 'present'
      },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10
    });

    const enrichedStats = await Promise.all(attendanceStats.map(async (stat) => {
      const profile = await prisma.profiles.findUnique({ where: { id: stat.profile_id }});
      return {
        ...stat,
        profile: { full_name: profile?.full_name, email: profile?.email }
      };
    }));

    // Zona Merah (Absent or Late)
    const redZoneStats = await prisma.attendance.groupBy({
      by: ['profile_id'],
      where: { 
        organization_id: orgMemberContext.organizationId,
        status: { in: ['absent', 'late'] }
      },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10
    });

    const enrichedRedZone = await Promise.all(redZoneStats.map(async (stat) => {
      const profile = await prisma.profiles.findUnique({ where: { id: stat.profile_id }});
      return {
        ...stat,
        profile: { full_name: profile?.full_name, email: profile?.email }
      };
    }));

    return res.status(200).json({ 
      totalSessions, 
      leaderboard: enrichedStats,
      red_zone: enrichedRedZone 
    });
  } catch (err) {
    console.error('Error fetching stats:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

// 9. Get Agenda (Active & Upcoming sessions for Members)
export async function getAgenda(req: any, res: Response) {
  const orgMemberContext = req.orgMember;

  if (!orgMemberContext) {
    return res.status(403).json({ error: 'Akses organisasi dibatasi' });
  }

  try {
    const now = new Date();
    // Get ongoing or upcoming sessions (end_time is in the future)
    const sessions = await prisma.attendance_sessions.findMany({
      where: {
        organization_id: orgMemberContext.organizationId,
        end_time: { gte: now }
      },
      orderBy: { start_time: 'asc' }
    });

    return res.status(200).json(sessions);
  } catch (err) {
    console.error('Error fetching agenda:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

// 10. Get Personal Attendance History (Akses: Semua Anggota)
export async function getMyAttendanceHistory(req: any, res: Response) {
  const orgMemberContext = req.orgMember;
  const userId = req.user?.id;

  if (!orgMemberContext) {
    return res.status(403).json({ error: 'Akses organisasi dibatasi' });
  }

  try {
    const records = await prisma.attendance.findMany({
      where: {
        organization_id: orgMemberContext.organizationId,
        profile_id: userId
      },
      include: {
        session: {
          select: { 
            title: true,
            start_time: true,
            end_time: true,
            session_type: true 
          }
        }
      },
      orderBy: {
        check_in_time: 'desc'
      }
    });

    // Hitung statistik
    let stats = {
      present: 0,
      late: 0,
      absent: 0,
      sick: 0,
      excused: 0
    };

    records.forEach(record => {
      if (record.status === 'present') stats.present++;
      else if (record.status === 'late') stats.late++;
      else if (record.status === 'absent') stats.absent++;
      else if ((record.status as string) === 'sick') stats.sick++;
      else if ((record.status as string) === 'excused') stats.excused++;
    });

    return res.status(200).json({ records, stats });
  } catch (err) {
    console.error('Error fetching personal attendance history:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
