import type { FastifyInstance } from 'fastify'
import { requireBranch, requireMaster, requirePermission, requireRestaurant } from '../../common/guards.js'
import { reportsService } from './reports.service.js'

export default async function reportRoutes(app: FastifyInstance) {
  app.get('/reports/sales', async (request) => {
    requirePermission(request, 'reports:sales')
    return reportsService.sales(requireBranch(request), request.query as Record<string, unknown>)
  })

  app.get('/reports/inventory', async (request) => {
    requirePermission(request, 'reports:inventory')
    return reportsService.inventory(requireBranch(request))
  })

  app.get('/reports/expenses', async (request) => {
    requirePermission(request, 'reports:expenses')
    return reportsService.expenses(requireBranch(request), request.query as Record<string, unknown>)
  })

  app.get('/reports/pnl', async (request) => {
    if (!request.authUser.is_master) {
      requirePermission(request, 'reports:pnl')
    } else {
      requireMaster(request)
    }

    return reportsService.pnl(requireRestaurant(request))
  })
}
