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

export async function createSession(req: any, res: Response) {
  const orgMemberContext = req.orgMember;
  const userId = req.user?.id;
  const { title, session_type, start_time, end_time, late_time, checkout_start_time, latitude, longitude, radius_meters, invitedOrgs } = req.body;

  if (!orgMemberContext || (orgMemberContext.role !== 'head' && orgMemberContext.role !== 'sekretaris')) {
    return res.status(403).json({ error: 'Hanya Ketua dan Sekretaris yang bisa membuka sesi absensi' });
  }

  if (latitude == null || longitude == null) {
    return res.status(400).json({ error: 'Lokasi (latitude & longitude) wajib disertakan' });
  }

  if (!start_time || !end_time) {
    return res.status(400).json({ error: 'Waktu mulai dan selesai wajib disertakan' });
  }

  const startDt = new Date(start_time);
  const endDt = new Date(end_time);

  if (endDt <= startDt) {
    return res.status(400).json({ error: 'Waktu Selesai harus lebih besar dari Waktu Mulai' });
  }

  if (late_time) {
    const lateDt = new Date(late_time);
    if (lateDt <= startDt || lateDt >= endDt) {
      return res.status(400).json({ error: 'Batas keterlambatan harus berada di antara Waktu Mulai dan Waktu Selesai' });
    }
  }

  if (session_type === 'in_out' && checkout_start_time) {
    const checkoutDt = new Date(checkout_start_time);
    if (checkoutDt <= startDt || checkoutDt >= endDt) {
      return res.status(400).json({ error: 'Waktu mulai absen pulang harus di antara Waktu Mulai dan Waktu Selesai' });
    }
  }

  try {
    // Generate random 4-digit PIN
    const pin_code = Math.floor(1000 + Math.random() * 9000).toString();
    const checkout_pin_code = session_type === 'in_out' ? Math.floor(1000 + Math.random() * 9000).toString() : null;

    let pending_shared_orgs: string[] = [];
    if (Array.isArray(invitedOrgs)) {
      pending_shared_orgs = invitedOrgs.filter(id => typeof id === 'string');
    }

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
        is_active: true,
        pending_shared_orgs
      } as any
    });

    
    const org = await prisma.organizations.findUnique({ where: { id: orgMemberContext.organizationId } });
    if (org) {
      const members = await prisma.organization_members.findMany({ where: { organization_id: org.id, role: { not: 'auditor' as any } } });
      for (const m of members) {
        if (m.profile_id !== userId) {
          sendPushNotification(m.profile_id, 'Sesi Absensi Dibuka!', `Sesi "${newSession.title}" di ${org.name} telah dibuka. Segera lakukan presensi!`, `/org/${org.slug}/attendance/scan`);
        }
      }

      // Notify invited orgs
      if (pending_shared_orgs.length > 0) {
        for (const invitedOrgId of pending_shared_orgs) {
          const invitedOrg = await prisma.organizations.findUnique({ where: { id: invitedOrgId } });
          if (invitedOrg) {
            const heads = await prisma.organization_members.findMany({
              where: {
                organization_id: invitedOrgId,
                role: { in: ['head', 'sekretaris'] }
              }
            });
            for (const h of heads) {
              sendPushNotification(h.profile_id, 'Undangan Kolaborasi Agenda', `${org.name} mengundang ${invitedOrg.name} untuk berkolaborasi di agenda "${newSession.title}".`, `/org/${invitedOrg.slug}/attendance`);
            }
          }
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
        OR: [
          { organization_id: orgMemberContext.organizationId },
          { shared_with_orgs: { has: orgMemberContext.organizationId } }
        ]
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

// 1C. Get Pending Collaborations
export async function getPendingCollaborations(req: any, res: Response) {
  const orgMemberContext = req.orgMember;
  if (!orgMemberContext) return res.status(403).json({ error: 'Akses ditolak' });

  try {
    const pendingSessions = await prisma.attendance_sessions.findMany({
      where: {
        pending_shared_orgs: { has: orgMemberContext.organizationId }
      },
      include: {
        organization: { select: { id: true, name: true, logo_url: true } }
      }
    });
    return res.status(200).json(pendingSessions);
  } catch (err) {
    console.error('Error getting pending collabs:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

// 1D. Accept Collaboration
export async function acceptCollaboration(req: any, res: Response) {
  const orgMemberContext = req.orgMember;
  const { sessionId } = req.params;

  try {
    const session = await prisma.attendance_sessions.findFirst({ where: { id: sessionId.length === 36 ? sessionId : undefined } });
    if (!session) return res.status(404).json({ error: 'Sesi tidak ditemukan' });

    if (!session.pending_shared_orgs.includes(orgMemberContext.organizationId)) {
      return res.status(400).json({ error: 'Tidak ada undangan kolaborasi untuk organisasi ini' });
    }

    const updatedSession = await prisma.attendance_sessions.update({
      where: { id: sessionId.length === 36 ? sessionId : undefined },
      data: {
        pending_shared_orgs: session.pending_shared_orgs.filter(id => id !== orgMemberContext.organizationId),
        shared_with_orgs: { push: orgMemberContext.organizationId }
      }
    });
    return res.status(200).json({ success: true, session: updatedSession });
  } catch (err) {
    console.error('Error accepting collab:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

// 1E. Reject Collaboration
export async function rejectCollaboration(req: any, res: Response) {
  const orgMemberContext = req.orgMember;
  const { sessionId } = req.params;

  try {
    const session = await prisma.attendance_sessions.findFirst({ where: { id: sessionId.length === 36 ? sessionId : undefined } });
    if (!session) return res.status(404).json({ error: 'Sesi tidak ditemukan' });

    if (!session.pending_shared_orgs.includes(orgMemberContext.organizationId)) {
      return res.status(400).json({ error: 'Tidak ada undangan kolaborasi untuk organisasi ini' });
    }

    const updatedSession = await prisma.attendance_sessions.update({
      where: { id: sessionId.length === 36 ? sessionId : undefined },
      data: {
        pending_shared_orgs: session.pending_shared_orgs.filter(id => id !== orgMemberContext.organizationId)
      }
    });
    return res.status(200).json({ success: true, session: updatedSession });
  } catch (err) {
    console.error('Error rejecting collab:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

// 1F. Get Session Members (For Bantu Absen Collab)
export async function getSessionMembers(req: any, res: Response) {
  const { sessionId } = req.params;

  try {
    const session = await prisma.attendance_sessions.findFirst({ where: { id: sessionId.length === 36 ? sessionId : undefined } });
    if (!session) return res.status(404).json({ error: 'Sesi tidak ditemukan' });

    // Cek authorization: harus head, sekretaris, atau memiliki custom_data.can_take_attendance = true
    const callerMembership = await prisma.organization_members.findUnique({
      where: {
        organization_id_profile_id: {
          organization_id: req.orgMember.organizationId,
          profile_id: req.user.id
        }
      }
    });

    const customData = callerMembership?.custom_data as any;
    const canDelegate = customData?.can_take_attendance === true;

    if (callerMembership?.role !== 'head' && callerMembership?.role !== 'sekretaris' && !canDelegate) {
      return res.status(403).json({ error: 'Akses ditolak: Anda tidak memiliki wewenang untuk mengambil absensi' });
    }

    const validOrgs = [session.organization_id, ...(session.shared_with_orgs || [])];

    const members = await prisma.organization_members.findMany({
      where: { organization_id: { in: validOrgs }, role: { not: 'auditor' as any } },
      include: {
        profile: { select: { full_name: true, email: true, avatar_url: true } },
        organization: { select: { name: true } }
      }
    });

    members.sort((a: any, b: any) => {
      const nameA = (a.profile?.full_name || a.profile?.email || '').toLowerCase();
      const nameB = (b.profile?.full_name || b.profile?.email || '').toLowerCase();
      return nameA.localeCompare(nameB);
    });

    // Ambil data absensi untuk sesi ini
    const attendances = await prisma.attendance.findMany({
      where: { session_id: sessionId }
    });

    // Filter member yang sudah selesai absen
    const filteredMembers = members.filter(member => {
      const attendance = attendances.find(a => a.profile_id === member.profile_id);
      if (!attendance) return true; // Belum absen sama sekali, tampilkan

      if (session.session_type === 'in_out') {
        // Jika in_out, dia baru "selesai" kalau sudah absen pulang (check_out_time tidak null)
        return attendance.check_out_time === null;
      } else {
        // Jika in_only, kalau sudah ada attendance (absen datang), berarti selesai
        return false;
      }
    });

    return res.status(200).json(filteredMembers);
  } catch (err) {
    console.error('Error fetching session members:', err);
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
    console.error('Error getting session members:', error);
    res.status(500).json({ error: 'Terjadi kesalahan pada server.' });
  }
}

// ========================
// Guest Attendance
// ========================

export const getGuests = async (req: Request, res: Response) => {
  const { orgIdOrSlug } = req.params;
  const { sessionId } = req.query;
  try {
    const org = await prisma.organizations.findFirst({
      where: { OR: [{ id: orgIdOrSlug.length === 36 ? orgIdOrSlug : undefined }, { slug: orgIdOrSlug }] }
    });
    if (!org) return res.status(404).json({ error: 'Organisasi tidak ditemukan' });

    let targetSessionId = sessionId && sessionId !== 'null' ? String(sessionId) : null;
    let targetSession = null;

    if (targetSessionId) {
      targetSession = await prisma.attendance_sessions.findUnique({
        where: { id: targetSessionId },
        select: { id: true, start_time: true }
      });
    }

    if (!targetSession) {
      const now = new Date();
      // Only auto-pick sessions that are active and not older than 24 hours to prevent abandoned sessions from showing up
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      targetSession = await prisma.attendance_sessions.findFirst({
        where: {
          organization_id: org.id,
          is_active: true,
          start_time: { lte: now },
          end_time: { gte: now }
        },
        orderBy: { start_time: 'desc' },
        select: { id: true, start_time: true }
      });
      if (targetSession) {
        targetSessionId = targetSession.id;
      }
    }

    // Fetch all guests with attendance and all leaves
    const guests = await prisma.org_guests.findMany({
      where: { organization_id: org.id },
      orderBy: { name: 'asc' },
      include: targetSessionId ? ({
        guest_attendance: {
          where: { session_id: targetSessionId },
          select: { check_in_time: true, status: true }
        },
        guest_leaves: true
      } as any) : undefined
    });
    
    let sessionDateStr = targetSession ? targetSession.start_time.toISOString().split('T')[0] : null;

    const formattedGuests = guests.map((guest: any) => {
      let finalStatus = guest.guest_attendance?.[0]?.status || null; // 'present' or 'late'

      if (targetSession && !finalStatus) {
        // Find if they have leave for this session
        const leave = (guest as any).guest_leaves?.find((l: any) => l.session_id === targetSession.id);
        if (leave) {
          finalStatus = leave.type; // 'izin' or 'sakit'
          if (finalStatus === 'sakit' && !leave.proof_url) {
             const ageHours = (Date.now() - new Date(leave.created_at).getTime()) / (1000 * 60 * 60);
             if (ageHours > 24) finalStatus = 'izin';
          }
        } else {
           // check if guest was created before or at session start
           if (targetSession.start_time >= guest.created_at) {
             finalStatus = 'alpha';
           }
        }
      }

      return {
        ...guest,
        check_in_time: guest.guest_attendance?.[0]?.check_in_time || null,
        status: finalStatus,
        kelas: (guest.custom_data && guest.custom_data.kelas) ? guest.custom_data.kelas : null
      };
    });

    res.json(formattedGuests);
  } catch (error) {
    console.error('Error getting guests:', error);
    res.status(500).json({ error: 'Terjadi kesalahan saat memuat data tamu.' });
  }
};

export const uploadGuests = async (req: Request, res: Response) => {
  const { orgIdOrSlug } = req.params;
  const { guests } = req.body; // Array of { name, identifier }

  if (!guests || !Array.isArray(guests)) {
    return res.status(400).json({ error: 'Data tamu tidak valid.' });
  }

  try {
    const org = await prisma.organizations.findFirst({
      where: { OR: [{ id: orgIdOrSlug.length === 36 ? orgIdOrSlug : undefined }, { slug: orgIdOrSlug }] }
    });
    if (!org) return res.status(404).json({ error: 'Organisasi tidak ditemukan' });

    const validGuests = guests.filter(g => g.name && g.identifier);
    if (validGuests.length === 0) {
      return res.status(400).json({ error: 'Tidak ada data tamu yang valid.' });
    }

    // Deduplicate the incoming payload by name (keep the last occurrence)
    const uniqueGuestsMap = new Map();
    validGuests.forEach(g => {
      // Key by lowercase name to prevent same-name duplicates in the upload itself
      uniqueGuestsMap.set(String(g.name).trim().toLowerCase(), { 
        name: String(g.name).trim(), 
        identifier: String(g.identifier).trim(),
        kelas: g.kelas ? String(g.kelas).trim() : null
      });
    });
    const uniqueGuests = Array.from(uniqueGuestsMap.values());

    const existingGuests = await prisma.org_guests.findMany({
      where: { organization_id: org.id },
      select: { identifier: true, name: true, id: true }
    });
    
    const existingByIdentifier = new Map(existingGuests.map(g => [g.identifier, g.id]));
    const existingByName = new Map(existingGuests.map(g => [g.name.toLowerCase(), g.id]));

    const ops = uniqueGuests.map(g => {
      const existingId = existingByIdentifier.get(g.identifier) || existingByName.get(g.name.toLowerCase());
      
      if (existingId) {
        return prisma.org_guests.update({
          where: { id: existingId },
          data: { 
            name: g.name,
            identifier: g.identifier,
            ...(g.kelas ? { custom_data: { kelas: g.kelas } } : {})
          }
        });
      } else {
        return prisma.org_guests.create({
          data: {
            organization_id: org.id,
            name: g.name,
            identifier: g.identifier,
            custom_data: g.kelas ? { kelas: g.kelas } : {}
          }
        });
      }
    });

    const createdGuests = await prisma.$transaction(ops);

    res.status(201).json({ message: `${createdGuests.length} tamu berhasil ditambahkan.`, data: createdGuests });
  } catch (error) {
    console.error('Error uploading guests:', error);
    res.status(500).json({ error: 'Terjadi kesalahan saat menyimpan data tamu.' });
  }
};

export const scanGuestQR = async (req: Request, res: Response) => {
  const { orgIdOrSlug, sessionId } = req.params;
  const { qrToken } = req.body;

  if (!qrToken) {
    return res.status(400).json({ error: 'QR Token wajib diisi.' });
  }

  try {
    const org = await prisma.organizations.findFirst({
      where: { OR: [{ id: orgIdOrSlug.length === 36 ? orgIdOrSlug : undefined }, { slug: orgIdOrSlug }] }
    });
    if (!org) return res.status(404).json({ error: 'Organisasi tidak ditemukan' });

    let guest = null;
    if (qrToken.length === 36) {
      guest = await prisma.org_guests.findFirst({
        where: {
          organization_id: org.id,
          OR: [{ qr_token: qrToken }, { identifier: qrToken }]
        }
      });
    } else {
      guest = await prisma.org_guests.findFirst({
        where: {
          organization_id: org.id,
          identifier: qrToken
        }
      });
    }

    // Jika tidak ditemukan dengan exact match, coba cari substring (ID ada di dalam raw string QR)
    if (!guest) {
      const allGuests = await prisma.org_guests.findMany({
        where: { organization_id: org.id },
        select: { id: true, identifier: true, qr_token: true }
      });
      
      // Sort berdasarkan panjang identifier (terpanjang lebih dulu) untuk menghindari partial match ID pendek
      allGuests.sort((a, b) => b.identifier.length - a.identifier.length);

      const matchedPartial = allGuests.find(g => qrToken.includes(g.identifier));
      if (matchedPartial) {
        guest = await prisma.org_guests.findUnique({ where: { id: matchedPartial.id } });
      }
    }

    if (!guest) {
      return res.status(404).json({ error: 'QR Code tidak valid atau bukan tamu dari organisasi ini.' });
    }

    const session = await prisma.attendance_sessions.findUnique({
      where: { id: sessionId.length === 36 ? sessionId : undefined }
    });

    if (!session || !session.is_active) {
      return res.status(400).json({ error: 'Sesi absen sudah tidak aktif atau tidak ditemukan.' });
    }

    const existingCheckin = await prisma.guest_attendance.findFirst({
      where: {
        session_id: sessionId,
        guest_id: guest.id
      }
    });

    if (existingCheckin) {
      return res.status(400).json({ error: 'Tamu ini sudah melakukan check-in di sesi ini.' });
    }

    const updatedGuest = await prisma.guest_attendance.create({
      data: {
        session_id: sessionId,
        guest_id: guest.id,
        status: 'present',
        check_in_time: new Date()
      }
    });

    res.json({ message: 'Berhasil check-in.', data: updatedGuest });
  } catch (error) {
    console.error('Error scanning guest QR:', error);
    res.status(500).json({ error: 'Terjadi kesalahan saat scan QR.' });
  }
};
export const getGuestStats = async (req: Request, res: Response) => {
  const { orgIdOrSlug, sessionId } = req.params;

  try {
    const org = await prisma.organizations.findFirst({
      where: { OR: [{ id: orgIdOrSlug.length === 36 ? orgIdOrSlug : undefined }, { slug: orgIdOrSlug }] }
    });
    if (!org) return res.status(404).json({ error: 'Organisasi tidak ditemukan' });

    const session = await prisma.attendance_sessions.findUnique({
      where: { id: sessionId }
    });
    if (!session) return res.status(404).json({ error: 'Sesi tidak ditemukan' });

    // Total guests in this organization
    const totalGuests = await prisma.org_guests.count({
      where: { organization_id: org.id }
    });

    // Count present and late guests for this session
    const guestAttendance = await prisma.guest_attendance.groupBy({
      by: ['status'],
      where: { session_id: sessionId },
      _count: { status: true }
    });

    let tepatCount = 0;
    let terlambatCount = 0;

    guestAttendance.forEach(item => {
      if (item.status === 'present') tepatCount += item._count.status;
      if (item.status === 'late') terlambatCount += item._count.status;
    });

    const alphaCount = Math.max(0, totalGuests - tepatCount - terlambatCount);
    const presentPercentage = totalGuests > 0 ? Math.round(((tepatCount + terlambatCount) / totalGuests) * 100) : 0;

    return res.json({
      sessionTitle: session.title,
      stats: {
        total: totalGuests,
        tepat: tepatCount,
        terlambat: terlambatCount,
        alpha: alphaCount,
        percentage: presentPercentage
      }
    });

  } catch (error) {
    console.error('Error getting guest stats:', error);
    res.status(500).json({ error: 'Gagal memuat statistik tamu' });
  }
};

export const getGuestAnalytics = async (req: Request, res: Response) => {
  const { orgIdOrSlug } = req.params;

  try {
    const org = await prisma.organizations.findFirst({
      where: { OR: [{ id: orgIdOrSlug.length === 36 ? orgIdOrSlug : undefined }, { slug: orgIdOrSlug }] }
    });
    if (!org) return res.status(404).json({ error: 'Organisasi tidak ditemukan' });

    // 1. Total Guests
    const totalGuests = await prisma.org_guests.count({
      where: { organization_id: org.id }
    });

    // 2. Fetch all sessions to calculate applicable sessions per guest
    const allSessions = await prisma.attendance_sessions.findMany({
      where: { organization_id: org.id },
      select: { id: true, start_time: true }
    });
    const totalSessions = allSessions.length;

    // 3. Guest Stats per Guest
    const allGuests = await prisma.org_guests.findMany({
      where: { organization_id: org.id },
      include: ({
        guest_attendance: {
          select: { status: true, session_id: true }
        },
        guest_leaves: true
      } as any),
      orderBy: { name: 'asc' }
    });

    let overallTepat = 0;
    let overallTerlambat = 0;
    let overallIzin = 0;
    let overallSakit = 0;
    let overallAlpha = 0;

    const guestList = allGuests.map(guest => {
      let tepat = 0;
      let terlambat = 0;
      const attendedSessionIds = new Set<string>();
      
      (guest as any).guest_attendance.forEach((att: any) => {
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
      const applicableSessions = allSessions.filter(s => s.start_time <= now && s.start_time >= guest.created_at);
      
      let izin = 0;
      let sakit = 0;
      const leavesBySession = new Map<string, any>();
      (guest as any).guest_leaves.forEach((leave: any) => leavesBySession.set(leave.session_id, leave));

      applicableSessions.forEach((session: any) => {
        if (!attendedSessionIds.has(session.id)) {
          const leave = leavesBySession.get(session.id);
          if (leave) {
            let finalType = leave.type;
            if (finalType === 'sakit' && !leave.proof_url) {
              const ageHours = (Date.now() - new Date(leave.created_at).getTime()) / (1000 * 60 * 60);
              if (ageHours > 24) finalType = 'izin';
            }
            if (finalType === 'sakit') sakit++;
            else izin++;
          }
        }
      });

      const totalLeaves = izin + sakit;

      overallTepat += tepat;
      overallTerlambat += terlambat;
      overallIzin += izin;
      overallSakit += sakit;

      const alpha = Math.max(0, applicableSessions.length - (tepat + terlambat + totalLeaves));
      
      let percentage = 0;
      if (applicableSessions.length > 0) {
        percentage = Math.min(100, Math.round(((tepat + terlambat) / applicableSessions.length) * 100));
      }
      
      overallAlpha += alpha;

      return {
        id: guest.id,
        name: guest.name,
        identifier: guest.identifier,
        kelas: ((guest as any).custom_data && (guest as any).custom_data.kelas) ? (guest as any).custom_data.kelas : null,
        stats: { tepat, terlambat, izin, sakit, alpha, percentage }
      };
    });

    // 4. Daily Trend (last 7 days of guest_attendance)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentAttendance = await prisma.guest_attendance.findMany({
      where: {
        session: { organization_id: org.id },
        created_at: { gte: sevenDaysAgo }
      },
      select: {
        status: true,
        created_at: true
      }
    });

    // Group by date (YYYY-MM-DD)
    const dailyData: Record<string, { tepat: number, terlambat: number }> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      dailyData[dateStr] = { tepat: 0, terlambat: 0 };
    }

    recentAttendance.forEach(att => {
      const dateStr = att.created_at.toISOString().split('T')[0];
      if (dailyData[dateStr]) {
        if (att.status === 'present') dailyData[dateStr].tepat++;
        if (att.status === 'late') dailyData[dateStr].terlambat++;
      }
    });

    const dailyTrend = Object.keys(dailyData).map(date => ({
      date,
      tepat: dailyData[date].tepat,
      terlambat: dailyData[date].terlambat
    }));

    return res.json({
      overall: {
        totalGuests,
        totalSessions,
        tepat: overallTepat,
        terlambat: overallTerlambat,
        izin: overallIzin,
        sakit: overallSakit,
        alpha: overallAlpha
      },
      dailyTrend,
      guestList
    });

  } catch (error) {
    console.error('Error getting guest analytics:', error);
    res.status(500).json({ error: 'Gagal memuat analitik tamu' });
  }
};

// 2. Get Active Session (We define active as is_active=true AND now() < end_time)
export async function getActiveSession(req: any, res: Response) {
  const orgMemberContext = req.orgMember;
  const { sessionId } = req.params;

  if (!orgMemberContext) {
    return res.status(403).json({ error: 'Akses ditolak' });
  }

  try {
    let session = null;
    if (sessionId && sessionId !== 'null') {
      session = await prisma.attendance_sessions.findFirst({
        where: { id: sessionId.length === 36 ? sessionId : undefined }
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
      where: { id: sessionId.length === 36 ? sessionId : undefined },
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
  const { pin, latitude, longitude, accuracy, status, proof_url, notes } = req.body;

  if (!orgMemberContext) {
    return res.status(403).json({ error: 'Akses ditolak' });
  }

  try {
    let activeSession: any = null;

    if (status === 'present') {
      activeSession = await prisma.attendance_sessions.findFirst({
        where: {
          AND: [
            {
              OR: [
                { organization_id: orgMemberContext.organizationId },
                { shared_with_orgs: { has: orgMemberContext.organizationId } }
              ]
            },
            {
              OR: [
                { pin_code: pin },
                { checkout_pin_code: pin }
              ]
            }
          ],
          is_active: true
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

      // Validasi GPS untuk Pulang (Sekarang Opsional)
      if (latitude != null && longitude != null) {
        distance_meters = calculateDistance(activeSession.latitude, activeSession.longitude, latitude, longitude);
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
        // Validasi GPS untuk Datang (Sekarang Opsional)
        if (latitude != null && longitude != null) {
          distance_meters = calculateDistance(activeSession.latitude, activeSession.longitude, latitude, longitude);
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
    // Get ongoing or upcoming active sessions
    const sessions = await prisma.attendance_sessions.findMany({
      where: {
        is_active: true,
        OR: [
          { organization_id: orgMemberContext.organizationId },
          { shared_with_orgs: { has: orgMemberContext.organizationId } }
        ],
        AND: [
          {
            OR: [
              { start_time: { gte: now } },
              { end_time: { gte: now } }
            ]
          }
        ]
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

// 11. Manual Bulk Check-In (Bantu Absen oleh Head/Sekretaris/Delegasi)
export async function manualBulkCheckIn(req: any, res: Response) {
  const orgMemberContext = req.orgMember;
  const { sessionId } = req.params;
  const { profileIds, pin } = req.body;

  if (!orgMemberContext) {
    return res.status(403).json({ error: 'Akses ditolak' });
  }

  try {
    // Cek authorization: harus head, sekretaris, atau memiliki custom_data.can_take_attendance = true
    const callerMembership = await prisma.organization_members.findUnique({
      where: {
        organization_id_profile_id: {
          organization_id: orgMemberContext.organizationId,
          profile_id: req.user.id
        }
      }
    });

    const customData = callerMembership?.custom_data as any;
    const canDelegate = customData?.can_take_attendance === true;

    if (callerMembership?.role !== 'head' && callerMembership?.role !== 'sekretaris' && !canDelegate) {
      return res.status(403).json({ error: 'Akses ditolak: Anda tidak memiliki wewenang untuk mengambil absensi' });
    }

    if (!profileIds || !Array.isArray(profileIds) || profileIds.length === 0) {
      return res.status(400).json({ error: 'Daftar anggota yang akan diabsenkan kosong' });
    }

    if (!pin) {
      return res.status(400).json({ error: 'PIN wajib diisi untuk keamanan' });
    }

    const session = await prisma.attendance_sessions.findUnique({
      where: { id: sessionId.length === 36 ? sessionId : undefined }
    });

    if (!session) {
      return res.status(404).json({ error: 'Sesi absensi tidak ditemukan' });
    }

    const validOrgs = [session.organization_id, ...(session.shared_with_orgs || [])];
    if (!validOrgs.includes(orgMemberContext.organizationId)) {
      return res.status(403).json({ error: 'Akses ditolak: Anda bukan bagian dari sesi absensi ini' });
    }

    let isCheckOut = false;

    if (session.session_type === 'in_out' && session.checkout_pin_code === pin) {
      isCheckOut = true;
    } else if (session.pin_code !== pin) {
      return res.status(400).json({ error: 'PIN tidak valid' });
    }

    const now = new Date();
      
    const results = [];
    let failedCount = 0;

    for (const pid of profileIds) {
      // Cari asal organisasi member ini (di antara validOrgs)
      const memberOrg = await prisma.organization_members.findFirst({
        where: {
          profile_id: pid,
          organization_id: { in: validOrgs }
        }
      });
      const memberOrgId = memberOrg ? memberOrg.organization_id : orgMemberContext.organizationId;

      const existing = await prisma.attendance.findFirst({
        where: { session_id: session.id, profile_id: pid }
      });

      if (isCheckOut) {
        // Harus sudah absen datang dulu
        if (!existing) {
          failedCount++;
          continue;
        }
        // Kalau sudah absen pulang, lewati
        if (existing.check_out_time) {
          continue;
        }
        const updated = await prisma.attendance.update({
          where: { id: existing.id },
          data: { check_out_time: now, notes: existing.notes ? existing.notes + ' [PULANG BY DELEGATE]' : '[PULANG BY DELEGATE]' } as any
        });
        results.push(updated);
      } else {
        // Absen Datang
        if (!existing) {
          const record = await prisma.attendance.create({
            data: {
              organization_id: memberOrgId,
              profile_id: pid,
              session_id: session.id,
              status: 'present',
              notes: '[MANUAL CHECK-IN BY DELEGATE]',
              check_in_time: now
            } as any
          });
          results.push(record);
        }
      }
    }

    const msg = failedCount > 0 
      ? `Berhasil mengabsenkan ${results.length} anggota (${failedCount} gagal karena belum absen datang).`
      : `Berhasil mengabsenkan ${results.length} anggota.`;

    return res.status(200).json({ message: msg, records: results });
  } catch (err) {
    console.error('Error manual bulk check-in:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

