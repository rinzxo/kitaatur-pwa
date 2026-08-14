import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 1. Get all participating Edu schools
export async function getEduSchools(req: Request, res: Response) {
  try {
    const schools = await prisma.organizations.findMany({
      where: {
        is_edu: true
      },
      select: {
        id: true,
        name: true,
        slug: true,
        logo_url: true,
      },
      orderBy: {
        name: 'asc'
      }
    });

    return res.json(schools);
  } catch (error) {
    console.error('Error fetching Edu schools:', error);
    return res.status(500).json({ error: 'Terjadi kesalahan saat memuat daftar sekolah.' });
  }
}

// 2. Verify School PIN
export async function verifySchoolPin(req: Request, res: Response) {
  const { orgId } = req.params;
  const { pin } = req.body;

  if (!pin) {
    return res.status(400).json({ error: 'PIN wajib diisi.' });
  }

  try {
    const school = await prisma.organizations.findUnique({
      where: { id: orgId, is_edu: true },
      select: { edu_pin: true, id: true }
    });

    if (!school) {
      return res.status(404).json({ error: 'Sekolah tidak ditemukan atau tidak aktif di Edu.' });
    }

    if (school.edu_pin !== pin) {
      return res.status(401).json({ error: 'PIN yang dimasukkan salah.' });
    }

    return res.json({ success: true, message: 'Akses diizinkan.' });
  } catch (error) {
    console.error('Error verifying school PIN:', error);
    return res.status(500).json({ error: 'Terjadi kesalahan saat memverifikasi PIN.' });
  }
}

// 3. Get Student Stats
export async function getStudentStats(req: Request, res: Response) {
  const { orgId } = req.params;
  const { identifier } = req.body;

  if (!identifier) {
    return res.status(400).json({ error: 'ID / Identifier siswa wajib diisi.' });
  }

  try {
    // Cari siswa berdasarkan identifier dan org_id
    const student = await prisma.org_guests.findFirst({
      where: {
        organization_id: orgId,
        identifier: {
          equals: identifier.trim(),
          mode: 'insensitive'
        }
      },
      include: ({
        guest_attendance: {
          select: { status: true, session_id: true, check_in_time: true }
        },
        guest_leaves: true
      } as any)
    });

    if (!student) {
      return res.status(404).json({ error: 'Data siswa tidak ditemukan dengan ID tersebut.' });
    }

    // Ambil semua sesi untuk organisasi
    const allSessions = await prisma.attendance_sessions.findMany({
      where: { organization_id: orgId },
      select: { id: true, start_time: true, end_time: true, title: true, is_active: true }
    });

    let tepat = 0;
    let terlambat = 0;
    const attendedSessionIds = new Set<string>();

    (student as any).guest_attendance.forEach((att: any) => {
      if (att.status === 'present') {
        tepat++;
        attendedSessionIds.add(att.session_id);
      }
      if (att.status === 'late') {
        terlambat++;
        attendedSessionIds.add(att.session_id);
      }
    });

    const now = new Date();
    const applicableSessions = allSessions.filter(s => s.start_time <= now && s.start_time >= student.created_at);
    
    let izin = 0;
    let sakit = 0;
    
    const leavesBySession = new Map<string, any>();
    (student as any).guest_leaves.forEach((leave: any) => {
       leavesBySession.set(leave.session_id, leave);
    });

    applicableSessions.forEach((session: any) => {
       if (!attendedSessionIds.has(session.id)) {
           const leave = leavesBySession.get(session.id);
           
           if (leave) {
               let finalType = leave.type;
               if (finalType === 'sakit' && !leave.proof_url) {
                   const ageHours = (Date.now() - new Date(leave.created_at).getTime()) / (1000 * 60 * 60);
                   if (ageHours > 24) {
                       finalType = 'izin';
                   }
               }
               
               if (finalType === 'sakit') sakit++;
               else izin++;
           }
       }
    });

    const totalLeaves = izin + sakit;
    const alpha = Math.max(0, applicableSessions.length - (tepat + terlambat + totalLeaves));
    
    let percentage = 0;
    if (applicableSessions.length > 0) {
      percentage = Math.min(100, Math.round(((tepat + terlambat + totalLeaves) / applicableSessions.length) * 100)); // wait, are leaves counted as attendance percentage? usually yes for excused. Let's not count leaves in presence percentage.
      percentage = Math.min(100, Math.round(((tepat + terlambat) / applicableSessions.length) * 100));
    }

    return res.json({
      student: {
        name: student.name,
        identifier: student.identifier,
        stats: {
          tepat,
          terlambat,
          izin,
          sakit,
          alpha,
          percentage,
          total_sessions: applicableSessions.length
        },
        leaves: (student as any).guest_leaves.map((l: any) => {
          let finalType = l.type;
          if (finalType === 'sakit' && !l.proof_url) {
            const ageHours = (Date.now() - new Date(l.created_at).getTime()) / (1000 * 60 * 60);
            if (ageHours > 24) finalType = 'izin';
          }
          return {
            id: l.id,
            type: finalType,
            originalType: l.type,
            session_id: l.session_id,
            notes: l.notes,
            proof_url: l.proof_url,
            created_at: l.created_at
          };
        }).sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
        sessions: applicableSessions.map((session: any) => ({
          ...session,
          is_active: session.is_active && new Date(session.start_time) <= now && new Date(session.end_time) >= now
        })),
        history: applicableSessions.map((session: any) => {
          let status = 'alpha';
          let check_in_time = null;
          let notes = null;
          let proof_url = null;
          
          const attendance = (student as any).guest_attendance.find((a: any) => a.session_id === session.id);
          if (attendance) {
              status = attendance.status;
              check_in_time = attendance.check_in_time;
          } else {
              const leave = leavesBySession.get(session.id);
              if (leave) {
                  status = leave.type;
                  notes = leave.notes;
                  proof_url = leave.proof_url;
                  check_in_time = leave.created_at;
                  
                  if (status === 'sakit' && !proof_url) {
                     const ageHours = (Date.now() - new Date(leave.created_at).getTime()) / (1000 * 60 * 60);
                     if (ageHours > 24) {
                         status = 'izin';
                     }
                  }
              }
          }
          
          const is_currently_active = session.is_active && new Date(session.start_time) <= now && new Date(session.end_time) >= now;
          
          return {
              session_id: session.id,
              title: session.title,
              start_time: session.start_time,
              is_active: is_currently_active,
              status,
              check_in_time,
              notes,
              proof_url
          };
        }).sort((a: any, b: any) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime())
      }
    });

  } catch (error) {
    console.error('Error fetching student stats:', error);
    return res.status(500).json({ error: 'Terjadi kesalahan saat memuat data kehadiran.' });
  }
}

// 4. Submit Student Leave
export async function submitStudentLeave(req: Request, res: Response) {
  const { orgId } = req.params;
  const { identifier, type, session_id, notes, proof_url } = req.body;

  if (!identifier || !type || !session_id) {
    return res.status(400).json({ error: 'ID, Tipe Izin, dan Sesi wajib diisi.' });
  }

  try {
    const student = await prisma.org_guests.findFirst({
      where: {
        organization_id: orgId,
        identifier: {
          equals: identifier.trim(),
          mode: 'insensitive'
        }
      }
    });

    if (!student) {
      return res.status(404).json({ error: 'Data siswa tidak ditemukan.' });
    }

    const session = await prisma.attendance_sessions.findUnique({
      where: { id: session_id }
    });

    if (!session) {
      return res.status(404).json({ error: 'Sesi tidak ditemukan.' });
    }

    const leave = await (prisma as any).guest_leaves.create({
      data: {
        organization_id: orgId,
        guest_id: student.id,
        type: type, // "sakit" or "izin"
        session_id: session_id,
        notes: notes || null,
        proof_url: proof_url || null
      }
    });

    return res.json({ success: true, message: 'Pengajuan absen berhasil disimpan.', leave });
  } catch (error) {
    console.error('Error submitting leave:', error);
    return res.status(500).json({ error: 'Terjadi kesalahan saat menyimpan pengajuan.' });
  }
}

// 5. Get Monitor Data
export async function getMonitorData(req: Request, res: Response) {
  const { orgId } = req.params;
  const { pin, sessionId } = req.body;

  if (!pin) {
    return res.status(400).json({ error: 'PIN wajib diisi.' });
  }

  try {
    const school = await prisma.organizations.findUnique({
      where: { id: orgId, is_edu: true },
      select: { edu_pin: true, id: true }
    });

    if (!school) {
      return res.status(404).json({ error: 'Sekolah tidak ditemukan atau tidak aktif di Edu.' });
    }

    if (school.edu_pin !== pin) {
      return res.status(401).json({ error: 'PIN yang dimasukkan salah.' });
    }

    // Get all sessions for the dropdown
    const allSessionsRaw = await prisma.attendance_sessions.findMany({
      where: { organization_id: orgId },
      orderBy: { start_time: 'desc' },
      select: { id: true, title: true, start_time: true, end_time: true, is_active: true }
    });

    const now = new Date();
    const allSessions = allSessionsRaw.map((s: any) => ({
      ...s,
      is_currently_active: s.is_active && new Date(s.start_time) <= now && new Date(s.end_time) >= now
    }));

    let sessionsToFetch = [];
    if (sessionId && sessionId !== 'today' && sessionId !== 'all') {
      sessionsToFetch = await prisma.attendance_sessions.findMany({
        where: { id: sessionId, organization_id: orgId }
      });
    } else {
      // Get active sessions for today
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

      sessionsToFetch = await prisma.attendance_sessions.findMany({
        where: {
          organization_id: orgId,
          start_time: { gte: startOfDay, lte: endOfDay }
        },
        orderBy: { start_time: 'asc' }
      });
    }

    const sessionIds = sessionsToFetch.map((s: any) => s.id);

    // Get all guests
    const guests = await prisma.org_guests.findMany({
      where: { organization_id: orgId },
      orderBy: { name: 'asc' },
      include: {
        guest_attendance: {
          where: { session_id: { in: sessionIds } }
        },
        guest_leaves: {
          where: { session_id: { in: sessionIds } }
        } as any
      }
    });

    return res.json({ success: true, sessions: sessionsToFetch, allSessions, guests });
  } catch (error) {
    console.error('Error fetching monitor data:', error);
    return res.status(500).json({ error: 'Terjadi kesalahan saat memuat data monitor.' });
  }
}

// 6. Update Proof URL for Existing Sick Leave (tanpa submit ulang)
export async function updateLeaveProof(req: Request, res: Response) {
  const { orgId } = req.params;
  const { identifier, session_id, proof_url } = req.body;

  if (!identifier || !session_id || !proof_url) {
    return res.status(400).json({ error: 'identifier, session_id, dan proof_url wajib diisi.' });
  }

  try {
    const student = await prisma.org_guests.findFirst({
      where: {
        organization_id: orgId,
        identifier: { equals: identifier.trim(), mode: 'insensitive' }
      }
    });

    if (!student) {
      return res.status(404).json({ error: 'Data siswa tidak ditemukan.' });
    }

    const leave = await (prisma as any).guest_leaves.findFirst({
      where: {
        guest_id: student.id,
        session_id,
        organization_id: orgId,
        type: 'sakit'
      }
    });

    if (!leave) {
      return res.status(404).json({ error: 'Data izin sakit untuk sesi ini tidak ditemukan.' });
    }

    const updated = await (prisma as any).guest_leaves.update({
      where: { id: leave.id },
      data: { proof_url }
    });

    return res.json({ success: true, message: 'Surat dokter berhasil diunggah.', leave: updated });
  } catch (error) {
    console.error('Error updating leave proof:', error);
    return res.status(500).json({ error: 'Terjadi kesalahan saat mengunggah surat.' });
  }
}
