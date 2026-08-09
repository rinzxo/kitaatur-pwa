import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getSchedules = async (req: Request, res: Response) => {
  const { orgIdOrSlug } = req.params;
  try {
    const org = await prisma.organizations.findFirst({
      where: { OR: [{ id: orgIdOrSlug.length === 36 ? orgIdOrSlug : undefined }, { slug: orgIdOrSlug }] }
    });
    if (!org) return res.status(404).json({ error: 'Organisasi tidak ditemukan' });

    const schedules = await prisma.attendance_schedules.findMany({
      where: { organization_id: org.id },
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
    const org = await prisma.organizations.findFirst({
      where: { OR: [{ id: orgIdOrSlug.length === 36 ? orgIdOrSlug : undefined }, { slug: orgIdOrSlug }] }
    });
    if (!org) return res.status(404).json({ error: 'Organisasi tidak ditemukan' });

    const schedule = await prisma.attendance_schedules.create({
      data: {
        organization_id: org.id,
        created_by: (req as any).user!.id,
        title: title || 'Sesi Rutin',
        session_type: session_type || 'in_only',
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
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
  const { orgIdOrSlug, scheduleId } = req.params;
  try {
    const org = await prisma.organizations.findFirst({
      where: { OR: [{ id: orgIdOrSlug.length === 36 ? orgIdOrSlug : undefined }, { slug: orgIdOrSlug }] }
    });
    if (!org) return res.status(404).json({ error: 'Organisasi tidak ditemukan' });

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
  const { orgIdOrSlug, scheduleId } = req.params;
  const { is_active } = req.body;
  try {
    const org = await prisma.organizations.findFirst({
      where: { OR: [{ id: orgIdOrSlug.length === 36 ? orgIdOrSlug : undefined }, { slug: orgIdOrSlug }] }
    });
    if (!org) return res.status(404).json({ error: 'Organisasi tidak ditemukan' });

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
