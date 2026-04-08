import type { FastifyInstance } from 'fastify'
import { requirePermission, requireRestaurant } from '../../common/guards.js'
import { rolesService } from './roles.service.js'
import { createRoleSchema, updateRoleSchema } from './roles.schema.js'

export default async function roleRoutes(app: FastifyInstance) {
  app.get('/roles', async (request) => {
    return rolesService.getAll(requireRestaurant(request))
  })

  app.post('/roles', async (request) => {
    requirePermission(request, 'roles:manage')
    const body = createRoleSchema.parse(request.body)
    return rolesService.create(requireRestaurant(request), body)
  })

  app.get('/roles/:id', async (request) => {
    const { id } = request.params as { id: string }
    return rolesService.getById(id, requireRestaurant(request))
  })

  app.patch('/roles/:id', async (request) => {
    requirePermission(request, 'roles:manage')
    const { id } = request.params as { id: string }
    const body = updateRoleSchema.parse(request.body)
    return rolesService.update(id, requireRestaurant(request), body)
  })

  app.delete('/roles/:id', async (request) => {
    requirePermission(request, 'roles:manage')
    const { id } = request.params as { id: string }
    return rolesService.delete(id, requireRestaurant(request))
  })

  app.get('/permissions', async () => rolesService.getAllPermissions())
}
