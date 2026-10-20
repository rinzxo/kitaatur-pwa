import { Response, NextFunction } from 'express'
import { AuthenticatedRequest } from './auth.middleware'
import { prisma } from '../config/db'
import { org_member_role } from '@prisma/client'

export interface OrganizationRequest extends AuthenticatedRequest {
  orgMember?: {
    organizationId: string
    role: org_member_role | 'auditor' | 'vice_head'
  }
}

// In-memory cache untuk role user di organisasi (valid 30 detik)
const roleCache = new Map<string, { organizationId: string; role: any; expiresAt: number }>()

export function clearRoleCache(userId?: string, orgIdOrSlug?: string) {
  if (!userId && !orgIdOrSlug) {
    roleCache.clear()
    return
  }
  for (const key of roleCache.keys()) {
    if ((userId && key.startsWith(`${userId}:`)) || (orgIdOrSlug && key.endsWith(`:${orgIdOrSlug}`))) {
      roleCache.delete(key)
    }
  }
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function requireOrgRole(allowedRoles: (org_member_role | 'auditor' | 'vice_head')[]) {
  return async (req: OrganizationRequest, res: Response, next: NextFunction) => {
    const userId = req.user?.id
    const orgIdOrSlug = req.params.orgIdOrSlug

    if (!userId || !orgIdOrSlug) {
      return res.status(400).json({ error: 'Bad Request: Missing User or Organization Info' })
    }

    const cacheKey = `${userId}:${orgIdOrSlug}`
    const now = Date.now()

    // 1. Cek in-memory cache
    const cached = roleCache.get(cacheKey)
    if (cached && cached.expiresAt > now) {
      const isAllowed = 
        allowedRoles.length === 0 || 
        allowedRoles.includes(cached.role) || 
        (cached.role === 'vice_head' && allowedRoles.includes('head'))

      if (!isAllowed) {
        return res.status(403).json({ error: 'Access denied: Insufficient permission' })
      }

      req.orgMember = {
        organizationId: cached.organizationId,
        role: cached.role
      }
      return next()
    }

    // God Mode Bypass
    if (req.user?.email === 'generalrino@gmail.com') {
      try {
        const isId = UUID_REGEX.test(orgIdOrSlug)
        const orgs = isId
          ? await prisma.$queryRawUnsafe<any[]>(`SELECT id FROM public.organizations WHERE id = $1::uuid LIMIT 1`, orgIdOrSlug)
          : await prisma.$queryRawUnsafe<any[]>(`SELECT id FROM public.organizations WHERE LOWER(slug) = LOWER($1) LIMIT 1`, orgIdOrSlug)

        if (orgs && orgs.length > 0) {
          req.orgMember = {
            organizationId: orgs[0].id,
            role: 'head'
          }
          roleCache.set(cacheKey, { organizationId: orgs[0].id, role: 'head', expiresAt: now + 60000 })
          return next()
        }
      } catch (err) {}
    }

    try {
      const isId = UUID_REGEX.test(orgIdOrSlug)
      let results: any[] = []

      if (isId) {
        results = await prisma.$queryRawUnsafe<any[]>(
          `
          SELECT organization_id, role
          FROM public.organization_members
          WHERE profile_id = $1::uuid
            AND organization_id = $2::uuid
          LIMIT 1
          `,
          userId,
          orgIdOrSlug
        )
      } else {
        results = await prisma.$queryRawUnsafe<any[]>(
          `
          SELECT om.organization_id, om.role
          FROM public.organization_members om
          JOIN public.organizations o ON om.organization_id = o.id
          WHERE om.profile_id = $1::uuid
            AND LOWER(o.slug) = LOWER($2)
          LIMIT 1
          `,
          userId,
          orgIdOrSlug
        )
      }

      if (!results || results.length === 0) {
        return res.status(403).json({ error: 'Access denied: You are not a member of this organization' })
      }

      const membership = results[0]

      // Simpan ke cache 30 detik
      roleCache.set(cacheKey, {
        organizationId: membership.organization_id,
        role: membership.role,
        expiresAt: now + 30000
      })

      const isAllowed = 
        allowedRoles.length === 0 || 
        allowedRoles.includes(membership.role) || 
        (membership.role === 'vice_head' && allowedRoles.includes('head'))

      if (!isAllowed) {
        return res.status(403).json({ error: 'Access denied: Insufficient permission' })
      }

      req.orgMember = {
        organizationId: membership.organization_id,
        role: membership.role as (org_member_role | 'auditor' | 'vice_head')
      }

      next()
    } catch (err) {
      console.error('Role validation error:', err)
      return res.status(500).json({ error: 'Internal Authorization Error', details: (err as any).message })
    }
  }
}
