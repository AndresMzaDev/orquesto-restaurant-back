import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { requireBranch, requirePermission } from '../../common/guards.js'
import { kitchenService } from './kitchen.service.js'

const stationSchema = z.object({
  name: z.string().min(1),
  code: z.string().optional(),
  color: z.string().optional(),
  is_active: z.boolean().default(true),
})

export default async function kitchenRoutes(app: FastifyInstance) {
  app.get('/kitchen/stations', async (request) => {
    requirePermission(request, 'settings:kitchen_stations')
    return kitchenService.getStations(requireBranch(request))
  })

  app.post('/kitchen/stations', async (request) => {
    requirePermission(request, 'settings:kitchen_stations')
    return kitchenService.createStation(requireBranch(request), stationSchema.parse(request.body))
  })

  app.patch('/kitchen/stations/:id', async (request) => {
    requirePermission(request, 'settings:kitchen_stations')
    const { id } = request.params as { id: string }
    return kitchenService.updateStation(id, requireBranch(request), stationSchema.partial().parse(request.body))
  })

  app.delete('/kitchen/stations/:id', async (request) => {
    requirePermission(request, 'settings:kitchen_stations')
    const { id } = request.params as { id: string }
    return kitchenService.deleteStation(id, requireBranch(request))
  })
}
