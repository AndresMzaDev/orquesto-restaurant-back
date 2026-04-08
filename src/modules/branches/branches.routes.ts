import type { FastifyInstance } from 'fastify'
import { requireMaster, requireRestaurant } from '../../common/guards.js'
import { branchesService } from './branches.service.js'
import { createBranchSchema, updateBranchSchema } from './branches.schema.js'

export default async function branchRoutes(app: FastifyInstance) {
  app.get('/branches', async (request) => {
    return branchesService.getAll(requireRestaurant(request))
  })

  app.post('/branches', async (request) => {
    requireMaster(request)
    const body = createBranchSchema.parse(request.body)
    return branchesService.create(body.restaurant_id ?? requireRestaurant(request), body)
  })

  app.get('/branches/:id', async (request) => {
    const { id } = request.params as { id: string }
    return branchesService.getById(id, requireRestaurant(request))
  })

  app.patch('/branches/:id', async (request) => {
    requireMaster(request)
    const { id } = request.params as { id: string }
    const body = updateBranchSchema.parse(request.body)
    return branchesService.update(id, requireRestaurant(request), body)
  })
}
