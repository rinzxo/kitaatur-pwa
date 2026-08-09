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
      include: {
        guest_attendance: {
          select: { status: true }
        }
      }
    });

    if (!student) {
      return res.status(404).json({ error: 'Data siswa tidak ditemukan dengan ID tersebut.' });
    }

    // Ambil semua sesi untuk organisasi
    const allSessions = await prisma.attendance_sessions.findMany({
      where: { organization_id: orgId },
      select: { start_time: true }
    });

    let tepat = 0;
    let terlambat = 0;

    student.guest_attendance.forEach(att => {
      if (att.status === 'present') tepat++;
      if (att.status === 'late') terlambat++;
    });

    // Hitung Alpha (hanya dari sesi yang dimulai setelah siswa dibuat)
    const applicableSessions = allSessions.filter(s => s.start_time >= student.created_at).length;
    const alpha = Math.max(0, applicableSessions - (tepat + terlambat));
    
    let percentage = 0;
    if (applicableSessions > 0) {
      percentage = Math.min(100, Math.round(((tepat + terlambat) / applicableSessions) * 100));
    }

    return res.json({
      student: {
        name: student.name,
        identifier: student.identifier,
        stats: {
          tepat,
          terlambat,
          alpha,
          percentage,
          total_sessions: applicableSessions
        }
      }
    });

  } catch (error) {
    console.error('Error fetching student stats:', error);
    return res.status(500).json({ error: 'Terjadi kesalahan saat memuat data kehadiran.' });
  }
}
