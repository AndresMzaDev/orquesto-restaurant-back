import type { FastifyInstance } from 'fastify'
import { requireBranch, requirePermission, requireRestaurant } from '../../common/guards.js'
import { getPaginationParams } from '../../common/pagination.js'
import { addOrderItemSchema, createOrderSchema, updateOrderItemStatusSchema } from './orders.schema.js'
import { ordersService } from './orders.service.js'

export default async function orderRoutes(app: FastifyInstance) {
  app.get('/orders', async (request) => {
    requirePermission(request, 'orders:view_all')
    const query = request.query as Record<string, unknown>
    return ordersService.getAll(requireBranch(request), getPaginationParams(query), query)
  })

  app.post('/orders', async (request) => {
    requirePermission(request, 'orders:create')
    const body = createOrderSchema.parse(request.body)
    return ordersService.create(requireRestaurant(request), requireBranch(request), request.authUser.employee_id ?? request.authUser.id, body)
  })

  app.get('/orders/:id', async (request) => {
    const { id } = request.params as { id: string }
    return ordersService.getById(id, requireBranch(request))
  })

  app.post('/orders/:id/items', async (request) => {
    requirePermission(request, 'orders:create')
    const { id } = request.params as { id: string }
    const body = addOrderItemSchema.parse(request.body)
    return ordersService.addItem(id, requireRestaurant(request), body)
  })

  app.patch('/orders/:id/items/:itemId/status', async (request) => {
    requirePermission(request, 'kitchen:update')
    const { id, itemId } = request.params as { id: string; itemId: string }
    const body = updateOrderItemStatusSchema.parse(request.body)
    return ordersService.updateItemStatus(id, itemId, body.status, requireBranch(request))
  })

  app.post('/orders/:id/close', async (request) => {
    requirePermission(request, 'invoices:create')
    const { id } = request.params as { id: string }
    return ordersService.close(id, requireBranch(request))
  })

  app.patch('/orders/:id/cancel', async (request) => {
    requirePermission(request, 'orders:cancel')
    const { id } = request.params as { id: string }
    return ordersService.cancel(id, requireBranch(request))
  })
}
