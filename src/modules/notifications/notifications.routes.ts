import type { FastifyInstance } from 'fastify'
import { ForbiddenError } from '../../common/errors.js'
import { notificationsService } from './notifications.service.js'

export default async function notificationRoutes(app: FastifyInstance) {
  app.get('/notifications', async (request) => {
    const { branch_id, restaurant_id, is_master } = request.authUser
    if (is_master) {
      if (!restaurant_id) throw new ForbiddenError('No tiene restaurante asignado')
      return notificationsService.getAllByRestaurant(restaurant_id, request.authUser.id)
    }
    if (!branch_id) throw new ForbiddenError('No tiene sucursal asignada')
    return notificationsService.getAll(branch_id, request.authUser.id)
  })

  app.patch('/notifications/:id/read', async (request) => {
    const { id } = request.params as { id: string }
    const { branch_id, restaurant_id, is_master } = request.authUser
    if (is_master) {
      if (!restaurant_id) throw new ForbiddenError('No tiene restaurante asignado')
      return notificationsService.markReadByRestaurant(id, restaurant_id)
    }
    if (!branch_id) throw new ForbiddenError('No tiene sucursal asignada')
    return notificationsService.markRead(id, branch_id)
  })
}
