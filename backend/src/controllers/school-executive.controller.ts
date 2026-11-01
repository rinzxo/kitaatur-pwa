import { Request, Response } from 'express'
import { prisma } from '../config/db'

// 1. Get Executive Overview for School (Kepsek & Wakasek)
export async function getSchoolExecutiveOverview(req: Request, res: Response) {
  const orgMemberContext = (req as any).orgMember
  if (!orgMemberContext) {
    return res.status(403).json({ error: 'Akses ditolak.' })
  }

  const schoolId = orgMemberContext.organizationId

  try {
    const school = await prisma.organizations.findUnique({
      where: { id: schoolId },
      select: {
        id: true,
        name: true,
        slug: true,
        logo_url: true,
      }
    })

    if (!school) {
      return res.status(404).json({ error: 'Organisasi sekolah tidak ditemukan.' })
    }

    // Ambil seluruh ekskul yang ditautkan ke sekolah ini
    const linkedLinks = await prisma.school_linked_orgs.findMany({
      where: { school_org_id: school.id },
      include: {
        linked_org: {
          select: {
            id: true,
            name: true,
            slug: true,
            logo_url: true,
            created_at: true,
            organization_members: {
              where: {
                role: { in: ['head', 'vice_head', 'auditor'] }
              },
              select: {
                role: true,
                profile: {
                  select: {
                    id: true,
                    full_name: true,
                    email: true,
                    avatar_url: true
                  }
                }
              }
            },
            _count: {
              select: {
                organization_members: true
              }
            }
          }
        }
      },
      orderBy: { created_at: 'asc' }
    })

    if (linkedLinks.length === 0) {
      return res.status(200).json({
        school,
        has_linked_orgs: false,
        summary: {
          total_ekskul: 0,
          total_students: 0,
          total_cash: 0,
          avg_attendance: 0,
          active_sessions_30d: 0
        },
        ekskuls: []
      })
    }

    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    let totalStudents = 0
    let totalCashAll = 0
    let attendanceRates: number[] = []
    let totalActiveSessions30d = 0

    // Fetch stats for each linked ekskul in parallel
    const ekskulsData = await Promise.all(
      linkedLinks.map(async (link) => {
        const org = link.linked_org
        const memberCount = org._count.organization_members
        totalStudents += memberCount

        // 1. Pembina / Leader
        const membersWithRoles = org.organization_members
        const mainLeader = membersWithRoles.find(m => m.role === 'head') || membersWithRoles.find(m => m.role === 'vice_head') || null
        const mainAdvisor = membersWithRoles.find(m => m.role === 'auditor') || null

        // 2. Financial calculation
        const [incomeAgg, expenseAgg, lastTx] = await Promise.all([
          prisma.financial_records.aggregate({
            _sum: { amount: true },
            where: { organization_id: org.id, type: 'income' }
          }),
          prisma.financial_records.aggregate({
            _sum: { amount: true },
            where: { organization_id: org.id, type: 'expense' }
          }),
          prisma.financial_records.findFirst({
            where: { organization_id: org.id },
            orderBy: { transaction_date: 'desc' },
            select: {
              amount: true,
              type: true,
              transaction_date: true,
              category: true
            }
          })
        ])

        const totalIncome = Number(incomeAgg._sum.amount || 0)
        const totalExpense = Number(expenseAgg._sum.amount || 0)
        const currentBalance = totalIncome - totalExpense
        totalCashAll += currentBalance

        // 3. Attendance calculation
        const [lastSession, sessions30dCount] = await Promise.all([
          prisma.attendance_sessions.findFirst({
            where: {
              OR: [
                { organization_id: org.id },
                { shared_with_orgs: { has: org.id } }
              ]
            },
            orderBy: { start_time: 'desc' },
            include: {
              _count: {
                select: {
                  attendance: {
                    where: {
                      organization_id: org.id,
                      status: 'present'
                    }
                  }
                }
              }
            }
          }),
          prisma.attendance_sessions.count({
            where: {
              OR: [
                { organization_id: org.id },
                { shared_with_orgs: { has: org.id } }
              ],
              start_time: { gte: thirtyDaysAgo }
            }
          })
        ])

        totalActiveSessions30d += sessions30dCount

        let lastSessionData = null
        if (lastSession) {
          const presentCount = lastSession._count.attendance
          const totalEligible = Math.max(presentCount, memberCount)
          const attendanceRate = totalEligible > 0 ? Math.min(100, Math.round((presentCount / totalEligible) * 100)) : 0
          attendanceRates.push(attendanceRate)

          const diffTime = Math.abs(new Date().getTime() - new Date(lastSession.start_time).getTime())
          const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

          lastSessionData = {
            id: lastSession.id,
            title: lastSession.title,
            start_time: lastSession.start_time,
            is_active: lastSession.is_active,
            present_count: presentCount,
            attendance_rate: attendanceRate,
            days_ago: diffDays
          }
        }

        return {
          id: org.id,
          name: org.name,
          slug: org.slug,
          logo_url: org.logo_url,
          created_at: org.created_at,
          member_count: memberCount,
          leader: mainLeader ? {
            name: mainLeader.profile.full_name || mainLeader.profile.email,
            email: mainLeader.profile.email,
            avatar_url: mainLeader.profile.avatar_url,
            role: mainLeader.role
          } : null,
          advisor: mainAdvisor ? {
            name: mainAdvisor.profile.full_name || mainAdvisor.profile.email,
            email: mainAdvisor.profile.email,
            avatar_url: mainAdvisor.profile.avatar_url,
            role: mainAdvisor.role
          } : null,
          finance: {
            total_income: totalIncome,
            total_expense: totalExpense,
            current_balance: currentBalance,
            last_transaction: lastTx
          },
          attendance: {
            sessions_30d: sessions30dCount,
            last_session: lastSessionData
          }
        }
      })
    )

    const avgAttendance = attendanceRates.length > 0
      ? Math.round(attendanceRates.reduce((a, b) => a + b, 0) / attendanceRates.length)
      : 0

    return res.status(200).json({
      school,
      has_linked_orgs: true,
      summary: {
        total_ekskul: linkedLinks.length,
        total_students: totalStudents,
        total_cash: totalCashAll,
        avg_attendance: avgAttendance,
        active_sessions_30d: totalActiveSessions30d
      },
      ekskuls: ekskulsData.sort((a, b) => (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' }))
    })
  } catch (err) {
    console.error('Error getting school executive overview:', err)
    return res.status(500).json({ error: 'Gagal memuat overview eksekutif sekolah.' })
  }
}

// Helper: Resolve linked org by ID or Slug and verify school permission
async function resolveLinkedOrg(schoolId: string, targetOrgIdOrSlug: string) {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetOrgIdOrSlug)
  const org = await prisma.organizations.findFirst({
    where: isUuid ? { id: targetOrgIdOrSlug } : { slug: targetOrgIdOrSlug },
    select: {
      id: true,
      name: true,
      slug: true,
      logo_url: true,
      description: true,
      created_at: true,
    }
  })

  if (!org) return null

  // Verify link or same school
  if (org.id === schoolId) return org

  const link = await prisma.school_linked_orgs.findUnique({
    where: {
      school_org_id_linked_org_id: {
        school_org_id: schoolId,
        linked_org_id: org.id
      }
    }
  })

  if (!link) return null

  return org
}

// 2. Get Detail of a Specific Linked Ekskul (Quick Peek Drawer with Student Performance Recap)
export async function getSchoolLinkedOrgDetail(req: Request, res: Response) {
  const orgMemberContext = (req as any).orgMember
  const { targetOrgId } = req.params

  if (!orgMemberContext) {
    return res.status(403).json({ error: 'Akses ditolak.' })
  }

  const schoolId = orgMemberContext.organizationId

  try {
    const org = await resolveLinkedOrg(schoolId, targetOrgId)
    if (!org) {
      return res.status(404).json({ error: 'Ekskul ini tidak ditautkan ke sekolah Anda.' })
    }

    // Ambil profil ekskul, transaksi terakhir, sesi absensi terakhir, daftar anggota, dan rekap kehadiran
    const [transactions, sessions, members, allAttendance, totalSessionsCount] = await Promise.all([
      prisma.financial_records.findMany({
        where: { organization_id: org.id },
        orderBy: { transaction_date: 'desc' },
        take: 30,
        select: {
          id: true,
          amount: true,
          type: true,
          category: true,
          description: true,
          transaction_date: true,
          receipt_url: true
        }
      }),
      prisma.attendance_sessions.findMany({
        where: {
          OR: [
            { organization_id: org.id },
            { shared_with_orgs: { has: org.id } }
          ]
        },
        orderBy: { start_time: 'desc' },
        take: 20,
        include: {
          _count: {
            select: {
              attendance: {
                where: { organization_id: org.id }
              }
            }
          }
        }
      }),
      prisma.organization_members.findMany({
        where: { organization_id: org.id },
        include: {
          profile: {
            select: {
              id: true,
              full_name: true,
              email: true,
              avatar_url: true
            }
          }
        },
        orderBy: [
          { role: 'asc' },
          { joined_at: 'asc' }
        ]
      }),
      prisma.attendance.findMany({
        where: { organization_id: org.id },
        select: {
          profile_id: true,
          status: true,
        }
      }),
      prisma.attendance_sessions.count({
        where: {
          OR: [
            { organization_id: org.id },
            { shared_with_orgs: { has: org.id } }
          ]
        }
      })
    ])

    // Hitung rekap kehadiran tiap siswa di ekskul ini
    const leaderMember = members.find(m => m.role === 'head') || members.find(m => m.role === 'vice_head') || null
    const advisorMember = members.find(m => m.role === 'auditor') || null

    const studentStatsMap = new Map<string, { present: number; sick: number; permit: number }>()
    allAttendance.forEach(a => {
      if (!studentStatsMap.has(a.profile_id)) {
        studentStatsMap.set(a.profile_id, { present: 0, sick: 0, permit: 0 })
      }
      const st = studentStatsMap.get(a.profile_id)!
      const rawStatus = (a.status as string)?.toLowerCase()
      if (rawStatus === 'present' || rawStatus === 'late') st.present++
      else if (rawStatus === 'sick') st.sick++
      else if (rawStatus === 'excused' || rawStatus === 'permit') st.permit++
    })

    const membersWithRecap = members
      .filter(m => m.role !== 'auditor')
      .map(m => {
        const stats = studentStatsMap.get(m.profile_id) || { present: 0, sick: 0, permit: 0 }
        const memberJoinTime = new Date(m.joined_at).getTime()
        const eligibleSessions = sessions.filter(s => {
          const sTime = new Date(s.start_time || s.created_at).getTime()
          return sTime >= memberJoinTime
        })
        const totalEligible = eligibleSessions.length
        const alpha = totalEligible > 0 ? Math.max(0, totalEligible - (stats.present + stats.sick + stats.permit)) : 0
        const rate = totalEligible > 0 ? Math.min(100, Math.round((stats.present / totalEligible) * 100)) : 100

        return {
          id: m.id,
          role: m.role,
          joined_at: m.joined_at,
          name: m.profile.full_name || m.profile.email,
          email: m.profile.email,
          avatar_url: m.profile.avatar_url,
          present_count: stats.present,
          sick_count: stats.sick,
          permit_count: stats.permit,
          alpha_count: alpha,
          total_sessions: totalEligible,
          attendance_rate: rate,
        }
      })
      .sort((a, b) => (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' }))

    return res.status(200).json({
      ekskul: {
        ...org,
        leader: leaderMember ? {
          name: leaderMember.profile.full_name || leaderMember.profile.email,
          email: leaderMember.profile.email,
          avatar_url: leaderMember.profile.avatar_url,
          role: leaderMember.role
        } : null,
        advisor: advisorMember ? {
          name: advisorMember.profile.full_name || advisorMember.profile.email,
          email: advisorMember.profile.email,
          avatar_url: advisorMember.profile.avatar_url,
          role: advisorMember.role
        } : null
      },
      total_sessions_count: totalSessionsCount,
      transactions,
      sessions: sessions.map(s => {
        const sessionTime = new Date(s.start_time || s.created_at).getTime()
        const membersAtThatTime = members.filter(m => 
          m.role !== 'auditor' && new Date(m.joined_at).getTime() <= sessionTime
        ).length
        const totalEligible = Math.max(s._count.attendance, membersAtThatTime)
        const rate = totalEligible > 0 ? Math.min(100, Math.round((s._count.attendance / totalEligible) * 100)) : 0

        return {
          id: s.id,
          title: s.title,
          session_type: s.session_type,
          start_time: s.start_time,
          end_time: s.end_time,
          is_active: s.is_active,
          attendee_count: s._count.attendance,
          attendance_rate: rate
        }
      }),
      members: membersWithRecap
    })
  } catch (err) {
    console.error('Error getting linked org detail:', err)
    return res.status(500).json({ error: 'Gagal memuat detail ekskul.' })
  }
}

// 3. Get Student Attendance Detail for a Specific Session (Hadir, Izin, Sakit, Alpa)
export async function getSchoolLinkedOrgSessionDetail(req: Request, res: Response) {
  const orgMemberContext = (req as any).orgMember
  const { targetOrgId, sessionId } = req.params

  if (!orgMemberContext) {
    return res.status(403).json({ error: 'Akses ditolak.' })
  }

  const schoolId = orgMemberContext.organizationId

  try {
    const org = await resolveLinkedOrg(schoolId, targetOrgId)
    if (!org) {
      return res.status(404).json({ error: 'Ekskul ini tidak ditautkan ke sekolah Anda.' })
    }

    const session = await prisma.attendance_sessions.findFirst({
      where: {
        id: sessionId,
        OR: [
          { organization_id: org.id },
          { shared_with_orgs: { has: org.id } }
        ]
      }
    })

    if (!session) {
      return res.status(404).json({ error: 'Sesi absensi tidak ditemukan.' })
    }

    // Sesi waktu pelaksanaan
    const sessionTime = new Date(session.start_time || session.created_at).getTime()

    // Ambil seluruh anggota ekskul saat ini (kecuali pembina/auditor)
    const currentMembers = await prisma.organization_members.findMany({
      where: { 
        organization_id: org.id,
        role: { not: 'auditor' as any }
      },
      include: {
        profile: {
          select: {
            id: true,
            full_name: true,
            email: true,
            avatar_url: true,
          }
        }
      },
      orderBy: [
        { role: 'asc' },
        { profile: { full_name: 'asc' } }
      ]
    })

    // Ambil catatan presensi di sesi ini KHUSUS untuk organisasi yang sedang diinspeksi
    // (Termasuk member lama organisasi ini yang sekarang sudah keluar, agar datanya tetap ada dan tidak tercampur organisasi kolaborasi lain)
    const records = await prisma.attendance.findMany({
      where: { 
        session_id: sessionId,
        organization_id: org.id
      },
      include: {
        profile: {
          select: {
            id: true,
            full_name: true,
            email: true,
            avatar_url: true,
          }
        }
      },
      orderBy: { check_in_time: 'asc' }
    })

    const currentMemberMap = new Map<string, any>()
    currentMembers.forEach(m => currentMemberMap.set(m.profile_id, m))

    const processedProfileIds = new Set<string>()
    const attendeeList: any[] = []

    let presentCount = 0
    let sickCount = 0
    let permitCount = 0
    let alphaCount = 0

    // 1. Masukkan SEMUA siswa yang memiliki catatan presensi di sesi ini
    // (Baik yang masih anggota maupun member lama yang sudah keluar agar datanya tetap ada dan tidak hilang)
    for (const rec of records) {
      if (!rec.profile) continue
      processedProfileIds.add(rec.profile_id)

      const currentMember = currentMemberMap.get(rec.profile_id)
      let status: 'present' | 'sick' | 'permit' | 'alpha' = 'alpha'
      const rawStatus = (rec.status as string)?.toLowerCase()
      if (rawStatus === 'present' || rawStatus === 'late') {
        status = 'present'
        presentCount++
      } else if (rawStatus === 'sick') {
        status = 'sick'
        sickCount++
      } else if (rawStatus === 'excused' || rawStatus === 'permit') {
        status = 'permit'
        permitCount++
      } else {
        status = 'alpha'
        alphaCount++
      }

      attendeeList.push({
        member_id: currentMember?.id || null,
        profile_id: rec.profile_id,
        name: rec.profile.full_name || rec.profile.email,
        email: rec.profile.email,
        avatar_url: rec.profile.avatar_url,
        role: currentMember?.role || 'alumni',
        is_ex_member: !currentMember,
        status,
        check_in_time: rec.check_in_time,
        proof_url: rec.proof_url,
        notes: rec.notes,
      })
    }

    // 2. Untuk anggota yang SUDAH MENJADI ANGGOTA saat sesi berlangsung (joined_at <= sessionTime) tapi tidak ada rekam jejak:
    // Tandai sebagai Alpa.
    // PENTING: Member baru yang join SETELAH sesi diadakan (joined_at > sessionTime) TIDAK DIMASUKKAN ke sesi lampau ini!
    for (const m of currentMembers) {
      if (processedProfileIds.has(m.profile_id)) continue

      const memberJoinedTime = new Date(m.joined_at).getTime()
      // Jika baru bergabung setelah sesi presensi ini dilaksanakan, jangan dimasukkan dan jangan dihitung alpa
      if (memberJoinedTime > sessionTime) {
        continue
      }

      alphaCount++
      attendeeList.push({
        member_id: m.id,
        profile_id: m.profile_id,
        name: m.profile.full_name || m.profile.email,
        email: m.profile.email,
        avatar_url: m.profile.avatar_url,
        role: m.role,
        is_ex_member: false,
        status: 'alpha',
        check_in_time: null,
        proof_url: null,
        notes: null,
      })
    }

    // Urutkan siswa berdasarkan nama alfabetis (A-Z)
    attendeeList.sort((a, b) => (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' }))

    const totalExpected = attendeeList.length
    const attendanceRate = totalExpected > 0 ? Math.min(100, Math.round((presentCount / totalExpected) * 100)) : 0

    return res.status(200).json({
      org,
      session: {
        id: session.id,
        title: session.title,
        session_type: session.session_type,
        start_time: session.start_time,
        end_time: session.end_time,
        is_active: session.is_active,
        radius_meters: session.radius_meters,
        pin_code: session.pin_code,
        created_at: session.created_at,
        closed_at: session.closed_at,
      },
      summary: {
        total_students: totalExpected,
        present: presentCount,
        sick: sickCount,
        permit: permitCount,
        alpha: alphaCount,
        rate: attendanceRate
      },
      attendees: attendeeList
    })
  } catch (err) {
    console.error('Error fetching linked org session detail:', err)
    return res.status(500).json({ error: 'Gagal memuat detail sesi absensi.' })
  }
}

// 4. Get Full Comprehensive Inspection Report for School Executive (Dedicated Page)
export async function getSchoolLinkedOrgFullReport(req: Request, res: Response) {
  const orgMemberContext = (req as any).orgMember
  const { targetOrgId } = req.params

  if (!orgMemberContext) {
    return res.status(403).json({ error: 'Akses ditolak.' })
  }

  const schoolId = orgMemberContext.organizationId

  try {
    const org = await resolveLinkedOrg(schoolId, targetOrgId)
    if (!org) {
      return res.status(404).json({ error: 'Ekskul ini tidak ditautkan ke sekolah Anda.' })
    }

    const [
      leaderMember,
      advisorMember,
      incomeAgg,
      expenseAgg,
      transactions,
      sessions,
      members,
      allAttendance
    ] = await Promise.all([
      prisma.organization_members.findFirst({
        where: {
          organization_id: org.id,
          role: { in: ['head', 'vice_head'] }
        },
        include: {
          profile: {
            select: { id: true, full_name: true, email: true, avatar_url: true }
          }
        }
      }),
      prisma.organization_members.findFirst({
        where: {
          organization_id: org.id,
          role: 'auditor'
        },
        include: {
          profile: {
            select: { id: true, full_name: true, email: true, avatar_url: true }
          }
        }
      }),
      prisma.financial_records.aggregate({
        _sum: { amount: true },
        where: { organization_id: org.id, type: 'income' }
      }),
      prisma.financial_records.aggregate({
        _sum: { amount: true },
        where: { organization_id: org.id, type: 'expense' }
      }),
      prisma.financial_records.findMany({
        where: { organization_id: org.id },
        orderBy: { transaction_date: 'desc' },
        take: 100,
        select: {
          id: true,
          amount: true,
          type: true,
          category: true,
          description: true,
          transaction_date: true,
          receipt_url: true,
          created_at: true,
        }
      }),
      prisma.attendance_sessions.findMany({
        where: {
          OR: [
            { organization_id: org.id },
            { shared_with_orgs: { has: org.id } }
          ]
        },
        orderBy: { start_time: 'desc' },
        take: 50,
        include: {
          _count: {
            select: {
              attendance: {
                where: { organization_id: org.id }
              }
            }
          }
        }
      }),
      prisma.organization_members.findMany({
        where: { organization_id: org.id },
        include: {
          profile: {
            select: {
              id: true,
              full_name: true,
              email: true,
              avatar_url: true,
            }
          }
        },
        orderBy: [
          { role: 'asc' },
          { joined_at: 'asc' }
        ]
      }),
      prisma.attendance.findMany({
        where: { organization_id: org.id },
        select: {
          profile_id: true,
          status: true,
        }
      })
    ])

    const totalIncome = Number(incomeAgg._sum.amount || 0)
    const totalExpense = Number(expenseAgg._sum.amount || 0)
    const balance = totalIncome - totalExpense
    const totalSessions = sessions.length

    // Member attendance performance map
    const studentStatsMap = new Map<string, { present: number; sick: number; permit: number }>()
    allAttendance.forEach(a => {
      if (!studentStatsMap.has(a.profile_id)) {
        studentStatsMap.set(a.profile_id, { present: 0, sick: 0, permit: 0 })
      }
      const st = studentStatsMap.get(a.profile_id)!
      const rawStatus = (a.status as string)?.toLowerCase()
      if (rawStatus === 'present' || rawStatus === 'late') st.present++
      else if (rawStatus === 'sick') st.sick++
      else if (rawStatus === 'excused' || rawStatus === 'permit') st.permit++
    })

    const studentRecap = members
      .filter(m => m.role !== 'auditor') // Siswa saja, pembina/auditor tidak direkap sebagai siswa
      .map(m => {
        const stats = studentStatsMap.get(m.profile_id) || { present: 0, sick: 0, permit: 0 }
        const memberJoinTime = new Date(m.joined_at).getTime()

        // Sesi yang relevan untuk siswa ini (hanya yang diadakan SETELAH atau PADA SAAT siswa bergabung)
        const eligibleSessions = sessions.filter(s => {
          const sTime = new Date(s.start_time || s.created_at).getTime()
          return sTime >= memberJoinTime
        })
        const totalEligibleSessions = eligibleSessions.length

        // Siswa baru yang belum mengalami sesi sejak bergabung tidak boleh dianggap alpa
        const alpha = totalEligibleSessions > 0
          ? Math.max(0, totalEligibleSessions - (stats.present + stats.sick + stats.permit))
          : 0
        const rate = totalEligibleSessions > 0
          ? Math.min(100, Math.round((stats.present / totalEligibleSessions) * 100))
          : 100

        return {
          id: m.id,
          profile_id: m.profile_id,
          name: m.profile.full_name || m.profile.email,
          email: m.profile.email,
          avatar_url: m.profile.avatar_url,
          role: m.role,
          joined_at: m.joined_at,
          custom_data: m.custom_data,
          present_count: stats.present,
          sick_count: stats.sick,
          permit_count: stats.permit,
          alpha_count: alpha,
          total_sessions: totalEligibleSessions,
          attendance_rate: rate,
        }
      })
      .sort((a, b) => (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' }))

    // Categories breakdown
    const categoryTotals: Record<string, { income: number; expense: number }> = {}
    transactions.forEach(tx => {
      const cat = tx.category || 'Lainnya'
      if (!categoryTotals[cat]) categoryTotals[cat] = { income: 0, expense: 0 }
      if (tx.type === 'income') categoryTotals[cat].income += Number(tx.amount)
      else categoryTotals[cat].expense += Number(tx.amount)
    })

    return res.status(200).json({
      org: {
        id: org.id,
        name: org.name,
        slug: org.slug,
        logo_url: org.logo_url,
        description: org.description,
        created_at: org.created_at,
        leader: leaderMember ? {
          name: leaderMember.profile.full_name || leaderMember.profile.email,
          email: leaderMember.profile.email,
          avatar_url: leaderMember.profile.avatar_url,
          role: leaderMember.role
        } : null,
        advisor: advisorMember ? {
          name: advisorMember.profile.full_name || advisorMember.profile.email,
          email: advisorMember.profile.email,
          avatar_url: advisorMember.profile.avatar_url,
          role: advisorMember.role
        } : null,
      },
      summary: {
        total_members: members.length,
        total_income: totalIncome,
        total_expense: totalExpense,
        balance,
        total_sessions: totalSessions,
        avg_attendance: studentRecap.length > 0 
          ? Math.round(studentRecap.reduce((acc, s) => acc + s.attendance_rate, 0) / studentRecap.length)
          : 0
      },
      transactions,
      category_breakdown: categoryTotals,
      sessions: sessions.map(s => {
        const sessionTime = new Date(s.start_time || s.created_at).getTime()
        const membersAtThatTime = members.filter(m => 
          m.role !== 'auditor' && new Date(m.joined_at).getTime() <= sessionTime
        ).length
        const totalEligible = Math.max(s._count.attendance, membersAtThatTime)
        const rate = totalEligible > 0 ? Math.min(100, Math.round((s._count.attendance / totalEligible) * 100)) : 0

        return {
          id: s.id,
          title: s.title,
          session_type: s.session_type,
          start_time: s.start_time,
          end_time: s.end_time,
          is_active: s.is_active,
          attendee_count: s._count.attendance,
          attendance_rate: rate
        }
      }),
      student_recap: studentRecap
    })
  } catch (err) {
    console.error('Error getting school linked org full report:', err)
    return res.status(500).json({ error: 'Gagal memuat laporan lengkap ekskul.' })
  }
}

// 6. Delete Sesi Agenda Ekskul oleh Eksekutif Sekolah (Kepsek/Wakasek/Kesiswaan)
export async function deleteSchoolLinkedOrgSession(req: Request, res: Response) {
  const orgMemberContext = (req as any).orgMember
  if (!orgMemberContext) {
    return res.status(403).json({ error: 'Akses ditolak.' })
  }

  // Hak akses eksekutif: head, vice_head, atau sekretaris
  if (orgMemberContext.role !== 'head' && orgMemberContext.role !== 'vice_head' && orgMemberContext.role !== 'sekretaris') {
    return res.status(403).json({ error: 'Hanya Kepala Sekolah, Wakil Kepala Sekolah, atau Kesiswaan yang dapat menghapus sesi agenda ekskul.' })
  }

  const schoolId = orgMemberContext.organizationId
  const { targetOrgId, sessionId } = req.params

  try {
    const targetOrg = await prisma.organizations.findFirst({
      where: {
        OR: [{ id: targetOrgId.length === 36 ? targetOrgId : undefined }, { slug: targetOrgId }]
      }
    })

    if (!targetOrg) {
      return res.status(404).json({ error: 'Ekskul tidak ditemukan.' })
    }

    // Pastikan ekskul ditautkan dengan sekolah ini
    const link = await prisma.school_linked_orgs.findUnique({
      where: {
        school_org_id_linked_org_id: {
          school_org_id: schoolId,
          linked_org_id: targetOrg.id
        }
      }
    })

    if (!link) {
      return res.status(403).json({ error: 'Ekskul ini tidak ditautkan dengan sekolah Anda.' })
    }

    const session = await prisma.attendance_sessions.findFirst({
      where: {
        id: sessionId.length === 36 ? sessionId : undefined,
        OR: [
          { organization_id: targetOrg.id },
          { shared_with_orgs: { has: targetOrg.id } }
        ]
      }
    })

    if (!session) {
      return res.status(404).json({ error: 'Sesi agenda presensi tidak ditemukan pada ekskul ini.' })
    }

    if (session.organization_id !== targetOrg.id) {
      // Sesi dibuat oleh ekskul lain dan dibagikan (kolaborasi) ke ekskul ini.
      // Lepaskan kolaborasi dan hapus rekam jejak presensi ekskul ini dari sesi tersebut.
      await prisma.$transaction(async (tx) => {
        await tx.attendance.deleteMany({
          where: { session_id: session.id, organization_id: targetOrg.id }
        })
        const updatedShared = session.shared_with_orgs.filter(id => id !== targetOrg.id)
        await tx.attendance_sessions.update({
          where: { id: session.id },
          data: { shared_with_orgs: updatedShared }
        })
      })

      return res.status(200).json({
        success: true,
        message: `Sesi kolaborasi "${session.title}" berhasil dilepas dari ${targetOrg.name}. Data presensi ekskul ini telah dibersihkan.`
      })
    }

    await prisma.$transaction(async (tx) => {
      await tx.guest_leaves.deleteMany({ where: { session_id: session.id } })
      await tx.guest_attendance.deleteMany({ where: { session_id: session.id } })
      await tx.meeting_minutes.deleteMany({ where: { session_id: session.id } })
      await tx.attendance.deleteMany({ where: { session_id: session.id } })
      await tx.attendance_sessions.delete({ where: { id: session.id } })
    })

    return res.status(200).json({
      success: true,
      message: `Sesi "${session.title}" berhasil dihapus dari ${targetOrg.name}. Data alpa siswa telah dihitung ulang.`
    })
  } catch (err) {
    console.error('Error deleting school linked org session:', err)
    return res.status(500).json({ error: 'Gagal menghapus sesi agenda ekskul.' })
  }
}
