import { Request, Response } from 'express';
import { prisma } from '../config/db';

async function resolveOrgId(req: Request, orgIdOrSlug: string): Promise<string | null> {
  const memberOrgId = (req as any).orgMember?.organizationId;
  if (memberOrgId) return memberOrgId;

  const org = await prisma.organizations.findFirst({
    where: { OR: [{ id: orgIdOrSlug.length === 36 ? orgIdOrSlug : undefined }, { slug: orgIdOrSlug }] },
    select: { id: true }
  });
  return org ? org.id : null;
}

export const getSchedules = async (req: Request, res: Response) => {
  const { orgIdOrSlug } = req.params;
  try {
    const orgId = await resolveOrgId(req, orgIdOrSlug);
    if (!orgId) return res.status(404).json({ error: 'Organisasi tidak ditemukan' });

    const schedules = await prisma.attendance_schedules.findMany({
      where: { organization_id: orgId },
      orderBy: { created_at: 'desc' }
    });
    res.json(schedules);
  } catch (error) {
    console.error('Error getting schedules:', error);
    res.status(500).json({ error: 'Terjadi kesalahan saat memuat jadwal.' });
  }
};

export const createSchedule = async (req: Request, res: Response) => {
  const { orgIdOrSlug } = req.params;
  const { title, session_type, latitude, longitude, radius_meters, days_of_week, start_time, end_time, late_time } = req.body;

  try {
    const orgId = await resolveOrgId(req, orgIdOrSlug);
    if (!orgId) return res.status(404).json({ error: 'Organisasi tidak ditemukan' });

    const schedule = await prisma.attendance_schedules.create({
      data: {
        organization_id: orgId,
        created_by: (req as any).user!.id,
        title: title || 'Sesi Rutin',
        session_type: session_type || 'in_only',
        latitude: !isNaN(parseFloat(latitude)) ? parseFloat(latitude) : 0,
        longitude: !isNaN(parseFloat(longitude)) ? parseFloat(longitude) : 0,
        radius_meters: parseInt(radius_meters) || 50,
        days_of_week: days_of_week, // Array of Int
        start_time: start_time,
        end_time: end_time,
        late_time: late_time || null,
        is_active: true
      }
    });

    res.status(201).json({ message: 'Jadwal berhasil dibuat', data: schedule });
  } catch (error) {
    console.error('Error creating schedule:', error);
    res.status(500).json({ error: 'Terjadi kesalahan saat membuat jadwal.' });
  }
};

export const deleteSchedule = async (req: Request, res: Response) => {
  const { scheduleId } = req.params;
  try {
    await prisma.attendance_schedules.delete({
      where: { id: scheduleId }
    });

    res.json({ message: 'Jadwal berhasil dihapus' });
  } catch (error) {
    console.error('Error deleting schedule:', error);
    res.status(500).json({ error: 'Terjadi kesalahan saat menghapus jadwal.' });
  }
};

export const toggleSchedule = async (req: Request, res: Response) => {
  const { scheduleId } = req.params;
  const { is_active } = req.body;
  try {
    const updated = await prisma.attendance_schedules.update({
      where: { id: scheduleId },
      data: { is_active }
    });

    res.json({ message: 'Status jadwal berhasil diubah', data: updated });
  } catch (error) {
    console.error('Error toggling schedule:', error);
    res.status(500).json({ error: 'Terjadi kesalahan saat mengubah status jadwal.' });
  }
};
