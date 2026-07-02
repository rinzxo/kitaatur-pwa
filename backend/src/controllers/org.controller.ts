import { Request, Response } from 'express' // Trigger TS Recheck
import { prisma } from '../config/db'
import { sendPushNotification } from './notification.controller'
import { supabaseAdmin } from '../config/supabaseAdmin'
import { org_member_role, Prisma } from '@prisma/client'

// 1. Membuat Organisasi Baru (Akses: Pengguna Premium / Head)
export async function createOrganization(req: Request, res: Response) {
  const userId = (req as any).user?.id
  const { name, slug } = req.body

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized user' })
  }

  if (!name || !slug) {
    return res.status(400).json({ error: 'Nama dan Slug organisasi wajib diisi' })
  }

  try {
    // A. Cek Subscription User
    const activeSub = await prisma.subscriptions.findFirst({
      where: {
        profile_id: userId,
        status: 'active',
        expires_at: { gt: new Date() }
      }
    })

    if (!activeSub) {
      return res.status(403).json({
        error: 'Silakan berlangganan paket KitaAtur Plus atau Enterprise untuk membuat organisasi.'
      })
    }

    if (activeSub.plan_type === 'plus') {
      const orgCount = await prisma.organizations.count({
        where: { owner_id: userId }
      })
      if (orgCount >= 1) {
        return res.status(403).json({
          error: 'Paket KitaAtur Plus hanya dapat membuat maksimal 1 organisasi. Silakan hubungi Sales untuk upgrade ke Enterprise.'
        })
      }
    }

    // B. Buat organisasi & masukkan pembuat sebagai Head di organization_members
    const organization = await prisma.$transaction(async (tx) => {
      const newOrg = await tx.organizations.create({
        data: {
          name,
          slug,
          owner_id: userId
        }
      })

      await tx.organization_members.create({
        data: {
          organization_id: newOrg.id,
          profile_id: userId,
          role: 'head'
        }
      })

      return newOrg
    })

    return res.status(201).json(organization)
  } catch (err: any) {
    console.error('Error creating organization:', err)
    if (err.code === 'P2002') {
      return res.status(400).json({ error: 'Slug organisasi sudah digunakan, harap pilih slug lain' })
    }
    return res.status(500).json({ error: err.message || 'Internal Server Error', details: err })
  }
}

// 2. Mengambil List Anggota Organisasi (Akses: Semua Anggota Terdaftar)
export async function getOrganizationMembers(req: Request, res: Response) {
  const orgMemberContext = (req as any).orgMember

  if (!orgMemberContext) {
    return res.status(403).json({ error: 'Akses organisasi dibatasi' })
  }

  try {
    const members = await prisma.organization_members.findMany({
      where: {
        organization_id: orgMemberContext.organizationId
      },
      include: {
        profile: {
          select: {
            id: true,
            email: true,
            full_name: true,
            avatar_url: true
          }
        }
      },
      orderBy: {
        joined_at: 'asc'
      }
    })

    return res.status(200).json(members)
  } catch (err) {
    console.error('Error fetching members:', err)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
}

// 3. Menambahkan Anggota Baru (Akses: Hanya Head)
export async function addOrganizationMember(req: Request, res: Response) {
  const orgMemberContext = (req as any).orgMember
  const { email, fullName, role } = req.body

  if (!orgMemberContext || orgMemberContext.role !== 'head') {
    return res.status(403).json({ error: 'Akses ditolak: Hanya Head yang dapat mengelola anggota' })
  }

  if (!email || !fullName) {
    return res.status(400).json({ error: 'Email dan Nama Lengkap wajib diisi' })
  }

  const selectedRole = (role || 'member') as org_member_role

  try {
    // A. Cari apakah email sudah terdaftar di profiles
    let profile = await prisma.profiles.findUnique({
      where: { email }
    })

    let targetProfileId = profile?.id

    // B. Jika email belum terdaftar di profiles, buat akun Supabase Auth baru secara administratif
    if (!targetProfileId) {
      console.log(`[Admin SDK] Creating user for email: ${email}`)
      const defaultPassword = 'KitaAtur123!'
      const { data: adminUser, error: adminError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: defaultPassword,
        email_confirm: true,
        user_metadata: {
          full_name: fullName
        }
      })

      if (adminError || !adminUser.user) {
        console.error('[Admin SDK Error]:', adminError)
        return res.status(500).json({ error: 'Gagal membuat akun member baru via Admin SDK' })
      }

      targetProfileId = adminUser.user.id
      
      // Tunggu split-second untuk trigger sinkronisasi profil selesai di DB
      let retries = 5
      while (retries > 0) {
        profile = await prisma.profiles.findUnique({
          where: { id: targetProfileId }
        })
        if (profile) break
        await new Promise((resolve) => setTimeout(resolve, 300))
        retries--
      }
    }

    // C. Cek apakah user sudah tergabung dalam organisasi ini
    const existingMember = await prisma.organization_members.findUnique({
      where: {
        organization_id_profile_id: {
          organization_id: orgMemberContext.organizationId,
          profile_id: targetProfileId!
        }
      }
    })

    if (existingMember) {
      return res.status(400).json({ error: 'Pengguna tersebut sudah tergabung dalam organisasi ini' })
    }

    // D. Hubungkan user ke organisasi sebagai member
    const newMemberRelation = await prisma.organization_members.create({
      data: {
        organization_id: orgMemberContext.organizationId,
        profile_id: targetProfileId!,
        role: selectedRole
      },
      include: {
        profile: {
          select: {
            id: true,
            email: true,
            full_name: true
          }
        }
      }
    })

    // Kirim notifikasi
    const orgInfo = await prisma.organizations.findUnique({
      where: { id: orgMemberContext.organizationId }
    })
    
    if (orgInfo) {
      await sendPushNotification(
        targetProfileId,
        'Selamat Datang',
        `Anda telah ditambahkan ke workspace ${orgInfo.name}.`,
        `/org/${orgInfo.slug}`
      )
    }

    return res.status(201).json(newMemberRelation)
  } catch (err) {
    console.error('Error adding organization member:', err)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
}

// 4. Mengubah Role Anggota (Akses: Hanya Head)
export async function updateMemberRole(req: Request, res: Response) {
  const orgMemberContext = (req as any).orgMember
  const { memberProfileId } = req.params
  const { role } = req.body

  if (!orgMemberContext || orgMemberContext.role !== 'head') {
    return res.status(403).json({ error: 'Akses ditolak: Hanya Head yang dapat mengelola anggota' })
  }

  if (!role) {
    return res.status(400).json({ error: 'Field role wajib dikirimkan' })
  }

  const selectedRole = role as org_member_role

  try {
    // A. Pastikan yang diubah bukan akun Head itu sendiri
    const targetMember = await prisma.organization_members.findUnique({
      where: {
        organization_id_profile_id: {
          organization_id: orgMemberContext.organizationId,
          profile_id: memberProfileId
        }
      }
    })

    if (!targetMember) {
      return res.status(404).json({ error: 'Anggota tidak ditemukan di organisasi ini' })
    }

    if (targetMember.profile_id === (req as any).user?.id) {
      return res.status(400).json({ error: 'Anda tidak dapat mengubah role Anda sendiri' })
    }

    // B. Update role keanggotaan
    if (selectedRole === 'head') {
      // Logika Transfer Kepemilikan
      const transaction = await prisma.$transaction([
        // 1. Turunkan Head saat ini menjadi Member biasa
        prisma.organization_members.update({
          where: {
            organization_id_profile_id: {
              organization_id: orgMemberContext.organizationId,
              profile_id: (req as any).user?.id
            }
          },
          data: { role: 'member' }
        }),
        // 2. Naikkan anggota yang dipilih menjadi Head
        prisma.organization_members.update({
          where: {
            organization_id_profile_id: {
              organization_id: orgMemberContext.organizationId,
              profile_id: memberProfileId
            }
          },
          data: { role: 'head' },
          include: {
            profile: {
              select: {
                full_name: true,
                email: true
              }
            }
          }
        })
      ])
      
      const org = await prisma.organizations.findUnique({ where: { id: orgMemberContext.organizationId } })
      if (org) {
        sendPushNotification(memberProfileId, 'Peran Diperbarui', `Peran Anda di ${org.name} telah diubah menjadi Head.`, `/org/${org.slug}`)
      }
      return res.status(200).json(transaction[1])
    } else {
      // Update role biasa
      const updatedMember = await prisma.organization_members.update({
        where: {
          organization_id_profile_id: {
            organization_id: orgMemberContext.organizationId,
            profile_id: memberProfileId
          }
        },
        data: {
          role: selectedRole
        },
        include: {
          profile: {
            select: {
              full_name: true,
              email: true
            }
          }
        }
      })
      
      const org = await prisma.organizations.findUnique({ where: { id: orgMemberContext.organizationId } })
      if (org) {
        sendPushNotification(memberProfileId, 'Peran Diperbarui', `Peran Anda di ${org.name} telah diubah menjadi ${selectedRole}.`, `/org/${org.slug}`)
      }
      return res.status(200).json(updatedMember)
    }
  } catch (err) {
    console.error('Error updating member role:', err)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
}

// 5. Mendapatkan target organisasi (goals)
export async function getOrgGoals(req: any, res: Response) {
  const orgMemberContext = req.orgMember
  if (!orgMemberContext) {
    return res.status(403).json({ error: 'Bukan anggota organisasi' })
  }

  try {
    const goals = await prisma.goals.findMany({
      where: {
        organization_id: orgMemberContext.organizationId
      },
      orderBy: {
        created_at: 'desc'
      }
    })

    const currentDate = new Date();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

    const enhancedGoals = await Promise.all(goals.map(async (goal) => {
      if (goal.type === 'budget' && goal.budget_category) {
        // Hitung total pengeluaran untuk kategori ini di bulan berjalan
        const expenses = await prisma.financial_records.aggregate({
          where: {
            organization_id: orgMemberContext.organizationId,
            type: 'expense',
            category: goal.budget_category,
            transaction_date: {
              gte: firstDayOfMonth,
              lte: lastDayOfMonth
            }
          },
          _sum: {
            amount: true
          }
        });
        
        return {
          ...goal,
          current_amount: expenses._sum.amount || 0
        };
      }
      return goal;
    }));

    return res.status(200).json(enhancedGoals)
  } catch (err) {
    console.error('Error fetching org goals:', err)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
}

// 5A. Membuat target organisasi (goals) baru
export async function createOrgGoal(req: any, res: Response) {
  const orgMemberContext = req.orgMember
  const userId = req.user?.id
  const { title, description, target_amount, type, budget_category, period, deadline } = req.body

  if (!orgMemberContext || orgMemberContext.role !== 'bendahara') {
    return res.status(403).json({ error: 'Akses ditolak: Hanya Bendahara yang dapat membuat target tabungan/anggaran' })
  }

  if (!title || !target_amount) {
    return res.status(400).json({ error: 'Field title dan target_amount wajib diisi' })
  }

  try {
    const newGoal = await prisma.goals.create({
      data: {
        organization_id: orgMemberContext.organizationId,
        profile_id: userId,
        title,
        description,
        target_amount: new Prisma.Decimal(target_amount),
        type: type || 'saving',
        budget_category: budget_category || null,
        period: period || 'monthly',
        deadline: deadline ? new Date(deadline) : null
      }
    })

    return res.status(201).json(newGoal)
  } catch (err) {
    console.error('Error creating org goal:', err)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
}

// 5B. Menghapus target organisasi (goals)
export async function deleteOrgGoal(req: any, res: Response) {
  const orgMemberContext = req.orgMember
  const { goalId } = req.params

  if (!orgMemberContext || orgMemberContext.role !== 'bendahara') {
    return res.status(403).json({ error: 'Akses ditolak: Hanya Bendahara yang dapat menghapus target' })
  }

  try {
    const targetGoal = await prisma.goals.findUnique({
      where: { id: goalId }
    })

    if (!targetGoal || targetGoal.organization_id !== orgMemberContext.organizationId) {
      return res.status(404).json({ error: 'Target tidak ditemukan' })
    }

    await prisma.goals.delete({
      where: { id: goalId }
    })

    return res.status(200).json({ success: true, message: 'Target berhasil dihapus' })
  } catch (err) {
    console.error('Error deleting org goal:', err)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
}

// 5C. Menambah progress target tabungan
export async function addGoalProgress(req: any, res: Response) {
  const orgMemberContext = req.orgMember
  const userId = req.user?.id
  const { goalId } = req.params
  const { amount, source, description } = req.body

  if (!orgMemberContext || orgMemberContext.role !== 'bendahara') {
    return res.status(403).json({ error: 'Akses ditolak: Hanya Bendahara yang dapat menambah progress target' })
  }

  if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
    return res.status(400).json({ error: 'Nominal tidak valid' })
  }

  try {
    const targetGoal = await prisma.goals.findUnique({
      where: { id: goalId }
    })

    if (!targetGoal || targetGoal.organization_id !== orgMemberContext.organizationId) {
      return res.status(404).json({ error: 'Target tidak ditemukan' })
    }

    if (targetGoal.type !== 'saving') {
      return res.status(400).json({ error: 'Hanya target tabungan yang bisa diisi saldo' })
    }

    // Jika sumber dari kas, buat financial record
    if (source === 'kas') {
      await prisma.financial_records.create({
        data: {
          organization_id: orgMemberContext.organizationId,
          profile_id: userId,
          amount: new Prisma.Decimal(amount),
          type: 'expense',
          category: 'Alokasi Target',
          description: `Alokasi untuk target: ${targetGoal.title}`
        }
      })
    }

    // Buat riwayat aliran dana target
    await prisma.goal_transactions.create({
      data: {
        goal_id: goalId,
        profile_id: userId,
        amount: new Prisma.Decimal(amount),
        source: source,
        description: description || null
      }
    })

    // Update goal current_amount
    const updatedGoal = await prisma.goals.update({
      where: { id: goalId },
      data: {
        current_amount: {
          increment: new Prisma.Decimal(amount)
        }
      }
    })

    return res.status(200).json(updatedGoal)
  } catch (err) {
    console.error('Error adding goal progress:', err)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
}

// 5D. Mendapatkan riwayat transaksi target tabungan 
export async function getGoalTransactions(req: any, res: Response) {
  const orgMemberContext = req.orgMember
  const { goalId } = req.params

  if (!orgMemberContext) {
    return res.status(403).json({ error: 'Akses ditolak: Anda bukan anggota organisasi ini' })
  }

  try {
    const targetGoal = await prisma.goals.findUnique({
      where: { id: goalId }
    })

    if (!targetGoal || targetGoal.organization_id !== orgMemberContext.organizationId) {
      return res.status(404).json({ error: 'Target tidak ditemukan' })
    }

    const transactions = await prisma.goal_transactions.findMany({
      where: { goal_id: goalId },
      orderBy: { created_at: 'desc' },
      include: {
        profile: {
          select: {
            full_name: true,
            email: true
          }
        }
      }
    })

    return res.status(200).json(transactions)
  } catch (err) {
    console.error('Error fetching goal transactions:', err)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
}

// E5. Mengelola Dana Target Tabungan (Catat Pengeluaran, Pindah Kas, Pindah Target Lain)
export async function manageGoalFunds(req: any, res: Response) {
  // Trigger TS language server reload
  const orgMemberContext = req.orgMember
  const { goalId } = req.params
  const { action, amount, description, destination_goal_id } = req.body
  const userId = req.user?.id

  if (!orgMemberContext || orgMemberContext.role !== 'bendahara') {
    return res.status(403).json({ error: 'Hanya Bendahara yang dapat mengelola dana target' })
  }

  if (!amount || amount <= 0) {
    return res.status(400).json({ error: 'Jumlah harus lebih besar dari 0' })
  }

  try {
    const sourceGoal = await prisma.goals.findUnique({
      where: { id: goalId }
    })

    if (!sourceGoal || sourceGoal.organization_id !== orgMemberContext.organizationId) {
      return res.status(404).json({ error: 'Target sumber tidak ditemukan' })
    }

    if (Number(sourceGoal.current_amount) < Number(amount)) {
      return res.status(400).json({ error: 'Saldo target tidak mencukupi untuk tindakan ini' })
    }

    // Gunakan transaksi database untuk memastikan data konsisten
    await prisma.$transaction(async (tx) => {
      // 1. Kurangi saldo target sumber
      await tx.goals.update({
        where: { id: goalId },
        data: { current_amount: { decrement: amount } }
      })

      if (action === 'expense') {
        // Catat sebagai pengeluaran target
        await tx.goal_transactions.create({
          data: {
            goal_id: goalId,
            profile_id: userId,
            amount: new Prisma.Decimal(amount),
            type: 'expense',
            source: 'target',
            description: description || 'Pengeluaran dari target'
          } as any
        })
      } else if (action === 'transfer_kas') {
        // Pindahkan ke Kas (Catat di target sebagai transfer out)
        await tx.goal_transactions.create({
          data: {
            goal_id: goalId,
            profile_id: userId,
            amount: new Prisma.Decimal(amount),
            type: 'transfer_out',
            source: 'target',
            description: description || 'Ditarik kembali ke Kas Utama'
          } as any
        })

        // Masukkan ke financial_records sebagai Pemasukan (Pencairan Target)
        await tx.financial_records.create({
          data: {
            organization_id: orgMemberContext.organizationId,
            profile_id: userId,
            amount: new Prisma.Decimal(amount),
            type: 'income',
            category: 'Pencairan Target',
            description: description || `Pencairan dari target: ${sourceGoal.title}`
          }
        })
      } else if (action === 'transfer_goal') {
        // Pindahkan ke Target Lain
        if (!destination_goal_id) {
          throw new Error('ID target tujuan harus diisi')
        }

        const destGoal = await tx.goals.findUnique({
          where: { id: destination_goal_id }
        })

        if (!destGoal || destGoal.organization_id !== orgMemberContext.organizationId) {
          throw new Error('Target tujuan tidak valid')
        }

        // Catat transfer keluar di target sumber
        await tx.goal_transactions.create({
          data: {
            goal_id: goalId,
            profile_id: userId,
            amount: new Prisma.Decimal(amount),
            type: 'transfer_out',
            source: 'target',
            description: description || `Dipindahkan ke target: ${destGoal.title}`
          } as any
        })

        // Tambah saldo target tujuan
        await tx.goals.update({
          where: { id: destination_goal_id },
          data: { current_amount: { increment: amount } }
        })

        // Catat transfer masuk di target tujuan
        await tx.goal_transactions.create({
          data: {
            goal_id: destination_goal_id,
            profile_id: userId,
            amount: new Prisma.Decimal(amount),
            type: 'income',
            source: 'target',
            description: description || `Pindahan dari target: ${sourceGoal.title}`
          } as any
        })
      } else {
        throw new Error('Aksi tidak valid')
      }
    })

    return res.status(200).json({ message: 'Pengelolaan dana target berhasil' })
  } catch (err: any) {
    console.error('Error managing goal funds:', err)
    return res.status(500).json({ error: err.message || 'Internal Server Error' })
  }
}
// 6. Mendapatkan daftar organisasi milik pengguna yang sedang login (Workspace Switcher)
export async function getMyOrganizations(req: Request, res: Response) {
  const userId = (req as any).user?.id

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized user' })
  }

  try {
    const myOrgs = await prisma.organization_members.findMany({
      where: {
        profile_id: userId
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
            logo_url: true
          }
        }
      },
      orderBy: {
        joined_at: 'asc'
      }
    })

    // Format respons agar lebih rapi (mengangkat data organization ke atas)
    const formattedOrgs = myOrgs.map((member: any) => ({
      role: member.role,
      joined_at: member.joined_at,
      ...member.organization
    }))

    return res.status(200).json(formattedOrgs)
  } catch (err) {
    console.error('Error fetching user organizations:', err)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
}
// 7. Mendapatkan Pengaturan Organisasi (Akses: Semua Anggota)
export async function getOrganizationSettings(req: Request, res: Response) {
  const orgMemberContext = (req as any).orgMember

  if (!orgMemberContext) {
    return res.status(403).json({ error: 'Akses organisasi dibatasi' })
  }

  try {
    // Menggunakan queryRaw untuk menghindari error Prisma Schema tidak sinkron di Windows
    const result = await prisma.$queryRawUnsafe<any[]>(
      `SELECT dues_target_amount, dues_presets, custom_fields_schema FROM public.organizations WHERE id = $1::uuid`,
      orgMemberContext.organizationId
    )

    if (!result || result.length === 0) {
      return res.status(404).json({ error: 'Organisasi tidak ditemukan' })
    }

    return res.status(200).json(result[0])
  } catch (err) {
    console.error('Error fetching org settings:', err)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
}

// 7b. Mengupdate Profil Organisasi (Akses: Head)
export async function updateOrganization(req: Request, res: Response) {
  const orgMemberContext = (req as any).orgMember
  const { name, logo_url } = req.body

  if (!orgMemberContext || orgMemberContext.role !== 'head') {
    return res.status(403).json({ error: 'Akses ditolak: Hanya Ketua yang dapat mengubah profil organisasi' })
  }

  if (!name || name.trim() === '') {
    return res.status(400).json({ error: 'Nama organisasi tidak boleh kosong' })
  }

  try {
    const updatedOrg = await prisma.organizations.update({
      where: { id: orgMemberContext.organizationId },
      data: {
        name,
        logo_url: logo_url || null
      }
    })

    return res.status(200).json({ message: 'Profil organisasi berhasil diperbarui', org: updatedOrg })
  } catch (err) {
    console.error('Error updating org profile:', err)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
}

// 8. Menyimpan Pengaturan Organisasi (Akses: Head & Bendahara)
export async function updateOrganizationSettings(req: Request, res: Response) {
  const orgMemberContext = (req as any).orgMember
  const { dues_target_amount, dues_presets } = req.body

  if (!orgMemberContext || orgMemberContext.role !== 'bendahara') {
    return res.status(403).json({ error: 'Akses ditolak: Hanya Bendahara yang dapat mengubah pengaturan iuran' })
  }

  try {
    // Menggunakan executeRaw untuk menghindari error Prisma Schema
    await prisma.$executeRawUnsafe(
      `UPDATE public.organizations SET dues_target_amount = $1, dues_presets = $2 WHERE id = $3::uuid`,
      dues_target_amount || null,
      dues_presets || null,
      orgMemberContext.organizationId
    )

    return res.status(200).json({
      dues_target_amount: dues_target_amount || null,
      dues_presets: dues_presets || null
    })
  } catch (err) {
    console.error('Error updating org settings:', err)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
}

// F3. Ubah Skema Data Tambahan Anggota (Hanya Head)
export async function updateOrgCustomFields(req: Request, res: Response) {
  const orgMemberContext = (req as any).orgMember
  const { custom_fields_schema } = req.body

  if (!orgMemberContext || orgMemberContext.role !== 'head') {
    return res.status(403).json({ error: 'Akses ditolak: Hanya Ketua yang dapat mengubah skema data tambahan' })
  }

  try {
    await prisma.$executeRawUnsafe(
      `UPDATE public.organizations SET custom_fields_schema = $1::jsonb WHERE id = $2::uuid`,
      custom_fields_schema ? JSON.stringify(custom_fields_schema) : null,
      orgMemberContext.organizationId
    )

    return res.status(200).json({
      success: true,
      custom_fields_schema
    })
  } catch (err) {
    console.error('Error updating custom fields schema:', err)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
}

// F4. Update Data Tambahan Anggota (Diri sendiri atau Head)
export async function updateMemberCustomData(req: Request, res: Response) {
  const orgMemberContext = (req as any).orgMember
  const { memberProfileId } = req.params
  const { custom_data } = req.body
  const currentUserId = (req as any).user.id

  if (!orgMemberContext) return res.status(401).json({ error: 'Unauthorized' })

  // Hanya bisa diedit oleh Head atau pemilik data itu sendiri
  if (orgMemberContext.role !== 'head' && currentUserId !== memberProfileId) {
    return res.status(403).json({ error: 'Akses ditolak: Anda hanya dapat mengubah data Anda sendiri' })
  }

  try {
    await prisma.$executeRawUnsafe(
      `UPDATE public.organization_members SET custom_data = $1::jsonb WHERE organization_id = $2::uuid AND profile_id = $3::uuid`,
      custom_data ? JSON.stringify(custom_data) : null,
      orgMemberContext.organizationId,
      memberProfileId
    )

    return res.status(200).json({
      success: true,
      message: 'Data berhasil diperbarui'
    })
  } catch (err) {
    console.error('Error updating member custom data:', err)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
}



// 7. Invite Link Features

// Generate random invite code (e.g. 10 chars)
function generateInviteCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < 10; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

// 7A. Ambil atau Buat Invite Code (Akses: Head/Sekretaris)
export async function getInviteCode(req: any, res: Response) {
  const orgMemberContext = req.orgMember

  try {
    const org = await prisma.organizations.findUnique({
      where: { id: orgMemberContext.organizationId },
      select: { invite_code: true }
    })

    if (!org) return res.status(404).json({ error: 'Organisasi tidak ditemukan' })

    if (org.invite_code) {
      return res.status(200).json({ success: true, invite_code: org.invite_code })
    }

    // Jika belum punya invite_code, buatkan
    const newCode = generateInviteCode()
    await prisma.organizations.update({
      where: { id: orgMemberContext.organizationId },
      data: { invite_code: newCode }
    })

    return res.status(200).json({ success: true, invite_code: newCode })
  } catch (err) {
    console.error('Error getting invite code:', err)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
}

// 7B. Reset Invite Code (Akses: Head/Sekretaris)
export async function resetInviteCode(req: any, res: Response) {
  const orgMemberContext = req.orgMember

  try {
    const newCode = generateInviteCode()
    await prisma.organizations.update({
      where: { id: orgMemberContext.organizationId },
      data: { invite_code: newCode }
    })

    return res.status(200).json({ success: true, invite_code: newCode, message: 'Link invite berhasil direset' })
  } catch (err) {
    console.error('Error resetting invite code:', err)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
}

// 7C. Ambil Data Org Berdasarkan Invite Code (Public)
export async function getOrgByInviteCode(req: Request, res: Response) {
  const { code } = req.params
  if (!code) return res.status(400).json({ error: 'Invite code diperlukan' })

  try {
    const org = await prisma.organizations.findUnique({
      where: { invite_code: code },
      select: {
        id: true,
        name: true,
        slug: true,
        logo_url: true,
        custom_fields_schema: true
      }
    })

    if (!org) {
      return res.status(404).json({ error: 'Link invite tidak valid atau sudah kadaluarsa' })
    }

    return res.status(200).json({ success: true, organization: org })
  } catch (err) {
    console.error('Error fetching org by invite code:', err)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
}

// 7D. Bergabung ke Organisasi via Invite Code (Require Auth)
export async function joinOrganization(req: any, res: Response) {
  const userId = req.user?.id
  const { invite_code } = req.body

  if (!userId) return res.status(401).json({ error: 'Unauthorized' })
  if (!invite_code) return res.status(400).json({ error: 'Invite code diperlukan' })

  try {
    const org = await prisma.organizations.findUnique({
      where: { invite_code }
    })

    if (!org) {
      return res.status(404).json({ error: 'Link invite tidak valid' })
    }

    // Cek apakah user sudah menjadi anggota
    const existingMember = await prisma.organization_members.findUnique({
      where: {
        organization_id_profile_id: {
          organization_id: org.id,
          profile_id: userId
        }
      }
    })

    if (existingMember) {
      return res.status(200).json({ 
        success: true, 
        message: 'Anda sudah menjadi anggota organisasi ini',
        organization: org
      })
    }

    // Tambahkan user sebagai anggota (Gunakan SQL Native jika Prisma error)
    await prisma.$executeRawUnsafe(
      `INSERT INTO public.organization_members (organization_id, profile_id, role, custom_data) VALUES ($1::uuid, $2::uuid, 'member', $3::jsonb)`,
      org.id,
      userId,
      req.body.custom_data ? JSON.stringify(req.body.custom_data) : null
    )

    // Kirim notifikasi ke Head(s)
    const joiner = await prisma.profiles.findUnique({ where: { id: userId } })
    const heads = await prisma.organization_members.findMany({
      where: { organization_id: org.id, role: 'head' },
      select: { profile_id: true }
    })
    
    if (joiner && heads.length > 0) {
      for (const head of heads) {
        // Jangan kirim notifikasi jika head yang join (misal bug/owner)
        if (head.profile_id !== userId) {
          await sendPushNotification(
            head.profile_id,
            'Anggota Baru Bergabung',
            `${joiner.full_name || 'Seseorang'} telah bergabung ke workspace ${org.name}.`,
            `/org/${org.slug}/members`
          )
        }
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Berhasil bergabung ke organisasi',
      organization: org
    })
  } catch (err) {
    console.error('Error joining organization:', err)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
}

// 4. Mengeluarkan anggota dari organisasi (Akses: Head)
export async function removeOrganizationMember(req: Request, res: Response) {
  const orgMemberContext = (req as any).orgMember
  const { memberProfileId } = req.params

  if (!orgMemberContext || orgMemberContext.role !== 'head') {
    return res.status(403).json({ error: 'Akses ditolak: Hanya Head yang dapat mengeluarkan anggota' })
  }

  if (orgMemberContext.profileId === memberProfileId) {
    return res.status(400).json({ error: 'Tidak dapat mengeluarkan diri sendiri. Silakan transfer kepemilikan terlebih dahulu jika ingin keluar.' })
  }

  try {
    // Pastikan member yang mau di-kick itu benar ada dan bukan owner
    const memberToKick = await prisma.organization_members.findUnique({
      where: {
        organization_id_profile_id: {
          organization_id: orgMemberContext.organizationId,
          profile_id: memberProfileId
        }
      }
    })

    if (!memberToKick) {
      return res.status(404).json({ error: 'Anggota tidak ditemukan di organisasi ini' })
    }

    if (memberToKick.role === 'head') {
      return res.status(400).json({ error: 'Tidak dapat mengeluarkan anggota dengan role Head' })
    }

    // Hapus dari organization_members
    await prisma.organization_members.delete({
      where: {
        organization_id_profile_id: {
          organization_id: orgMemberContext.organizationId,
          profile_id: memberProfileId
        }
      }
    })

    return res.status(200).json({ success: true, message: 'Anggota berhasil dikeluarkan' })
  } catch (err) {
    console.error('Error removing member:', err)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
}
