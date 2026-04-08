import type { FastifyInstance } from 'fastify'
import { requireBranch, requirePermission } from '../../common/guards.js'
import { reservationSchema } from './reservations.schema.js'
import { reservationsService } from './reservations.service.js'

export default async function reservationRoutes(app: FastifyInstance) {
  app.get('/reservations', async (request) => {
    requirePermission(request, 'reservations:view')
    return reservationsService.getAll(requireBranch(request))
  })

  app.post('/reservations', async (request) => {
    requirePermission(request, 'reservations:manage')
    return reservationsService.create(requireBranch(request), reservationSchema.parse(request.body))
  })

  app.patch('/reservations/:id', async (request) => {
    requirePermission(request, 'reservations:manage')
    const { id } = request.params as { id: string }
    return reservationsService.update(id, requireBranch(request), reservationSchema.partial().parse(request.body))
  })
}
