import type { FastifyInstance } from 'fastify'
import { getPaginationParams } from '../../common/pagination.js'
import { requirePermission } from '../../common/guards.js'
import { auditService } from './audit.service.js'

export default async function auditRoutes(app: FastifyInstance) {
  app.get('/audit-logs', async (request) => {
    requirePermission(request, 'audit:view')
    return auditService.getAll(request.authUser.branch_id, getPaginationParams(request.query as Record<string, unknown>))
  })
}
