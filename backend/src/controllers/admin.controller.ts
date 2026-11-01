import { Request, Response } from 'express'
import { prisma } from '../config/db'
import { sendBroadcastWebPush } from './notification.controller'

// 1. Get System Stats
export async function getSystemStats(req: Request, res: Response) {
  try {
    const [totalUsers, totalOrgs, activeSubs, incomeRecords] = await Promise.all([
      prisma.profiles.count(),
      prisma.organizations.count(),
      prisma.subscriptions.count({ where: { status: 'active' } }),
      prisma.financial_records.aggregate({
        _sum: { amount: true },
        where: { type: 'income' }
      })
    ]);
    
    return res.status(200).json({
      totalUsers,
      totalOrgs,
      activeSubs,
      totalIncome: incomeRecords._sum.amount || 0
    })
  } catch (err) {
    console.error('Error fetching stats:', err)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
}

// 2. Get All Organizations (with their owners)
export async function getAllOrgs(req: Request, res: Response) {
  try {
    const orgs = await prisma.organizations.findMany({
      include: {
        owner: true,
        _count: {
          select: {
            organization_members: true,
            school_links_as_school: true
          }
        }
      },
      orderBy: { created_at: 'desc' }
    })
    return res.status(200).json(orgs)
  } catch (err) {
    console.error('Error fetching orgs:', err)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
}

// 2b. Create School Organization directly from Admin Panel
export async function createSchoolOrgAdmin(req: Request, res: Response) {
  const user = (req as any).user
  const { name, slug, owner_email } = req.body

  if (!name || !slug) {
    return res.status(400).json({ error: 'Nama dan Slug sekolah wajib diisi.' })
  }

  const cleanSlug = slug.toLowerCase().trim().replace(/[^a-z0-9-]/g, '-')

  try {
    const existing = await prisma.organizations.findUnique({
      where: { slug: cleanSlug }
    })
    if (existing) {
      return res.status(400).json({ error: 'Slug organisasi ini sudah digunakan. Gunakan slug lain.' })
    }

    let ownerId: string | null = null

    if (owner_email && owner_email.trim()) {
      const targetProfile = await prisma.profiles.findFirst({
        where: { email: { equals: owner_email.trim(), mode: 'insensitive' } }
      })
      if (targetProfile && targetProfile.id !== user?.id) {
        ownerId = targetProfile.id
      }
    }

    const org = await prisma.$transaction(async (tx) => {
      const newOrg = await tx.organizations.create({
        data: {
          name,
          slug: cleanSlug,
          owner_id: ownerId,
          is_edu: true,
          edu_pin: '1234'
        }
      })

      // Hanya daftarkan anggota jika owner_email diisi dan bukan admin itu sendiri
      if (ownerId) {
        await tx.organization_members.create({
          data: {
            organization_id: newOrg.id,
            profile_id: ownerId,
            role: 'head'
          }
        })
      }

      // Admin tidak didaftarkan sebagai anggota (Vanish Mode: bisa akses dan kelola tanpa tercatat sebagai anggota)
      return newOrg
    })

    return res.status(201).json({
      success: true,
      message: `Organisasi Sekolah ${org.name} berhasil dibuat!`,
      org
    })
  } catch (err: any) {
    console.error('Error creating school org admin:', err)
    return res.status(500).json({ error: err.message || 'Gagal membuat organisasi sekolah.' })
  }
}

// 3. Manage Subscriptions Manually
export async function grantSubscription(req: Request, res: Response) {
  const { profile_id, plan_type } = req.body
  try {
    const end_date = new Date()
    end_date.setFullYear(end_date.getFullYear() + 1)

    const sub = await prisma.subscriptions.create({
      data: {
        profile_id,
        plan_type,
        status: 'active',
        starts_at: new Date(),
        expires_at: end_date
      }
    })
    return res.status(200).json({ message: 'Subscription granted successfully', sub })
  } catch (err) {
    console.error('Error granting sub:', err)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
}

// 4. Get System Settings (for maintenance)
export async function getSystemSettings(req: Request, res: Response) {
  try {
    const settings = await prisma.$queryRawUnsafe('SELECT * FROM public.system_settings')
    return res.status(200).json(settings)
  } catch (err) {
    console.error('Error fetching settings:', err)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
}

// 5. Update System Settings (Toggle Maintenance)
export async function updateSystemSetting(req: Request, res: Response) {
  const { key } = req.params
  const { value, description } = req.body
  try {
    const setting = await prisma.$queryRawUnsafe(
      `INSERT INTO public.system_settings (key, value, description, updated_at) 
       VALUES ($1, $2::jsonb, $3, NOW())
       ON CONFLICT (key) DO UPDATE SET value = $2::jsonb, description = $3, updated_at = NOW()
       RETURNING *`,
      key, JSON.stringify(value), description || null
    )
    return res.status(200).json({ message: 'Setting updated successfully', setting })
  } catch (err) {
    console.error('Error updating setting:', err)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
}

// 6. Announcements
export async function getAnnouncementsAdmin(req: Request, res: Response) {
  try {
    const announcements = await prisma.$queryRawUnsafe('SELECT * FROM public.announcements ORDER BY created_at DESC')
    return res.status(200).json(announcements)
  } catch (err) {
    console.error('Error fetching announcements:', err)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
}

export async function createAnnouncement(req: Request, res: Response) {
  const { title, content, type, starts_at, ends_at } = req.body
  try {
    const rows: any = await prisma.$queryRawUnsafe(
      `INSERT INTO public.announcements (title, content, type, starts_at, ends_at)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
       title, content, type || 'info', starts_at ? new Date(starts_at) : null, ends_at ? new Date(ends_at) : null
    )
    const announcement = Array.isArray(rows) ? rows[0] : rows

    // 1. Broadcast ke dalam daftar notifikasi (public.notifications) seluruh pengguna aktif
    try {
      await prisma.$executeRawUnsafe(
        `INSERT INTO public.notifications (id, profile_id, title, body, is_read, created_at)
         SELECT gen_random_uuid(), id, $1, $2, false, NOW()
         FROM public.profiles`,
        `[Pengumuman] ${title}`,
        content
      )
    } catch (notifErr) {
      console.error('Error inserting broadcast notifications for all profiles:', notifErr)
    }

    // 2. Kirim Web Push Notification ke seluruh perangkat yang berlangganan push
    sendBroadcastWebPush(`[Pengumuman] ${title}`, content, '/notifications').catch(err => {
      console.error('Error sending broadcast push notification:', err)
    })

    return res.status(201).json(announcement)
  } catch (err) {
    console.error('Error creating announcement:', err)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
}

export async function deleteAnnouncement(req: Request, res: Response) {
  const { id } = req.params
  try {
    await prisma.$executeRawUnsafe('DELETE FROM public.announcements WHERE id = $1::uuid', id)
    return res.status(200).json({ message: 'Announcement deleted' })
  } catch (err) {
    console.error('Error deleting announcement:', err)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
}

// 7. Get Active Announcements for Public
export async function getActiveAnnouncements(req: Request, res: Response) {
  try {
    const announcements = await prisma.$queryRawUnsafe(
      `SELECT * FROM public.announcements 
       WHERE is_active = true 
       AND (starts_at IS NULL OR starts_at <= NOW())
       AND (ends_at IS NULL OR ends_at >= NOW())
       ORDER BY created_at DESC`
    )
    return res.status(200).json(announcements)
  } catch (err) {
    console.error('Error fetching public announcements:', err)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
}

// 8. Hard Delete Org
export async function forceDeleteOrg(req: Request, res: Response) {
  const { id } = req.params
  try {
    await prisma.organizations.delete({ where: { id } })
    return res.status(200).json({ message: 'Organization deleted' })
  } catch (err) {
    console.error('Error deleting org:', err)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
}

// 9. Get School Linked Orgs (Admin)
export async function getSchoolLinkedOrgsAdmin(req: Request, res: Response) {
  const { schoolId } = req.params
  try {
    const school = await prisma.organizations.findUnique({
      where: { id: schoolId },
      select: { id: true, name: true, slug: true, logo_url: true }
    })

    if (!school) {
      return res.status(404).json({ error: 'Sekolah tidak ditemukan' })
    }

    const linkedLinks = await prisma.school_linked_orgs.findMany({
      where: { school_org_id: schoolId },
      include: {
        linked_org: {
          select: {
            id: true,
            name: true,
            slug: true,
            logo_url: true,
            created_at: true,
            _count: {
              select: { organization_members: true }
            }
          }
        }
      },
      orderBy: { created_at: 'asc' }
    })

    const linkedOrgIds = linkedLinks.map(l => l.linked_org_id)
    linkedOrgIds.push(schoolId) // Jangan masukkan sekolah itu sendiri

    // Ambil daftar organisasi yang belum ditautkan untuk opsi penambahan
    const availableOrgs = await prisma.organizations.findMany({
      where: {
        id: { notIn: linkedOrgIds }
      },
      select: {
        id: true,
        name: true,
        slug: true,
        logo_url: true,
        _count: {
          select: { organization_members: true }
        }
      },
      orderBy: { name: 'asc' }
    })

    return res.status(200).json({
      school,
      linked_orgs: linkedLinks.map(l => ({
        link_id: l.id,
        linked_at: l.created_at,
        ...l.linked_org
      })),
      available_orgs: availableOrgs
    })
  } catch (err) {
    console.error('Error getting school links admin:', err)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
}

// 10. Link Orgs to School (Admin)
export async function linkOrgsToSchoolAdmin(req: Request, res: Response) {
  const { schoolId } = req.params
  const { org_ids } = req.body

  if (!Array.isArray(org_ids) || org_ids.length === 0) {
    return res.status(400).json({ error: 'Pilih minimal satu organisasi untuk ditautkan.' })
  }

  try {
    const school = await prisma.organizations.findUnique({
      where: { id: schoolId }
    })

    if (!school) {
      return res.status(404).json({ error: 'Sekolah tidak ditemukan.' })
    }

    // Tautkan setiap org_id ke schoolId (abaikan jika self-linking)
    const validOrgIds = org_ids.filter(id => id !== schoolId)

    await Promise.all(
      validOrgIds.map(async (targetOrgId) => {
        try {
          await prisma.school_linked_orgs.upsert({
            where: {
              school_org_id_linked_org_id: {
                school_org_id: schoolId,
                linked_org_id: targetOrgId
              }
            },
            create: {
              school_org_id: schoolId,
              linked_org_id: targetOrgId
            },
            update: {}
          })
        } catch (e) {
          // Abaikan duplicate
        }
      })
    )

    return res.status(200).json({
      success: true,
      message: `Berhasil menautkan ${validOrgIds.length} organisasi ke ${school.name}`
    })
  } catch (err) {
    console.error('Error linking orgs to school admin:', err)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
}

// 11. Unlink Org from School (Admin)
export async function unlinkOrgFromSchoolAdmin(req: Request, res: Response) {
  const { schoolId, orgId } = req.params
  try {
    await prisma.school_linked_orgs.deleteMany({
      where: {
        school_org_id: schoolId,
        linked_org_id: orgId
      }
    })

    return res.status(200).json({
      success: true,
      message: 'Tautan organisasi berhasil dilepas.'
    })
  } catch (err) {
    console.error('Error unlinking org from school admin:', err)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
}

// 12. Public App Info (Version, Build, Environment, License)
export async function getPublicAppInfo(req: Request, res: Response) {
  try {
    const results = await prisma.$queryRawUnsafe<any[]>(
      "SELECT key, value, updated_at FROM public.system_settings WHERE key IN ('app_version', 'app_build_number', 'app_environment', 'app_license')"
    )

    let version = '3.0.1'
    let buildNumber = '20261101.0608'
    let environment = 'Production (Beta)'
    let license = 'Organisasi Terdaftar'

    results.forEach((r) => {
      let val = r.value
      if (typeof val === 'string') {
        try {
          val = JSON.parse(val)
        } catch {
          val = val.replace(/^"|"$/g, '')
        }
      }
      if (val !== undefined && val !== null) {
        const clean = String(val).replace(/^"|"$/g, '')
        if (r.key === 'app_version') version = clean
        if (r.key === 'app_build_number') buildNumber = clean
        if (r.key === 'app_environment') environment = clean
        if (r.key === 'app_license') license = clean
      }
    })

    return res.status(200).json({
      version,
      buildNumber,
      environment,
      license
    })
  } catch (err) {
    console.error('Error fetching public app info:', err)
    return res.status(200).json({
      version: '3.0.1',
      buildNumber: '20261101.0608',
      environment: 'Production (Beta)',
      license: 'Organisasi Terdaftar'
    })
  }
}

// Helper: Generate build number berdasarkan timestamp (YYYYMMDD.HHmm)
function generateBuildNumber() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const date = String(now.getDate()).padStart(2, '0')
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  return `${year}${month}${date}.${hours}${minutes}`
}

// 13. Update System App Info (Admin: Version, Auto Build Number, Environment, License)
export async function updateSystemAppInfo(req: Request, res: Response) {
  const { version, environment, license, customBuildNumber } = req.body

  try {
    const finalVersion = (version && String(version).trim()) || '3.0.1'
    const finalEnv = (environment && String(environment).trim()) || 'Production (Beta)'
    const finalLicense = (license && String(license).trim()) || 'Organisasi Terdaftar'
    // Tiap kali disimpan, build number otomatis baru (atau pakai custom jika diisi)
    const finalBuildNumber = (customBuildNumber && String(customBuildNumber).trim()) || generateBuildNumber()

    await prisma.$transaction([
      prisma.$executeRawUnsafe(
        `INSERT INTO public.system_settings (key, value, description, updated_at)
         VALUES ('app_version', to_jsonb($1::text), 'Versi aplikasi saat ini', NOW())
         ON CONFLICT (key) DO UPDATE SET value = to_jsonb($1::text), updated_at = NOW()`,
        finalVersion
      ),
      prisma.$executeRawUnsafe(
        `INSERT INTO public.system_settings (key, value, description, updated_at)
         VALUES ('app_build_number', to_jsonb($1::text), 'Nomor build aplikasi', NOW())
         ON CONFLICT (key) DO UPDATE SET value = to_jsonb($1::text), updated_at = NOW()`,
        finalBuildNumber
      ),
      prisma.$executeRawUnsafe(
        `INSERT INTO public.system_settings (key, value, description, updated_at)
         VALUES ('app_environment', to_jsonb($1::text), 'Status lingkungan sistem', NOW())
         ON CONFLICT (key) DO UPDATE SET value = to_jsonb($1::text), updated_at = NOW()`,
        finalEnv
      ),
      prisma.$executeRawUnsafe(
        `INSERT INTO public.system_settings (key, value, description, updated_at)
         VALUES ('app_license', to_jsonb($1::text), 'Lisensi pengguna sistem', NOW())
         ON CONFLICT (key) DO UPDATE SET value = to_jsonb($1::text), updated_at = NOW()`,
        finalLicense
      )
    ])

    return res.status(200).json({
      success: true,
      message: 'Pengaturan sistem aplikasi berhasil diperbarui!',
      appInfo: {
        version: finalVersion,
        buildNumber: finalBuildNumber,
        environment: finalEnv,
        license: finalLicense
      }
    })
  } catch (err: any) {
    console.error('Error updating system app info:', err)
    return res.status(500).json({ error: 'Gagal memperbarui pengaturan sistem aplikasi.' })
  }
}


